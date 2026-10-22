/**
 * Карта края: данные из src/data/map.json (собирает scripts/map/render.py из копии мира и config.yml).
 * Позиции меток и линия Стены — доли стороны карты (0…1), север сверху. Мировых координат здесь нет.
 */
import data from '../data/map.json';
import { GLYPHS, type GlyphId } from './emblems';
import { gridLayers } from './pixel';

export const MAP = data;
export type MapMarker = (typeof data.markers)[number];
export type MapLayer = (typeof data.layers)[number];

/** Значок слоя: пиксельный предмет 12×12. */
export const LAYER_GLYPH: Record<string, GlyphId> = {
  settlements: 'house',
  stations: 'horseshoe',
  grounds: 'pickaxe',
  dungeons: 'skull',
  taverns: 'bed',
  arena: 'arena',
};

/** Цвет рамки метки по слою — из палитры края. */
export const LAYER_TONE: Record<string, string> = {
  settlements: '#f0c066',
  stations: '#b9bfcc',
  grounds: '#83c493',
  dungeons: '#e0606c',
  taverns: '#eda33c',
  arena: '#c08af5',
};

export function glyphSvg(id: GlyphId, cls = ''): string {
  const g = GLYPHS[id];
  const w = Math.max(...g.rows.map((r) => r.length));
  const h = g.rows.length;
  const paths = gridLayers(g)
    .map((l) => `<path fill="${l.fill}" d="${l.d}"/>`)
    .join('');
  return `<svg class="${cls}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">${paths}</svg>`;
}

/** Линия Стены для <polygon points>. */
export const WALL_POINTS = data.wall.map(([u, v]) => `${u},${v}`).join(' ');

/** Дата снимка мира из имени копии (full-ГГГГММДД-ЧЧММ) — «23.10.2026». */
export function sourceDate(): string | null {
  const m = String(data.source ?? '').match(/(\d{4})(\d{2})(\d{2})/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : null;
}

export function countBy(layer: string): number {
  return data.markers.filter((m) => m.layer === layer).length;
}
