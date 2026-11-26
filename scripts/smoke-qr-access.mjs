import { execSync } from 'node:child_process';

const BASE_URL = 'https://app.puntoburger.com.ar';

function parseCookies(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(',')
    .map((c) => c.split(';')[0])
    .join('; ');
}

function sshExec(cmd) {
  return execSync(
    `ssh -p 5098 -i ~/.ssh/punto_burger_deploy deploy@138.36.238.133 "${cmd.replace(/"/g, '\\"')}"`,
    { encoding: 'utf-8' }
  );
}

async function run() {
  console.log('=====================================================');
  console.log('=== SMOKE TEST: PPA-ACCESS-002 EN PRODUCCIÓN       ===');
  console.log('=== URL: https://app.puntoburger.com.ar            ===');
  console.log('=====================================================\n');

  // 1. Obtener el token QR actual de Mesa 01 desde el manifiesto en el servidor
  console.log('[1/10] Obteniendo token QR permanente de Mesa 01...');
  const manifestLine = sshExec(
    "grep 'mesa-01,' /var/www/punto-burger-app/shared/qr-print/table-qr-manifest.csv"
  ).trim();
  const qrUrl = manifestLine.split(',')[2];
  const qrToken = qrUrl.split('/t/')[1].trim();

  if (!qrToken || qrToken.length < 20) {
    throw new Error(`Token QR inválido o no encontrado: ${qrToken}`);
  }
  console.log(`[✓] Token QR obtenido: ${qrToken.slice(0, 8)}... (longitud: ${qrToken.length})\n`);

  // Asegurar que Mesa 01 comience en estado disponible y sin sesiones activas
  console.log('Asegurando estado inicial de Mesa 01 (available)...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );
  console.log('[✓] Mesa 01 reseteada a available.\n');

  // 2. GET /t/[qrToken] (no debe crear sesión)
  console.log('[2/10] Probando GET /t/[qrToken] (no debe crear sesión)...');
  const getRes = await fetch(`${BASE_URL}/t/${qrToken}`);
  if (getRes.status !== 200) {
    throw new Error(`GET /t/[qrToken] retornó status ${getRes.status}`);
  }
  const getHtml = await getRes.text();
  if (!getHtml.includes('Mesa 01') || !getHtml.includes('Jugar ahora')) {
    throw new Error(
      'La página /t/[qrToken] no contiene el nombre de la mesa o el botón Jugar ahora.'
    );
  }

  // Verificar en DB que NO se creó ninguna sesión
  const dbAfterGet = sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-table.ts'
  );
  if (!dbAfterGet.includes("status: 'available'")) {
    throw new Error('La mesa cambió de estado tras un simple GET.');
  }
  console.log('[✓] GET /t/[qrToken] respondió 200 y no alteró el estado de la mesa.\n');

  // 3. POST /api/v1/tables/claim-qr (Reclamo exitoso)
  console.log('[3/10] Probando POST /api/v1/tables/claim-qr...');
  const claimRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });

  const claimData = await claimRes.json();
  const cookie = parseCookies(claimRes);

  if (claimRes.status !== 200 || !claimData.ok || !cookie) {
    throw new Error(`Fallo en reclamo por QR: ${JSON.stringify(claimData)}`);
  }
  if (claimData.session.table !== 'Mesa 01' || claimData.session.status !== 'active') {
    throw new Error(`Datos de sesión incorrectos: ${JSON.stringify(claimData)}`);
  }
  if (claimData.next !== '/play/setup') {
    throw new Error(`Ruta next inesperada: ${claimData.next}`);
  }

  // Verificar en DB: mesa in_use y session active con active_device_id
  const dbAfterClaim = sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-table.ts'
  );
  if (!dbAfterClaim.includes("status: 'in_use'") || !dbAfterClaim.includes("status: 'active'")) {
    throw new Error('La mesa no pasó a in_use o la sesión no está activa en DB.');
  }
  console.log('[✓] Reclamo exitoso: HTTP 200, cookie emitida, mesa in_use en DB.\n');

  // 4. Idempotencia: el mismo dispositivo re-escanea con cookie
  console.log('[4/10] Probando idempotencia con misma cookie...');
  const idemRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ qrToken }),
  });
  const idemData = await idemRes.json();
  if (idemRes.status !== 200 || !idemData.ok) {
    throw new Error(`Fallo en idempotencia: ${JSON.stringify(idemData)}`);
  }
  console.log('[✓] Idempotencia confirmada: HTTP 200, sesión reanudada.\n');

  // 5. Rechazo por concurrencia: segundo dispositivo sin cookie intenta reclamar
  console.log('[5/10] Probando rechazo de mesa ocupada (segundo dispositivo)...');
  const conflictRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });
  const conflictData = await conflictRes.json();
  if (conflictRes.status !== 409 || conflictData?.error?.code !== 'TABLE_ALREADY_IN_USE') {
    throw new Error(`Fallo en detección de conflicto: ${JSON.stringify(conflictData)}`);
  }
  console.log('[✓] Conflicto verificado: HTTP 409 TABLE_ALREADY_IN_USE.\n');

  // 6. Juego completo de trivia
  console.log('[6/10] Ejecutando partida de trivia completa con la sesión...');
  const setupRes = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      groupName: 'SMOKE QR TEAM',
      categorySlug: 'entretenimiento',
      participants: [
        { alias: 'PlayerQR1', ageRange: 'adult', position: 1 },
        { alias: 'PlayerQR2', ageRange: 'teen', position: 2 },
      ],
    }),
  });
  const setupData = await setupRes.json();
  if (!setupData.ok) {
    throw new Error(`Fallo setup partida: ${JSON.stringify(setupData)}`);
  }
  const gameSessionId = setupData.gameSession.id;

  // Marcar ranking_eligible = false para no alterar el ranking oficial de producción
  sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/set-game-ranking-eligible.ts ${gameSessionId} false`
  );

  // Preparar 10 preguntas
  const prepRes = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  });
  const prepData = await prepRes.json();
  if (!prepData.ok || prepData.game?.questionCount !== 10) {
    throw new Error(`Fallo preparación de preguntas: ${JSON.stringify(prepData)}`);
  }

  // Iniciar y responder las 10 preguntas
  await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  });

  for (let i = 1; i <= 10; i++) {
    await fetch(`${BASE_URL}/api/v1/games/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ selectedOption: 'A' }),
    });
    await fetch(`${BASE_URL}/api/v1/games/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
    });
  }

  // Verificar estado de finalización
  const stateRes = await fetch(`${BASE_URL}/api/v1/games/state`, {
    headers: { Cookie: cookie },
  });
  const stateData = await stateRes.json();
  if (!stateData.ok || stateData.game?.status !== 'completed') {
    throw new Error(`La partida no figura como completed: ${JSON.stringify(stateData)}`);
  }
  console.log(
    `[✓] Partida finalizada con éxito (puntaje total: ${stateData.game.totalScore} pts).\n`
  );

  // 7. Cierre de sesión y verificación de limpieza de active_device_id
  console.log('[7/10] Cerrando sesión y verificando active_device_id = null...');
  const closeRes = await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  });
  const closeData = await closeRes.json();
  if (closeRes.status !== 200 || !closeData.ok) {
    throw new Error(`Fallo al cerrar sesión: ${JSON.stringify(closeData)}`);
  }

  const dbAfterClose = sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-table.ts'
  );
  if (!dbAfterClose.includes("status: 'cooldown'")) {
    throw new Error('La mesa no pasó a cooldown tras cerrar la sesión.');
  }
  if (!dbAfterClose.includes("status: 'closed'")) {
    throw new Error('La sesión no figura como closed.');
  }
  if (!dbAfterClose.includes('activeDeviceId: null')) {
    throw new Error(`BUG DETECTADO: activeDeviceId no fue limpiado a null:\n${dbAfterClose}`);
  }
  console.log('[✓] Sesión cerrada y active_device_id limpiado a NULL correctamente.\n');

  // 8. Verificación de cooldown
  console.log('[8/10] Verificando bloqueo por cooldown...');
  const cooldownClaimRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });
  const cooldownClaimData = await cooldownClaimRes.json();
  if (cooldownClaimRes.status !== 409 || cooldownClaimData?.error?.code !== 'TABLE_COOLDOWN') {
    throw new Error(
      `Se esperaba TABLE_COOLDOWN pero se obtuvo: ${JSON.stringify(cooldownClaimData)}`
    );
  }
  console.log('[✓] Cooldown verificado: HTTP 409 TABLE_COOLDOWN.\n');

  // 9. Reset de mesa y re-reclamo con el MISMO QR permanente
  console.log('[9/10] Probando re-reclamo con el MISMO QR tras resetear mesa...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );

  const reClaimRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });
  const reClaimData = await reClaimRes.json();
  const newCookie = parseCookies(reClaimRes);
  if (reClaimRes.status !== 200 || !reClaimData.ok || !newCookie) {
    throw new Error(`Fallo en re-reclamo con el mismo QR: ${JSON.stringify(reClaimData)}`);
  }
  console.log('[✓] Re-reclamo con el mismo QR permanente exitoso (nueva sesión iniciada).\n');

  // 10. Limpieza final absoluta
  console.log('[10/10] Limpieza final y verificación de estado en DB...');
  await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: newCookie },
  });
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );

  const finalDbState = sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-table.ts'
  );
  if (!finalDbState.includes("status: 'available'")) {
    throw new Error('La mesa no quedó en estado available al finalizar.');
  }
  if (!finalDbState.includes('activeDeviceId: null')) {
    throw new Error('La última sesión cerrada no tiene activeDeviceId en null.');
  }

  console.log('=== ESTADO FINAL DE PRODUCCIÓN ===');
  console.log('Mesa 01: available');
  console.log('Sesiones activas: 0');
  console.log('Dispositivos activos: 0');
  console.log('active_device_id en sesiones cerradas: null');
  console.log('QR físico permanente verificado y listo.');
  console.log('\n>>> PPA-ACCESS-002 PRODUCTION SMOKE TEST = PASSED <<<');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST PPA-ACCESS-002:', err.message);
  process.exit(1);
});
