/**
 * Пиксельные гербы рас и значки занятий. Цвета и символы — рисунок, а не данные из игры.
 * Свойства рас, мастеров и мест, которые показываются рядом, — из src/data/game.ts.
 */
import { stamp, type Grid } from './pixel';

/* ——— щит 16×17: золотая кайма, поле, лёгкая тень справа ——— */
function shieldRows(): string[] {
  const rows: string[] = [];
  const bounds = (y: number) => {
    const inset = Math.max(0, y - 10);
    return [1 + inset, 14 - inset];
  };
  for (let y = 0; y < 17; y++) {
    const [l, r] = bounds(y);
    let row = '';
    for (let x = 0; x < 16; x++) {
      if (x < l || x > r) {
        row += '.';
        continue;
      }
      const [pl, pr] = bounds(y - 1);
      const [nl, nr] = bounds(y + 1);
      const edge = y === 0 || x === l || x === r || y === 16 || x < nl || x > nr || x < pl || x > pr;
      if (edge) row += x > 7 && y > 3 ? 'O' : 'o';
      else if (x === r - 1 || x > nr - 1) row += 'F';
      else if (y === 1 || x === l + 1) row += 'L';
      else row += 'f';
    }
    rows.push(row);
  }
  return rows;
}
const SHIELD = shieldRows();

type Crest = { field: string; dark: string; light: string; symbol: string[]; colors: Record<string, string> };

function crest(c: Crest): Grid {
  return {
    rows: stamp(SHIELD, c.symbol, 3, 3),
    palette: {
      o: '#e3b04f',
      O: '#8f6420',
      f: c.field,
      F: c.dark,
      L: c.light,
      ...c.colors,
    },
  };
}

export type RaceId = 'citizens' | 'mountain' | 'forest' | 'border';

export const CRESTS: Record<RaceId, Grid> = {
  // Горожане: весы торгового люда.
  citizens: crest({
    field: '#7c1f2c', dark: '#5e1621', light: '#94303f',
    colors: { a: '#f4c770', b: '#b07d2a' },
    symbol: [
      '....aa....',
      '.aaaaaaaa.',
      '.b..aa..b.',
      'b.b.aa.b.b',
      'aaa.aa.aaa',
      '....aa....',
      '....aa....',
      '..aaaaaa..',
      '..bbbbbb..',
      '..........',
    ],
  }),
  // Подгорные: гора с жилами золота и алмаза.
  mountain: crest({
    field: '#3b4054', dark: '#2b2f3e', light: '#4c5269',
    colors: { a: '#a7abbc', A: '#7d8294', g: '#f4c770', d: '#7fe3e0' },
    symbol: [
      '..........',
      '....a.....',
      '...aaA....',
      '..aagaA...',
      '..aaaaAA..',
      '.aadaaaAA.',
      '.aaaaagAA.',
      'aaaaaaaaAA',
      '..........',
      '..........',
    ],
  }),
  // Лесной народ: ель.
  forest: crest({
    field: '#2b4a2a', dark: '#1f381e', light: '#3a6236',
    colors: { a: '#8fd06f', A: '#5a9a45', b: '#8a5a2b' },
    symbol: [
      '....aa....',
      '...aaAA...',
      '..aaaAAA..',
      '...aaAA...',
      '..aaaaAA..',
      '.aaaaaAAA.',
      '....bb....',
      '....bb....',
      '..........',
      '..........',
    ],
  }),
  // Пограничники: меч стражей Стены.
  border: crest({
    field: '#1f2230', dark: '#151722', light: '#2e3245',
    colors: { a: '#e2e5ec', A: '#8f96a8', g: '#e3b04f', h: '#8a5a2b' },
    symbol: [
      '....a.....',
      '....aA....',
      '....aA....',
      '....aA....',
      '....aA....',
      '....aA....',
      '..gggggg..',
      '....hh....',
      '....hh....',
      '....gg....',
    ],
  }),
};

/* ——— значки 12×12 ——— */
export type GlyphId =
  | 'pickaxe' | 'hoe' | 'axe' | 'rod' | 'sword' | 'skull' | 'darkheart'
  | 'coin' | 'pouch' | 'anvil' | 'house' | 'bed' | 'arena' | 'bread'
  | 'tome' | 'lantern' | 'shulker' | 'coal' | 'iron' | 'gold' | 'gem';

/** Кусок руды 12×12: тёмная кайма, тело, блики. Цвет задаётся палитрой. */
const LUMP = [
  '............',
  '....aaaa....',
  '..aabbbbaa..',
  '.abbcbbbbba.',
  '.abccbbbbba.',
  'abbbbbbcbbba',
  'abbbbbbbbbba',
  'abbcbbbbbdba',
  '.abbbbbbdba.',
  '..aabbbdaa..',
  '....aaaa....',
  '............',
];

const WOOD = { h: '#8a5a2b', H: '#5c3a19' };
const IRON = { i: '#e2e5ec', I: '#8f96a8' };

/** Монета: круг с каймой, блик слева сверху, тиснёный квадрат в центре. */
function coinRows(): string[] {
  const rows: string[] = [];
  for (let y = 0; y < 12; y++) {
    let row = '';
    for (let x = 0; x < 12; x++) {
      const d = Math.hypot(x + 0.5 - 6, y + 0.5 - 6);
      if (d > 5.6) row += '.';
      else if (d > 4.6) row += 'o';
      else if (x >= 5 && x <= 6 && y >= 4 && y <= 7) row += 'd';
      else if (x >= 4 && x <= 7 && y >= 5 && y <= 6) row += 'd';
      else if (x + y < 9) row += 'y';
      else row += 'g';
    }
    rows.push(row);
  }
  return rows;
}

export const GLYPHS: Record<GlyphId, Grid> = {
  pickaxe: {
    palette: { ...WOOD, ...IRON },
    rows: [
      '............',
      '...iiiii....',
      '..iI...Iii..',
      '.i.......Ii.',
      '........h.I.',
      '.......h..I.',
      '......h...I.',
      '.....h......',
      '....h.......',
      '...h........',
      '..H.........',
      '............',
    ],
  },
  hoe: {
    palette: { ...WOOD, ...IRON },
    rows: [
      '............',
      '....iiiih...',
      '....IIIhh...',
      '.......h....',
      '......h.....',
      '.....h......',
      '....h.......',
      '...h........',
      '..h.........',
      '.H..........',
      'H...........',
      '............',
    ],
  },
  axe: {
    palette: { ...WOOD, ...IRON },
    rows: [
      '............',
      '......iii...',
      '.....iiiIh..',
      '.....iiIhh..',
      '......IhI...',
      '......h.....',
      '.....h......',
      '....h.......',
      '...h........',
      '..h.........',
      '.H..........',
      '............',
    ],
  },
  rod: {
    palette: { ...WOOD, ...IRON, s: '#e8e2cf' },
    rows: [
      '.........hh.',
      '........h..s',
      '.......h...s',
      '......h....s',
      '.....h.....s',
      '....h......s',
      '...h.......s',
      '..h........s',
      '.h........Is',
      'H.........II',
      '..........I.',
      '............',
    ],
  },
  sword: {
    palette: { ...IRON, g: '#e3b04f', h: '#5c3a19' },
    rows: [
      '..........ii',
      '.........iiI',
      '........iiI.',
      '.......iiI..',
      '......iiI...',
      '.....iiI....',
      '..g.iiI.....',
      '...giI......',
      '....gg......',
      '...h..g.....',
      '..h.........',
      '.g..........',
    ],
  },
  skull: {
    palette: { b: '#d9d2bd', B: '#a39b84', d: '#0b0c10' },
    rows: [
      '............',
      '...bbbbbb...',
      '..bbbbbbbB..',
      '.bbbbbbbbbB.',
      '.bddbbbbddB.',
      '.bddbbbbddB.',
      '.bbbbddbbbB.',
      '..bbbbbbbB..',
      '...bdbdbB...',
      '...bbbbbB...',
      '............',
      '............',
    ],
  },
  darkheart: {
    palette: { a: '#12070f', b: '#5b1e5e', c: '#c98be0' },
    rows: [
      '............',
      '............',
      '..aaa...aaa.',
      '.acbba.abbba',
      '.abcbbabbbba',
      '.abbbbbbbbba',
      '..abbbbbbba.',
      '...abbbbba..',
      '....abbba...',
      '.....aba....',
      '......a.....',
      '............',
    ],
  },
  coin: {
    palette: { o: '#8f6420', g: '#e3b04f', y: '#f8d98f', d: '#b07d2a' },
    rows: coinRows(),
  },
  pouch: {
    palette: { b: '#8a5a2b', B: '#5c3a19', t: '#c9a46a', y: '#f4c770' },
    rows: [
      '............',
      '....tttt....',
      '.....tt.....',
      '....bbbb....',
      '...bbbbbB...',
      '..bbbbbbbB..',
      '..bbbyybbB..',
      '..bbyyyybB..',
      '..bbbyybbB..',
      '...bbbbbB...',
      '....BBBB....',
      '............',
    ],
  },
  anvil: {
    palette: { a: '#6b7080', A: '#3d404c', s: '#9aa0b2' },
    rows: [
      '............',
      '............',
      'sssssssss...',
      '.aaaaaaaaaaa',
      '...aaaaaaAA.',
      '.....aaAA...',
      '.....aaA....',
      '.....aaA....',
      '....aaaaA...',
      '...aaaaaaA..',
      '...AAAAAAA..',
      '............',
    ],
  },
  house: {
    palette: { r: '#a32c3c', R: '#7c1f2c', w: '#c9c2ad', W: '#9e977f', g: '#f4c770', d: '#5c3a19' },
    rows: [
      '............',
      '.....rR.....',
      '....rrRR....',
      '...rrrRRR...',
      '..rrrrRRRR..',
      '.rrrrrRRRRR.',
      '..wwwwwwwW..',
      '..wgwwwddW..',
      '..wwwwwddW..',
      '..wwwwwddW..',
      '..WWWWWWWW..',
      '............',
    ],
  },
  bed: {
    palette: { h: '#8a5a2b', H: '#5c3a19', p: '#ece4d0', r: '#c43a3a', R: '#8e2232' },
    rows: [
      '............',
      '............',
      '............',
      'h...........',
      'h...........',
      'hpp.........',
      'hpprrrrrrrr.',
      'hrrrrrrrrrrh',
      'hRRRRRRRRRRh',
      'hHHHHHHHHHHh',
      'h..........h',
      '............',
    ],
  },
  arena: {
    palette: { ...IRON, g: '#e3b04f', h: '#5c3a19' },
    rows: [
      'i..........i',
      'Ii........iI',
      '.Ii......iI.',
      '..Ii....iI..',
      '...Ii..iI...',
      '....IiiI....',
      '....iIIi....',
      '...gI..Ig...',
      '..g.g..g.g..',
      '.h........h.',
      'h..........h',
      '............',
    ],
  },
  bread: {
    palette: { a: '#c98a3c', A: '#8f5a20', y: '#e8b56a' },
    rows: [
      '............',
      '............',
      '............',
      '...aaaaaa...',
      '..ayyayyaa..',
      '.ayaayaayaA.',
      '.aaaaaaaaaA.',
      '.aaaaaaaaaA.',
      '..AAAAAAAA..',
      '............',
      '............',
      '............',
    ],
  },
  /** Зачарованная книга: фиолетовый переплёт, золотой знак, искры чар. */
  tome: {
    palette: { r: '#4a1a4f', R: '#7b3a8a', g: '#e3b04f', w: '#ece4d0', W: '#b9b09a', s: '#d6a8ec' },
    rows: [
      '..........s.',
      '..rrrrrrrw..',
      '..rRRRRRrw.s',
      '..rRRgRRrw..',
      '..rRgRgRrw..',
      '..rRRgRRrw..',
      's.rRRRRRrw..',
      '..rRRRRRrw..',
      '..rRRRRRrw..',
      '..rrrrrrrw.s',
      '...WWWWWWW..',
      '.s..........',
    ],
  },
  /** Фонарь: колпак, решётка, огонь внутри. */
  lantern: {
    palette: { a: '#8f96a8', A: '#3d404c', y: '#e3a03c', Y: '#ffe08a' },
    rows: [
      '.....aa.....',
      '....a..a....',
      '.....aa.....',
      '...AAAAAA...',
      '...A.yy.A...',
      '...AyYYyA...',
      '...AyYYyA...',
      '...AyYYyA...',
      '...A.yy.A...',
      '...AAAAAA...',
      '....aaaa....',
      '............',
    ],
  },
  /** Уголь. */
  coal: { palette: { a: '#050506', b: '#2b2b30', c: '#55555e', d: '#1a1a1e' }, rows: LUMP },
  /** Рудное железо. */
  iron: { palette: { a: '#6b5141', b: '#d8af93', c: '#f6e2d0', d: '#a8836b' }, rows: LUMP },
  /** Рудное золото. */
  gold: { palette: { a: '#8f6420', b: '#e3b04f', c: '#fff0a8', d: '#b07d2a' }, rows: LUMP },
  /** Алмаз: огранённый камень. */
  gem: {
    palette: { a: '#0e4f4b', b: '#4fe0d2', c: '#d6fff9', d: '#2aa59b' },
    rows: [
      '............',
      '...aaaaaa...',
      '..accbbbba..',
      '.accbbbbbba.',
      'abbbbbbbbbda',
      '.abbbbbbbda.',
      '..abbbbbda..',
      '...abbbda...',
      '....abda....',
      '.....aa.....',
      '............',
      '............',
    ],
  },
  /** Шалкер: ящик с крышкой. */
  shulker: {
    palette: { p: '#4a2b5c', P: '#a77fbb', Q: '#86599c', d: '#2a1735' },
    rows: [
      '............',
      '.pppppppppp.',
      '.pPPPPPPPPp.',
      '.pPPPPPPPPp.',
      '.pPPPPPPPPp.',
      '.dddddddddd.',
      '.pQQQQQQQQp.',
      '.pQQQPPQQQp.',
      '.pQQQQQQQQp.',
      '.pQQQQQQQQp.',
      '.pppppppppp.',
      '............',
    ],
  },
};
