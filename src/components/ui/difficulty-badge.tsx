import React from 'react';

interface DifficultyBlocksProps {
  initial: number;
  medium: number;
  advanced: number;
}

export function DifficultyBlocks({ initial, medium, advanced }: DifficultyBlocksProps) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
        <span className="text-xl font-black text-emerald-800">{initial}</span>
        <span className="mt-0.5 text-[11px] font-bold text-emerald-700">Iniciales</span>
        <span className="text-[10px] text-emerald-600">fáciles</span>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-pb-yellow-border bg-pb-yellow-light p-3">
        <span className="text-xl font-black text-pb-yellow-hover">{medium}</span>
        <span className="mt-0.5 text-[11px] font-bold text-pb-yellow-hover">Medias</span>
        <span className="text-[10px] text-amber-700">para debatir</span>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-red-200 bg-red-50/70 p-3">
        <span className="text-xl font-black text-pb-red">{advanced}</span>
        <span className="mt-0.5 text-[11px] font-bold text-pb-red">Avanzadas</span>
        <span className="text-[10px] text-red-600">desafiantes</span>
      </div>
    </div>
  );
}
