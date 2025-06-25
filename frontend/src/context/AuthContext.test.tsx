import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import { render, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

// Helper component to access context
function TestComponent() {
  const { user, isAuthenticated, accessToken, login, register, logout } = useAuth();
  return (
    <div>
      <span data-testid="user">{user}</span>
      <span data-testid="is-auth">{isAuthenticated ? 'yes' : 'no'}</span>
      <span data-testid="token">{accessToken}</span>
      <button onClick={() => login('testuser', 'testpass')}>Login</button>
      <button onClick={() => register('testuser', 'test@example.com', 'testpass')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

globalThis.localStorage = window.localStorage;

const mockLoginResponse = {
  access_token: 'access123',
  refresh_token: 'refresh123',
  expires_in: 3600,
};

const mockRegisterResponse = {
  access_token: 'access456',
  refresh_token: 'refresh456',
  expires_in: 3600,
};

vi.mock('../api/auth', () => ({
  login: vi.fn(() => Promise.resolve(mockLoginResponse)),
  register: vi.fn(() => Promise.resolve(mockRegisterResponse)),
  refreshToken: vi.fn(() => Promise.resolve(mockLoginResponse)),
}));

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('AuthContext', () => {
  it('stores tokens and user in localStorage after login', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    await act(async () => {
      document.querySelector('button')!.click(); // Login
    });
    expect(localStorage.getItem('access_token')).toBe('access123');
    expect(localStorage.getItem('refresh_token')).toBe('refresh123');
    expect(localStorage.getItem('username')).toBe('testuser');
  });

  it('stores tokens and user in localStorage after register', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    await act(async () => {
      document.querySelectorAll('button')[1].click(); // Register
    });
    expect(localStorage.getItem('access_token')).toBe('access456');
    expect(localStorage.getItem('refresh_token')).toBe('refresh456');
    expect(localStorage.getItem('username')).toBe('testuser');
  });

  it('clears tokens and user on logout', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    await act(async () => {
      document.querySelector('button')!.click(); // Login
    });
    await act(async () => {
      document.querySelectorAll('button')[2].click(); // Logout
    });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });

  it('provides correct isAuthenticated state', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    expect(document.querySelector('[data-testid="is-auth"]')!.textContent).toBe('no');
    await act(async () => {
      document.querySelector('button')!.click(); // Login
    });
    expect(document.querySelector('[data-testid="is-auth"]')!.textContent).toBe('yes');
  });

  it('proactively refreshes token before expiry', async () => {
    const { refreshToken } = await import('../api/auth');
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    await act(async () => {
      document.querySelector('button')!.click(); // Login
    });
    // Fast-forward time to just before expiry
    vi.advanceTimersByTime(3500 * 1000); // 100 seconds before expiry
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    expect(refreshToken).toHaveBeenCalled();
  });

  it('logs out on refresh failure', async () => {
    const { refreshToken } = await import('../api/auth');
    (refreshToken as Mock).mockImplementationOnce(() => Promise.reject(new Error('fail')));
    await act(async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        </MemoryRouter>
      );
    });
    await act(async () => {
      document.querySelector('button')!.click(); // Login
    });
    // Fast-forward time to just before expiry
    vi.advanceTimersByTime(3500 * 1000);
    await act(async () => {
      vi.runOnlyPendingTimers();
    });
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('username')).toBeNull();
  });
}); 