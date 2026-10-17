/**
 * Слаг документа из имени файла: `Расы и классы.md` -> `расы-и-классы`.
 * Один и тот же код используется в glob-лоадере и в rehype-плагине,
 * поэтому ссылки вида `races.md` в Markdown всегда ведут на правильную страницу.
 */
export function docSlug(path) {
  return String(path)
    .replace(/\\/g, '/')
    .replace(/\.(md|mdx|markdown)$/i, '')
    .split('/')
    .map((part) =>
      part
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\p{L}\p{N}_-]+/gu, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('/');
}
