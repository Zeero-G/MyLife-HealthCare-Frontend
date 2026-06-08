/**
 * MyLife API Client
 * Centralized HTTP layer for all backend microservice calls.
 * All requests go through the Vite dev proxy → NGINX gateway → microservices.
 */

import type {
  TokenResponse,
  User,
  Doctor,
  LoginPayload,
  RegisterPayload,
  MedicalRecord,
  CreateRecordPayload,
  ShareQRResponse,
  EmergencyProfile,
  EmergencyProfilePayload,
  FamilyMember,
  AIResult,
  Appointment,
  AppointmentCreatePayload,
  AppointmentUpdatePayload,
  MenstrualCycle,
  MenstrualCyclePayload,
  PregnancyRecord,
  PregnancyPayload,
} from './types';

// ── Token Management ───────────────────────────────────────

const TOKEN_KEY = 'mylife_access_token';
const REFRESH_KEY = 'mylife_refresh_token';
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// ── Base Fetch Helper ──────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // Attempt token refresh on 401
  if (response.status === 401 && !skipAuth) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        const refreshResp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (refreshResp.ok) {
          const tokens: TokenResponse = await refreshResp.json();
          setTokens(tokens.access_token, tokens.refresh_token);
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${tokens.access_token}`;
          const retryResp = await fetch(`${API_BASE}${url}`, { ...options, headers });
          if (!retryResp.ok) {
            const err = await retryResp.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(err.detail || `HTTP ${retryResp.status}`);
          }
          if (retryResp.status === 204) return undefined as T;
          return retryResp.json();
        } else {
          clearTokens();
          throw new Error('Session expired. Please log in again.');
        }
      } catch {
        clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }
    clearTokens();
    throw new Error('Not authenticated');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: `HTTP ${response.status}` }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// ── Auth API ───────────────────────────────────────────────

export const authAPI = {
  register: (payload: RegisterPayload): Promise<TokenResponse> =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true),

  login: (payload: LoginPayload): Promise<TokenResponse> =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, true),

  logout: (): Promise<{ message: string }> =>
    apiFetch('/auth/logout', { method: 'POST' }),

  me: (): Promise<User> =>
    apiFetch('/auth/me'),

  updateMe: (payload: { full_name: string }): Promise<User> =>
    apiFetch('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  listDoctors: (): Promise<Doctor[]> =>
    apiFetch('/auth/doctors'),
};

// ── Medical Records API ────────────────────────────────────

export const recordsAPI = {
  list: (): Promise<MedicalRecord[]> =>
    apiFetch('/records/'),

  familyRecords: (patientId: string): Promise<MedicalRecord[]> =>
    apiFetch(`/records/family/${patientId}`),

  get: (recordId: string): Promise<MedicalRecord> =>
    apiFetch(`/records/${recordId}`),

  create: (payload: CreateRecordPayload): Promise<MedicalRecord> =>
    apiFetch('/records/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (recordId: string, payload: Partial<CreateRecordPayload>): Promise<MedicalRecord> =>
    apiFetch(`/records/${recordId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (recordId: string): Promise<void> =>
    apiFetch(`/records/${recordId}`, { method: 'DELETE' }),

  shareQR: (recordId: string, expiresHours = 24): Promise<ShareQRResponse> =>
    apiFetch('/records/share-qr', {
      method: 'POST',
      body: JSON.stringify({ record_id: recordId, expires_hours: expiresHours }),
    }),

  upload: (file: File): Promise<{ file_url: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiFetch('/records/upload', {
      method: 'POST',
      body: formData,
    });
  },
};

// ── Emergency API ──────────────────────────────────────────

export const emergencyAPI = {
  getProfile: (userId: string): Promise<EmergencyProfile> =>
    apiFetch(`/emergency/profile/${userId}`, {}, true),

  upsert: (payload: EmergencyProfilePayload): Promise<EmergencyProfile> =>
    apiFetch('/emergency/profile/upsert', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  create: (payload: EmergencyProfilePayload): Promise<EmergencyProfile> =>
    apiFetch('/emergency/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (payload: EmergencyProfilePayload): Promise<EmergencyProfile> =>
    apiFetch('/emergency/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

// ── Family API ─────────────────────────────────────────────

export const familyAPI = {
  members: (): Promise<FamilyMember[]> =>
    apiFetch('/family/members'),

  link: (linkedUserId: string, relationship: string): Promise<{ message: string; data: FamilyMember }> =>
    apiFetch(`/family/link?linked_user_id=${encodeURIComponent(linkedUserId)}&relationship=${encodeURIComponent(relationship)}`, {
      method: 'POST',
    }),

  unlink: (linkedUserId: string): Promise<{ message: string }> =>
    apiFetch(`/family/unlink/${linkedUserId}`, { method: 'DELETE' }),
};

// ── Appointments API ───────────────────────────────────────

export const appointmentsAPI = {
  book: (payload: AppointmentCreatePayload): Promise<Appointment> =>
    apiFetch('/appointments/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  myAppointments: (): Promise<Appointment[]> =>
    apiFetch('/appointments/mine'),

  doctorAppointments: (): Promise<Appointment[]> =>
    apiFetch('/appointments/doctor'),

  update: (appointmentId: string, payload: AppointmentUpdatePayload): Promise<Appointment> =>
    apiFetch(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  cancel: (appointmentId: string): Promise<void> =>
    apiFetch(`/appointments/${appointmentId}`, { method: 'DELETE' }),
};

// ── Women's Health API ─────────────────────────────────────

export const healthAPI = {
  getCycles: (): Promise<MenstrualCycle[]> =>
    apiFetch('/health/cycle'),

  logCycle: (payload: MenstrualCyclePayload): Promise<MenstrualCycle> =>
    apiFetch('/health/cycle', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPregnancy: (): Promise<PregnancyRecord[]> =>
    apiFetch('/health/pregnancy'),

  logPregnancy: (payload: PregnancyPayload): Promise<PregnancyRecord> =>
    apiFetch('/health/pregnancy', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ── AI API ─────────────────────────────────────────────────

export const aiAPI = {
  /** Trigger AI extraction from a file URL already in storage */
  processByUrl: (userId: string, fileUrl: string): Promise<AIResult> =>
    apiFetch('/ai/process', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, file_url: fileUrl }),
    }),

  /** Upload a file directly to AI for scanning (multipart) */
  processUpload: (userId: string, file: File): Promise<AIResult> => {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('file', file);
    return apiFetch('/ai/process-upload', {
      method: 'POST',
      body: formData,
    });
  },

  getResult: (docId: string): Promise<AIResult> =>
    apiFetch(`/ai/results/${docId}`),

  getSummary: (userId: string): Promise<AIResult[]> =>
    apiFetch(`/ai/summary?user_id=${encodeURIComponent(userId)}`),
};
