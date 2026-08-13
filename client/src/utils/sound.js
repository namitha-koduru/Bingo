let ctx = null;
let enabled = true;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone({ freq = 440, duration = 0.12, type = "sine", volume = 0.15, delay = 0 }) {
  if (!enabled) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const startTime = audioCtx.currentTime + delay;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

export function setSoundEnabled(value) {
  enabled = value;
}

export function getSoundEnabled() {
  return enabled;
}

export const sounds = {
  click() {
    tone({ freq: 620, duration: 0.08, type: "square", volume: 0.12 });
  },
  markOpponent() {
    tone({ freq: 380, duration: 0.09, type: "triangle", volume: 0.1 });
  },
  lineComplete() {
    tone({ freq: 523.25, duration: 0.15, type: "sine", volume: 0.16 });
    tone({ freq: 659.25, duration: 0.18, type: "sine", volume: 0.14, delay: 0.1 });
  },
  turnChange() {
    tone({ freq: 300, duration: 0.06, type: "sine", volume: 0.08 });
  },
  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
      tone({ freq, duration: 0.22, type: "sine", volume: 0.18, delay: i * 0.12 })
    );
  },
  error() {
    tone({ freq: 180, duration: 0.15, type: "sawtooth", volume: 0.1 });
  },
};
