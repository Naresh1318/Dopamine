const {run_cmd_file} = require("../js/windows_cmd");
const {get_recent_file} = require("../js/utils");
const fs = require("fs");
const os = require("os");
const path = require("path");
const readline = require("readline");
const find = require('find-process');
const {spawn} = require('child_process');
const net = require('net');


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
        acquisition_server_status: "Connected",
        console_output: "",
        n_acq_trials: 10,
        n_acq_repetitions: 12,
        reference_scenario_path: ".\\openvibe_scenarios\\p300_speller",
        scenario_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN"),
        signals_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN\\signals"),
    },
    methods: {
        run_cmd_script: function(file_name) {
            if (this.acquisition_server_status != "Connected") {
                alert("Headset not connected..");
            }
            else if (this.acquisition_server_status == "Connected") {
                run_cmd_file(file_name + ".cmd");
            }
        },
        start_acquisition_server: function() {
            find("name", "openvibe-acquisition-server.exe", true)
            .then(function (list) {
              console.log("INFO: There is/are %s openvibe process(es)", list.length);
              if (list.length < 1) {
                  run_cmd_file("start_acquisition_server.cmd");
              } else {
                  alert("Acquisition server already running");
                  console.log("INFO: Acquisition server already running");
              }
            });
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
            var new_cfg_path = path.join(this.scenario_path, "p300-xdawn-1-acquisition.xml");
            var reference_cfg_path = path.join(this.reference_scenario_path, "p300-xdawn-1-acquisition.xml");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
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
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Acquisition Configuration Replaced!");
                app.run_cmd_script("start_p300_acquisition");                
            });
        },
        run_p300_training: function() {
            // Modify Configuration file
            var new_cfg_path = path.join(this.scenario_path, "p300-xdawn-2-train-xDAWN.xml");
            var reference_cfg_path = path.join(this.reference_scenario_path, "p300-xdawn-2-train-xDAWN.xml");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
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
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Training Configuration Replaced!");
                var file_name = "start_p300_training.cmd";

                app.console_output  = "";
                const bat = spawn('cmd.exe', ['/c', path.join(__dirname, "../batch_scripts", file_name)]);

                app.console_output = app.console_output + "\n" + "Training xDAWN Spatial Filter...";

                // Handle normal output
                bat.stdout.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.info(str);
                    if (str.search("xDAWN Spatial filter trained successfully") != -1) {
                        app.console_output = app.console_output + "\n" + "xDAWN Spatial filter trained successfully!";
                    }
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
        run_p300_lda_training: function() {
            // Modify Configuration file
            var new_cfg_path = path.join(this.scenario_path, "p300-xdawn-3-train-classifier.xml");
            var reference_cfg_path = path.join(this.reference_scenario_path, "p300-xdawn-3-train-classifier.xml");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            rl.on("line", (line) => {
                if (line.search("Filename</Name>") != -1) {
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
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Training Configuration Replaced!");
                var file_name = "start_p300_lda_training.cmd";

                app.console_output  = "";
                const bat = spawn('cmd.exe', ['/c', path.join(__dirname, "../batch_scripts", file_name)]);

                app.console_output = app.console_output + "\n" + "Training LDA Classifier...";

                // Handle normal output
                bat.stdout.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.info(str);
                    if (str.search("accuracy") != -1 || str.search("Target") != -1) {
                        app.console_output = app.console_output + "\n" + str;
                    }
                });
                    // Handle error output
                bat.stderr.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.error(str);
                });
                console.log("INFO: P300 LDA Training Started");
            });
        },
        watch_acquisition_server: function ()
        {
            let refresh_rate = 1;  // 5 Seconds
            let client = net.connect({port: 1024});
            let data_received = false;

            client.on("data", (data)=>{
                if (data) {
                    // console.log("Data Receiving!!");
                    this.acquisition_server_status = "Connected";
                    client.destroy();
                    data_received = true;
                }
            });
            
            client.on("close", ()=> {
                if (!data_received) {
                    this.acquisition_server_status = "Press Connect and then Press Play";
                }
                // console.log("Connection Lost :(");
            });

            client.on("error", ()=> {
                this.acquisition_server_status = "Press Connect and then Press Play";
                // console.log("Connection Lost :(");
            });

            setTimeout(this.watch_acquisition_server, refresh_rate*1000);
        },
    }
});

app.watch_acquisition_server();

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
  