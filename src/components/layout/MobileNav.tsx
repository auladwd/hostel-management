'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, Receipt, UtensilsCrossed } from 'lucide-react';
import { ApplicationMode } from '@/models/Settings';
import { UserRole } from '@/models/User';

interface MobileNavProps {
  role?: UserRole;
  mode?: ApplicationMode;
}

export function MobileNav({ role = 'OWNER', mode = 'COMBINED' }: MobileNavProps) {
  const pathname = usePathname();

  const isResident = role === 'RESIDENT';

  const items = isResident
    ? [
        { label: 'হোম', href: '/dashboard', icon: LayoutDashboard },
        { label: 'ভাড়া', href: '/portal/rent', icon: Receipt },
        { label: 'মিল', href: '/portal/meals', icon: UtensilsCrossed },
      ]
    : [
        { label: 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
        { label: 'রুম', href: '/rooms', icon: Building2 },
        { label: 'বর্ডার', href: '/residents', icon: Users },
        ...(mode !== 'MESS_ONLY' ? [{ label: 'ভাড়া', href: '/rent', icon: Receipt }] : []),
        ...(mode !== 'HOSTEL_ONLY' ? [{ label: 'মিল', href: '/meals', icon: UtensilsCrossed }] : []),
      ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              isActive ? 'text-blue-900 font-bold' : 'text-slate-500 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-900 scale-110' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
