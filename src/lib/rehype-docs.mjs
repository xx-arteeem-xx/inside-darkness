import { docSlug } from './slug.mjs';

/**
 * Обработка HTML документации:
 * - таблицы оборачиваются в прокручиваемый контейнер (на телефоне не ломают вёрстку);
 * - цитаты вида `> [!NOTE]`, `> [!TIP]`, `> [!WARNING]`... превращаются во врезки;
 * - ссылки `/docs/x/`, `x.md`, `/rp/...` получают префикс base (`/inside-darkness`).
 */
const CALLOUTS = {
  NOTE: 'Заметка',
  TIP: 'Совет',
  IMPORTANT: 'Важно',
  WARNING: 'Осторожно',
  CAUTION: 'Опасно',
};

const MARKER = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\r?\n?/i;

export function rehypeDocs(options = {}) {
  const base = String(options.base ?? '').replace(/\/+$/, '');

  const rewrite = (href) => {
    if (typeof href !== 'string' || href === '') return href;
    // внешние ссылки, mailto:, tel:, //host и якоря не трогаем
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href)) return href;

    const md = href.match(/^(?:\.\/|\/?docs\/|\.\.\/)*([^?#]+?)\.(?:md|mdx)((?:\?[^#]*)?(?:#.*)?)$/i);
    if (md) {
      const slug = docSlug(md[1]);
      return `${base}/docs/${slug ? slug + '/' : ''}${md[2] ?? ''}`;
    }
    if (href.startsWith('/')) {
      if (base && (href === base || href.startsWith(base + '/'))) return href;
      return base + href;
    }
    return href;
  };

  const visit = (node) => {
    if (!node || !Array.isArray(node.children)) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child.type !== 'element') continue;
      const props = (child.properties ??= {});

      if (child.tagName === 'a' && props.href) props.href = rewrite(props.href);
      if ((child.tagName === 'img' || child.tagName === 'source') && props.src) props.src = rewrite(props.src);

      if (child.tagName === 'table' && !props.dataWrapped) {
        props.dataWrapped = 'true';
        node.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-wrap'], tabIndex: 0, role: 'region', ariaLabel: 'Таблица, прокручивается вбок' },
          children: [child],
        };
      }

      if (child.tagName === 'blockquote') {
        const firstP = child.children.find((c) => c.type === 'element');
        const firstText = firstP?.tagName === 'p' ? firstP.children?.[0] : undefined;
        const m = firstText?.type === 'text' ? firstText.value.match(MARKER) : null;
        if (m) {
          const kind = m[1].toUpperCase();
          firstText.value = firstText.value.slice(m[0].length);
          // убрать пустой абзац или ведущий <br>, оставшийся после маркера
          while (firstP.children.length && (
            (firstP.children[0].type === 'text' && firstP.children[0].value.trim() === '') ||
            (firstP.children[0].type === 'element' && firstP.children[0].tagName === 'br')
          )) firstP.children.shift();
          if (firstP.children.length === 0) child.children.splice(child.children.indexOf(firstP), 1);

          node.children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['callout', `callout--${kind.toLowerCase()}`], role: 'note' },
            children: [
              { type: 'element', tagName: 'p', properties: { className: ['callout__title'] }, children: [{ type: 'text', value: CALLOUTS[kind] }] },
              ...child.children,
            ],
          };
          visit(node.children[i]);
          continue;
        }
      }

      visit(child);
    }
  };

  return (tree) => visit(tree);
}
