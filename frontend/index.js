let app = new Vue({
    el: '#app',
    data: {
        message: 'Hello Vue!'
    },
    methods: {
        say_something: function () {
            this.message = "Okay, it's working!!"
        }
    }
});




