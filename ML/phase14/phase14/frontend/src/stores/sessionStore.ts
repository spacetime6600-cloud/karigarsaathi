import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SupportedLanguageCode } from '@/types';

export interface Clarification {
  clarification_id: string;
  target_field: string;
  reason: string;
  source_language_question: string;
  hindi_question: string;
  english_question: string;
  status: string;
  answer: string | null;
  mark_unknown: boolean;
  required: boolean;
}

export interface SessionState {
  sessionId: string | null;
  session: { session_id: string; status: string } | null;
  selectedLanguage: SupportedLanguageCode | null;
  consentGranted: boolean;
  retentionChoice: string | null;
  audioFile: File | null;
  recordingBlob: Blob | null;
  transcriptCorrectedText: string | null;
  clarifications: Clarification[];

  setSessionId: (id: string | null) => void;
  setSession: (session: { session_id: string; status: string } | null) => void;
  setSelectedLanguage: (lang: SupportedLanguageCode | null) => void;
  setConsentGranted: (granted: boolean) => void;
  setRetentionChoice: (choice: string | null) => void;
  setAudioFile: (file: File | null) => void;
  setRecordingBlob: (blob: Blob | null) => void;
  setTranscriptCorrectedText: (text: string | null) => void;
  setClarifications: (clarifications: Clarification[]) => void;
  addClarification: (clarification: Clarification) => void;
  updateClarification: (id: string, updates: Partial<Clarification>) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  session: null,
  selectedLanguage: null,
  consentGranted: false,
  retentionChoice: null,
  audioFile: null,
  recordingBlob: null,
  transcriptCorrectedText: null,
  clarifications: [],
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,
      setSessionId: (sessionId: string | null) => set({ sessionId }),
      setSession: (session: { session_id: string; status: string } | null) => set({ session }),
      setSelectedLanguage: (selectedLanguage: SupportedLanguageCode | null) => set({ selectedLanguage }),
      setConsentGranted: (consentGranted: boolean) => set({ consentGranted }),
      setRetentionChoice: (retentionChoice: string | null) => set({ retentionChoice }),
      setAudioFile: (audioFile: File | null) => set({ audioFile }),
      setRecordingBlob: (recordingBlob: Blob | null) => set({ recordingBlob }),
      setTranscriptCorrectedText: (transcriptCorrectedText: string | null) => set({ transcriptCorrectedText }),
      setClarifications: (clarifications: Clarification[]) => set({ clarifications }),
      addClarification: (clarification: Clarification) =>
        set((state: SessionState) => ({
          clarifications: [...state.clarifications, clarification],
        })),
      updateClarification: (id: string, updates: Partial<Clarification>) =>
        set((state: SessionState) => ({
          clarifications: state.clarifications.map((c: Clarification) =>
            c.clarification_id === id ? { ...c, ...updates } : c
          ),
        })),
      reset: () => set(initialState),
    }),
    {
      name: 'karigarsaathi-session',
      partialize: (state: SessionState) => ({
        sessionId: state.sessionId,
        session: state.session,
        selectedLanguage: state.selectedLanguage,
        consentGranted: state.consentGranted,
        retentionChoice: state.retentionChoice,
        clarifications: state.clarifications,
      }),
    }
  )
);