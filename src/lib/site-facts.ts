/**
 * Игровые числа для страниц сайта: generated.json (tools/gen_site_data.py) плюс сведения о сервере.
 * В astro.config.mjs то же самое собирается вручную — там нет Vite-импорта JSON.
 */
import G from '../data/generated.json';
import people from '../data/people.json';
import { SERVER } from '../config/site';
import { createFacts } from './facts.mjs';

export const DATA = { ...G, server: SERVER, people: { ...people, base: import.meta.env.BASE_URL.replace(/\/+$/, '') } };
export const F = createFacts(DATA);
