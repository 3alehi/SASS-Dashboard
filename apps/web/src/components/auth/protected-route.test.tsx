import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { GuestRoute } from '@/components/auth/guest-route';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuthStore } from '@/stores/auth-store';

function renderProtected(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <div>App content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderGuest(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/app/dashboard" element={<div>App content</div>} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <div>Login form</div>
            </GuestRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, isInitialized: false });
  });

  it('shows a loading state before auth initializes', () => {
    renderProtected('/app');
    expect(screen.queryByText('App content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    useAuthStore.setState({ isInitialized: true });
    renderProtected('/app');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    useAuthStore.setState({
      isInitialized: true,
      // Minimal shape sufficient for isAuthenticated check.
      session: {} as never,
      user: {} as never,
    });
    renderProtected('/app');
    expect(screen.getByText('App content')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, isInitialized: false });
  });

  it('renders children when unauthenticated', () => {
    useAuthStore.setState({ isInitialized: true });
    renderGuest('/login');
    expect(screen.getByText('Login form')).toBeInTheDocument();
  });

  it('redirects to /app/dashboard equivalent route when authenticated', () => {
    useAuthStore.setState({ isInitialized: true, session: {} as never, user: {} as never });
    renderGuest('/login');
    expect(screen.getByText('App content')).toBeInTheDocument();
  });
});
