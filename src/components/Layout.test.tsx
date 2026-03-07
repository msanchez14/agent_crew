import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { AuthProvider } from '../context/AuthContext';
import { createFetchMock } from '../test/mocks';

beforeEach(() => {
  // Mock auth config endpoint to return noop provider
  global.fetch = createFetchMock({
    '/api/auth/config': { body: { provider: 'noop', registration_enabled: false, multi_tenant: false } },
    '/api/auth/me': { body: { user: { id: '1', name: 'Test', email: 'test@test.com', is_owner: true }, organization: { id: '1', name: 'Default', slug: 'default' } } },
  });
  vi.restoreAllMocks();
});

function renderLayout(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Layout', () => {
  it('hides "New Team" button on teams list page (/)', () => {
    renderLayout('/');
    expect(screen.queryByText('New Team')).not.toBeInTheDocument();
  });

  it('hides "New Team" button on new team page (/teams/new)', () => {
    renderLayout('/teams/new');
    expect(screen.queryByText('New Team')).not.toBeInTheDocument();
  });

  it('shows "New Team" button on settings page', () => {
    renderLayout('/settings');
    const buttons = screen.getAllByText('New Team');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows "New Team" button on team monitor page', () => {
    renderLayout('/teams/some-id');
    const buttons = screen.getAllByText('New Team');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
