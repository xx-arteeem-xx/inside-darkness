/**
 * Игровые данные для главной страницы. Источник правды — research/facts-1.8.md
 * (боевой конфиг плагина InsideDarkness 1.8.0) вместе с facts-1.7.md и facts-1.6.3.md:
 * что в новом файле не названо изменённым, берётся из предыдущего. Документация
 * в src/content/docs пишется по ним же: если что-то поменялось, правьте и там, и здесь.
 */
import type { GlyphId, RaceId } from '../lib/emblems';

export const START_COINS = 300;

/** Доход в час, монеты: оценки из facts-1.8. max: null — «от min», верхней границы нет. */
export interface Income {
  id: 'crafts' | 'dungeons' | 'dark';
  name: string;
  note: string;
  min: number;
  max: number | null;
}

export const INCOME: Income[] = [
  { id: 'crafts', name: 'Ремёсла', note: 'шахта, поле, сад, рыбалка; с рангами и заказами больше', min: 500, max: 1500 },
  { id: 'dungeons', name: 'Подземелья', note: 'мобы 1–8 уровня', min: 2000, max: 6000 },
  { id: 'dark', name: 'Тёмные земли', note: 'мобы 12–20 уровня, очень опасно', min: 10000, max: null },
];
/** Правый край шкалы дохода на главной. */
export const INCOME_MAX = 12000;
export const incomeText = (r: Income, fmt: (n: number) => string) =>
  r.max === null ? `от ${fmt(r.min)}` : `${fmt(r.min)}–${fmt(r.max)}`;

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
      'Огромный карьер под землёй, копать можно только в нём. Ломается всё, падает только руда.',
      'Обновляется каждые 5 минут, над экраном таймер. Руды стало примерно в 1,3 раза больше, в глубине — больше золота и алмазов.',
      'Скупщик у шахты берёт руду на месте за 75% рыночной цены.',
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
      'Урожай собирают только мотыгой и только спелый: пшеница, морковь, картофель, свёкла и другое.',
      'Грядки сами пересаживаются и растут в 5 раз быстрее обычного. Топтать нельзя.',
      'Скупщик у поля берёт урожай на месте за 75% рыночной цены.',
    ],
    sells: 'Пшеница 0,45 · свёкла 0,45 · тыква 1,5',
  },
  {
    id: 'garden',
    name: 'Сад',
    glyph: 'axe',
    where: 'юг',
    coords: '−170, 71, 207',
    facts: ['Большие деревья 2×2. Рубятся только деревья сада, постройки не трогаются.', 'Срубленные деревья вырастают заново.'],
    sells: 'Бревно 1,2 · яблоко 1,5',
  },
  {
    id: 'fishing',
    name: 'Рыбалка',
    glyph: 'rod',
    where: 'любая вода',
    facts: [
      'Ловить можно где угодно, нужна только удочка.',
      'С ранга Мастер в рыболовстве попадаются речные жемчужины. Рыбу и жемчуг берёт рыботорговец на рынке.',
    ],
    sells: 'Треска 2 · лосось 3 · иглобрюх 4 · тропическая 8 · жемчужина 120',
  },
];

export interface Race {
  id: RaceId;
  name: string;
  who: string;
  bonus: string[];
  fits: string;
}

/** Народы: выбираются у старейшины Велимира. Каждый даёт +25% опыта своему ремеслу и свой дар. */
export const RACES: Race[] = [
  { id: 'citizens', name: 'Горожане', who: 'Торговый люд столицы', bonus: ['+25% опыта торгового дела', '+5% к цене продажи'], fits: 'торговля и любое занятие' },
  { id: 'mountain', name: 'Подгорные', who: 'Рудокопы', bonus: ['+25% опыта горного дела', 'Постоянная Спешка I'], fits: 'шахта' },
  { id: 'forest', name: 'Лесной народ', who: 'Земледельцы и лесорубы', bonus: ['+25% опыта земледелия и лесного дела', '+10% двойного урожая и брёвен'], fits: 'поле и сад' },
  { id: 'border', name: 'Пограничники', who: 'Потомки стражей Стены', bonus: ['+25% опыта ратного дела', '+2 сердца'], fits: 'охота и ристалище' },
];

export const RACE_CHANGE = 1000;

/** Ранги мастеров, с 1-го по 5-й. */
export const RANKS = ['Ученик', 'Подмастерье', 'Мастер', 'Старший мастер', 'Великий мастер'] as const;

/** Накопленный опыт для рангов 2–5. Одинаков во всех ремёслах. */
export const RANK_XP = [500, 2500, 8000, 20000] as const;

/** Плата мастеру за ранги 2–5. */
export const RANK_FEE = [300, 1000, 3000, 8000] as const;
export const RANK_FEE_TRADE = [500, 1500, 4000, 10000] as const;

/** Ремёсла деревни мастеров. perks — что дают ранги, кратко; proof — проба на ранги 2–5. */
export interface Trade {
  id: string;
  name: string;
  glyph: GlyphId;
  master: string;
  where: string;
  xp: string;
  perks: string[];
  proof: string[];
  fee: readonly number[];
}

export const TRADES: Trade[] = [
  {
    id: 'mining',
    name: 'Горное дело',
    glyph: 'pickaxe',
    master: 'Рудокоп Гаврила',
    where: 'западная окраина',
    xp: 'руда в шахте: уголь 1 … алмаз 10',
    perks: [
      '+3…15% к цене руды, 5…20% двойной руды',
      'Мастер: Спешка в шахте, подгорным — Спешка II',
      'Старший мастер: Жилкоруб, выламывается вся жила',
      'Великий мастер: руда рядом подсвечивается',
    ],
    proof: ['32 рудного железа', '16 рудного золота и 32 рудного железа', '6 алмазов', '12 алмазов и 6 изумрудов'],
    fee: RANK_FEE,
  },
  {
    id: 'farming',
    name: 'Земледелие',
    glyph: 'hoe',
    master: 'Земледелица Любава',
    where: 'у большой фермы',
    xp: 'спелый урожай на поле',
    perks: [
      '+8…35% к цене урожая, 10…40% двойного урожая',
      'Мастер: мотыга собирает 3×3',
      'Старший мастер: мотыга на поле не тупится',
      'Великий мастер: соседние грядки дозревают при сборе',
    ],
    proof: ['128 пшеницы', '128 моркови и 128 картофеля', '64 тыквы и 128 ломтиков арбуза', '256 пшеницы и 128 свёклы'],
    fee: RANK_FEE,
  },
  {
    id: 'wood',
    name: 'Лесное дело',
    glyph: 'axe',
    master: 'Лесоруб Бажен',
    where: 'южная окраина',
    xp: 'брёвна деревьев сада',
    perks: [
      '+8…35% к цене брёвен, 10…40% двойных брёвен',
      'Мастер: Спешка в саду, топор в саду не тупится',
      'Великий мастер: дерево падает целиком, плюс яблоки',
    ],
    proof: ['128 брёвен', '256 брёвен', '512 брёвен и 16 яблок', '1024 бревна'],
    fee: RANK_FEE,
  },
  {
    id: 'fishing',
    name: 'Рыболовство',
    glyph: 'rod',
    master: 'Рыбак Сидор',
    where: 'у домика рыбака',
    xp: 'улов на удочку',
    perks: [
      '+8…35% к цене рыбы, 10…40% двойного улова',
      'Клюёт быстрее: на 15%, 30%, 40%, у Великого мастера вдвое',
      'С ранга Мастер — речные жемчужины, 3…8% улова',
    ],
    proof: ['32 трески', '32 лосося', '16 иглобрюхов', '16 тропических рыб'],
    fee: RANK_FEE,
  },
  {
    id: 'combat',
    name: 'Ратное дело',
    glyph: 'sword',
    master: 'Воевода Ратибор',
    where: 'въезд со стороны столицы',
    xp: 'твари с уровнем в подземельях и за Стеной',
    perks: [
      '+8…35% урона по тварям, +1…4 сердца',
      '+5…20% шанс трофея, +8…35% к цене трофеев и снаряжения',
      'Мастер: чары IV у чародея. Старший мастер: чары V и чары «Починка»',
      'Вампиризм: 5% у Старшего мастера, 10% у Великого',
    ],
    proof: ['10 Клыков упокоенного', '10 Ржавых медальонов', '8 Печатей склепа', '5 Венцов нежити и Реликвия древних'],
    fee: RANK_FEE,
  },
  {
    id: 'trade',
    name: 'Торговое дело',
    glyph: 'coin',
    master: 'Старшина купцов Евстигней',
    where: 'площадь у колокола',
    xp: 'продажи купцам, 1 опыт за 2 монеты',
    perks: [
      '+2…8% к цене у всех купцов',
      'Аренда жилья и поездки на ямских дешевле на 5…20%',
      'Сельские скупщики платят на 2…8% больше',
    ],
    proof: ['без пробы', 'без пробы', 'без пробы', 'без пробы'],
    fee: RANK_FEE_TRADE,
  },
];

/** Трофеи с мобов: берёт скупщик диковин на рынке. Речная жемчужина — улов, её берёт рыботорговец. */
export interface Trophy {
  name: string;
  levels: string;
  price: number;
  rare?: string;
}

export const TROPHIES: Record<'dungeons' | 'dark', Trophy[]> = {
  dungeons: [
    { name: 'Клык упокоенного', levels: '1–2', price: 50 },
    { name: 'Ржавый медальон', levels: '3–4', price: 100 },
    { name: 'Печать склепа', levels: '5–6', price: 180 },
    { name: 'Венец нежити', levels: '7–8', price: 300 },
    { name: 'Реликвия древних', levels: '1–8', price: 1200, rare: '3%' },
  ],
  dark: [
    { name: 'Осколок тьмы', levels: '12–15', price: 600 },
    { name: 'Эссенция бездны', levels: '16–20', price: 1200 },
    { name: 'Сердце тьмы', levels: '12–20', price: 5000, rare: '5%' },
  ],
};

export const PEARL_PRICE = 120;

/** Шанс, что с моба упадёт трофей. Ратное дело добавляет ещё +5…20%. */
export const TROPHY_CHANCE = { dungeons: '48–69%', dark: '60–76%', combat: '+5…20%' } as const;

/** Чародей: цена ступени N = база × N². Примеры из конфига. Ступени IV и V — по рангу мастера. */
export const ENCHANT = {
  sharpness: { name: 'Острота', base: 150 },
  examples: [
    { name: 'Защита IV, одна часть брони', need: 'Мастер в ратном деле', price: 2400 },
    { name: 'Бесконечность', need: 'Мастер в ратном деле', price: 3000 },
    { name: 'Починка', need: 'Старший мастер в любом ремесле', price: 4000 },
  ],
} as const;
export const enchantStep = (base: number, n: number) => base * n * n;

export const SHULKER_PRICE = 750;

/** Проводник Добромир у точки спавна: первые задания по порядку и награда за каждое. */
export const QUESTS = [
  { what: 'Продать что-нибудь купцу', reward: 15 },
  { what: 'Снять жильё', reward: 25 },
  { what: 'Выбрать народ', reward: 20 },
  { what: 'Купить снаряжение', reward: 10 },
  { what: 'Одолеть тварь в подземелье', reward: 40 },
] as const;

/** Скупщики у шахты и у поля платят такую долю от цены рынка. */
export const SITE_BUY_FACTOR = 0.75;

/**
 * Места на карте. dx/dz — смещение от центра столицы в блоках (восток +x, юг +z);
 * используется только для схемы. Координаты coords печатаются на сайте.
 * side — с какой стороны от точки ставить номер, если справа он на что-то налезает.
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
  kind?: 'village' | 'tavern';
  side?: 'left' | 'right';
  /** Есть ли у места ямская станция. */
  station?: boolean;
}

const CAPITAL = { x: -208, z: -88 };
const at = (x: number, z: number) => ({ x: x - CAPITAL.x, z: z - CAPITAL.z });
const xz = (x: number, z: number) => `${x}, ${z}`.replace(/-/g, '−');

export const PLACES: Place[] = [
  { n: 1, id: 'capital', name: 'Столица', dir: 'центр', what: 'Точка спавна и проводник. Ночлежка: комната за 20 монет в сутки.', x: 0, z: 0 },
  { n: 2, id: 'village', name: 'Деревня мастеров', dir: 'за южными воротами', what: 'Старейшина, староста Добрыня с заказами и домами, шесть мастеров ремёсел и знахарка-лекарь. Провожатый у въезда покажет, где кто.', ...at(-216, -6) },
  { n: 3, id: 'market', name: 'Центральный рынок', dir: 'восточнее столицы', coords: '−46, 69, 97', what: 'Купцы скупают добычу, кузнецы продают, скупают и чинят снаряжение, чародей зачаровывает. У входов — глашатаи.', ...at(-46, 97) },
  { n: 4, id: 'mine', name: 'Шахта', dir: 'запад', coords: '−365, 69, 34', what: 'Карьер с рудой, обновляется каждые 5 минут. Скупщик руды на месте.', ...at(-365, 34) },
  { n: 5, id: 'field', name: 'Поле', dir: 'запад', coords: '−510, 77, −13', what: 'Урожай мотыгой, растёт в 5 раз быстрее. Скупщик урожая на месте.', ...at(-510, -13) },
  { n: 6, id: 'garden', name: 'Сад', dir: 'юг', coords: '−170, 71, 207', what: 'Деревья 2×2 вырастают заново.', side: 'left' as const, ...at(-170, 207) },
  { n: 7, id: 'arena', name: 'Ристалище', dir: 'восток', coords: '505, 68, −304', what: 'PvP на монеты, вход от 100.', ...at(505, -304) },
].map((p) => ({ ...p, station: true }));

/** Деревни внутри стены с сельскими торговцами (кроме деревни мастеров у столицы). Координаты X, Z. */
const VILLAGE_LIST: Array<[name: string, x: number, z: number, side?: 'left' | 'right']> = [
  ['Равнинная деревня', -792, -100],
  ['Северная равнинная деревня', -806, -350],
  ['Деревня в саванне', -908, 72],
  ['Дальняя деревня в саванне', -1064, -290, 'left'],
  ['Пустынная деревня', -588, -806, 'left'],
  ['Деревня в джунглях', 320, 278, 'right'],
];

export const VILLAGES: Place[] = VILLAGE_LIST.map(([name, x, z, side], i) => ({
  n: PLACES.length + i + 1,
  id: `v${i + 1}`,
  name,
  dir: '',
  coords: xz(x, z),
  what: 'Староста с заказами и домами, скупщик и лавочник.',
  kind: 'village' as const,
  side,
  station: true,
  ...at(x, z),
}));

/** Таверны: по 5 комнат у трактирщика. Координаты X, Z. */
const TAVERN_LIST: Array<[name: string, x: number, z: number, side?: 'left' | 'right']> = [
  ['Дубовая таверна', -100, 345],
  ['Акациевая таверна', -961, -144, 'left'],
  ['Пустынная таверна', -631, -684],
  ['Таверна в джунглях', 66, 284, 'right'],
];

export const TAVERNS: Place[] = TAVERN_LIST.map(([name, x, z, side], i) => ({
  n: PLACES.length + VILLAGES.length + i + 1,
  id: `t${i + 1}`,
  name,
  dir: '',
  coords: xz(x, z),
  what: 'Таверна: 5 комнат по 15 монет в сутки.',
  kind: 'tavern' as const,
  side,
  ...at(x, z),
}));

/** Ямская служба. Координаты станций X, Z, примерные. */
export interface Station {
  id: string;
  name: string;
  where: string;
  x: number;
  z: number;
}

export const STATIONS: Station[] = [
  { id: 'capital', name: 'Столица', where: 'площадь у цитадели, точка спавна', x: -212, z: -104 },
  { id: 'market', name: 'Рынок', where: 'центральный рынок, у фонтана', x: -50, z: 94 },
  { id: 'central', name: 'Деревня мастеров', where: 'площадь у колокола', x: -288, z: 72 },
  { id: 'mine', name: 'Шахта', where: 'у входа в шахту', x: -360, z: 32 },
  { id: 'field', name: 'Поле', where: 'у таблички поля', x: -510, z: -16 },
  { id: 'garden', name: 'Сад', where: 'у западных ворот сада', x: -210, z: 192 },
  { id: 'arena', name: 'Ристалище', where: 'у южных ворот', x: 504, z: -266 },
  { id: 'west_plains', name: 'Равнинная деревня', where: 'запад', x: -796, z: -100 },
  { id: 'nw_plains', name: 'Северная равнинная деревня', where: 'северо-запад', x: -804, z: -352 },
  { id: 'jungle', name: 'Деревня в джунглях', where: 'юго-восток', x: 320, z: 280 },
  { id: 'savanna', name: 'Деревня в саванне', where: 'запад, у моря', x: -908, z: 76 },
  { id: 'desert', name: 'Пустынная деревня', where: 'север', x: -590, z: -806 },
  { id: 'far_savanna', name: 'Дальняя деревня в саванне', where: 'дальний запад', x: -1064, z: -288 },
];

/** Поездка: 5 + расстояние / 50 монет. Отправление через 3 с, станция открывается в 12 блоках. */
export const ROAD = { base: 5, perBlocks: 50, countdown: 3, unlockRadius: 12, hitLock: 10 } as const;
/** Примерная цена поездки без скидки (координаты станций приблизительные). */
export const fare = (a: Station, b: Station) => Math.round(ROAD.base + Math.hypot(a.x - b.x, a.z - b.z) / ROAD.perBlocks);

/** Почта у ямщиков: доставка = 5 + 2 за стопку + 2% от монет, до 9 стопок. */
export const MAIL = { base: 5, perStack: 2, coinShare: 0.02, maxStacks: 9 } as const;
export const mailFee = (stacks: number, coins: number) => MAIL.base + MAIL.perStack * stacks + MAIL.coinShare * coins;

/** Местный спрос у сельского скупщика: две темы в цене, одна не в цене. */
export const DEMAND = { hot: 1.4, cold: 0.7, hotCount: 2, coldCount: 1 } as const;

/** Жильё 1.8. */
export const HOMES_TOTAL = 133;
export const HOUSES_TOTAL = 93;
export const HOUSE_TIERS = [
  { label: 'Деревня мастеров', rent: 120, buy: 8000 },
  { label: 'Равнинная, Северная равнинная, Деревня в саванне', rent: 60, buy: 4000 },
  { label: 'Деревня в джунглях, Пустынная, Дальняя деревня в саванне', rent: 45, buy: 3000 },
] as const;
export const ROOMS = {
  inn: { rent: 20, count: 20 },
  tavern: { rent: 15, perTavern: 5, taverns: 4 },
} as const;

/** Заказы старост: 2 простых и 1 для мастеров в день в каждой из 7 деревень. */
export interface Order {
  what: string;
  reward: number;
  xp: number;
  craft: string;
  master?: boolean;
}

export const ORDERS: Order[] = [
  { what: '128 пшеницы', reward: 90, xp: 40, craft: 'земледелие' },
  { what: '192 моркови', reward: 50, xp: 40, craft: 'земледелие' },
  { what: '192 картофеля', reward: 50, xp: 40, craft: 'земледелие' },
  { what: '96 свёклы', reward: 65, xp: 40, craft: 'земледелие' },
  { what: '128 брёвен', reward: 230, xp: 40, craft: 'лесное дело' },
  { what: '64 угля', reward: 100, xp: 40, craft: 'горное дело' },
  { what: '32 рудного железа', reward: 150, xp: 50, craft: 'горное дело' },
  { what: '64 рудной меди', reward: 100, xp: 40, craft: 'горное дело' },
  { what: '16 трески', reward: 50, xp: 40, craft: 'рыболовство' },
  { what: '16 лосося', reward: 75, xp: 40, craft: 'рыболовство' },
  { what: '32 кости', reward: 100, xp: 30, craft: 'ратное дело' },
  { what: '32 нити', reward: 100, xp: 30, craft: 'ратное дело' },
  { what: '16 пороха', reward: 100, xp: 30, craft: 'ратное дело' },
  { what: 'одолеть 15 тварей', reward: 250, xp: 60, craft: 'ратное дело' },
  { what: '4 алмаза', reward: 260, xp: 150, craft: 'горное дело', master: true },
  { what: '24 рудного золота', reward: 260, xp: 120, craft: 'горное дело', master: true },
  { what: '64 тыквы', reward: 150, xp: 120, craft: 'земледелие', master: true },
  { what: '512 брёвен', reward: 900, xp: 150, craft: 'лесное дело', master: true },
  { what: '8 тропических рыб', reward: 110, xp: 120, craft: 'рыболовство', master: true },
  { what: '3 Печати склепа', reward: 800, xp: 150, craft: 'ратное дело', master: true },
  { what: 'одолеть 40 тварей', reward: 900, xp: 200, craft: 'ратное дело', master: true },
];

/** Сельские торговцы: скупщик платит такую долю от цены рынка. */
export const VILLAGE_BUY_FACTOR = 0.8;

export const WALL_R = 1000;
export const DARK_R = 1500;
