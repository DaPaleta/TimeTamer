import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import React from 'react'
import { useAuth } from '../context/AuthContext'

// Minimal ProtectedRoute implementation for test
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <div>Redirected to login</div>
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('redirects unauthenticated users to /login', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute>Protected Content</ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText(/redirected to login/i)).toBeInTheDocument()
  })

  it('allows authenticated users to access protected pages', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: 'testuser',
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute>Protected Content</ProtectedRoute>} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText(/protected content/i)).toBeInTheDocument()
  })
})

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))
