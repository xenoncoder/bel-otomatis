#!/bin/bash
set -e

BUILD_DIR="installer-linux-build"
APP_DIR="$BUILD_DIR/bel-otomatis"

echo "Creating Linux Build Directory..."
rm -rf $BUILD_DIR
mkdir -p $APP_DIR

echo "Writing Linux install.sh script..."
cat << 'EOF' > $BUILD_DIR/install.sh
#!/bin/bash
# Bel Otomatis - Linux Installer
# This script must be run as root (sudo)

if [ "\" -ne 0 ]; then
  echo "Please run as root (sudo bash install.sh)"
  exit
fi

echo "========================================="
echo "   MENGINSTALL BEL OTOMATIS (LINUX)      "
echo "========================================="

echo "[1/5] Menginstall dependensi (Nginx, PHP, SQLite, ALSA)..."
apt-get update
apt-get install -y nginx php-fpm php-sqlite3 php-cli php-xml php-curl php-mbstring php-zip alsa-utils sqlite3 unzip cron

echo "[2/5] Menyiapkan direktori aplikasi..."
APP_PATH="/var/www/bel-otomatis"
rm -rf \
cp -r bel-otomatis \

# Set permissions
chown -R www-data:www-data \
chmod -R 775 \/storage
chmod -R 775 \/bootstrap/cache

echo "[3/5] Mengatur Storage Link (Junction/Symlink)..."
cd \
php artisan storage:link

echo "[4/5] Mengkonfigurasi Nginx..."
cat << 'NGINX_CONF' > /etc/nginx/sites-available/bel-otomatis
server {
    listen 8080;
    server_name localhost;
    root /var/www/bel-otomatis/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files \ \/ /index.php?\;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock; # Sesuaikan versi PHP jika berbeda
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINX_CONF

# Deteksi versi PHP FPM dan update konfigurasi Nginx
PHP_VER=\8.3
sed -i "s/php8.1-fpm/php\-fpm/g" /etc/nginx/sites-available/bel-otomatis

ln -sf /etc/nginx/sites-available/bel-otomatis /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx

echo "[5/5] Mengatur CronJob untuk sistem penjadwalan..."
# Cronjob harus berjalan dengan user yang memiliki akses Desktop/Audio
# Kita menggunakan 'www-data' tetapi pastikan www-data dimasukkan ke group audio
usermod -a -G audio www-data

CRON_JOB="* * * * * cd /var/www/bel-otomatis && php artisan schedule:run >> /dev/null 2>&1"
(crontab -u www-data -l 2>/dev/null; echo "\") | crontab -u www-data -

echo "========================================="
echo " Instalasi Selesai!                      "
echo " Buka browser ke: http://localhost:8080  "
echo "========================================="
EOF
chmod +x $BUILD_DIR/install.sh

echo "Copying application files..."
# Copy all relevant files
cp -r app bootstrap config database public resources routes storage vendor artisan .env $APP_DIR/
# Exclude storage/logs and storage/framework/views
rm -rf $APP_DIR/storage/logs/*
rm -rf $APP_DIR/storage/framework/views/*
rm -rf $APP_DIR/storage/framework/cache/data/*

echo "Creating TAR archive..."
cd $BUILD_DIR
tar -czf BelOtomatis-Linux.tar.gz install.sh bel-otomatis
mv BelOtomatis-Linux.tar.gz ../
cd ..

echo "Cleaning up..."
rm -rf $BUILD_DIR

echo "Done! The Linux installer is at BelOtomatis-Linux.tar.gz"
