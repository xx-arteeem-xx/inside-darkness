/**
 * Сервер: адрес, версии клиента, ссылки. Сами значения — в server.json: их же видит документация
 * ({{server.address}}, {{server.versions}} в Markdown).
 * liveApi — живой список игроков от BlueMap на самом сервере: отвечает только когда сервер запущен.
 */
import server from './server.json';

export const SERVER = {
  ...server,
  versions: `${server.versionFrom}–${server.versionTo}`,
} as const;
