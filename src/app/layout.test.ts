import { describe, it, expect } from 'vitest';
import { viewport, metadata } from './layout';

describe('RootLayout configuration', () => {
  it('defines the correct brand title metadata', () => {
    expect(metadata.title).toBe('Punto Burger');
  });

  it('allows browser zooming for accessibility without scale restrictions', () => {
    expect(viewport.width).toBe('device-width');
    expect(viewport.initialScale).toBe(1);
    expect(viewport.maximumScale).toBeUndefined();
    expect(viewport.userScalable).toBeUndefined();
  });
});
