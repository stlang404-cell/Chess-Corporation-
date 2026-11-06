/**
 * Subtle synthesized sounds (no audio files, works offline). Two independent
 * volumes: piece sounds (move/capture/castle/check) and effects (results,
 * promotions, ceremonies). Sounds are off until the player enables them.
 */
export type SoundKind = 'move' | 'capture' | 'castle' | 'check' | 'win' | 'loss' | 'draw' | 'promotion' | 'tick';
type SoundSettings = { sound: boolean; moveVolume?: number; effectsVolume?: number };

let ctx: AudioContext | null = null;
function ac() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Short filtered noise burst + low body: a wooden "tock". */
function tock(c: AudioContext, t: number, vol: number, pitch: number) {
  const len = Math.floor(c.sampleRate * 0.06);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const n = c.createBufferSource();
  n.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = pitch * 6;
  bp.Q.value = 1.4;
  const g = c.createGain();
  g.gain.value = vol * 0.9;
  n.connect(bp).connect(g).connect(c.destination);
  n.start(t);
  const o = c.createOscillator();
  const og = c.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(pitch, t);
  o.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + 0.08);
  og.gain.setValueAtTime(0.0001, t);
  og.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  o.connect(og).connect(c.destination);
  o.start(t);
  o.stop(t + 0.15);
}

function tone(c: AudioContext, t: number, f: number, vol: number, dur: number, type: OscillatorType = 'sine') {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export function playSound(kind: SoundKind, s: SoundSettings) {
  if (!s.sound) return;
  const mv = s.moveVolume ?? 0.6;
  const fx = s.effectsVolume ?? 0.5;
  try {
    const c = ac();
    const t = c.currentTime + 0.005;
    switch (kind) {
      case 'move':
        return tock(c, t, 0.5 * mv, 190);
      case 'capture':
        tock(c, t, 0.6 * mv, 150);
        return tock(c, t + 0.045, 0.35 * mv, 120);
      case 'castle':
        tock(c, t, 0.45 * mv, 200);
        return tock(c, t + 0.09, 0.45 * mv, 170);
      case 'check':
        tock(c, t, 0.5 * mv, 190);
        return tone(c, t + 0.02, 1318, 0.06 * mv, 0.5, 'triangle');
      case 'tick':
        return tone(c, t, 880, 0.03 * mv, 0.06);
      case 'win':
        [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.09, f, 0.07 * fx, 0.7));
        return;
      case 'draw':
        [440, 554].forEach((f, i) => tone(c, t + i * 0.12, f, 0.06 * fx, 0.6));
        return;
      case 'loss':
        [392, 330].forEach((f, i) => tone(c, t + i * 0.16, f, 0.06 * fx, 0.7));
        return;
      case 'promotion':
        tone(c, t, 98, 0.12 * fx, 1.6, 'sine');
        [784, 988, 1175].forEach((f, i) => tone(c, t + 0.15 + i * 0.08, f, 0.05 * fx, 0.9, 'triangle'));
        return;
    }
  } catch {
    /* audio unavailable */
  }
}
