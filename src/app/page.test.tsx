import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from './page';

describe('HomePage', () => {
  it('renders the Punto Burger heading', () => {
    render(<HomePage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Punto Burger');
  });

  it('displays the development status badge', () => {
    render(<HomePage />);
    expect(screen.getByText(/fase de desarrollo/i)).toBeInTheDocument();
  });

  it('displays the descriptive text for the Esperanza local', () => {
    render(<HomePage />);
    expect(
      screen.getByText(/la experiencia digital interactiva de punto burger está en construcción/i)
    ).toBeInTheDocument();
  });
});
