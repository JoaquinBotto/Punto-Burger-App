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
    { encoding: 'utf-8', timeout: 60000 }
  );
}

function getTableQrTokens() {
  const raw = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production node -e "
      const postgres = require('postgres');
      const sql = postgres(process.env.DATABASE_URL);
      sql\\\`SELECT code, qr_token FROM tables WHERE code IN ('mesa-01', 'mesa-02') ORDER BY code\\\`.then(rows => {
        console.log('TOKENS_JSON:' + JSON.stringify(rows));
        process.exit(0);
      });
    "`
  ).trim();

  const marker = 'TOKENS_JSON:';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    throw new Error(`No se pudieron obtener tokens QR: ${raw}`);
  }
  return JSON.parse(raw.substring(idx + marker.length));
}

async function playRound(cookie, roundNumber, optionOffset = 0) {
  console.log(`    -> Iniciando Ciclo ${roundNumber}...`);

  // 1. Next round
  const nextRes = await fetch(`${BASE_URL}/api/v1/competitions/current/rounds/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
  });
  const nextData = await nextRes.json();
  if (!nextRes.ok || !nextData.ok) {
    throw new Error(`Fallo rounds/next en Ciclo ${roundNumber}: ${JSON.stringify(nextData)}`);
  }

  // 2. Start game
  const startRes = await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie },
  });
  const startData = await startRes.json();
  if (!startRes.ok || !startData.ok) {
    throw new Error(`Fallo games/start en Ciclo ${roundNumber}: ${JSON.stringify(startData)}`);
  }

  let roundScore = 0;
  let correctCount = 0;

  // 3. Play 10 questions
  for (let q = 1; q <= 10; q++) {
    await new Promise((r) => setTimeout(r, 150));

    const options = ['A', 'B', 'C', 'D'];
    const selectedOption = options[(q + optionOffset) % 4];

    const answerRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
      body: JSON.stringify({ selectedOption }),
    });
    const answerData = await answerRes.json();
    if (!answerRes.ok || !answerData.ok) {
      throw new Error(`Fallo games/answer en P${q}: ${JSON.stringify(answerData)}`);
    }

    if (answerData.answer?.result === 'correct') {
      correctCount++;
    }

    if (q < 10) {
      const advRes = await fetch(`${BASE_URL}/api/v1/games/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', cookie },
      });
      const advData = await advRes.json();
      if (!advRes.ok || !advData.ok) {
        throw new Error(`Fallo games/advance en P${q}: ${JSON.stringify(advData)}`);
      }
    } else {
      const stateRes = await fetch(`${BASE_URL}/api/v1/games/state`, {
        headers: { cookie },
      });
      const stateData = await stateRes.json();
      roundScore = stateData.gameSession?.totalScore ?? 0;
    }
  }

  console.log(
    `    -> Ciclo ${roundNumber} completado: ${roundScore} pts (${correctCount}/10 correctas).`
  );
  return { roundScore, correctCount };
}

async function run() {
  console.log('========================================================================');
  console.log('  SMOKE TEST PPA-TESTMODE-001 — Competencia Abierta + Renovación');
  console.log('========================================================================\n');

  // 1. Health check
  console.log('1. Health check...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  if (!healthRes.ok || healthData.status !== 'ok') {
    throw new Error(`Health check falló: ${JSON.stringify(healthData)}`);
  }
  console.log('   ✅ Health check: HTTP 200 OK');

  // 2. Obtener tokens QR permanentes
  console.log('\n2. Obteniendo tokens QR permanentes...');
  const tableTokens = getTableQrTokens();
  const mesa01 = tableTokens.find((t) => t.code === 'mesa-01');
  const mesa02 = tableTokens.find((t) => t.code === 'mesa-02');
  if (!mesa01 || !mesa02) {
    throw new Error('No se encontraron tokens para mesa-01 o mesa-02');
  }
  console.log(`   ✅ Mesa 01 Token: ${mesa01.qr_token.substring(0, 10)}...`);
  console.log(`   ✅ Mesa 02 Token: ${mesa02.qr_token.substring(0, 10)}...`);

  // 3. Finalizar competencias previas y renovar mesas en el servidor
  console.log('\n3. Limpieza operativa previa en servidor...');
  try {
    sshExec(
      `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/competition-finalize.ts || true`
    );
  } catch {
    // Si no había ninguna competencia activa
  }
  sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/table-renew.ts mesa-01 --force`
  );
  sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/table-renew.ts mesa-02 --force`
  );
  console.log('   ✅ Mesas 01 y 02 renovadas y liberadas');

  // 4. Crear competencia OPEN de prueba
  console.log('\n4. Creando competencia OPEN de prueba (isTest: true)...');
  const createOutput = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/competition-create.ts --open --name "Smoke Test Open Competition" --is-test`
  );
  console.log(createOutput);

  // 5. Verificar estado de la competencia abierta vía API
  console.log('5. Verificando competencia abierta vía API...');
  const compRes = await fetch(`${BASE_URL}/api/v1/competitions/current?allowTest=true`);
  const compData = await compRes.json();
  if (!compRes.ok || !compData.competition) {
    throw new Error(`No se encontró la competencia abierta: ${JSON.stringify(compData)}`);
  }
  const testCompId = compData.competition.id;
  if (compData.competition.timingMode !== 'open' || compData.competition.status !== 'active') {
    throw new Error(`Modo o estado inválido: ${JSON.stringify(compData.competition)}`);
  }
  console.log(`   ✅ Competencia abierta activa: ID=${testCompId}, Modo=OPEN, Status=ACTIVE`);

  // 6. Obtener token de presencia Wi-Fi
  console.log('\n6. Verificando presencia Wi-Fi...');
  const presRes = await fetch(`${BASE_URL}/api/v1/presence/refresh`, {
    method: 'POST',
    headers: { 'X-PB-Client-IP': '138.36.238.133' },
  });
  if (!presRes.ok) {
    throw new Error(`Fallo refresh presencia: HTTP ${presRes.status}`);
  }
  const wifiPresenceCookie = parseCookies(presRes);
  console.log('   ✅ Token pb_venue_presence obtenido exitosamente');

  // 7. OCUPACIÓN A (Mesa 01 · Los Bacon)
  console.log('\n7. OCUPACIÓN A: Mesa 01 · Grupo "Los Bacon"...');
  const claimResA = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: mesa01.qr_token }),
  });
  if (!claimResA.ok) {
    throw new Error(`Fallo claim-qr Ocupación A: HTTP ${claimResA.status}`);
  }
  const sessionCookieA = parseCookies(claimResA);
  const authCookieA = `${sessionCookieA}; ${wifiPresenceCookie}`;

  // Setup grupo
  const setupResA = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookieA },
    body: JSON.stringify({
      groupName: 'Los Bacon',
      participants: [{ alias: 'Bacon 1' }, { alias: 'Bacon 2' }],
      categoryId: '11111111-1111-1111-1111-111111111111',
    }),
  });
  if (!setupResA.ok) {
    throw new Error(`Fallo setup Ocupación A: HTTP ${setupResA.status}`);
  }

  // Join competition
  const joinResA = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookieA },
  });
  const joinDataA = await joinResA.json();
  if (!joinResA.ok || !joinDataA.ok) {
    throw new Error(`Fallo join Ocupación A: ${JSON.stringify(joinDataA)}`);
  }
  const entryIdA = joinDataA.entryId;
  console.log(`   ✅ Inscripto en competencia: Entry A=${entryIdA}`);

  // Jugar los 3 ciclos
  await playRound(authCookieA, 1, 0);
  await playRound(authCookieA, 2, 1);
  await playRound(authCookieA, 3, 2);

  // 8. RENOVAR MESA 01 OPERATIVAMENTE
  console.log('\n8. Ejecutando table:renew en Mesa 01...');
  const renewOutputA = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/table-renew.ts mesa-01`
  );
  console.log(renewOutputA);

  // 9. OCUPACIÓN B (Mismo QR Mesa 01 · Los Cracks)
  console.log('\n9. OCUPACIÓN B: Mismo QR Mesa 01 · Grupo "Los Cracks"...');
  const claimResB = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: mesa01.qr_token }),
  });
  if (!claimResB.ok) {
    throw new Error(`Fallo claim-qr Ocupación B: HTTP ${claimResB.status}`);
  }
  const sessionCookieB = parseCookies(claimResB);
  if (sessionCookieB === sessionCookieA) {
    throw new Error('ERROR: Session B es igual a Session A!');
  }
  const authCookieB = `${sessionCookieB}; ${wifiPresenceCookie}`;

  // Setup grupo
  const setupResB = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookieB },
    body: JSON.stringify({
      groupName: 'Los Cracks',
      participants: [{ alias: 'Crack 1' }, { alias: 'Crack 2' }],
      categoryId: '11111111-1111-1111-1111-111111111111',
    }),
  });
  if (!setupResB.ok) {
    throw new Error(`Fallo setup Ocupación B: HTTP ${setupResB.status}`);
  }

  // Join competition
  const joinResB = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookieB },
  });
  const joinDataB = await joinResB.json();
  if (!joinResB.ok || !joinDataB.ok) {
    throw new Error(`Fallo join Ocupación B: ${JSON.stringify(joinDataB)}`);
  }
  const entryIdB = joinDataB.entryId;
  if (entryIdB === entryIdA) {
    throw new Error('ERROR: Entry B es igual a Entry A!');
  }
  console.log(`   ✅ Inscripto en competencia: Entry B=${entryIdB} (distinto de Entry A)`);

  // Jugar los 3 ciclos
  await playRound(authCookieB, 1, 3);
  await playRound(authCookieB, 2, 2);
  await playRound(authCookieB, 3, 1);

  // 10. VERIFICAR RANKING POR PARTICIPACIÓN MULTI-OCUPACIÓN
  console.log('\n10. Verificando ranking multi-ocupación por ENTRY...');
  const rankingRes = await fetch(`${BASE_URL}/api/v1/competitions/current/ranking?allowTest=true`);
  const rankingData = await rankingRes.json();
  if (!rankingRes.ok || !rankingData.ok) {
    throw new Error(`Fallo ranking: ${JSON.stringify(rankingData)}`);
  }

  const entriesInRanking = rankingData.ranking;
  console.table(
    entriesInRanking.map((e) => ({
      Puesto: `#${e.position}`,
      Competidor: e.displayName,
      Mesa: e.table,
      Equipo: e.groupName,
      Puntaje: `${e.totalScore} pts`,
      Ciclos: `${e.roundsCompleted}/3`,
    }))
  );

  const entryAFound = entriesInRanking.find((e) => e.entryId === entryIdA);
  const entryBFound = entriesInRanking.find((e) => e.entryId === entryIdB);

  if (!entryAFound || !entryBFound) {
    throw new Error('ERROR: Una de las dos entradas no aparece en el ranking!');
  }

  if (entryAFound.displayName !== 'Mesa 01 · Los Bacon') {
    throw new Error(`Nombre inesperado en Entry A: ${entryAFound.displayName}`);
  }
  if (entryBFound.displayName !== 'Mesa 01 · Los Cracks') {
    throw new Error(`Nombre inesperado en Entry B: ${entryBFound.displayName}`);
  }
  console.log(
    '   ✅ Ranking por entry verificado: Ambas ocupaciones de Mesa 01 conviven con puntajes independientes!'
  );

  // 11. TEST PROTECCIÓN DE PARTIDA ACTIVA Y FORCE RENEW EN MESA 02
  console.log('\n11. Probando protección de partida activa en Mesa 02...');
  const claimRes2 = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: mesa02.qr_token }),
  });
  const sessionCookie2 = parseCookies(claimRes2);
  const authCookie2 = `${sessionCookie2}; ${wifiPresenceCookie}`;

  await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookie2 },
    body: JSON.stringify({
      groupName: 'Mesa Activa Test',
      participants: [{ alias: 'Jugador 1' }],
      categoryId: '11111111-1111-1111-1111-111111111111',
    }),
  });

  await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookie2 },
  });

  // Iniciar ciclo 1 para que game_session quede 'active'
  await fetch(`${BASE_URL}/api/v1/competitions/current/rounds/next`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookie2 },
  });
  await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: authCookie2 },
  });

  console.log('    -> Intentando table:renew mesa-02 SIN --force...');
  let renewFailedAsExpected = false;
  try {
    sshExec(
      `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/table-renew.ts mesa-02`
    );
  } catch {
    renewFailedAsExpected = true;
    console.log('    ✅ Bloqueado exitosamente como partida activa.');
  }
  if (!renewFailedAsExpected) {
    throw new Error('ERROR: table:renew debió fallar por partida activa y no falló!');
  }

  console.log('    -> Intentando table:renew mesa-02 CON --force...');
  const forceOutput = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/table-renew.ts mesa-02 --force`
  );
  console.log(forceOutput);
  console.log('   ✅ Force renew ejecutado con éxito: partida abandonada y mesa liberada.');

  // 12. FINALIZAR TEST Y CREAR COMPETENCIA OFICIAL ABIERTA (SECCIÓN 39)
  console.log('\n12. Finalizando competencia de prueba y creando oficial abierta...');
  sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/competition-finalize.ts --id ${testCompId}`
  );

  const officialOpenOutput = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/competition-create.ts --open --name "Prueba Punto Burger"`
  );
  console.log(officialOpenOutput);

  // Verificar competencia oficial abierta en /ranking
  const rankingPageRes = await fetch(`${BASE_URL}/ranking`);
  const rankingHtml = await rankingPageRes.text();
  if (!rankingHtml.includes('Prueba Punto Burger')) {
    throw new Error('La página /ranking no contiene el nombre de la competencia abierta!');
  }
  console.log('   ✅ Competencia oficial "Prueba Punto Burger" visible en /ranking!');

  console.log('\n========================================================================');
  console.log('  🎉 SMOKE TEST PPA-TESTMODE-001 COMPLETADO EXITOSAMENTE');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
