#!/usr/bin/env bash
# ==============================================================================
# Punto Burger - Script de Activación de Release (deploy-release.sh)
# ==============================================================================
# Propósito: Compilar, migrar base de datos, conmutar symlink atómicamente,
#            recargar PM2 y purgar releases antiguos conservando los últimos 5.
#
# Parámetros:
#   $1: Identificador del release (ej: commit SHA o timestamp)
#
# Uso:
#   bash /var/www/punto-burger-app/current/deploy/scripts/deploy-release.sh <RELEASE_ID>
# ==============================================================================

set -euo pipefail

RELEASE_ID="${1:-}"
if [ -z "${RELEASE_ID}" ]; then
    echo "ERROR: Debe proporcionar un RELEASE_ID como primer argumento." >&2
    exit 1
fi

APP_BASE_DIR="${APP_BASE_DIR:-/var/www/punto-burger-app}"
RELEASES_DIR="${APP_BASE_DIR}/releases"
SHARED_DIR="${APP_BASE_DIR}/shared"
CURRENT_LINK="${APP_BASE_DIR}/current"
TARGET_RELEASE_DIR="${RELEASES_DIR}/${RELEASE_ID}"

echo "================================================================="
echo "Iniciando activación de Release: ${RELEASE_ID}"
echo "Directorio de destino: ${TARGET_RELEASE_DIR}"
echo "================================================================="

if [ ! -d "${TARGET_RELEASE_DIR}" ]; then
    echo "ERROR: El directorio del release ${TARGET_RELEASE_DIR} no existe." >&2
    exit 1
fi

# 1. Vincular variables de entorno de producción
echo ">>> Enlazando variables de entorno desde ${SHARED_DIR}/.env.production..."
if [ ! -f "${SHARED_DIR}/.env.production" ]; then
    echo "ERROR CRÍTICO: No se encontró el archivo permanente ${SHARED_DIR}/.env.production" >&2
    exit 1
fi

ln -sfn "${SHARED_DIR}/.env.production" "${TARGET_RELEASE_DIR}/.env.production"
ln -sfn "${SHARED_DIR}/.env.production" "${TARGET_RELEASE_DIR}/.env.local"

cd "${TARGET_RELEASE_DIR}"

# 2. Instalar dependencias exactas
echo ">>> Ejecutando npm ci en el release..."
npm ci

# 3. Compilar aplicación Next.js
echo ">>> Compilando aplicación Next.js (npm run build)..."
npm run build

# 4. Ejecutar migraciones Drizzle en la base de datos
echo ">>> Aplicando migraciones de base de datos (npm run db:migrate)..."
# IMPORTANTE: db:seed NUNCA debe ejecutarse en el deploy automático
npm run db:migrate

# 5. Conmutación atómica del symlink 'current'
echo ">>> Conmutando symlink ${CURRENT_LINK} hacia el nuevo release..."
ln -sfn "${TARGET_RELEASE_DIR}" "${CURRENT_LINK}"

# 6. Recarga de procesos en PM2 sin corte de servicio
echo ">>> Recargando aplicación en PM2..."
cd "${CURRENT_LINK}"
pm2 delete punto-burger-app 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save

# 7. Verificación de Health Check local
echo ">>> Verificando estado del servicio localmente (/api/health)..."
HEALTH_STATUS=""
for i in {1..10}; do
    if curl -s -f http://127.0.0.1:3000/api/health | grep -q '"status":"ok"'; then
        HEALTH_STATUS="ok"
        break
    fi
    echo "Esperando que el proceso responda en 127.0.0.1:3000 (intento $i/10)..."
    sleep 2
done

if [ "${HEALTH_STATUS}" != "ok" ]; then
    echo "ERROR: El health check local falló tras 20 segundos de espera." >&2
    exit 1
fi
echo "✓ Health check local validado correctamente."

# 8. Limpieza de releases antiguos (Conservar únicamente los últimos 5)
echo ">>> Limpiando releases obsoletos (conservando los últimos 5)..."
cd "${RELEASES_DIR}"
# Listamos los directorios ordenados por fecha y eliminamos a partir del 6to
ls -dt */ 2>/dev/null | tail -n +6 | while read -r old_release; do
    echo "Eliminando release antiguo: ${old_release}"
    rm -rf "${old_release}"
done

echo "================================================================="
echo "✓ Release ${RELEASE_ID} desplegado y activo exitosamente."
echo "================================================================="
