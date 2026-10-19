/**
 * Игровые числа для страниц сайта: generated.json (tools/gen_site_data.py) плюс сведения о сервере.
 * В astro.config.mjs то же самое собирается вручную — там нет Vite-импорта JSON.
 */
import G from '../data/generated.json';
import { SERVER } from '../config/site';
import { createFacts } from './facts.mjs';

export const DATA = { ...G, server: SERVER };
export const F = createFacts(DATA);
