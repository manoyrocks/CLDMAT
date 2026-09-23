// In-house pictograms (design/design_system.md §4). 24×24 grid, 2 px strokes, no copyrighted symbol sets.
const P: Record<string, string> = {
  drum: 'M4 9c0-2 3.6-3 8-3s8 1 8 3v7c0 2-3.6 3-8 3s-8-1-8-3z M4 9c0 2 3.6 3 8 3s8-1 8-3 M7 3l3 5 M17 3l-3 5',
  shaker: 'M9 4h6v4l2 3v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-8l2-3z M10 13h1 M13 15h1 M11 17h1',
  bells: 'M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5z M10 18a2 2 0 0 0 4 0',
  song: 'M9 18V6l10-2v12 M9 18a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 9 18z M19 16a2.5 2.5 0 1 1-2.5-2.5A2.5 2.5 0 0 1 19 16z',
  calm: 'M5 19c0-8 6-13 14-14-1 8-6 14-14 14z M5 19l8-8',
  day: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  countdown: 'M12 5a8 8 0 1 1 0 16 8 8 0 0 1 0-16z M12 9v4l3 2 M9 2h6',
  stop: 'M7 11V6a1.5 1.5 0 0 1 3 0v4 M10 10V4.5a1.5 1.5 0 0 1 3 0V10 M13 10V5.5a1.5 1.5 0 0 1 3 0V11 M16 11V8a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-3l-2.5-4a1.5 1.5 0 0 1 2.5-1.6L7 14',
  teeth: 'M6 4c2 0 3 1 6 1s4-1 6-1c2 0 3 2 2 6-1 3-1 10-3 10-1.5 0-1.5-5-3-5h-4c-1.5 0-1.5 5-3 5-2 0-2-7-3-10-1-4 0-6 2-6z',
  paste: 'M4 10h11l4 2-4 2H4z M15 10v4',
  bath: 'M3 12h18v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z M6 12V6a2 2 0 0 1 4 0 M7 19l-1 2 M17 19l1 2',
  towel: 'M6 4h12v16H6z M6 15h12',
  water: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  tidy: 'M4 10h16l-2 10H6z M9 10V6h6v4',
  toys: 'M6 14h6v6H6z M15 11a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M8 4l4 6H4z',
  box: 'M3 8l9-4 9 4v10l-9 4-9-4z M3 8l9 4 9-4 M12 12v10',
  star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  clothes: 'M8 4l-5 3 2 4 3-1v10h8V10l3 1 2-4-5-3a4 4 0 0 1-8 0z',
  shoes: 'M3 16v-5h5l3 3 7 1a3 3 0 0 1 3 3H3z',
  coat: 'M8 3l4 3 4-3 4 4-2 3v11H6V10L4 7z M12 6v15',
  door: 'M6 3h12v18H6z M14 12h1',
  pyjamas: 'M8 4h8l3 5-3 1v10H8V10L5 9z M12 8v2',
  book: 'M4 5c3-1 6-1 8 1 2-2 5-2 8-1v13c-3-1-6-1-8 1-2-2-5-2-8-1z M12 6v13',
  bed: 'M3 18V7 M3 14h18v4 M21 14v-3a3 3 0 0 0-3-3h-7v6 M7 11a2 2 0 1 1 0-.01',
  hands: 'M7 12V6a1 1 0 0 1 2 0v5 M9 11V4a1 1 0 0 1 2 0v7 M11 11V5a1 1 0 0 1 2 0v7 M13 12V8a1 1 0 0 1 2 0v6a6 6 0 0 1-6 6 5 5 0 0 1-4-2l-2-3a1 1 0 0 1 2-1l1 1',
  chair: 'M7 3v9h10V3 M6 12h12 M7 12v9 M17 12v9',
  food: 'M4 12h16a8 8 0 0 1-16 0z M9 8c0-2 2-2 2-4 M13 8c0-2 2-2 2-4',
  boat: 'M3 15h18l-3 5H6z M12 3v12 M12 4l6 9h-6',
  lamb: 'M7 10a5 4 0 1 0 10 0 5 4 0 1 0-10 0z M17 9a3 3 0 1 0 3 3 M9 14v5 M15 14v5',
  cow: 'M6 8h12v8a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4z M6 8L3 5 M18 8l3-3 M10 16h.01 M14 16h.01',
  wave: 'M2 12c3-4 5-4 8 0s5 4 8 0 3-4 4-2 M2 17c3-4 5-4 8 0s5 4 8 0',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  cloud: 'M7 18a4 4 0 0 1 0-8 5 5 0 0 1 10 1 3.5 3.5 0 0 1 0 7z',
  wind: 'M3 8h11a3 3 0 1 0-3-3 M3 12h16a3 3 0 1 1-3 3 M3 16h8',
  blender: 'M7 3h10l-2 11H9z M8 14h8v7H8z M12 17h.01',
  vacuum: 'M5 21h8 M9 21V9l8-6 M9 17a4 4 0 1 1 0 .01',
  bell: 'M12 3a5 5 0 0 1 5 5v4l2 3H5l2-3V8a5 5 0 0 1 5-5z M10 18a2 2 0 0 0 4 0',
  siren: 'M6 18v-6a6 6 0 0 1 12 0v6z M4 21h16 M12 2v2 M4 6l1.5 1.5 M20 6l-1.5 1.5',
  baby: 'M12 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z M10 10h.01 M14 10h.01 M10 13a3 3 0 0 0 4 0 M9 20h6',
  people: 'M8 8a3 3 0 1 1 0 .01 M16 8a3 3 0 1 1 0 .01 M2 20a6 6 0 0 1 12 0 M10 20a6 6 0 0 1 12 0',
  bang: 'M12 2l2 6 6-2-3 6 5 3-6 1 1 6-5-4-5 4 1-6-6-1 5-3-3-6 6 2z',
  dog: 'M4 10l2-5 3 3h6l3-3 2 5v5a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5z M10 13h.01 M14 13h.01',
  sound: 'M4 9h4l5-4v14l-5-4H4z M16 9a4 4 0 0 1 0 6 M19 6a8 8 0 0 1 0 12',
  home: 'M3 11l9-8 9 8 M5 9v11h14V9',
  list: 'M8 6h12 M8 12h12 M8 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  ear: 'M6 9a6 6 0 0 1 12 0c0 4-4 5-4 9a3 3 0 0 1-6 0',
  target: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z M12 12h.01',
  learn: 'M2 9l10-5 10 5-10 5z M6 11v5c3 2 9 2 12 0v-5',
  gear: 'M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  back: 'M15 5l-7 7 7 7',
  play: 'M7 4l13 8-13 8z',
  chat: 'M4 5h16v11H9l-5 4z',
  check: 'M4 12l5 5L20 6',
  child: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6z M6 21l2-8h8l2 8 M4 12l4-2 M20 12l-4-2',
};

export function Icon({ name, size = 24, label }: { name: string; size?: number; label?: string }) {
  const d = P[name] ?? P.sound!;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <path d={d} />
    </svg>
  );
}

export const ICON_NAMES = Object.keys(P);
