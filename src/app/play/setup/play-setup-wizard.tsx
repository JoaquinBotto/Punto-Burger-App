'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type {
  PlaySetupInitialData,
  CanonicalAgeRange,
  CanonicalEducationLevel,
} from '@/modules/groups';
import {
  CANONICAL_AGE_RANGES,
  CANONICAL_EDUCATION_LEVELS,
  MAX_ALIAS_LENGTH,
  MAX_GROUP_NAME_LENGTH,
  MAX_PARTICIPANTS,
  MIN_GROUP_NAME_LENGTH,
  MIN_PARTICIPANTS,
} from '@/modules/groups/constants';
import {
  BrandCard,
  BrandHeader,
  PrimaryButton,
  ProgressIndicator,
  SecondaryButton,
} from '@/components/ui';
import { PresenceRefresher } from '@/components/presence/presence-refresher';

interface CompetitionInfo {
  id: string;
  name: string | null;
  status: 'scheduled' | 'active' | 'finalized' | 'cancelled';
  timingMode?: 'scheduled' | 'open';
  localDate?: string | null;
  startsAt: string | null;
  endsAt: string | null;
  registrationOpensAt?: string | null;
  joinCutoffAt?: string | null;
}

import type { CompetitionStateResponse } from '@/modules/competitions/types';

interface PlaySetupWizardProps {
  initialData: PlaySetupInitialData;
  competition?: CompetitionInfo | null;
  competitionState?: CompetitionStateResponse | null;
}

interface ParticipantFormState {
  id: string;
  alias: string;
  ageRange: CanonicalAgeRange;
  educationLevel: CanonicalEducationLevel | null;
}

const NAME_SUGGESTIONS = ['Los Cracks', 'Mesa Picante', 'Los Bacon', 'Team Punto'];

export default function PlaySetupWizard({
  initialData,
  competition,
  competitionState,
}: PlaySetupWizardProps) {
  const router = useRouter();
  const { table, categories, existingSetup } = initialData;

  const hasActiveGame = Boolean(competitionState?.activeGameSessionId);
  const activeRoundNumber = competitionState?.entry?.currentRoundNumber || 1;

  const isCompetition = Boolean(
    competition && (competition.status === 'scheduled' || competition.status === 'active')
  );

  const [step, setStep] = useState<1 | 2 | 3 | 'summary'>(
    hasActiveGame || existingSetup?.isSaved ? 'summary' : 1
  );

  const [setupSaved, setSetupSaved] = useState(
    Boolean(hasActiveGame || existingSetup?.isSaved || competitionState?.entry)
  );

  const [groupName, setGroupName] = useState(existingSetup?.groupName ?? '');

  const [participants, setParticipants] = useState<ParticipantFormState[]>(() => {
    if (existingSetup?.participants && existingSetup.participants.length > 0) {
      return existingSetup.participants.map((p, idx) => ({
        id: `p-${idx + 1}`,
        alias: p.alias,
        ageRange: p.ageRange,
        educationLevel: p.educationLevel,
      }));
    }
    return [
      {
        id: 'p-1',
        alias: '',
        ageRange: 'adult',
        educationLevel: 'higher',
      },
    ];
  });

  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    existingSetup?.categorySlug ?? categories[0]?.slug ?? ''
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    if (!isCompetition) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isCompetition]);

  const startsAtDate = competition && competition.startsAt ? new Date(competition.startsAt) : null;
  const isStarted = startsAtDate ? now >= startsAtDate : true;

  // --- Handlers de Participantes ---
  const handleAddParticipant = () => {
    if (participants.length >= MAX_PARTICIPANTS) return;
    setParticipants((prev) => [
      ...prev,
      {
        id: `p-${Date.now()}`,
        alias: '',
        ageRange: 'adult',
        educationLevel: 'higher',
      },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    if (participants.length <= MIN_PARTICIPANTS) return;
    setParticipants((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateParticipant = (
    index: number,
    field: keyof Omit<ParticipantFormState, 'id'>,
    value: unknown
  ) => {
    setParticipants((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // --- Validaciones de Paso ---
  const isStep1Valid =
    groupName.trim().length >= MIN_GROUP_NAME_LENGTH &&
    groupName.trim().length <= MAX_GROUP_NAME_LENGTH;

  const isStep2Valid =
    participants.length >= MIN_PARTICIPANTS &&
    participants.length <= MAX_PARTICIPANTS &&
    participants.every(
      (p) => p.alias.trim().length >= 1 && p.alias.trim().length <= MAX_ALIAS_LENGTH
    );

  const isStep3Valid = Boolean(
    selectedCategorySlug && categories.some((c) => c.slug === selectedCategorySlug && c.isReady)
  );

  // --- Envío del Formulario ---
  const handleSubmitSetup = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        groupName: groupName.trim(),
        participants: participants.map((p) => ({
          alias: p.alias.trim(),
          ageRange: p.ageRange,
          educationLevel: p.educationLevel,
        })),
        categorySlug: selectedCategorySlug,
      };

      const response = await fetch('/api/v1/games/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(
          data?.error?.message || 'Error al guardar el equipo. Por favor, reintentá.'
        );
        return;
      }

      setStep('summary');
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      setErrorMessage('Error de conexión al guardar el equipo. Por favor, reintentá.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartGame = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setPrepareError(null);

    try {
      const response = await fetch('/api/v1/games/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        setPrepareError(data.error?.message || 'No se pudo preparar la partida.');
        setIsPreparing(false);
        return;
      }

      router.push(data.next || '/play');
    } catch {
      setPrepareError('Error de conexión al preparar la partida.');
      setIsPreparing(false);
    }
  };

  const handleStartCompetition = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setPrepareError(null);

    try {
      // 1. Reconstrucción y recuperación del estado en el servidor
      const stateRes = await fetch('/api/v1/competitions/current/state');
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        if (stateData.ok && stateData.activeGameSessionId) {
          router.push('/play');
          return;
        }
      }

      // 2. Guardar setup solo si aún no fue guardado
      if (!setupSaved) {
        const payload = {
          groupName: groupName.trim(),
          participants: participants.map((p) => ({
            alias: p.alias.trim(),
            ageRange: p.ageRange,
            educationLevel: p.educationLevel,
          })),
          categorySlug: categories[0]?.slug ?? 'cultura-general',
        };

        const setupRes = await fetch('/api/v1/games/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const setupData = await setupRes.json();
        if (!setupRes.ok || !setupData.ok) {
          if (setupData?.error?.code === 'SETUP_ALREADY_LOCKED') {
            setSetupSaved(true);
            router.push('/play');
            return;
          }
          const msg =
            setupData?.error?.code === 'PRESENCE_REQUIRED'
              ? 'Conectate al Wi-Fi de Punto Burger para continuar.'
              : setupData?.error?.message || 'Error al guardar el equipo.';
          setPrepareError(msg);
          setIsPreparing(false);
          return;
        }
        setSetupSaved(true);
      }

      // 3. Unirse a la competencia (idempotente)
      const joinRes = await fetch('/api/v1/competitions/current/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const joinData = await joinRes.json();
      if (!joinRes.ok || !joinData.ok) {
        const msg =
          joinData?.error?.code === 'PRESENCE_REQUIRED'
            ? 'Conectate al Wi-Fi de Punto Burger para continuar.'
            : joinData?.error?.message || 'Error al registrarse en la competencia.';
        setPrepareError(msg);
        setIsPreparing(false);
        return;
      }

      // 4. Si la competencia ya empezó, iniciar ciclo 1
      if (isStarted) {
        const roundRes = await fetch('/api/v1/competitions/current/rounds/next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const roundData = await roundRes.json();
        if (!roundRes.ok || !roundData.ok) {
          const msg =
            roundData?.error?.code === 'PRESENCE_REQUIRED'
              ? 'Conectate al Wi-Fi de Punto Burger para continuar.'
              : roundData?.error?.message || 'Error al preparar el primer ciclo.';
          setPrepareError(msg);
          setIsPreparing(false);
          return;
        }
        router.push(roundData.next || '/play');
      } else {
        setIsJoined(true);
        setIsPreparing(false);
      }
    } catch {
      setPrepareError('Error de conexión al registrarse. Por favor, reintentá.');
      setIsPreparing(false);
    }
  };

  const handleStartRound1AfterWaiting = async () => {
    if (isPreparing) return;
    setIsPreparing(true);
    setPrepareError(null);
    try {
      const roundRes = await fetch('/api/v1/competitions/current/rounds/next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const roundData = await roundRes.json();
      if (!roundRes.ok || !roundData.ok) {
        setPrepareError(roundData?.error?.message || 'Error al preparar el primer ciclo.');
        setIsPreparing(false);
        return;
      }
      router.push(roundData.next || '/play');
    } catch {
      setPrepareError('Error de conexión al iniciar el ciclo.');
      setIsPreparing(false);
    }
  };

  const msLeft = startsAtDate ? Math.max(0, startsAtDate.getTime() - now.getTime()) : 0;
  const minutesLeft = Math.floor(msLeft / 60000);
  const secondsLeft = Math.floor((msLeft % 60000) / 1000);
  const countdownText = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;

  const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <BrandCard>
        {/* Encabezado e Identidad */}
        <BrandHeader tableBadge={table.displayName} className="mb-6" />

        {/* Mensaje de Error Global */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-pb-red text-center"
          >
            {errorMessage}
          </div>
        )}

        {/* ==============================================================================
            ESTADO: RESUMEN / EQUIPO LISTO
           ============================================================================== */}
        {step === 'summary' && (
          <div className="text-center">
            <div
              className={`mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border shadow-xs ${
                isCompetition
                  ? 'border-pb-yellow-border bg-pb-yellow-light text-2xl'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-600'
              }`}
            >
              {isCompetition ? (
                '🏆'
              ) : (
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <h1 className="text-3xl font-black tracking-tight text-pb-charcoal">
              {isCompetition
                ? isJoined
                  ? '¡Inscripción lista!'
                  : '¡Equipo listo!'
                : '¡Equipo listo!'}
            </h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-pb-red">
              {groupName}
            </p>

            <p className="mt-2 text-sm text-pb-charcoal-muted">
              {isCompetition
                ? 'Competencia oficial de 3 ciclos entre mesas de Punto Burger.'
                : 'Ya está todo preparado para jugar.'}
            </p>

            {/* Ficha Resumen */}
            <div className="mt-6 space-y-3 rounded-2xl border border-pb-cream-border bg-pb-cream/40 p-4 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">
                  Jugadores ({participants.length}):
                </span>
                <span className="font-bold text-pb-charcoal">
                  {participants.map((p) => p.alias).join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-semibold text-pb-charcoal-muted">
                  {isCompetition ? 'Modalidad:' : 'Categoría elegida:'}
                </span>
                <span className="inline-flex items-center gap-1.5 font-bold text-pb-red">
                  <span className="h-2 w-2 rounded-full bg-pb-yellow" />
                  {isCompetition
                    ? '3 ciclos progresivos (30 preguntas mixtas)'
                    : (selectedCategory?.name ?? selectedCategorySlug)}
                </span>
              </div>

              {isCompetition && (
                <div className="flex items-center justify-between border-t border-pb-cream-border/60 pt-2 text-[11px] text-pb-charcoal-muted">
                  <span>Dificultad por ciclo:</span>
                  <span className="font-medium text-pb-charcoal">
                    C1 (1300 pts) · C2 (1500 pts) · C3 (1700 pts)
                  </span>
                </div>
              )}
            </div>

            {/* Botón de Modificación */}
            {!isJoined && !hasActiveGame && (
              <SecondaryButton type="button" onClick={() => setStep(1)} className="mt-6 w-full">
                Modificar equipo {isCompetition ? '' : 'o categoría'}
              </SecondaryButton>
            )}

            {/* Botón Empezar Partida o Competencia */}
            <div className="mt-3">
              {prepareError && (
                <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-pb-red">
                  {prepareError}
                </div>
              )}

              {hasActiveGame ? (
                <div>
                  <PrimaryButton type="button" onClick={() => router.push('/play')}>
                    Continuar Ciclo {activeRoundNumber}
                  </PrimaryButton>
                  <p className="mt-2 text-[11px] text-pb-charcoal-light">
                    Tu partida ya está preparada. Continuá jugando para no perder el progreso.
                  </p>
                </div>
              ) : isCompetition ? (
                <div>
                  {isJoined && !isStarted ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-pb-yellow-border bg-pb-yellow-light/60 p-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-pb-charcoal-muted block">
                          Esperando inicio de la competencia
                        </span>
                        <span className="text-3xl font-black text-pb-charcoal block mt-1">
                          {countdownText}
                        </span>
                        <span className="text-[11px] text-pb-charcoal-light block mt-1">
                          Comienza a las{' '}
                          {startsAtDate?.toLocaleTimeString('es-AR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <PrimaryButton type="button" disabled>
                        Esperando inicio...
                      </PrimaryButton>
                    </div>
                  ) : isJoined && isStarted ? (
                    <PrimaryButton
                      type="button"
                      loading={isPreparing}
                      disabled={isPreparing}
                      onClick={handleStartRound1AfterWaiting}
                    >
                      {isPreparing ? 'Preparando preguntas...' : '¡Comenzar Ciclo 1!'}
                    </PrimaryButton>
                  ) : (
                    <PrimaryButton
                      type="button"
                      loading={isPreparing}
                      disabled={isPreparing}
                      onClick={handleStartCompetition}
                    >
                      {isPreparing
                        ? 'Registrando equipo...'
                        : isStarted
                          ? 'Entrar a la competencia y comenzar'
                          : 'Inscribir equipo en la competencia'}
                    </PrimaryButton>
                  )}
                  <p className="mt-2 text-[11px] text-pb-charcoal-light">
                    {isStarted
                      ? 'Se seleccionarán 10 preguntas equilibradas para el Ciclo 1.'
                      : `La competencia iniciará a las ${startsAtDate?.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`}
                  </p>
                </div>
              ) : (
                <div>
                  <PrimaryButton
                    type="button"
                    loading={isPreparing}
                    disabled={isPreparing}
                    onClick={handleStartGame}
                  >
                    {isPreparing ? 'Preparando preguntas...' : 'Empezar partida'}
                  </PrimaryButton>
                  <p className="mt-2 text-[11px] text-pb-charcoal-light">
                    Se seleccionarán y congelarán 10 preguntas para tu equipo.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==============================================================================
            PASO 1: TU EQUIPO
           ============================================================================== */}
        {step === 1 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pb-red">
                Paso 1 de {isCompetition ? 2 : 3}
              </span>
              <span className="text-xs font-semibold text-pb-charcoal-muted">Tu equipo</span>
            </div>

            <ProgressIndicator currentStep={1} totalSteps={isCompetition ? 2 : 3} />

            <h1 className="mt-6 text-2xl font-black tracking-tight text-pb-charcoal">
              ¿Cómo se llama tu equipo?
            </h1>
            <p className="mt-1 text-xs text-pb-charcoal-muted">
              {isCompetition
                ? 'Este nombre aparecerá en el ranking de la competencia.'
                : 'Elegí un nombre para representar a tu mesa en la partida.'}
            </p>

            <div className="mt-6">
              <label
                htmlFor="groupName"
                className="block text-xs font-bold uppercase tracking-wider text-pb-charcoal-muted"
              >
                Nombre del equipo
              </label>
              <input
                id="groupName"
                type="text"
                maxLength={MAX_GROUP_NAME_LENGTH}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Los Bacon"
                className="mt-2 w-full rounded-2xl border-2 border-pb-cream-border bg-pb-cream/40 px-4 py-3.5 text-base font-bold text-pb-charcoal placeholder:text-stone-400 focus:border-pb-red focus:bg-white focus:outline-none focus:ring-4 focus:ring-pb-red/20 transition-all"
              />
              <div className="mt-1.5 flex justify-between text-[11px] font-medium text-pb-charcoal-light">
                <span>Mínimo {MIN_GROUP_NAME_LENGTH} caracteres</span>
                <span>
                  {groupName.length}/{MAX_GROUP_NAME_LENGTH}
                </span>
              </div>
            </div>

            {/* Sugerencias Opcionales */}
            <div className="mt-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-light">
                Inspiración rápida:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {NAME_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setGroupName(suggestion)}
                    className="rounded-xl border border-pb-cream-border bg-pb-cream/50 px-3 py-1.5 text-xs font-bold text-pb-charcoal transition-all hover:border-pb-red hover:bg-pb-red-subtle hover:text-pb-red active:scale-95"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <PrimaryButton type="button" disabled={!isStep1Valid} onClick={() => setStep(2)}>
                Siguiente: ¿Quiénes juegan?
              </PrimaryButton>
            </div>
          </div>
        )}

        {/* ==============================================================================
            PASO 2: ¿QUIÉNES JUEGAN? (PARTICIPANTES)
           ============================================================================== */}
        {step === 2 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pb-red">
                Paso 2 de {isCompetition ? 2 : 3}
              </span>
              <span className="text-xs font-semibold text-pb-charcoal-muted">
                {participants.length} de {MAX_PARTICIPANTS} jugadores
              </span>
            </div>

            <ProgressIndicator currentStep={2} totalSteps={isCompetition ? 2 : 3} />

            <h1 className="mt-6 text-2xl font-black tracking-tight text-pb-charcoal">
              ¿Quiénes juegan?
            </h1>
            <p className="mt-1 text-xs text-pb-charcoal-muted">
              Registrá a los jugadores para repartir los turnos de la partida.
            </p>

            {/* Lista de Tarjetas de Participantes */}
            <div className="mt-4 max-h-[44vh] space-y-3 overflow-y-auto pr-1">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="rounded-2xl border border-pb-cream-border bg-pb-cream/40 p-4 transition-all"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-pb-cream-border/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-pb-red">
                      Jugador {index + 1}
                    </span>
                    {participants.length > MIN_PARTICIPANTS && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(index)}
                        className="text-xs font-bold text-stone-400 hover:text-pb-red focus:outline-none transition-colors"
                        aria-label={`Eliminar Jugador ${index + 1}`}
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <label
                        htmlFor={`alias-${participant.id}`}
                        className="block text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-muted"
                      >
                        Nombre / Alias *
                      </label>
                      <input
                        id={`alias-${participant.id}`}
                        type="text"
                        maxLength={MAX_ALIAS_LENGTH}
                        value={participant.alias}
                        onChange={(e) => handleUpdateParticipant(index, 'alias', e.target.value)}
                        placeholder="Ej: Joaco"
                        className="mt-1.5 w-full rounded-xl border border-pb-cream-border bg-white px-3.5 py-2.5 text-sm font-semibold text-pb-charcoal placeholder:text-stone-300 focus:border-pb-red focus:outline-none focus:ring-2 focus:ring-pb-red/20 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`age-${participant.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-muted"
                        >
                          Rango etario *
                        </label>
                        <select
                          id={`age-${participant.id}`}
                          value={participant.ageRange}
                          onChange={(e) =>
                            handleUpdateParticipant(
                              index,
                              'ageRange',
                              e.target.value as CanonicalAgeRange
                            )
                          }
                          className="mt-1.5 w-full rounded-xl border border-pb-cream-border bg-white px-3 py-2 text-xs font-semibold text-pb-charcoal focus:border-pb-red focus:outline-none focus:ring-2 focus:ring-pb-red/20 transition-all"
                        >
                          {CANONICAL_AGE_RANGES.map((range) => (
                            <option key={range.value} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`edu-${participant.id}`}
                          className="block text-[11px] font-bold uppercase tracking-wider text-pb-charcoal-muted"
                        >
                          Nivel educativo
                        </label>
                        <select
                          id={`edu-${participant.id}`}
                          value={participant.educationLevel ?? 'none'}
                          onChange={(e) =>
                            handleUpdateParticipant(
                              index,
                              'educationLevel',
                              e.target.value === 'none'
                                ? null
                                : (e.target.value as CanonicalEducationLevel)
                            )
                          }
                          className="mt-1.5 w-full rounded-xl border border-pb-cream-border bg-white px-3 py-2 text-xs font-semibold text-pb-charcoal focus:border-pb-red focus:outline-none focus:ring-2 focus:ring-pb-red/20 transition-all"
                        >
                          {CANONICAL_EDUCATION_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                              {level.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Agregar Jugador */}
            {participants.length < MAX_PARTICIPANTS && (
              <button
                type="button"
                onClick={handleAddParticipant}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-300 bg-white py-3 text-xs font-bold text-pb-charcoal hover:border-pb-red hover:text-pb-red active:scale-[0.99] transition-all"
              >
                + Agregar jugador ({participants.length}/{MAX_PARTICIPANTS})
              </button>
            )}

            <div className="mt-6 flex gap-3">
              <SecondaryButton type="button" onClick={() => setStep(1)} className="w-1/3">
                Volver
              </SecondaryButton>
              <div className="w-2/3">
                <PrimaryButton
                  type="button"
                  disabled={!isStep2Valid}
                  onClick={() => (isCompetition ? setStep('summary') : setStep(3))}
                >
                  {isCompetition ? 'Siguiente: Confirmar equipo' : 'Siguiente: Categoría'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================================
            PASO 3: ELEGÍ UNA CATEGORÍA (SÓLO CASUAL)
           ============================================================================== */}
        {!isCompetition && step === 3 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-pb-red">
                Paso 3 de 3
              </span>
              <span className="text-xs font-semibold text-pb-charcoal-muted">Categoría</span>
            </div>

            <ProgressIndicator currentStep={3} />

            <h1 className="mt-6 text-2xl font-black tracking-tight text-pb-charcoal">
              Elegí una categoría
            </h1>
            <p className="mt-1 text-xs text-pb-charcoal-muted">
              Seleccioná la temática principal para la trivia de tu mesa.
            </p>

            {/* Cuadrícula de Categorías */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-[44vh] overflow-y-auto pr-1">
              {categories.map((category) => {
                const isSelected = selectedCategorySlug === category.slug;
                const isReady = category.isReady;

                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => setSelectedCategorySlug(category.slug)}
                    className={`flex flex-col justify-between rounded-2xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-pb-red bg-red-50/70 shadow-md shadow-red-950/5 scale-[1.01]'
                        : isReady
                          ? 'border-pb-cream-border bg-white hover:border-stone-300 hover:bg-stone-50/60 shadow-xs'
                          : 'cursor-not-allowed border-stone-200 bg-stone-100/70 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-pb-red' : 'text-pb-charcoal'
                          }`}
                        >
                          {category.name}
                        </span>
                        {isSelected && (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pb-red text-white">
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-pb-charcoal-muted line-clamp-2">
                        {category.description || 'Preguntas sobre esta temática.'}
                      </p>
                    </div>

                    {!isReady && (
                      <span className="mt-2 text-[10px] font-bold text-red-600">
                        Esta categoría está temporalmente no disponible.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <SecondaryButton
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="w-1/3"
              >
                Volver
              </SecondaryButton>
              <div className="w-2/3">
                <PrimaryButton
                  type="button"
                  loading={isSubmitting}
                  disabled={!isStep3Valid || isSubmitting}
                  onClick={handleSubmitSetup}
                >
                  Confirmar y preparar equipo
                </PrimaryButton>
              </div>
            </div>
          </div>
        )}

        {isCompetition && <PresenceRefresher />}
      </BrandCard>
    </main>
  );
}
