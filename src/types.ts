// ── User & Auth Types ──────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// ── Medical Records Types ──────────────────────────────────

export type RecordType = 'diagnosis' | 'lab' | 'prescription' | 'imaging' | 'other';

export interface MedicalRecord {
  id: string;
  user_id: string;
  title: string;
  record_type: RecordType;
  description: string | null;
  doctor_name: string | null;
  visit_date: string | null;
  diagnosis: string | null;
  file_url: string | null;
  created_at: string;
}

export interface CreateRecordPayload {
  title: string;
  record_type: RecordType;
  description?: string;
  doctor_name?: string;
  visit_date?: string;
  diagnosis?: string;
  file_url?: string;
}

export interface ShareQRResponse {
  qr_token: string;
  share_url: string;
  expires_at: string;
}

// ── Emergency Profile ──────────────────────────────────────

export interface EmergencyProfile {
  user_id: string;
  blood_type: string | null;
  allergies: string[];
  chronic_conditions: string[];
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  current_medications: string[];
}

// ── Family Types ───────────────────────────────────────────

export interface FamilyMember {
  id?: string;
  owner_id: string;
  linked_user_id: string;
  relationship: string;
}

// ── AI Processing ──────────────────────────────────────────

export interface AIResult {
  id: string;
  user_id: string;
  file_url: string;
  extracted_data: Record<string, unknown>;
  confidence_score: number | null;
  status: string;
}
