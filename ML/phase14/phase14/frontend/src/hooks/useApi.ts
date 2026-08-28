import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import { useSessionStore } from '@/stores/sessionStore';
import type { SessionState } from '@/stores/sessionStore';
import type { SessionWithDetails } from '@/types';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.health(),
    staleTime: 30000,
  });
}

export function useCreateSession() {
  const setSession = useSessionStore((state: SessionState) => state.setSession);
  const setSessionId = useSessionStore((state: SessionState) => state.setSessionId);

  return useMutation({
    mutationFn: () => api.createSession(),
    onSuccess: (data) => {
      setSessionId(data.session_id);
      setSession({ session_id: data.session_id, status: data.status });
    },
  });
}

export function useGetSession(sessionId: string | null) {
  return useQuery<SessionWithDetails>({
    queryKey: ['session', sessionId],
    queryFn: () => api.getSession(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSessionStatus(sessionId: string | null) {
  return useQuery({
    queryKey: ['sessionStatus', sessionId],
    queryFn: () => api.getSessionStatus(sessionId!),
    enabled: !!sessionId,
    refetchInterval: 3000,
  });
}

export function useUploadAudio() {
  const setSession = useSessionStore((state: SessionState) => state.setSession);
  const session = useSessionStore((state: SessionState) => state.session);

  return useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      api.uploadAudio(sessionId, file),
    onSuccess: (data) => {
      if (session) {
        setSession({ ...session, status: data.status });
      }
    },
  });
}

export function useProcessSession() {
  const setSession = useSessionStore((state: SessionState) => state.setSession);
  const session = useSessionStore((state: SessionState) => state.session);

  return useMutation({
    mutationFn: (sessionId: string) => api.processSession(sessionId),
    onSuccess: (data) => {
      if (session) {
        setSession({ ...session, status: data.status });
      }
    },
  });
}

export function useTranscript(sessionId: string | null) {
  return useQuery({
    queryKey: ['transcript', sessionId],
    queryFn: () => api.getTranscript(sessionId!),
    enabled: !!sessionId,
  });
}

export function useUpdateTranscript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { corrected_text: string } }) =>
      api.updateTranscript(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transcript', variables.sessionId] });
    },
  });
}

export function useDraft(sessionId: string | null) {
  return useQuery({
    queryKey: ['draft', sessionId],
    queryFn: () => api.getDraft(sessionId!),
    enabled: !!sessionId,
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: Record<string, unknown> }) =>
      api.updateDraft(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.sessionId] });
    },
  });
}

export function useCreateClarification() {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { target_field: string; reason: string } }) =>
      api.createClarification(sessionId, data),
  });
}

export function useAnswerClarification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { clarification_id: string; answer_text: string | null; mark_unknown: boolean; answer_source: string } }) =>
      api.answerClarification(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['draft', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['clarifications', variables.sessionId] });
    },
  });
}

export function useRegenerateCatalogue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => api.regenerateCatalogue(sessionId),
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({ queryKey: ['draft', sessionId] });
    },
  });
}

export function useApproveCatalogue() {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { approving_user_id: string } }) =>
      api.approveCatalogue(sessionId, data),
  });
}

export function useApprovedSnapshot(sessionId: string | null) {
  return useQuery({
    queryKey: ['approvedSnapshot', sessionId],
    queryFn: () => api.getApprovedSnapshot(sessionId!),
    enabled: !!sessionId,
  });
}

export function useDeleteSourceData() {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { delete_recording: boolean; delete_transcript: boolean } }) =>
      api.deleteSourceData(sessionId, data),
  });
}

export function useSubmitConsent() {
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { consent_granted: boolean; retention_choice: { choice: 'immediate' | 'until_approval' | 'configurable'; configurable_days?: number }; consent_policy_version: string } }) =>
      api.submitConsent(sessionId, data),
  });
}

export function useDevToken() {
  return useMutation({
    mutationFn: (userId?: string) => api.getDevToken(userId),
  });
}