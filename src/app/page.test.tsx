import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HomePage from './page';

vi.mock('@/db/client', () => ({
  getDb: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  })),
}));

describe('HomePage', () => {
  it('renders the Punto Burger heading', async () => {
    const Component = await HomePage();
    render(Component);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Punto Burger');
  });

  it('displays the venue location badge', async () => {
    const Component = await HomePage();
    render(Component);
    expect(screen.getByText(/local esperanza, santa fe/i)).toBeInTheDocument();
  });

  it('displays the welcome text for the interactive experience', async () => {
    const Component = await HomePage();
    render(Component);
    expect(
      screen.getByText(/¡bienvenidos a la experiencia digital interactiva de punto burger!/i)
    ).toBeInTheDocument();
  });
});
