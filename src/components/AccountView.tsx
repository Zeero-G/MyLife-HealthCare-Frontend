import React, { useState } from 'react';
import { User, Copy, CheckCircle2, Pencil, Save, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AccountView() {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user) return null;

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = () => {
    setNameInput(user.full_name);
    setEditing(true);
    setSaveError('');
    setSaveSuccess(false);
  };

  const cancelEdit = () => {
    setEditing(false);
    setSaveError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim() === user.full_name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      await updateUser({ full_name: nameInput.trim() });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  const roleLabel = user.role.replace('_', ' ');
  const roleColors: Record<string, string> = {
    patient: 'bg-blue-100 text-blue-700',
    doctor: 'bg-emerald-100 text-emerald-700',
    admin: 'bg-purple-100 text-purple-700',
    family_member: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Account</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Avatar Header */}
        <div className="bg-gradient-to-br from-blue-50 to-sky-100 px-6 py-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-blue-600 font-black text-3xl border-4 border-white flex-shrink-0">
            {user.full_name[0].toUpperCase()}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-gray-900">{user.full_name}</p>
            <p className="text-sm text-gray-500 mt-0.5">{user.email}</p>
            <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-6 space-y-5">

          {/* Success Banner */}
          {saveSuccess && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm">
              <CheckCircle2 size={16} /> Name updated successfully!
            </div>
          )}

          {/* Full Name Row */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</p>
            {editing ? (
              <form onSubmit={handleSave} className="space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  autoFocus
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                  placeholder="Your full name"
                />
                {saveError && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {saveError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                  >
                    <X size={13} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-60"
                  >
                    {saving
                      ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Save size={13} />
                    }
                    {saving ? 'Saving...' : 'Save Name'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{user.full_name}</p>
                <button
                  onClick={startEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                >
                  <Pencil size={13} /> Edit
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</p>
            <p className="font-semibold text-gray-900">{user.email}</p>
          </div>

          {/* Role */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Role</p>
            <p className="font-semibold text-gray-900 capitalize">{roleLabel}</p>
          </div>

          {/* Gender */}
          {user.gender && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Gender</p>
              <p className="font-semibold text-gray-900 capitalize">{user.gender}</p>
            </div>
          )}

          {/* User ID */}
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              MyLife User ID
            </p>
            <p className="text-xs text-gray-500 mb-2">Share this ID with family members so they can link to your account.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 font-mono break-all">
                {user.id}
              </code>
              <button
                onClick={copyId}
                title="Copy ID"
                className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition flex-shrink-0"
              >
                {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
