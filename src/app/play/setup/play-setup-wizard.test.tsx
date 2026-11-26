import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlaySetupWizard from './play-setup-wizard';
import type { PlaySetupInitialData } from '@/modules/groups';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('PlaySetupWizard Component', () => {
  const mockInitialData: PlaySetupInitialData = {
    table: { id: 't-1', code: 'mesa-01', displayName: 'Mesa 01' },
    venue: { id: 'v-1', name: 'Punto Burger Esperanza', slug: 'esperanza-central' },
    categories: [
      {
        id: 'c-1',
        slug: 'deportes',
        name: 'Deportes',
        description: 'Fútbol y más.',
        status: 'active',
        sortOrder: 1,
        isReady: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'c-2',
        slug: 'musica',
        name: 'Música',
        description: 'Rock y pop.',
        status: 'active',
        sortOrder: 2,
        isReady: false, // No disponible
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    existingSetup: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renderiza el paso 1 por defecto con título y desactiva el botón si el nombre es inválido', () => {
    render(<PlaySetupWizard initialData={mockInitialData} />);

    expect(screen.getByText('Paso 1 de 3')).toBeDefined();
    expect(screen.getByText('¿Cómo se llama tu equipo?')).toBeDefined();

    const nextButton = screen.getByText('Siguiente: ¿Quiénes juegan?');
    expect(nextButton.hasAttribute('disabled')).toBe(true);
  });

  it('muestra el copy de ranking cuando está en modo competencia', () => {
    render(
      <PlaySetupWizard
        initialData={mockInitialData}
        competition={{
          id: 'comp-1',
          name: 'Prueba Punto Burger',
          status: 'active',
          startsAt: '2026-11-26T20:00:00Z',
          endsAt: '2026-11-26T23:00:00Z',
          localDate: '2026-11-26',
        }}
      />
    );

    expect(
      screen.getByText('Este nombre aparecerá en el ranking de la competencia.')
    ).toBeDefined();
  });

  it('permite avanzar al paso 2 cuando el nombre del equipo es válido', () => {
    render(<PlaySetupWizard initialData={mockInitialData} />);

    const input = screen.getByPlaceholderText('Ej: Los Bacon');
    fireEvent.change(input, { target: { value: 'Los Cracks' } });

    const nextButton = screen.getByText('Siguiente: ¿Quiénes juegan?');
    expect(nextButton.hasAttribute('disabled')).toBe(false);

    fireEvent.click(nextButton);

    expect(screen.getByText('Paso 2 de 3')).toBeDefined();
    expect(screen.getByText('¿Quiénes juegan?')).toBeDefined();
  });

  it('permite agregar y eliminar participantes respetando los límites 1..8', () => {
    render(<PlaySetupWizard initialData={mockInitialData} />);

    // Avanzar a paso 2
    fireEvent.change(screen.getByPlaceholderText('Ej: Los Bacon'), {
      target: { value: 'Team Test' },
    });
    fireEvent.click(screen.getByText('Siguiente: ¿Quiénes juegan?'));

    // Inicialmente 1 jugador
    expect(screen.getByText('1 de 8 jugadores')).toBeDefined();
    expect(screen.queryByText('✕ Eliminar')).toBeNull(); // No se puede eliminar si hay solo 1

    // Agregar un jugador
    const addButton = screen.getByText(/\+ Agregar jugador/);
    fireEvent.click(addButton);

    expect(screen.getByText('2 de 8 jugadores')).toBeDefined();
    expect(screen.getAllByText('✕ Eliminar')).toHaveLength(2);

    // Eliminar el segundo jugador
    const deleteButtons = screen.getAllByText('✕ Eliminar');
    if (deleteButtons[1]) {
      fireEvent.click(deleteButtons[1]);
    }
    expect(screen.getByText('1 de 8 jugadores')).toBeDefined();
  });

  it('completa los 3 pasos, envía el POST y muestra la pantalla resumen con botón para modificar', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        group: { id: 'g-1', name: 'Los Cracks' },
        participants: [{ id: 'p-1', alias: 'Joaco', position: 1 }],
        gameSession: { id: 'gs-1', status: 'created' },
        next: '/play/setup',
      }),
    });
    global.fetch = fetchMock;

    render(<PlaySetupWizard initialData={mockInitialData} />);

    // Paso 1
    fireEvent.change(screen.getByPlaceholderText('Ej: Los Bacon'), {
      target: { value: 'Los Cracks' },
    });
    fireEvent.click(screen.getByText('Siguiente: ¿Quiénes juegan?'));

    // Paso 2
    const aliasInput = screen.getByPlaceholderText('Ej: Joaco');
    fireEvent.change(aliasInput, { target: { value: 'Joaco' } });
    fireEvent.click(screen.getByText('Siguiente: Categoría'));

    // Paso 3
    expect(screen.getByText('Paso 3 de 3')).toBeDefined();
    expect(screen.getByText('Elegí una categoría')).toBeDefined();

    // Comprobar que categoría no lista muestra advertencia
    expect(screen.getByText('Esta categoría está temporalmente no disponible.')).toBeDefined();

    // Confirmar
    const confirmButton = screen.getByText('Confirmar y preparar equipo');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/games/setup',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(screen.getByText('¡Equipo listo!')).toBeDefined();
      expect(screen.getByText('Ya está todo preparado para jugar.')).toBeDefined();
    });

    // Modificar equipo regresa a paso 1
    fireEvent.click(screen.getByText('Modificar equipo o categoría'));
    expect(screen.getByText('Paso 1 de 3')).toBeDefined();
  });

  it('permite llamar a /api/v1/games/prepare al hacer click en Empezar partida y redirige a /play', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        game: { status: 'created', prepared: true, questionCount: 10 },
        next: '/play',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const savedData: PlaySetupInitialData = {
      ...mockInitialData,
      existingSetup: {
        groupName: 'Los Bacon',
        participants: [
          { alias: 'Joaco', ageRange: 'adult', educationLevel: 'higher', position: 1 },
        ],
        categorySlug: 'deportes',
        isSaved: true,
      },
    };

    render(<PlaySetupWizard initialData={savedData} />);

    expect(screen.getByText('¡Equipo listo!')).toBeDefined();

    const startButton = screen.getByRole('button', { name: /Empezar partida/i });
    expect(startButton.hasAttribute('disabled')).toBe(false);

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/games/prepare',
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockPush).toHaveBeenCalledWith('/play');
    });
  });
});
