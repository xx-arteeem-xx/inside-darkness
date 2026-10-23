/**
 * Игровые числа на сайте. Данные — src/data/generated.json, его пишет tools/gen_site_data.py из боевого
 * config.yml плагина. Руками числа на сайт не вписываются: в Markdown — подстановки, в компонентах — data/game.ts.
 *
 * Подстановки в гайде:
 *   {{путь.в.json}}            значение; числа по-русски: 0,45 · 8000 · 20 000
 *   {{путь|фильтр:арг|…}}      pct 75% · plus +8% · x ×1,4 · int · r1 · list · range 40–90 · len · first · last
 *                              plural:монета,монеты,монет → «13 монет»
 *   {{table:имя аргумент}}     отдельной строкой — таблица целиком (TABLES ниже)
 *   {{table:people выбор…}}    отдельной строкой — карточки жителей со скинами (lib/people.mjs)
 * Неизвестный путь, фильтр или таблица — ошибка сборки: устаревшая страница не уедет на сайт.
 */

import { select, peopleHtml } from './people.mjs';

export const PH = /\{\{\s*([^{}]+?)\s*\}\}/g;
const NBSP = '\u00a0';

/** Число по-русски: десятичная запятая, пробел в тысячах с 10 000, минус — настоящий. */
export function fmt(n, digits = 2) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  const k = 10 ** digits;
  const r = Math.round(n * k) / k;
  const neg = r < 0;
  const a = Math.abs(r);
  let [int, frac] = String(a).split('.');
  if (a >= 10000) int = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return (neg ? '−' : '') + int + (frac ? ',' + frac : '');
}

export const pct = (n, digits = 2) => `${fmt(n * 100, digits)}%`;
export const plus = (n) => `+${pct(n)}`;
export const times = (n) => `×${fmt(n)}`;
export const range = (a, b) => (a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`);

export function plural(n, forms) {
  const v = Math.abs(Math.round(n));
  const [one, few, many] = forms;
  if (!Number.isInteger(n)) return few;
  if (v % 10 === 1 && v % 100 !== 11) return one;
  if (v % 10 >= 2 && v % 10 <= 4 && !(v % 100 >= 12 && v % 100 <= 14)) return few;
  return many;
}
export const count = (n, forms) => `${fmt(n)} ${plural(n, forms)}`;

/** Список по-русски: «а, б и в». */
export function and(list) {
  const a = list.filter(Boolean).map(String);
  if (a.length <= 1) return a.join('');
  return `${a.slice(0, -1).join(', ')} и ${a[a.length - 1]}`;
}

const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Markdown-таблица из заголовков и строк. */
export function mdTable(head, rows) {
  const line = (cells) => `| ${cells.map(esc).join(' | ')} |`;
  return [line(head), `|${head.map(() => '---').join('|')}|`, ...rows.map(line)].join('\n');
}

const CAT_ORDER = ['crops', 'fish', 'wood', 'ore', 'curio'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const roman = (n) => ROMAN[n - 1] ?? String(n);

const multCell = (v) => (Math.abs(v - 1) < 0.001 ? '×1' : times(v));
const ups = (list) => list.map((u) => `${u.cat} ${times(u.mult)}`).join(', ');

/**
 * Таблицы для {{table:имя аргумент}}. Каждая возвращает Markdown.
 * Ключи с двумя пробелами в начале строки — их же видит tools/gen_site_data.py --check.
 */
const TABLES = {
  buy: (G, cat) => {
    const b = G.market.buy[cat];
    if (!b) throw new Error(`нет купца «${cat}»`);
    const rows = b.rows.map((r) => [r.label, fmt(r.price)]);
    for (const t of b.trophies ?? []) {
      const tr = G.trophies.byId[t];
      if (tr && cat !== 'curio') rows.push([tr.name, fmt(tr.price)]);
    }
    return mdTable(['Товар', 'База, монет за штуку'], rows);
  },
  trophies: (G, from) => {
    const list = G.trophies.list.filter((t) => !from || t.from === from);
    const lv = (t) => (t.rare ? 'любой, редко' : t.levels ? `${range(t.levels[0], t.levels[1])}` : '—');
    if (from) return mdTable(['Уровень твари', 'Трофей', 'База'], list.map((t) => [lv(t), t.name, fmt(t.price)]));
    const where = { dungeon: 'подземелья', dark: 'тёмные земли', fish: 'улов мастера-рыбака' };
    return mdTable(
      ['Трофей', 'Откуда', 'База'],
      list.map((t) => [t.name, `${where[t.from] ?? ''}${t.levels ? `, ур. ${range(t.levels[0], t.levels[1])}` : t.rare ? ', редко' : ''}`, fmt(t.price)]),
    );
  },
  armor: (G) => {
    const s = G.market.shops.armor;
    const parts = ['Шлем', 'Нагрудник', 'Поножи', 'Сапоги'];
    const rows = s.rows.map((r) => {
      const by = Object.fromEntries(r.items.map((it) => [it.label, it.price]));
      const set = parts.reduce((n, p) => n + (by[p] ?? 0), 0);
      const lock = r.items.find((it) => it.rank)?.rank;
      return [r.row + (lock ? `, с ранга «${lock.name}»` : ''), ...parts.map((p) => (by[p] != null ? fmt(by[p]) : '—')), fmt(set)];
    });
    return mdTable(['Броня', ...parts, 'Комплект'], rows);
  },
  goods: (G, id) => {
    const s = G.market.shops[id];
    if (!s) throw new Error(`нет лавки «${id}»`);
    const lock = (it) => (it.rank ? `«${it.rank.name}» ${G.crafts.byId[it.rank.craft]?.gen ?? ''}` : '');
    const secs = (it) => {
      const e = (it.effects ?? []).map((x) => Number(String(x).split(':')[2] || 0)).find((x) => x > 0);
      if (!e) return '';
      return e >= 60 ? `${fmt(e / 60)} мин` : `${fmt(e)} с`;
    };
    const rows = s.rows.flatMap((r) => r.items.map((it) => [it.label, fmt(it.price), secs(it), lock(it)]));
    const head = ['Товар', 'Цена', 'Действует', 'Нужен ранг'];
    const keep = [0, 1, 2, 3].filter((i) => i < 2 || rows.some((r) => r[i]));
    return mdTable(keep.map((i) => head[i]), rows.map((r) => keep.map((i) => r[i] || '—')));
  },
  tools: (G) => {
    const s = G.market.shops.tools;
    const rows = s.rows.flatMap((r) =>
      r.items.map((it) => {
        const kind = { 'Кирки': 'кирка', 'Топоры': 'топор', 'Мотыги': 'мотыга', 'Лопаты': 'лопата' }[r.row];
        const label = kind ? `${it.label} ${kind}` : it.label;
        return [label, fmt(it.price), it.rank ? `«${it.rank.name}» ${G.crafts.byId[it.rank.craft]?.gen ?? ''}` : '—'];
      }),
    );
    return mdTable(['Товар', 'Цена', 'Нужен ранг'], rows);
  },
  village: (G) =>
    mdTable(
      ['Товар', 'В деревне', 'На рынке'],
      G.market.villageVsMarket.map((r) => [r.label, fmt(r.price), r.market != null ? fmt(r.market) : '—']),
    ),
  junk: (G) => {
    const j = G.market.junk;
    const rows = [['Мелочь, которая складывается в стопки', fmt(j.each)]];
    const by = {};
    for (const p of j.byPrefix) (by[p.price] ??= []).push(p.name.toLowerCase());
    for (const [price, names] of Object.entries(by).sort((a, b) => a[0] - b[0])) rows.push([`Вещь: ${names.join(', ')}`, fmt(Number(price))]);
    rows.push(['Прочие вещи, которые не складываются', fmt(j.single)]);
    rows.push(['Зачарованная вещь', fmt(j.enchanted)]);
    return mdTable(['Что', 'Цена за штуку'], rows);
  },
  lights: (G) => {
    const by = {};
    for (const l of G.lights) (by[l.level] ??= []).push(l.name);
    return mdTable(
      ['Что держишь', 'Яркость, из 15'],
      Object.entries(by)
        .sort((a, b) => b[0] - a[0])
        .map(([lv, names]) => [names.map((n, i) => (i ? n[0].toLowerCase() + n.slice(1) : n)).join(', '), fmt(Number(lv))]),
    );
  },
  repair: (G) => mdTable(['Материал или вещь', 'База'], G.repair.rows.map((r) => [r.name, fmt(r.base)])),
  gear: (G) =>
    mdTable(
      ['Вещь', 'Основа'],
      G.gear.examples.map((e) => [`${e.name[0].toUpperCase()}${e.name.slice(1)}, ${e.mob ? 'с твари' : 'изготовленный или купленный'}`, fmt(e.value)]),
    ),
  enchants: (G) =>
    mdTable(
      ['Чары', 'Для чего', 'База', 'Ступени'],
      G.enchanter.list.map((e) => [e.name, e.for, fmt(e.base), e.steps.map((s, i) => `${roman(i + 1)} ${fmt(s)}`).join(' · ')]),
    ),
  vedun: (G) =>
    mdTable(
      ['Чары', 'Для чего', 'Обычный предел', 'У ведуна'],
      G.vedun.enchants.map((e) => [e.name, e.for, roman(e.vanilla), `до ${roman(e.top)}`]),
    ),
  'vedun-prices': (G) =>
    mdTable(['Ступень сверх предела', 'Цена за каждые чары'], G.vedun.prices.map((p, i) => [`+${i + 1}`, fmt(p)])),
  ranks: (G) => {
    const r = G.ranks;
    return mdTable(
      ['Ранг', 'Опыт', 'Плата мастеру', 'Плата, торговое дело'],
      r.names.map((n, i) => [
        `${i + 1}. ${n}`,
        i === 0 ? 'начало пути' : fmt(r.xp[i]),
        i === 0 ? '—' : fmt(r.fee[i]),
        i === 0 ? '—' : fmt(r.feeTrade[i]),
      ]),
    );
  },
  perks: (G, id) => {
    const c = G.crafts.byId[id];
    if (!c) throw new Error(`нет ремесла «${id}»`);
    const proof = (i) => (c.proof[i]?.length ? c.proof[i].join(' и ') : 'без пробы');
    const join = (lines) => lines.reduce((acc, l) => (acc ? acc + (/^[А-ЯЁA-Z]/.test(l) ? '. ' : ', ') + l : l), '');
    const rows = G.ranks.names.slice(1).map((n, k) => [n, join(c.perks[k + 1]), proof(k + 1)]);
    return c.proof.slice(1).every((p) => !p.length) ? mdTable(['Ранг', 'Что даёт'], rows.map((r) => r.slice(0, 2))) : mdTable(['Ранг', 'Что даёт', 'Проба'], rows);
  },
  'craft-xp': (G) => {
    const x = G.xp;
    const ore = x.ore.map((o) => `${o.what} ${fmt(o.xp)}`).join(', ');
    return mdTable(
      ['Ремесло', 'За что', 'Сколько опыта'],
      [
        ['Горное дело', 'руда в карьере шахты', ore],
        ['Земледелие', 'урожай на поле', `${fmt(x.crop)} за спелую грядку, плод или колено × множитель культуры, см. [поле](crafts.md#поле)`],
        ['Лесное дело', 'брёвна деревьев сада', `${fmt(x.log)} за бревно`],
        ['Рыболовство', 'улов на удочку', `${fmt(x.fish)} за улов`],
        ['Ратное дело', 'твари с уровнем в подземельях и за Стеной', `${fmt(x.killPerLevel)} × уровень твари`],
        ['Торговое дело', 'продажи купцам', `1 за каждые ${count(x.tradeCoinsPerXp, ['монету', 'монеты', 'монет'])} выручки`],
      ],
    );
  },
  field: (G) =>
    mdTable(
      ['Культура', 'Как собирать', 'Опыт', 'База у зеленщика'],
      G.field.crops.map((c) => [c.name, c.how, fmt(c.xp), c.price != null ? fmt(c.price) : '—']),
    ),
  orders: (G, tier) => {
    const list = tier === 'master' ? G.orders.master : G.orders.simple;
    return mdTable(
      ['Заказ', 'Что нужно', 'Монет', 'Опыт'],
      list.map((o) => [o.label, o.what, fmt(o.reward), `${fmt(o.xp)}, ${o.craftName.toLowerCase()}`]),
    );
  },
  stations: (G) =>
    mdTable(
      ['Станция', 'Где', 'От столицы'],
      G.stations.list.map((s) => [s.name, s.where, s.fare == null ? 'открыта сразу' : `≈ ${fmt(s.fare)}`]),
    ),
  mail: (G) => mdTable(['Что в посылке', 'Доставка'], G.mail.examples.map((e) => [e.what, fmt(e.fee)])),
  homes: (G) =>
    mdTable(
      ['Деревня', 'Домов', 'В сутки', 'Навсегда'],
      G.homes.villages.map((v) => [v.name, fmt(v.count), range(v.rent, v.rentMax), range(v.price, v.priceMax)]),
    ),
  taverns: (G) =>
    mdTable(['Таверна', 'Комнат', 'В сутки'], G.homes.taverns.map((t) => [t.name, fmt(t.count), fmt(t.rent)])),
  villages: (G) =>
    mdTable(['Деревня', 'В какой стороне от столицы'], G.places.villages.map((v) => [v.name, v.where])),
  'chronicle-kinds': (G) => mdTable(['Вид места', 'Внутри Стены', 'За Стеной'], G.chronicle.kinds.map((k) => [k.name, fmt(k.reward), fmt(k.reward * G.chronicle.darkMult)])),
  'chronicle-special': (G) => mdTable(['Место', 'Внутри Стены'], G.chronicle.special.map((s) => [s.name, fmt(s.reward)])),
  titles: (G) => mdTable(['Мест', 'Звание', 'Награда'], G.chronicle.titles.map((t) => [fmt(t.count), t.title, fmt(t.bonus)])),
  regions: (G) =>
    mdTable(['Лист', 'Что на нём', 'Охват, блоков', 'Цена'], G.maps.regions.map((r) => [r.name, r.about, `${fmt(r.span)} × ${fmt(r.span)}`, fmt(r.price)])),
  treasures: (G) =>
    mdTable(
      ['Карта', 'Цена', 'Где клад', 'Что в кладе'],
      G.maps.treasures.map((t) => [
        t.name,
        fmt(t.price),
        `${t.zone === 'dark' ? 'за Стеной' : 'внутри Стены'}, ${range(t.minRadius, t.maxRadius)} блоков от столицы`,
        [`${range(t.coins[0], t.coins[1])} монет`, ...t.loot.map((l) => (l.chance >= 1 ? l.name : `${l.name} — ${pct(l.chance)}`))].join('; ') +
          (t.guards ? `; стерегут ${count(t.guards, ['страж', 'стража', 'стражей'])}` : ''),
      ]),
    ),
  bosses: (G) =>
    mdTable(
      ['Подземелье', 'Хозяин', 'Здоровье', 'Котёл монет', 'Опыт ратного дела', 'Свита'],
      G.bosses.list.map((b) => [b.dungeon, `${b.name}, ${b.type}`, fmt(b.hp), fmt(b.coins), fmt(b.xp), b.minions]),
    ),
  'raid-villages': (G) =>
    mdTable(['Деревня', 'В какой стороне'], G.raids.villages.map((v) => {
      const p = G.places.villages.find((x) => x.id === v.id);
      return [v.name, p?.where ?? '—'];
    })),
  news: (G) =>
    mdTable(
      ['Весть', 'Дороже', 'Дешевле'],
      G.demand.news.map((t) => [`**${t.title}.** ${t.text}`, ups(t.up) || '—', ups(t.down) || '—']),
    ),
  places: (G) =>
    mdTable(
      ['Где продаёшь', ...CAT_ORDER.map((c) => G.demand.names[c]), 'Почему'],
      G.demand.places.map((p) => [
        p.name,
        ...CAT_ORDER.map((c) => multCell(p.cells[c].mult)),
        p.fixed ? 'честная середина' : [...new Set(CAT_ORDER.map((c) => p.cells[c].why).filter(Boolean))].join(', ') || '—',
      ]),
    ),
  events: (G) => {
    const e = G.demand.events;
    const days = (d) => `${fmt(d)} ${plural(d, ['игровой день', 'игровых дня', 'игровых дней'])}`;
    const rows = [
      ['Набег на деревню', 'в этой деревне', [ups(e.raid.up) && `дороже: ${ups(e.raid.up)}`, ups(e.raid.down) && `дешевле: ${ups(e.raid.down)}`].filter(Boolean).join('; '), `пока идёт набег и ещё ${days(e.raid.afterDays)}`],
      ['Деревня не устояла', 'в этой деревне, когда торговцы откроются', [ups(e.fallen.up) && `дороже: ${ups(e.fallen.up)}`, ups(e.fallen.down) && `дешевле: ${ups(e.fallen.down)}`].filter(Boolean).join('; '), days(e.fallen.days)],
      ['Босс повержен', 'по всему миру', [ups(e.boss.up) && `дороже: ${ups(e.boss.up)}`, ups(e.boss.down) && `дешевле: ${ups(e.boss.down)}`].filter(Boolean).join('; '), days(e.boss.days)],
    ];
    return mdTable(['Событие', 'Где', 'Что с ценой', 'Сколько держится'], rows);
  },
  schemes: (G) =>
    mdTable(
      ['Товар', 'У угодья', 'Где дороже всего', 'Там', 'Выгода'],
      G.demand.schemes.map((x) => [
        x.itemName[0].toUpperCase() + x.itemName.slice(1),
        fmt(x.sitePrice, 3),
        x.place,
        fmt(x.placePrice, 3),
        times(x.gain),
      ]),
    ),
  npcs: (G, place) => {
    const p = G.npcs.byPlace[place];
    if (!p) throw new Error(`нет места «${place}» в npcs`);
    // одинаковые занятия (зеленщики, ямщики…) — одной строкой
    const by = new Map();
    for (const n of p.list) {
      const k = n.role.split('@')[0];
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(n);
    }
    // координат на сайте нет: только словесное «где», если оно есть в конфиге
    const where = (list) => [...new Set(list.map((n) => n.where).filter(Boolean))].join('; ') || '—';
    const rows = [...by.values()].map((list) => [list.map((n) => n.name).join(', '), list[0].does, where(list)]);
    return mdTable(['Кто', 'Чем поможет', 'Где искать'], rows);
  },
  masters: (G) =>
    mdTable(
      ['Ремесло', 'Мастер', 'Где в деревне', 'Опыт за что'],
      G.crafts.list.map((c) => [c.name, c.master, c.masterWhere || '—', c.how]),
    ),
  quests: (G) =>
    mdTable(
      ['Задание', 'Что сделать', 'Награда'],
      G.guide.steps.map((q, i) => [`${i + 1}. ${q.title}`, q.hint, fmt(q.reward)]).concat([['Всего', '', fmt(G.guide.total)]]),
    ),
  honor: (G) => mdTable(['Вкладка', 'Кто в ней'], G.honor.tabs.map((t) => [t.title, t.about])),
  bank: (G) => mdTable(['Ранг торгового дела', 'Мест в ячейке'], G.ranks.names.map((n, i) => [n, fmt(G.bank.slots[i])])),
  healer: (G) => mdTable(['Зелье', 'Цена'], G.market.shops.healer.rows.flatMap((r) => r.items.map((it) => [it.label, fmt(it.price)]))),
  races: (G) => mdTable(['Народ', 'Кто', 'Что даёт'], G.races.list.map((r) => [`**${r.name}**`, r.who, r.bonus])),
  people: (G, ...args) => peopleHtml(G, select(G, args)),
  sets: (G) => mdTable(['Комплект', 'Подземелье', 'Материал', 'За две части', 'За четыре'], G.sets.list.map((x) => [x.name, x.dungeon, x.material, x.two, x.four])),
  'quality-tiers': (G) =>
    mdTable(['Качество', 'Прибавок', 'Особых свойств'], Object.values(G.quality.tiers).map((t) => [t.name, fmt(t.bonuses), fmt(t.props)])),
  upgrade: (G) => {
    const M = { leather: 'Кожа', golden: 'Золото', chainmail: 'Кольчуга', iron: 'Железо', diamond: 'Алмаз', netherite: 'Незерит' };
    return mdTable(['Материал вещи', 'До Необычной', 'До Редкой'], Object.entries(G.quality.upgrade).map(([k, v]) => [M[k] ?? k, fmt(v.uncommon), fmt(v.rare)]));
  },
  named: (G) => mdTable(['Уровень твари', 'Материал', 'Качество'], G.named.tiers.map((t) => [t.to >= 99 ? `${fmt(t.from)} и выше` : range(t.from, t.to), t.material, t.quality])),
  'boss-named': (G) => mdTable(['Подземелье', 'Именная вещь хозяина'], G.bossLoot.named.map((x) => [x.dungeon, x.name])),
  halls: (G) => mdTable(['Подземелье', 'Залов до хозяина', 'Уровни тварей'], G.halls.list.map((h) => [h.dungeon, fmt(h.halls), range(h.from, h.to)])),
  darkness: (G) =>
    mdTable(
      ['Ступень', 'Голод', 'Тьма отнимает урона', 'Замедление'],
      G.darkness.tiers.map((t) => [t.name[0].toUpperCase() + t.name.slice(1), `−${fmt(t.hunger / 4, 1)} сытости в минуту`, pct(t.damage), t.slow ? pct(t.slow) : '—']),
    ),
  cook: (G) => mdTable(['Блюдо', 'Что даёт', 'Готовое', 'Из своих продуктов'], G.cook.dishes.map((d) => [d.name, d.about, fmt(d.price), fmt(d.work)])),
  reputation: (G) =>
    mdTable(
      ['Ступень', 'С заслуг', 'Что даёт'],
      G.reputation.tiers.map((t) => [
        t.name,
        fmt(t.from),
        [t.shop && `скидка у лавочника ${pct(t.shop)}`, t.tasks > 1 && `поручений в день: ${fmt(t.tasks)}`, t.home && `дом дешевле на ${pct(t.home)}`, t.special && 'особый товар у старосты', t.title && 'титул «Почётный житель…»']
          .filter(Boolean)
          .join(', ') || 'как всем',
      ]),
    ),
  feats: (G) => mdTable(['Подвиг', 'Как получить'], G.feats.list.map((f) => [f.name, f.about])),
  bestiary: (G) => mdTable(['Одолел тварей этого вида', 'Урон по ним'], G.bestiary.steps.map((b) => [fmt(b.kills), plus(b.bonus)])),
  deeds: (G, kind) =>
    mdTable(['Дело', 'Монет', 'Опыт'], (kind === 'weekly' ? G.deeds.weekly : G.deeds.daily).map((d) => [d.label, fmt(d.coins), fmt(d.xp)])),
  'errands-village': (G) => mdTable(['Поручение', 'Кто даёт', 'О чём'], G.errands.village.map((e) => [e.title, e.giver, e.about])),
  'errands-capital': (G) => mdTable(['Задание', 'Кто даёт', 'Монет'], G.errands.capital.map((e) => [e.title, e.giver, fmt(e.coins)])),
};

export const TABLE_NAMES = Object.keys(TABLES);

export function createFacts(G) {
  const get = (path) => {
    let cur = G;
    for (const part of path.split('.')) {
      if (cur != null && typeof cur === 'object' && part in cur) cur = cur[part];
      else if (Array.isArray(cur) && /^-?\d+$/.test(part)) cur = cur.at(Number(part));
      else throw new Error(`facts: в generated.json нет «${path}»`);
      if (cur === undefined) throw new Error(`facts: в generated.json нет «${path}»`);
    }
    return cur;
  };

  const FILTERS = {
    pct: (v) => pct(v),
    plus: (v) => plus(v),
    minus: (v) => `−${pct(v)}`,
    x: (v) => times(v),
    int: (v) => fmt(Math.round(v)),
    r1: (v) => fmt(v, 1),
    round: (v) => fmt(Math.round(v)),
    abs: (v) => fmt(Math.abs(v)),
    list: (v) => and(v.map((x) => (typeof x === 'number' ? fmt(x) : x))),
    range: (v) => range(v[0], v[v.length - 1]),
    len: (v) => fmt(v.length),
    first: (v) => v[0],
    last: (v) => v[v.length - 1],
    upper: (v) => String(v).charAt(0).toUpperCase() + String(v).slice(1),
    lcfirst: (v) => String(v).charAt(0).toLowerCase() + String(v).slice(1),
    plural: (v, arg) => count(typeof v === 'number' ? v : v.length, arg.split(',')),
  };

  const value = (expr) => {
    // в ячейках Markdown-таблиц фильтры пишут через \| — снимаем экранирование
    const [path, ...filters] = expr.replace(/\\\|/g, '|').split('|').map((s) => s.trim());
    let v = get(path);
    for (const f of filters) {
      const [name, ...rest] = f.split(':');
      const fn = FILTERS[name];
      if (!fn) throw new Error(`facts: неизвестный фильтр «${name}» в {{${expr}}}`);
      v = fn(v, rest.join(':'));
    }
    if (typeof v === 'number') return fmt(v);
    if (Array.isArray(v)) return and(v.map((x) => (typeof x === 'number' ? fmt(x) : x)));
    if (v === null || typeof v === 'object') throw new Error(`facts: {{${expr}}} — это не число и не строка`);
    return String(v);
  };

  const table = (spec) => {
    const [name, ...args] = spec.trim().split(/\s+/);
    const fn = TABLES[name];
    if (!fn) throw new Error(`facts: нет таблицы «${name}»`);
    return fn(G, ...args);
  };

  /** Раскрыть подстановки в тексте; таблицы — Markdown-текстом (для поиска и описаний). */
  const fill = (text) =>
    String(text ?? '').replace(PH, (_, e) => (e.trim().startsWith('table:') ? `\n\n${table(e.trim().slice(6))}\n\n` : value(e)));

  return { G, get, value, table, fill };
}
