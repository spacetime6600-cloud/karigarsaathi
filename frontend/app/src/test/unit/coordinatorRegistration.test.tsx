import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CoordinatorRegisterPage } from '@/features/coordinator/pages/CoordinatorRegisterPage';
import { CoordinatorLoginPage } from '@/features/coordinator/pages/CoordinatorLoginPage';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { LanguageProvider } from '@/app/providers/LanguageProvider';
import { coordinatorApprovalService } from '@/services/coordinator/coordinatorApprovalService';
import { FirestoreCoordinatorRepository } from '@/repositories/firebase/FirestoreCoordinatorRepository';

describe('Coordinator Registration & Security Approval Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Renders Coordinator Registration form with all required inputs and labels', () => {
    render(
      <MemoryRouter initialEntries={['/coordinator/register']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Coordinator Registration/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Legal Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Official Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Agency \/ Promoting Organization/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Registration for Approval/i })).toBeInTheDocument();
  });

  it('2. Enforces validation when passwords do not match', async () => {
    render(
      <MemoryRouter initialEntries={['/coordinator/register']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), { target: { value: 'Anita Desai' } });
    fireEvent.change(screen.getByLabelText(/Official Email Address/i), { target: { value: 'anita@kvic.gov.in' } });
    fireEvent.change(screen.getByLabelText(/Agency \/ Promoting Organization/i), { target: { value: 'KVIC Varanasi' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Secret123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'DifferentPassword!' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Registration for Approval/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Passwords do not match/i);
    });
  });

  it('3. Successfully registers coordinator candidate in PENDING approval state', async () => {
    const email3 = `rajesh_${Date.now()}@handloom.gov.in`;

    render(
      <MemoryRouter initialEntries={['/coordinator/register']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), { target: { value: 'Rajesh Sen' } });
    fireEvent.change(screen.getByLabelText(/Official Email Address/i), { target: { value: email3 } });
    fireEvent.change(screen.getByLabelText(/Agency \/ Promoting Organization/i), { target: { value: 'Handloom Development Corporation' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'ValidPass123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'ValidPass123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Registration for Approval/i }));

    await waitFor(() => {
      expect(screen.getByText(/Application Submitted/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending Administrative Review/i)).toBeInTheDocument();
      expect(screen.getByText(email3)).toBeInTheDocument();
    });

    // Invariant: coordinatorApprovalService records status as 'pending'
    expect(coordinatorApprovalService.getRegistrationStatus(email3)).toBe('pending');
    expect(coordinatorApprovalService.isApproved(email3)).toBe(false);
  });

  it('4. Rejects duplicate coordinator registration attempts', async () => {
    const email4 = `candidate_${Date.now()}@agency.gov.in`;

    // Pre-register applicant
    await coordinatorApprovalService.registerCoordinator({
      displayName: 'Existing Candidate',
      email: email4,
      password: 'Password123!',
      agencyName: 'NABARD Cluster',
    });

    render(
      <MemoryRouter initialEntries={['/coordinator/register']}>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/coordinator/register" element={<CoordinatorRegisterPage />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Legal Name/i), { target: { value: 'Existing Candidate' } });
    fireEvent.change(screen.getByLabelText(/Official Email Address/i), { target: { value: email4 } });
    fireEvent.change(screen.getByLabelText(/Agency \/ Promoting Organization/i), { target: { value: 'NABARD Cluster' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByRole('button', { name: /Submit Registration for Approval/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/already pending approval/i);
    });
  });

  it('5. Coordinator Login displays pending review warning when unapproved applicant attempts sign in', async () => {
    const email5 = `pending_${Date.now()}@agency.gov.in`;

    await coordinatorApprovalService.registerCoordinator({
      displayName: 'Pending User',
      email: email5,
      password: 'Password123!',
      agencyName: 'State Cluster Office',
    });

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

    fireEvent.change(screen.getByLabelText(/Coordinator Email Address/i), {
      target: { value: email5 },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: 'Password123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign in as Coordinator/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Registration Pending/i);
    });
  });

  it('6. Security Invariant: Unapproved coordinator ID yields zero assignments and cannot leak artisan records', async () => {
    const unapprovedUid = 'unapproved_user_123';
    const repo = new FirestoreCoordinatorRepository();

    const assignments = await repo.listCoordinatorAssignments(unapprovedUid);
    expect(assignments).toEqual([]);

    const single = await repo.getAssignment(unapprovedUid, 'any_artisan_id');
    expect(single).toBeNull();
  });

  it('7. Pre-approved coordinator (priya@karigarsaathi.local) is recognized as approved', () => {
    expect(coordinatorApprovalService.isApproved('priya@karigarsaathi.local')).toBe(true);
    expect(coordinatorApprovalService.isApproved('coordinator@karigarsaathi.gov.in')).toBe(true);
    expect(coordinatorApprovalService.isApproved('demo_coord_priya')).toBe(true);
  });
});
