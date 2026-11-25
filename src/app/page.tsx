import Image from 'next/image';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 text-center">
      <div className="w-full max-w-md rounded-3xl border border-pb-cream-border bg-white p-6 sm:p-8 shadow-xl shadow-stone-200/60">
        {/* Logo Oficial de Punto Burger */}
        <div className="mx-auto mb-6 flex justify-center">
          <Image
            src="/brand/punto-burger-logo.png"
            alt="Punto Burger"
            width={210}
            height={70}
            priority
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Badge de Estado */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pb-yellow-border bg-pb-yellow-light px-3.5 py-1 text-xs font-bold text-pb-charcoal">
          <span className="h-2 w-2 rounded-full bg-pb-yellow animate-pulse" />
          Fase de Desarrollo
        </div>

        <h1 className="text-2xl font-black tracking-tight text-pb-charcoal sm:text-3xl">
          Punto Burger
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-pb-charcoal-muted">
          La experiencia digital interactiva de Punto Burger está en construcción para nuestro local
          de Esperanza, Santa Fe.
        </p>

        {/* Card informativa con detalles de la experiencia gastronómica */}
        <div className="mt-6 rounded-2xl border border-pb-cream-border bg-pb-cream/60 p-4 text-left text-xs text-pb-charcoal-muted">
          <p className="font-bold text-pb-charcoal">Próximamente en tu mesa:</p>
          <ul className="mt-2.5 space-y-1.5 list-disc list-inside">
            <li>Acceso autoservicio mediante código QR</li>
            <li>Trivias y desafíos en tiempo real con amigos y familia</li>
            <li>Competencias entre escuelas y cursos</li>
            <li>Recompensas y beneficios gastronómicos exclusivos</li>
          </ul>
        </div>

        <p className="mt-6 text-[11px] font-medium text-pb-charcoal-light">
          Escanear el código QR colocado en tu mesa para comenzar.
        </p>
      </div>
    </main>
  );
}
