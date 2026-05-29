import React, { useEffect, useState } from 'react';
import { AlertTriangle, Droplets, Pill, Activity, Shield, Phone } from 'lucide-react';
import { emergencyAPI } from '../api';
import type { EmergencyPublicProfile } from '../types';
import { formatConfirmedAt, publicMedicalMessage } from '../utils/emergencyProfile';

interface EmergencyPublicViewProps {
  token: string;
}

function MedicalPublicCard({
  label,
  icon,
  profile,
  kind,
  statusKey,
  itemsKey,
  color,
}: {
  label: string;
  icon: React.ReactNode;
  profile: EmergencyPublicProfile;
  kind: 'allergies' | 'conditions' | 'medications';
  statusKey: 'allergies_status' | 'conditions_status' | 'medications_status';
  itemsKey: 'allergies' | 'chronic_conditions' | 'current_medications';
  color: string;
}) {
  const status = profile[statusKey];
  const display = publicMedicalMessage(status, profile[itemsKey], kind);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon} {label}
      </h2>
      {display.type === 'message' ? (
        <p className="text-sm text-gray-600 italic">{display.text}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {display.items!.map((item) => (
            <span key={item} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmergencyPublicView({ token }: EmergencyPublicViewProps) {
  const [profile, setProfile] = useState<EmergencyPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await emergencyAPI.getPublicByToken(token);
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load emergency information.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="w-10 h-10 border-4 border-red-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-100 shadow-lg p-8 text-center">
          <AlertTriangle size={40} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">Emergency access unavailable</h1>
          <p className="text-sm text-gray-600">{error || 'Invalid or expired link.'}</p>
        </div>
      </div>
    );
  }

  const confirmed = formatConfirmedAt(profile.last_confirmed_at);
  const contacts = profile.emergency_contacts;

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={22} className="text-red-600" />
          <h1 className="text-xl font-bold text-red-800">Emergency medical summary</h1>
        </div>

        {confirmed && (
          <p className="text-xs text-gray-600 mb-4 bg-white/80 border border-gray-200 rounded-xl px-3 py-2">
            Last confirmed: {confirmed}
          </p>
        )}

        <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg mb-4">
          <p className="text-red-100 text-xs font-semibold uppercase tracking-widest mb-1 flex items-center gap-1">
            <Droplets size={14} /> Blood type
          </p>
          <p className="text-5xl font-black">{profile.blood_type || '—'}</p>
        </div>

        <div className="space-y-3 mb-4">
          <MedicalPublicCard
            label="Allergies"
            icon={<AlertTriangle size={16} className="text-orange-500" />}
            profile={profile}
            kind="allergies"
            statusKey="allergies_status"
            itemsKey="allergies"
            color="bg-orange-100 text-orange-800"
          />
          <MedicalPublicCard
            label="Chronic conditions"
            icon={<Activity size={16} className="text-red-500" />}
            profile={profile}
            kind="conditions"
            statusKey="conditions_status"
            itemsKey="chronic_conditions"
            color="bg-red-100 text-red-800"
          />
          <MedicalPublicCard
            label="Current medications"
            icon={<Pill size={16} className="text-green-600" />}
            profile={profile}
            kind="medications"
            statusKey="medications_status"
            itemsKey="current_medications"
            color="bg-emerald-100 text-emerald-800"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Phone size={14} className="text-blue-500" /> Emergency contacts
          </h2>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts
                .slice()
                .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
                .map((c) => (
                  <div key={`${c.priority}-${c.phone}`} className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                    <p className="text-sm text-blue-700 font-medium">{c.phone}</p>
                    {c.relationship && (
                      <p className="text-xs text-gray-500 mt-0.5 capitalize">{c.relationship}</p>
                    )}
                    {c.notes && <p className="text-xs text-gray-500 mt-1">{c.notes}</p>}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">
              Emergency contacts are private and not shared through this link.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
