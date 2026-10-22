import { createFacts } from './facts.mjs';

/**
 * Подстановки игровых чисел в документации (см. facts.mjs).
 * - `{{путь}}` в тексте, коде, ссылках и ячейках таблиц — значение из generated.json;
 * - абзац из одного `{{table:имя аргумент}}` — таблица целиком, разобранная тем же парсером, что и страница.
 * Ошибка в подстановке валит сборку с именем файла.
 */
const TABLE_ONLY = /^\s*\{\{\s*table:([^{}]+?)\s*\}\}\s*$/;

export function remarkFacts(options = {}) {
  const F = createFacts(options.data);
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  const processor = this;

  const fail = (file, e) => {
    const where = file?.path ? ` (${String(file.path).split('/src/').pop()})` : '';
    throw new Error(`${e.message}${where}`);
  };

  const visit = (node, file) => {
    if (!node || !Array.isArray(node.children)) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type === 'paragraph' && child.children.length === 1 && child.children[0].type === 'text') {
        const m = child.children[0].value.match(TABLE_ONLY);
        if (m) {
          let md;
          try {
            md = F.table(m[1]);
          } catch (e) {
            fail(file, e);
          }
          const parsed = processor.parse(md);
          visit(parsed, file);
          node.children.splice(i, 1, ...parsed.children);
          i += parsed.children.length - 1;
          continue;
        }
      }
      if ((child.type === 'text' || child.type === 'inlineCode' || child.type === 'html') && child.value?.includes('{{')) {
        if (/\{\{\s*table:/.test(child.value)) fail(file, new Error(`таблица {{table:…}} должна стоять отдельным абзацем`));
        try {
          child.value = F.fill(child.value);
        } catch (e) {
          fail(file, e);
        }
        if (/\{\{|\}\}/.test(child.value)) {
          fail(file, new Error(`незакрытая подстановка «${child.value.slice(0, 60)}…» — в ячейке таблицы фильтр пишут через \\|`));
        }
      } else if ((child.type === 'text' || child.type === 'inlineCode') && /\}\}/.test(child.value ?? '')) {
        fail(file, new Error(`обрывок подстановки «${child.value.slice(0, 60)}…» — в ячейке таблицы фильтр пишут через \\|`));
      }
      if (child.type === 'link' && (child.url?.includes('%7B%7B') || child.url?.includes('{{'))) {
        try {
          child.url = F.fill(decodeURIComponent(child.url));
        } catch (e) {
          fail(file, e);
        }
      }
      visit(child, file);
    }
  };

  return (tree, file) => visit(tree, file);
}
