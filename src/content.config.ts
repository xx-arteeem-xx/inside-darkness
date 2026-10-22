import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docSlug } from './lib/slug.mjs';
import { F } from './lib/site-facts';

const { fill } = F;

/**
 * Гайд: Markdown-файлы в src/content/guide/*.md.
 * Frontmatter:
 *   title:       строка, обязательно
 *   description: строка, подзаголовок страницы и текст в списке
 *   section:     строка, раздел в боковой навигации
 *   order:       число, порядок внутри части (и порядок частей по минимальному order); номер главы — по порядку
 *   brief:       список строк «Коротко» в начале главы — для новичка, без разметки
 * В title, description и brief работают подстановки {{...}} игровых чисел (см. lib/facts.mjs).
 * Если папки нет или она пустая, сборка проходит: /guide/ покажет заглушку.
 */
const guide = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*.md'],
    base: './src/content/guide',
    generateId: ({ entry }) => docSlug(entry) || 'doc',
  }),
  schema: z.object({
    title: z.string().transform(fill),
    description: z.string().default('').transform(fill),
    section: z.string().default('Разное'),
    order: z.coerce.number().default(999),
    brief: z.array(z.string().transform(fill)).default([]),
  }),
});

export const collections = { guide };
