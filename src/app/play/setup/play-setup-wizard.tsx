'use client';

import React, { useState } from 'react';
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

interface PlaySetupWizardProps {
  initialData: PlaySetupInitialData;
}

interface ParticipantFormState {
  id: string;
  alias: string;
  ageRange: CanonicalAgeRange;
  educationLevel: CanonicalEducationLevel | null;
}

const NAME_SUGGESTIONS = ['Los Cracks', 'Mesa Picante', 'Los Bacon', 'Team Punto'];

export default function PlaySetupWizard({ initialData }: PlaySetupWizardProps) {
  const { table, categories, existingSetup } = initialData;

  const [step, setStep] = useState<1 | 2 | 3 | 'summary'>(existingSetup?.isSaved ? 'summary' : 1);

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

  const selectedCategory = categories.find((c) => c.slug === selectedCategorySlug);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        {/* Encabezado e Identidad */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            Punto Burger
          </div>
          <span className="text-xs font-semibold text-slate-400">{table.displayName}</span>
        </div>

        {/* Mensaje de Error Global */}
        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-300"
          >
            {errorMessage}
          </div>
        )}

        {/* ==============================================================================
            ESTADO: RESUMEN / EQUIPO LISTO
           ============================================================================== */}
        {step === 'summary' && (
          <div className="mt-6 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-white">¡Equipo listo!</h1>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              {groupName}
            </p>

            <p className="mt-2 text-sm text-slate-300">Ya está todo preparado para jugar.</p>

            {/* Ficha Resumen */}
            <div className="mt-6 space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Jugadores ({participants.length}):</span>
                <span className="font-medium text-slate-200">
                  {participants.map((p) => p.alias).join(', ')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Categoría elegida:</span>
                <span className="font-semibold text-amber-400">
                  {selectedCategory?.name ?? selectedCategorySlug}
                </span>
              </div>
            </div>

            {/* Botón de Modificación */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-slate-200 transition-all hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              Modificar equipo o categoría
            </button>

            {/* Placeholder Visual PPA-012 */}
            <div className="mt-4">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-xl bg-amber-500/40 py-3.5 text-sm font-bold text-slate-950 opacity-60"
              >
                Empezar partida
              </button>
              <p className="mt-2 text-[11px] text-slate-500">
                La trivia de 10 preguntas se activará en el próximo paso (PPA-012).
              </p>
            </div>
          </div>
        )}

        {/* ==============================================================================
            PASO 1: TU EQUIPO
           ============================================================================== */}
        {step === 1 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Paso 1 de 3
              </span>
              <span className="text-xs text-slate-400">Tu equipo</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div className="h-1.5 w-1/3 rounded-full bg-amber-400 transition-all duration-300" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
              ¿Cómo se llama tu equipo?
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Elegí un nombre para representar a tu mesa en la partida.
            </p>

            <div className="mt-6">
              <label htmlFor="groupName" className="block text-xs font-medium text-slate-300">
                Nombre del equipo
              </label>
              <input
                id="groupName"
                type="text"
                maxLength={MAX_GROUP_NAME_LENGTH}
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Ej: Los Bacon"
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-base font-semibold text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>Mínimo {MIN_GROUP_NAME_LENGTH} caracteres</span>
                <span>
                  {groupName.length}/{MAX_GROUP_NAME_LENGTH}
                </span>
              </div>
            </div>

            {/* Sugerencias Opcionales */}
            <div className="mt-4">
              <span className="text-[11px] text-slate-400">Inspiración rápida:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {NAME_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setGroupName(suggestion)}
                    className="rounded-lg border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:border-amber-400 hover:text-amber-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!isStep1Valid}
              onClick={() => setStep(2)}
              className="mt-8 w-full rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Siguiente: ¿Quiénes juegan?
            </button>
          </div>
        )}

        {/* ==============================================================================
            PASO 2: ¿QUIÉNES JUEGAN? (PARTICIPANTES)
           ============================================================================== */}
        {step === 2 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Paso 2 de 3
              </span>
              <span className="text-xs text-slate-400">
                {participants.length} de {MAX_PARTICIPANTS} jugadores
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div className="h-1.5 w-2/3 rounded-full bg-amber-400 transition-all duration-300" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">¿Quiénes juegan?</h1>
            <p className="mt-1 text-xs text-slate-300">
              Registrá a los participantes para calibrar las preguntas de la partida.
            </p>

            {/* Lista de Tarjetas de Participantes */}
            <div className="mt-4 max-h-[46vh] space-y-3 overflow-y-auto pr-1">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Jugador {index + 1}
                    </span>
                    {participants.length > MIN_PARTICIPANTS && (
                      <button
                        type="button"
                        onClick={() => handleRemoveParticipant(index)}
                        className="text-xs text-slate-500 hover:text-rose-400 focus:outline-none"
                        aria-label={`Eliminar Jugador ${index + 1}`}
                      >
                        ✕ Eliminar
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor={`alias-${participant.id}`}
                        className="block text-[11px] font-medium text-slate-300"
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
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`age-${participant.id}`}
                          className="block text-[11px] font-medium text-slate-300"
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
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                          className="block text-[11px] font-medium text-slate-300"
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
                          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 py-2.5 text-xs font-semibold text-slate-300 hover:border-amber-400 hover:text-amber-400"
              >
                + Agregar jugador ({participants.length}/{MAX_PARTICIPANTS})
              </button>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
                className="w-2/3 rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente: Categoría
              </button>
            </div>
          </div>
        )}

        {/* ==============================================================================
            PASO 3: ELEGÍ UNA CATEGORÍA
           ============================================================================== */}
        {step === 3 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Paso 3 de 3
              </span>
              <span className="text-xs text-slate-400">Categoría</span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-slate-800">
              <div className="h-1.5 w-full rounded-full bg-amber-400 transition-all duration-300" />
            </div>

            <h1 className="mt-6 text-2xl font-bold tracking-tight text-white">
              Elegí una categoría
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Seleccioná la temática principal para la trivia de tu mesa.
            </p>

            {/* Cuadrícula de Categorías */}
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 max-h-[46vh] overflow-y-auto pr-1">
              {categories.map((category) => {
                const isSelected = selectedCategorySlug === category.slug;
                const isReady = category.isReady;

                return (
                  <button
                    key={category.id}
                    type="button"
                    disabled={!isReady}
                    onClick={() => setSelectedCategorySlug(category.slug)}
                    className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'border-amber-400 bg-amber-400/10 shadow-md shadow-amber-400/10'
                        : isReady
                          ? 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900'
                          : 'cursor-not-allowed border-slate-900 bg-slate-950/30 opacity-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-amber-400' : 'text-white'
                          }`}
                        >
                          {category.name}
                        </span>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-amber-400" />}
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                        {category.description || 'Preguntas sobre esta temática.'}
                      </p>
                    </div>

                    {!isReady && (
                      <span className="mt-2 text-[10px] font-semibold text-rose-400">
                        Esta categoría está temporalmente no disponible.
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="w-1/3 rounded-xl border border-slate-700 bg-slate-800/80 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={!isStep3Valid || isSubmitting}
                onClick={handleSubmitSetup}
                className="w-2/3 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar y preparar equipo'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
