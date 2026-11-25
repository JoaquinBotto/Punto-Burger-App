import { execSync } from 'node:child_process';

const BASE_URL = 'https://app.puntoburger.com.ar';
const accessCode = process.argv[2];

if (!accessCode) {
  console.error('Uso: node scripts/smoke-ranking.mjs <ACCESS_CODE>');
  process.exit(1);
}

function parseCookies(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return '';
  return raw
    .split(',')
    .map((c) => c.split(';')[0])
    .join('; ');
}

async function run() {
  console.log('=== INICIO SMOKE TEST PPA-RANK-001 EN PRODUCCIÓN ===\n');

  // 1. Verificar ranking inicial (debe estar vacío porque todos los históricos son ranking_eligible=false)
  console.log('[Paso 1] Verificando ranking inicial público...');
  const initRankRes = await fetch(`${BASE_URL}/api/v1/rankings/daily`);
  const initRankData = await initRankRes.json();
  console.log('Ranking inicial:', initRankData);
  if (!initRankData.ok || initRankData.ranking.length !== 0) {
    throw new Error('El ranking inicial no está vacío o falló.');
  }
  console.log('✓ Ranking inicial vacío confirmado.\n');

  // 2. Probar exclusión de Smoke Test (ranking_eligible = false)
  console.log('[Paso 2] Creando sesión de prueba para verificar exclusión...');
  const claimRes = await fetch(`${BASE_URL}/api/v1/tables/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableCode: 'mesa-01', accessCode }),
  });
  const claimData = await claimRes.json();
  const cookie = parseCookies(claimRes);
  if (!claimData.ok || !cookie) {
    throw new Error(`Fallo claim Mesa 01: ${JSON.stringify(claimData)}`);
  }
  console.log('✓ Mesa 01 reclamada para prueba de exclusión.');

  const setupRes = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      groupName: 'SMOKE EXCLUSION TEST',
      categorySlug: 'deportes',
      participants: [
        { alias: 'TesterA', ageRange: 'adult', position: 1 },
        { alias: 'TesterB', ageRange: 'teen', position: 2 },
      ],
    }),
  });
  const setupData = await setupRes.json();
  const gameSessionId = setupData.gameSession.id;
  console.log(`✓ Partida configurada (id: ${gameSessionId}).`);

  // Preparar preguntas
  const prepRes = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  });
  const prepData = await prepRes.json();
  if (!prepData.ok) {
    throw new Error(`Fallo preparación de preguntas: ${JSON.stringify(prepData)}`);
  }
  console.log('✓ 10 preguntas preparadas.');

  // Forzar ranking_eligible = false en el servidor para este smoke test
  console.log(`Marcando game_session ${gameSessionId} como ranking_eligible=false vía SSH...`);
  execSync(
    `ssh -p 5098 -i ~/.ssh/punto_burger_deploy deploy@138.36.238.133 "cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/set-game-ranking-eligible.ts ${gameSessionId} false"`
  );
  console.log('✓ Partida marcada como ranking_eligible=false.');

  // Jugar las 10 preguntas rápidamente
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
  console.log('✓ Partida de exclusión finalizada.');

  // Verificar que NO aparece en ranking diario público
  const rankAfterExclusion = await (await fetch(`${BASE_URL}/api/v1/rankings/daily`)).json();
  if (rankAfterExclusion.ranking.length !== 0) {
    throw new Error('ERROR: La partida con ranking_eligible=false apareció en el ranking público!');
  }
  console.log('✓ CONFIRMADO: Partida con ranking_eligible=false NO aparece en ranking público.');

  // Cerrar sesión
  await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
  });
  console.log('✓ Sesión de exclusión cerrada.');

  // Liberar cooldown de mesa para la prueba elegible
  console.log('Reseteando cooldown de Mesa 01 para la prueba elegible...');
  execSync(
    `ssh -p 5098 -i ~/.ssh/punto_burger_deploy deploy@138.36.238.133 "cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production -" < scripts/reset-table.ts`
  );
  console.log('✓ Mesa 01 disponible.');

  // 3. Probar partida elegible oficial real (ranking_eligible = true)
  console.log('\n[Paso 3] Ejecutando partida elegible oficial...');
  const claimRes2 = await fetch(`${BASE_URL}/api/v1/tables/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableCode: 'mesa-01', accessCode }),
  });
  const claimData2 = await claimRes2.json();
  const cookie2 = parseCookies(claimRes2);
  if (!claimData2.ok || !cookie2) {
    throw new Error(`Fallo segundo claim Mesa 01: ${JSON.stringify(claimData2)}`);
  }

  const setupRes2 = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
    body: JSON.stringify({
      groupName: 'Comensales Punto Burger',
      categorySlug: 'entretenimiento',
      participants: [
        { alias: 'Lucas', ageRange: 'adult', position: 1 },
        { alias: 'Martina', ageRange: 'adult', position: 2 },
      ],
    }),
  });
  const setupData2 = await setupRes2.json();
  if (!setupData2.ok) {
    throw new Error(`Fallo setup partida oficial: ${JSON.stringify(setupData2)}`);
  }
  const gameSessionId2 = setupData2.gameSession.id;
  console.log(
    `✓ Partida oficial configurada (id: ${gameSessionId2}, ranking_eligible=true por default).`
  );

  await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
  });

  await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
  });

  for (let i = 1; i <= 10; i++) {
    // Alternar opciones para sumar puntos
    const opt = i % 2 === 0 ? 'B' : 'A';
    await fetch(`${BASE_URL}/api/v1/games/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
      body: JSON.stringify({ selectedOption: opt }),
    });
    await fetch(`${BASE_URL}/api/v1/games/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
    });
  }
  console.log('✓ Partida oficial de 10 preguntas completada.');

  // 4. Verificar pantalla /play/results
  console.log('\n[Paso 4] Verificando pantalla /play/results...');
  const resultsHtmlRes = await fetch(`${BASE_URL}/play/results`, {
    headers: { Cookie: cookie2 },
  });
  const resultsHtml = await resultsHtmlRes.text();
  if (resultsHtmlRes.status !== 200) {
    throw new Error(`Status ${resultsHtmlRes.status} al consultar /play/results`);
  }
  if (!resultsHtml.includes('Ranking de Hoy')) {
    throw new Error('No se encontró el bloque Ranking de Hoy en /play/results');
  }
  if (!resultsHtml.includes('Nuevo récord')) {
    throw new Error('No se encontró el indicador de nuevo récord en /play/results');
  }
  console.log('✓ /play/results renderizó bloque de Ranking de Hoy y nuevo récord.');

  // 5. Verificar endpoint contextual /api/v1/rankings/daily/me
  console.log('\n[Paso 5] Consultando /api/v1/rankings/daily/me...');
  const meRes = await fetch(`${BASE_URL}/api/v1/rankings/daily/me`, {
    headers: { Cookie: cookie2 },
  });
  const meData = await meRes.json();
  console.log('Respuesta /me:', meData);
  if (!meData.ok || !meData.ranked || meData.position !== 1 || meData.table.code !== 'mesa-01') {
    throw new Error(`Respuesta inválida de /me: ${JSON.stringify(meData)}`);
  }
  console.log('✓ /me confirmó Mesa 01 en Puesto #1.');

  // 6. Verificar endpoint público /api/v1/rankings/daily
  console.log('\n[Paso 6] Consultando /api/v1/rankings/daily...');
  const publicRes = await fetch(`${BASE_URL}/api/v1/rankings/daily`);
  const publicData = await publicRes.json();
  console.log('Ranking público:', publicData);
  if (!publicData.ok || publicData.ranking.length !== 1) {
    throw new Error(
      `Ranking público no contiene exactamente 1 mesa: ${JSON.stringify(publicData)}`
    );
  }
  const entry = publicData.ranking[0];
  if (entry.position !== 1 || entry.table.code !== 'mesa-01' || entry.table.name !== 'Mesa 01') {
    throw new Error(`Entrada de ranking inesperada: ${JSON.stringify(entry)}`);
  }
  // Verificar CERO fugas de nombres de grupo
  const publicJsonStr = JSON.stringify(publicData);
  if (publicJsonStr.includes('Comensales Punto Burger') || publicJsonStr.includes('Lucas')) {
    throw new Error(
      'FUGA DE DATOS: el nombre de grupo o participantes apareció en el ranking público!'
    );
  }
  console.log(
    '✓ Ranking público verificado: Mesa 01 en posición 1, sin fugas de nombres de grupo ni participantes.'
  );

  // 7. Verificar página /ranking
  console.log('\n[Paso 7] Consultando página pública /ranking...');
  const rankingPageRes = await fetch(`${BASE_URL}/ranking`, {
    headers: { Cookie: cookie2 },
  });
  const rankingPageHtml = await rankingPageRes.text();
  if (rankingPageRes.status !== 200 || !rankingPageHtml.includes('Mesa 01')) {
    throw new Error('Fallo al renderizar página /ranking con Mesa 01');
  }
  console.log('✓ Página /ranking renderizó correctamente con Mesa 01 en podio.');

  // 8. Finalizar y cerrar sesión
  console.log('\n[Paso 8] Cerrando sesión y liberando mesa...');
  await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie2 },
  });

  // Liberar cooldown para dejar Mesa 01 available
  execSync(
    `ssh -p 5098 -i ~/.ssh/punto_burger_deploy deploy@138.36.238.133 "cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production -" < scripts/reset-table.ts`
  );

  console.log('\n=== SMOKE TEST PPA-RANK-001 FINALIZADO EXITOSAMENTE (100% PASSED) ===');
}

run().catch((err) => {
  console.error('ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
