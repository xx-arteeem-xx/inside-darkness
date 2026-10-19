/**
 * Игровые данные для главной и компонентов. Числа здесь не пишутся руками: всё берётся из generated.json,
 * который собирает tools/gen_site_data.py из боевого config.yml плагина (и пары выражений в его коде).
 * Здесь — только раскладка для вёрстки: какой значок у ремесла, как подписать строку, что с чем сложить.
 * Документация берёт те же данные подстановками {{...}}: см. lib/facts.mjs.
 */
import type { GlyphId, RaceId } from '../lib/emblems';
import { DATA, F } from '../lib/site-facts';
import { fmt, pct, plus, times, range, count, roman } from '../lib/facts.mjs';

export { fmt, pct, plus, times, range, count, roman, F };
export const G = DATA;

export const START_COINS: number = G.start.coins;
export const WALL_R: number = G.world.wallRadius;
export const DARK_R: number = G.world.borderRadius;

/* ——— проводник ——— */
export const QUESTS = G.guide.steps.map((s) => ({ what: s.title, reward: s.reward as number, event: s.event }));
export const QUEST_TOTAL: number = G.guide.total;

/* ——— народы ——— */
const RACE_CREST: Record<string, RaceId> = { townsfolk: 'citizens', deepfolk: 'mountain', woodfolk: 'forest', wardens: 'border' };
const RACE_FITS: Record<string, string> = {
  townsfolk: 'торговля и любое занятие',
  deepfolk: 'шахта',
  woodfolk: 'поле и сад',
  wardens: 'охота и ристалище',
};
export interface Race {
  id: RaceId;
  name: string;
  who: string;
  bonus: string[];
  fits: string;
}
export const RACES: Race[] = G.races.list.map((r) => ({
  id: RACE_CREST[r.id] ?? 'citizens',
  name: r.name,
  who: r.who[0].toUpperCase() + r.who.slice(1),
  bonus: r.bonus.split(', '),
  fits: RACE_FITS[r.id] ?? '',
}));
export const RACE_CHANGE: number = G.races.change;

/* ——— ранги и ремёсла ——— */
export const RANKS: string[] = G.ranks.names;
export const RANK_XP: number[] = G.ranks.xp.slice(1);
export const RANK_FEE: number[] = G.ranks.fee.slice(1);
export const RANK_FEE_TRADE: number[] = G.ranks.feeTrade.slice(1);

const CRAFT_GLYPH: Record<string, GlyphId> = { mining: 'pickaxe', farming: 'hoe', wood: 'axe', fishing: 'rod', combat: 'sword', trade: 'coin' };
const span = (a: number[], f: (n: number) => string) => `${f(a[1])}…${f(a[a.length - 1])}`;
const pctN = (n: number) => fmt(n * 100);
const eff = G.effects as Record<string, number[]>;

/** Особые умения рангов: вторые строки «что даёт» из конфига, с названием ранга. */
function specials(perks: string[][]): string[] {
  const out: string[] = [];
  perks.forEach((lines, i) => {
    const extra = lines.slice(1).filter((l) => !/^\+?\d/.test(l));
    if (i >= 2 && extra.length) out.push(`${RANKS[i]} — ${extra.join(', ')}`);
  });
  return out;
}

export interface Trade {
  id: string;
  name: string;
  glyph: GlyphId;
  master: string;
  where: string;
  xp: string;
  perks: string[];
}
export const TRADES: Trade[] = G.crafts.list.map((c) => {
  const perks: string[] = [];
  if (c.id === 'combat') {
    perks.push(`+${span(eff['combat-damage'], pctN)}% урона по тварям, +${span(G.effects.combatHearts, fmt)} сердца`);
    perks.push(`+${span(eff['combat-trophy'], pctN)}% шанс трофея, +${span(c.sell, pctN)}% к цене снаряжения`);
  } else if (c.id === 'trade') {
    perks.push(`+${span(eff['trade-sell'], pctN)}% к цене у всех купцов`);
    perks.push(`аренда и поездки дешевле на ${span(eff['trade-rent'], pctN)}%, сельские скупщики +${span(eff['trade-village'], pctN)}%`);
    perks.push(`ячейка в банке: от ${fmt(G.bank.slots[0])} до ${fmt(G.bank.slots[G.bank.slots.length - 1])} мест`);
  } else {
    const dbl = c.double.some((d) => d > 0) ? `, ${span(c.double, pctN)}% двойной добычи` : '';
    perks.push(`+${span(c.sell, pctN)}% к цене своего товара${dbl}`);
  }
  if (c.id !== 'trade') perks.push(...specials(c.perks));
  return {
    id: c.id,
    name: c.name,
    glyph: CRAFT_GLYPH[c.id] ?? 'anvil',
    master: c.master,
    where: c.masterWhere,
    xp: c.how,
    perks,
  };
});

/* ——— угодья ——— */
const price = (id: string) => G.market.price[id];
export interface Craft {
  id: string;
  name: string;
  glyph: GlyphId;
  where: string;
  coords?: string;
  facts: string[];
  sells: string;
}
const site = pct(G.market.siteFactor);
export const CRAFTS: Craft[] = [
  {
    id: 'mine',
    name: 'Шахта',
    glyph: 'pickaxe',
    where: 'запад',
    coords: G.places.mine.coords,
    facts: [
      'Огромный карьер под землёй, копать можно только в нём. Ломается всё, падает только руда.',
      `Обновляется каждые ${count(G.mine.periodMinutes, ['минуту', 'минуты', 'минут'])}, над экраном таймер. В глубине ценной руды больше: ${fmt(G.mine.richDeep)}% блоков против ${fmt(G.mine.richUpper)}% наверху.`,
      `${G.npcs.who.mineBuyer.name} берёт руду на месте за ${site} базы.`,
    ],
    sells: `Железо ${fmt(price('RAW_IRON'))} · золото ${fmt(price('RAW_GOLD'))} · изумруд ${fmt(price('EMERALD'))} · алмаз ${fmt(price('DIAMOND'))}`,
  },
  {
    id: 'field',
    name: 'Поле',
    glyph: 'hoe',
    where: 'запад',
    coords: G.places.field.coords,
    facts: [
      `${count(G.field.count, ['культура', 'культуры', 'культур'])}: грядки, тыквы и арбузы, тростник, бамбук, кактус, адский нарост, какао, ягоды.`,
      `Всё растёт само и в ${fmt(G.field.growth)} раз быстрее обычного, собранное пересаживается. Топтать нельзя.`,
      `${G.npcs.who.fieldBuyer.name} берёт урожай на месте за ${site} базы.`,
    ],
    sells: `Пшеница ${fmt(price('WHEAT'))} · тыква ${fmt(price('PUMPKIN'))} · факельник ${fmt(price('TORCHFLOWER'))}`,
  },
  {
    id: 'garden',
    name: 'Сад',
    glyph: 'axe',
    where: 'юг',
    coords: G.places.orchard.coords,
    facts: [
      'Большие деревья. Рубятся только деревья сада, постройки не трогаются.',
      `Раз в ${count(G.orchard.periodMinutes, ['минуту', 'минуты', 'минут'])} сад снова целый, всех выводят к воротам.`,
      `${G.npcs.who.orchardBuyer.name} берёт брёвна у ворот за ${site} базы.`,
    ],
    sells: `Бревно ${fmt(price('OAK_LOG'))} · яблоко ${fmt(price('APPLE'))}`,
  },
  {
    id: 'fishing',
    name: 'Рыбалка',
    glyph: 'rod',
    where: 'любая вода',
    facts: [
      'Ловить можно где угодно, нужна только удочка.',
      `С ранга «${RANKS[2]}» в рыболовстве попадаются речные жемчужины. Рыбу и жемчуг скупают рыботорговцы на рынке.`,
    ],
    sells: `Треска ${fmt(price('COD'))} · лосось ${fmt(price('SALMON'))} · тропическая ${fmt(price('TROPICAL_FISH'))} · жемчужина ${fmt(G.trophies.byId.pearl.price)}`,
  },
];

/* ——— трофеи ——— */
export interface Trophy {
  name: string;
  levels: string;
  price: number;
  rare?: string;
}
const trophyRow = (id: string, rare?: number): Trophy => {
  const t = G.trophies.byId[id];
  return { name: t.name, levels: t.levels ? range(t.levels[0], t.levels[1]) : '', price: t.price, rare: rare != null ? pct(rare) : undefined };
};
export const TROPHIES: Record<'dungeons' | 'dark', Trophy[]> = {
  dungeons: [...G.trophies.list.filter((t) => t.from === 'dungeon' && !t.rare).map((t) => trophyRow(t.id)), trophyRow('relic', G.trophies.chance.dungeon.rare)],
  dark: [...G.trophies.list.filter((t) => t.from === 'dark' && !t.rare).map((t) => trophyRow(t.id)), trophyRow('heart', G.trophies.chance.dark.rare)],
};
export const TROPHY_CHANCE = {
  dungeons: `${pct(G.trophies.chance.dungeon.min)}–${pct(G.trophies.chance.dungeon.max)}`,
  dark: `${pct(G.trophies.chance.dark.min)}–${pct(G.trophies.chance.dark.max)}`,
  combat: `+${pctN(G.trophies.chance.combat.min)}…${pct(G.trophies.chance.combat.max)}`,
};
export const LEVELS = {
  dungeons: range(G.mobs.dungeonLevels[0], G.mobs.dungeonLevels[1]),
  dark: range(G.mobs.darkLevels[0], G.mobs.darkLevels[1]),
};

/* ——— места ——— */
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
  station?: boolean;
}
const C = G.world.center;
const rel = (x: number, z: number) => ({ x: x - C.x, z: z - C.z });
const P = G.places;
export const PLACES: Place[] = [
  { n: 1, id: 'capital', name: 'Столица', dir: 'центр', coords: P.capital.coords, what: `Цитадель, проводник и первые задания, ночлежка, банк, доска почёта, ведун. Летописец — в библиотеке к западу от площади.`, x: 0, z: 0 },
  { n: 2, id: 'village', name: 'Деревня мастеров', dir: 'за южными воротами', coords: P.village.coords, what: 'Старейшина и народы, мастера ремёсел, староста с заказами и домами, знахарка, картограф.', ...rel(P.village.x, P.village.z) },
  { n: 3, id: 'market', name: 'Центральный рынок', dir: 'восточнее столицы', coords: P.market.coords, what: 'Купцы по темам, лавки снаряжения, чародеи, шорник и заморский гость. У входов — глашатаи.', ...rel(P.market.x, P.market.z) },
  { n: 4, id: 'mine', name: 'Шахта', dir: 'запад', coords: P.mine.coords, what: `Карьер с рудой, обновляется каждые ${count(G.mine.periodMinutes, ['минуту', 'минуты', 'минут'])}.`, ...rel(P.mine.x, P.mine.z) },
  { n: 5, id: 'field', name: 'Поле', dir: 'запад', coords: P.field.coords, what: `${count(G.field.count, ['культура', 'культуры', 'культур'])}, растёт в ${fmt(G.field.growth)} раз быстрее.`, ...rel(P.field.x, P.field.z) },
  { n: 6, id: 'garden', name: 'Сад', dir: 'юг', coords: P.orchard.coords, what: `Раз в ${count(G.orchard.periodMinutes, ['минуту', 'минуты', 'минут'])} снова целый.`, side: 'left', ...rel(P.orchard.x, P.orchard.z) },
  { n: 7, id: 'arena', name: 'Ристалище', dir: 'восток', coords: P.arena.coords, what: `Поединки на монеты, ставка ${fmt(G.arena.stake)}.`, ...rel(P.arena.x, P.arena.z) },
].map((p) => ({ ...p, station: true }));

const SIDE: Record<string, 'left' | 'right'> = { far_savanna: 'left', desert: 'left', jungle: 'right', acacia_west: 'left', jungle_t: 'right' };
export const VILLAGES: Place[] = G.places.villages.map((v, i) => ({
  n: PLACES.length + i + 1,
  id: `v-${v.id}`,
  name: v.name,
  dir: v.where,
  coords: v.xz,
  what: 'Скупщик, лавочник, староста с заказами и домами, ямщик.',
  kind: 'village' as const,
  side: SIDE[v.id],
  station: true,
  ...rel(v.x, v.z),
}));
export const TAVERNS: Place[] = G.homes.taverns.map((t, i) => ({
  n: PLACES.length + VILLAGES.length + i + 1,
  id: `t-${t.id}`,
  name: t.name,
  dir: '',
  coords: `${fmt(t.x)}, ${fmt(t.z)}`,
  what: `${count(t.count, ['комната', 'комнаты', 'комнат'])} по ${fmt(t.rent)} монет в сутки.`,
  kind: 'tavern' as const,
  side: SIDE[t.id === 'jungle' ? 'jungle_t' : t.id],
  ...rel(t.x, t.z),
}));

/* ——— дороги ——— */
export const STATIONS = G.stations.list;
export const ROAD = G.stations;
export const MAIL = G.mail;

/* ——— жильё ——— */
export const HOMES = G.homes;

/* ——— граница ——— */
export const BOSSES = G.bosses.list;
export const BOSS = G.bosses;
export const RAID = G.raids;

/* ——— чары ——— */
export const ENCHANT = G.enchanter;
