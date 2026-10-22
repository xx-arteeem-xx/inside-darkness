/**
 * Сервер: адрес, версии клиента, личный кабинет. Сами значения — в server.json: их же видит гайд
 * ({{server.address}}, {{server.versions}}, {{server.cabinet}} в Markdown).
 */
import server from './server.json';

export const SERVER = {
  ...server,
  versions: `${server.versionFrom}–${server.versionTo}`,
} as const;

/** Личный кабинет: вход, монеты, облик, поддержка края. Адрес меняется только в server.json. */
export const CABINET_URL: string = server.cabinet;
