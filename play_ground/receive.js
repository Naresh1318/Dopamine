const lsl = require('node-lsl');
const sleep = require('sleep');

const streams = lsl.resolve_byprop('type', 'EEG');

streamInlet = new lsl.StreamInlet(streams[0]);
while (1) {
    var data = streamInlet.pullChunk(timeout = 0.0, maxSamples = 1);
    if (data.timestamps[0] !== 0) {
        var sum, avg = 0;

        // dividing by 0 will return Infinity
        // arr must contain at least 1 element to use reduce
        if (data.samples)
        {
            sum = data.samples.reduce(function(a, b) { return a + b; });
            avg = sum / data.samples.length;
        }
        console.log(avg);
        console.log(data.samples);
        console.log(data.timestamps[0]);
        console.log("*****************");
    }
    sleep.msleep(10);
}
