import React, { useState, FormEvent, useEffect } from 'react';
import { Shield, Clock, Heart, ArrowRight, Lock, PhoneCall, Sparkles } from 'lucide-react';
import DashboardView from './components/DashboardView';
import EmergencyPublicView from './components/EmergencyPublicView';
import { useAuth } from './AuthContext';
import { parseEmergencyAccessTokenFromHash } from './utils/emergencyAccessUrl';

const VIEW_KEY = 'mylife_view';

function getSavedView(): 'landing' | 'dashboard' {
  try { return (localStorage.getItem(VIEW_KEY) as any) || 'landing'; }
  catch { return 'landing'; }
}

export default function App() {
  const { user, isAuthenticated, login, register, error: authError, clearError, isLoading } = useAuth();

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>(getSavedView);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [emailInput, setEmailInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [genderInput, setGenderInput] = useState<'male' | 'female'>('female');
  const [emergencyPublicToken, setEmergencyPublicToken] = useState<string | null>(
    () => parseEmergencyAccessTokenFromHash()
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    const onHashChange = () => setEmergencyPublicToken(parseEmergencyAccessTokenFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && getSavedView() === 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // After register success, redirect
  useEffect(() => {
    if (isAuthenticated && currentView === 'landing' && isSubmitted) {
      const t = setTimeout(() => goToDashboard(), 1800);
      return () => clearTimeout(t);
    }
  }, [isAuthenticated, currentView, isSubmitted]);

  const goToDashboard = () => {
    setCurrentView('dashboard');
    localStorage.setItem(VIEW_KEY, 'dashboard');
    setActiveSection(null);
    resetForm();
  };

  const backToHome = () => {
    setCurrentView('landing');
    localStorage.setItem(VIEW_KEY, 'landing');
  };

  const resetForm = () => {
    setEmailInput(''); setUsernameInput(''); setPasswordInput('');
    setIsSubmitted(false); clearError();
  };

  const openSection = (s: string) => { setActiveSection(s); resetForm(); setMobileNavOpen(false); };
  const closeSection = () => { setActiveSection(null); resetForm(); };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault(); clearError();
    if (!emailInput || !passwordInput) return;
    setIsAuthLoading(true);
    try { await login(emailInput, passwordInput); goToDashboard(); }
    catch {}
    finally { setIsAuthLoading(false); }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault(); clearError();
    if (!emailInput || !usernameInput || !passwordInput) return;
    setIsAuthLoading(true);
    try { await register(usernameInput, emailInput, passwordInput, 'patient', genderInput); setIsSubmitted(true); }
    catch {}
    finally { setIsAuthLoading(false); }
  };

  if (emergencyPublicToken) {
    return <EmergencyPublicView token={emergencyPublicToken} />;
  }

  if (currentView === 'dashboard') return <DashboardView onBackToHome={backToHome} />;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const navLinks = ['Features', 'How It Works', 'For Doctors', 'Emergency'];

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white transition";
  const labelCls = "block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f0f0ee] font-sans antialiased">
      {/* BG Video */}
      <video src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_215831_c6a8989c-d716-4d8d-8745-e972a2eec711.mp4"
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-white/25 backdrop-blur-[2px] z-[1]" />

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── NAVBAR ── */}
        <header className="w-full sticky top-0 z-30">
          <nav className="flex items-center justify-between px-4 sm:px-8 py-4 gap-4">

            {/* Logo */}
            <button onClick={() => closeSection()} className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full overflow-hidden shadow-md bg-white">
                <img src="/logo.png" alt="MyLife" className="w-full h-full object-cover" />
              </div>
              <span className="font-extrabold text-[15px] tracking-tight hidden sm:flex items-center">
                <span className="bg-gradient-to-r from-lime-500 via-emerald-400 to-cyan-500 bg-clip-text text-transparent">My</span>
                <span className="text-sky-500">Life</span>
              </span>
            </button>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1 liquid-crystal rounded-2xl px-4 py-2 shadow-sm">
              {navLinks.map(link => (
                <button key={link} onClick={() => openSection(activeSection === link ? '' : link)}
                  className={`text-[13px] font-semibold px-3 py-1.5 rounded-xl transition-all ${
                    activeSection === link
                      ? 'text-blue-700 bg-white/80 shadow-sm'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                  }`}>
                  {link}
                </button>
              ))}
              <span className="w-px h-4 bg-gray-300/50 mx-1" />
              <button onClick={() => isAuthenticated ? goToDashboard() : openSection(activeSection === 'Login' ? '' : 'Login')}
                className={`text-[13px] font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  activeSection === 'Login'
                    ? 'text-blue-700 bg-white/80 shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white/40'
                }`}>
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </button>
            </div>

            {/* Mobile right side */}
            <div className="flex items-center gap-2 md:hidden">
              {isAuthenticated ? (
                <button onClick={goToDashboard} className="text-[13px] font-bold px-4 py-2 rounded-full liquid-crystal-blue shadow">
                  Dashboard →
                </button>
              ) : (
                <button onClick={() => openSection('Login')} className="text-[13px] font-bold px-4 py-2 rounded-full liquid-crystal shadow">
                  Login
                </button>
              )}
              <button onClick={() => setMobileNavOpen(v => !v)}
                className="w-9 h-9 rounded-xl liquid-crystal flex items-center justify-center text-slate-700 shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  {mobileNavOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
                </svg>
              </button>
            </div>
          </nav>

          {/* Mobile nav dropdown */}
          {mobileNavOpen && (
            <div className="md:hidden mx-4 mb-3 rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl overflow-hidden animate-slideDown">
              {navLinks.map(link => (
                <button key={link} onClick={() => openSection(link)}
                  className="w-full text-left px-5 py-3.5 text-[13.5px] font-semibold text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition border-b border-gray-100 last:border-0">
                  {link}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* ── HERO ── */}
        <main className="flex-1 flex items-end pb-12 sm:pb-20 pt-4 px-4 sm:px-10 lg:px-20">
          <div className="w-full flex flex-col md:flex-row md:items-end md:justify-between gap-8">

            {/* Left: Hero copy */}
            <div className="w-full max-w-sm">
              <button onClick={() => openSection('Features')}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-500 hover:text-blue-600 mb-4 group">
                <span>Privacy-first healthcare by </span>
                <span className="font-extrabold">
                  <span className="bg-gradient-to-r from-lime-500 to-cyan-500 bg-clip-text text-transparent">My</span>
                  <span className="text-sky-500">Life</span>
                </span>
                <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
              </button>

              <h1 className="text-[1.6rem] sm:text-[1.9rem] leading-[1.15] font-extrabold text-slate-900 tracking-tight mb-4">
                Your medical records.<br />Owned by you.<br />Shared on your terms.
              </h1>

              <p className="text-[13px] text-slate-700 font-medium mb-6 leading-relaxed bg-white/35 backdrop-blur-sm px-3 py-2 rounded-xl inline-block">
                Store, manage and share your health history across any hospital or clinic.
              </p>

              <div className="flex flex-wrap gap-2.5">
                <button onClick={() => isAuthenticated ? goToDashboard() : openSection('Register')}
                  className="inline-flex items-center gap-2 text-[13.5px] font-bold px-6 py-3 rounded-full liquid-crystal-blue shadow-lg">
                  {isAuthenticated ? 'Go to Dashboard' : 'Get started free'} →
                </button>
                {!isAuthenticated && (
                  <button onClick={() => openSection('How It Works')}
                    className="inline-flex items-center gap-2 text-[13.5px] font-bold text-blue-700 px-6 py-3 rounded-full liquid-crystal shadow-md border border-white/70">
                    How it works →
                  </button>
                )}
              </div>

              {/* Trust badges — mobile friendly row */}
              <div className="flex flex-wrap gap-2 mt-5">
                {['🔒 Privacy-first design', '📋 PDPA-aware workflows', '🇱🇰 Made in Sri Lanka'].map(b => (
                  <span key={b} className="text-[11px] font-medium text-gray-600 bg-white/70 border border-gray-200 rounded-full px-3 py-1">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Section Panel */}
            {activeSection && (
              <div className="w-full md:max-w-md ml-auto">
                <div className="relative bg-white/90 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-2xl p-6 animate-slideDown">
                  <button onClick={closeSection}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>

                  {activeSection === 'Features' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-lg bg-blue-50 text-blue-500"><Shield size={20}/></div><h2 className="text-base font-bold text-gray-900">Sri Lanka Unified Health ID</h2></div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">Store all diagnostics, records, and treatments in your cloud-secured private vault.</p>
                      <div className="space-y-3">
                        {[['Direct Patient Ownership','You control who sees your records and for how long.'],['Consent-Based Sharing','Time-limited links and revocable access tokens.'],['Future-Ready Integrations','Designed to connect with clinics and labs as partnerships grow.']].map(([t,d]) => (
                          <div key={t} className="flex items-start gap-2.5">
                            <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"/>
                            <div><h3 className="text-xs font-semibold text-gray-800">{t}</h3><p className="text-[12px] text-gray-500">{d}</p></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeSection === 'How It Works' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Sparkles size={20}/></div><h2 className="text-base font-bold text-gray-900">3 Simple Steps</h2></div>
                      <ul className="space-y-4">
                        {[['Register','Create your patient vault with email and password.'],['Upload & Organize','Store reports and documents in one place.'],['Share & Revoke','Generate temporary share links and revoke when done.']].map(([t,d],i) => (
                          <li key={t} className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">{i+1}</div>
                            <div><span className="block text-[12.5px] font-semibold text-gray-800">{t}</span><span className="block text-[12px] text-gray-500">{d}</span></div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeSection === 'For Doctors' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Shield size={20}/></div><h2 className="text-base font-bold text-gray-900">For clinical teams</h2></div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">MyLife is built with privacy-first principles and designed for PDPA-aware healthcare workflows. Doctor accounts require verification — register as a patient today or contact us for clinical access.</p>
                      <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-[12px] text-indigo-900 leading-relaxed">
                        Future-ready for hospital and clinic integrations when partnerships are in place.
                      </div>
                    </div>
                  )}

                  {activeSection === 'Emergency' && (
                    <div>
                      <div className="flex items-center gap-2 mb-3"><div className="p-2 rounded-lg bg-rose-50 text-rose-600 animate-pulse"><PhoneCall size={20}/></div><h2 className="text-base font-bold text-red-600">Emergency Smart Bypass</h2></div>
                      <p className="text-[13px] text-gray-600 mb-4 leading-relaxed">Patients can generate a revocable emergency access link with critical medical details for responders.</p>
                      <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-100 mb-3">
                        <p className="text-[12px] text-orange-900">Token-based access shows blood type, allergies, conditions, and medications — without exposing your full account.</p>
                      </div>
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                        <strong>Need immediate help?</strong> Dial <a href="tel:1990" className="underline font-bold text-red-600">1990</a> (Free island-wide pre-hospital relief).
                      </div>
                    </div>
                  )}

                  {activeSection === 'Register' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-lg bg-blue-50 text-blue-500"><Lock size={20}/></div><h2 className="text-base font-bold text-gray-900">Create Your Health Vault</h2></div>
                      {authError && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[12px] border border-red-100">{authError}</div>}
                      {!isSubmitted ? (
                        <form onSubmit={handleRegister} className="space-y-3">
                          <div><label className={labelCls}>Full Name</label><input type="text" required value={usernameInput} onChange={e=>setUsernameInput(e.target.value)} placeholder="Saman Alwis" className={inputCls}/></div>
                          <div><label className={labelCls}>Email</label><input type="email" required value={emailInput} onChange={e=>setEmailInput(e.target.value)} placeholder="saman@example.com" className={inputCls}/></div>
                          <div>
                            <label className={labelCls}>Gender</label>
                            <select value={genderInput} onChange={e=>setGenderInput(e.target.value as 'male' | 'female')} className={inputCls}>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-relaxed">New accounts are registered as <strong>patients</strong>. Doctor, admin, and family caregiver access requires verification.</p>
                          <div><label className={labelCls}>Password</label><input type="password" required value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} placeholder="••••••••" className={inputCls}/></div>
                          <button type="submit" disabled={isAuthLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                            {isAuthLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : null}
                            {isAuthLoading ? 'Creating...' : 'Create Vault'} {!isAuthLoading && <ArrowRight size={14}/>}
                          </button>
                          <div className="text-center"><span className="text-[12px] text-gray-500">Already have an account? </span><button type="button" onClick={()=>openSection('Login')} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">Log in</button></div>
                        </form>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-bounce">✓</div>
                          <h3 className="font-bold text-gray-900 mb-1">Vault Created!</h3>
                          <p className="text-[12px] text-gray-500">Redirecting to your dashboard...</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeSection === 'Login' && (
                    <div>
                      <div className="flex items-center gap-2 mb-4"><div className="p-2 rounded-lg bg-blue-50 text-blue-500"><Lock size={20}/></div><h2 className="text-base font-bold text-gray-900">Access Your Vault</h2></div>
                      {authError && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-[12px] border border-red-100">{authError}</div>}
                      <form onSubmit={handleLogin} className="space-y-3">
                        <div><label className={labelCls}>Email</label><input type="email" required value={emailInput} onChange={e=>setEmailInput(e.target.value)} placeholder="saman@example.com" className={inputCls}/></div>
                        <div><label className={labelCls}>Password</label><input type="password" required value={passwordInput} onChange={e=>setPasswordInput(e.target.value)} placeholder="••••••••" className={inputCls}/></div>
                        <button type="submit" disabled={isAuthLoading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                          {isAuthLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : null}
                          {isAuthLoading ? 'Verifying...' : 'Unlock Vault'} {!isAuthLoading && <ArrowRight size={14}/>}
                        </button>
                        <div className="text-center"><span className="text-[12px] text-gray-500">No account? </span><button type="button" onClick={()=>openSection('Register')} className="text-[12px] font-semibold text-blue-600 hover:text-blue-700">Sign up free</button></div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
