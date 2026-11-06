/** Visual QA gallery (open with ?gallery): every piece set on light and dark squares at several sizes. */
import { PieceSvg } from './pieces';

const SETS = ['pieces.imperial', 'pieces.modern', 'pieces.executive', 'pieces.ink', 'pieces.kanji', 'pieces.gold'];
export function Gallery() {
  return (
    <div style={{ padding: 16 }}>
      {SETS.map((s) => (
        <div key={s} style={{ marginBottom: 18 }}>
          <div className="eyebrow">{s}</div>
          {[72, 36].map((size) => (
            <div key={size} style={{ display: 'flex', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14].map((c, i) => (
                <div key={c} style={{ width: size, height: size, background: i % 2 ? '#b9ad97' : '#efe8d8' }}>
                  <PieceSvg code={c} set={s} />
                </div>
              ))}
              {[1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14].map((c, i) => (
                <div key={'d' + c} style={{ width: size, height: size, background: i % 2 ? '#3a3834' : '#5a5751' }}>
                  <PieceSvg code={c} set={s} />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
