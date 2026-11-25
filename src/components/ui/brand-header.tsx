import React from 'react';
import Image from 'next/image';

interface BrandHeaderProps {
  size?: 'compact' | 'default' | 'large';
  tableBadge?: string;
  venueName?: string;
  className?: string;
}

export function BrandHeader({
  size = 'default',
  tableBadge,
  venueName,
  className = '',
}: BrandHeaderProps) {
  const dimensions = {
    compact: { width: 132, height: 44, class: 'w-[132px] h-[44px]' },
    default: { width: 168, height: 56, class: 'w-[168px] h-[56px]' },
    large: { width: 228, height: 76, class: 'w-[228px] h-[76px]' },
  }[size];

  return (
    <header className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex w-full items-center justify-between gap-3">
        {/* Logo Oficial de Punto Burger (1024x341, aspect ratio 3:1) */}
        <div className="relative flex items-center">
          <Image
            src="/brand/punto-burger-logo.png"
            alt="Punto Burger"
            width={dimensions.width}
            height={dimensions.height}
            priority
            className={`${dimensions.class} object-contain transition-transform`}
          />
        </div>

        {/* Badge de Mesa */}
        {tableBadge && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-pb-yellow-border bg-pb-yellow-light px-3.5 py-1 text-xs font-bold text-pb-charcoal shadow-xs">
            <span className="h-2 w-2 rounded-full bg-pb-yellow" />
            <span>{tableBadge}</span>
          </div>
        )}
      </div>

      {venueName && (
        <p className="mt-1 self-start text-[11px] font-medium text-pb-charcoal-light">
          {venueName}
        </p>
      )}
    </header>
  );
}
