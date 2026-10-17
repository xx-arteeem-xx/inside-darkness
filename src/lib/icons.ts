/** Пиксельные иконки 16×16: строка = ряд, символ = цвет из палитры, «.» = пусто. */
export type PixelGrid = { rows: string[]; palette: Record<string, string> };

const sword: PixelGrid = {
  palette: { a: '#e4e7ee', b: '#8d95a8', g: '#f0ad48', h: '#7a4f2a', o: '#c98a2e' },
  rows: [
    '................',
    '.............aa.',
    '............aba.',
    '...........aba..',
    '..........aba...',
    '.........aba....',
    '........aba.....',
    '.......aba......',
    '..g...aba.......',
    '...g.aba........',
    '....gba.........',
    '.....hg.........',
    '....h..g........',
    '...h............',
    '..o.............',
    '................',
  ],
};

const tower: PixelGrid = {
  palette: { s: '#8a8f9e', d: '#5d6271', t: '#f0ad48', k: '#1b1d24' },
  rows: [
    '................',
    '...ss..ss..sd...',
    '...ss..ss..sd...',
    '...sssssssssd...',
    '...sssssssssd...',
    '...sssssssssd...',
    '...ssssttsssd...',
    '...ssssttsssd...',
    '...sssssssssd...',
    '...sssssssssd...',
    '...sssskksssd...',
    '...sskkkkkssd...',
    '...sskkkkkssd...',
    '...sskkkkkssd...',
    '...sskkkkkssd...',
    '..dddddddddddd..',
  ],
};

function coin(): PixelGrid {
  const rows: string[] = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d > 6.9) row += '.';
      else if (d > 5.9) row += 'o';
      else if (d > 3.4 && d <= 4.4) row += 'o';
      else if (x + y < 10 && d > 4.4) row += 'w';
      else row += 'y';
    }
    rows.push(row);
  }
  return { palette: { o: '#a66a1c', y: '#f0ad48', w: '#f8d99a' }, rows };
}

function shield(): PixelGrid {
  const rows: string[] = [];
  for (let y = 0; y < 16; y++) {
    let row = '';
    const inset = y > 8 ? y - 8 : 0;
    for (let x = 0; x < 16; x++) {
      const left = 2 + inset;
      const right = 13 - inset;
      if (y < 1 || x < left || x > right || left > right) {
        row += '.';
      } else if (y === 1 || x === left || x === right) {
        row += 'w';
      } else if (x === 7 || x === 8 || y === 5 || y === 6) {
        row += 'y';
      } else {
        row += 'r';
      }
    }
    rows.push(row);
  }
  return { palette: { w: '#aeb1bc', r: '#8a2c38', y: '#f0ad48' }, rows };
}

export const ICONS = { sword, tower, coin: coin(), shield: shield() } as const;
export type IconName = keyof typeof ICONS;

/** Ряды в прямоугольники: соседние пиксели одного цвета склеиваются по горизонтали. */
export function toRects(grid: PixelGrid) {
  const rects: Array<{ x: number; y: number; w: number; fill: string }> = [];
  grid.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || !grid.palette[ch]) {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      rects.push({ x, y, w, fill: grid.palette[ch] });
      x += w;
    }
  });
  return rects;
}
