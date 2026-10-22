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
