const {run_cmd_file} = require('../js/windows_cmd');

let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!"
    },
    methods: {
        run_cmd_script: function(file_name) {
            run_cmd_file(file_name + ".cmd");
        }
    }
});
