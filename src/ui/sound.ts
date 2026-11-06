/** Tiny synthesized sounds (no audio files): a soft wooden tap for moves. */
let ctx: AudioContext | null = null;
export function playSound(kind: 'move' | 'capture' | 'check' | 'end', enabled: boolean) {
  if (!enabled) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = kind === 'capture' ? 180 : kind === 'check' ? 520 : kind === 'end' ? 330 : 240;
    o.type = kind === 'check' ? 'triangle' : 'sine';
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(kind === 'capture' ? 0.25 : 0.15, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (kind === 'end' ? 0.5 : 0.12));
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.6);
  } catch {
    /* audio unavailable */
  }
}
