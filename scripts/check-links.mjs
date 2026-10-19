#!/usr/bin/env node
/**
 * Проверка ссылок по собранному dist/: каждая внутренняя ссылка ведёт на существующую страницу или файл,
 * а #якорь есть на целевой странице. Внешние ссылки не трогаем.
 *   node scripts/check-links.mjs        (после npm run build)
 * Код выхода 1 — есть битые ссылки.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = '/inside-darkness';

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk(ROOT).filter((p) => p.endsWith('.html'));
const ids = new Map();
const idsOf = (file) => {
  if (!ids.has(file)) {
    const html = readFileSync(file, 'utf-8');
    ids.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return ids.get(file);
};

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};
const unescape = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

let bad = 0;
let checked = 0;
for (const page of pages) {
  // ссылки внутри <script> — шаблоны JS, а не адреса
  const html = readFileSync(page, 'utf-8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
  const pageUrl = '/' + relative(ROOT, page).replace(/index\.html$/, '').replace(/\\/g, '/');
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let href = unescape(m[1]);
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) continue; // внешние, mailto:, data:
    checked++;
    let [path, frag = ''] = href.split('#');
    path = path.split('?')[0];
    let file;
    if (path === '') {
      file = page;
    } else {
      if (!path.startsWith('/')) path = new URL(path, 'http://x' + BASE + pageUrl).pathname;
      path = decode(path);
      if (!path.startsWith(BASE + '/') && path !== BASE) {
        console.log(`${pageUrl}: ссылка мимо base: ${href}`);
        bad++;
        continue;
      }
      const rel = path.slice(BASE.length) || '/';
      const cands = [join(ROOT, rel), join(ROOT, rel, 'index.html')];
      file = cands.find((c) => existsSync(c) && statSync(c).isFile());
      if (!file) {
        console.log(`${pageUrl}: нет страницы ${href}`);
        bad++;
        continue;
      }
    }
    if (frag && file.endsWith('.html')) {
      const id = decode(frag);
      if (!idsOf(file).has(id)) {
        console.log(`${pageUrl}: нет якоря #${id} в ${relative(ROOT, file)}`);
        bad++;
      }
    }
  }
}
console.log(`страниц: ${pages.length}, ссылок проверено: ${checked}, битых: ${bad}`);
process.exit(bad ? 1 : 0);
