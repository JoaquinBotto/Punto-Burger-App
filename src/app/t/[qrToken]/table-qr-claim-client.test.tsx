import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableQrClaimClient } from './table-qr-claim-client';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TableQrClaimClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el botón "Jugar ahora" habilitado cuando no hay cooldown', () => {
    render(<TableQrClaimClient qrToken="secure-token-123" />);

    const button = screen.getByRole('button', { name: /Jugar ahora/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeEnabled();
  });

  it('muestra estado de preparación temporal y botón deshabilitado cuando hay cooldown', () => {
    render(<TableQrClaimClient qrToken="secure-token-123" initialCooldownSeconds={30} />);

    expect(screen.getByText(/Mesa en preparación temporal/i)).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /Espere \(30s\)/i });
    expect(button).toBeDisabled();
  });

  it('envía solicitud al hacer clic y redirige a la siguiente pantalla al recibir ok: true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        next: '/play/setup',
      }),
    } as unknown as Response);

    render(<TableQrClaimClient qrToken="secure-token-123" />);

    const button = screen.getByRole('button', { name: /Jugar ahora/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/tables/claim-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: 'secure-token-123' }),
      });
      expect(mockPush).toHaveBeenCalledWith('/play/setup');
    });
  });

  it('muestra mensaje de error si el servidor rechaza el reclamo', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        ok: false,
        error: {
          code: 'TABLE_ALREADY_IN_USE',
          message: 'Esta mesa ya tiene una partida en curso.',
        },
      }),
    } as unknown as Response);

    render(<TableQrClaimClient qrToken="secure-token-123" />);

    const button = screen.getByRole('button', { name: /Jugar ahora/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Esta mesa ya tiene una partida en curso/i)).toBeInTheDocument();
    });
  });
});
