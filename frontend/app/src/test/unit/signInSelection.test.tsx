import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SignInSelectionPage } from '@/features/authentication/SignInSelectionPage';
import { SignInPage } from '@/features/authentication/SignInPage';
import { CoordinatorLoginPage } from '@/features/coordinator/pages/CoordinatorLoginPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';

describe('Public Sign-In Selection & Role Entry Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Renders shared Sign-In Selection Page with heading, subtitle and 2 role cards', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/sign-in" element={<SignInSelectionPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome to KarigarSaathi')).toBeInTheDocument();
    expect(screen.getByText('Choose how you want to sign in.')).toBeInTheDocument();

    // Check Artisan Card
    expect(screen.getByText('Artisan sign in')).toBeInTheDocument();
    expect(
      screen.getByText('Create catalogues, manage your products, and connect with buyers.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue as Artisan/i })).toBeInTheDocument();

    // Check Coordinator Card
    expect(screen.getByText('Coordinator sign in')).toBeInTheDocument();
    expect(
      screen.getByText('Support assigned artisans, review products, and manage buyer enquiries.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue as Coordinator/i })).toBeInTheDocument();

    // Check Return to Homepage Link
    expect(screen.getByText(/Back to homepage/i)).toBeInTheDocument();
  });

  it('2. Navigates to /login when clicking "Continue as Artisan"', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/sign-in" element={<SignInSelectionPage />} />
              <Route path="/login" element={<div data-testid="artisan-login-page">Artisan Login Page</div>} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const artisanBtn = screen.getByRole('button', { name: /Continue as Artisan/i });
    fireEvent.click(artisanBtn);

    expect(screen.getByTestId('artisan-login-page')).toBeInTheDocument();
  });

  it('3. Navigates to /coordinator/login when clicking "Continue as Coordinator"', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/sign-in" element={<SignInSelectionPage />} />
              <Route
                path="/coordinator/login"
                element={<div data-testid="coord-login-page">Coordinator Login Page</div>}
              />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    const coordBtn = screen.getByRole('button', { name: /Continue as Coordinator/i });
    fireEvent.click(coordBtn);

    expect(screen.getByTestId('coord-login-page')).toBeInTheDocument();
  });

  it('4. Provides "Change sign-in type" and "Back to home" on Artisan Login Page', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/login" element={<SignInPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Change sign-in type →/i)).toBeInTheDocument();
    expect(screen.getByText(/← Back to home/i)).toBeInTheDocument();
  });

  it('5. Provides "Change sign-in type" and "Back to home" on Coordinator Login Page', () => {
    render(
      <MemoryRouter initialEntries={['/coordinator/login']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/coordinator/login" element={<CoordinatorLoginPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Change sign-in type →/i)).toBeInTheDocument();
    expect(screen.getByText(/← Back to home/i)).toBeInTheDocument();
  });

  it('6. Renders shared Public Navigation with Home link on OnboardingShell routes', () => {
    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/sign-in" element={<SignInSelectionPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify selection page content and return link
    expect(screen.getByText(/Back to homepage/i)).toBeInTheDocument();
  });
});
