/**
 * Панорама столицы ночью: морская стена, стены с башнями, цитадель из глубинносланцевого кирпича,
 * южные ворота, каменный мост и деревня. Рисунок настроения, а не план города.
 * Холст 1600×640, сетка 4 px. Всё собрано из прямоугольников и склеено в пути по цветам.
 */
import { rectsPath, rng, type Rect } from '../pixel';

export const W = 1600;
export const H = 640;

type Bag = Map<string, Rect[]>;
const bag = (): Bag => new Map();
const put = (b: Bag, key: string, ...rects: Rect[]) => {
  if (!b.has(key)) b.set(key, []);
  b.get(key)!.push(...rects);
};
const paths = (b: Bag) => [...b.entries()].map(([key, rects]) => ({ key, d: rectsPath(rects) }));

/** Зубцы по верху стены. */
function merlons(b: Bag, key: string, x0: number, x1: number, y: number, h = 16, w = 12, step = 24) {
  for (let x = x0; x + w <= x1; x += step) put(b, key, [x, y - h, w, h]);
}

/** Ступенчатый конус крыши башни. */
function cone(b: Bag, key: string, rim: string, x: number, w: number, base: number, step = 4, rise = 12) {
  let i = 0;
  while (w - 2 * i * step > 0) {
    const cx = x + i * step;
    const cw = w - 2 * i * step;
    put(b, key, [cx, base - (i + 1) * rise, cw, rise]);
    put(b, rim, [cx + cw - step, base - (i + 1) * rise, step, rise]);
    i++;
  }
  return base - i * rise;
}

/** Двускатная ступенчатая крыша дома. */
function gable(b: Bag, key: string, rim: string, x: number, w: number, base: number, step = 8, rise = 8) {
  let i = 0;
  while (w - 2 * i * step > 0) {
    const cx = x + i * step;
    const cw = w - 2 * i * step;
    put(b, key, [cx, base - (i + 1) * rise, cw, rise]);
    put(b, rim, [cx + cw - 4, base - (i + 1) * rise, 4, rise]);
    i++;
  }
}

export function buildCapital() {
  const far = bag();
  const back = bag();
  const front = bag();
  const fore = bag();
  // окна зажигаются группами при загрузке; факелы мерцают тремя группами
  const win: Rect[][] = [[], [], [], [], []];
  const dark: Rect[] = [];
  const torches: Array<{ x: number; y: number; g: number }> = [];
  const r = rng(1017);

  // ——— дальний план: два хребта и море ———
  let x = 0;
  let y = 452;
  while (x < W) {
    const w = 24 + Math.round(r() * 5) * 8;
    y = Math.max(404, Math.min(476, y + (Math.round(r() * 4) - 2) * 8));
    put(far, 'ridge2', [x, y, w, H - y]);
    x += w;
  }
  x = 0;
  y = 492;
  while (x < W) {
    const w = 32 + Math.round(r() * 6) * 8;
    y = Math.max(468, Math.min(516, y + (Math.round(r() * 4) - 2) * 8));
    put(far, 'ridge1', [x, y, w, H - y]);
    x += w;
  }
  // море слева
  put(far, 'sea', [0, 516, 460, H - 516]);
  for (let row = 524; row < H; row += 12) {
    for (let wx = (row / 4) % 40; wx < 460; wx += 40 + Math.round(r() * 3) * 16) {
      put(far, 'wave', [wx, row, 8 + Math.round(r() * 2) * 8, 4]);
    }
  }

  // ——— город за стеной ———
  // дома между башнями: крыши выглядывают над стеной
  const houses: Array<[number, number, number, 'roofW' | 'roofS']> = [
    [440, 48, 444, 'roofS'], [492, 40, 452, 'roofW'], [536, 32, 440, 'roofS'],
    [704, 40, 448, 'roofW'], [748, 48, 436, 'roofS'], [800, 24, 452, 'roofW'],
    [1124, 48, 444, 'roofS'], [1176, 40, 452, 'roofW'],
  ];
  for (const [hx, hw, top, roof] of houses) {
    put(back, 'house', [hx, top, hw, 476 - top]);
    gable(back, roof, roof === 'roofW' ? 'roofWrim' : 'roofSrim', hx - 4, hw + 8, top);
    if (r() > 0.35) win[Math.floor(r() * 5)].push([hx + 8 + Math.floor((r() * (hw - 20)) / 4) * 4, top + 8, 8, 8]);
    put(back, 'house', [hx + hw - 16, top - 24, 8, 16]); // труба
  }
  // храм с колокольней
  put(back, 'house', [604, 420, 80, 56]);
  gable(back, 'roofS', 'roofSrim', 600, 88, 420, 8, 8);
  put(back, 'temple', [616, 368, 28, 52]);
  put(back, 'templeRim', [640, 368, 4, 52]);
  cone(back, 'roofW', 'roofWrim', 612, 36, 368, 4, 10);
  put(back, 'pole', [628, 296, 4, 24]);
  put(back, 'pole', [622, 304, 16, 4]);
  win[2].push([626, 384, 8, 16]);
  win[4].push([652, 436, 8, 12], [668, 436, 8, 12]);

  // ——— цитадель: пиршественный и большой зал, казармы, донжон ———
  // большой зал
  put(back, 'deep', [820, 360, 128, 116]);
  gable(back, 'roofW', 'roofWrim', 812, 144, 360, 8, 8);
  for (let wx = 836; wx < 940; wx += 24) win[(wx / 24) % 5 | 0].push([wx, 372, 8, 20]);
  // казармы
  put(back, 'deep', [1088, 384, 88, 92]);
  gable(back, 'roofS', 'roofSrim', 1080, 104, 384, 8, 8);
  for (let wx = 1100; wx < 1170; wx += 20) (r() > 0.4 ? win[3] : dark).push([wx, 400, 8, 8]);
  // донжон
  const dj = { x: 956, w: 128, top: 148 };
  put(back, 'deep', [dj.x, dj.top, dj.w, 476 - dj.top]);
  put(back, 'deepRim', [dj.x + dj.w - 6, dj.top, 6, 476 - dj.top]);
  merlons(back, 'deep', dj.x, dj.x + dj.w, dj.top, 16, 12, 22);
  // пояса по фасаду
  for (const by of [236, 324]) put(back, 'deepBand', [dj.x - 4, by, dj.w + 8, 4]);
  // угловые башенки
  for (const tx of [dj.x - 12, dj.x + dj.w - 20]) {
    put(back, 'deep', [tx, 100, 32, 140]);
    put(back, 'deepRim', [tx + 28, 100, 4, 140]);
    cone(back, 'roofW', 'roofWrim', tx - 4, 40, 100, 4, 13);
    win[1].push([tx + 12, 132, 8, 16]);
  }
  // окна донжона: верхний ряд и тронный зал горят ярче
  const djCols = [984, 1012, 1048];
  [180, 260, 348, 420].forEach((wy, row) => {
    djCols.forEach((wx, col) => {
      const lit = (row + col) % 3 !== 1 || row === 1;
      (lit ? win[(row + col) % 5] : dark).push([wx, wy, 8, row === 1 ? 24 : 16]);
    });
  });
  // древко и знамя
  put(back, 'pole', [1018, 44, 4, 104]);
  put(back, 'flag', [1022, 48, 40, 24]);
  put(back, 'flag', [1022, 72, 32, 8]);
  put(back, 'flagRim', [1022, 48, 40, 4]);
  // стена цитадели во дворе
  put(back, 'deep', [800, 424, 392, 52]);
  merlons(back, 'deep', 800, 1192, 424, 12, 12, 24);

  // ——— стены и башни ———
  const tower = (tx: number, tw: number, top: number, roof: 'cone' | 'crown' | 'coneS', base = 600) => {
    put(front, 'wall', [tx, top, tw, base - top]);
    put(front, 'rim', [tx + tw - 6, top, 6, base - top]);
    put(front, 'shade', [tx, top, 4, base - top]);
    if (roof === 'crown') {
      put(front, 'wall', [tx - 4, top - 4, tw + 8, 8]);
      merlons(front, 'wall', tx - 4, tx + tw + 4, top - 4, 12, 12, tw > 50 ? 20 : 18);
      torches.push({ x: tx + tw / 2 - 2, y: top - 30, g: torches.length % 3 });
    } else {
      put(front, 'wall', [tx - 4, top - 8, tw + 8, 8]);
      cone(front, roof === 'cone' ? 'roofW' : 'roofS', roof === 'cone' ? 'roofWrim' : 'roofSrim', tx - 4, tw + 8, top - 8, 4, 12);
    }
    // бойницы и окно
    put(front, 'slit', [tx + tw / 2 - 2, top + 28, 4, 16]);
    if (r() > 0.4) win[Math.floor(r() * 5)].push([tx + tw / 2 - 4, top + 72, 8, 12]);
    else put(front, 'slit', [tx + tw / 2 - 2, top + 76, 4, 16]);
  };

  // морская стена в воде
  put(front, 'wall', [110, 468, 280, 132]);
  merlons(front, 'wall', 110, 390, 468, 14, 12, 24);
  put(front, 'wallTop', [110, 468, 280, 4]);
  tower(108, 48, 420, 'crown');
  tower(236, 48, 412, 'coneS');
  // основная стена
  put(front, 'wall', [436, 476, 760, 124]);
  merlons(front, 'wall', 436, 1196, 476, 16, 12, 24);
  put(front, 'wallTop', [436, 476, 760, 4]);
  tower(372, 64, 380, 'cone');
  tower(560, 56, 404, 'crown');
  tower(720, 56, 396, 'coneS');
  tower(904, 48, 424, 'crown');
  tower(1070, 48, 428, 'crown');
  // южные ворота: две башни, надвратная часть, арка с решёткой
  tower(1180, 56, 384, 'cone');
  tower(1292, 56, 384, 'cone');
  put(front, 'wall', [1236, 440, 56, 160]);
  merlons(front, 'wall', 1236, 1292, 440, 12, 12, 22);
  put(front, 'gate', [1248, 532, 32, 68]);
  put(front, 'gate', [1252, 524, 24, 8]);
  put(front, 'gate', [1256, 520, 16, 4]);
  for (let gx = 1252; gx < 1280; gx += 8) put(front, 'grate', [gx, 520, 2, 56]);
  for (let gy = 536; gy < 580; gy += 12) put(front, 'grate', [1248, gy, 32, 2]);
  // знамёна у ворот
  for (const bx of [1224, 1294]) {
    put(front, 'flag', [bx, 456, 10, 44]);
    put(front, 'flag', [bx + 2, 500, 6, 4]);
    put(front, 'banner', [bx + 3, 468, 4, 4]);
  }
  torches.push({ x: 1240, y: 506, g: 0 }, { x: 1284, y: 506, g: 1 });
  // факелы по стене
  for (const tx of [176, 330, 470, 664, 836, 1010, 1150]) {
    torches.push({ x: tx, y: tx < 400 ? 438 : 446, g: torches.length % 3 });
  }

  // ——— передний план: вода, берег, мост, деревня ———
  put(fore, 'water', [0, 580, 440, 60]);
  for (let row = 588; row < H; row += 10) {
    for (let wx = (row / 2) % 32; wx < 440; wx += 48 + Math.round(r() * 2) * 16) put(fore, 'wave', [wx, row, 16, 2]);
  }
  // берег перед стеной: неровный край из блоков
  x = 420;
  while (x < 1360) {
    const w = 16 + Math.round(r() * 4) * 8;
    const top = 588 + Math.round(r() * 2) * 4;
    put(fore, 'ground', [x, top, w, H - top]);
    put(fore, 'grass', [x, top, w, 4]);
    x += w;
  }
  // кусты
  for (const [bx, bw] of [[468, 40], [612, 24], [780, 48], [980, 32], [1120, 40]]) {
    put(fore, 'bush', [bx, 572, bw, 20], [bx + 8, 564, bw - 16, 8]);
  }
  // река под мостом
  put(fore, 'water', [1348, 604, 252, 36]);
  for (let wx = 1352; wx < W; wx += 28) put(fore, 'wave', [wx, 616 + ((wx / 28) % 2) * 8, 12, 2]);
  // мост: настил, парапет, опоры с арками
  const bx0 = 1348;
  const bx1 = 1508;
  put(fore, 'bridge', [bx0, 584, bx1 - bx0, 20]);
  put(fore, 'bridgeRim', [bx0, 584, bx1 - bx0, 4]);
  for (let px = bx0; px < bx1; px += 16) put(fore, 'bridge', [px, 576, 8, 8]);
  for (const ax of [bx0 + 8, bx0 + 64, bx0 + 120]) {
    put(fore, 'bridge', [ax, 604, 16, 36]);
    put(fore, 'bridgeRim', [ax + 12, 604, 4, 36]);
  }
  // мостовые арки: тёмные проёмы над водой
  for (const ax of [bx0 + 24, bx0 + 80]) {
    put(fore, 'arch', [ax, 604, 40, 4], [ax + 4, 608, 32, 4]);
  }
  // деревня на холме за мостом
  put(fore, 'ground', [1500, 572, 100, 68]);
  put(fore, 'grass', [1500, 572, 100, 4]);
  put(fore, 'ground', [1492, 584, 8, 56]);
  for (const [hx, hw, top] of [[1512, 40, 540], [1560, 48, 532]]) {
    put(fore, 'cottage', [hx, top, hw, 572 - top]);
    gable(fore, 'roofW', 'roofWrim', hx - 4, hw + 8, top, 8, 8);
    win[4].push([hx + 12, top + 12, 8, 8]);
    put(fore, 'cottage', [hx + hw - 12, top - 28, 8, 16]);
  }
  torches.push({ x: 1500, y: 548, g: 2 });
  // факел у начала моста
  torches.push({ x: 1352, y: 556, g: 1 });

  // ——— небо: звёзды ———
  const sky: Rect[] = [];
  const skyBright: Rect[] = [];
  for (let i = 0; i < 110; i++) {
    const sx = Math.floor(r() * 400) * 4;
    const sy = Math.floor(Math.pow(r(), 1.5) * 150) * 4;
    const big = r() > 0.88;
    (big ? skyBright : sky).push([sx, sy, big ? 3 : 2, big ? 3 : 2]);
  }

  return {
    far: paths(far),
    back: paths(back),
    front: paths(front),
    fore: paths(fore),
    windows: win.map((g) => rectsPath(g)),
    dark: rectsPath(dark),
    torches,
    sky: rectsPath(sky),
    skyBright: rectsPath(skyBright),
  };
}
