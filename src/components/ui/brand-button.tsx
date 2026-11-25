import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export function PrimaryButton({
  children,
  loading = false,
  disabled,
  className = '',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`relative inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-pb-red px-6 py-3.5 text-center text-sm font-bold tracking-wide text-white shadow-md shadow-red-950/10 transition-all hover:bg-pb-red-hover active:scale-[0.99] active:bg-pb-red-dark focus:outline-none focus:ring-4 focus:ring-pb-red/25 focus:ring-offset-2 focus:ring-offset-pb-cream disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:hover:bg-pb-red disabled:active:scale-100 ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-white"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Cargando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function SecondaryButton({
  children,
  disabled,
  className = '',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-pb-cream-border bg-white px-5 py-3 text-center text-xs font-bold text-pb-charcoal shadow-xs transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-stone-200/50 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
