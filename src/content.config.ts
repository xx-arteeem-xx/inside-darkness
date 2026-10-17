import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docSlug } from './lib/slug.mjs';

/**
 * Документация: Markdown-файлы в src/content/docs/*.md.
 * Frontmatter:
 *   title:       строка, обязательно
 *   description: строка, подзаголовок страницы и текст в списке
 *   section:     строка, раздел в боковой навигации
 *   order:       число, порядок внутри раздела (и порядок разделов по минимальному order)
 * Если папки нет или она пустая, сборка проходит: раздел /docs/ покажет заглушку.
 */
const docs = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*.md'],
    base: './src/content/docs',
    generateId: ({ entry }) => docSlug(entry) || 'doc',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    section: z.string().default('Разное'),
    order: z.coerce.number().default(999),
  }),
});

export const collections = { docs };
