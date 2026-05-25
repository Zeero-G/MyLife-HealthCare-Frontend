// ── User & Auth Types ──────────────────────────────────────

export type UserRole = 'patient' | 'doctor' | 'admin' | 'family_member';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  gender?: 'male' | 'female';
}

export interface Doctor {
  id: string;
  full_name: string;
  email: string;
  gender?: 'male' | 'female';
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
  gender?: 'male' | 'female';
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

export interface EmergencyProfilePayload {
  blood_type?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  current_medications?: string[];
}

// ── Family Types ───────────────────────────────────────────

export interface FamilyMember {
  id?: string;
  owner_id: string;
  linked_user_id: string;
  relationship: string;
  // Enriched from users table (after backend fix)
  full_name?: string;
  email?: string;
  role?: string;
  gender?: string;
}

// ── Appointments ───────────────────────────────────────────

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  reason: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
  // Enriched fields
  doctor_name?: string;
  doctor_email?: string;
  patient_name?: string;
  patient_email?: string;
  patient_gender?: string;
}

export interface AppointmentCreatePayload {
  doctor_id: string;
  scheduled_at: string;
  reason?: string;
}

export interface AppointmentUpdatePayload {
  status?: AppointmentStatus;
  notes?: string;
  scheduled_at?: string;
}

// ── Women's Health ─────────────────────────────────────────

export interface MenstrualCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  notes: string | null;
  created_at: string;
}

export interface MenstrualCyclePayload {
  start_date: string;
  end_date?: string;
  cycle_length?: number;
  notes?: string;
}

export interface PregnancyRecord {
  id: string;
  user_id: string;
  lmp_date: string;
  due_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface PregnancyPayload {
  lmp_date: string;
  due_date?: string;
  notes?: string;
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
