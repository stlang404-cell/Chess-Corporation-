/// <reference lib="webworker" />
import { Position } from '../engine/board';
import { OFFICIAL, startFen } from '../engine/rules';
import { Searcher } from '../engine/search';
import { chooseBotMove, type BotSpec } from '../engine/ai';
import { uciToMove, uciOf, moveToSan } from '../engine/game';
import { analyzeGame } from '../engine/analysis';

const searcher = new Searcher(19);

function posFrom(moves: string[], fen?: string) {
  const p = Position.fromFen(fen ?? startFen(OFFICIAL), OFFICIAL);
  for (const u of moves) {
    const m = uciToMove(p, u);
    if (!m) throw new Error('illegal move ' + u);
    p.make(m);
  }
  return p;
}

self.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  try {
    if (msg.type === 'bot') {
      const p = posFrom(msg.moves, msg.fen);
      if (msg.newGame) searcher.tt.clear();
      const info = chooseBotMove(p, msg.spec as BotSpec, searcher);
      self.postMessage({ id: msg.id, ok: true, move: uciOf(info.move), score: info.score, depth: info.depth, nodes: info.nodes });
    } else if (msg.type === 'eval') {
      const p = posFrom(msg.moves, msg.fen);
      searcher.pers = { ...searcher.pers, contempt: 0, aggression: 0 };
      const r = searcher.search(p, { nodes: msg.nodes ?? 200000 });
      const pvSan: string[] = [];
      const q = p.clone();
      for (const m of r.pv.slice(0, 8)) {
        pvSan.push(moveToSan(q, m));
        if (!q.make(m)) break;
      }
      self.postMessage({ id: msg.id, ok: true, move: uciOf(r.move), score: r.score, depth: r.depth, pv: pvSan, side: p.side });
    } else if (msg.type === 'analyze') {
      const res = analyzeGame(msg.moves, msg.color, msg.nodes ?? 25000, (pr) =>
        self.postMessage({ id: msg.id, progress: pr }),
      );
      self.postMessage({ id: msg.id, ok: true, ...res });
    }
  } catch (err) {
    self.postMessage({ id: msg.id, ok: false, error: String(err) });
  }
};
