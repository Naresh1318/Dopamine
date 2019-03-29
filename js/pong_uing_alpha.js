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
        console_output: "",                      // Console text
        min_crop_value: 9,                       
        max_crop_value: 15,                      
        signal_offset: 9,
        p300_spatial_filter_training: false,     // Spatial Filter Training Flag
        p300_start_lda_training: false,          // Start LDA Training Flag
        p300_lda_training: false,                // LDA Training Flag
        p300_recent_ov_file: "",                 // Most recent detected ov file
        p300_word_constructed: "",
        p300_word_cloud_server_url: "http://naresh1318.pythonanywhere.com//word",
        group_name: "",
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
            var reference_cfg_path = path.join(this.reference_scenario_path, "calibration.mxs");
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
                        line = `					<Value>${this.min_crop_value}</Value>`;
                        min_flag = false;
                    }
                    else if (eq_flag) {
                        line = `					<Value>x-${this.signal_offset}</Value>`;
                    }
                    else if (max_flag) {
                        line = `					<Value>${this.max_crop_value}</Value>`;
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
