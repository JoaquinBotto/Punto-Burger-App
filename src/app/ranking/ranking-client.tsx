'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandCard, BrandHeader } from '@/components/ui';
import type { PublicRankingTableItem, TableRankingContext } from '@/modules/rankings/types';
import type { CompetitionRankingEntry } from '@/modules/competitions/types';

interface CompetitionRankingInfo {
  id: string;
  name: string | null;
  status: 'scheduled' | 'active' | 'finalized' | 'cancelled';
  timingMode?: 'scheduled' | 'open';
  startsAt: string | null;
  endsAt: string | null;
  localDate: string | null;
}

interface RankingClientProps {
  initialDate: string;
  initialRanking: PublicRankingTableItem[];
  initialContext: TableRankingContext | null;
  competition?: CompetitionRankingInfo | null;
  initialCompetitionRanking?: CompetitionRankingEntry[] | null;
}

export function RankingClient({
  initialDate,
  initialRanking,
  initialContext,
  competition: initialCompetition,
  initialCompetitionRanking,
}: RankingClientProps) {
  const [dateString, setDateString] = useState<string>(initialDate);
  const [ranking, setRanking] = useState<PublicRankingTableItem[]>(initialRanking);
  const [tableContext, setTableContext] = useState<TableRankingContext | null>(initialContext);
  const [competition, setCompetition] = useState<CompetitionRankingInfo | null>(
    initialCompetition ?? null
  );
  const [compRanking, setCompRanking] = useState<CompetitionRankingEntry[]>(
    initialCompetitionRanking ?? []
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isCompetitionMode = Boolean(competition);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestRanking = async () => {
      try {
        setIsUpdating(true);

        if (isCompetitionMode) {
          const res = await fetch('/api/v1/competitions/current/ranking');
          if (res.ok && isMounted) {
            const data = await res.json();
            if (data.ok) {
              if (data.competition) {
                setCompetition({
                  id: data.competition.id,
                  name: data.competition.name,
                  status: data.competition.status,
                  timingMode: data.competition.timingMode,
                  startsAt: data.competition.startsAt,
                  endsAt: data.competition.endsAt,
                  localDate: data.competition.localDate,
                });
                setCompRanking(data.ranking);
              }
            }
          }
        } else {
          const [rankingRes, meRes] = await Promise.all([
            fetch('/api/v1/rankings/daily'),
            fetch('/api/v1/rankings/daily/me'),
          ]);

          if (!isMounted) return;

          if (rankingRes.ok) {
            const data = await rankingRes.json();
            if (data.ok) {
              setDateString(data.date);
              setRanking(data.ranking);
            }
          }

          if (meRes.ok) {
            const meData = await meRes.json();
            if (meData.ok) {
              setTableContext(meData);
            }
          }
        }
      } catch (err) {
        console.warn('No se pudo refrescar el ranking:', err);
      } finally {
        if (isMounted) {
          setIsUpdating(false);
        }
      }
    };

    // Polling cada 15 segundos (lectura liviana sin impacto)
    const interval = setInterval(fetchLatestRanking, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isCompetitionMode]);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  const compTop3 = compRanking.slice(0, 3);
  const compRest = compRanking.slice(3);
  const leader = compRanking.length > 0 ? compRanking[0] : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-3 sm:p-6 text-center">
      <BrandCard>
        {/* Encabezado con Identidad Oficial */}
        <BrandHeader tableBadge={tableContext?.table?.name} className="mb-4" />

        {/* Emblema Celebratorio */}
        <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full border border-pb-yellow-border bg-pb-yellow-light text-2xl shadow-xs">
          🏆
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-pb-charcoal uppercase">
          {isCompetitionMode ? (competition?.name ?? 'Competencia de Hoy') : 'Ranking de Hoy'}
        </h1>
        <p className="mt-1 text-xs font-semibold text-pb-charcoal-muted">
          {isCompetitionMode
            ? 'Competencia oficial de 3 ciclos entre mesas'
            : 'Las mejores mesas de Punto Burger'}
        </p>

        {/* Estado y Fecha */}
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-pb-cream px-3 py-1 text-[11px] font-bold text-pb-charcoal-muted border border-pb-cream-border">
          <span
            className={`h-2 w-2 rounded-full ${
              isUpdating
                ? 'bg-amber-400 animate-ping'
                : isCompetitionMode && competition?.status === 'active'
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-emerald-500'
            }`}
          />
          {isCompetitionMode ? (
            <span>
              {competition?.timingMode === 'open'
                ? competition?.status === 'active'
                  ? '🏆 Competencia abierta · EN VIVO'
                  : '🏆 Resultado final de competencia'
                : competition?.status === 'scheduled'
                  ? 'Programada · Inicia ' +
                    (competition.startsAt
                      ? new Date(competition.startsAt).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '')
                  : competition?.status === 'active'
                    ? '🏆 Competencia de hoy · EN VIVO'
                    : '🏆 Resultado final de hoy'}
            </span>
          ) : (
            <span>{dateString}</span>
          )}
          <span className="text-[10px] text-pb-charcoal-light">· Actualiza cada 15s</span>
        </div>

        {/* Banner de Líder / Ganador en Competencia */}
        {isCompetitionMode && leader && (
          <div className="mt-4 rounded-2xl border-2 border-pb-yellow-border bg-gradient-to-r from-pb-yellow-light/60 via-white to-pb-yellow-light/40 p-4 text-center shadow-xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-pb-yellow-hover block">
              {competition?.status === 'finalized' ? '👑 Mesa ganadora de hoy' : '🥇 Líder actual'}
            </span>
            <span className="text-xl font-black text-pb-charcoal block mt-0.5">
              {leader.displayName ?? leader.table}
            </span>
            <div className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-pb-charcoal-muted">
              <span>{leader.totalScore} pts</span>
              <span>·</span>
              <span>{leader.roundsCompleted}/3 ciclos</span>
              <span>·</span>
              <span>{leader.correctCount} correctas</span>
            </div>
          </div>
        )}

        {/* Posición de Tu Mesa (Modo Casual) */}
        {!isCompetitionMode && tableContext && tableContext.authenticated && (
          <div className="mt-4 rounded-2xl border-2 border-pb-yellow-border bg-gradient-to-b from-white to-pb-yellow-light/40 p-4 text-left shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-pb-yellow-hover">
                Tu Mesa: {tableContext.table?.name}
              </span>
              {tableContext.ranked ? (
                <span className="rounded-full bg-pb-charcoal px-2.5 py-0.5 text-xs font-black text-white">
                  Puesto #{tableContext.position}
                </span>
              ) : (
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-bold text-pb-charcoal-muted">
                  Sin partida hoy
                </span>
              )}
            </div>

            {tableContext.ranked ? (
              <div className="mt-2.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-pb-charcoal-muted">
                    Mejor récord de hoy:
                  </span>
                  <span className="text-base font-black text-pb-charcoal">
                    {tableContext.bestScore} pts
                  </span>
                </div>

                {tableContext.position === 1 ? (
                  <p className="mt-2 text-xs font-black text-emerald-800">
                    🥇 ¡Tu mesa lidera el ranking de hoy!
                  </p>
                ) : tableContext.gapToPrevious !== null &&
                  tableContext.previousPosition !== null ? (
                  <p className="mt-2 text-xs font-bold text-pb-charcoal-muted">
                    Hay {tableContext.gapToPrevious} puntos de diferencia con el puesto #
                    {tableContext.previousPosition}.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-pb-charcoal-muted">
                  Tu mesa todavía no tiene un puntaje en el ranking de hoy.
                </p>
                <Link
                  href="/play"
                  className="shrink-0 rounded-xl bg-pb-yellow px-3 py-1.5 text-xs font-black text-white hover:bg-pb-yellow-hover transition-colors"
                >
                  Jugar
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ==============================================================================
            TABLA EN MODO COMPETENCIA
           ============================================================================== */}
        {isCompetitionMode ? (
          <div>
            {compRanking.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-pb-cream-border bg-white p-6 text-center shadow-xs">
                <div className="text-3xl mb-2">🏆</div>
                <h2 className="text-sm font-black text-pb-charcoal">
                  {competition?.status === 'scheduled'
                    ? 'La competencia comenzará pronto.'
                    : 'Todavía no hay mesas puntuando en la competencia.'}
                </h2>
                <p className="mt-1 text-xs text-pb-charcoal-muted">
                  {competition?.status === 'scheduled'
                    ? `Inicia a las ${competition?.startsAt ? new Date(competition.startsAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}. Las mesas inscriptas aparecerán aquí.`
                    : '¡Completá el Ciclo 1 en tu mesa para liderar la tabla!'}
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pb-red px-4 py-2 text-xs font-black text-white hover:bg-pb-red-hover transition-colors shadow-xs"
                  >
                    <span>Ir a mi mesa</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {/* Podio Top 3 Competencia */}
                {compTop3.map((entry) => {
                  const isGold = entry.position === 1;
                  const isSilver = entry.position === 2;

                  const borderClass = isGold
                    ? 'border-2 border-pb-yellow-border bg-gradient-to-r from-amber-50 via-white to-amber-50/60'
                    : isSilver
                      ? 'border border-slate-300 bg-gradient-to-r from-slate-50 via-white to-slate-50'
                      : 'border border-amber-600/40 bg-gradient-to-r from-orange-50 via-white to-orange-50/50';

                  const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
                  const badgeBg = isGold
                    ? 'bg-pb-yellow text-white'
                    : isSilver
                      ? 'bg-slate-500 text-white'
                      : 'bg-amber-700 text-white';

                  const seconds = Math.round(Number(entry.totalResponseTimeMs) / 1000);

                  return (
                    <div
                      key={entry.entryId || entry.tableCode}
                      className={`flex items-center justify-between rounded-2xl p-3.5 shadow-xs transition-transform ${borderClass}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {medal}
                        </span>
                        <div className="text-left">
                          <span className="font-black text-sm text-pb-charcoal block">
                            {entry.displayName ?? entry.table}
                          </span>
                          <span className="text-[11px] font-semibold text-pb-charcoal-muted">
                            Ciclos: {entry.roundsCompleted}/3 · {entry.correctCount} correctas ·{' '}
                            {seconds}s
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-pb-charcoal">
                          {entry.totalScore}
                        </span>
                        <span className="text-xs font-bold text-pb-charcoal-muted ml-1">pts</span>
                        <span
                          className={`block rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-center mt-0.5 ${badgeBg}`}
                        >
                          #{entry.position}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Resto de la tabla de competencia */}
                {compRest.length > 0 && (
                  <div className="mt-3 space-y-2 text-left">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-muted px-1">
                      Otras mesas participantes
                    </span>
                    {compRest.map((entry) => {
                      const seconds = Math.round(Number(entry.totalResponseTimeMs) / 1000);

                      return (
                        <div
                          key={entry.entryId || entry.tableCode}
                          className="flex items-center justify-between rounded-xl border border-pb-cream-border bg-white px-3.5 py-2.5 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pb-cream text-xs font-black text-pb-charcoal">
                              {entry.position}
                            </span>
                            <div>
                              <span className="font-bold text-xs text-pb-charcoal block">
                                {entry.displayName ?? entry.table}
                              </span>
                              <span className="text-[10px] text-pb-charcoal-muted">
                                {entry.roundsCompleted}/3 ciclos · {entry.correctCount} correctas ·{' '}
                                {seconds}s
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-pb-charcoal">
                              {entry.totalScore}
                            </span>
                            <span className="text-[11px] font-bold text-pb-charcoal-muted ml-0.5">
                              pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ==============================================================================
              TABLA EN MODO CASUAL (PPA-RANK-001)
             ============================================================================== */
          <div>
            {ranking.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-pb-cream-border bg-white p-6 text-center shadow-xs">
                <div className="text-3xl mb-2">⭐</div>
                <h2 className="text-sm font-black text-pb-charcoal">
                  Todavía no hay mesas en el ranking de hoy.
                </h2>
                <p className="mt-1 text-xs text-pb-charcoal-muted">
                  ¡Podés ser la primera mesa en inaugurar el podio!
                </p>
                <div className="mt-4">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-pb-red px-4 py-2 text-xs font-black text-white hover:bg-pb-red-hover transition-colors shadow-xs"
                  >
                    <span>Comenzar a jugar</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {/* Podio Top 3 */}
                {top3.map((entry) => {
                  const isGold = entry.position === 1;
                  const isSilver = entry.position === 2;

                  const borderClass = isGold
                    ? 'border-2 border-pb-yellow-border bg-gradient-to-r from-amber-50 via-white to-amber-50/60'
                    : isSilver
                      ? 'border border-slate-300 bg-gradient-to-r from-slate-50 via-white to-slate-50'
                      : 'border border-amber-600/40 bg-gradient-to-r from-orange-50 via-white to-orange-50/50';

                  const medal = isGold ? '🥇' : isSilver ? '🥈' : '🥉';
                  const badgeBg = isGold
                    ? 'bg-pb-yellow text-white'
                    : isSilver
                      ? 'bg-slate-500 text-white'
                      : 'bg-amber-700 text-white';

                  const isCurrentTable = tableContext?.table?.code === entry.table.code;

                  return (
                    <div
                      key={entry.table.code}
                      className={`flex items-center justify-between rounded-2xl p-3.5 shadow-xs transition-transform ${borderClass} ${
                        isCurrentTable ? 'ring-2 ring-pb-red' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl" aria-hidden="true">
                          {medal}
                        </span>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-pb-charcoal">
                              {entry.table.name}
                            </span>
                            {isCurrentTable && (
                              <span className="rounded-full bg-pb-red px-1.5 py-0.2 text-[9px] font-black text-white uppercase">
                                Tu mesa
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-pb-charcoal-muted">
                            {entry.correctCount} correctas
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-pb-charcoal">{entry.score}</span>
                        <span className="text-xs font-bold text-pb-charcoal-muted ml-1">pts</span>
                        <span
                          className={`block rounded-full px-2 py-0.5 text-[10px] font-black uppercase text-center mt-0.5 ${badgeBg}`}
                        >
                          #{entry.position}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Posiciones 4 a 10 */}
                {rest.length > 0 && (
                  <div className="mt-3 space-y-2 text-left">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-muted px-1">
                      Otras posiciones
                    </span>
                    {rest.map((entry) => {
                      const isCurrentTable = tableContext?.table?.code === entry.table.code;

                      return (
                        <div
                          key={entry.table.code}
                          className={`flex items-center justify-between rounded-xl border border-pb-cream-border bg-white px-3.5 py-2.5 shadow-2xs ${
                            isCurrentTable ? 'ring-2 ring-pb-red bg-red-50/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-pb-cream text-xs font-black text-pb-charcoal">
                              {entry.position}
                            </span>
                            <div>
                              <span className="font-bold text-xs text-pb-charcoal">
                                {entry.table.name}
                              </span>
                              {isCurrentTable && (
                                <span className="ml-1.5 rounded-full bg-pb-red px-1.5 py-0.2 text-[9px] font-black text-white uppercase">
                                  Tu mesa
                                </span>
                              )}
                              <span className="block text-[10px] text-pb-charcoal-muted">
                                {entry.correctCount} correctas
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-pb-charcoal">
                              {entry.score}
                            </span>
                            <span className="text-[11px] font-bold text-pb-charcoal-muted ml-0.5">
                              pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Acceso a Inicio */}
        <div className="mt-6 border-t border-pb-cream-border pt-4">
          <Link
            href="/"
            className="text-xs font-bold text-pb-charcoal-muted hover:text-pb-charcoal transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </BrandCard>
    </main>
  );
}
