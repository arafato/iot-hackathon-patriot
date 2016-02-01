import ko from 'knockout';
import homeTemplate from 'text!./home.html';

class HomeViewModel {
    constructor(route) {
        this.message = ko.observable('Welcome to iot-hackathon!');
        this.product_name = ko.observable('Invincible Red Wine');
        this.product_description = ko.observable('A crisp and clean wine that will be found very pleasnt and done well with some kind of thing that makes you very happy and will give you great strenght and make you invincible even to a bullet to the face!');
        this.product_image_url = ko.observable('http://4vector.com/thumb_data/v4l-128794.jpg');
    }

    doSomething() {
        this.message('Look, it changed!');
        this.product_image_url('https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcRYP1k0bHJwXyVpXn5d1PzHWHtcfjAOUt5hGWxFW91W9d18IXgJ');
        this.product_name('Happy Whine');
        this.product_description('If you whine a lot then you will love Happy Whine.  It pairs well with peanuts and orange juice')
    }
}

export default { viewModel: HomeViewModel, template: homeTemplate };
