let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!"
    },
    methods: {
        run_bci2000_p300: function () {
            require('../test_batch');
        }
    }
});
