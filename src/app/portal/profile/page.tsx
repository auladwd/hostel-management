'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  Building2,
  Home,
  Phone,
  Mail,
  User,
  Shield,
  Printer,
  CreditCard,
  Calendar,
} from 'lucide-react';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';

export default function ResidentPortalProfilePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const statsRes = await fetch('/api/dashboard/stats');
        if (statsRes.ok) {
          const json = await statsRes.json();
          setData(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <LoadingSkeleton rows={6} />
      </AppShell>
    );
  }

  const r = data?.resident;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              আমার সিট ও প্রোফাইল
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              আপনার বর্তমান সিট বরাদ্দ, ব্যক্তিগত ও অভিভাবকের তথ্য
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>ডিজিটাল আইডি কার্ড প্রিন্ট</span>
          </button>
        </div>

        {/* Digital ID Card Preview */}
        <div className="max-w-md mx-auto bg-linear-to-b from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-2xl border border-blue-800/80 relative overflow-hidden print-container">
          <div className="flex items-center justify-between pb-4 border-b border-blue-700/60">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wide">
                  গ্রিন ভিউ হোস্টেল ও মেস
                </h3>
                <span className="text-[10px] text-blue-300">আবাসিক বর্ডার পরিচয়পত্র</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              সক্রিয়
            </span>
          </div>

          <div className="flex items-center gap-4 py-5">
            <div className="w-20 h-20 rounded-2xl bg-blue-800 border-2 border-blue-400/40 flex items-center justify-center text-3xl font-black shadow-inner">
              {r?.fullName ? r.fullName.charAt(0) : 'ব'}
            </div>
            <div>
              <h2 className="text-lg font-black leading-snug">{r?.fullName || 'বর্ডারের নাম'}</h2>
              <p className="text-xs text-blue-200 mt-0.5">আইডি: {r?.residentId || 'HST-2026-0001'}</p>
              <p className="text-[11px] text-blue-300">{r?.institutionOrWorkplace || 'শিক্ষার্থী'}</p>
            </div>
          </div>

          <div className="bg-blue-950/60 p-3.5 rounded-2xl border border-blue-800/60 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-blue-300">রুম ও সিট নং:</span>
              <span className="font-bold text-white">
                রুম {r?.roomId?.roomNumber || '১০১'} (সিট {r?.seatId?.seatNumber || 'A'})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">মোবাইল নম্বর:</span>
              <span className="font-bold text-white">{toBengaliNumber(r?.phone || '০১৭xxxxxxxx')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-300">রক্তের গ্রুপ:</span>
              <span className="font-bold text-rose-400">{r?.bloodGroup || 'O+'}</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-blue-800/60 flex justify-between text-[10px] text-blue-400 font-medium">
            <span>ভর্তির তারিখ: {formatBengaliDate(r?.admissionDate || new Date())}</span>
            <span>কর্তৃপক্ষের স্বাক্ষরযুক্ত</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
