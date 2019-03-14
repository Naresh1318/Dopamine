const lsl = require('node-lsl');


// Resolve an LSL stream with type='EEG'
const streams = lsl.resolve_byprop('type', 'EEG');

console.log('Resolved ', streams.length, ' streams of EEG');

console.log('Connecting...');
streamInlet = new lsl.StreamInlet(streams[0]);
streamInlet.streamChunks(1, 1000);
streamInlet.on('chunk', console.log);
streamInlet.on('closed', console.log);
