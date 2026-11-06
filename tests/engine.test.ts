import { describe, it, expect } from 'vitest';
import { Position, mFrom, mTo, squareName, parseSquare, WHITE } from '../src/engine/board';
import { CANDIDATES, OFFICIAL, startFen } from '../src/engine/rules';
import { boardOutcome, moveToSan, sanToMove, uciOf, uciToMove, replay } from '../src/engine/game';
import { parse, refPerft } from './refgen';

function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

/** Random-play position collection, including castling / ep / promotion states. */
function randomPositions(rules = OFFICIAL, count = 120, seed = 7) {
  const rand = rng(seed);
  const out: string[] = [];
  for (let g = 0; out.length < count && g < 400; g++) {
    const p = Position.fromFen(startFen(rules), rules);
    const len = 4 + Math.floor(rand() * 60);
    for (let i = 0; i < len; i++) {
      const ms = p.legalMoves();
      if (!ms.length) break;
      p.make(ms[Math.floor(rand() * ms.length)]);
    }
    out.push(p.toFen());
  }
  return out;
}

describe('move generation (differential vs independent reference)', () => {
  for (const r of CANDIDATES) {
    it(`start position perft(4) matches for ${r.id}`, () => {
      const fen = startFen(r);
      const p = Position.fromFen(fen, r);
      expect(p.perft(4)).toBe(refPerft(parse(fen), 4, r));
    });
  }
  it('random positions perft(3) match the reference (official rules)', () => {
    for (const fen of randomPositions(OFFICIAL, 150)) {
      const p = Position.fromFen(fen, OFFICIAL);
      expect([fen, p.perft(3)]).toEqual([fen, refPerft(parse(fen), 3, OFFICIAL)]);
    }
  });
  it('random positions perft(2) match for the double-step candidate (en passant)', () => {
    const r = CANDIDATES.find((c) => c.pawnDouble)!;
    for (const fen of randomPositions(r, 150, 99)) {
      const p = Position.fromFen(fen, r);
      expect([fen, p.perft(2)]).toEqual([fen, refPerft(parse(fen), 2, r)]);
    }
  });
  it('crafted tactical positions match the reference', () => {
    const fens = [
      // castling both sides available, pieces cleared
      'r2qk1r/ppppppp/7/7/7/PPPPPPP/R2QK1R w KQkq - 0 1',
      // castling through attacked square (black bishop eyes f1)
      'r3k1r/ppppp1p/7/7/2b4/PPP1PPP/R3K1R w KQkq - 0 1',
      // promotions with captures
      '1n1qk2/P5P/7/7/7/7/4K2 w - - 0 1',
      // en passant possible
      '4k2/7/7/3pP2/7/7/4K2 w - d4 0 1',
      // pinned piece
      '4k2/4r2/7/7/7/4N2/4K2 w - - 0 1',
    ];
    for (const fen of fens) {
      const r = fen.includes('d4') ? CANDIDATES.find((c) => c.pawnDouble)! : OFFICIAL;
      const p = Position.fromFen(fen, r);
      for (let d = 1; d <= 3; d++) expect([fen, d, p.perft(d)]).toEqual([fen, d, refPerft(parse(fen), d, r)]);
    }
  });
});

describe('make/unmake integrity', () => {
  it('incremental hash and board equal a fresh recompute along random games', () => {
    const rand = rng(3);
    for (let g = 0; g < 30; g++) {
      const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
      for (let i = 0; i < 80; i++) {
        const ms = p.legalMoves();
        if (!ms.length) break;
        const before = p.toFen();
        const h = [p.hashLo, p.hashHi];
        const m = ms[Math.floor(rand() * ms.length)];
        p.make(m);
        const fresh = Position.fromFen(p.toFen(), OFFICIAL);
        expect([p.hashLo, p.hashHi]).toEqual([fresh.hashLo, fresh.hashHi]);
        expect(Array.from(p.counts)).toEqual(Array.from(fresh.counts));
        p.unmake();
        expect(p.toFen()).toBe(before);
        expect([p.hashLo, p.hashHi]).toEqual(h);
        p.make(m);
      }
    }
  });
  it('FEN round-trips', () => {
    for (const fen of randomPositions(OFFICIAL, 50, 11)) expect(Position.fromFen(fen, OFFICIAL).toFen()).toBe(fen);
  });
  it('square naming round-trips', () => {
    for (const n of ['a1', 'g7', 'd4', 'c6']) expect(squareName(parseSquare(n))).toBe(n);
    expect(parseSquare('h1')).toBe(-1);
    expect(parseSquare('a8')).toBe(-1);
  });
});

describe('game rules', () => {
  it('detects checkmate', () => {
    // back-rank mate: rook on a1 mates king g1? use black king on g7 boxed by pawns
    const p = Position.fromFen('6k/5pp/7/7/7/7/R3K2 w - - 0 1', OFFICIAL);
    const m = sanToMove(p, 'Ra7');
    expect(m).not.toBe(0);
    p.make(m);
    expect(boardOutcome(p)).toEqual({ result: 1, termination: 'checkmate' });
  });
  it('detects stalemate as a draw', () => {
    const p = Position.fromFen('6k/7/5QK/7/7/7/7 b - - 0 1', OFFICIAL);
    expect(p.inCheck()).toBe(false);
    expect(boardOutcome(p)?.termination).toBe('stalemate');
    expect(boardOutcome(p)?.result).toBe(0.5);
  });
  it('detects threefold repetition', () => {
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    const seq = ['Nc3', 'Nc5', 'Nb1', 'Nb7', 'Nc3', 'Nc5', 'Nb1', 'Nb7'];
    for (let i = 0; i < seq.length; i++) {
      expect(boardOutcome(p)).toBeNull();
      const m = sanToMove(p, seq[i]);
      expect(m).not.toBe(0);
      p.make(m);
    }
    expect(boardOutcome(p)?.termination).toBe('repetition');
  });
  it('applies the quiet-ply limit', () => {
    const p = Position.fromFen(`3k3/7/7/7/7/7/R2K3 w - - ${OFFICIAL.quietPlyLimit} 60`, OFFICIAL);
    expect(boardOutcome(p)?.termination).toBe('quiet-limit');
  });
  it('detects insufficient material', () => {
    expect(boardOutcome(Position.fromFen('3k3/7/7/7/7/7/2NK3 w - - 0 1', OFFICIAL))?.termination).toBe('insufficient');
    expect(boardOutcome(Position.fromFen('3k3/7/7/7/7/7/1BBK3 w - - 0 1', OFFICIAL))).toBeNull();
    expect(boardOutcome(Position.fromFen('3k3/7/7/7/7/3p3/3K3 w - - 0 1', OFFICIAL))).toBeNull();
  });
  it('promotion offers four pieces and SAN marks it', () => {
    const p = Position.fromFen('3k3/P6/7/7/7/7/3K3 w - - 0 1', OFFICIAL);
    const promos = p.legalMoves().filter((m) => squareName(mTo(m)) === 'a7');
    expect(promos.length).toBe(4);
    const sans = promos.map((m) => moveToSan(p, m)).sort();
    expect(sans).toEqual(['a7=B', 'a7=N', 'a7=Q+', 'a7=R+']);
  });
  it('castling moves king and rook, and is refused through check', () => {
    if (!OFFICIAL.castling) return;
    const p = Position.fromFen('r3k1r/ppppppp/7/7/7/PPPPPPP/R3K1R w KQkq - 0 1', OFFICIAL);
    const oo = sanToMove(p, 'O-O');
    expect(oo).not.toBe(0);
    p.make(oo);
    expect(p.toFen().split(' ')[0].split('/')[6]).toBe('R4RK');
    const q = Position.fromFen('r3k1r/ppppp1p/7/7/2b4/PPP1PPP/R3K1R w KQkq - 0 1', OFFICIAL);
    // bishop on c3 attacks... e1? (c3-d2-e1) — king in check, cannot castle at all
    expect(sanToMove(q, 'O-O')).toBe(0);
  });
  it('UCI and SAN round-trip across a random game', () => {
    const rand = rng(5);
    const p = Position.fromFen(startFen(OFFICIAL), OFFICIAL);
    const moves: string[] = [];
    for (let i = 0; i < 60; i++) {
      const ms = p.legalMoves();
      if (!ms.length || boardOutcome(p)) break;
      const m = ms[Math.floor(rand() * ms.length)];
      expect(uciToMove(p, uciOf(m))).toBe(m);
      expect(sanToMove(p, moveToSan(p, m))).toBe(m);
      moves.push(uciOf(m));
      p.make(m);
    }
    expect(replay(OFFICIAL, { moves }).toFen()).toBe(p.toFen());
    expect(mFrom(0)).toBe(0);
    expect(p.side === WHITE || p.side === 1).toBe(true);
  });
});
