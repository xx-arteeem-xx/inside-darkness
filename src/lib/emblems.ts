/**
 * Пиксельные гербы рас и знаки классов. Цвета и символы — рисунок, а не данные из игры.
 * Свойства рас и классов, которые показываются рядом, взяты из документации (src/content/docs).
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

export type RaceId =
  | 'aetherian' | 'dunesworn' | 'endling' | 'frostborne' | 'moonshroud'
  | 'netherian' | 'oakhearted' | 'orebringer' | 'palehearted' | 'turtlekin';

export const CRESTS: Record<RaceId, Grid> = {
  aetherian: crest({
    field: '#3a6aa3', dark: '#2c5384', light: '#4f80bb',
    colors: { a: '#f1f4f8', b: '#9cb3cc' },
    symbol: [
      '..........',
      'a........a',
      'aa......aa',
      '.aa....aa.',
      '.aaa..aaa.',
      '..aaaaaa..',
      '...abba...',
      '....bb....',
      '....b.....',
      '..........',
    ],
  }),
  dunesworn: crest({
    field: '#a8752a', dark: '#87591b', light: '#bf8b3a',
    colors: { a: '#fde7a8', b: '#5e3a12' },
    symbol: [
      '....a....',
      '.a.....a.',
      '...aaa...',
      '..aaaaa..',
      'a.aaaaa.a',
      '.........',
      'bb.....bb',
      '..bbbbb..',
      '.........',
      'bbb...bbb',
    ],
  }),
  endling: crest({
    field: '#2a2141', dark: '#1d1630', light: '#382c55',
    colors: { a: '#1b6a54', b: '#42c79b', c: '#0a2620', w: '#d2fff0' },
    symbol: [
      '..........',
      '...aaaa...',
      '..abbbba..',
      '.awbccbba.',
      '.abccccba.',
      '.abccccba.',
      '.abbccbba.',
      '..abbbba..',
      '...aaaa...',
      '..........',
    ],
  }),
  frostborne: crest({
    field: '#5b88a6', dark: '#466f8b', light: '#6f9cba',
    colors: { a: '#f4fbff', b: '#bfe0f2' },
    symbol: [
      '....a....',
      '.a..a..a.',
      '..a.a.a..',
      '...aaa...',
      'aaaabaaaa',
      '...aaa...',
      '..a.a.a..',
      '.a..a..a.',
      '....a....',
    ],
  }),
  moonshroud: crest({
    field: '#262c57', dark: '#1b2045', light: '#333a6b',
    colors: { a: '#ebe6d6', b: '#a6a3b6', c: '#f4c770' },
    symbol: [
      '..aaaa....',
      '.aaab.....',
      'aaab......',
      'aaa.....c.',
      'aaa....ccc',
      'aaa.....c.',
      'aaab......',
      '.aaab.....',
      '..aaaa....',
    ],
  }),
  netherian: crest({
    field: '#6a1a1c', dark: '#521214', light: '#7e2426',
    colors: { a: '#e3542a', b: '#f59b3b', c: '#ffe48f' },
    symbol: [
      '....a.....',
      '....aa....',
      '...aaa..a.',
      '..aabaa.a.',
      '..abbbaaa.',
      '.aabbbbaa.',
      '.abbcbbba.',
      '.abccccba.',
      '..abccba..',
      '...aaaa...',
    ],
  }),
  oakhearted: crest({
    field: '#2b4f29', dark: '#203d1f', light: '#386335',
    colors: { a: '#6b4423', b: '#8d5d31', c: '#d6aa64', e: '#f0d39a', d: '#3e2611' },
    symbol: [
      '....d.....',
      '....dd....',
      '..aaaaaa..',
      '.aaaaaaaa.',
      '.abababba.',
      '..cccccc..',
      '..cecccc..',
      '..cccccc..',
      '...cccc...',
      '....cc....',
    ],
  }),
  orebringer: crest({
    field: '#454953', dark: '#353841', light: '#555a66',
    colors: { a: '#1b6c72', b: '#57d7d1', c: '#e2fffc' },
    symbol: [
      '..........',
      '..aaaaaa..',
      '.abbcbbba.',
      'abccbbbbba',
      '.abbbbbba.',
      '..abbbba..',
      '...abba...',
      '....aa....',
      '..........',
    ],
  }),
  palehearted: crest({
    field: '#33362f', dark: '#272922', light: '#41453c',
    colors: { a: '#dcdcd2', b: '#9a9a8f', c: '#f28a26' },
    symbol: [
      '..aaaaaa..',
      '.aaaaaaaa.',
      'aaaaaaaaaa',
      '.aaaaaaaa.',
      '..bbbbbb..',
      '..bcbbcb..',
      '..bbbbbb..',
      '...bbbb...',
      '..bb..bb..',
      '.bb....bb.',
    ],
  }),
  turtlekin: crest({
    field: '#1d4767', dark: '#153652', light: '#285a80',
    colors: { a: '#86c46f', b: '#3f8d3b', c: '#2a5f28' },
    symbol: [
      '....aa....',
      '....aa....',
      '.a.bbbb.a.',
      '..bcbbcb..',
      '..bbccbb..',
      '..bcbbcb..',
      '..bbbbbb..',
      '.a.bbbb.a.',
      '....aa....',
      '..........',
    ],
  }),
};

/* ——— знаки классов 12×12 ——— */
export type ClassId =
  | 'builder' | 'survivor' | 'miner' | 'rancher' | 'archer'
  | 'fighter' | 'hermit' | 'bard' | 'cleric' | 'scout';

const WOOD = { h: '#8a5a2b', H: '#5c3a19' };
const IRON = { i: '#e2e5ec', I: '#8f96a8' };

export const GLYPHS: Record<ClassId, Grid> = {
  builder: {
    palette: { ...WOOD, ...IRON },
    rows: [
      '............',
      '..iiiiiiii..',
      '..iiiiiiiI..',
      '..IIIIIIII..',
      '.....hh.....',
      '.....hH.....',
      '.....hH.....',
      '.....hH.....',
      '.....hH.....',
      '.....hH.....',
      '.....HH.....',
      '............',
    ],
  },
  survivor: {
    palette: { a: '#4a0d14', b: '#cf3a3a', c: '#f6a2a2' },
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
  miner: {
    palette: { ...WOOD, ...IRON },
    rows: [
      '............',
      '...iiiii....',
      '..I.....ii..',
      '.........Ii.',
      '........h.I.',
      '.......h..I.',
      '......h...I.',
      '.....h......',
      '....h.......',
      '...H........',
      '..H.........',
      '............',
    ],
  },
  rancher: {
    palette: { i: '#c9ccd6', I: '#7d8394', d: '#2a2c35' },
    rows: [
      '............',
      '..iii..iii..',
      '.iIIi..iIIi.',
      '.iId....dIi.',
      '.iI......Ii.',
      '.iId....dIi.',
      '.iI......Ii.',
      '..iI....Ii..',
      '..iiI..Iii..',
      '...iiiiii...',
      '....iiii....',
      '............',
    ],
  },
  archer: {
    palette: { ...WOOD, s: '#e8e2cf', f: '#e2e5ec', r: '#b8323f' },
    rows: [
      '............',
      '...hhh......',
      '..h...s.....',
      '.h.....s....',
      '.h......s...',
      'h.ffffffffr.',
      'h.......sr..',
      '.h.....s....',
      '.h....s.....',
      '..h..s......',
      '...hhh......',
      '............',
    ],
  },
  fighter: {
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
  hermit: {
    palette: { m: '#3d3f4a', M: '#666a78', g: '#ffd27a', o: '#eda33c' },
    rows: [
      '.....MM.....',
      '....M..M....',
      '....mmmm....',
      '...mMMMMm...',
      '...mgoogm...',
      '...mogggm...',
      '...mgoogm...',
      '...mgggom...',
      '...mMMMMm...',
      '....mmmm....',
      '............',
      '............',
    ],
  },
  bard: {
    palette: { a: '#e6dcc0', b: '#a99d7d', c: '#6e6450' },
    rows: [
      '............',
      '.........aa.',
      '........aab.',
      '.......aab..',
      '......aab...',
      '.....aab....',
      '....aaab....',
      '..aaaabb....',
      '.caaabb.....',
      '.ccbbb......',
      '..cc........',
      '............',
    ],
  },
  cleric: {
    palette: { g: '#cfd8e3', c: '#8a5a2b', p: '#d84b6f', P: '#9a2a4a', w: '#ffd0dc' },
    rows: [
      '.....cc.....',
      '.....gg.....',
      '.....gg.....',
      '....g..g....',
      '...g....g...',
      '..gppppppg..',
      '..gpwpppPg..',
      '..gppppPPg..',
      '..gpppPPPg..',
      '...gPPPPg...',
      '....gggg....',
      '............',
    ],
  },
  scout: {
    palette: { a: '#8f96a8', b: '#2b2d37', r: '#d9434f', w: '#e2e5ec' },
    rows: [
      '............',
      '....aaaa....',
      '...abbbba...',
      '..abbbbrba..',
      '.abbbbrbbba.',
      '.abbbwbbbba.',
      '.abbbwbbbba.',
      '.abbwbbbbba.',
      '..abwbbbba..',
      '...abbbba...',
      '....aaaa....',
      '............',
    ],
  },
};
