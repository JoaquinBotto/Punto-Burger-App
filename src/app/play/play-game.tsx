'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BrandCard,
  BrandHeader,
  DifficultyBlocks,
  GameTimer,
  PrimaryButton,
} from '@/components/ui';

import type {
  ActiveQuestionView,
  AnswerFeedbackView,
  GameStateResult,
  PlayPageData,
} from '@/modules/trivia/types';

interface PlayGameProps {
  playData: PlayPageData;
  initialState?: GameStateResult | null;
}

export function PlayGame({ playData, initialState }: PlayGameProps) {
  const router = useRouter();

  // Estados de la partida
  const [gameStatus, setGameStatus] = useState<string>(
    initialState?.game.status ?? playData.gameStatus
  );
  const [currentPosition, setCurrentPosition] = useState<number>(
    initialState?.game.currentPosition ?? 1
  );
  const [totalScore, setTotalScore] = useState<number>(initialState?.game.totalScore ?? 0);
  const [question, setQuestion] = useState<ActiveQuestionView | null>(
    initialState?.question ?? null
  );
  const [feedback, setFeedback] = useState<AnswerFeedbackView | null>(
    initialState?.feedback ?? null
  );
  const [isResolved, setIsResolved] = useState<boolean>(initialState?.isResolved ?? false);

  // Estados de interacción
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(
    initialState?.feedback?.selectedOption ?? null
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Consulta el estado actualizado del juego desde el servidor
  const refreshGameState = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/games/state', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.replace('/');
          return;
        }
        return;
      }

      const data: GameStateResult = await res.json();
      if (data.ok) {
        setGameStatus(data.game.status);
        setCurrentPosition(data.game.currentPosition);
        setTotalScore(data.game.totalScore);
        setQuestion(data.question);
        setFeedback(data.feedback);
        setIsResolved(data.isResolved);
        if (data.feedback?.selectedOption) {
          setSelectedOption(data.feedback.selectedOption);
        }

        if (data.game.status === 'completed' || data.next === '/play/results') {
          router.push('/play/results');
        }
      }
    } catch (err) {
      console.error('Error al consultar estado de partida:', err);
    }
  }, [router]);

  // Si la partida ya está activa al montar y no teníamos pregunta, sincronizar asincrónicamente
  useEffect(() => {
    let active = true;
    if (gameStatus === 'active' && !question) {
      fetch('/api/v1/games/state', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: GameStateResult | null) => {
          if (active && data?.ok) {
            setGameStatus(data.game.status);
            setCurrentPosition(data.game.currentPosition);
            setTotalScore(data.game.totalScore);
            setQuestion(data.question);
            setFeedback(data.feedback);
            setIsResolved(data.isResolved);
            if (data.feedback?.selectedOption) {
              setSelectedOption(data.feedback.selectedOption);
            }
          }
        })
        .catch((err) => {
          console.error('Error al sincronizar estado de partida:', err);
        });
    }
    return () => {
      active = false;
    };
  }, [gameStatus, question]);

  // Iniciar partida (Comenzar)
  const handleStartGame = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/games/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message || 'No se pudo iniciar la partida.');
        return;
      }

      setGameStatus('active');
      setCurrentPosition(data.game.currentPosition);
      setQuestion(data.question);
      setIsResolved(false);
      setFeedback(null);
      setSelectedOption(null);
    } catch {
      setErrorMessage('Ocurrió un error de red al iniciar la partida.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar respuesta seleccionada
  const handleSubmitAnswer = async () => {
    if (!selectedOption || submitting || isResolved) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/games/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedOption }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message || 'No se pudo enviar la respuesta.');
        return;
      }

      setFeedback(data.answer);
      setIsResolved(true);
      setTotalScore(data.answer.totalScore);
    } catch {
      setErrorMessage('Ocurrió un error al enviar tu respuesta. Reintentá.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de expiración del temporizador (timeout)
  const handleTimeout = useCallback(() => {
    if (!isResolved && gameStatus === 'active') {
      refreshGameState();
    }
  }, [isResolved, gameStatus, refreshGameState]);

  // Avanzar a la siguiente pregunta o ver resultados
  const handleAdvance = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/games/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message || 'No se pudo avanzar de pregunta.');
        return;
      }

      if (data.completed || data.next === '/play/results') {
        router.push('/play/results');
        return;
      }

      if (data.question) {
        setQuestion(data.question);
        setCurrentPosition(data.currentPosition);
        setIsResolved(false);
        setFeedback(null);
        setSelectedOption(null);
      } else {
        await refreshGameState();
      }
    } catch {
      setErrorMessage('Error al avanzar a la siguiente pregunta.');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // VISTA 1: Pantalla Preparatoria (status === 'created')
  // ==========================================
  if (gameStatus === 'created' || !question) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
        <BrandCard>
          <BrandHeader tableBadge={playData.table.displayName} className="mb-6" />

          <div className="text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-pb-yellow-border bg-pb-yellow-light text-pb-yellow-hover shadow-xs">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-pb-charcoal sm:text-4xl">
              ¡Todo listo!
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-pb-red">
              {playData.group.name}
            </p>
            <p className="mt-2 text-sm text-pb-charcoal-muted">
              Preparamos 10 preguntas para tu equipo.
            </p>

            {/* Ficha Resumen de Partida */}
            <div className="mt-6 space-y-3 rounded-2xl border border-pb-cream-border bg-pb-cream/40 p-4 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">Categoría:</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-pb-red">
                  <span className="h-2 w-2 rounded-full bg-pb-yellow" />
                  {playData.category.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">Equipo:</span>
                <span className="font-bold text-pb-charcoal">{playData.group.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">Jugadores registrados:</span>
                <span className="font-bold text-pb-charcoal">
                  {playData.group.participantCount}
                </span>
              </div>

              {/* Estructura de Dificultad (3/4/3) */}
              <div className="border-t border-pb-cream-border/80 pt-3">
                <span className="block font-bold text-pb-charcoal mb-2">
                  Estructura de la partida (10 preguntas):
                </span>
                <DifficultyBlocks
                  initial={playData.structure.initial}
                  medium={playData.structure.medium}
                  advanced={playData.structure.advanced}
                />
                <div className="mt-2 flex justify-between text-[11px] text-pb-charcoal-light">
                  <span>{playData.structure.initial} iniciales</span>
                  <span>{playData.structure.medium} intermedias</span>
                  <span>{playData.structure.advanced} avanzadas</span>
                </div>
              </div>
            </div>

            {/* Reglas Operativas Clave */}
            <div className="mt-4 rounded-2xl border border-pb-yellow-border/60 bg-pb-yellow-light/60 p-3.5 text-left">
              <div className="flex items-start gap-2.5 text-xs text-pb-charcoal">
                <span className="text-base leading-none">⏱️</span>
                <p className="text-[11px] leading-relaxed">
                  Tenés <strong>20 segundos</strong> para responder cada pregunta. Las respuestas
                  correctas suman 100, 150 o 200 puntos según la dificultad.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-pb-red">
                {errorMessage}
              </div>
            )}

            {/* Botón de Inicio */}
            <div className="mt-6">
              <PrimaryButton onClick={handleStartGame} loading={submitting}>
                Comenzar
              </PrimaryButton>
            </div>
          </div>
        </BrandCard>
      </main>
    );
  }

  // ==========================================
  // VISTA 2: Gameplay Activo (status === 'active')
  // ==========================================
  const difficultyBadgeInfo = {
    initial: {
      label: 'Inicial',
      points: '+100 pts',
      color: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    },
    medium: {
      label: 'Intermedia',
      points: '+150 pts',
      color: 'border-amber-200 bg-amber-50 text-amber-800',
    },
    advanced: {
      label: 'Avanzada',
      points: '+200 pts',
      color: 'border-red-200 bg-red-50 text-pb-red',
    },
  }[question.difficulty];

  const options = [
    { key: 'A', text: question.optionA },
    { key: 'B', text: question.optionB },
    { key: 'C', text: question.optionC },
    { key: 'D', text: question.optionD },
  ] as const;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-6 text-center">
      <BrandCard>
        {/* Cabecera de Mesa y Puntaje */}
        <div className="flex items-center justify-between pb-3 border-b border-pb-cream-border">
          <BrandHeader tableBadge={playData.table.displayName} />
          <div className="flex items-center gap-1.5 rounded-full border border-pb-yellow-border bg-pb-yellow-light px-3 py-1 text-xs font-black text-pb-charcoal">
            <span>⭐</span>
            <span>{totalScore} pts</span>
          </div>
        </div>

        {/* Barra de Progreso: Pregunta X de 10 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-bold text-pb-charcoal-muted mb-1.5">
            <span>
              Pregunta <strong className="text-pb-charcoal">{currentPosition}</strong> de 10
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${difficultyBadgeInfo.color}`}
            >
              {difficultyBadgeInfo.label} ({difficultyBadgeInfo.points})
            </span>
          </div>

          <div className="grid grid-cols-10 gap-1 w-full">
            {Array.from({ length: 10 }).map((_, idx) => {
              const pos = idx + 1;
              const isPast = pos < currentPosition;
              const isCurrent = pos === currentPosition;

              return (
                <div
                  key={pos}
                  className={`h-1.5 rounded-full transition-all ${
                    isPast
                      ? 'bg-pb-red'
                      : isCurrent
                        ? 'bg-pb-yellow animate-pulse'
                        : 'bg-pb-cream-border'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Indicador de Destinatario */}
        <div className="mt-3 flex items-center justify-center">
          {question.targetAlias ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pb-yellow-border bg-pb-yellow-light/80 px-3 py-1 text-xs font-bold text-pb-charcoal">
              <span>🎯</span>
              <span>
                Pregunta para <strong className="text-pb-red">{question.targetAlias}</strong>
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-pb-cream-border bg-pb-cream/60 px-3 py-1 text-xs font-bold text-pb-charcoal-muted">
              <span>👥</span>
              <span>Pregunta grupal (¡debatan en equipo!)</span>
            </div>
          )}
        </div>

        {/* Temporizador Server-Authoritative */}
        <div className="mt-3">
          <GameTimer
            expiresAt={question.expiresAt}
            serverNow={question.serverNow}
            totalDurationSeconds={20}
            onTimeout={handleTimeout}
            isPaused={isResolved}
          />
        </div>

        {/* Enunciado de la Pregunta */}
        <div className="mt-4 mb-4 rounded-2xl border border-pb-cream-border bg-white p-4 text-left shadow-xs">
          <h2 className="text-base sm:text-lg font-bold leading-snug text-pb-charcoal">
            {question.prompt}
          </h2>
        </div>

        {/* Opciones de Respuesta A, B, C, D */}
        <div className="space-y-2.5 text-left">
          {options.map((opt) => {
            const isSelected = selectedOption === opt.key;
            const isCorrect = feedback?.correctOption === opt.key;
            const isUserWrong =
              isResolved && feedback?.result === 'incorrect' && feedback.selectedOption === opt.key;

            let buttonClass =
              'border-pb-cream-border bg-pb-cream/30 text-pb-charcoal hover:bg-pb-cream/70';

            if (!isResolved) {
              if (isSelected) {
                buttonClass =
                  'border-pb-yellow-hover bg-pb-yellow-light/80 text-pb-charcoal shadow-xs ring-2 ring-pb-yellow/40';
              }
            } else {
              // Estados de Feedback
              if (isCorrect) {
                buttonClass =
                  'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/50 font-bold';
              } else if (isUserWrong) {
                buttonClass =
                  'border-pb-red bg-red-50 text-pb-red ring-2 ring-pb-red/40 opacity-90 line-through';
              } else {
                buttonClass = 'border-stone-200 bg-stone-50 text-stone-400 opacity-60';
              }
            }

            return (
              <button
                key={opt.key}
                type="button"
                disabled={isResolved || submitting}
                onClick={() => setSelectedOption(opt.key)}
                className={`w-full flex items-center gap-3 rounded-2xl border p-3.5 text-left text-sm font-semibold transition-all ${buttonClass}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${
                    isResolved && isCorrect
                      ? 'bg-emerald-600 text-white'
                      : isResolved && isUserWrong
                        ? 'bg-pb-red text-white'
                        : isSelected
                          ? 'bg-pb-yellow text-pb-charcoal'
                          : 'bg-pb-cream-border text-pb-charcoal-muted'
                  }`}
                >
                  {isResolved && isCorrect ? '✓' : isResolved && isUserWrong ? '✗' : opt.key}
                </span>
                <span className="flex-1 leading-snug">{opt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-pb-red">
            {errorMessage}
          </div>
        )}

        {/* Panel de Feedback Resuelto */}
        {isResolved && feedback && (
          <div className="mt-4 space-y-3">
            <div
              className={`rounded-2xl border p-4 text-left ${
                feedback.result === 'correct'
                  ? 'border-emerald-200 bg-emerald-50/90'
                  : feedback.result === 'incorrect'
                    ? 'border-red-200 bg-red-50/90'
                    : 'border-amber-200 bg-amber-50/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-black flex items-center gap-1.5">
                  {feedback.result === 'correct' && '🎉 ¡Respuesta Correcta!'}
                  {feedback.result === 'incorrect' &&
                    '❌ ¡Casi! La respuesta era la ' + feedback.correctOption}
                  {feedback.result === 'unanswered' &&
                    '⏱️ ¡Tiempo agotado! Era la ' + feedback.correctOption}
                </span>
                <span
                  className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    feedback.result === 'correct'
                      ? 'bg-emerald-200 text-emerald-900'
                      : feedback.result === 'incorrect'
                        ? 'bg-red-200 text-red-900'
                        : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  +{feedback.pointsAwarded} pts
                </span>
              </div>

              {feedback.explanation && (
                <p className="mt-2 text-xs text-pb-charcoal-muted leading-relaxed border-t border-black/5 pt-2">
                  {feedback.explanation}
                </p>
              )}
            </div>

            <PrimaryButton onClick={handleAdvance} loading={submitting}>
              {currentPosition === 10 ? 'Ver Resultados Finales' : 'Siguiente Pregunta'}
            </PrimaryButton>
          </div>
        )}

        {/* Botón de Confirmación (cuando la pregunta está abierta) */}
        {!isResolved && (
          <div className="mt-4">
            <PrimaryButton
              disabled={!selectedOption || submitting}
              onClick={handleSubmitAnswer}
              loading={submitting}
            >
              Confirmar respuesta
            </PrimaryButton>
          </div>
        )}
      </BrandCard>
    </main>
  );
}
