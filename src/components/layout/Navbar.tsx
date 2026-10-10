'use client';

import React, { useState, useEffect } from 'react';
import { Menu, Bell, LogOut, Shield, ChevronDown, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatBengaliDate, ROLE_LABELS } from '@/lib/bengali';
import { UserRole } from '@/models/User';
import { ApplicationMode } from '@/models/Settings';
import { isDemoMode } from '@/lib/apiClient';

interface NavbarProps {
  user?: {
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    photoURL?: string;
  } | null;
  mode?: ApplicationMode;
  onOpenMobileSidebar: () => void;
  onRefresh?: () => void;
}

export function Navbar({
  user,
  mode = 'COMBINED',
  onOpenMobileSidebar,
  onRefresh,
}: NavbarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [todayText, setTodayText] = useState('');

  useEffect(() => {
    setTodayText(formatBengaliDate(new Date(), 'long'));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchDemoRole = async (targetRole: UserRole) => {
    try {
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demoRole: targetRole }),
      });
      setRoleSwitcherOpen(false);
      if (onRefresh) onRefresh();
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-slate-200 shadow-2xs">
      {/* Left: Mobile Toggle & Date */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="text-xs font-semibold text-slate-500 hidden sm:block">
            {todayText || 'আজকের দিন'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800 hidden md:inline">
              কন্ট্রোল সেন্টার
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {mode === 'COMBINED' ? 'হোস্টেল + মেস' : mode === 'MESS_ONLY' ? 'মেস মোড' : 'হোস্টেল মোড'}
            </span>
            {isDemoMode() && (
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                ডেমো মোড
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Role Switcher, Notification, Profile */}
      <div className="flex items-center gap-3">
        {/* Development Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            title="ভূমিকা পরিবর্তন (Demo Role Switcher)"
          >
            <Shield className="w-3.5 h-3.5 text-blue-700" />
            <span className="hidden sm:inline">{ROLE_LABELS[user?.role || 'OWNER']}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {roleSwitcherOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                ভূমিকা পরিবর্তন (ডেভেলপমেন্ট)
              </div>
              {(['OWNER', 'HOSTEL_MANAGER', 'MEAL_MANAGER', 'ACCOUNTANT', 'STAFF', 'RESIDENT'] as UserRole[]).map(
                (r) => (
                  <button
                    key={r}
                    onClick={() => handleSwitchDemoRole(r)}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-50 text-slate-700"
                  >
                    <span>{ROLE_LABELS[r]}</span>
                    {user?.role === r && <Check className="w-3.5 h-3.5 text-blue-700" />}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
              {user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {user?.displayName || 'ব্যবহারকারী'}
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {user?.email || 'user@hostel.bd'}
              </div>
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-100 md:hidden">
                <div className="text-xs font-bold text-slate-800">{user?.displayName}</div>
                <div className="text-[10px] text-slate-500">{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>লগআউট করুন</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
