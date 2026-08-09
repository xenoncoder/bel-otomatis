FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    sqlite \
    sqlite-libs \
    libzip \
    libzip-dev \
    oniguruma-dev \
    nodejs \
    npm \
    git \
    curl \
    supervisor

RUN docker-php-ext-install pdo_sqlite zip mbstring

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-dev --optimize-autoloader --no-interaction || true

RUN npm install && npm run build

RUN mkdir -p storage/app/public/bells \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/framework/cache \
    && mkdir -p bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

CMD ["/entrypoint.sh"]
