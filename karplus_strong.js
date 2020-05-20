const minfreq = 110;
const maxfreq = 1760;
const bufs = [];
const buflen = Math.ceil(sampleRate/minfreq)+1;
const maxchannels = 2;
for (let i = 0; i < maxchannels; i++) {
    bufs.push(new Float32Array(buflen));
}
let t = 0;

class KarplusStrongProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [{
            name: 'frequency',
            defaultValue: 440,
            minValue: minfreq,
            maxValue: maxfreq,
            automationRate: 'k-rate'
        }];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const delay = Math.round(sampleRate/parameters.frequency[0]);
        const delay1 = Math.floor(delay);
        const delay2 = delay1+1;
        const weight1 = 1 - (delay-delay1);
        const weight2 = 1 - weight1;
        for (let i = 0; i < output[0].length; i++) {
            for (let j = 0; j < 2; j++) {
                const inj = Math.min(input.length-1, j);
                // sample at t-delay
                const delayed1 = weight1*bufs[j][(t-delay1+buflen) % buflen] + weight2*bufs[j][(t-delay2+buflen) % buflen];
                // sample at t-1-delay
                const delayed2 = weight1*bufs[j][(t-1-delay1+buflen) % buflen] + weight2*bufs[j][(t-delay2+buflen) % buflen];
                let total = (delayed1+delayed2)/2;
                if (input[inj].length > 0) {
                    total += input[inj][i];
                }
                bufs[j][t] = Math.min(Math.max(total, -1), 1);
                output[j][i] = bufs[j][t];
            }
            t = (t+1) % buflen;
        }
        return true;
    }
}

registerProcessor('karplus_strong_processor', KarplusStrongProcessor);
