/**
 * Жители края на сайте: карточка «Имя · дело» с пиксельной фигурой из настоящего скина NPC.
 * Кто есть кто — generated.json (npcs.places: имя, дело, где искать), какой скин — src/data/people.json
 * (scripts/people.py), картинки — public/people/<скин>.webp. В данных сайта они лежат в G.people (+ base).
 *
 * В гайде: абзац {{table:people выбор…}}, где выбор —
 *   id жителя (guide, bank_capital…)   одна карточка;
 *   r:начало-роли (r:station)          одна карточка на всех с такой ролью;
 *   p:место (p:market)                  все жители места, по карточке на дело.
 */

const cache = new WeakMap();

function index(G) {
  let m = cache.get(G);
  if (!m) {
    m = new Map();
    for (const place of G.npcs?.places ?? []) {
      for (const n of place.list) if (!m.has(n.id)) m.set(n.id, { ...n, place: place.id });
    }
    cache.set(G, m);
  }
  return m;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Житель по id: имя, короткое имя, дело, чем поможет, где искать, скин. Нет скина или жителя — null. */
export function person(G, id) {
  const skin = G.people?.npcs?.[id];
  const n = index(G).get(id);
  if (!skin || !n) return null;
  const words = String(n.name).split(' ');
  const short = words.length > 1 ? words[words.length - 1] : n.name;
  const job = words.length > 1 ? words.slice(0, -1).join(' ') : '';
  return { id, name: n.name, short, job: job.toLowerCase(), does: n.does, where: n.where, role: n.role, place: n.place, skin };
}

/** «Добромир · проводник». */
export const caption = (p) => (p.job ? `${p.short} · ${p.job}` : p.short);

export function skinSrc(G, skin) {
  const base = String(G.people?.base ?? '').replace(/\/+$/, '');
  return `${base}/people/${skin}.webp`;
}

/** Все жители места, по группам одного дела (порядок — как в конфиге). */
function byPlace(G, place) {
  const groups = new Map();
  for (const p of [...index(G).values()].filter((n) => n.place === place).map((n) => person(G, n.id)).filter(Boolean)) {
    const k = p.role.split('@')[0].split('/')[0];
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  return [...groups.values()];
}

/** Выбор из {{table:people …}} → группы жителей (группа из одного — обычная карточка). */
export function select(G, args) {
  const out = [];
  for (const a of args) {
    if (a.startsWith('p:')) {
      const g = byPlace(G, a.slice(2));
      if (!g.length) throw new Error(`people: нет жителей места «${a.slice(2)}»`);
      out.push(...g);
    } else if (a.startsWith('r:')) {
      const pre = a.slice(2);
      const list = [...index(G).values()].filter((n) => n.role === pre || n.role.startsWith(pre + ':') || n.role.startsWith(pre + '/')).map((n) => person(G, n.id)).filter(Boolean);
      if (!list.length) throw new Error(`people: нет жителей с ролью «${pre}»`);
      out.push(list);
    } else {
      const p = person(G, a);
      if (!p) throw new Error(`people: нет жителя «${a}» (или у него нет скина)`);
      out.push([p]);
    }
  }
  return out;
}

const names = (list) => {
  const shown = list.slice(0, 3).map((p) => p.short);
  const rest = list.length - shown.length;
  return rest > 0 ? `${shown.join(', ')} и ещё ${rest}` : shown.length > 1 ? `${shown.slice(0, -1).join(', ')} и ${shown[shown.length - 1]}` : shown[0];
};

/** HTML карточек для гайда (одной строкой: в Markdown это один блок). */
export function peopleHtml(G, groups) {
  const cards = groups.map((list) => {
    const skins = [...new Set(list.map((p) => p.skin))].slice(0, 4);
    const first = list[0];
    const title = list.length > 1 ? `${names(list)} · ${first.job}` : caption(first);
    const where = list.length === 1 && first.where ? `<span class="person__where">${esc(first.where)}</span>` : '';
    // группа — сеткой ячеек, как в инвентаре: две в ряд, недостающая ячейка остаётся пустой
    const cells = skins.length > 2 ? [...skins, ...Array(4 - skins.length).fill(null)] : skins;
    const slots = cells
      .map((s) =>
        s
          ? `<span class="person__slot"><img src="${esc(skinSrc(G, s))}" alt="" width="18" height="34" loading="lazy" decoding="async"></span>`
          : '<span class="person__slot"></span>',
      )
      .join('');
    return `<figure class="person${skins.length > 1 ? ' person--group' : ''}"><span class="person__slots" aria-hidden="true">${slots}</span><figcaption class="person__tip"><span class="person__name">${esc(title)}</span><span class="person__does">${esc(first.does)}</span>${where}</figcaption></figure>`;
  });
  return `<div class="people">${cards.join('')}</div>`;
}
