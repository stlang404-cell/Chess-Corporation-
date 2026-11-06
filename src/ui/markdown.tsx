/** Minimal Markdown renderer for the guide, with SEVEN diagram/exercise/game blocks. */
import { Fragment, type ReactNode } from 'react';

export type Block =
  | { t: 'h'; level: number; text: string; id: string }
  | { t: 'p'; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'quote'; text: string }
  | { t: 'seven' | 'exercise' | 'game'; fields: Record<string, string> }
  | { t: 'code'; text: string };

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function parseFields(body: string): Record<string, string> {
  const f: Record<string, string> = {};
  let last = '';
  for (const line of body.split('\n')) {
    const m = line.match(/^([a-zA-Z]+):\s?(.*)$/);
    if (m) {
      last = m[1].toLowerCase();
      f[last] = m[2].trim();
    } else if (last && line.trim()) f[last] += ' ' + line.trim();
  }
  return f;
}

export function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const kind = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      if (kind === 'seven' || kind === 'exercise' || kind === 'game') out.push({ t: kind, fields: parseFields(body.join('\n')) });
      else out.push({ t: 'code', text: body.join('\n') });
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      out.push({ t: 'h', level: h[1].length, text: h[2], id: slug(h[2]) });
      i++;
      continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line);
      const items: string[] = [];
      while (i < lines.length && (ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/).test(lines[i])) {
        let item = lines[i].replace(/^\s*([-*]|\d+[.)])\s+/, '');
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*]|\d+[.)])\s+/.test(lines[i])) item += ' ' + lines[i++].trim();
        items.push(item);
      }
      out.push({ t: ordered ? 'ol' : 'ul', items });
      continue;
    }
    if (line.startsWith('>')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) q.push(lines[i++].replace(/^>\s?/, ''));
      out.push({ t: 'quote', text: q.join(' ') });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const p: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])) p.push(lines[i++]);
    out.push({ t: 'p', text: p.join(' ') });
  }
  return out;
}

export function Inline({ text, mark }: { text: string; mark?: string }): ReactNode {
  // **bold**, *italic*, `code`
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  const hl = (s: string): ReactNode => {
    if (!mark || mark.length < 2) return s;
    const idx = s.toLowerCase().indexOf(mark.toLowerCase());
    if (idx < 0) return s;
    return (
      <>
        {s.slice(0, idx)}
        <mark>{s.slice(idx, idx + mark.length)}</mark>
        {hl(s.slice(idx + mark.length))}
      </>
    );
  };
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={k++}>{hl(text.slice(last, m.index))}</Fragment>);
    const s = m[0];
    if (s.startsWith('**')) parts.push(<strong key={k++}>{hl(s.slice(2, -2))}</strong>);
    else if (s.startsWith('`')) parts.push(<code key={k++}>{s.slice(1, -1)}</code>);
    else parts.push(<em key={k++}>{hl(s.slice(1, -1))}</em>);
    last = m.index + s.length;
  }
  if (last < text.length) parts.push(<Fragment key={k++}>{hl(text.slice(last))}</Fragment>);
  return <>{parts}</>;
}

export function blockText(b: Block): string {
  switch (b.t) {
    case 'h':
    case 'p':
    case 'quote':
      return b.text;
    case 'ul':
    case 'ol':
      return b.items.join(' ');
    case 'code':
      return b.text;
    default:
      return Object.values(b.fields).join(' ');
  }
}
