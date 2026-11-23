#!/usr/bin/env bash
# ==============================================================================
# Punto Burger - Script de Bootstrap para DonWeb Cloud Server (Ubuntu/Debian)
# ==============================================================================
# Propósito: Instalar dependencias base, configurar firewall, usuario no-root,
#            Nginx, PM2, Certbot y la estructura de directorios /var/www.
#
# Uso en el servidor:
#   sudo bash bootstrap-server.sh
# ==============================================================================

set -euo pipefail

APP_NAME="punto-burger-app"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_BASE_DIR="/var/www/${APP_NAME}"

echo "================================================================="
echo "Iniciando aprovisionamiento base del servidor para Punto Burger..."
echo "================================================================="

# 1. Comprobar ejecución como root
if [ "$(id -u)" -ne 0 ]; then
    echo "ERROR: Este script debe ejecutarse con privilegios root (sudo)." >&2
    exit 1
fi

# 2. Actualizar paquetes del sistema
echo ">>> Actualizando lista de paquetes..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

# 3. Instalar utilidades esenciales
echo ">>> Instalando utilidades base (curl, git, rsync, ufw, ca-certificates)..."
apt-get install -y \
    curl \
    git \
    rsync \
    ufw \
    ca-certificates \
    gnupg \
    tar \
    build-essential

# 4. Instalar Node.js 24 LTS (vía NodeSource)
echo ">>> Verificando / Instalando Node.js 24 LTS..."
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v24* ]]; then
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
    apt-get update -y
    apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "✓ Node.js instalado: ${NODE_VERSION}"
echo "✓ npm instalado: ${NPM_VERSION}"

# 5. Instalar PM2 globalmente
echo ">>> Instalando PM2..."
npm install -g pm2
pm2 --version

# 6. Instalar Nginx y Certbot con plugin para Nginx
echo ">>> Instalando Nginx y Certbot..."
apt-get install -y nginx certbot python3-certbot-nginx

# 7. Crear usuario dedicado sin privilegios root para deployment
echo ">>> Configurando usuario de despliegue: ${DEPLOY_USER}..."
if ! id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    useradd -m -s /bin/bash -d "/home/${DEPLOY_USER}" "${DEPLOY_USER}"
    echo "✓ Usuario ${DEPLOY_USER} creado exitosamente."
else
    echo "✓ Usuario ${DEPLOY_USER} ya existe."
fi

# Asegurar directorio .ssh para claves autorizadas del usuario deploy
mkdir -p "/home/${DEPLOY_USER}/.ssh"
chmod 700 "/home/${DEPLOY_USER}/.ssh"
touch "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"

# 8. Crear estructura de despliegues versionados
echo ">>> Creando estructura en ${APP_BASE_DIR}..."
mkdir -p "${APP_BASE_DIR}/releases"
mkdir -p "${APP_BASE_DIR}/shared"
mkdir -p /var/www/certbot

# Crear plantilla .env.production si no existe aún
if [ ! -f "${APP_BASE_DIR}/shared/.env.production" ]; then
    cat << 'EOF' > "${APP_BASE_DIR}/shared/.env.production"
# ==============================================================================
# Punto Burger - Variables de Entorno de Producción
# Ubicación: /var/www/punto-burger-app/shared/.env.production
# ==============================================================================
NODE_ENV=production
APP_URL=https://app.puntoburger.com.ar

# Conexiones PostgreSQL (Supabase / DonWeb)
DATABASE_URL=
DATABASE_MIGRATION_URL=

# Supabase Auth & Servicios
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Secretos Criptográficos (Mínimo 32 caracteres cada uno)
SESSION_SECRET=
ACCESS_CODE_SECRET=
EOF
    chmod 600 "${APP_BASE_DIR}/shared/.env.production"
    echo "✓ Plantilla ${APP_BASE_DIR}/shared/.env.production creada (completar con valores reales)."
fi

# Ajustar propietarios
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_BASE_DIR}"
chown -R www-data:www-data /var/www/certbot

# 9. Configuración del Firewall (UFW)
echo ">>> Configurando Firewall UFW (Permitiendo únicamente SSH, HTTP y HTTPS)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Nginx)'
ufw allow 443/tcp comment 'HTTPS (Nginx)'
# Aseguramos que el puerto 3000 de Next.js NUNCA quede expuesto públicamente
ufw --force enable
ufw status verbose

# 10. Configurar PM2 para iniciar al arranque bajo el usuario deploy
echo ">>> Configurando inicio automático de PM2..."
env PATH=$PATH:/usr/bin pm2 startup systemd -u "${DEPLOY_USER}" --hp "/home/${DEPLOY_USER}" || true

echo "================================================================="
echo "✓ Aprovisionamiento completado exitosamente."
echo "================================================================="
echo "Siguientes pasos recomendados:"
echo "1. Agregar la clave pública SSH en /home/${DEPLOY_USER}/.ssh/authorized_keys"
echo "2. Copiar deploy/nginx/app.puntoburger.com.ar.conf a /etc/nginx/sites-available/"
echo "3. Enlazar a /etc/nginx/sites-enabled/ y recargar Nginx: nginx -t && systemctl reload nginx"
echo "4. Completar credenciales en ${APP_BASE_DIR}/shared/.env.production"
echo "5. Ejecutar Certbot: certbot --nginx -d app.puntoburger.com.ar"
echo "================================================================="
