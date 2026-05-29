import type {
  EmergencyContact,
  EmergencyProfile,
  EmergencyProfilePayload,
  MedicalInfoStatus,
} from '../types';

export const DEFAULT_CONTACT: EmergencyContact = {
  name: '',
  phone: '',
  relationship: '',
  priority: 1,
  notes: '',
};

export function normalizeEmergencyProfile(data: EmergencyProfile): EmergencyProfile {
  let contacts = data.emergency_contacts?.length
    ? [...data.emergency_contacts]
    : [];

  if (
    contacts.length === 0 &&
    data.emergency_contact_name &&
    data.emergency_contact_phone
  ) {
    contacts = [{
      name: data.emergency_contact_name,
      phone: data.emergency_contact_phone,
      relationship: 'Emergency contact',
      priority: 1,
    }];
  }

  return {
    ...data,
    emergency_contacts: contacts.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999)),
    allergies_status: data.allergies_status || 'unknown',
    conditions_status: data.conditions_status || 'unknown',
    medications_status: data.medications_status || 'unknown',
    show_emergency_contacts_publicly: data.show_emergency_contacts_publicly ?? false,
    allergies: data.allergies || [],
    chronic_conditions: data.chronic_conditions || [],
    current_medications: data.current_medications || [],
  };
}

export function profileToForm(profile: EmergencyProfile): EmergencyProfilePayload {
  const normalized = normalizeEmergencyProfile(profile);
  return normalizeEmergencyFormState({
    blood_type: normalized.blood_type || '',
    allergies: [...normalized.allergies],
    chronic_conditions: [...normalized.chronic_conditions],
    current_medications: [...normalized.current_medications],
    emergency_contacts: normalized.emergency_contacts.map((c) => ({ ...c })),
    allergies_status: normalized.allergies_status,
    conditions_status: normalized.conditions_status,
    medications_status: normalized.medications_status,
    show_emergency_contacts_publicly: normalized.show_emergency_contacts_publicly,
  });
}

export function emptyEmergencyForm(): EmergencyProfilePayload {
  return normalizeEmergencyFormState({
    blood_type: '',
    allergies: [],
    chronic_conditions: [],
    current_medications: [],
    emergency_contacts: [{ ...DEFAULT_CONTACT }],
    allergies_status: 'unknown',
    conditions_status: 'unknown',
    medications_status: 'unknown',
    show_emergency_contacts_publicly: false,
  });
}

export type MedicalSectionKey = 'allergies' | 'conditions' | 'medications';

export interface EmergencyFormFieldErrors {
  allergies?: string;
  conditions?: string;
  medications?: string;
  contacts?: string;
}

/** Coerce API/UI drift to a valid status (dropdown always uses these three values). */
export function coerceMedicalStatus(value: unknown): MedicalInfoStatus {
  if (value === 'unknown' || value === 'none' || value === 'has_items') {
    return value;
  }
  return 'unknown';
}

/** Keep status and item list aligned before validate/submit. */
export function normalizeMedicalSection(
  status: MedicalInfoStatus | undefined,
  items: string[] | undefined,
): { status: MedicalInfoStatus; items: string[] } {
  const coerced = coerceMedicalStatus(status);
  if (coerced === 'has_items') {
    return { status: coerced, items: [...(items || [])] };
  }
  return { status: coerced, items: [] };
}

/** Normalize full form so unknown/none never send stray items or stale has_items flags. */
export function normalizeEmergencyFormState(form: EmergencyProfilePayload): EmergencyProfilePayload {
  const allergies = normalizeMedicalSection(form.allergies_status, form.allergies);
  const conditions = normalizeMedicalSection(form.conditions_status, form.chronic_conditions);
  const medications = normalizeMedicalSection(form.medications_status, form.current_medications);

  return {
    ...form,
    allergies_status: allergies.status,
    allergies: allergies.items,
    conditions_status: conditions.status,
    chronic_conditions: conditions.items,
    medications_status: medications.status,
    current_medications: medications.items,
  };
}

export function formToPayload(form: EmergencyProfilePayload): EmergencyProfilePayload {
  const normalized = normalizeEmergencyFormState(form);

  const contacts = (normalized.emergency_contacts || [])
    .filter((c) => c.name.trim() || c.phone.trim())
    .map((c, i) => ({
      name: c.name.trim(),
      phone: c.phone.trim(),
      relationship: c.relationship?.trim() || undefined,
      priority: c.priority ?? i + 1,
      notes: c.notes?.trim() || undefined,
    }))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .map((c, i) => ({ ...c, priority: i + 1 }));

  return {
    blood_type: normalized.blood_type || undefined,
    allergies: normalized.allergies,
    chronic_conditions: normalized.chronic_conditions,
    current_medications: normalized.current_medications,
    emergency_contacts: contacts,
    allergies_status: normalized.allergies_status,
    conditions_status: normalized.conditions_status,
    medications_status: normalized.medications_status,
    show_emergency_contacts_publicly: normalized.show_emergency_contacts_publicly ?? false,
  };
}

export function validateEmergencyForm(form: EmergencyProfilePayload): EmergencyFormFieldErrors {
  const normalized = normalizeEmergencyFormState(form);
  const errors: EmergencyFormFieldErrors = {};

  const sections: { key: MedicalSectionKey; status: MedicalInfoStatus; items: string[] }[] = [
    { key: 'allergies', status: normalized.allergies_status!, items: normalized.allergies! },
    { key: 'conditions', status: normalized.conditions_status!, items: normalized.chronic_conditions! },
    { key: 'medications', status: normalized.medications_status!, items: normalized.current_medications! },
  ];

  for (const { key, status, items } of sections) {
    if (status === 'has_items' && items.length === 0) {
      errors[key] = `Add at least one item or change status to "None" or "Unknown".`;
    }
  }

  const contacts = normalized.emergency_contacts || [];
  for (const c of contacts) {
    if ((c.name.trim() || c.phone.trim()) && (!c.name.trim() || !c.phone.trim())) {
      errors.contacts = 'Each emergency contact must have both a name and phone number.';
      break;
    }
  }

  return errors;
}

export function hasEmergencyFormErrors(errors: EmergencyFormFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function statusLabel(status: MedicalInfoStatus): string {
  switch (status) {
    case 'unknown': return 'Not confirmed yet';
    case 'none': return 'None known';
    case 'has_items': return 'Has items';
    default: return status;
  }
}

export function formatConfirmedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function publicMedicalMessage(
  status: MedicalInfoStatus,
  items: string[],
  kind: 'allergies' | 'conditions' | 'medications',
): { type: 'message' | 'list'; text?: string; items?: string[] } {
  const labels = {
    allergies: {
      unknown: 'Allergy information not confirmed',
      none: 'No known allergies',
    },
    conditions: {
      unknown: 'Chronic condition information not confirmed',
      none: 'No known chronic conditions',
    },
    medications: {
      unknown: 'Medication information not confirmed',
      none: 'No known medications',
    },
  };

  if (status === 'unknown') return { type: 'message', text: labels[kind].unknown };
  if (status === 'none') return { type: 'message', text: labels[kind].none };
  return { type: 'list', items };
}

export function ownerMedicalMessage(
  status: MedicalInfoStatus,
  items: string[],
  noneLabel: string,
): { type: 'message' | 'list'; text?: string; items?: string[] } {
  if (status === 'unknown') return { type: 'message', text: 'Not confirmed yet' };
  if (status === 'none') return { type: 'message', text: noneLabel };
  if (items.length === 0) return { type: 'message', text: 'Not confirmed yet' };
  return { type: 'list', items };
}
