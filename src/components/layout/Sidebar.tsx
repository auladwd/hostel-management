'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  UtensilsCrossed,
  ShoppingCart,
  DollarSign,
  UserCheck,
  CalendarCheck,
  AlertTriangle,
  FileBarChart,
  Settings as SettingsIcon,
  Home,
  X,
} from 'lucide-react';
import { ApplicationMode } from '@/models/Settings';
import { UserRole } from '@/models/User';

interface SidebarProps {
  role?: UserRole;
  mode?: ApplicationMode;
  hostelName?: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  role = 'OWNER',
  mode = 'COMBINED',
  hostelName = 'হোস্টেল ও মেস',
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  // Navigation Items
  const isResident = role === 'RESIDENT';

  const residentNavItems = [
    { label: 'আমার ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
    { label: 'আমার সিট ও তথ্য', href: '/portal/profile', icon: Home },
    { label: 'ভাড়া ও রশিদ', href: '/portal/rent', icon: Receipt },
    ...(mode !== 'HOSTEL_ONLY' ? [{ label: 'আমার মিল', href: '/portal/meals', icon: UtensilsCrossed }] : []),
    { label: 'ছুটির আবেদন', href: '/portal/leave', icon: CalendarCheck },
    { label: 'অভিযোগ জমা', href: '/portal/complaints', icon: AlertTriangle },
  ];

  const adminNavItems = [
    { label: 'ড্যাশবোর্ড', href: '/dashboard', icon: LayoutDashboard },
    { label: 'ভবন ও রুম বিন্যাস', href: '/rooms', icon: Building2 },
    { label: 'বর্ডার ও ভর্তি', href: '/residents', icon: Users },
    ...(mode !== 'MESS_ONLY' ? [{ label: 'ভাড়া ও ইনভয়েস', href: '/rent', icon: Receipt }] : []),
    ...(mode !== 'HOSTEL_ONLY' ? [{ label: 'মিল ব্যবস্থাপনা', href: '/meals', icon: UtensilsCrossed }] : []),
    ...(mode !== 'HOSTEL_ONLY' ? [{ label: 'দৈনিক বাজার', href: '/bazar', icon: ShoppingCart }] : []),
    { label: 'আর্থিক হিসাব-নিকাশ', href: '/financial', icon: DollarSign },
    { label: 'স্টাফ ও বেতন', href: '/staff', icon: UserCheck },
    { label: 'ছুটি ও ভিজিটর', href: '/leave', icon: CalendarCheck },
    { label: 'অভিযোগ নিষ্পত্তি', href: '/complaints', icon: AlertTriangle },
    { label: 'রিপোর্ট ও বিশ্লেষণ', href: '/reports', icon: FileBarChart },
    ...(role === 'OWNER' ? [{ label: 'সিস্টেম সেটিংস', href: '/settings', icon: SettingsIcon }] : []),
  ];

  const navItems = isResident ? residentNavItems : adminNavItems;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 w-64 border-r border-slate-800">
      {/* Brand Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight line-clamp-1">
              {hostelName}
            </h1>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
              {mode === 'COMBINED' ? 'হোস্টেল ও মেস' : mode === 'MESS_ONLY' ? 'মেস সিস্টেম' : 'হোস্টেল সিস্টেম'}
            </span>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-blue-800 text-white shadow-xs shadow-blue-900/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-300' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer System Info */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/40">
        <div className="text-[11px] text-slate-400 text-center font-medium">
          সিস্টেম সংস্করণ ৩.০ | Aulad IT
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
