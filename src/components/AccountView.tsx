import React, { useState } from 'react';
import { User, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function AccountView() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 items-start">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
          <User size={48} />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
              <p className="font-semibold text-gray-900">{user.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
              <p className="font-semibold text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Role</p>
              <p className="font-semibold text-gray-900 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            {user.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Gender</p>
                <p className="font-semibold text-gray-900 capitalize">{user.gender}</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-sm font-medium text-gray-500 mb-2">MyLife User ID (Share to link accounts)</p>
            <div className="flex items-center gap-2">
              <code className="bg-gray-50 px-3 py-2 rounded-lg text-sm flex-1 text-gray-800 border border-gray-200">
                {user.id}
              </code>
              <button 
                onClick={copyId}
                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                title="Copy ID"
              >
                {copied ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Copy size={20} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
