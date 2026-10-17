// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { rehypeDocs } from './src/lib/rehype-docs.mjs';

const base = '/inside-darkness';

export default defineConfig({
  site: 'https://xx-arteeem-xx.github.io',
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
  markdown: {
    shikiConfig: { theme: 'css-variables', wrap: true },
    // unified (remark/rehype), чтобы работал свой rehype-плагин документации.
    // Кавычки не трогаем: в русском тексте нужны «ёлочки», а не “лапки”.
    processor: unified({
      smartypants: { quotes: false },
      rehypePlugins: [[rehypeDocs, { base }]],
    }),
  },
});
