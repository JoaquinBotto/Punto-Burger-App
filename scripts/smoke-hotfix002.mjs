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
  console.log('SMOKE TEST PPA-HOTFIX-002: IDEMPOTENCIA EN SETUP Y COMPETENCIA');
  console.log(`Target: ${BASE_URL}`);
  console.log('===============================================================\n');

  const testTableCode = 'mesa-02';

  // 0. Renovar mesa de prueba antes de comenzar
  console.log(`>>> [Paso 0] Renovando ${testTableCode}...`);
  sshExec(`cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`);

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
  console.log(`✓ Mesa ${testTableCode} reclamada con éxito. Cookie obtenida.`);

  // 2. Guardar setup inicial
  console.log('\n>>> [Paso 2] Guardando setup inicial de grupo y participantes...');
  const initialSetupPayload = {
    groupName: 'Los Idempotentes',
    categorySlug: 'cultura-general',
    participants: [
      { alias: 'Joaco Test', ageRange: 'adult', educationLevel: null, position: 1 },
      { alias: 'Sofi Test', ageRange: 'adult', educationLevel: null, position: 2 },
    ],
  };

  const setupRes1 = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify(initialSetupPayload),
  });
  const setupData1 = await setupRes1.json();
  if (!setupRes1.ok || !setupData1.ok) {
    throw new Error(`Setup 1 falló: ${JSON.stringify(setupData1)}`);
  }
  const participantIds1 = setupData1.participants.map((p) => p.id);
  const groupId1 = setupData1.group.id;
  console.log(`✓ Setup inicial guardado: groupId=${groupId1}, participants=${participantIds1.join(', ')}`);

  // 3. REINTENTO de setup con el MISMO payload (simula retry de red)
  console.log('\n>>> [Paso 3] Reintentando setup con IDÉNTICO payload (simulación de drop/doble clic)...');
  const setupRes2 = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify(initialSetupPayload),
  });
  const setupData2 = await setupRes2.json();
  if (!setupRes2.ok || !setupData2.ok) {
    throw new Error(`Reintento de Setup falló: ${JSON.stringify(setupData2)}`);
  }
  const participantIds2 = setupData2.participants.map((p) => p.id);
  const groupId2 = setupData2.group.id;

  if (groupId1 !== groupId2) {
    throw new Error(`Group ID cambió en retry: ${groupId1} vs ${groupId2}`);
  }
  if (participantIds1.join(',') !== participantIds2.join(',')) {
    throw new Error(`Participant IDs cambiaron en retry: ${participantIds1} vs ${participantIds2}`);
  }
  console.log('✓ Idempotencia de Setup validada: los IDs de participantes se preservaron idénticos sin error.');

  // 4. Inscribirse a la competencia
  console.log('\n>>> [Paso 4] Inscribiendo mesa a la competencia activa...');
  const joinRes1 = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const joinData1 = await joinRes1.json();
  if (!joinRes1.ok || !joinData1.ok) {
    throw new Error(`Join 1 falló: ${JSON.stringify(joinData1)}`);
  }
  const entryId1 = joinData1.entryId;
  console.log(`✓ Inscripción inicial exitosa: entryId=${entryId1}`);

  // 5. REINTENTO de inscripción a la competencia
  console.log('\n>>> [Paso 5] Reintentando inscripción a la competencia (simulación de retry)...');
  const joinRes2 = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const joinData2 = await joinRes2.json();
  if (!joinRes2.ok || !joinData2.ok) {
    throw new Error(`Reintento de Join falló: ${JSON.stringify(joinData2)}`);
  }
  const entryId2 = joinData2.entryId;
  if (entryId1 !== entryId2) {
    throw new Error(`Entry ID duplicada en retry: ${entryId1} vs ${entryId2}`);
  }
  console.log('✓ Idempotencia de Join validada: se retornó la entrada existente sin duplicados.');

  // 6. Preparar Ronda 1 (Ciclo 1)
  console.log('\n>>> [Paso 6] Preparando Ciclo 1 (rounds/next)...');
  const roundRes1 = await fetch(`${BASE_URL}/api/v1/competitions/current/rounds/next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const roundData1 = await roundRes1.json();
  if (!roundRes1.ok || !roundData1.ok) {
    throw new Error(`Round 1 prepare falló: ${JSON.stringify(roundData1)}`);
  }
  const gameSessionId1 = roundData1.gameSessionId;
  console.log(`✓ Ciclo 1 preparado: roundNumber=${roundData1.roundNumber}, gameSessionId=${gameSessionId1}`);

  // 7. REINTENTO de preparación de Ronda 1
  console.log('\n>>> [Paso 7] Reintentando rounds/next para Ciclo 1 (simulación de drop/doble clic)...');
  const roundRes2 = await fetch(`${BASE_URL}/api/v1/competitions/current/rounds/next`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({}),
  });
  const roundData2 = await roundRes2.json();
  if (!roundRes2.ok || !roundData2.ok) {
    throw new Error(`Reintento de Round 1 falló: ${JSON.stringify(roundData2)}`);
  }
  if (!roundData2.existing) {
    throw new Error(`Se esperaba existing: true en retry de ronda, obtenido: ${JSON.stringify(roundData2)}`);
  }
  if (roundData2.gameSessionId !== gameSessionId1) {
    throw new Error(`GameSessionId difiere en retry: ${gameSessionId1} vs ${roundData2.gameSessionId}`);
  }
  console.log('✓ Idempotencia de rounds/next validada: existing=true, misma partida devuelta.');

  // 8. Reintento de Setup con preguntas congeladas
  console.log('\n>>> [Paso 8] Verificando comportamiento de setup con preguntas congeladas:');
  console.log('    a) Con payload idéntico (debe ser 200 OK idempotente sin error de FK)');
  const setupResFrozenSame = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify(initialSetupPayload),
  });
  const setupDataFrozenSame = await setupResFrozenSame.json();
  if (!setupResFrozenSame.ok || !setupDataFrozenSame.ok) {
    throw new Error(`Setup con payload idéntico y preguntas congeladas falló: ${JSON.stringify(setupDataFrozenSame)}`);
  }
  console.log('    ✓ Payload idéntico retornó 200 OK sin tocar participantes referenciados ni violar FKs.');

  console.log('    b) Con payload modificado (debe ser 409 Conflict SETUP_ALREADY_LOCKED)');
  const modifiedSetupPayload = {
    ...initialSetupPayload,
    groupName: 'Nombre Cambiado',
  };
  const setupResFrozenDiff = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify(modifiedSetupPayload),
  });
  const setupDataFrozenDiff = await setupResFrozenDiff.json();
  if (setupResFrozenDiff.status !== 409 || setupDataFrozenDiff.error?.code !== 'SETUP_ALREADY_LOCKED') {
    throw new Error(`Se esperaba 409 SETUP_ALREADY_LOCKED, obtenido status=${setupResFrozenDiff.status}: ${JSON.stringify(setupDataFrozenDiff)}`);
  }
  console.log(`    ✓ Payload modificado rechazado limpiamente con 409 SETUP_ALREADY_LOCKED: "${setupDataFrozenDiff.error?.message}"`);

  // 9. Iniciar partida y responder 1 pregunta para validar gameplay
  console.log('\n>>> [Paso 9] Iniciando juego y respondiendo 1 pregunta...');
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
    throw new Error(`Start game falló: ${JSON.stringify(startData)}`);
  }
  console.log(`✓ Partida iniciada: status=${startData.game.status}`);

  const q1 = startData.question;
  const answerRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: sessionCookie,
    },
    body: JSON.stringify({
      questionId: q1.id,
      selectedOption: 'A',
    }),
  });
  const answerData = await answerRes.json();
  if (!answerRes.ok || !answerData.ok) {
    throw new Error(`Answer falló: ${JSON.stringify(answerData)}`);
  }
  console.log(`✓ Pregunta 1 respondida: result=${answerData.answer.result}, pointsAwarded=${answerData.answer.pointsAwarded}`);

  // 10. Limpieza y renovación final de mesa de prueba
  console.log(`\n>>> [Paso 10] Renovando ${testTableCode} para dejarla disponible...`);
  sshExec(`cd /var/www/punto-burger-app/current && npm run table:renew -- ${testTableCode} --force`);
  console.log(`✓ Mesa ${testTableCode} renovada y disponible.`);

  console.log('\n===============================================================');
  console.log('✅ PPA-HOTFIX-002 PRODUCTION SMOKE TEST = PASSED');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
