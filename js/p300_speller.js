const {run_cmd_file} = require("../js/windows_cmd");
const {get_recent_file} = require("../js/utils");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const {spawn} = require('child_process');

let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!",
        active_card: {
            signal_monitoring_active: false,
            p300_acquisition_active: false,
            p300_training_active: false,
            p300_online_active: false,
        },
        console_output: "",
        n_acq_trials: 10,
        n_acq_repetitions: 12,
        scenario_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN"),
        signals_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN\\signals"),
    },
    methods: {
        run_cmd_script: function(file_name) {
            run_cmd_file(file_name + ".cmd");
        },
        show_card: function(div_element) {
            for (k in this.active_card) {
                this.active_card[k] = false;
            }
            this.active_card[div_element] = !this.active_card[div_element];
        },  
        get_recent_ov_file: function() {
            return get_recent_file(this.signals_path);
        },
        run_p300_calibration: function() {
            // Modify configuration file
            var cfg_path = path.join(this.scenario_path, "p300-xdawn-1-acquisition.xml");
            var rl = readline.createInterface({
                input: fs.createReadStream(cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            var trials_flag = false;
            rl.on("line", (line) => {
                if (line.search("trials") != -1 || line.search("repetitions") != -1) {
                    offset = 1;
                    if (line.search("trials") != -1) {
                        trials_flag = true;
                    }
                } else if (offset === 1) {
                    offset += 1;
                } else if (offset === 2) {
                    offset = 0;
                    if (trials_flag) {
                        line = `					<Value>${this.n_acq_trials}</Value>`;
                    } 
                    else {
                        line = `					<Value>${this.n_acq_repetitions}</Value>`;
                    }
                }
                new_cfg_file = new_cfg_file.concat(line + "\n");
            })
            .on("close", function() {
                rl.close();
                fs.writeFile(cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Acquisition Configuration Replaced!");
                app.run_cmd_script("start_p300_acquisition");                
            });
        },
        run_p300_training: function() {
            // Modify Configuration file
            var cfg_path = path.join(this.scenario_path, "p300-xdawn-2-train-xDAWN.xml");
            var rl = readline.createInterface({
                input: fs.createReadStream(cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            rl.on("line", (line) => {
                if (line.search("Filename") != -1) {
                    offset = 1;
                } else if (offset === 1) {
                    offset += 1;
                } else if (offset === 2) {
                    offset = 0;
                    line = `					<Value>\${Player_ScenarioDirectory}/signals/${this.get_recent_ov_file()}</Value>`;
                }
                new_cfg_file = new_cfg_file.concat(line + "\n");
            })
            .on("close", function() {
                rl.close();
                fs.writeFile(cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Training Configuration Replaced!");
                var file_name = "start_p300_training.cmd";

                const bat = spawn('cmd.exe', ['/c', path.join(__dirname, "../batch_scripts", file_name)]);

                // Handle normal output
                bat.stdout.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.info(str);
                    app.console_output = app.console_output + "\n" + str;
                });

                    // Handle error output
                bat.stderr.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.error(str);
                });
                console.log("INFO: P300 Training Started");
            });
        },
    }
});
