import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';
import { AuthContext } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const mockLogin = vi.fn();

function renderWithAuthContext() {
  render(
    <AuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      accessToken: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
    }}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

describe('Login Page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
  });

  it('renders login form', () => {
    renderWithAuthContext();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithAuthContext();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login on submit', async () => {
    renderWithAuthContext();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'testpass');
  });
}); 