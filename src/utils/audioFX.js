/**
 * Focus Audio FX Engine
 * Pure Web Audio API — zero external assets, zero latency.
 * Synthesises premium UI sounds on-the-fly.
 */

let _ctx = null;

const getCtx = () => {
    if (!_ctx) {
        try {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch {
            return null;
        }
    }
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
};

const master = (ctx) => {
    const gain = ctx.createGain();
    gain.gain.value = 0.35; // global volume — low & tasteful
    gain.connect(ctx.destination);
    return gain;
};

/** Tiny helper: schedule an oscillator burst */
const burst = (ctx, dest, { freq = 440, type = 'sine', startGain = 0.6, endGain = 0, startTime, endTime }) => {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    env.gain.setValueAtTime(startGain, startTime);
    env.gain.exponentialRampToValueAtTime(Math.max(endGain, 0.001), endTime);
    osc.connect(env);
    env.connect(dest);
    osc.start(startTime);
    osc.stop(endTime);
};

// ─────────────────────────────────────────────────────────────────────────────
// LIKE  — soft double-pop, major third interval (C5 → E5)
// ─────────────────────────────────────────────────────────────────────────────
export const playLike = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    burst(ctx, out, { freq: 523.25, type: 'sine', startGain: 0.5, endGain: 0, startTime: now, endTime: now + 0.12 });
    burst(ctx, out, { freq: 659.25, type: 'sine', startGain: 0.4, endGain: 0, startTime: now + 0.06, endTime: now + 0.22 });
};

// UNLIKE — reverse drop (E5 → C5)
export const playUnlike = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    burst(ctx, out, { freq: 659.25, type: 'sine', startGain: 0.3, endGain: 0, startTime: now, endTime: now + 0.1 });
    burst(ctx, out, { freq: 440, type: 'sine', startGain: 0.2, endGain: 0, startTime: now + 0.05, endTime: now + 0.18 });
};

// ─────────────────────────────────────────────────────────────────────────────
// SAVE  — warm pluck (triangle wave + slight bend)
// ─────────────────────────────────────────────────────────────────────────────
export const playSave = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.15);
    env.gain.setValueAtTime(0.5, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.28);
};

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE SENT  — ascending swoosh (filtered noise sweep)
// ─────────────────────────────────────────────────────────────────────────────
export const playMessageSent = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    // Noise source
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    // Band-pass filter sweeping up
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.14);
    filter.Q.value = 4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.7, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter);
    filter.connect(env);
    env.connect(out);
    noise.start(now);
    noise.stop(now + 0.16);
    // Pitch-up tone on top
    burst(ctx, out, { freq: 880, type: 'sine', startGain: 0.25, endGain: 0, startTime: now + 0.04, endTime: now + 0.18 });
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION  — gentle chime (bell-like)
// ─────────────────────────────────────────────────────────────────────────────
export const playNotification = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    [1046.5, 1318.5, 1567.98].forEach((freq, i) => {
        burst(ctx, out, {
            freq,
            type: 'sine',
            startGain: 0.35,
            endGain: 0,
            startTime: now + i * 0.07,
            endTime: now + i * 0.07 + 0.35,
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// POST PUBLISH  — triumphant rising arpeggio (C-E-G-C)
// ─────────────────────────────────────────────────────────────────────────────
export const playPublish = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        burst(ctx, out, {
            freq,
            type: 'triangle',
            startGain: 0.4,
            endGain: 0,
            startTime: now + i * 0.09,
            endTime: now + i * 0.09 + 0.22,
        });
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// ERROR  — descending minor second
// ─────────────────────────────────────────────────────────────────────────────
export const playError = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    burst(ctx, out, { freq: 349.23, type: 'sawtooth', startGain: 0.3, endGain: 0, startTime: now, endTime: now + 0.1 });
    burst(ctx, out, { freq: 329.63, type: 'sawtooth', startGain: 0.2, endGain: 0, startTime: now + 0.07, endTime: now + 0.2 });
};

// ─────────────────────────────────────────────────────────────────────────────
// FOLLOW  — upward chirp
// ─────────────────────────────────────────────────────────────────────────────
export const playFollow = () => {
    const ctx = getCtx();
    if (!ctx) return;
    const out = master(ctx);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    env.gain.setValueAtTime(0.45, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 0.22);
};
