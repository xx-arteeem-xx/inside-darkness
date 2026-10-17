import { getCollection, type CollectionEntry } from 'astro:content';
import { url } from './url';

export type Doc = CollectionEntry<'docs'>;
export interface DocSection {
  name: string;
  docs: Doc[];
}

const byOrder = (a: Doc, b: Doc) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ru');

/** Разделы документации: по минимальному order внутри раздела, затем по имени. */
export async function getDocSections(): Promise<DocSection[]> {
  let all: Doc[] = [];
  try {
    all = await getCollection('docs');
  } catch {
    all = [];
  }
  const map = new Map<string, Doc[]>();
  for (const doc of all) {
    const key = doc.data.section.trim() || 'Разное';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(doc);
  }
  return [...map.entries()]
    .map(([name, docs]) => ({ name, docs: docs.sort(byOrder) }))
    .sort(
      (a, b) =>
        Math.min(...a.docs.map((d) => d.data.order)) - Math.min(...b.docs.map((d) => d.data.order)) ||
        a.name.localeCompare(b.name, 'ru'),
    );
}

export function flatten(sections: DocSection[]): Doc[] {
  return sections.flatMap((s) => s.docs);
}

/**
 * Ссылка на страницу документации по её id. Документацию пишет отдельный процесс:
 * если страницу переименуют или уберут, ссылка ведёт на оглавление, а не в 404.
 */
export async function docHref(id: string): Promise<string> {
  let ids: string[] = [];
  try {
    ids = (await getCollection('docs')).map((d) => d.id);
  } catch {
    ids = [];
  }
  return ids.includes(id) ? url(`/docs/${id}/`) : url('/docs/');
}
