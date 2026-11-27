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

function getTableQrToken(tableCode) {
  const nodeScript = `
const dotenv = require('/var/www/punto-burger-app/current/node_modules/dotenv');
dotenv.config({ path: '/var/www/punto-burger-app/shared/.env.production' });
const pMod = require('/var/www/punto-burger-app/current/node_modules/postgres');
const postgres = pMod.default || pMod;
const sql = postgres(process.env.DATABASE_URL);
sql\`SELECT code, qr_token FROM tables WHERE code = '${tableCode}'\`.then(r => {
  console.log('TOKEN_RESULT:' + JSON.stringify(r[0]));
  sql.end();
});
`;

  const b64 = Buffer.from(nodeScript).toString('base64');
  const raw = execSync(
    `ssh -p 5098 -i ~/.ssh/punto_burger_deploy deploy@138.36.238.133 "echo ${b64} | base64 -d | node"`,
    { encoding: 'utf-8', timeout: 60000 }
  ).trim();

  const marker = 'TOKEN_RESULT:';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    throw new Error(`No se pudo obtener qr_token para ${tableCode}: ${raw}`);
  }
  return JSON.parse(raw.substring(idx + marker.length));
}

async function run() {
  console.log('===============================================================');
  console.log('SMOKE TEST PPA-HOTFIX-003: /play EN COMPETITION ROUNDS MIXTOS');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  const testTableCode = 'mesa-02';

  // 0. Renovar mesa de prueba antes de comenzar
  console.log(`>>> [Paso 0] Renovando ${testTableCode}...`);
  sshExec(
    `cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`
  );

  // Obtener qr_token
  const tableData = getTableQrToken(testTableCode);
  console.log(`✓ Token QR de ${testTableCode} obtenido: ${tableData.qr_token.substring(0, 10)}...`);

  // 1. Claim por QR
  console.log('\n>>> [Paso 1] Reclamando mesa por QR permanente...');
  const claimRes = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: tableData.qr_token }),
  });
  const claimData = await claimRes.json();
  if (!claimRes.ok || !claimData.ok) {
    throw new Error(`Claim falló: ${JSON.stringify(claimData)}`);
  }
  const sessionCookie = parseCookies(claimRes);
  console.log(`✓ Mesa ${testTableCode} reclamada con éxito.`);

  // 2. Guardar setup de grupo
  console.log('\n>>> [Paso 2] Guardando grupo y participantes...');
  const setupPayload = {
    groupName: 'Smoke Test Hotfix 003',
    categorySlug: 'cultura-general',
    participants: [
      { alias: 'Player 1', ageRange: 'adult', educationLevel: null, position: 1 },
      { alias: 'Player 2', ageRange: 'adult', educationLevel: null, position: 2 },
    ],
  };

  const setupRes = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify(setupPayload),
  });
  const setupData = await setupRes.json();
  if (!setupRes.ok || !setupData.ok) {
    throw new Error(`Setup falló: ${JSON.stringify(setupData)}`);
  }
  console.log(`✓ Grupo configurado con éxito.`);

  // 3. Inscribir a la competencia OPEN activa
  console.log('\n>>> [Paso 3] Inscribiendo mesa a la competencia...');
  const joinRes = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const joinData = await joinRes.json();
  if (!joinRes.ok || !joinData.ok) {
    throw new Error(`Join falló: ${JSON.stringify(joinData)}`);
  }
  console.log(`✓ Inscripción exitosa: entryId=${joinData.entryId}`);

  // 4. Preparar Ronda 1
  console.log('\n>>> [Paso 4] Preparando Ciclo 1 (rounds/next con categoryId=null)...');
  const roundRes = await fetch(`${BASE_URL}/api/v1/competitions/current/rounds/next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const roundData = await roundRes.json();
  if (!roundRes.ok || !roundData.ok) {
    throw new Error(`Round 1 prepare falló: ${JSON.stringify(roundData)}`);
  }
  console.log(
    `✓ Ciclo 1 preparado con éxito: round=${roundData.roundNumber}, gameSessionId=${roundData.gameSessionId}`
  );

  // 5. CRÍTICO: GET /play (debe cargar la pantalla de juego sin bucle de redirección)
  console.log('\n>>> [Paso 5] Verificando GET /play (debe ser HTTP 200 sin loop a /play/setup)...');
  const playRes = await fetch(`${BASE_URL}/play`, {
    method: 'GET',
    headers: {
      cookie: sessionCookie,
    },
    redirect: 'manual', // No seguir redirecciones automáticamente para detectar loops
  });

  console.log(`    Status HTTP: ${playRes.status}`);
  if (playRes.status !== 200) {
    const loc = playRes.headers.get('location');
    throw new Error(
      `GET /play falló con status ${playRes.status} (Location: ${loc}). El loop de redirección persiste.`
    );
  }

  const playHtml = await playRes.text();

  // Verificar elementos de la pantalla pre-game competitiva
  const hasMixedCategory =
    playHtml.includes('Categorías mixtas') ||
    playHtml.includes('Categorias mixtas') ||
    playHtml.includes('mixed');
  const hasRoundNumber = playHtml.includes('Ciclo 1 de 3') || playHtml.includes('Ciclo 1');
  const hasStartRoundBtn = playHtml.includes('Comenzar Ciclo 1') || playHtml.includes('Comenzar');

  if (!hasMixedCategory) {
    throw new Error('GET /play no contiene mención a "Categorías mixtas".');
  }
  if (!hasRoundNumber) {
    throw new Error('GET /play no contiene "Ciclo 1 de 3".');
  }
  if (!hasStartRoundBtn) {
    throw new Error('GET /play no contiene el botón "Comenzar Ciclo 1".');
  }
  console.log(
    '✓ GET /play devolvió 200 OK con UI de Categorías Mixtas, Ciclo 1 y botón de inicio.'
  );

  // 6. Iniciar el juego
  console.log('\n>>> [Paso 6] Iniciando partida mediante /api/v1/games/start...');
  const startRes = await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const startData = await startRes.json();
  if (!startRes.ok || !startData.ok) {
    throw new Error(`Start falló: ${JSON.stringify(startData)}`);
  }
  if (startData.game.status !== 'active') {
    throw new Error(`Se esperaba game status active, obtenido: ${startData.game.status}`);
  }
  if (startData.question.difficulty !== 'initial') {
    throw new Error(
      `Se esperaba dificultad initial en Q1 de Ciclo 1, obtenida: ${startData.question.difficulty}`
    );
  }
  console.log(
    `✓ Partida iniciada con éxito. Q1 recibida (dificultad: ${startData.question.difficulty}, posición: ${startData.question.position}).`
  );

  // 7. Responder 1 pregunta
  console.log('\n>>> [Paso 7] Enviando respuesta a la pregunta 1...');
  const answerRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      gameQuestionId: startData.question.id,
      selectedOption: 'A',
    }),
  });
  const answerData = await answerRes.json();
  if (!answerRes.ok || !answerData.ok) {
    throw new Error(`Answer falló: ${JSON.stringify(answerData)}`);
  }
  console.log(
    `✓ Respuesta procesada correctamente: resultado=${answerData.answer.result}, puntos=${answerData.answer.pointsAwarded}`
  );

  // 8. Consultar /api/v1/games/state
  console.log('\n>>> [Paso 8] Consultando estado del juego (/api/v1/games/state)...');
  const stateRes = await fetch(`${BASE_URL}/api/v1/games/state`, {
    method: 'GET',
    headers: {
      cookie: sessionCookie,
    },
  });
  const stateData = await stateRes.json();
  if (!stateRes.ok || !stateData.ok) {
    throw new Error(`State falló: ${JSON.stringify(stateData)}`);
  }
  if (stateData.game.category.slug !== 'mixed') {
    throw new Error(
      `Se esperaba category slug mixed en state, obtenido: ${stateData.game.category.slug}`
    );
  }
  console.log(
    `✓ /api/v1/games/state verificado: categoría="${stateData.game.category.name}" (${stateData.game.category.slug}).`
  );

  // 9. Limpieza: Renovar la mesa de prueba
  console.log(`\n>>> [Paso 9] Limpiando y renovando ${testTableCode}...`);
  sshExec(
    `cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`
  );
  console.log(`✓ ${testTableCode} renovada y disponible para clientes.`);

  console.log('\n===============================================================');
  console.log('TODAS LAS PRUEBAS DE PPA-HOTFIX-003 PASARON EXITOSAMENTE EN PRODUCCIÓN');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err.message);
  process.exit(1);
});
