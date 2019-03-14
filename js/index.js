const net = require('net');
const find = require('find-process');
const {run_cmd_file} = require('../js/windows_cmd');


let app = new Vue({
    el: '#app',
    data: {
        message: "Speller's gonna be great!",
        acquisition_server_status: "connected",
    },
    methods: {
        run_cmd_script: function(file_name) {
            run_cmd_file(file_name + ".cmd");
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
