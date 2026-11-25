import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the Punto Burger heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Punto Burger');
  });

  it('displays the venue location badge', () => {
    render(<HomePage />);
    expect(screen.getByText(/local esperanza, santa fe/i)).toBeInTheDocument();
  });

  it('displays the welcome text for the interactive experience', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/¡bienvenidos a la experiencia digital interactiva de punto burger!/i)
    ).toBeInTheDocument();
  });
});
