/** Ссылка внутри сайта с учётом base (`/inside-darkness`). */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(path = '/'): string {
  if (/^(https?:)?\/\//.test(path) || path.startsWith('mailto:')) return path;
  const clean = path.replace(/^\/+/, '');
  return `${BASE}/${clean}`;
}

/** Путь к файлу из public/ или внешний URL как есть. */
export function asset(path: string): string {
  return url(path);
}
