import { getCollection, type CollectionEntry } from 'astro:content';

export type Doc = CollectionEntry<'guide'>;
export interface DocSection {
  name: string;
  docs: Doc[];
}

const byOrder = (a: Doc, b: Doc) =>
  a.data.order - b.data.order || a.data.title.localeCompare(b.data.title, 'ru');

/** Части гайда: по минимальному order внутри части, затем по имени. */
export async function getGuideSections(): Promise<DocSection[]> {
  let all: Doc[] = [];
  try {
    all = await getCollection('guide');
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
