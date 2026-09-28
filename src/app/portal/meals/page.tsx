'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { UtensilsCrossed, Clock, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';

export default function ResidentPortalMealsPage() {
  const { success, error } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active edit state for today or tomorrow
  const [editingDate, setEditingDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [breakfast, setBreakfast] = useState(1);
  const [lunch, setLunch] = useState(1);
  const [dinner, setDinner] = useState(1);
  const [guestLunch, setGuestLunch] = useState(0);
  const [guestDinner, setGuestDinner] = useState(0);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setMeals(json.data || []);
      }
    } catch (e) {
      console.error(e);
      error('মিলের তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [selectedMonth]);

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editingDate,
          breakfast,
          lunch,
          dinner,
          guestLunch,
          guestDinner,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      fetchMeals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'মিল পরিবর্তন করা যায়নি';
      error(msg);
    }
  };

  const totalConsumedUnits = meals.reduce((acc, m) => acc + (m.totalUnits || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            আমার মিল ক্যালেন্ডার ও নিয়ন্ত্রণ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            আগামী দিনের মিল চালু বা বন্ধ করুন এবং মেহমান মিল যোগ করুন
          </p>
        </div>

        {/* Cutoff Policy Notice */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">মিল বন্ধের নিয়মাবলী ও কাটঅফ সময়:</span>
            <p className="mt-0.5">
              • সকালের নাস্তা: আগের দিন রাত ১০:০০ টার পূর্বে বন্ধ করতে হবে।<br />
              • দুপুরের খাবার: একই দিন সকাল ৯:০০ টার পূর্বে বন্ধ করতে হবে।<br />
              • রাতের খাবার: একই দিন বিকাল ৪:০০ টার পূর্বে বন্ধ করতে হবে।
            </p>
          </div>
        </div>

        {/* Quick Meal Switcher Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-900" />
            <span>মিল অন/অফ করুন</span>
          </h2>

          <form onSubmit={handleSaveMeal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  তারিখ নির্বাচন করুন *
                </label>
                <input
                  type="date"
                  required
                  value={editingDate}
                  onChange={(e) => setEditingDate(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">সকাল</label>
                  <select
                    value={breakfast}
                    onChange={(e) => setBreakfast(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={1}>১ (চালু)</option>
                    <option value={0}>০ (বন্ধ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">দুপুর</label>
                  <select
                    value={lunch}
                    onChange={(e) => setLunch(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={1}>১ (চালু)</option>
                    <option value={2}>২ মিল</option>
                    <option value={0}>০ (বন্ধ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">রাত</label>
                  <select
                    value={dinner}
                    onChange={(e) => setDinner(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={1}>১ (চালু)</option>
                    <option value={2}>২ মিল</option>
                    <option value={0}>০ (বন্ধ)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors"
              >
                পরিবর্তন নিশ্চিত করুন
              </button>
            </div>
          </form>
        </div>

        {/* Month Summary Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-900">
              {selectedMonth} মাসের আমার মিল হিস্ট্রি (মোট: {toBengaliNumber(totalConsumedUnits)} ইউনিট)
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs p-1.5 rounded-xl border border-slate-200 font-bold"
            />
          </div>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">তারিখ</th>
                    <th className="p-3 text-center">সকালের নাস্তা</th>
                    <th className="p-3 text-center">দুপুরের খাবার</th>
                    <th className="p-3 text-center">রাতের খাবার</th>
                    <th className="p-3 text-center">মোট ইউনিট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {meals.map((m) => (
                    <tr key={m._id}>
                      <td className="p-3 font-semibold text-slate-800">{formatBengaliDate(m.date)}</td>
                      <td className="p-3 text-center">
                        <span className={m.breakfast > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}>
                          {m.breakfast > 0 ? 'চালু (১)' : 'বন্ধ (০)'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">
                        {toBengaliNumber(m.lunch + m.guestLunch)}
                      </td>
                      <td className="p-3 text-center font-bold">
                        {toBengaliNumber(m.dinner + m.guestDinner)}
                      </td>
                      <td className="p-3 text-center font-black text-blue-900">
                        {toBengaliNumber(m.totalUnits)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
