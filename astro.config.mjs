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
  // Документация стала гайдом (/docs/ → /guide/), страницы слиты в главы: старые ссылки ведут на новые.
  redirects: {
    '/docs': `${base}/guide/`,
    '/docs/start': `${base}/guide/start/`,
    '/docs/world': `${base}/guide/world/`,
    '/docs/people': `${base}/guide/world/`,
    '/docs/roads': `${base}/guide/world/`,
    '/docs/arena': `${base}/guide/world/`,
    '/docs/crafts': `${base}/guide/crafts/`,
    '/docs/ranks': `${base}/guide/crafts/`,
    '/docs/hunting': `${base}/guide/crafts/`,
    '/docs/village': `${base}/guide/crafts/`,
    '/docs/trade': `${base}/guide/trade/`,
    '/docs/prices': `${base}/guide/trade/`,
    '/docs/economy': `${base}/guide/trade/`,
    '/docs/gear': `${base}/guide/gear/`,
    '/docs/enchant': `${base}/guide/gear/`,
    '/docs/repair': `${base}/guide/gear/`,
    '/docs/dungeons': `${base}/guide/dungeons/`,
    '/docs/bosses': `${base}/guide/dungeons/`,
    '/docs/frontier': `${base}/guide/darklands/`,
    '/docs/city': `${base}/guide/death/`,
    '/docs/housing': `${base}/guide/housing/`,
    '/docs/orders': `${base}/guide/party/`,
    '/docs/maps': `${base}/guide/chronicle/`,
    '/docs/explore': `${base}/guide/chronicle/`,
    '/docs/faq': `${base}/guide/faq/`,
    '/docs/rules': `${base}/guide/rules/`,
    '/docs/commands': `${base}/guide/rules/`,
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
