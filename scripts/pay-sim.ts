/**
 * Paycheck calibration: compares pay-3 (review-driven) with pay-2 over sampled
 * games, by result and accuracy band, to keep total compensation stable while
 * shifting it toward play quality. Output: research/pay-sim.md
 */
import { writeFileSync } from 'node:fs';
import { computePay, computePayV3 } from '../src/game/economy';

let seed = 99;
const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);
const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(2 * Math.PI * rand());
const sum = (l: { amount: number }[]) => l.reduce((a, x) => a + x.amount, 0);

const bands: Record<string, { n: number; p2: number; p3: number }> = {};
let all2 = 0;
let all3 = 0;
const N = 20000;
for (let i = 0; i < N; i++) {
  const acc = Math.max(30, Math.min(99, 74 + gauss() * 11));
  const u = rand();
  // results correlate with accuracy
  const pw = Math.max(0.05, Math.min(0.9, 0.42 + (acc - 74) / 40));
  const score = (u < pw ? 1 : u < pw + 0.2 ? 0.5 : 0) as 0 | 0.5 | 1;
  const blunders = Math.max(0, Math.round((90 - acc) / 12 + gauss() * 0.7));
  const mistakes = Math.max(0, Math.round((92 - acc) / 9 + gauss()));
  const greats = rand() < (acc - 50) / 120 ? 1 + Math.floor(rand() * 2) : 0;
  const brilliant = rand() < 0.02 ? 1 : 0;
  const minWin = score >= 0.5 && rand() < 0.15 ? 20 : 45;
  const gap = gauss() * 100;
  const expected = 1 / (1 + Math.pow(10, gap / 400));
  const input = { rank: 60, score, expected, playerRating: 1400, oppRating: 1400 + gap, playerMoves: 35, accuracy: acc, rematchCount: 0, rated: true };
  const p2 = sum(computePay(input));
  const p3 = sum(computePayV3(input, { standard: 'rev-3', accuracy: acc, moves: 35, counts: { brilliant, great: greats, best: 10, excellent: 8, good: 8, inaccuracy: 3, mistake: mistakes, blunder: blunders }, minWin }));
  all2 += p2;
  all3 += p3;
  const band = `${score === 1 ? 'win' : score === 0.5 ? 'draw' : 'loss'} · acc ${acc >= 90 ? '90+' : acc >= 80 ? '80–90' : acc >= 70 ? '70–80' : acc >= 60 ? '60–70' : '<60'}`;
  const b = (bands[band] ??= { n: 0, p2: 0, p3: 0 });
  b.n++;
  b.p2 += p2;
  b.p3 += p3;
}
const lines = [`# Paycheck calibration (pay-3 vs pay-2), generated ${new Date().toISOString().slice(0, 10)}`, '', `${N} sampled games at rank 60 (salary $${Math.round(60 * Math.sqrt(61))}). Mean pay: pay-2 $${Math.round(all2 / N)}, pay-3 $${Math.round(all3 / N)} (${Math.round((all3 / all2 - 1) * 100)}%).`, '', '| Result · accuracy | Games | pay-2 mean | pay-3 mean |', '|---|---|---|---|'];
for (const k of Object.keys(bands).sort()) {
  const b = bands[k];
  lines.push(`| ${k} | ${b.n} | $${Math.round(b.p2 / b.n)} | $${Math.round(b.p3 / b.n)} |`);
}
writeFileSync('research/pay-sim.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
