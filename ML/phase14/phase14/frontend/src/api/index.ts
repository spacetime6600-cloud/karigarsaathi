import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type {
  CreateSessionResponse,
  AudioUploadResponse,
  ProcessSessionResponse,
  TranscriptResponse,
  TranscriptUpdateRequest,
  TranscriptUpdateResponse,
  DraftResponse,
  DraftUpdateRequest,
  DraftUpdateResponse,
  ClarificationAnswerRequest,
  ClarificationResponse,
  ClarificationAnswerResponse,
  RegenerateResponse,
  ApproveRequest,
  ApproveResponse,
  ApprovedSnapshotResponse,
  DeleteDataRequest,
  DeleteDataResponse,
  ConsentRequest,
  ConsentResponse,
  LanguageSelectionRequest,
  HealthResponse,
  RetentionInfo,
  SessionStatus,
  SessionWithDetails,
  ApiError,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private sessionId: string | null = null;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    this.client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          this.clearAuth();
        }
        return Promise.reject(error);
      }
    );
  }

  setSessionId(sessionId: string | null) {
    this.sessionId = sessionId;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('auth_token');
    }
    return this.authToken;
  }

  clearAuth() {
    this.authToken = null;
    localStorage.removeItem('auth_token');
  }

  // Health
  async health(): Promise<HealthResponse> {
    const response = await this.client.get<HealthResponse>('/health');
    return response.data;
  }

  // Auth
  async getDevToken(userId = 'dev-user'): Promise<{ access_token: string; token_type: string }> {
    const response = await this.client.post<{ access_token: string; token_type: string }>('/auth/dev-token', { user_id: userId });
    this.setAuthToken(response.data.access_token);
    return response.data;
  }

  // Sessions
  async createSession(): Promise<CreateSessionResponse> {
    const response = await this.client.post<CreateSessionResponse>('/catalogue-sessions');
    return response.data;
  }

  async getSession(sessionId: string): Promise<SessionWithDetails> {
    const response = await this.client.get<SessionWithDetails>(`/catalogue-sessions/${sessionId}`);
    return response.data;
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatus> {
    const response = await this.client.get<SessionStatus>(`/catalogue-sessions/${sessionId}/status`);
    return response.data;
  }

  // Audio
  async uploadAudio(sessionId: string, file: File): Promise<AudioUploadResponse> {
    const formData = new FormData();
    formData.append('audio_file', file);

    const response = await this.client.post<AudioUploadResponse>(
      `/catalogue-sessions/${sessionId}/audio`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  async processSession(sessionId: string): Promise<ProcessSessionResponse> {
    const response = await this.client.post<ProcessSessionResponse>(`/catalogue-sessions/${sessionId}/process`);
    return response.data;
  }

  // Transcript
  async getTranscript(sessionId: string): Promise<TranscriptResponse> {
    const response = await this.client.get<TranscriptResponse>(`/catalogue-sessions/${sessionId}/transcript`);
    return response.data;
  }

  async updateTranscript(sessionId: string, data: TranscriptUpdateRequest): Promise<TranscriptUpdateResponse> {
    const response = await this.client.patch<TranscriptUpdateResponse>(`/catalogue-sessions/${sessionId}/transcript`, data);
    return response.data;
  }

  // Draft
  async getDraft(sessionId: string): Promise<DraftResponse> {
    const response = await this.client.get<DraftResponse>(`/catalogue-sessions/${sessionId}/draft`);
    return response.data;
  }

  async updateDraft(sessionId: string, data: DraftUpdateRequest): Promise<DraftUpdateResponse> {
    const response = await this.client.patch<DraftUpdateResponse>(`/catalogue-sessions/${sessionId}/draft`, data);
    return response.data;
  }

  // Clarifications
  async createClarification(sessionId: string, data: { target_field: string; reason: string }): Promise<ClarificationResponse> {
    const response = await this.client.post<ClarificationResponse>(`/catalogue-sessions/${sessionId}/clarifications`, data);
    return response.data;
  }

  async answerClarification(sessionId: string, data: ClarificationAnswerRequest): Promise<ClarificationAnswerResponse> {
    const response = await this.client.post<ClarificationAnswerResponse>(`/catalogue-sessions/${sessionId}/clarifications`, data);
    return response.data;
  }

  // Regenerate
  async regenerateCatalogue(sessionId: string): Promise<RegenerateResponse> {
    const response = await this.client.post<RegenerateResponse>(`/catalogue-sessions/${sessionId}/regenerate`);
    return response.data;
  }

  // Approval
  async approveCatalogue(sessionId: string, data: ApproveRequest): Promise<ApproveResponse> {
    const response = await this.client.post<ApproveResponse>(`/catalogue-sessions/${sessionId}/approve`, data);
    return response.data;
  }

  async getApprovedSnapshot(sessionId: string): Promise<ApprovedSnapshotResponse> {
    const response = await this.client.get<ApprovedSnapshotResponse>(`/catalogue-sessions/${sessionId}/approved`);
    return response.data;
  }

  // Deletion
  async deleteSourceData(sessionId: string, data: DeleteDataRequest): Promise<DeleteDataResponse> {
    const response = await this.client.delete<DeleteDataResponse>(`/catalogue-sessions/${sessionId}/source-data`, { data });
    return response.data;
  }

  // Consent
  async submitConsent(sessionId: string, data: ConsentRequest): Promise<ConsentResponse> {
    const response = await this.client.post<ConsentResponse>(`/catalogue-sessions/${sessionId}/consent`, data);
    return response.data;
  }

  // Language Selection
  async selectLanguage(sessionId: string, data: LanguageSelectionRequest): Promise<{ session_id: string; status: string }> {
    const response = await this.client.post<{ session_id: string; status: string }>(`/catalogue-sessions/${sessionId}/language`, data);
    return response.data;
  }

  // Retention
  async getRetentionInfo(sessionId: string): Promise<RetentionInfo | null> {
    const response = await this.client.get<RetentionInfo>(`/catalogue-sessions/${sessionId}/retention`);
    return response.data;
  }
}

export const api = new ApiClient();