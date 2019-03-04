require('child_process').exec("test_run.bat", function (err, stdout, stderr) {
    if (err) {
        // Ooops.
        // console.log(stderr);
        return console.log(err);
    }

    // Done.
    console.log(stdout);
});
  