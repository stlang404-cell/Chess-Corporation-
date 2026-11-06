/**
 * Puzzle miner. Plays engine games between mixed tiers (weaker sides blunder,
 * creating tactics), scans every position, and keeps those where:
 *   - the best move is clearly unique: second-best is ≥ 250 cp worse (or the
 *     best move mates and the second does not), verified at 300k nodes;
 *   - the side to move is not already completely winning (avoid trivia).
 * Each step of the solution stores an ACCEPT set (every move within 30 cp of the
 * best, or every move that keeps the shortest mate), so equally good moves are
 * never marked wrong. Themes are classified from the position; difficulty is the
 * smallest node budget at which the engine finds the move.
 *
 * Usage: tsx scripts/mine-puzzles.ts <games> <seed> > research/puzzles-N.jsonl
 */
import { Position, mFrom, mTo, mPromo, EMPTY, KING, QUEEN, ROOK, BISHOP, KNIGHT, PAWN, KNIGHT_D, KING_D, DIAG_D, ORTH_D, OFF, SQUARES } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { Searcher, MATE, isMateScore } from '../src/engine/search';
import { boardOutcome, uciOf } from '../src/engine/game';
import { chooseBotMove, type StyleId } from '../src/engine/ai';

const [gamesS, seedS] = process.argv.slice(2);
let seed = +seedS;
const rand = () => ((seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff) / 0x7fffffff);
const VAL = [0, 1, 3, 3, 5, 9, 100];
const verify = new Searcher(19);
const play = new Searcher(18);

function scoreAll(pos: Position, nodes: number) {
  const r = verify.search(pos, { nodes }, { rootScores: true, rootMargin: 400 });
  return { best: r.move, score: r.score, scores: r.rootScores ?? [[r.move, r.score]], depth: r.depth, pv: r.pv };
}

function attacksFrom(pos: Position, s: number): number[] {
  const b = pos.board;
  const pc = b[s];
  const t = pc & 7;
  const c = pc >> 3;
  const out: number[] = [];
  const add = (to: number) => {
    const tp = b[to];
    if (tp !== OFF && tp !== EMPTY && tp >> 3 !== c) out.push(to);
  };
  if (t === PAWN) {
    const f = c === 0 ? 9 : -9;
    add(s + f - 1);
    add(s + f + 1);
  } else if (t === KNIGHT || t === KING) for (const d of t === KNIGHT ? KNIGHT_D : KING_D) add(s + d);
  else {
    const dirs = t === BISHOP ? DIAG_D : t === ROOK ? ORTH_D : [...DIAG_D, ...ORTH_D];
    for (const d of dirs) {
      let to = s + d;
      while (b[to] === EMPTY) to += d;
      add(to);
    }
  }
  return out;
}

function themes(pos: Position, move: number, bestScore: number, before: number): string[] {
  const th: string[] = [];
  if (isMateScore(bestScore) && bestScore > 0) {
    const n = Math.ceil((MATE - bestScore) / 2);
    th.push(n <= 1 ? 'mate-in-1' : n === 2 ? 'mate-in-2' : 'mate-in-3+');
  }
  if (before <= -150) th.push('defence');
  const us = pos.side;
  // before the move: which enemy pieces does each of our sliders already attack?
  const attackedBefore = new Set<number>();
  for (const s of SQUARES) if (pos.board[s] !== EMPTY && pos.board[s] >> 3 === us) attacksFrom(pos, s).forEach((t) => attackedBefore.add(t));
  pos.make(move);
  const to = mTo(move);
  const hits = attacksFrom(pos, to).filter((t) => VAL[pos.board[t] & 7] >= 3);
  if (hits.length >= 2) th.push('fork');
  // discovered attack: another piece newly attacks something valuable
  for (const s of SQUARES) {
    if (s === to || pos.board[s] === EMPTY || pos.board[s] >> 3 !== us) continue;
    if (attacksFrom(pos, s).some((t) => !attackedBefore.has(t) && VAL[pos.board[t] & 7] >= 5)) {
      th.push('discovered-attack');
      break;
    }
  }
  // pin / skewer along the moved slider's lines
  const t = pos.board[to] & 7;
  if (t === BISHOP || t === ROOK || t === QUEEN) {
    const dirs = t === BISHOP ? DIAG_D : t === ROOK ? ORTH_D : [...DIAG_D, ...ORTH_D];
    for (const d of dirs) {
      let a = to + d;
      while (pos.board[a] === EMPTY) a += d;
      if (pos.board[a] === OFF || pos.board[a] >> 3 === us) continue;
      let c2 = a + d;
      while (pos.board[c2] === EMPTY) c2 += d;
      if (pos.board[c2] === OFF || pos.board[c2] >> 3 === us) continue;
      const front = VAL[pos.board[a] & 7];
      const back = VAL[pos.board[c2] & 7];
      if (back > front) th.push((pos.board[c2] & 7) === KING ? 'pin' : 'pin');
      else if (front > back && back >= 3) th.push('skewer');
    }
  }
  if (mPromo(move)) th.push('promotion');
  pos.unmake();
  const c = pos.counts;
  const pieces = c[2] + c[3] + c[4] + c[5] + c[10] + c[11] + c[12] + c[13];
  if (pieces <= 4 && !c[5] && !c[13]) th.push('endgame');
  if (!th.length || (th.length === 1 && th[0] === 'defence')) th.push('material');
  return [...new Set(th)];
}

function difficulty(pos: Position, best: number): number {
  const budgets = [500, 2000, 8000, 30000, 120000];
  for (let i = 0; i < budgets.length; i++) {
    const s = new Searcher(16);
    if (s.search(pos, { nodes: budgets[i] }).move === best) return 700 + i * 250;
  }
  return 2000;
}

const seen = new Set<string>();
let lastPuzzleMove = '';
for (let g = 0; g < +gamesS; g++) {
  const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
  const tiers = [2 + Math.floor(rand() * 10), 2 + Math.floor(rand() * 10)];
  const styles: StyleId[] = ['balanced', 'tactician', 'attacker', 'wildcard', 'defender'];
  const sty = [styles[Math.floor(rand() * styles.length)], styles[Math.floor(rand() * styles.length)]];
  play.tt.clear();
  for (let ply = 0; ply < 160; ply++) {
    if (boardOutcome(p)) break;
    if (ply >= 8) {
      // cheap pre-filter, then expensive verification
      const quick = scoreAll(p, 20000);
      const sc = quick.scores;
      const second = sc.length > 1 ? sc[1][1] : -MATE;
      const gap = isMateScore(quick.score) && quick.score > 0 ? (isMateScore(second) && second > 0 ? 0 : 9999) : quick.score - second;
      if (sc.length > 1 && gap >= 250 && quick.score < 900) {
        const deep = scoreAll(p, 300000);
        const s2 = deep.scores.length > 1 ? deep.scores[1][1] : -MATE;
        const mate = isMateScore(deep.score) && deep.score > 0;
        const g2 = mate ? (isMateScore(s2) && s2 > 0 && s2 >= deep.score - 2 ? 0 : 9999) : deep.score - s2;
        const before = deep.score; // side to move's eval with best play
        const fen = p.toFen();
        const key = fen.split(' ').slice(0, 2).join(' ');
        // skip plain recaptures (the "only move" is just taking back) and repeats of the same tactic
        const last = p.lastMove();
        const recapture = last !== 0 && p.lastCapture() !== EMPTY && mTo(deep.best) === mTo(last);
        const repeat = lastPuzzleMove === uciOf(deep.best) || (mFrom(deep.best) === mTo(last) && !mate);
        if (deep.best === quick.best && g2 >= 250 && !seen.has(key) && (mate || before < 700) && !recapture && !repeat) {
          lastPuzzleMove = uciOf(deep.best);
          seen.add(key);
          // build the solution: up to 3 player moves for mates, 1 otherwise
          const steps: { accept: string[]; reply?: string }[] = [];
          const q = p.clone();
          const maxSteps = mate ? 3 : 1;
          let ok = true;
          for (let k = 0; k < maxSteps; k++) {
            const r = k === 0 ? deep : scoreAll(q, 200000);
            const acc = r.scores.filter(([, v]) => (isMateScore(r.score) && r.score > 0 ? v >= r.score - 0 : v >= r.score - 30)).map(([m]) => uciOf(m));
            if (!acc.length) { ok = false; break; }
            q.make(r.best);
            const out = boardOutcome(q);
            if (out) { steps.push({ accept: acc }); break; }
            if (k === maxSteps - 1) { steps.push({ accept: acc }); break; }
            const reply = verify.search(q, { nodes: 100000 }).move;
            steps.push({ accept: acc, reply: uciOf(reply) });
            q.make(reply);
          }
          if (ok && steps.length) {
            const th = themes(p, deep.best, deep.score, quick.score - 0);
            console.log(JSON.stringify({ fen, themes: th, rating: difficulty(p, deep.best), steps, eval: deep.score, gap: g2 === 9999 ? 'mate' : g2 }));
          }
        }
      }
    }
    const mv = chooseBotMove(p, { tier: tiers[p.side], style: sty[p.side], seed: g * 7 + p.side }, play);
    p.make(mv.move);
  }
}
