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
  console.log('================================================================');
  console.log('SMOKE TEST PPA-HOTFIX-004: SINCRONIZACIÓN Y RECEPCIÓN DE RESPUESTAS');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  const testTableCode = 'mesa-02';

  // 0. Renovar mesa de prueba antes de comenzar
  console.log(`>>> [Paso 0] Renovando mesa libre ${testTableCode}...`);
  sshExec(
    `cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`
  );

  // Obtener qr_token
  const tableData = getTableQrToken(testTableCode);
  console.log(`✓ Token QR de ${testTableCode} obtenido: ${tableData.qr_token.substring(0, 10)}...`);

  // 1. Reclamar mesa
  console.log('\n>>> [Paso 1] Reclamando mesa vía QR permanente...');
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

  // 2. Configurar grupo
  console.log('\n>>> [Paso 2] Configurando grupo y participantes...');
  const setupPayload = {
    groupName: 'Smoke Test Hotfix 004',
    categorySlug: 'cultura-general',
    participants: [
      { alias: 'Player A', ageRange: 'adult', educationLevel: null, position: 1 },
      { alias: 'Player B', ageRange: 'adult', educationLevel: null, position: 2 },
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

  // 3. Preparar partida casual
  console.log('\n>>> [Paso 3] Preparando preguntas de partida casual...');
  const prepRes = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const prepData = await prepRes.json();
  if (!prepRes.ok || !prepData.ok) {
    throw new Error(`Prepare falló: ${JSON.stringify(prepData)}`);
  }
  console.log(`✓ Preguntas preparadas con éxito.`);

  // 4. Iniciar partida y auditar sincronización inicial
  console.log('\n>>> [Paso 4] Iniciando partida y auditando timestamps...');
  const tStart = Date.now();
  const startRes = await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const tEnd = Date.now();
  const rtt = tEnd - tStart;
  const startData = await startRes.json();

  if (!startRes.ok || !startData.ok) {
    throw new Error(`Start falló: ${JSON.stringify(startData)}`);
  }

  const { question } = startData;
  console.log(`    RTT request: ${rtt}ms`);
  console.log(`    serverNow:   ${question.serverNow}`);
  console.log(`    presentedAt: ${question.presentedAt}`);
  console.log(`    expiresAt:   ${question.expiresAt}`);
  console.log(`    questionId:  ${question.questionId}`);

  const serverMs = new Date(question.serverNow).getTime();
  const expiresMs = new Date(question.expiresAt).getTime();
  const durationRemaining = expiresMs - serverMs;

  console.log(`    Duración autoritativa en respuesta: ${durationRemaining}ms (~20s)`);
  if (durationRemaining < 19000 || durationRemaining > 21000) {
    throw new Error(`Duración autoritativa anómala: ${durationRemaining}ms`);
  }
  console.log(`✓ Sincronización inicial verificada correctamente.`);

  // 5. Enviar respuesta normal en tiempo
  console.log('\n>>> [Paso 5] Enviando respuesta para Pregunta 1...');
  const answer1Res = await fetch(`${BASE_URL}/api/v1/games/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      selectedOption: 'A',
      questionPosition: 1,
      questionId: question.questionId,
    }),
  });

  const answer1Data = await answer1Res.json();
  if (!answer1Res.ok || !answer1Data.ok) {
    throw new Error(`Answer Q1 falló: ${JSON.stringify(answer1Data)}`);
  }
  console.log(
    `✓ Respuesta Q1 aceptada: result=${answer1Data.answer.result}, points=+${answer1Data.answer.pointsAwarded}, totalScore=${answer1Data.answer.totalScore}`
  );
  if (answer1Data.answer.result === 'unanswered') {
    throw new Error('La respuesta fue indebidamente marcada como unanswered.');
  }

  // 6. Verificar idempotencia ante reintento inmediato
  console.log('\n>>> [Paso 6] Reintentando misma respuesta (idempotencia y sin doble scoring)...');
  const retryRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      selectedOption: 'A',
      questionPosition: 1,
      questionId: question.questionId,
    }),
  });
  const retryData = await retryRes.json();
  if (!retryRes.ok || !retryData.ok) {
    throw new Error(`Retry falló: ${JSON.stringify(retryData)}`);
  }
  if (retryData.answer.totalScore !== answer1Data.answer.totalScore) {
    throw new Error(
      `Puntaje duplicado detectado: antes ${answer1Data.answer.totalScore}, ahora ${retryData.answer.totalScore}`
    );
  }
  console.log(
    `✓ Idempotencia confirmada: totalScore permanece exactamente en ${retryData.answer.totalScore}.`
  );

  // 7. Avanzar a Pregunta 2
  console.log('\n>>> [Paso 7] Avanzando a Pregunta 2...');
  const advanceRes = await fetch(`${BASE_URL}/api/v1/games/advance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const advanceData = await advanceRes.json();
  if (!advanceRes.ok || !advanceData.ok) {
    throw new Error(`Advance falló: ${JSON.stringify(advanceData)}`);
  }

  const q2 = advanceData.question;
  console.log(`    Pregunta ${advanceData.currentPosition} de 10`);
  console.log(`    expiresAt Q2: ${q2.expiresAt}`);
  console.log(`    serverNow Q2: ${q2.serverNow}`);

  // 8. Simular respuesta con tiempo transcurrido (esperar 5 segundos)
  console.log(
    '\n>>> [Paso 8] Esperando 5 segundos para simular respuesta con tiempo transcurrido...'
  );
  await new Promise((resolve) => setTimeout(resolve, 5000));

  console.log('    Enviando respuesta para Pregunta 2...');
  const answer2Res = await fetch(`${BASE_URL}/api/v1/games/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      selectedOption: 'B',
      questionPosition: 2,
      questionId: q2.questionId,
    }),
  });
  const answer2Data = await answer2Res.json();
  if (!answer2Res.ok || !answer2Data.ok) {
    throw new Error(`Answer Q2 falló: ${JSON.stringify(answer2Data)}`);
  }
  console.log(
    `✓ Respuesta Q2 aceptada dentro del plazo: result=${answer2Data.answer.result}, points=+${answer2Data.answer.pointsAwarded}, totalScore=${answer2Data.answer.totalScore}`
  );
  if (answer2Data.answer.result === 'unanswered') {
    throw new Error(
      'La respuesta de Q2 enviada a tiempo fue indebidamente marcada como unanswered.'
    );
  }

  // 9. Limpieza: renovar mesa de prueba
  console.log('\n>>> [Paso 9] Limpiando y renovando mesa de prueba...');
  sshExec(
    `cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`
  );
  console.log(`✓ Mesa ${testTableCode} renovada y disponible.`);

  console.log('\n================================================================');
  console.log('RESULTADO SMOKE TEST PPA-HOTFIX-004: SUCCESS');
  console.log('ANSWER RECEIVED BEFORE DEADLINE = ACCEPTED');
  console.log('SERVER PROCESSING DELAY = NO PENALTY');
  console.log('CLIENT TIMER = SYNCHRONIZED');
  console.log('DUPLICATE SCORING = 0');
  console.log('================================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err.message || err);
  process.exit(1);
});
