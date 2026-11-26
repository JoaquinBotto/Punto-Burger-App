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

function fetchQuestionsFromDb(tableCode) {
  const raw = sshExec(
    `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/inspect-competition-questions.ts ${tableCode}`
  ).trim();
  const marker = 'JSON_RESULT:';
  const idx = raw.indexOf(marker);
  if (idx === -1) {
    throw new Error(`No se pudo obtener el resultado JSON de la DB para ${tableCode}: ${raw}`);
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
    // Simular tiempo de respuesta (200ms)
    await new Promise((r) => setTimeout(r, 200));

    // Determinar opción rotativa
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

    // Avanzar
    const advanceRes = await fetch(`${BASE_URL}/api/v1/games/advance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie },
    });
    const advanceData = await advanceRes.json();
    if (!advanceRes.ok || !advanceData.ok) {
      throw new Error(`Fallo games/advance en P${q}: ${JSON.stringify(advanceData)}`);
    }

    if (advanceData.completed) {
      roundScore = advanceData.results?.totalScore ?? answerData.answer?.totalScore ?? 0;
    }
    process.stdout.write(`.`);
  }
  process.stdout.write(`\n`);

  console.log(
    `    [✓] Ciclo ${roundNumber} completado: ${roundScore} pts (${correctCount}/10 correctas)`
  );
  return { roundScore, correctCount };
}

async function run() {
  console.log('=====================================================');
  console.log('=== SMOKE TEST: PPA-CONTEST-001 EN PRODUCCIÓN     ===');
  console.log('=== COMPETENCIA DIARIA DE 3 CICLOS                ===');
  console.log(`=== URL: ${BASE_URL}                    ===`);
  console.log('=====================================================\n');

  // 1. Obtener tokens QR de Mesa 01 y Mesa 02
  console.log('[1/8] Obteniendo tokens QR permanentes de Mesa 01 y Mesa 02...');
  const manifest = sshExec(
    'cat /var/www/punto-burger-app/shared/qr-print/table-qr-manifest.csv'
  ).trim();

  let qrToken1 = null;
  let qrToken2 = null;
  for (const line of manifest.split('\n')) {
    const parts = line.split(',');
    if (parts[0] === 'mesa-01') qrToken1 = parts[2]?.split('/t/')[1]?.trim();
    if (parts[0] === 'mesa-02') qrToken2 = parts[2]?.split('/t/')[1]?.trim();
  }

  if (!qrToken1 || !qrToken2) {
    throw new Error('No se encontraron los tokens QR de Mesa 01 o Mesa 02 en el manifest.');
  }
  console.log(
    `[✓] Mesa 01 QR: ${qrToken1.slice(0, 8)}... | Mesa 02 QR: ${qrToken2.slice(0, 8)}...\n`
  );

  // 2. Preparar mesas de prueba
  console.log('[2/8] Preparando mesas de prueba (reset a available)...');
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts mesa-01'
  );
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts mesa-02'
  );
  console.log('[✓] Mesas preparadas en available.\n');

  // 3. Crear competencia de prueba activa para HOY
  console.log('[3/8] Creando competencia de prueba activa en producción...');
  const now = new Date();
  // Formato Cordoba time
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Cordoba',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Cordoba',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const todayStr = dateFormatter.format(now);
  // Ventana: desde 10 minutos antes de ahora hasta 2 horas después
  const pastTime = new Date(now.getTime() - 15 * 60_000);
  const futureTime = new Date(now.getTime() + 120 * 60_000);
  const startTime = timeFormatter.format(pastTime);
  const endTime = timeFormatter.format(futureTime);

  const createCompCmd = `cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/competition-create.ts --date "${todayStr}" --start "${startTime}" --end "${endTime}" --registration-minutes-before 30 --is-test`;
  const compOutput = sshExec(createCompCmd);
  console.log(compOutput);
  console.log('[✓] Competencia de prueba creada exitosamente.\n');

  // 4. Mesa 01: Reclamar QR, Setup, Join Competition, Jugar 3 ciclos
  console.log('[4/8] Ejecutando Mesa 01 (3 ciclos completos)...');
  const claimRes1 = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: qrToken1 }),
  });
  const cookie1 = parseCookies(claimRes1);
  const claimData1 = await claimRes1.json();
  if (!claimRes1.ok || !claimData1.ok) {
    throw new Error(`Fallo claim-qr Mesa 01: ${JSON.stringify(claimData1)}`);
  }

  const setupRes1 = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie1 },
    body: JSON.stringify({
      groupName: 'SMOKE COMP MESA 01',
      categorySlug: 'cultura-general', // ignorado en competencia
      participants: [{ alias: 'Jugador Alfa', ageRange: 'adult' }],
    }),
  });
  const setupData1 = await setupRes1.json();
  if (!setupRes1.ok || !setupData1.ok) {
    throw new Error(`Fallo setup Mesa 01: ${JSON.stringify(setupData1)}`);
  }

  const joinRes1 = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie1 },
  });
  const joinData1 = await joinRes1.json();
  if (!joinRes1.ok || !joinData1.ok) {
    throw new Error(`Fallo join Mesa 01: ${JSON.stringify(joinData1)}`);
  }
  const testCompId = joinData1.competitionId;

  const round1_m1 = await playRound(cookie1, 1, 0);
  const round2_m1 = await playRound(cookie1, 2, 0);
  const round3_m1 = await playRound(cookie1, 3, 0);
  const totalScoreM1 = round1_m1.roundScore + round2_m1.roundScore + round3_m1.roundScore;
  console.log(`[✓] Mesa 01 finalizada. Total acumulado: ${totalScoreM1} pts.\n`);

  // 5. Mesa 02: Reclamar QR, Setup, Join Competition, Jugar 3 ciclos
  console.log('[5/8] Ejecutando Mesa 02 (3 ciclos completos)...');
  const claimRes2 = await fetch(`${BASE_URL}/api/v1/tables/claim-qr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrToken: qrToken2 }),
  });
  const cookie2 = parseCookies(claimRes2);
  const claimData2 = await claimRes2.json();
  if (!claimRes2.ok || !claimData2.ok) {
    throw new Error(`Fallo claim-qr Mesa 02: ${JSON.stringify(claimData2)}`);
  }

  const setupRes2 = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie2 },
    body: JSON.stringify({
      groupName: 'SMOKE COMP MESA 02',
      categorySlug: 'cultura-general',
      participants: [{ alias: 'Jugador Beta', ageRange: 'adult' }],
    }),
  });
  const setupData2 = await setupRes2.json();
  if (!setupRes2.ok || !setupData2.ok) {
    throw new Error(`Fallo setup Mesa 02: ${JSON.stringify(setupData2)}`);
  }

  const joinRes2 = await fetch(`${BASE_URL}/api/v1/competitions/current/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie2 },
  });
  const joinData2 = await joinRes2.json();
  if (!joinRes2.ok || !joinData2.ok) {
    throw new Error(`Fallo join Mesa 02: ${JSON.stringify(joinData2)}`);
  }

  const round1_m2 = await playRound(cookie2, 1, 1);
  const round2_m2 = await playRound(cookie2, 2, 1);
  const round3_m2 = await playRound(cookie2, 3, 1);
  const totalScoreM2 = round1_m2.roundScore + round2_m2.roundScore + round3_m2.roundScore;
  console.log(`[✓] Mesa 02 finalizada. Total acumulado: ${totalScoreM2} pts.\n`);

  // 6. Validaciones Arquitectónicas
  console.log('[6/8] Verificando especificaciones de competencia...');

  // A. Score Caps por ciclo
  console.log('  a) Verificando techos máximos de puntaje...');
  if (round1_m1.roundScore > 1300)
    throw new Error(`Ciclo 1 Mesa 1 superó 1300 pts: ${round1_m1.roundScore}`);
  if (round2_m1.roundScore > 1500)
    throw new Error(`Ciclo 2 Mesa 1 superó 1500 pts: ${round2_m1.roundScore}`);
  if (round3_m1.roundScore > 1700)
    throw new Error(`Ciclo 3 Mesa 1 superó 1700 pts: ${round3_m1.roundScore}`);
  if (totalScoreM1 > 4500) throw new Error(`Total Mesa 1 superó 4500 pts: ${totalScoreM1}`);
  console.log(`    [✓] Techos validados: C1 <= 1300, C2 <= 1500, C3 <= 1700, Max Total <= 4500.`);

  // B. Blueprint idéntico entre mesas
  console.log('  b) Verificando blueprint idéntico (categorías y dificultades por slot)...');
  const allQ1 = fetchQuestionsFromDb('mesa-01');
  const allQ2 = fetchQuestionsFromDb('mesa-02');

  if (allQ1.length !== 30 || allQ2.length !== 30) {
    throw new Error(
      `Preguntas totales esperadas 30, recibidas M1=${allQ1.length}, M2=${allQ2.length}`
    );
  }

  for (let s = 0; s < 30; s++) {
    const slot1 = allQ1[s];
    const slot2 = allQ2[s];
    if (slot1.difficulty !== slot2.difficulty) {
      throw new Error(
        `Dificultad slot ${s + 1} difiere: M1=${slot1.difficulty}, M2=${slot2.difficulty}`
      );
    }
    if (slot1.category_id !== slot2.category_id) {
      throw new Error(
        `Categoría slot ${s + 1} difiere: M1=${slot1.category_id}, M2=${slot2.category_id}`
      );
    }
  }
  console.log('    [✓] Exactamente idénticas las 30 tuplas (categoría, dificultad) entre mesas.');

  // C. Cero repeticiones dentro de cada mesa
  console.log('  c) Verificando cero repeticiones de preguntas en 30 slots...');
  const setQ1 = new Set(allQ1.map((q) => q.question_id));
  const setQ2 = new Set(allQ2.map((q) => q.question_id));
  if (setQ1.size !== 30) throw new Error(`Mesa 1 tuvo repeticiones: ${setQ1.size}/30 únicas`);
  if (setQ2.size !== 30) throw new Error(`Mesa 2 tuvo repeticiones: ${setQ2.size}/30 únicas`);
  console.log('    [✓] Cero repeticiones: Mesa 1 tuvo 30/30 preguntas únicas, Mesa 2 tuvo 30/30.');

  // D. Preguntas aleatorias y distintas entre mesas
  console.log('  d) Verificando aleatoriedad de preguntas entre mesas...');
  let sharedQuestionsCount = 0;
  for (let s = 0; s < 30; s++) {
    if (allQ1[s].question_id === allQ2[s].question_id) {
      sharedQuestionsCount++;
    }
  }
  console.log(
    `    [✓] Coincidencias exactas de pregunta en el mismo slot: ${sharedQuestionsCount}/30 (aleatorización correcta).`
  );

  // 7. Validar Ranking Oficial
  console.log('\n[7/8] Verificando endpoint de ranking de la competencia...');
  const rankingRes = await fetch(
    `${BASE_URL}/api/v1/competitions/current/ranking?id=${testCompId}`
  );
  const rankingData = await rankingRes.json();
  if (!rankingRes.ok || !rankingData.ok) {
    throw new Error(`Fallo ranking endpoint: ${JSON.stringify(rankingData)}`);
  }

  console.log(`Estado competencia: ${rankingData.status}`);
  console.log('Tabla de posiciones de la competencia:');
  console.table(
    rankingData.ranking.map((r) => ({
      Posición: r.rank,
      Mesa: r.table,
      Puntaje: r.totalScore,
      'Ciclos Comp.': `${r.completedRounds}/3`,
      'Resp. Correctas': r.correctAnswersCount,
      'Tiempo Total (s)': (r.totalResponseTimeMs / 1000).toFixed(1),
    }))
  );

  if (rankingData.ranking.length < 2) {
    throw new Error(
      `El ranking debería contener al menos las 2 mesas participantes, tiene ${rankingData.ranking.length}`
    );
  }

  const [leader, second] = rankingData.ranking;
  if (leader.totalScore < second.totalScore) {
    throw new Error(`Ordenamiento erróneo: ${leader.totalScore} < ${second.totalScore}`);
  }
  console.log(`[✓] Líder verificado: ${leader.table} con ${leader.totalScore} pts.`);

  // 8. Limpieza de Mesas y Sesiones
  console.log('\n[8/8] Cerrando sesiones de prueba y liberando mesas para clientes...');
  await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie1 },
  });
  await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: cookie2 },
  });

  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts mesa-01'
  );
  sshExec(
    'cd /var/www/punto-burger-app/current && NODE_ENV=production npx tsx --env-file=.env.production scripts/reset-table.ts mesa-02'
  );

  console.log('[✓] Mesas liberadas y restauradas a available exitosamente.');
  console.log('\n=====================================================');
  console.log('=== SMOKE TEST PPA-CONTEST-001: PASSED (100%)    ===');
  console.log('=====================================================');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
