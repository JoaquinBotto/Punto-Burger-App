'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandCard, BrandHeader } from '@/components/ui';
import type { PublicRankingTableItem, TableRankingContext } from '@/modules/rankings/types';

interface RankingClientProps {
  initialDate: string;
  initialRanking: PublicRankingTableItem[];
  initialContext: TableRankingContext | null;
}

export function RankingClient({ initialDate, initialRanking, initialContext }: RankingClientProps) {
  const [dateString, setDateString] = useState<string>(initialDate);
  const [ranking, setRanking] = useState<PublicRankingTableItem[]>(initialRanking);
  const [tableContext, setTableContext] = useState<TableRankingContext | null>(initialContext);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLatestRanking = async () => {
      try {
        setIsUpdating(true);
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
      } catch (err) {
        console.warn('No se pudo refrescar el ranking diario:', err);
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
  }, []);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

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
          Ranking de Hoy
        </h1>
        <p className="mt-1 text-xs font-semibold text-pb-charcoal-muted">
          Las mejores mesas de Punto Burger
        </p>

        {/* Fecha y Estado de Actualización */}
        <div className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-pb-cream px-3 py-1 text-[11px] font-bold text-pb-charcoal-muted border border-pb-cream-border">
          <span
            className={`h-2 w-2 rounded-full ${isUpdating ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`}
          />
          <span>{dateString}</span>
          <span className="text-[10px] text-pb-charcoal-light">· Actualiza cada 15s</span>
        </div>

        {/* Posición de Tu Mesa (Contextual si tiene sesión activa) */}
        {tableContext && tableContext.authenticated && (
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

        {/* Estado Vacío: Si ninguna mesa ha completado partidas hoy */}
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
                        <span className="text-sm font-black text-pb-charcoal">{entry.score}</span>
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
