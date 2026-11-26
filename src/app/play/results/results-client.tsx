'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BrandCard, BrandHeader, PrimaryButton, SecondaryButton } from '@/components/ui';
import type { GameResultsView } from '@/modules/trivia/types';
import type { TableRankingContext } from '@/modules/rankings/types';
import type { CompetitionEntryStatus } from '@/modules/competitions/types';

interface CompetitionResultsContext {
  competition: {
    id: string;
    name: string | null;
    status: 'scheduled' | 'active' | 'finalized' | 'cancelled';
  };
  entry: {
    id: string;
    status: CompetitionEntryStatus;
    currentRoundNumber: number;
    completedRounds: number;
    roundScores: number[];
    totalScore: number;
  };
}

interface ResultsClientProps {
  results: GameResultsView['game'];
  ranking?: TableRankingContext | null;
  competitionContext?: CompetitionResultsContext | null;
}

export function ResultsClient({ results, ranking, competitionContext }: ResultsClientProps) {
  const router = useRouter();
  const [closing, setClosing] = useState<boolean>(false);
  const [continuing, setContinuing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isCompetition = Boolean(competitionContext?.entry);
  const completedRounds = competitionContext?.entry.completedRounds ?? 0;
  const isFinalRound = completedRounds >= 3;

  const handleContinueToNextRound = async () => {
    setContinuing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/competitions/current/rounds/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message || 'No se pudo iniciar el siguiente ciclo.');
        setContinuing(false);
        return;
      }

      router.push(data.next || '/play');
    } catch {
      setErrorMessage('Ocurrió un error al avanzar al siguiente ciclo. Reintentá.');
      setContinuing(false);
    }
  };

  const handleCloseSession = async () => {
    setClosing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setErrorMessage(data?.error?.message || 'No se pudo cerrar la sesión.');
        return;
      }

      router.replace('/');
    } catch {
      setErrorMessage('Ocurrió un error al cerrar la sesión. Reintentá.');
    } finally {
      setClosing(false);
    }
  };

  const percentage = Math.round((results.totalScore / results.maxScore) * 100);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-6 text-center">
      <BrandCard>
        {/* Encabezado con Identidad Oficial */}
        <BrandHeader tableBadge={results.table.displayName} className="mb-4" />

        {/* Emblema Celebratorio */}
        <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full border border-pb-yellow-border bg-pb-yellow-light text-3xl shadow-xs">
          🏆
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-pb-charcoal">
          {isCompetition
            ? completedRounds === 1
              ? '¡Ciclo 1 terminado!'
              : completedRounds === 2
                ? '¡Ciclo 2 terminado!'
                : '¡Competencia completada!'
            : '¡Partida terminada!'}
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-pb-red">
          {results.group.name}
        </p>
        <p className="mt-1 text-xs text-pb-charcoal-muted">
          {isCompetition
            ? `Competencia de hoy · Ciclo ${completedRounds} de 3`
            : `Categoría: ${results.category.name}`}
        </p>

        {/* Tarjeta de Puntaje Principal */}
        <div className="mt-5 rounded-3xl border border-pb-yellow-border bg-gradient-to-b from-pb-yellow-light/60 to-pb-cream/80 p-5 text-center shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-light">
            {isCompetition
              ? isFinalRound
                ? 'Puntaje Total de Competencia'
                : `Puntaje del Ciclo ${completedRounds}`
              : 'Puntaje Final'}
          </span>
          <div className="mt-1 flex items-baseline justify-center gap-1.5">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-pb-charcoal">
              {isCompetition && isFinalRound
                ? competitionContext?.entry.totalScore
                : results.totalScore}
            </span>
            <span className="text-sm font-bold text-pb-charcoal-muted">
              / {isCompetition && isFinalRound ? 4500 : results.maxScore} pts
            </span>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-pb-yellow-border bg-white px-3 py-1 text-xs font-bold text-pb-yellow-hover">
            {isCompetition ? (
              <span>
                Total acumulado:{' '}
                <strong>
                  {competitionContext?.entry.totalScore ?? results.totalScore} / 4500 pts
                </strong>
              </span>
            ) : (
              <>
                <span>⚡ Rendimiento:</span>
                <span>{percentage}% del máximo</span>
              </>
            )}
          </div>
        </div>

        {/* Métricas: Correctas / Incorrectas / Sin Responder */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-2.5">
            <span className="text-lg font-black text-emerald-800">{results.correctCount}</span>
            <span className="block text-[11px] font-bold text-emerald-700">Correctas</span>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/70 p-2.5">
            <span className="text-lg font-black text-pb-red">{results.incorrectCount}</span>
            <span className="block text-[11px] font-bold text-red-700">Incorrectas</span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-2.5">
            <span className="text-lg font-black text-amber-800">{results.unansweredCount}</span>
            <span className="block text-[11px] font-bold text-amber-700">Sin responder</span>
          </div>
        </div>

        {/* Progreso de la Competencia (si aplica) */}
        {isCompetition && competitionContext?.entry && (
          <div className="mt-4 rounded-2xl border border-pb-yellow-border bg-gradient-to-b from-white to-pb-yellow-light/30 p-4 text-left text-xs shadow-xs">
            <span className="block font-bold text-pb-charcoal mb-2">Progreso en los 3 ciclos:</span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-pb-yellow-border/40 pb-1">
                <span className="font-semibold text-pb-charcoal-muted">Ciclo 1 (Inicial):</span>
                <span className="font-bold text-pb-charcoal">
                  {competitionContext.entry.roundScores[0] !== undefined
                    ? `${competitionContext.entry.roundScores[0]} / 1300 pts`
                    : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-pb-yellow-border/40 pb-1">
                <span className="font-semibold text-pb-charcoal-muted">Ciclo 2 (Medio):</span>
                <span className="font-bold text-pb-charcoal">
                  {competitionContext.entry.roundScores[1] !== undefined
                    ? `${competitionContext.entry.roundScores[1]} / 1500 pts`
                    : 'Pendiente'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">Ciclo 3 (Avanzado):</span>
                <span className="font-bold text-pb-charcoal">
                  {competitionContext.entry.roundScores[2] !== undefined
                    ? `${competitionContext.entry.roundScores[2]} / 1700 pts`
                    : 'Pendiente'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Desglose por Dificultad del Ciclo */}
        <div className="mt-4 rounded-2xl border border-pb-cream-border bg-pb-cream/40 p-4 text-left text-xs">
          <span className="block font-bold text-pb-charcoal mb-2.5">
            Rendimiento del ciclo por dificultad:
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-pb-cream-border/60 pb-1.5">
              <span className="font-semibold text-pb-charcoal-muted">
                Inicial ({results.breakdown.initial.correct}/{results.breakdown.initial.total}):
              </span>
              <span className="font-bold text-emerald-800">
                {results.breakdown.initial.score} / {results.breakdown.initial.maxScore} pts
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-pb-cream-border/60 pb-1.5">
              <span className="font-semibold text-pb-charcoal-muted">
                Intermedia ({results.breakdown.medium.correct}/{results.breakdown.medium.total}):
              </span>
              <span className="font-bold text-pb-yellow-hover">
                {results.breakdown.medium.score} / {results.breakdown.medium.maxScore} pts
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-pb-charcoal-muted">
                Avanzada ({results.breakdown.advanced.correct}/{results.breakdown.advanced.total}):
              </span>
              <span className="font-bold text-pb-red">
                {results.breakdown.advanced.score} / {results.breakdown.advanced.maxScore} pts
              </span>
            </div>
          </div>
        </div>

        {/* Bloque de Ranking Diario Casual (SÓLO SI NO ES COMPETENCIA) */}
        {!isCompetition && ranking && ranking.ranked && (
          <div className="mt-4 rounded-2xl border border-pb-yellow-border bg-gradient-to-b from-white to-pb-cream/80 p-4 text-center shadow-xs">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider text-pb-yellow-hover">
              <span>🏆</span>
              <span>Ranking de Hoy</span>
            </div>

            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white px-3.5 py-2 border border-pb-yellow-border/60">
              <span className="text-xs font-bold text-pb-charcoal">
                {ranking.table?.name ?? results.table.displayName}
              </span>
              <span className="rounded-full bg-pb-yellow-light px-2.5 py-0.5 text-xs font-black text-pb-charcoal">
                Puesto #{ranking.position}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white/90 p-2 border border-pb-yellow-border/40">
                <span className="block text-[10px] uppercase font-bold text-pb-charcoal-muted">
                  Tu partida
                </span>
                <span className="text-sm font-black text-pb-charcoal">
                  {results.totalScore} pts
                </span>
              </div>
              <div className="rounded-xl bg-white/90 p-2 border border-pb-yellow-border/40">
                <span className="block text-[10px] uppercase font-bold text-pb-charcoal-muted">
                  Récord de tu mesa
                </span>
                <span className="text-sm font-black text-pb-yellow-hover">
                  {ranking.bestScore} pts
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              {ranking.isNewRecord ? (
                <p className="text-xs font-black text-pb-red">
                  🔥 ¡Nuevo récord de {ranking.table?.name ?? results.table.displayName}!
                </p>
              ) : (
                <p className="text-xs font-medium text-pb-charcoal-muted">
                  Tu mesa mantiene su récord de {ranking.bestScore} puntos.
                </p>
              )}
            </div>

            <div className="mt-3">
              <Link
                href="/ranking"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-pb-yellow-border bg-white px-3.5 py-2 text-xs font-black text-pb-charcoal hover:bg-pb-yellow-light transition-colors shadow-2xs"
              >
                <span>Ver ranking completo</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Acciones y Descanso según Modalidad */}
        {isCompetition ? (
          <div>
            {!isFinalRound ? (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-pb-cream-border bg-white p-3.5 text-left text-xs text-pb-charcoal-muted">
                  <p className="font-bold text-pb-charcoal flex items-center gap-1.5">
                    <span>☕</span> Tomate un descanso antes del siguiente ciclo
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Charlen en la mesa, pidan algo rico o tomen una bebida. Cuando estén listos para
                    continuar, toquen el botón para comenzar el siguiente ciclo.
                  </p>
                </div>

                <PrimaryButton onClick={handleContinueToNextRound} loading={continuing}>
                  {`CONTINUAR AL CICLO ${completedRounds + 1}`}
                </PrimaryButton>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-pb-yellow-border bg-white p-4 text-center shadow-xs">
                  <p className="font-black text-pb-charcoal text-sm flex items-center justify-center gap-1.5">
                    <span>🎉</span> ¡Completaron los 3 ciclos oficiales!
                  </p>
                  <p className="mt-1 text-xs text-pb-charcoal-muted">
                    Consultá el ranking general para ver la posición final de tu mesa.
                  </p>
                  <div className="mt-3">
                    <Link
                      href="/ranking"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-pb-yellow px-4 py-2.5 text-xs font-black text-white hover:bg-pb-yellow-hover transition-colors shadow-xs"
                    >
                      <span>Ver ranking en vivo</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                <SecondaryButton onClick={handleCloseSession} disabled={closing}>
                  Finalizar estadía
                </SecondaryButton>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Mensaje de Experiencia Gastronómica Casual */}
            <div className="mt-4 rounded-2xl border border-pb-cream-border bg-white p-3.5 text-left text-xs text-pb-charcoal-muted">
              <p className="font-bold text-pb-charcoal flex items-center gap-1.5">
                <span>🍔</span> ¡Gracias por jugar con nosotros!
              </p>
              <p className="mt-1 text-[11px] leading-relaxed">
                Esperamos que hayan disfrutado el desafío en Punto Burger Esperanza. Al finalizar la
                sesión, la mesa quedará liberada para los siguientes comensales.
              </p>
            </div>

            <div className="mt-5">
              <PrimaryButton onClick={handleCloseSession} loading={closing}>
                Finalizar experiencia
              </PrimaryButton>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-semibold text-pb-red">
            {errorMessage}
          </div>
        )}
      </BrandCard>
    </main>
  );
}
