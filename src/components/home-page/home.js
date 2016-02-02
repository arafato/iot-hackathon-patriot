/* global AWS */
import ko from 'knockout';
import homeTemplate from 'text!./home.html';

var URL_BASE = "https://iipm8dip2k.execute-api.eu-west-1.amazonaws.com/latest/getAnnataProduct?product_sku="

class HomeViewModel {
    constructor(route) {
        this.message = ko.observable('Welcome to iot-hackathon!');
        this.product_name = ko.observable('Invincible Red Wine');
        this.product_description = ko.observable('A crisp and clean wine that will be found very pleasnt and done well with some kind of thing that makes you very happy and will give you great strenght and make you invincible even to a bullet to the face!');
        this.product_image_url = ko.observable('http://4vector.com/thumb_data/v4l-128794.jpg');

        AWS.config.region = 'eu-west-1';
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'eu-west-1:a0c69b71-85c9-4ed5-8248-fcf7c31ca848'
        });
        var iotgatewayhost = 'A3H63FG5MI6R80.iot.eu-west-1.amazonaws.com';

        AWS.config.credentials.get(() => {

            var requestUrl = this.prepareWebsocketUrl({ host: iotgatewayhost, region: AWS.config.region, debug: false }, AWS.config.credentials.accessKeyId, AWS.config.credentials.secretAccessKey, AWS.config.credentials.sessionToken);

            var client = new Paho.MQTT.Client(requestUrl, 'winerack');

            client.onMessageArrived = function (message) {
                console.log("msg inbound: topic: " + message.destinationName + ' payload: ' + message.payloadString);
            };
            client.onMessageDelivered = function (message) {
                console.log("msg delivered to topic: " + message.destinationName + ' payload: ' + message.payloadString);
            }
            client.onConnectionLost = function (err) {
                console.log("lost connection: error code:" + err.errorCode + ' error message: ' + err.errorMessage);
            }

            client.connect({
                onSuccess: function () {
                    if (AWS && AWS.config && AWS.config.credentials && AWS.config.credentials.identityId) {
                        console.log('connected with ' + AWS.config.credentials.identityId + ' to ' + iotgatewayhost);
                    } else {
                        console.log('connected to ' + iotgatewayhost);
                    }
                    this.sub('$aws/things/winerack/shadow/update');
                },
                useSSL: true,
                timeout: 3,
                mqttVersion: 4,
                onFailure: function () {
                    console.log('failed to connect');
                }
            });

        });

    }

    getProduct() {
        var id = Math.floor((Math.random() * 5) + 1);
        console.log('id=' + id)
        var url = URL_BASE + id;
        var that = this;
        $.get(url, function (data) {
            that.product_name(data.Item.product_name);
            that.product_image_url(data.Item.product_image_url);
            that.product_description(data.Item.product_description);
        });
    }


    doSomething() {
        this.message('Look, it changed!');
        this.product_image_url('https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRYP1k0bHJwXyVpXn5d1PzHWHtcfjAOUt5hGWxFW91W9d18IXgJ');
        this.product_name('Happy Whine');
        this.product_description('If you whine a lot then you will love Happy Whine.  It pairs well with peanuts and orange juice')
    }

    // PRIVATE ///////////////////
    prepareWebsocketUrl(options, awsAccessId, awsSecretKey, sessionToken) {
        var now = this.getDateTimeString();
        var today = this.getDateString(now);
        var path = '/mqtt';
        //var awsServiceName = 'iotdata';
        var awsServiceName = 'iotdevicegateway';

        var queryParams = 'X-Amz-Algorithm=AWS4-HMAC-SHA256' +
            '&X-Amz-Credential=' + awsAccessId + '%2F' + today + '%2F' + options.region + '%2F' + awsServiceName + '%2Faws4_request' +
            '&X-Amz-Date=' + now + '&X-Amz-SignedHeaders=host';

        var signedUrl = this.signUrl('GET', 'wss://', options.host, path, queryParams,
            awsAccessId, awsSecretKey, options.region, awsServiceName, '', today, now, options.debug);
        if (sessionToken) {
            return signedUrl + '&X-Amz-Security-Token=' + encodeURIComponent(sessionToken);
        } else {
            return signedUrl;
        }
    }

    getDateTimeString() {
        var d = new Date();

        //
        // The additional ''s are used to force JavaScript to interpret the
        // '+' operator as string concatenation rather than arithmetic.
        //
        return d.getUTCFullYear() + '' +
            this.makeTwoDigits(d.getUTCMonth() + 1) + '' +
            this.makeTwoDigits(d.getUTCDate()) + 'T' + '' +
            this.makeTwoDigits(d.getUTCHours()) + '' +
            this.makeTwoDigits(d.getUTCMinutes()) + '' +
            this.makeTwoDigits(d.getUTCSeconds()) + 'Z';
    }

    getDateString(dateTimeString) {
        return dateTimeString.substring(0, dateTimeString.indexOf('T'));
    }

    makeTwoDigits(n) {
        if (n > 9) {
            return n;
        }
        else {
            return '0' + n;
        }
    }

    getSignatureKey(key, dateStamp, regionName, serviceName) {
        /*
         var kDate = CryptoJS.HmacSHA256(dateStamp, 'AWS4' + key, { asBytes: true});
         var kRegion = CryptoJS.HmacSHA256(regionName, kDate, { asBytes: true });
         var kService = CryptoJS.HmacSHA256(serviceName, kRegion, { asBytes: true });
         var kSigning = CryptoJS.HmacSHA256('aws4_request', kService, { asBytes: true });
        */
        var kDate = AWS.util.crypto.hmac('AWS4' + key, dateStamp, 'buffer');
        var kRegion = AWS.util.crypto.hmac(kDate, regionName, 'buffer');
        var kService = AWS.util.crypto.hmac(kRegion, serviceName, 'buffer');
        var kSigning = AWS.util.crypto.hmac(kService, 'aws4_request', 'buffer');
        return kSigning;
    }

    signUrl(method, scheme, hostname, path, queryParams, accessId, secretKey,
        region, serviceName, payload, today, now, debug) {

        var signedHeaders = 'host';

        var canonicalHeaders = 'host:' + hostname + '\n';

        var canonicalRequest = method + '\n' + // method
            path + '\n' + // path
            queryParams + '\n' + // query params
            canonicalHeaders +// headers
            '\n' + // no idea why this needs to be here, but it fails without
            signedHeaders + '\n' + // signed header list
            //CryptoJS.SHA256(payload, { asBytes: true });
            AWS.util.crypto.sha256(payload, 'hex');

        if (debug === true) {
            console.log('canonical request: ' + canonicalRequest + '\n');
        }

        //var hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest, { asBytes: true });
        var hashedCanonicalRequest = AWS.util.crypto.sha256(canonicalRequest, 'hex');

        if (debug === true) {
            console.log('hashed canonical request: ' + hashedCanonicalRequest + '\n');
        }

        var stringToSign = 'AWS4-HMAC-SHA256\n' +
            now + '\n' +
            today + '/' + region + '/' + serviceName + '/aws4_request\n' +
            hashedCanonicalRequest;

        if (debug === true) {
            console.log('string to sign: ' + stringToSign + '\n');
        }

        var signingKey = this.getSignatureKey(secretKey, today, region, serviceName);

        if (debug === true) {
            console.log('signing key: ' + signingKey + '\n');
        }

        //var signature = CryptoJS.HmacSHA256(stringToSign, signingKey, { asBytes: true });
        var signature = AWS.util.crypto.hmac(signingKey, stringToSign, 'hex');

        if (debug === true) {
            console.log('signature: ' + signature + '\n');
        }

        var finalParams = queryParams + '&X-Amz-Signature=' + signature;

        var url = scheme + hostname + path + '?' + finalParams;

        if (debug === true) {
            console.log('url: ' + url + '\n');
        }

        return url;
    }
}

export default { viewModel: HomeViewModel, template: homeTemplate };
