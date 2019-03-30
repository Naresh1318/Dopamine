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
            alpha_pong_calibration_active: false,
            alpha_pong_single_player: false,
            alpha_pong_multi_player: false,
        },
        acquisition_server_status: "Connected",  // Head connection status
        acquisition_server_status_2: "Connected",
        console_output: "",                      // Console text
        min_crop_value_1: 9,                       
        max_crop_value_1: 15,                      
        signal_offset_1: 9,
        min_crop_value_2: 9,                       
        max_crop_value_2: 15,                      
        signal_offset_2: 9,
        reference_scenario_path: ".\\openvibe_scenarios\\pong_using_alpha",  // Openvibe Reference Scenario path
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
                if (list.length < 2) {
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
        run_alpha_signal_monitoring: function() {
            /**
             * Start signal monitoring
             */
            this.run_cmd_script("start_alpha_signal_monitoring");
        },
        run_alpha_signal_calibration: function() {
            /**
             * Copy new configuration file to openvibe scenario path and start P300 calibration
             */
            // Modify configuration file
            var new_cfg_path = path.join(this.reference_scenario_path, "calibration.mxs");
            var reference_cfg_path = path.join(this.reference_scenario_path, "calibration_ref.mxs");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            var min_flag = false;
            var max_flag = false;
            var eq_flag = false;
            rl.on("line", (line) => {
                if (line.search("Min crop value") != -1 || line.search("Max crop value") != -1) {
                    offset = 1;
                    if (line.search("Min crop value") != -1) {
                        min_flag = true;
                    } else {
                        max_flag = true;
                    }
                } 
                else if (line.search("Equation") != -1)  // Modify equation after the crop block
                {
                    if (max_flag) {
                        max_flag = false;
                        new_cfg_file = new_cfg_file.concat(line + "\n");
                        return;
                    }
                    else {
                        offset = 1;
                        eq_flag = true;
                        max_flag = false;
                    }
                }
                else if (offset === 1) {
                    offset += 1;
                } else if (offset === 2) {
                    offset = 0;
                    if (min_flag) {
                        line = `					<Value>${this.min_crop_value_1}</Value>`;
                        min_flag = false;
                    }
                    else if (eq_flag) {
                        line = `					<Value>x-${this.signal_offset_1}</Value>`;
                    }
                    else if (max_flag) {
                        line = `					<Value>${this.max_crop_value_1}</Value>`;
                    }
                }
                new_cfg_file = new_cfg_file.concat(line + "\n");
            })
            .on("close", function() {
                rl.close();
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: Calibration Configuration Replaced!");
                app.run_cmd_script("start_alpha_calibration");   
            });
        },
        run_single_player_pong: function() {
            var new_cfg_path = path.join(this.reference_scenario_path, "DesignerPong.mxs");
            var reference_cfg_path = path.join(this.reference_scenario_path, "DesignerPong_ref.mxs");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            var min_flag = false;
            var max_flag = false;
            var eq_flag = false;
            rl.on("line", (line) => {
                if (line.search("Min crop value") != -1 || line.search("Max crop value") != -1) {
                    offset = 1;
                    if (line.search("Min crop value") != -1) {
                        min_flag = true;
                    } else {
                        max_flag = true;
                    }
                } 
                else if (line.search("Equation") != -1)  // Modify equation after the crop block
                {
                    if (max_flag) {
                        max_flag = false;
                        new_cfg_file = new_cfg_file.concat(line + "\n");
                        return;
                    }
                    else {
                        offset = 1;
                        eq_flag = true;
                        max_flag = false;
                    }
                }
                else if (offset === 1) {
                    offset += 1;
                } else if (offset === 2) {
                    offset = 0;
                    if (min_flag) {
                        line = `					<Value>${this.min_crop_value_1}</Value>`;
                        min_flag = false;
                    }
                    else if (eq_flag) {
                        line = `					<Value>x-${this.signal_offset_1}</Value>`;
                    }
                    else if (max_flag) {
                        line = `					<Value>${this.max_crop_value_1}</Value>`;
                    }
                }
                new_cfg_file = new_cfg_file.concat(line + "\n");
            })
            .on("close", function() {
                rl.close();
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: DesignerPong Configuration Replaced!");
                if (app.acquisition_server_status != "Connected") {
                    alert("Headset for Player 1 not connected..");
                }
                else if (app.acquisition_server_status == "Connected") {
                    window.location.assign('pong_single_player_simulator.html');  // Go to pong html
                }
            });
        },
        run_multi_player_pong: function() {
            // Player 1 
            var new_cfg_path = path.join(this.reference_scenario_path, "DesignerPong.mxs");
            var reference_cfg_path = path.join(this.reference_scenario_path, "DesignerPong_ref.mxs");
            var rl = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path),
                crlfDelay: Infinity
            });
            var new_cfg_file = "";
            var offset = 0;
            var min_flag = false;
            var max_flag = false;
            var eq_flag = false;
            rl.on("line", (line) => {
                if (line.search("Min crop value") != -1 || line.search("Max crop value") != -1) {
                    offset = 1;
                    if (line.search("Min crop value") != -1) {
                        min_flag = true;
                    } else {
                        max_flag = true;
                    }
                } 
                else if (line.search("Equation") != -1)  // Modify equation after the crop block
                {
                    if (max_flag) {
                        max_flag = false;
                        new_cfg_file = new_cfg_file.concat(line + "\n");
                        return;
                    }
                    else {
                        offset = 1;
                        eq_flag = true;
                        max_flag = false;
                    }
                }
                else if (offset === 1) {
                    offset += 1;
                } else if (offset === 2) {
                    offset = 0;
                    if (min_flag) {
                        line = `					<Value>${this.min_crop_value_1}</Value>`;
                        min_flag = false;
                    }
                    else if (eq_flag) {
                        line = `					<Value>x-${this.signal_offset_1}</Value>`;
                    }
                    else if (max_flag) {
                        line = `					<Value>${this.max_crop_value_1}</Value>`;
                    }
                }
                new_cfg_file = new_cfg_file.concat(line + "\n");
            })
            .on("close", function() {
                rl.close();
                fs.writeFile(new_cfg_path, new_cfg_file, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: DesignerPong Configuration Replaced!");
            });

            // Player 2
            var new_cfg_path_2 = path.join(this.reference_scenario_path, "DesignerPong_2.mxs");
            var reference_cfg_path_2 = path.join(this.reference_scenario_path, "DesignerPong_2_ref.mxs");
            var rl_2 = readline.createInterface({
                input: fs.createReadStream(reference_cfg_path_2),
                crlfDelay: Infinity
            });
            new_cfg_file_2 = "";
            offset_2 = 0;
            min_flag_2 = false;
            max_flag_2 = false;
            eq_flag_2 = false;
            rl_2.on("line", (line_2) => {
                if (line_2.search("Min crop value") != -1 || line_2.search("Max crop value") != -1) {
                    offset_2 = 1;
                    if (line_2.search("Min crop value") != -1) {
                        min_flag_2 = true;
                    } else {
                        max_flag_2 = true;
                    }
                } 
                else if (line_2.search("Equation") != -1)  // Modify equation after the crop block
                {
                    if (max_flag_2) {
                        max_flag_2 = false;
                        new_cfg_file_2 = new_cfg_file_2.concat(line_2 + "\n");
                        return;
                    }
                    else {
                        offset_2 = 1;
                        eq_flag_2 = true;
                        max_flag_2 = false;
                    }
                }
                else if (offset_2 === 1) {
                    offset_2 += 1;
                } else if (offset_2 === 2) {
                    offset_2 = 0;
                    if (min_flag_2) {
                        line_2 = `					<Value>${this.min_crop_value_2}</Value>`;
                        min_flag_2 = false;
                    }
                    else if (eq_flag_2) {
                        line_2 = `					<Value>x-${this.signal_offset_2}</Value>`;
                    }
                    else if (max_flag_2) {
                        line_2 = `					<Value>${this.max_crop_value_2}</Value>`;
                    }
                }
                new_cfg_file_2 = new_cfg_file_2.concat(line_2 + "\n");
            })
            .on("close", function() {
                rl_2.close();
                fs.writeFile(new_cfg_path_2, new_cfg_file_2, function(err) {
                    if (err) throw err;
                });
                console.log("INFO: DesignerPong Configuration Replaced!");
                window.location.assign('pong_multi_player_simulator.html');  // Go to pong html
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
        watch_acquisition_server_2: function ()
        {
            /**
             * Check connection status every second
             */
            let refresh_rate = 1;
            let client = net.connect({port: 1025});
            let data_received = false;

            client.on("data", (data)=>{
                if (data) {
                    // console.log("Data Receiving!!");
                    this.acquisition_server_status_2 = "Connected";
                    client.destroy();
                    data_received = true;
                }
            });
            
            client.on("close", ()=> {
                if (!data_received) {
                    this.acquisition_server_status_2 = "Press Connect and then Press Play";
                }
                // console.log("Connection Lost :(");
            });

            client.on("error", ()=> {
                this.acquisition_server_status_2 = "Press Connect and then Press Play";
                // console.log("Connection Lost :(");
            });

            setTimeout(this.watch_acquisition_server_2, refresh_rate*1000);
        },
    },
});

app.watch_acquisition_server(); // Start this with the app
app.watch_acquisition_server_2(); // Start this with the app

$(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
