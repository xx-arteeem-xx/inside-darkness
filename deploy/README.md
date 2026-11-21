# Inside Darkness на Projects

GitHub Actions собирает сайт для `https://inside-darkness.ru/` и публикует
архив в релизе `projects-<commit>`. На VM110 таймер раз в две минуты
забирает проверенный релиз. Nginx читает текущую сборку из
`/var/lib/inside-darkness/current`, а Caddy обращается к
`inside-darkness-site:8080` через сеть `caddy_net`.

Первичная установка на VM110 после появления первого релиза:

```sh
sudo useradd --system --no-create-home --shell /usr/sbin/nologin inside-darkness
sudo install -D -m 0644 deploy/pull.py /usr/local/libexec/inside-darkness-pull.py
sudo install -m 0644 deploy/inside-darkness-pull.{service,timer} /etc/systemd/system/
sudo install -d -m 0750 /opt/home-projects/inside-darkness
sudo install -m 0644 deploy/compose.yaml deploy/nginx.conf /opt/home-projects/inside-darkness/
sudo systemctl daemon-reload
sudo systemctl start inside-darkness-pull.service
sudo docker compose -f /opt/home-projects/inside-darkness/compose.yaml up -d --wait
sudo systemctl enable --now inside-darkness-pull.timer
```

`/version.json` показывает ревизию, `journalctl -u inside-darkness-pull.service`
показывает результат загрузок. Проверка SHA-256 и структуры архива проходит
до атомарного переключения. В VM хранятся текущая сборка и две предыдущие.
Для ручного отката остановите таймер и сервис, создайте рядом с `current`
временную ссылку на нужный каталог `releases/<commit>` и замените `current`
командой `mv -Tf`. После исправления снова включите таймер.
