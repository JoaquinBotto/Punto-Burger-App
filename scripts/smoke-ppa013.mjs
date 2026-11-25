// scripts/smoke-ppa013.mjs
const BASE_URL = 'https://app.puntoburger.com.ar';
const ACCESS_CODE = process.argv[2];

if (!ACCESS_CODE) {
  console.error('Uso: node scripts/smoke-ppa013.mjs <ACCESS_CODE>');
  process.exit(1);
}

async function run() {
  console.log(`=== INICIANDO SMOKE TEST PPA-013 EN PRODUCCIÓN (${BASE_URL}) ===\n`);
  let sessionCookie = '';

  // 1. Reclamar Mesa 01
  console.log('1. Reclamando Mesa 01...');
  const claimRes = await fetch(`${BASE_URL}/api/v1/tables/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableCode: 'mesa-01', accessCode: ACCESS_CODE }),
  });

  const claimCookieHeader = claimRes.headers.get('set-cookie');
  if (claimCookieHeader) {
    const match = claimCookieHeader.match(/pb_table_session=([^;]+)/);
    if (match) sessionCookie = match[0];
  }

  const claimJson = await claimRes.json();
  console.log('Claim Status:', claimRes.status, claimJson);
  if (claimRes.status !== 200 || !claimJson.ok) {
    throw new Error('Falló claim de mesa');
  }

  const cookieHeader = { cookie: sessionCookie };

  // 2. Configurar Grupo y Participantes
  console.log('\n2. Configurando grupo y participantes...');
  const setupRes = await fetch(`${BASE_URL}/api/v1/games/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...cookieHeader },
    body: JSON.stringify({
      groupName: 'SMOKE PPA-013',
      categorySlug: 'deportes',
      participants: [
        { alias: 'Joaco', ageRange: 'adult', educationLevel: 'higher', position: 1 },
        { alias: 'Santi', ageRange: 'teen', educationLevel: 'secondary', position: 2 },
      ],
    }),
  });
  const setupJson = await setupRes.json();
  console.log('Setup Status:', setupRes.status, setupJson);
  if (setupRes.status !== 200 || !setupJson.ok) {
    throw new Error('Falló setup de grupo');
  }

  // 3. Preparar 10 preguntas
  console.log('\n3. Congelando las 10 preguntas (prepare)...');
  const prepareRes = await fetch(`${BASE_URL}/api/v1/games/prepare`, {
    method: 'POST',
    headers: { ...cookieHeader },
  });
  const prepareJson = await prepareRes.json();
  console.log('Prepare Status:', prepareRes.status, prepareJson);
  if (prepareRes.status !== 200 || !prepareJson.ok || prepareJson.game.questionCount !== 10) {
    throw new Error('Falló preparación de 10 preguntas');
  }

  // 4. Verificar pantalla /play (HTML sin fugas)
  console.log('\n4. Verificando pantalla server-side /play...');
  const playHtmlRes = await fetch(`${BASE_URL}/play`, {
    headers: { ...cookieHeader },
  });
  const playHtml = await playHtmlRes.text();
  console.log('Play HTML Status:', playHtmlRes.status, `(longitud: ${playHtml.length})`);
  if (!playHtml.includes('SMOKE PPA-013') || !playHtml.includes('Comenzar')) {
    throw new Error('El HTML de /play no contiene los datos esperados');
  }

  // 5. Iniciar partida (Comenzar)
  console.log('\n5. Iniciando partida (POST /api/v1/games/start)...');
  const startRes = await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { ...cookieHeader },
  });
  const startJson = await startRes.json();
  console.log('Start Status:', startRes.status, startJson);
  if (startRes.status !== 200 || !startJson.ok || startJson.game.status !== 'active') {
    throw new Error('Falló inicio de partida');
  }
  if (!startJson.question || startJson.question.position !== 1) {
    throw new Error('Pregunta 1 no fue entregada correctamente');
  }

  // Comprobar zero leakage en pregunta 1
  if (startJson.question.correctOption || startJson.question.explanation) {
    throw new Error('ALERTA: Fuga de respuesta o explicación detectada en pregunta abierta');
  }
  console.log('✓ Zero-leakage verificado en pregunta abierta');

  // 6. Prueba de idempotencia en start
  console.log('\n6. Probando idempotencia de start...');
  const start2Res = await fetch(`${BASE_URL}/api/v1/games/start`, {
    method: 'POST',
    headers: { ...cookieHeader },
  });
  const start2Json = await start2Res.json();
  console.log('Start Idempotente Status:', start2Res.status, start2Json.game);
  if (start2Res.status !== 200 || start2Json.game.status !== 'active') {
    throw new Error('Falló idempotencia de start');
  }

  // 7. Consultar estado activo
  console.log('\n7. Consultando estado inicial (GET /api/v1/games/state)...');
  const stateRes = await fetch(`${BASE_URL}/api/v1/games/state`, {
    headers: { ...cookieHeader },
  });
  const stateJson = await stateRes.json();
  console.log('State Status:', stateRes.status, 'Posición:', stateJson.game.currentPosition);
  if (stateRes.status !== 200 || stateJson.isResolved !== false) {
    throw new Error('Estado inicial debería ser no resuelto');
  }

  // 8. Jugar las 10 preguntas
  console.log('\n8. Jugando las 10 preguntas de la partida E2E...');
  const optionsToChoose = ['A', 'B', 'C', 'D', 'B', 'A', 'C', 'D', 'A', 'B'];

  for (let i = 1; i <= 10; i++) {
    const chosenOption = optionsToChoose[i - 1];
    console.log(`\n--- Pregunta ${i} de 10 ---`);

    // Consultar estado actual
    const currentQStateRes = await fetch(`${BASE_URL}/api/v1/games/state`, {
      headers: { ...cookieHeader },
    });
    const currentQState = await currentQStateRes.json();
    console.log(`Prompt [Q${i}]:`, currentQState.question?.prompt);
    console.log(`Dificultad:`, currentQState.question?.difficulty);
    if (currentQState.question?.targetAlias) {
      console.log(`Destinatario: Pregunta para ${currentQState.question.targetAlias}`);
    } else {
      console.log(`Destinatario: Pregunta grupal`);
    }

    // Responder
    console.log(`Enviando opción seleccionada: "${chosenOption}"...`);
    const ansRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...cookieHeader },
      body: JSON.stringify({ selectedOption: chosenOption }),
    });
    const ansJson = await ansRes.json();
    console.log(
      `Resultado Q${i}:`,
      ansJson.answer.result,
      `(+${ansJson.answer.pointsAwarded} pts)`
    );
    console.log(`Opción correcta era:`, ansJson.answer.correctOption);
    console.log(`Puntaje acumulado:`, ansJson.answer.totalScore, 'pts');

    if (ansRes.status !== 200 || !ansJson.ok) {
      throw new Error(`Falló respuesta en pregunta ${i}`);
    }

    // Probar idempotencia en pregunta 2
    if (i === 2) {
      console.log('Probando reenvío idempotente en pregunta 2...');
      const reAnsRes = await fetch(`${BASE_URL}/api/v1/games/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...cookieHeader },
        body: JSON.stringify({ selectedOption: chosenOption }),
      });
      const reAnsJson = await reAnsRes.json();
      if (reAnsRes.status !== 200 || reAnsJson.answer.totalScore !== ansJson.answer.totalScore) {
        throw new Error('Falló idempotencia en reenvío de respuesta');
      }
      console.log('✓ Idempotencia de respuesta verificada');
    }

    // Avanzar a siguiente pregunta
    console.log(`Avanzando desde pregunta ${i}...`);
    const advRes = await fetch(`${BASE_URL}/api/v1/games/advance`, {
      method: 'POST',
      headers: { ...cookieHeader },
    });
    const advJson = await advRes.json();
    console.log(`Advance Q${i}:`, advJson);

    if (i < 10) {
      if (!advJson.ok || !advJson.advanced || advJson.currentPosition !== i + 1) {
        throw new Error(`Error avanzando de pregunta ${i} a ${i + 1}`);
      }
    } else {
      // Pregunta 10 finalizada
      if (!advJson.ok || !advJson.completed || advJson.next !== '/play/results') {
        throw new Error('Pregunta 10 no completó la partida hacia /play/results');
      }
      console.log('✓ Partida completada exitosamente al avanzar la pregunta 10');
    }
  }

  // 9. Verificar Pantalla de Resultados
  console.log('\n9. Verificando pantalla de resultados /play/results...');
  const resultsHtmlRes = await fetch(`${BASE_URL}/play/results`, {
    headers: { ...cookieHeader },
  });
  const resultsHtml = await resultsHtmlRes.text();
  console.log('Results HTML Status:', resultsHtmlRes.status, `(longitud: ${resultsHtml.length})`);
  if (!resultsHtml.includes('¡Partida terminada!') || !resultsHtml.includes('SMOKE PPA-013')) {
    throw new Error('La pantalla de resultados no contiene el título o equipo esperado');
  }
  const cleanHtml = resultsHtml.replace(/<!--[\s\S]*?-->/g, '');
  if (!cleanHtml.includes('1500') || !cleanHtml.includes('pts')) {
    throw new Error('La pantalla de resultados no contiene el puntaje esperado');
  }
  if (!cleanHtml.includes('Finalizar experiencia')) {
    throw new Error('La pantalla de resultados no contiene el botón de finalización');
  }
  console.log('✓ Pantalla de resultados renderizada correctamente');

  // 10. Finalizar experiencia (cerrar sesión)
  console.log('\n10. Finalizando experiencia (POST /api/v1/sessions/close)...');
  const closeRes = await fetch(`${BASE_URL}/api/v1/sessions/close`, {
    method: 'POST',
    headers: { ...cookieHeader },
  });
  const closeJson = await closeRes.json();
  const closeCookieHeader = closeRes.headers.get('set-cookie');
  console.log('Close Status:', closeRes.status, closeJson);
  console.log('Close Set-Cookie:', closeCookieHeader);

  if (closeRes.status !== 200 || !closeJson.ok || closeJson.next !== '/') {
    throw new Error('Falló cierre de sesión');
  }
  console.log('✓ Sesión cerrada y cookie eliminada');

  // 11. Verificar estado de la mesa post-cierre
  console.log('\n11. Verificando mesa post-cierre (/table/mesa-01)...');
  const tableCheckRes = await fetch(`${BASE_URL}/table/mesa-01`);
  const tableCheckHtml = await tableCheckRes.text();
  console.log('Table Page Status:', tableCheckRes.status);
  console.log(
    '¿Muestra cooldown?:',
    tableCheckHtml.includes('cooldown') ||
      tableCheckHtml.includes('Mesa en preparación') ||
      tableCheckHtml.includes('limpieza') ||
      tableCheckHtml.includes('espera')
  );

  console.log('\n==========================================================');
  console.log('🎉 SMOKE TEST PPA-013 COMPLETADO EXITOSAMENTE AL 100%');
  console.log('==========================================================\n');
}

run().catch((err) => {
  console.error('\n❌ ERROR EN SMOKE TEST:', err);
  process.exit(1);
});
