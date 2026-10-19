// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { readFileSync } from 'node:fs';
import { rehypeDocs } from './src/lib/rehype-docs.mjs';
import { remarkFacts } from './src/lib/remark-facts.mjs';

// Игровые числа документации — из generated.json (tools/gen_site_data.py по config.yml плагина).
const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf-8'));
const server = json('./src/config/server.json');
const facts = {
  ...json('./src/data/generated.json'),
  server: { ...server, versions: `${server.versionFrom}–${server.versionTo}` },
};

const base = '/inside-darkness';

export default defineConfig({
  site: 'https://xx-arteeem-xx.github.io',
  base,
  trailingSlash: 'ignore',
  // CSS встраивается в страницу: на медленном канале до GitHub Pages это на один-два запроса меньше.
  build: { format: 'directory', inlineStylesheets: 'always' },
  devToolbar: { enabled: false },
  // Страницы документации до 2.0 переехали: старые ссылки ведут на новые.
  redirects: {
    '/docs/economy': `${base}/docs/prices/`,
    '/docs/village': `${base}/docs/ranks/`,
    '/docs/explore': `${base}/docs/maps/`,
    '/docs/bosses': `${base}/docs/dungeons/`,
  },
  markdown: {
    shikiConfig: { theme: 'css-variables', wrap: true },
    // unified (remark/rehype), чтобы работал свой rehype-плагин документации.
    // Кавычки не трогаем: в русском тексте нужны «ёлочки», а не “лапки”.
    processor: unified({
      smartypants: { quotes: false },
      remarkPlugins: [[remarkFacts, { data: facts }]],
      rehypePlugins: [[rehypeDocs, { base }]],
    }),
  },
});
