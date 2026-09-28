'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { CalendarCheck, PlusCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import {
  formatBengaliDate,
  toBengaliNumber,
  LEAVE_STATUS_LABELS,
} from '@/lib/bengali';

export default function ResidentPortalLeavePage() {
  const { success, error } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    departureDate: '',
    expectedReturnDate: '',
    reason: '',
    destinationAddress: '',
    emergencyPhone: '',
  });

  const fetchMyLeaves = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leave');
      if (res.ok) {
        const json = await res.json();
        setLeaves(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setForm({
        departureDate: '',
        expectedReturnDate: '',
        reason: '',
        destinationAddress: '',
        emergencyPhone: '',
      });
      fetchMyLeaves();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'আবেদন ব্যর্থ হয়েছে';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            ছুটির আবেদন ও রেকর্ড
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            বাড়ি যাওয়া বা সাময়িক ছুটির আবেদন জমা দিন ও অনুমোদনের স্ট্যাটাস দেখুন
          </p>
        </div>

        {/* Submit Leave Application */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-900" />
            <span>নতুন ছুটির আবেদন ফর্ম</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রস্থানের তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={form.departureDate}
                  onChange={(e) => setForm({ ...form, departureDate: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রত্যাশিত ফেরার তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={form.expectedReturnDate}
                  onChange={(e) => setForm({ ...form, expectedReturnDate: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ছুটির কারণ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: পরীক্ষা শেষ / পারিবারিক অনুষ্ঠান"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  জরুরি যোগাযোগের মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="০১৭xxxxxxxx"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ছুটিকালীন অবস্থান বা গন্তব্যের ঠিকানা *
              </label>
              <input
                type="text"
                required
                placeholder="গ্রাম, থানা, জেলা"
                value={form.destinationAddress}
                onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : 'ছুটির আবেদন জমা দিন'}
              </button>
            </div>
          </form>
        </div>

        {/* My Past Leaves */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900">
            আমার পূর্ববর্তী ছুটির হিস্ট্রি
          </div>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : leaves.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              এখনো কোনো ছুটির আবেদন করা হয়নি
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {leaves.map((l) => {
                const cfg =
                  LEAVE_STATUS_LABELS[l.status as keyof typeof LEAVE_STATUS_LABELS] ||
                  LEAVE_STATUS_LABELS.PENDING;

                return (
                  <div key={l._id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{l.reason}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-1">
                        ছুটি: {formatBengaliDate(l.departureDate)} থেকে {formatBengaliDate(l.expectedReturnDate)} পর্যন্ত
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
