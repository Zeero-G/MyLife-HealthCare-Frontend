import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield, Phone, AlertTriangle, Droplets, Pill,
  Activity, Edit3, Save, X, Plus, CheckCircle, AlertCircle, Link2, Copy, Trash2,
} from 'lucide-react';
import { emergencyAPI, HttpError } from '../api';
import { useAuth } from '../AuthContext';
import type {
  EmergencyProfile,
  EmergencyProfilePayload,
  EmergencyAccessTokenResponse,
  EmergencyContact,
  MedicalInfoStatus,
} from '../types';
import {
  loadCachedEmergencyProfile,
  cacheEmergencyProfile,
  clearEmergencyProfileCache,
} from '../utils/emergencyProfileCache';
import { buildEmergencyAccessUrl } from '../utils/emergencyAccessUrl';
import {
  normalizeEmergencyProfile,
  profileToForm,
  emptyEmergencyForm,
  formToPayload,
  validateEmergencyForm,
  normalizeEmergencyFormState,
  coerceMedicalStatus,
  hasEmergencyFormErrors,
  formatConfirmedAt,
  ownerMedicalMessage,
  statusLabel,
  DEFAULT_CONTACT,
} from '../utils/emergencyProfile';
import type { EmergencyFormFieldErrors, MedicalSectionKey } from '../utils/emergencyProfile';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function isLikelyNetworkError(err: unknown): boolean {
  if (err instanceof HttpError) return false;
  if (err instanceof TypeError) return true;
  if (err instanceof Error && /failed to fetch|network error|load failed/i.test(err.message)) {
    return true;
  }
  return false;
}

const STATUS_OPTIONS: { value: MedicalInfoStatus; label: string }[] = [
  { value: 'unknown', label: 'Unknown / Not confirmed yet' },
  { value: 'none', label: 'None / No known items' },
  { value: 'has_items', label: 'Has items' },
];

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition';
const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

function TagInput({
  label, icon, values, onChange, placeholder, color = 'blue',
}: {
  label: string; icon: React.ReactNode; values: string[];
  onChange: (v: string[]) => void; placeholder: string; color?: string;
}) {
  const [input, setInput] = useState('');
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-emerald-100 text-emerald-700',
  };
  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); setInput(''); }
  };
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        {icon} {label}
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(v => (
          <span key={v} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colorMap[color]}`}>
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} className="hover:opacity-70">
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className={inputCls}
        />
        <button type="button" onClick={add} className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition text-sm font-semibold">
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}

function MedicalStatusField({
  label,
  icon,
  status,
  items,
  onStatusChange,
  onItemsChange,
  placeholder,
  color,
  noneReadLabel,
  fieldError,
}: {
  label: string;
  icon: React.ReactNode;
  status: MedicalInfoStatus;
  items: string[];
  onStatusChange: (s: MedicalInfoStatus) => void;
  onItemsChange: (items: string[]) => void;
  placeholder: string;
  color: string;
  noneReadLabel: string;
  fieldError?: string;
}) {
  return (
    <div className="space-y-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
      <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
        {icon} {label}
      </label>
      <select
        value={status}
        onChange={e => onStatusChange(coerceMedicalStatus(e.target.value))}
        className={inputCls}
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {status === 'unknown' && (
        <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">Not confirmed yet</p>
      )}
      {status === 'none' && (
        <p className="text-xs text-gray-500 italic bg-gray-50 rounded-lg px-3 py-2">{noneReadLabel}</p>
      )}
      {status === 'has_items' && (
        <TagInput label={`${label} list`} icon={icon} values={items} onChange={onItemsChange} placeholder={placeholder} color={color} />
      )}
      {fieldError && (
        <p className="text-xs text-red-600 flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" /> {fieldError}
        </p>
      )}
    </div>
  );
}

function MedicalReadCard({
  title, icon, status, items, noneLabel, color,
}: {
  title: string; icon: React.ReactNode; status: MedicalInfoStatus; items: string[];
  noneLabel: string; color: string;
}) {
  const display = ownerMedicalMessage(status, items, noneLabel);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        {icon} {title}
      </h3>
      <p className="text-[10px] text-gray-400 mb-2">{statusLabel(status)}</p>
      {display.type === 'message' ? (
        <p className="text-sm text-gray-600 italic">{display.text}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {display.items!.map(item => (
            <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>{item}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactsEditor({
  contacts,
  onChange,
  fieldError,
}: {
  contacts: EmergencyContact[];
  onChange: (c: EmergencyContact[]) => void;
  fieldError?: string;
}) {
  const update = (index: number, patch: Partial<EmergencyContact>) => {
    const next = contacts.map((c, i) => (i === index ? { ...c, ...patch } : c));
    onChange(next);
  };

  const addContact = () => {
    onChange([...contacts, { ...DEFAULT_CONTACT, priority: contacts.length + 1 }]);
  };

  const removeContact = (index: number) => {
    const next = contacts.filter((_, i) => i !== index).map((c, i) => ({ ...c, priority: i + 1 }));
    onChange(next.length ? next : [{ ...DEFAULT_CONTACT, priority: 1 }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <Phone size={14} className="text-blue-500" /> Emergency contacts
        </label>
        <button
          type="button"
          onClick={addContact}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Plus size={14} /> Add contact
        </button>
      </div>
      {fieldError && (
        <p className="text-xs text-red-600 flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="shrink-0" /> {fieldError}
        </p>
      )}
      {contacts.map((contact, index) => (
        <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 relative">
          {contacts.length > 1 && (
            <button
              type="button"
              onClick={() => removeContact(index)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
              title="Remove contact"
            >
              <Trash2 size={14} />
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
            <div>
              <label className={labelCls}>Name</label>
              <input type="text" value={contact.name} onChange={e => update(index, { name: e.target.value })} placeholder="Full name" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input type="tel" value={contact.phone} onChange={e => update(index, { phone: e.target.value })} placeholder="+94 71 234 5678" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Relationship</label>
              <input type="text" value={contact.relationship || ''} onChange={e => update(index, { relationship: e.target.value })} placeholder="e.g. Spouse" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input
                type="number"
                min={1}
                value={contact.priority ?? index + 1}
                onChange={e => update(index, { priority: Number(e.target.value) || 1 })}
                className={inputCls}
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <input type="text" value={contact.notes || ''} onChange={e => update(index, { notes: e.target.value })} placeholder="Optional" className={inputCls} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmergencyView() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<EmergencyFormFieldErrors>({});
  const [success, setSuccess] = useState('');

  const [accessToken, setAccessToken] = useState<EmergencyAccessTokenResponse | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState<EmergencyProfilePayload>(emptyEmergencyForm());
  const editingRef = useRef(false);
  const savingRef = useRef(false);

  editingRef.current = editing;

  const userId = user?.id;

  const applyProfile = useCallback((data: EmergencyProfile, options?: { cache?: boolean }) => {
    const normalized = normalizeEmergencyProfile(data);
    setProfile(normalized);
    setForm(profileToForm(normalized));
    setFieldErrors({});
    if (options?.cache !== false && userId) {
      cacheEmergencyProfile(userId, normalized);
    }
  }, [userId]);

  const setMedicalStatus = useCallback((
    section: MedicalSectionKey,
    status: MedicalInfoStatus,
  ) => {
    setForm((f) => {
      const next = { ...f };
      if (section === 'allergies') {
        next.allergies_status = status;
        if (status !== 'has_items') next.allergies = [];
      } else if (section === 'conditions') {
        next.conditions_status = status;
        if (status !== 'has_items') next.chronic_conditions = [];
      } else {
        next.medications_status = status;
        if (status !== 'has_items') next.current_medications = [];
      }
      return next;
    });
    setFieldErrors((e) => ({ ...e, [section]: undefined }));
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      if (savingRef.current) return;
      setLoading(true);
      setError('');
      try {
        const data = await emergencyAPI.getProfile();
        if (cancelled || savingRef.current) return;
        applyProfile(data);
      } catch (err: unknown) {
        if (cancelled || savingRef.current) return;

        if (err instanceof HttpError) {
          if (err.status === 404) {
            clearEmergencyProfileCache();
            setProfile(null);
            if (!editingRef.current) {
              setForm(emptyEmergencyForm());
              setEditing(true);
            }
            return;
          }
          if (err.status === 405) {
            setProfile(null);
            if (!editingRef.current) {
              setForm(emptyEmergencyForm());
              setEditing(true);
            }
            setError(
              'Could not load your emergency profile (GET /emergency/profile returned Method Not Allowed). ' +
                'Saving still uses POST /emergency/profile/upsert — check the Network tab on Save to confirm.'
            );
            return;
          }
          if (err.status === 401 || err.status === 403) {
            setError(
              err.message ||
                'You do not have permission to view this emergency profile, or your session has expired.'
            );
            return;
          }
        }

        const cached = loadCachedEmergencyProfile(userId);
        if (cached && isLikelyNetworkError(err)) {
          applyProfile(cached, { cache: false });
          setError('Could not reach the server. Showing the last copy saved in this browser session.');
          return;
        }

        setError(err instanceof Error ? err.message : 'Failed to load emergency profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId, applyProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeEmergencyFormState(form);
    const errors = validateEmergencyForm(normalized);
    if (hasEmergencyFormErrors(errors)) {
      setForm(normalized);
      setFieldErrors(errors);
      setError('');
      return;
    }
    setSaving(true);
    savingRef.current = true;
    setError('');
    setFieldErrors({});
    setSuccess('');
    const payload = formToPayload(normalized);
    if (import.meta.env.DEV) {
      console.debug('[EmergencyProfile] saving via POST /emergency/profile/upsert', payload);
    }
    try {
      const saved = await emergencyAPI.saveProfile(payload);
      applyProfile(saved);
      setEditing(false);
      setSuccess('Emergency profile saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setForm(normalized);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleGenerateToken = async () => {
    setTokenLoading(true);
    setError('');
    try {
      const data = await emergencyAPI.createAccessToken();
      setAccessToken(data);
      setSuccess('Emergency access link generated. Share only with trusted responders.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate access link');
    } finally {
      setTokenLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!accessToken) return;
    if (!confirm('Revoke this emergency access link? Responders will no longer be able to use it.')) return;
    setTokenLoading(true);
    setError('');
    try {
      await emergencyAPI.revokeAccessToken(accessToken.token);
      setAccessToken(null);
      setSuccess('Emergency access link revoked.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to revoke link');
    } finally {
      setTokenLoading(false);
    }
  };

  const copyAccessUrl = () => {
    if (!accessToken) return;
    navigator.clipboard.writeText(buildEmergencyAccessUrl(accessToken.token));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = () => {
    if (profile) setForm(profileToForm(profile));
    else setForm(emptyEmergencyForm());
    setFieldErrors({});
    setError('');
    setEditing(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shareUrl = accessToken ? buildEmergencyAccessUrl(accessToken.token) : '';
  const confirmedLabel = profile ? formatConfirmedAt(profile.last_confirmed_at) : null;
  const contacts = profile ? normalizeEmergencyProfile(profile).emergency_contacts : [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield size={24} className="text-red-500" /> Emergency Profile
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Critical medical info for emergency responders. Public access uses a revocable link — not your user ID.
          </p>
          {confirmedLabel && (
            <p className="text-xs text-gray-500 mt-1">Last confirmed: {confirmedLabel}</p>
          )}
        </div>
        {profile && !editing && (
          <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
            <Edit3 size={15} /> Edit Profile
          </button>
        )}
      </div>

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm">
          <CheckCircle size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-xl text-red-600 flex-shrink-0">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-red-800 text-sm">Token-based responder access</h3>
          <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
            Generate a time-limited link. Responders see medical details; emergency contacts are included only if you enable sharing below.
          </p>
        </div>
      </div>

      {profile && !editing && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Link2 size={16} className="text-blue-600" /> Emergency access link
          </h3>
          {accessToken ? (
            <>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Share URL</p>
                <p className="text-xs text-gray-800 break-all font-mono">{shareUrl}</p>
                <p className="text-xs text-amber-600 mt-2">Expires: {new Date(accessToken.expires_at).toLocaleString()}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyAccessUrl} className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
                  {copied ? <><CheckCircle size={16} /> Copied</> : <><Copy size={16} /> Copy link</>}
                </button>
                <button type="button" onClick={handleRevokeToken} disabled={tokenLoading} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition disabled:opacity-60">
                  <Trash2 size={16} /> Revoke
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={handleGenerateToken} disabled={tokenLoading} className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {tokenLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Link2 size={16} />}
              {tokenLoading ? 'Generating...' : 'Generate emergency access link'}
            </button>
          )}
        </div>
      )}

      {(editing || !profile) ? (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Droplets size={14} className="text-red-500" /> Blood Type
              </label>
              <div className="flex flex-wrap gap-2">
                {BLOOD_TYPES.map(bt => (
                  <button
                    key={bt}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, blood_type: bt }))}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                      form.blood_type === bt ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            </div>

            <ContactsEditor
              contacts={form.emergency_contacts || [{ ...DEFAULT_CONTACT }]}
              onChange={c => {
                setForm(f => ({ ...f, emergency_contacts: c }));
                setFieldErrors(e => ({ ...e, contacts: undefined }));
              }}
              fieldError={fieldErrors.contacts}
            />

            <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/80 cursor-pointer">
              <input
                type="checkbox"
                checked={form.show_emergency_contacts_publicly ?? false}
                onChange={e => setForm(f => ({ ...f, show_emergency_contacts_publicly: e.target.checked }))}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900 block mb-1">Show emergency contacts to responders</span>
                If disabled, responders can see your medical emergency details but not your contact details.
              </span>
            </label>

            <MedicalStatusField
              label="Allergies"
              icon={<AlertTriangle size={14} className="text-orange-500" />}
              status={coerceMedicalStatus(form.allergies_status)}
              items={form.allergies || []}
              onStatusChange={s => setMedicalStatus('allergies', s)}
              onItemsChange={items => {
                setForm(f => ({ ...f, allergies: items }));
                setFieldErrors(e => ({ ...e, allergies: undefined }));
              }}
              placeholder="e.g. Penicillin... (press Enter)"
              color="orange"
              noneReadLabel="No known allergies"
              fieldError={fieldErrors.allergies}
            />
            <MedicalStatusField
              label="Chronic conditions"
              icon={<Activity size={14} className="text-red-500" />}
              status={coerceMedicalStatus(form.conditions_status)}
              items={form.chronic_conditions || []}
              onStatusChange={s => setMedicalStatus('conditions', s)}
              onItemsChange={items => {
                setForm(f => ({ ...f, chronic_conditions: items }));
                setFieldErrors(e => ({ ...e, conditions: undefined }));
              }}
              placeholder="e.g. Diabetes... (press Enter)"
              color="red"
              noneReadLabel="No known chronic conditions"
              fieldError={fieldErrors.conditions}
            />
            <MedicalStatusField
              label="Current medications"
              icon={<Pill size={14} className="text-green-500" />}
              status={coerceMedicalStatus(form.medications_status)}
              items={form.current_medications || []}
              onStatusChange={s => setMedicalStatus('medications', s)}
              onItemsChange={items => {
                setForm(f => ({ ...f, current_medications: items }));
                setFieldErrors(e => ({ ...e, medications: undefined }));
              }}
              placeholder="e.g. Metformin... (press Enter)"
              color="green"
              noneReadLabel="No known medications"
              fieldError={fieldErrors.medications}
            />
          </div>

          <div className="flex gap-3">
            {profile && (
              <button
                type="button"
                onClick={() => {
                  setForm(profileToForm(profile));
                  setFieldErrors({});
                  setError('');
                  setEditing(false);
                }}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : (profile ? 'Save Changes' : 'Create Emergency Profile')}
            </button>
          </div>
        </form>
      ) : (
        profile && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-red-100">
              <p className="text-red-100 text-xs font-semibold uppercase tracking-widest mb-1">Blood Type</p>
              <p className="text-5xl font-black">{profile.blood_type || '—'}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={14} /> Emergency contacts
                </h3>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  profile.show_emergency_contacts_publicly ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {profile.show_emergency_contacts_publicly ? 'Shared on access link' : 'Private on access link'}
                </span>
              </div>
              {contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map(c => (
                    <div key={`${c.priority}-${c.phone}-${c.name}`} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {c.priority ?? '·'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-sm text-blue-600">{c.phone}</p>
                        {c.relationship && <p className="text-xs text-gray-500 capitalize">{c.relationship}</p>}
                        {c.notes && <p className="text-xs text-gray-400 mt-0.5">{c.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No emergency contacts added.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MedicalReadCard title="Allergies" icon={<AlertTriangle size={16} className="text-orange-500" />} status={profile.allergies_status} items={profile.allergies} noneLabel="No known allergies" color="bg-orange-100 text-orange-700" />
              <MedicalReadCard title="Conditions" icon={<Activity size={16} className="text-red-500" />} status={profile.conditions_status} items={profile.chronic_conditions} noneLabel="No known chronic conditions" color="bg-red-100 text-red-700" />
              <MedicalReadCard title="Medications" icon={<Pill size={16} className="text-green-500" />} status={profile.medications_status} items={profile.current_medications} noneLabel="No known medications" color="bg-emerald-100 text-emerald-700" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
