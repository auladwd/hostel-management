'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { ToastProvider } from '@/components/ui/Toast';
import { UserRole } from '@/models/User';
import { ApplicationMode } from '@/models/Settings';
import { fetchWithDemo } from '@/lib/apiClient';
import { onIdTokenChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    displayName: string;
    email: string;
    role: UserRole;
    photoURL?: string;
  } | null>(null);
  const [settings, setSettings] = useState<{
    hostelName: string;
    activeMode: ApplicationMode;
  }>({
    hostelName: 'গ্রিন ভিউ হোস্টেল ও মেস',
    activeMode: 'COMBINED',
  });

  const loadSessionAndSettings = async () => {
    try {
      // 1. Fetch current session
      const sessRes = await fetchWithDemo('/api/auth/session');
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        if (sessData.user) {
          setCurrentUser(sessData.user);
        }
      }

      // 2. Fetch settings
      const setRes = await fetchWithDemo('/api/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData.data) {
          setSettings({
            hostelName: setData.data.hostelName,
            activeMode: setData.data.activeMode || 'COMBINED',
          });
        }
      }
    } catch (e) {
      console.error('AppShell initialization error:', e);
    }
  };

  useEffect(() => {
    loadSessionAndSettings();

    // Auto-refresh server session cookie whenever Firebase client refreshes the ID token
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const freshToken = await firebaseUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: freshToken }),
          });
        } catch (e) {
          console.warn('Background session refresh error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
        {/* Sidebar */}
        <Sidebar
          role={currentUser?.role || 'OWNER'}
          mode={settings.activeMode}
          hostelName={settings.hostelName}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
          <Navbar
            user={currentUser}
            mode={settings.activeMode}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onRefresh={loadSessionAndSettings}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
          <MobileNav role={currentUser?.role || 'OWNER'} mode={settings.activeMode} />
        </div>
      </div>
  );
}
