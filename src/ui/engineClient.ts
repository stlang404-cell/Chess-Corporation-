/** Promise wrapper around the engine Web Worker. */
import type { BotSpec } from '../engine/ai';
import type { MoveAnalysis } from '../engine/analysis';
import EngineWorker from '../worker/engine.worker.ts?worker&inline';

type Pending = { resolve: (v: any) => void; reject: (e: any) => void; progress?: (p: number) => void };

class EngineClient {
  private w: Worker | null = null;
  private seq = 0;
  private pending = new Map<number, Pending>();
  private worker() {
    if (!this.w) {
      this.w = new EngineWorker();
      this.w.onmessage = (e) => {
        const d = e.data;
        const p = this.pending.get(d.id);
        if (!p) return;
        if (d.progress !== undefined && d.ok === undefined) return p.progress?.(d.progress);
        this.pending.delete(d.id);
        d.ok ? p.resolve(d) : p.reject(new Error(d.error));
      };
    }
    return this.w;
  }
  private call<T>(msg: object, progress?: (p: number) => void): Promise<T> {
    const id = ++this.seq;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, progress });
      this.worker().postMessage({ ...msg, id });
    });
  }
  /** Abort everything in flight (e.g. leaving a game) by recycling the worker. */
  reset() {
    this.w?.terminate();
    this.w = null;
    for (const p of this.pending.values()) p.reject(new Error('cancelled'));
    this.pending.clear();
  }
  botMove(moves: string[], spec: BotSpec, newGame = false) {
    return this.call<{ move: string; score: number; depth: number; nodes: number }>({ type: 'bot', moves, spec, newGame });
  }
  evaluate(moves: string[], nodes = 200000) {
    return this.call<{ move: string; score: number; depth: number; pv: string[]; side: number }>({ type: 'eval', moves, nodes });
  }
  analyze(moves: string[], color: 0 | 1 | null, nodes = 25000, progress?: (p: number) => void) {
    return this.call<{ moves: MoveAnalysis[]; accuracy: number }>({ type: 'analyze', moves, color, nodes }, progress);
  }
}

export const engine = new EngineClient();
export const analyst = new EngineClient();
