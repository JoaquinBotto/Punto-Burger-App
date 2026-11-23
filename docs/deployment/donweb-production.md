# Despliegue en Producción — DonWeb Cloud Server

## Metadatos

- **Documento:** Guía de Despliegue e Infraestructura de Producción
- **Ticket:** INFRA-001
- **Fecha:** 2026-11-23
- **Estado:** Aprobado para Implementación
- **Dominio Oficial:** `https://app.puntoburger.com.ar`
- **Infraestructura:** DonWeb Cloud Server Linux (Ubuntu/Debian) + Nginx + PM2 + Supabase PostgreSQL

---

## 1. Principio Rector de Persistencia y Migraciones

> [!IMPORTANT]
> **ONE DATABASE MIGRATION SYSTEM = DRIZZLE**
>
> Aunque el repositorio de GitHub se encuentre vinculado al proyecto en Supabase, **NO se utiliza la función automática de migraciones de Supabase** ni se crean archivos en `supabase/migrations/`.
>
> **Drizzle ORM es la única y absoluta fuente de verdad** para la estructura de la base de datos PostgreSQL mediante las migraciones versionadas en [`src/db/migrations/`](../../src/db/migrations/).

---

## 2. Flujo de Arquitectura en Producción

```text
Cliente Móvil / Navegador
          │
          │ HTTPS (Puerto 443 / TLS Certbot)
          ▼
   [ Nginx Reverse Proxy ] (DonWeb Cloud Server)
          │
          │ Proxy pass local (127.0.0.1:3000)
          ▼
 [ Next.js 16.x App Router ] (Node.js 24 LTS)
          │  Supervisado y persistente con PM2 (1 instancia)
          ▼
     [ Drizzle ORM ] (Driver postgres.js)
          │
          │ Conexión PostgreSQL segura
          ▼
 [ Supabase PostgreSQL Gestionado ] (13 tablas fundacionales)
```

- **Puerto 3000:** Aislado estrictamente en `localhost` (`127.0.0.1`). Nunca se expone a Internet en el firewall.
- **Cache en Nginx:**
  - Activos estáticos en `/_next/static/*`: Caché inmutable por 1 año (`Cache-Control: public, max-age=31536000, immutable`).
  - Rutas dinámicas y críticas (`/api/*`, `/table/*`, `/play/*`): **Cero caché** (`no-store, no-cache, must-revalidate, max-age=0`).
- **Aislamiento Multi-sitio:** El virtual host de Nginx se configura exclusivamente para `app.puntoburger.com.ar`, garantizando que no interfiera con otros servicios (por ejemplo, `cartelera.puntoburger.com.ar`).

---

## 3. Estructura de Directorios en el Servidor

El servidor DonWeb organiza la aplicación mediante el patrón de **Releases Versionados** para permitir despliegues atómicos y reversiones inmediatas sin pérdida de estado:

```text
/var/www/punto-burger-app/
├── current -> /var/www/punto-burger-app/releases/<GITHUB_SHA>   # Enlace simbólico atómico activo
├── shared/                                                    # Datos y configuraciones permanentes
│   └── .env.production                                        # Variables de entorno reales (permisos 600)
└── releases/                                                  # Historial de versiones compiladas
    ├── a1b2c3d4e5f6.../                                      # Release N-2
    ├── b2c3d4e5f6a1.../                                      # Release N-1
    └── c3d4e5f6a1b2.../                                      # Release N (actual)
```

### Reglas de Conservación

- Cada despliegue crea una nueva carpeta bajo `releases/<GITHUB_SHA>/`.
- La configuración permanente reside en `shared/.env.production` y se enlaza mediante symlinks a `.env.production` y `.env.local` en cada release.
- **`shared/.env.production` NUNCA se borra ni se sobrescribe durante los despliegues.**
- Se conservan automáticamente los **últimos 5 releases** en disco; los anteriores son purgados por el script de despliegue.

---

## 4. Variables de Entorno del Servidor (`shared/.env.production`)

En el servidor DonWeb, el archivo permanente debe crearse en `/var/www/punto-burger-app/shared/.env.production` con permisos de lectura exclusivos para el usuario de despliegue (`chmod 600`):

```ini
# ==============================================================================
# Punto Burger - Variables de Entorno de Producción
# Ubicación: /var/www/punto-burger-app/shared/.env.production
# Propietario: deploy:deploy (chmod 600)
# ==============================================================================

# Entorno de Ejecución
NODE_ENV=production
APP_URL=https://app.puntoburger.com.ar
PORT=3000

# Base de Datos PostgreSQL en Supabase
# DATABASE_URL: Cadena de conexión para backend Node.js persistente (puerto 5432 modo sesión o pooler persistente)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# DATABASE_MIGRATION_URL: Conexión directa utilizada por Drizzle Kit para migraciones
DATABASE_MIGRATION_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Supabase Auth & Servicios
SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_ANON_KEY="[ANON_PUBLIC_KEY]"
# Llave de rol de servicio (NUNCA exponer al cliente móvil)
SUPABASE_SERVICE_ROLE_KEY="[SERVICE_ROLE_KEY]"

# Secretos Criptográficos Exclusivos del Servidor (Mínimo 32 caracteres cada uno)
SESSION_SECRET="[GENERAR_SECRET_ALEATORIO_DE_32_CARACTERES_MINIMO]"
ACCESS_CODE_SECRET="[GENERAR_SECRET_ALEATORIO_DISTINTO_DE_32_CARACTERES_MINIMO]"
```

---

## 5. Secretos Requeridos en GitHub Actions

Para habilitar el despliegue automático mediante SSH en cada push a `main`, configurar los siguientes **GitHub Repository Secrets** en `Settings -> Secrets and variables -> Actions`:

| Secreto                  | Descripción                                                                                       | Ejemplo / Valor                                 |
| :----------------------- | :------------------------------------------------------------------------------------------------ | :---------------------------------------------- |
| `DONWEB_HOST`            | Dirección IP pública o hostname del Cloud Server DonWeb                                           | `181.xxx.xxx.xxx` o `server.puntoburger.com.ar` |
| `DONWEB_USER`            | Usuario sin privilegios root configurado para el deploy                                           | `deploy`                                        |
| `DONWEB_SSH_PRIVATE_KEY` | Clave privada SSH (formato OpenSSH / PEM) correspondiente a la clave pública en `authorized_keys` | `-----BEGIN OPENSSH PRIVATE KEY----- ...`       |
| `DONWEB_SSH_PORT`        | Puerto de conexión SSH del servidor                                                               | `22` (o puerto remapeado si aplica)             |
| `DONWEB_APP_PATH`        | (Opcional) Ruta base en el servidor                                                               | `/var/www/punto-burger-app`                     |

---

## 6. Proceso de Aprovisionamiento Inicial del Servidor (Paso a Paso)

### Paso 6.1: Ejecutar el Script de Bootstrap

En el Cloud Server de DonWeb, como usuario `root` (o con `sudo`):

```bash
# Descargar o copiar el script de bootstrap al servidor
sudo bash deploy/scripts/bootstrap-server.sh
```

El script instala automáticamente Node.js 24 LTS, npm, Git, rsync, PM2, Nginx, Certbot, crea el usuario `deploy`, genera las carpetas en `/var/www/punto-burger-app/` y habilita el firewall UFW (bloqueando todo salvo puertos 22, 80 y 443).

### Paso 6.2: Configurar Clave SSH para GitHub Actions

Como usuario `deploy`:

```bash
# Agregar la clave pública SSH correspondiente a DONWEB_SSH_PRIVATE_KEY
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... github-actions-deploy" >> /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Paso 6.3: Configurar Nginx

```bash
sudo cp deploy/nginx/app.puntoburger.com.ar.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/app.puntoburger.com.ar.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Paso 6.4: Instalar Certificado SSL (Certbot)

Dado que el registro DNS A para `app.puntoburger.com.ar` ya se encuentra creado y apuntando a la IP del servidor:

```bash
sudo certbot --nginx -d app.puntoburger.com.ar
```

Certbot configurará automáticamente el certificado SSL gratuito de Let's Encrypt y activará la redirección automática de tráfico HTTP (puerto 80) hacia HTTPS (puerto 443).

### Paso 6.5: Completar Variables en `shared/.env.production`

Editar el archivo con las credenciales de Supabase y los secretos criptográficos:

```bash
sudo nano /var/www/punto-burger-app/shared/.env.production
sudo chown deploy:deploy /var/www/punto-burger-app/shared/.env.production
sudo chmod 600 /var/www/punto-burger-app/shared/.env.production
```

---

## 7. Primera Activación de Base de Datos y Seed Idempotente

> [!CAUTION]
> `npm run db:seed` **NUNCA se ejecuta automáticamente en cada deploy de GitHub Actions**.
> La siembra de datos inicial debe realizarse manualmente una única vez durante el despliegue inicial.

Una vez desplegado el primer release:

```bash
cd /var/www/punto-burger-app/current

# 1. Aplicar migraciones Drizzle
npm run db:migrate

# 2. Ejecutar seed inicial
npm run db:seed

# 3. Comprobar idempotencia (debe informar 0 insertadas, 72 existentes)
npm run db:seed
```

---

## 8. Ciclo de Vida del Deployment Automatizado

En cada `git push` a la rama `main` o ejecución manual vía `workflow_dispatch`:

```text
[ GitHub Actions ]
  ├── Job: validate (Mandatory CI)
  │     ├── npm ci
  │     ├── prettier --check
  │     ├── npm run lint
  │     ├── npm run typecheck
  │     ├── npm run test:run (47 tests)
  │     ├── npm run db:generate (validación de sync de esquemas)
  │     └── npm run build
  │     └── [Si algo falla: STOP inmediato, no hay deploy]
  │
  └── Job: deploy (SSH a DonWeb)
        ├── Autenticación vía clave SSH segura
        ├── Crear directorio /releases/<GITHUB_SHA>
        ├── Transferir código con rsync (excluyendo .git, node_modules, .env*)
        ├── Enlazar shared/.env.production -> .env.local
        ├── En el servidor: npm ci
        ├── En el servidor: npm run build
        ├── En el servidor: npm run db:migrate (migraciones Drizzle retrocompatibles)
        ├── Conmutación atómica: current -> releases/<GITHUB_SHA>
        ├── Recarga PM2 sin caída: pm2 startOrReload ecosystem.config.cjs --update-env
        ├── Purgar releases antiguos (mantener últimos 5)
        └── Health check público en https://app.puntoburger.com.ar/api/health
```

---

## 9. Monitoreo y Health Check

Tras cada despliegue, el pipeline consulta el endpoint de diagnóstico público:

```bash
curl -f https://app.puntoburger.com.ar/api/health
```

Respuesta requerida:

```json
{
  "status": "ok",
  "service": "punto-burger-app",
  "timestamp": "2026-11-23T..."
}
```

Si el endpoint no responde con código HTTP 200 y JSON válido tras 12 intentos (60 segundos), el pipeline marca el despliegue como fallido.

---

## 10. Procedimiento de Rollback de Emergencia

Si un release activo presenta una falla imprevista en producción:

### Opción A: Rollback Automático por Script

Conectarse por SSH al servidor y ejecutar:

```bash
bash /var/www/punto-burger-app/current/deploy/scripts/rollback-release.sh
```

El script:

1. Detecta el release previo inmediato disponible en `/var/www/punto-burger-app/releases/`.
2. Conmuta atómicamente el symlink `current` al release anterior.
3. Ejecuta `pm2 startOrReload ecosystem.config.cjs --update-env`.
4. Verifica el health check local en `http://127.0.0.1:3000/api/health`.

### Opción B: Rollback a un Release Específico

```bash
bash /var/www/punto-burger-app/current/deploy/scripts/rollback-release.sh <SHA_DEL_RELEASE_ESPECIFICO>
```

> [!NOTE]
> **Política de Base de Datos ante Rollbacks:** El rollback conmuta el código de la aplicación en Node.js y los procesos de PM2. No realiza reversión automática de migraciones SQL. Por este motivo, todas las migraciones de base de datos deben ser **aditivas y retrocompatibles** (permitiendo que el release anterior continúe operando sin errores).
