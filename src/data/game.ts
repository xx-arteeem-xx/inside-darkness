/**
 * Игровые данные для главной страницы. Источник правды — research/concept-1.6.md
 * (механики InsideDarkness 1.6.0). Документация в src/content/docs пишется по нему же:
 * если что-то поменялось, правьте и там, и здесь.
 */
import type { GlyphId, RaceId } from '../lib/emblems';

export const START_COINS = 300;

/** Доход в час, монеты. */
export const INCOME = [
  { id: 'crafts', name: 'Ремёсла', note: 'шахта, поле, сад, рыбалка', min: 400, max: 700 },
  { id: 'dungeons', name: 'Подземелья', note: 'мобы 1–8 уровня', min: 1000, max: 2500 },
  { id: 'dark', name: 'Тёмные земли', note: 'мобы 12–20 уровня, легко умереть', min: 3000, max: 6000 },
] as const;
export const INCOME_MAX = 6000;

export interface Craft {
  id: string;
  name: string;
  glyph: GlyphId;
  where: string;
  coords?: string;
  facts: string[];
  sells: string;
}

export const CRAFTS: Craft[] = [
  {
    id: 'mine',
    name: 'Шахта',
    glyph: 'pickaxe',
    where: 'запад',
    coords: '−365, 69, 34',
    facts: [
      'Огромный карьер под землёй, копать можно только в нём.',
      'Обновляется каждые 5 минут, над экраном таймер. Перед обновлением всех поднимает наверх.',
      'Чем глубже, тем больше золота и алмазов.',
    ],
    sells: 'Железо 3 · золото 7 · изумруд 30 · алмаз 40',
  },
  {
    id: 'field',
    name: 'Поле',
    glyph: 'hoe',
    where: 'запад',
    coords: '−510, 77, −13',
    facts: [
      'Урожай собирают мотыгой: пшеница, морковь, картофель, свёкла и другое.',
      'Грядки сами пересаживаются и растут в 2 раза быстрее. Топтать нельзя.',
    ],
    sells: 'Пшеница 0,3 · свёкла 0,3 · тыква 1',
  },
  {
    id: 'garden',
    name: 'Сад',
    glyph: 'axe',
    where: 'юг',
    coords: '−170, 71, 207',
    facts: ['Большие деревья 2×2.', 'Срубленные деревья вырастают заново.'],
    sells: 'Бревно 0,15 · яблоко 1',
  },
  {
    id: 'fishing',
    name: 'Рыбалка',
    glyph: 'rod',
    where: 'любая вода',
    facts: ['Ловить можно где угодно, нужна только удочка.', 'Рыбу берёт рыботорговец на рынке.'],
    sells: 'Треска 2 · лосось 3 · иглобрюх 4 · тропическая 8',
  },
];

export interface Race {
  id: RaceId;
  name: string;
  who: string;
  bonus: string[];
  fits: string;
}

export const RACES: Race[] = [
  { id: 'citizens', name: 'Горожане', who: 'Торговый люд столицы', bonus: ['+10% к цене продажи у купцов'], fits: 'любое занятие' },
  { id: 'mountain', name: 'Подгорные', who: 'Рудокопы', bonus: ['Постоянная Спешка I', '+10% шанс двойной руды'], fits: 'шахта' },
  { id: 'forest', name: 'Лесной народ', who: 'Земледельцы и лесорубы', bonus: ['+15% шанс двойного урожая и брёвен'], fits: 'поле и сад' },
  { id: 'border', name: 'Пограничники', who: 'Потомки стражей Стены', bonus: ['+2 сердца', '+10% урона'], fits: 'охота и ристалище' },
];

export const RACE_CHANGE = 1000;

export const MASTERS = [
  { master: 'Рудокоп', skill: 'Горное дело', per: '+6% шанс двойной руды' },
  { master: 'Земледелец', skill: 'Земледелие', per: '+8% шанс двойного урожая' },
  { master: 'Лесоруб', skill: 'Лесное дело', per: '+8% шанс двойных брёвен' },
  { master: 'Воевода', skill: 'Ратное дело', per: '+5% урона' },
  { master: 'Знахарка', skill: 'Стойкость', per: '+1 сердце' },
] as const;

/** Цена уровней навыка у мастера, по порядку с 1-го по 5-й. */
export const LEVEL_COSTS = [200, 500, 1200, 2500, 5000] as const;

/**
 * Места на карте. dx/dz — смещение от центра столицы в блоках (восток +x, юг +z);
 * используется только для схемы. Координаты coords — из концепта, печатаются на сайте.
 */
export interface Place {
  n: number;
  id: string;
  name: string;
  dir: string;
  coords?: string;
  what: string;
  x: number;
  z: number;
}

const CAPITAL = { x: -208, z: -88 };
const at = (x: number, z: number) => ({ x: x - CAPITAL.x, z: z - CAPITAL.z });

export const PLACES: Place[] = [
  { n: 1, id: 'capital', name: 'Столица', dir: 'центр', what: 'Ночлежка: комната за 20 монет в сутки.', x: 0, z: 0 },
  { n: 2, id: 'village', name: 'Деревня', dir: 'за южными воротами', what: 'Старейшина, староста и мастера.', ...at(-216, -6) },
  { n: 3, id: 'market', name: 'Центральный рынок', dir: 'восточнее столицы', coords: '−46, 69, 97', what: 'Купцы скупают добычу, NPC продают снаряжение.', ...at(-46, 97) },
  { n: 4, id: 'mine', name: 'Шахта', dir: 'запад', coords: '−365, 69, 34', what: 'Карьер с рудой, обновляется каждые 5 минут.', ...at(-365, 34) },
  { n: 5, id: 'field', name: 'Поле', dir: 'запад', coords: '−510, 77, −13', what: 'Урожай мотыгой, растёт в 2 раза быстрее.', ...at(-510, -13) },
  { n: 6, id: 'garden', name: 'Сад', dir: 'юг', coords: '−170, 71, 207', what: 'Деревья 2×2 вырастают заново.', ...at(-170, 207) },
  { n: 7, id: 'arena', name: 'Ристалище', dir: 'восток', coords: '505, 68, −304', what: 'PvP на монеты, вход от 100.', ...at(505, -304) },
];

export const WALL_R = 1000;
export const DARK_R = 1500;
