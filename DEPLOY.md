# Bel Otomatis — Deployment Guide

## Development (Local)

```bash
composer install
npm install
npm run build
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

## Local Network Access

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

Access from any device: `http://<your-ip>:8000`

## Docker

```bash
docker-compose up -d --build
```

Access: `http://localhost:8080`

## Hosting / VPS (nginx + PHP-FPM)

1. Clone repo, set permissions:
```bash
chmod -R 775 storage bootstrap/cache
```

2. Configure `.env`:
```env
APP_URL=https://your-domain.com
APP_ENV=production
APP_DEBUG=false
```

3. Deploy:
```bash
composer install --no-dev --optimize-autoloader
npm install && npm run build
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

4. Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/bel-otomatis/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

## HTTPS

The app auto-detects HTTPS via trusted proxies. For SSL termination (Cloudflare, nginx, load balancer), no extra config needed — `trustProxies(at: '*')` is set in `bootstrap/app.php`.

For direct HTTPS with `php artisan serve`, set:
```env
SESSION_SECURE_COOKIE=true
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:8000` | Base URL (used for asset generation) |
| `APP_DEBUG` | `true` | Set `false` in production |
| `APP_LOCALE` | `id` | Default locale (`id` or `en`) |
| `SESSION_DOMAIN` | `null` | Cookie domain (null = current host) |
| `SESSION_SECURE_COOKIE` | `null` | `null`=auto, `true`=HTTPS only, `false`=HTTP only |
| `SESSION_SAME_SITE` | `lax` | SameSite cookie policy |
| `FILESYSTEM_DISK` | `public` | Storage disk for bell files |
