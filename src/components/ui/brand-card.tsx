import React from 'react';

interface BrandCardProps {
  children: React.ReactNode;
  className?: string;
}

export function BrandCard({ children, className = '' }: BrandCardProps) {
  return (
    <div
      className={`w-full max-w-lg rounded-3xl border border-pb-cream-border bg-white p-6 shadow-xl shadow-stone-200/60 sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
