async function main() {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    await audioCtx.audioWorklet.addModule('karplus_strong.js');

    const ks = new AudioWorkletNode(audioCtx, 'karplus_strong_processor', {
        outputChannelCount: [2]
    });
    const fp = ks.parameters.get('frequency');
    ks.connect(audioCtx.destination);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1000;
    lowpass.connect(ks);

    const noiseBuf = audioCtx.createBuffer(2, audioCtx.sampleRate * 1, audioCtx.sampleRate);
    for (let i = 0; i < 2; i++) {
        const data = noiseBuf.getChannelData(i);
        for (let j = 0; j < audioCtx.sampleRate * 0.01; j++) {
            data[j] = Math.random()*2 - 1;
        }
    }

    function play(f, lpf) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        fp.setValueAtTime(f, audioCtx.currentTime);
        lowpass.frequency.setValueAtTime(lpf, audioCtx.currentTime);
        console.log(f, lpf);
        const noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuf;
        noise.connect(lowpass);
        noise.start();
    }

    function pitchbend(f) {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        fp.setValueAtTime(f, audioCtx.currentTime);
    }

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'white';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(canvas.width/4*i, 10);
        ctx.lineTo(canvas.width/4*i, canvas.height - 10);
        ctx.stroke();
    }
    ctx.lineWidth = 2;
    for (let i = 0; i <= 4*12; i++) {
        ctx.beginPath();
        ctx.moveTo(canvas.width/(4*12)*i, 15);
        ctx.lineTo(canvas.width/(4*12)*i, canvas.height - 15);
        ctx.stroke();
    }

    let isBending = false;

    canvas.addEventListener('mousedown', e => {
        const f = 110 * Math.pow(16, e.offsetX/canvas.width);
        const lpf = 500 * Math.pow(40, e.offsetY/canvas.height);
        play(f, lpf);
        isBending = true;
    });

    canvas.addEventListener('mousemove', e => {
        if (isBending) {
            const f = 110 * Math.pow(16, e.offsetX/canvas.width);
            fp.setValueAtTime(f, audioCtx.currentTime);
        }
    });

    canvas.addEventListener('mouseup', e => {
        isBending = false;
    });

    canvas.addEventListener('mouseleave', e => {
        isBending = false;
    });
}

main();
