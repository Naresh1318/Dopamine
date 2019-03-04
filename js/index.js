const {run_bat_file} = require('../js/windows_cmd');

let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!"
    },
    methods: {
        run_bci2000_p300: function () {
            run_bat_file("test_run.bat");
        }
    }
});
