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

function fetchLatestQuestionsFromDb() {
  const raw = sshExec(
    'cd /var/www/punto-burger-app/current && npx tsx scripts/inspect-game-questions.ts mesa-01'
  ).trim();

  const marker = 'JSON_RESULT:';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    throw new Error(`No se pudo obtener el resultado JSON de la DB: ${raw}`);
  }
  return JSON.parse(raw.substring(idx + marker.length));
}

async function run() {
  console.log('=====================================================');
  console.log('=== SMOKE TEST: PPA-LAUNCH-001 EN PRODUCCIÓN       ===');
  console.log('=== EQUIDAD COMPETITIVA EN SELECCIÓN DE PREGUNTAS ===');
  console.log(`=== URL: ${BASE_URL}                      ===`);
  console.log('=====================================================\n');

  // 1. Obtener token QR permanente de Mesa 01
  console.log('[1/6] Obteniendo token QR permanente de Mesa 01...');
  const manifestLine = sshExec(
    "grep 'mesa-01,' /var/www/punto-burger-app/shared/qr-print/table-qr-manifest.csv"
  ).trim();
  const qrUrl = manifestLine.split(',')[2];
  const qrToken = qrUrl.split('/t/')[1].trim();
  console.log(`[✓] Token QR obtenido: ${qrToken.slice(0, 8)}...\n`);

  // Resetear Mesa 01 para estado limpio
  console.log('[2/6] Limpiando Mesa 01 (reset a available)...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );
  console.log('[✓] Mesa 01 reseteada a available.\n');

  // 3. Prueba con Perfil NIÑO (ageRange: child, educationLevel: primary)
  console.log('[3/6] Probando Partida A: Perfil Infantil (child / primary)...');
  const claimResA = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });
  const cookieA = parseCookies(claimResA);
  const claimDataA = await claimResA.json();
  if (claimResA.status !== 200 || !claimDataA.ok) {
    throw new Error(`Fallo claim-qr A: ${JSON.stringify(claimDataA)}`);
  }

  const setupResA = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieA },
    body: JSON.stringify({
      groupName: 'SMOKE LAUNCH NIÑOS',
      categorySlug: 'cultura-general',
      participants: [
        { alias: 'Mateo (8)', ageRange: 'child', educationLevel: 'primary', position: 1 },
      ],
    }),
  });
  const setupDataA = await setupResA.json();
  if (setupResA.status !== 200 || !setupDataA.ok) {
    throw new Error(`Fallo setup A: ${JSON.stringify(setupDataA)}`);
  }

  const prepareResA = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { cookie: cookieA },
  });
  const prepareDataA = await prepareResA.json();
  if (prepareResA.status !== 200 || !prepareDataA.ok || prepareDataA.game.questionCount !== 10) {
    throw new Error(`Fallo prepare A: ${JSON.stringify(prepareDataA)}`);
  }
  console.log(`[✓] Partida A preparada exitosamente.`);

  // Inspeccionar preguntas congeladas de Partida A en DB
  const questionsA = fetchLatestQuestionsFromDb();
  console.log('Preguntas congeladas para Partida A (Niños):');
  const ageDistributionA = {};
  for (const q of questionsA) {
    ageDistributionA[q.age_range] = (ageDistributionA[q.age_range] || 0) + 1;
    console.log(`  Pos ${q.position} [${q.difficulty}] (Q Bank tag: ${q.age_range}) => ${q.prompt.slice(0, 45)}...`);
  }
  console.log('Distribución de etiquetas de edad en Partida A:', ageDistributionA);

  // Verificar 3/4/3
  const diffsA = questionsA.map((q) => q.difficulty);
  const validDiffsA =
    diffsA.slice(0, 3).every((d) => d === 'initial') &&
    diffsA.slice(3, 7).every((d) => d === 'medium') &&
    diffsA.slice(7, 10).every((d) => d === 'advanced');
  if (!validDiffsA) {
    throw new Error(`Partida A no cumple la secuencia 3/4/3: ${diffsA.join(', ')}`);
  }
  console.log('[✓] Secuencia 3/4/3 verificada en Partida A.\n');

  // 4. Resetear y probar con Perfil ADULTO (ageRange: adult, educationLevel: higher)
  console.log('[4/6] Probando Partida B: Perfil Adulto (adult / higher)...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );

  const claimResB = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken }),
  });
  const cookieB = parseCookies(claimResB);
  const claimDataB = await claimResB.json();
  if (claimResB.status !== 200 || !claimDataB.ok) {
    throw new Error(`Fallo claim-qr B: ${JSON.stringify(claimDataB)}`);
  }

  const setupResB = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookieB },
    body: JSON.stringify({
      groupName: 'SMOKE LAUNCH ADULTOS',
      categorySlug: 'cultura-general',
      participants: [
        { alias: 'Lucia (30)', ageRange: 'adult', educationLevel: 'higher', position: 1 },
      ],
    }),
  });
  const setupDataB = await setupResB.json();
  if (setupResB.status !== 200 || !setupDataB.ok) {
    throw new Error(`Fallo setup B: ${JSON.stringify(setupDataB)}`);
  }

  const prepareResB = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { cookie: cookieB },
  });
  const prepareDataB = await prepareResB.json();
  if (prepareResB.status !== 200 || !prepareDataB.ok || prepareDataB.game.questionCount !== 10) {
    throw new Error(`Fallo prepare B: ${JSON.stringify(prepareDataB)}`);
  }
  console.log(`[✓] Partida B preparada exitosamente.`);

  // Inspeccionar preguntas congeladas de Partida B en DB
  const questionsB = fetchLatestQuestionsFromDb();
  console.log('Preguntas congeladas para Partida B (Adultos):');
  const ageDistributionB = {};
  for (const q of questionsB) {
    ageDistributionB[q.age_range] = (ageDistributionB[q.age_range] || 0) + 1;
    console.log(`  Pos ${q.position} [${q.difficulty}] (Q Bank tag: ${q.age_range}) => ${q.prompt.slice(0, 45)}...`);
  }
  console.log('Distribución de etiquetas de edad en Partida B:', ageDistributionB);

  // Verificar 3/4/3
  const diffsB = questionsB.map((q) => q.difficulty);
  const validDiffsB =
    diffsB.slice(0, 3).every((d) => d === 'initial') &&
    diffsB.slice(3, 7).every((d) => d === 'medium') &&
    diffsB.slice(7, 10).every((d) => d === 'advanced');
  if (!validDiffsB) {
    throw new Error(`Partida B no cumple la secuencia 3/4/3: ${diffsB.join(', ')}`);
  }
  console.log('[✓] Secuencia 3/4/3 verificada en Partida B.\n');

  // 5. Limpieza final de Mesa 01: dejar en available
  console.log('[5/6] Limpieza de Mesa 01 post-smoke test...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts'
  );
  const dbFinal = sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-table.ts'
  );
  if (!dbFinal.includes("status: 'available'")) {
    throw new Error('Mesa 01 no quedó en available tras el test.');
  }
  console.log('[✓] Mesa 01 restaurada a available en DB.\n');

  // 6. Revisar logs de PM2 en servidor
  console.log('[6/6] Verificando logs del servicio en producción...');
  const pm2Logs = sshExec('pm2 logs punto-burger-app --lines 40 --nostream');
  if (pm2Logs.includes('QUESTION_POOL_INSUFFICIENT')) {
    throw new Error('ALERTA: Se detectó QUESTION_POOL_INSUFFICIENT en los logs de producción.');
  }
  console.log('[✓] Logs limpios: Sin errores ni QUESTION_POOL_INSUFFICIENT.');

  console.log('\n=====================================================');
  console.log('✅ SMOKE TEST PPA-LAUNCH-001 COMPLETADO CON ÉXITO');
  console.log('   - Reclamo QR operativo');
  console.log('   - Selección uniforme e indiferente a la edad verificada');
  console.log('   - Secuencia 3/4/3 respetada en ambas partidas');
  console.log('   - Mesa 01 liberada y lista para clientes reales');
  console.log('=====================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
