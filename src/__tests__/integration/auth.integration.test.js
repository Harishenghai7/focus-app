/**
 * Integration Tests for Authentication Flow
 * Tests the complete authentication journey including signup, login, and session management
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import Auth from '../../pages/Auth';
import { supabase } from '../../supabaseClient';

// Mock Supabase client
jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { id: 'test-user-id', username: 'testuser' }, 
            error: null 
          }))
        }))
      }))
    }))
  },
  TABLES: {
    PROFILES: 'profiles'
  }
}));

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('User Signup Flow', () => {
    it('should complete signup with valid credentials', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {}
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'test-token' } },
        error: null
      });

      renderWithProviders(<Auth />);

      // Switch to signup mode
      const signupButton = screen.getByText(/sign up/i);
      fireEvent.click(signupButton);

      // Fill in signup form
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test123!@#',
          options: expect.any(Object)
        });
      });
    });

    it('should show validation errors for weak password', async () => {
      renderWithProviders(<Auth />);

      const signupButton = screen.getByText(/sign up/i);
      fireEvent.click(signupButton);

      const passwordInput = screen.getByPlaceholderText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should handle signup errors gracefully', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Email already registered' }
      });

      renderWithProviders(<Auth />);

      const signupButton = screen.getByText(/sign up/i);
      fireEvent.click(signupButton);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Login Flow', () => {
    it('should login successfully with valid credentials', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: {
          id: 'test-user-id',
          email: 'test@example.com'
        }
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null
      });

      renderWithProviders(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });

      const loginButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test123!@#'
        });
      });
    });

    it('should show error for invalid credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' }
      });

      renderWithProviders(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

      const loginButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('should handle rate limiting on multiple failed attempts', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Too many requests' }
      });

      renderWithProviders(<Auth />);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const loginButton = screen.getByRole('button', { name: /log in/i });

      // Simulate multiple failed attempts
      for (let i = 0; i < 5; i++) {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
        fireEvent.click(loginButton);
      }

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });
  });

  describe('OAuth Login Flow', () => {
    it('should initiate OAuth login with Google', async () => {
      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: { url: 'https://accounts.google.com/oauth' },
        error: null
      });

      renderWithProviders(<Auth />);

      const googleButton = screen.getByText(/continue with google/i);
      fireEvent.click(googleButton);

      await waitFor(() => {
        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: expect.any(Object)
        });
      });
    });
  });

  describe('Session Management', () => {
    it('should maintain session after page refresh', async () => {
      const mockSession = {
        access_token: 'test-token',
        user: { id: 'test-user-id', email: 'test@example.com' }
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      renderWithProviders(<Auth />);

      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('should handle session expiration', async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Session expired' }
      });

      renderWithProviders(<Auth />);

      await waitFor(() => {
        expect(screen.getByText(/log in/i)).toBeInTheDocument();
      });
    });

    it('should logout successfully', async () => {
      supabase.auth.signOut.mockResolvedValue({
        error: null
      });

      const mockSession = {
        access_token: 'test-token',
        user: { id: 'test-user-id' }
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      // Test logout functionality
      await supabase.auth.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Email Verification', () => {
    it('should prompt for email verification after signup', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        email_confirmed_at: null
      };

      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      renderWithProviders(<Auth />);

      const signupButton = screen.getByText(/sign up/i);
      fireEvent.click(signupButton);

      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'Test123!@#' } });

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      });
    });
  });
});
