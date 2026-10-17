import type { Grid } from './pixel';

/** Знак сервера: цитадель с донжоном, знаменем и одним горящим окном. Сетка 16×16. */
export const MARK: Grid = {
  palette: { s: '#9a9eb0', r: '#5d6172', f: '#c9c2ad', w: '#b8323f', g: '#f4c770', d: '#0b0c10' },
  rows: [
    '................',
    '........f.......',
    '........fww.....',
    '........fw......',
    '.....s.ss.s.....',
    '.....sssssr.....',
    '.....ssgssr.....',
    '.s.s.sssssr.s.s.',
    '.ssssssssssssssr',
    '.ssssssssssssssr',
    '.sgsssssssssgssr',
    '.ssssssssssssssr',
    '.ssssssddssssssr',
    '.sssssddddsssssr',
    '.sssssddddsssssr',
    '.sssssddddsssssr',
  ],
};
