const path = require('path')
const {spawn} = require('child_process');

exports.run_cmd_file = function(file_name) {
    const bat = spawn('cmd.exe', ['/c', path.join(__dirname, "../batch_scripts", file_name)]);

    // Handle normal output
    bat.stdout.on('data', (data) => {
        // As said before, convert the Uint8Array to a readable string.
        var str = String.fromCharCode.apply(null, data);
        console.info(str);
    });

    // Handle error output
    bat.stderr.on('data', (data) => {
        // As said before, convert the Uint8Array to a readable string.
        var str = String.fromCharCode.apply(null, data);
        console.error(str);
    });

    // Handle on exit event
    bat.on('exit', (code) => {
        var preText = `Child exited with code ${code} : `;

        switch(code){
            case 0:
                console.info(preText+"Something unknown happened executing the batch.");
                break;
            case 1:
                console.info(preText+"The file already exists");
                break;
            case 2:
                console.info(preText+"The file doesn't exists and now is created");
                break;
            case 3:
                console.info(preText+"An error ocurred while creating the file");
                break;
        }
    });
}
