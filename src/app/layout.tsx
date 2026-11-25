import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Punto Burger',
  description: 'Experiencia digital interactiva de Punto Burger.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-pb-cream text-pb-charcoal antialiased selection:bg-pb-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
