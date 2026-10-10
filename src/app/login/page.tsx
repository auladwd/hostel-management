'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/client';
import { Building2, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { UserRole } from '@/models/User';
import { ROLE_LABELS } from '@/lib/bengali';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bootstrapSecret, setBootstrapSecret] = useState('');
  const [bootstrapEmail, setBootstrapEmail] = useState('');

  // 1. Firebase Google Login Handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken(true);

      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'লগইন যাচাই ব্যর্থ হয়েছে');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'গুগল লগইন সম্পন্ন করা যায়নি';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Demo Instant Access (for local development, demo and pair-programming)
  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoRole: role }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ডেমো লগইন ব্যর্থ হয়েছে');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ডেমো লগইন ব্যর্থ হয়েছে';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Initial Owner Bootstrapping
  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: bootstrapSecret,
          email: bootstrapEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'বুটস্ট্র্যাপ ব্যর্থ হয়েছে');
      }

      alert('মালিক অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে! এখন লগইন করুন।');
      setShowBootstrap(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'বুটস্ট্র্যাপ ব্যর্থ হয়েছে';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Background glowing effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-slate-100 relative z-10">
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-900 text-white shadow-lg shadow-blue-950/30 mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            হোস্টেল ও মেস ম্যানেজমেন্ট
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Aulad IT Solution • একক ক্লায়েন্ট ডেডিকেটেড সিস্টেম
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Primary Action: Google Login */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold shadow-md shadow-slate-900/20 transition-all duration-150 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>গুগল দিয়ে প্রবেশ করুন</span>
          </button>
        </div>

        {/* Quick Demo Access Switcher */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-3">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>ডেমো ভূমিকা নির্বাচন করে তাৎক্ষণিক প্রবেশ করুন:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT', 'MEAL_MANAGER', 'RESIDENT'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => handleDemoLogin(r)}
                disabled={loading}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-900 border border-slate-200 text-slate-700 text-left transition-colors flex items-center justify-between"
              >
                <span>{ROLE_LABELS[r]}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Initial Owner Bootstrap Section */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShowBootstrap(!showBootstrap)}
            className="text-xs text-blue-700 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{showBootstrap ? 'বুটস্ট্র্যাপ বন্ধ করুন' : 'মালিক অ্যাকাউন্ট সক্রিয়করণ (বুটস্ট্র্যাপ)'}</span>
          </button>

          {showBootstrap && (
            <form onSubmit={handleBootstrap} className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-3 animate-in fade-in">
              <p className="text-[11px] text-slate-600">
                প্রথমবার ডিপ্লয়মেন্টের পর মালিক একাউন্ট তৈরি করতে BOOTSTRAP_SECRET কি এবং মালিকের ইমেইল লিখুন:
              </p>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  মালিকের ইমেইল:
                </label>
                <input
                  type="email"
                  required
                  placeholder="owner@example.com"
                  value={bootstrapEmail}
                  onChange={(e) => setBootstrapEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  বুটস্ট্র্যাপ সিক্রেট কি:
                </label>
                <input
                  type="password"
                  required
                  placeholder="BOOTSTRAP_SECRET"
                  value={bootstrapSecret}
                  onChange={(e) => setBootstrapSecret(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                মালিক সক্রিয় করুন
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
