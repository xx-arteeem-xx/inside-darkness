import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist';
const origin = 'https://inside-darkness.ru';

for (const file of readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!file.isFile() || !file.name.endsWith('.html')) continue;

  const filename = join(file.parentPath, file.name);
  const route = filename.slice(root.length).replace(/index\.html$/, '');
  const target = new URL(route, origin).href;

  writeFileSync(filename, `<!doctype html>
<html lang="ru">
<meta charset="utf-8">
<title>Inside Darkness</title>
<link rel="canonical" href="${target}">
<script>location.replace(${JSON.stringify(target)} + location.search + location.hash)</script>
<noscript><meta http-equiv="refresh" content="0;url=${target}"></noscript>
<a href="${target}">Перейти на сайт Inside Darkness</a>
</html>
`);
}
