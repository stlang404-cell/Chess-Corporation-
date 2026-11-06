/** Minimal line icons (24×24, 1.6 stroke) drawn for SEVEN. */
const P = {
  home: 'M4 11 L12 4 L20 11 M6 9.5 V20 H18 V9.5',
  board: 'M4 4 H20 V20 H4 Z M4 12 H20 M12 4 V20 M8 4 V20 M16 4 V20 M4 8 H20 M4 16 H20',
  ladder: 'M7 3 V21 M17 3 V21 M7 7 H17 M7 12 H17 M7 17 H17',
  book: 'M4 5 C7 4 10 4 12 6 C14 4 17 4 20 5 V19 C17 18 14 18 12 20 C10 18 7 18 4 19 Z M12 6 V20',
  flip: 'M7 4 V20 M7 20 L4 17 M7 20 L10 17 M17 20 V4 M17 4 L14 7 M17 4 L20 7',
  flag: 'M6 21 V4 M6 4 H17 L15 8 L17 12 H6',
  draw: 'M5 12 H19 M5 8 H19 M5 16 H19',
  more: 'M5 12 h.01 M12 12 h.01 M19 12 h.01',
  close: 'M6 6 L18 18 M18 6 L6 18',
  search: 'M11 4 A7 7 0 1 1 10.99 4 M16 16 L21 21',
  download: 'M12 4 V15 M7 10 L12 15 L17 10 M5 20 H19',
  upload: 'M12 15 V4 M7 9 L12 4 L17 9 M5 20 H19',
  undo: 'M9 7 L4 12 L9 17 M4 12 H14 C17.5 12 20 14.5 20 18',
  bulb: 'M9 18 H15 M10 21 H14 M12 3 C8.5 3 6 5.6 6 9 C6 11.4 7.4 12.9 8.6 14.1 C9.2 14.7 9.5 15.4 9.5 16 H14.5 C14.5 15.4 14.8 14.7 15.4 14.1 C16.6 12.9 18 11.4 18 9 C18 5.6 15.5 3 12 3 Z',
  sound: 'M4 9 H8 L13 5 V19 L8 15 H4 Z M16 9 C17.5 10.5 17.5 13.5 16 15',
  copy: 'M8 8 H20 V20 H8 Z M4 16 V4 H16',
  chevron: 'M9 6 L15 12 L9 18',
  check: 'M5 12 L10 17 L19 7',
  gear: 'M12 9 A3 3 0 1 1 11.99 9 M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M4.9 4.9 L7 7 M17 17 L19.1 19.1 M4.9 19.1 L7 17 M17 7 L19.1 4.9',
};
export type IconName = keyof typeof P;
export function Icon({ name, size = 20, title }: { name: IconName; size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden={!title} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      <path d={P[name]} />
    </svg>
  );
}
