const fs = require("fs");

exports.get_recent_file = function (path) {
    let files = fs.readdirSync(path);
    files.sort();
    return files[files.length-1];
}
