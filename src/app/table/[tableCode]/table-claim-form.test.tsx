import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableClaimForm } from './table-claim-form';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('TableClaimForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el input y el botón con estado inicial deshabilitado', () => {
    render(<TableClaimForm tableCode="mesa-01" />);

    const input = screen.getByLabelText(/Código de acceso temporal/i);
    const button = screen.getByRole('button', { name: /Comenzar/i });

    expect(input).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('convierte la entrada a mayúsculas y habilita el botón con 5 caracteres', () => {
    render(<TableClaimForm tableCode="mesa-01" />);

    const input = screen.getByLabelText(/Código de acceso temporal/i) as HTMLInputElement;
    const button = screen.getByRole('button', { name: /Comenzar/i });

    fireEvent.change(input, { target: { value: 'abc12' } });

    expect(input.value).toBe('ABC12');
    expect(button).toBeEnabled();
  });

  it('envía los datos al endpoint y redirige al recibir ok: true', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        next: '/play/setup',
      }),
    } as unknown as Response);

    render(<TableClaimForm tableCode="mesa-01" />);

    const input = screen.getByLabelText(/Código de acceso temporal/i);
    const button = screen.getByRole('button', { name: /Comenzar/i });

    fireEvent.change(input, { target: { value: '7HK9P' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/tables/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableCode: 'mesa-01', accessCode: '7HK9P' }),
      });
      expect(mockPush).toHaveBeenCalledWith('/play/setup');
    });
  });

  it('muestra mensaje de error amigable cuando la API rechaza el código', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        ok: false,
        error: {
          code: 'INVALID_ACCESS_CODE',
          message: 'El código temporal ingresado es incorrecto o ha expirado.',
        },
      }),
    } as unknown as Response);

    render(<TableClaimForm tableCode="mesa-01" />);

    const input = screen.getByLabelText(/Código de acceso temporal/i);
    const button = screen.getByRole('button', { name: /Comenzar/i });

    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/El código temporal ingresado es incorrecto o ha expirado/i)
      ).toBeInTheDocument();
    });
  });
});
