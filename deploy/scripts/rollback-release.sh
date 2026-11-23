#!/usr/bin/env bash
# ==============================================================================
# Punto Burger - Script de Rollback de Release (rollback-release.sh)
# ==============================================================================
# Propósito: Conmutar el symlink 'current' al release inmediatamente anterior
#            (o al release especificado), recargar PM2 y verificar health check.
#
# Parámetros:
#   $1 (opcional): Identificador específico de release al que se desea regresar.
#                  Si se omite, se selecciona automáticamente el release previo.
#
# Uso:
#   bash /var/www/punto-burger-app/current/deploy/scripts/rollback-release.sh [TARGET_RELEASE]
# ==============================================================================

set -euo pipefail

APP_BASE_DIR="${APP_BASE_DIR:-/var/www/punto-burger-app}"
RELEASES_DIR="${APP_BASE_DIR}/releases"
CURRENT_LINK="${APP_BASE_DIR}/current"

echo "================================================================="
echo "Iniciando procedimiento de Rollback de Emergencia..."
echo "================================================================="

# ADVERTENCIA CRÍTICA:
# No se realiza rollback automático de migraciones PostgreSQL.
# La política de base de datos exige migraciones retrocompatibles (backward-compatible).
echo "NOTA: El rollback solo conmuta el código de aplicación y procesos PM2."
echo "      No se revierten migraciones de base de datos de forma automática."

TARGET_RELEASE="${1:-}"

if [ -z "${TARGET_RELEASE}" ]; then
    echo ">>> Buscando release previo disponible en ${RELEASES_DIR}..."
    CURRENT_TARGET=""
    if [ -L "${CURRENT_LINK}" ]; then
        CURRENT_TARGET=$(readlink -f "${CURRENT_LINK}")
    fi

    # Obtenemos los releases ordenados por fecha de modificación
    AVAILABLE_RELEASES=($(ls -dt "${RELEASES_DIR}"/*/ 2>/dev/null | tr -d '/'))

    if [ ${#AVAILABLE_RELEASES[@]} -lt 2 ]; then
        echo "ERROR: No hay suficientes releases previos para realizar un rollback." >&2
        exit 1
    fi

    # Seleccionar el primer release que no sea el actual
    for rel in "${AVAILABLE_RELEASES[@]}"; do
        FULL_PATH="${RELEASES_DIR}/${rel}"
        if [ "${FULL_PATH}" != "${CURRENT_TARGET}" ]; then
            TARGET_RELEASE="${rel}"
            break
        fi
    done
fi

TARGET_DIR="${RELEASES_DIR}/${TARGET_RELEASE}"

if [ ! -d "${TARGET_DIR}" ]; then
    echo "ERROR: El directorio de release ${TARGET_DIR} no existe." >&2
    exit 1
fi

echo ">>> Conmutando symlink ${CURRENT_LINK} hacia release previo: ${TARGET_RELEASE}..."
ln -sfn "${TARGET_DIR}" "${CURRENT_LINK}"

echo ">>> Recargando aplicación en PM2..."
cd "${CURRENT_LINK}"
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save

echo ">>> Verificando estado del servicio tras el rollback (/api/health)..."
HEALTH_STATUS=""
for i in {1..10}; do
    if curl -s -f http://127.0.0.1:3000/api/health | grep -q '"status":"ok"'; then
        HEALTH_STATUS="ok"
        break
    fi
    echo "Esperando que el proceso responda (intento $i/10)..."
    sleep 2
done

if [ "${HEALTH_STATUS}" != "ok" ]; then
    echo "ERROR CRÍTICO: El servicio no respondió satisfactoriamente tras el rollback." >&2
    exit 1
fi

echo "================================================================="
echo "✓ Rollback completado exitosamente hacia: ${TARGET_RELEASE}"
echo "================================================================="
