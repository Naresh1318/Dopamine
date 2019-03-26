const fs = require("fs");
const os = require("os");
const net = require('net');
const path = require("path");
const readline = require("readline");
const find = require('find-process');
const {spawn} = require('child_process');
const request = require('request');

const {run_cmd_file} = require("../js/windows_cmd");
const {get_recent_file} = require("../js/utils");

// Vue App
let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!",
        active_card: {  // Card flags
            signal_monitoring_active: false,
            p300_calibration_active: false,
            p300_training_active: false,
            p300_online_active: false,
        },
        acquisition_server_status: "Connected",  // Head connection status
        console_output: "",                      // Console text
        n_acq_trials: 10,                        // Calibration Trials
        n_acq_repetitions: 12,                   // Calibration Repetitions per trial
        p300_spatial_filter_training: false,     // Spatial Filter Training Flag
        p300_start_lda_training: false,          // Start LDA Training Flag
        p300_lda_training: false,                // LDA Training Flag
        p300_recent_ov_file: "",                 // Most recent detected ov file
        p300_word_constructed: "",
        p300_word_cloud_server_url: "http://naresh1318.pythonanywhere.com//word",
        group_name: "",
        reference_scenario_path: ".\\openvibe_scenarios\\p300_speller",  // Openvibe Reference Scenario path
        scenario_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN"),  // Openvibe scenario path in the user PC
        signals_path: path.join("C:\\Users", os.userInfo().username ,"AppData\\Roaming\\openvibe-2.2.0\\scenarios\\bci-examples\\p300-speller-xDAWN\\signals"),  // Openvibe P300 signal storage path
    },
    methods: {
        run_cmd_script: function(file_name) {
            /**
             * Run cmd script
             * @param file_name: str, file name of the cmd file stored in batch_scripts. Do not include .cmd extension
             */
            if (this.acquisition_server_status != "Connected") {
                alert("Headset not connected..");
            }
            else if (this.acquisition_server_status == "Connected") {
                run_cmd_file(file_name + ".cmd");
            }
        },
        start_acquisition_server: function() {
            /**
             * Start OpenVibe Acquisition Server if it's not already running
             */
            find("name", "openvibe-acquisition-server.exe", true)  // Check if it's already running
            .then(function (list) {
              console.log("INFO: There is/are %s openvibe acquisition process(es)", list.length);
                if (list.length < 1) {
                    run_cmd_file("start_acquisition_server.cmd");
                } else {
                    alert("Acquisition server already running");
                    console.log("INFO: Acquisition server already running");
                }
            });
        },
        change_button: function(div_element) {
            if (this.active_card[div_element]) {
                return "selected";
            } else {
                return "unselected";
            }
        },
        show_card: function(div_element) {
            /**
             * Show desired card if toggling its flag
             * @param div_element: str, div element flag variable
             */
            for (k in this.active_card) {
                this.active_card[k] = false;
            }
            this.active_card[div_element] = !this.active_card[div_element];
        },  
        get_recent_ov_file: function() {
            /**
             * Get the most recent .ov file
             */
            this.p300_recent_ov_file = get_recent_file(this.signals_path);
            alert("File used to train: " + this.p300_recent_ov_file);
        },
        run_p300_signal_monitoring: function() {
            /**
             * Copy the reference configuration file to the working directory and start signal monitoring
             */
            let xml_file = "p300-xdawn-0-signal-monitoring.xml"
            fs.copyFile(path.join(this.reference_scenario_path, xml_file), path.join(this.scenario_path, xml_file), (err) => {
                if (err) throw err;
                console.log(xml_file + " Copied to the working directory!");
                this.run_cmd_script("start_signal_monitoring");
            });
        },
        run_p300_calibration: function() {
            /**
             * Copy new configuration file to openvibe scenario path and start P300 calibration
             */
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
        run_p300_spatial_filter_training: function() {
            /**
             * Copy new configuration file to openvibe scenario path and start P300 Spatial filter training
             */
            // Modify Configuration file
            if (this.p300_recent_ov_file === "") {
                alert("Recent Calibration file not found..");
                return;
            }
            this.p300_spatial_filter_training = true;
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
                    line = `					<Value>\${Player_ScenarioDirectory}/signals/${this.p300_recent_ov_file}</Value>`;
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
                        app.p300_spatial_filter_training = false;
                        app.p300_start_lda_training = true;
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
            /**
             * Copy new configuration file to openvibe scenario path and start P300 Classifier training
             */
            // Do not train if we have to recent ov file
            if (this.p300_recent_ov_file === "") {
                alert("Recent Calibration file not found..");
                return;
            }
            this.p300_lda_training = true;
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
                    line = `					<Value>\${Player_ScenarioDirectory}/signals/${this.p300_recent_ov_file}</Value>`;
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
                        strs = str.split("\n"); // Remove log texts and display only the results
                        str = "";
                        for (s of strs) {
                            let output_at = s.search(">");
                            if (output_at != -1) {  
                            s = s.slice(output_at + 2);
                            str += s + "\n";
                            }
                        }
                        app.console_output = app.console_output + "\n" + str;
                        // Reset button states
                        app.p300_spatial_filter_training = false;
                        app.p300_start_lda_training = false;
                        app.p300_lda_training = false;
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
        run_p300_online: function() {
            /**
             * Copy the reference configuration file to the working directory and start P300 online task
             */
            if (this.group_name === "") {
                alert("Please provide a group name.");
                return;
            }

            app.p300_word_constructed = "";

            const speller_matrix = [["a", "b", "c", "d", "e", "f"],
                                  ["g", "h", "i", "j", "k", "l"],
                                  ["m", "n", "o", "p", "q", "r"],
                                  ["s", "t", "u", "v", "w", "x"],
                                  ["y", "z", "1", "2", "3", "4"],
                                  ["5", "6", "7", "8", "9", "0"]];

            // Copy lua script
            let lua_file = "p300-speller-accumulator.lua";
            fs.copyFile(path.join(this.reference_scenario_path, lua_file), path.join(this.scenario_path, lua_file), (err) => {
                if (err) throw err;
                console.log("INFO: " + lua_file + " Copied to the working directory!");
            });

            let xml_file = "p300-xdawn-4-online.xml"
            fs.copyFile(path.join(this.reference_scenario_path, xml_file), path.join(this.scenario_path, xml_file), (err) => {
                if (err) throw err;
                console.log("INFO: " + xml_file + " Copied to the working directory!");

                var file_name = "start_p300_online.cmd";

                app.console_output  = "";
                const bat = spawn('cmd.exe', ['/c', path.join(__dirname, "../batch_scripts", file_name)]);

                app.console_output = app.console_output + "\n" + "Online Phase...";

                // Handle normal output
                bat.stdout.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.info(str);
                    if (str.search("Voting_Result") != -1) {
                        strs = str.split("\n"); // Remove log texts and display only the results
                        str = "";
                        for (s of strs) {
                            let output_at = s.search(">");
                            if (output_at != -1) {  
                                s = s.slice(output_at + 2);
                                let matches = s.match(/\[(.*?)\]/);
                                if (matches) {
                                    let submatch = matches[1];
                                    let row_selected = parseInt(submatch.split(" ")[0]);
                                    let col_selected = parseInt(submatch.split(" ")[1]);
                                    let selected_letter = speller_matrix[row_selected][col_selected];
                                    str += selected_letter + "\n";

                                    if (!parseInt(selected_letter)) {
                                        app.p300_word_constructed += selected_letter;
                                    } else if (parseInt(selected_letter)) {
                                        console.log("Word Constructed: " + app.p300_word_constructed);

                                        // Push word constructed to the server
                                        let json = {};
                                        json[this.group_name] = app.p300_word_constructed;
                                        request.post(app.p300_word_cloud_server_url, {
                                                json
                                            }, (error, res, body) => {
                                            if (error) {
                                                console.log("ERROR: " + error);
                                            }
                                            else {
                                                console.log(`statusCode: ${res.statusCode}`);
                                                console.log(body);
                                            }
                                        });
                                        app.p300_word_constructed = "";
                                    }

                                }
                            }
                        }
                        app.console_output = app.console_output + "\n" + str;
                    }
                });
                    // Handle error output
                bat.stderr.on('data', (data) => {
                    // As said before, convert the Uint8Array to a readable string.
                    var str = String.fromCharCode.apply(null, data);
                    console.error(str);
                });
                console.log("INFO: Online Phase done!!");
            });
        },
        watch_acquisition_server: function ()
        {
            /**
             * Check connection status every second
             */
            let refresh_rate = 1;
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
    },
});

app.watch_acquisition_server(); // Start this with the app

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
