import type { APIRoute } from 'astro';
import { render } from 'astro:content';
import { getDocSections, flatten } from '../../lib/docs';
import { F } from '../../lib/site-facts';

const { fill } = F;

/**
 * Индекс для поиска по документации. Лёгкий JSON: заголовки, описание и текст без разметки.
 * Браузер загружает его только когда человек начинает искать.
 */
function plain(md: string): string {
  return md
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, ' ')
    .replace(/[|*_`>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const docs = flatten(await getDocSections());
  const index = await Promise.all(
    docs.map(async (doc) => {
      const { headings } = await render(doc);
      return {
        id: doc.id,
        title: doc.data.title,
        section: doc.data.section,
        description: doc.data.description,
        headings: headings.filter((h) => h.depth <= 3).map((h) => ({ text: h.text, slug: h.slug })),
        text: plain(fill(doc.body ?? '')),
      };
    }),
  );
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
