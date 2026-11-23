// ==============================================================================
// Punto Burger - Configuración PM2 (ecosystem.config.cjs)
// Ejecución y supervisión de proceso en DonWeb Cloud Server
// ==============================================================================

module.exports = {
  apps: [
    {
      name: 'punto-burger-app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      exp_backoff_restart_delay: 100,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
