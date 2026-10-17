/**
 * Пиксельная графика без лишних узлов DOM.
 * Сетка задаётся строками: символ = цвет из палитры, «.» = пусто.
 * Соседние пиксели одного цвета склеиваются в полосы, все полосы цвета идут одним <path>.
 */
export type Grid = { rows: string[]; palette: Record<string, string> };
export type Rect = [x: number, y: number, w: number, h: number];
export type Layer = { fill: string; d: string };

/** Прямоугольники в одну строку пути. */
export function rectsPath(rects: Rect[]): string {
  return rects.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}z`).join('');
}

/** Сетку в слои по цветам. scale и смещение позволяют рисовать сетку внутри большой картинки. */
export function gridLayers(grid: Grid, scale = 1, ox = 0, oy = 0): Layer[] {
  const byColor = new Map<string, Rect[]>();
  grid.rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      const fill = grid.palette[ch];
      if (ch === '.' || !fill) {
        x++;
        continue;
      }
      let w = 1;
      while (row[x + w] === ch) w++;
      if (!byColor.has(fill)) byColor.set(fill, []);
      byColor.get(fill)!.push([ox + x * scale, oy + y * scale, w * scale, scale]);
      x += w;
    }
  });
  return [...byColor.entries()].map(([fill, rects]) => ({ fill, d: rectsPath(rects) }));
}

/** Детерминированный генератор: картинка не меняется от сборки к сборке. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Наложить символ на основу: в символе «.» прозрачна. */
export function stamp(base: string[], symbol: string[], ox: number, oy: number): string[] {
  const out = base.map((r) => r.split(''));
  symbol.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const yy = oy + y;
      const xx = ox + x;
      if (out[yy] && out[yy][xx] !== undefined) out[yy][xx] = ch;
    });
  });
  return out.map((r) => r.join(''));
}
