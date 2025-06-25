import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Register from './Register';
import { AuthContext } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

const mockRegister = vi.fn();

function renderWithAuthContext() {
  render(
    <AuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      accessToken: null,
      login: vi.fn(),
      register: mockRegister,
      logout: vi.fn(),
    }}>
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

describe('Register Page', () => {
  beforeEach(() => {
    mockRegister.mockReset();
  });

  it('renders register form', () => {
    renderWithAuthContext();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /register/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithAuthContext();
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('calls register on submit', async () => {
    renderWithAuthContext();
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'testpass' } });
    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'testpass');
  });
}); 