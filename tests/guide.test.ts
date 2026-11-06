/**
 * Validates the official Strategy & Tactics Guide (docs/guide/*.md):
 * every diagram/exercise FEN is a legal SEVEN position, every SAN line is legal,
 * exercise ids are unique, and each exercise's first move is the engine's choice
 * (or leads to a forced mate).
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Position, parseSquare, pieceType, pieceColor, rankOf, KING, PAWN, WHITE, BLACK, SQUARES } from '../src/engine/board';
import { OFFICIAL, startFen } from '../src/engine/rules';
import { sanToMove } from '../src/engine/game';
import { Searcher, MATE } from '../src/engine/search';
import { parseMarkdown, type Block } from '../src/ui/markdown';

const DIR = join(__dirname, '..', 'docs', 'guide');
const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

type Fields = Record<string, string>;
const chapters = files.map((file) => ({ file, src: readFileSync(join(DIR, file), 'utf8'), blocks: parseMarkdown(readFileSync(join(DIR, file), 'utf8')) }));
const special = (kind: 'seven' | 'exercise' | 'game') =>
  chapters.flatMap((c) => c.blocks.filter((b): b is Extract<Block, { fields: Fields }> => b.t === kind).map((b) => ({ file: c.file, f: b.fields })));

const SQ = /^[a-g][1-7]$/;

/** Throws unless the FEN is a legal-looking SEVEN position. */
function checkFen(fen: string): Position {
  const p = Position.fromFen(fen, OFFICIAL);
  let wk = 0,
    bk = 0;
  for (const s of SQUARES) {
    const pc = p.board[s];
    if (!pc) continue;
    if (pieceType(pc) === KING) pieceColor(pc) === WHITE ? wk++ : bk++;
    if (pieceType(pc) === PAWN) expect(rankOf(s) === 0 || rankOf(s) === 6, `pawn on back rank in ${fen}`).toBe(false);
  }
  expect(wk, `white kings in ${fen}`).toBe(1);
  expect(bk, `black kings in ${fen}`).toBe(1);
  expect(p.inCheck(p.side === WHITE ? BLACK : WHITE), `side not to move is in check: ${fen}`).toBe(false);
  // board part must round-trip, so the FEN was not silently misread
  expect(p.toFen().split(' ')[0]).toBe(fen.trim().split(/\s+/)[0]);
  return p;
}

const sanTokens = (s: string) =>
  s
    .replace(/\{[^}]*\}/g, '')
    .split(/\s+/)
    .filter((t) => t && !/^\d+\.+$/.test(t) && !/^(1-0|0-1|1\/2-1\/2|\*)$/.test(t))
    .map((t) => t.replace(/^\d+\.+/, ''))
    .filter(Boolean);

function playLine(fen: string, sans: string[]) {
  const p = Position.fromFen(fen, OFFICIAL);
  for (const s of sans) {
    const m = sanToMove(p, s);
    expect(m, `illegal move ${s} in ${p.toFen()}`).not.toBe(0);
    p.make(m);
  }
  return p;
}

describe('guide structure', () => {
  it('has chapters, each starting with a level-1 title', () => {
    expect(files.length).toBeGreaterThanOrEqual(10);
    for (const c of chapters) expect(c.src.trimStart().startsWith('# '), c.file).toBe(true);
  });
  it('has enough diagrams, exercises and games', () => {
    expect(special('seven').length).toBeGreaterThanOrEqual(25);
    expect(special('exercise').length).toBeGreaterThanOrEqual(40);
    expect(special('game').length).toBeGreaterThanOrEqual(3);
  });
});

describe('diagrams', () => {
  for (const { file, f } of special('seven')) {
    it(`${file}: ${f.caption?.slice(0, 50)}`, () => {
      expect(f.fen, 'diagram needs a fen').toBeTruthy();
      checkFen(f.fen);
      for (const s of (f.highlight ?? '').split(/\s+/).filter(Boolean)) expect(SQ.test(s), `bad highlight ${s}`).toBe(true);
      for (const a of (f.arrows ?? '').split(/\s+/).filter(Boolean)) {
        expect(/^[a-g][1-7][a-g][1-7]$/.test(a), `bad arrow ${a}`).toBe(true);
        expect(parseSquare(a.slice(0, 2))).toBeGreaterThan(0);
      }
    });
  }
});

describe('games', () => {
  for (const { file, f } of special('game')) {
    it(`${file}: ${f.title}`, () => {
      const fen = f.fen || startFen(OFFICIAL);
      checkFen(fen);
      const sans = sanTokens(f.moves ?? '');
      expect(sans.length).toBeGreaterThan(0);
      const p = playLine(fen, sans);
      // notes must refer to moves that exist
      for (const part of (f.notes ?? '').split('|').filter((x) => x.trim())) {
        const m = part.trim().match(/^(\d+)(b?):/);
        expect(m, `bad note ${part}`).toBeTruthy();
        const ply = (+m![1] - 1) * 2 + (m![2] ? 1 : 0);
        expect(ply, `note beyond game end: ${part}`).toBeLessThan(sans.length);
      }
      expect(p).toBeTruthy();
    });
  }
});

/** Per-exercise node budgets where 120k is not enough for the engine to settle. */
const NODES: Record<string, number> = {};

describe('exercises', () => {
  const ex = special('exercise');
  it('ids are unique', () => {
    const ids = ex.map((e) => e.f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(/^[a-z0-9-]+$/.test(id), id).toBe(true);
  });
  for (const { file, f } of ex) {
    it(`${file}: ${f.id}`, () => {
      for (const k of ['id', 'level', 'fen', 'prompt', 'solution', 'explanation']) expect(f[k], `${f.id} missing ${k}`).toBeTruthy();
      expect(+f.level).toBeGreaterThanOrEqual(1);
      expect(+f.level).toBeLessThanOrEqual(5);
      const pos = checkFen(f.fen);
      const sans = sanTokens(f.solution);
      expect(sans.length).toBeGreaterThan(0);
      playLine(f.fen, sans);
      const first = sanToMove(pos, sans[0]);
      const r = new Searcher(16).search(pos, { nodes: NODES[f.id] ?? 120000 });
      if (r.move !== first) {
        // accept a first move that leads to a forced mate
        pos.make(first);
        if (pos.legalMoves().length === 0 && pos.inCheck()) return; // mate on the spot
        const r2 = new Searcher(16).search(pos, { nodes: NODES[f.id] ?? 120000 });
        expect(r2.score, `${f.id}: engine prefers another move and ${sans[0]} does not force mate`).toBeLessThan(-(MATE - 200));
      }
    });
  }
});
