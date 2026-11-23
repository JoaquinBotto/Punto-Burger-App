export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          Fase de Desarrollo
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Punto <span className="text-amber-500">Burger</span>
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          La experiencia digital interactiva de Punto Burger está en construcción para nuestro local
          de Esperanza, Santa Fe.
        </p>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Próximamente en tu mesa:</p>
          <ul className="mt-2 space-y-1 text-left list-disc list-inside">
            <li>Acceso autoservicio mediante código QR</li>
            <li>Trivias y desafíos en tiempo real</li>
            <li>Competencias entre escuelas y cursos</li>
            <li>Recompensas y beneficios exclusivos</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
