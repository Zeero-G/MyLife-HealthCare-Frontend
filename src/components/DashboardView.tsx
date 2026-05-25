import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  UploadCloud,
  Users,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  ArrowLeft,
  Calendar,
  Heart,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import FamilyDashboard from './FamilyDashboard';
import PatientDashboard from './PatientDashboard';
import AccountView from './AccountView';
import RecordsView from './RecordsView';
import UploadView from './UploadView';
import EmergencyView from './EmergencyView';
import WomensHealthView from './WomensHealthView';
import AppointmentView from './AppointmentView';

interface DashboardViewProps {
  onBackToHome: () => void;
}

type TabType =
  | 'overview'
  | 'records'
  | 'upload'
  | 'family'
  | 'emergency'
  | 'account'
  | 'appointments'
  | 'womens-health'
  | 'patients'
  | 'verify';

const TAB_KEY = 'mylife_tab';

function getSavedTab(): TabType {
  try {
    return (localStorage.getItem(TAB_KEY) as TabType) || 'overview';
  } catch {
    return 'overview';
  }
}

export default function DashboardView({ onBackToHome }: DashboardViewProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTabState] = useState<TabType>(getSavedTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    localStorage.setItem(TAB_KEY, tab);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    onBackToHome();
  };

  const getNavItems = () => {
    const role = user?.role || 'patient';
    const common = [{ id: 'account' as TabType, label: 'Account', icon: UserIcon }];

    if (role === 'admin') {
      return [
        { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'records' as TabType, label: 'All Records', icon: FileText },
        ...common,
      ];
    }

    if (role === 'doctor') {
      return [
        { id: 'overview' as TabType, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'appointments' as TabType, label: 'Appointments', icon: Calendar },
        { id: 'upload' as TabType, label: 'Upload Report', icon: UploadCloud },
        ...common,
      ];
    }

    if (role === 'family_member') {
      return [
        { id: 'overview' as TabType, label: 'Family Hub', icon: LayoutDashboard },
        { id: 'family' as TabType, label: 'Manage Members', icon: Users },
        ...common,
      ];
    }

    const items: { id: TabType; label: string; icon: any }[] = [
      { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'records', label: 'My Records', icon: FileText },
      { id: 'upload', label: 'Upload Document', icon: UploadCloud },
      { id: 'appointments', label: 'Appointments', icon: Calendar },
      { id: 'family', label: 'Family Members', icon: Users },
      { id: 'emergency', label: 'Emergency Profile', icon: AlertTriangle },
    ];

    if (user?.gender === 'female') {
      items.push({ id: 'womens-health', label: "Women's Health", icon: Heart });
    }

    return [...items, ...common];
  };

  const navItems = getNavItems();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'account':       return <AccountView />;
      case 'records':       return <RecordsView />;
      case 'upload':        return <UploadView />;
      case 'emergency':     return <EmergencyView />;
      case 'womens-health': return <WomensHealthView />;
      case 'appointments':  return <AppointmentView />;
      case 'family':        return <FamilyDashboard />;
      case 'overview':
        switch (user.role) {
          case 'admin':         return <AdminDashboard />;
          case 'doctor':        return <DoctorDashboard setActiveTab={(t: TabType) => setActiveTab(t)} />;
          case 'family_member': return <FamilyDashboard />;
          default:              return <PatientDashboard setActiveTab={(t: TabType) => setActiveTab(t)} />;
        }
      default:
        return <div className="p-8 text-gray-400 text-sm">Page not found.</div>;
    }
  };

  const Logo = () => (
    <span className="font-extrabold text-lg tracking-tight flex items-center select-none">
      <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">My</span>
      <span className="text-sky-500">Life</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] flex font-sans">

      {/* ── Sidebar – Desktop ── */}
      <aside className="w-60 hidden md:flex flex-col bg-white border-r border-gray-100 sticky top-0 h-screen z-20">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-black">M</span>
          </div>
          <Logo />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">
            {user.role.replace('_', ' ')}
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon size={16} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
              {user.full_name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate leading-none">{user.full_name}</p>
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onBackToHome}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all focus-visible:outline-none"
          >
            <ArrowLeft size={15} className="text-gray-400" />
            Back to Home
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-all focus-visible:outline-none"
          >
            <LogOut size={15} />
            Log Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <Logo />
              <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all focus-visible:outline-none ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon size={16} className={activeTab === item.id ? 'text-blue-600' : 'text-gray-400'} />
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="px-3 py-4 border-t border-gray-100 space-y-1">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50">
                <LogOut size={15} /> Log Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 focus-visible:outline-none"
          >
            <Menu size={20} />
          </button>
          <Logo />
          <button
            onClick={() => setActiveTab('account')}
            className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm focus-visible:outline-none"
          >
            {user.full_name[0].toUpperCase()}
          </button>
        </div>

        <div className="pb-10">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
