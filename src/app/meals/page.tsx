'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  PlusCircle,
  Calendar,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Download,
  Users,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';
import { exportToExcel } from '@/lib/export';

export default function MealsPage() {
  const { success, error } = useToast();
  const [activeDate, setActiveDate] = useState(
    new Date().toISOString().substring(0, 10) // "YYYY-MM-DD"
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );

  const [activeView, setActiveView] = useState<'DAILY_SHEET' | 'MONTHLY_SETTLEMENT'>('DAILY_SHEET');

  const [meals, setMeals] = useState<any[]>([]);
  const [mealSummary, setMealSummary] = useState<any>({});
  const [settlementData, setSettlementData] = useState<any>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit / Add Meal Modal
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const [residents, setResidents] = useState<any[]>([]);
  const [mealForm, setMealForm] = useState({
    residentId: '',
    date: activeDate,
    breakfast: 1,
    lunch: 1,
    dinner: 1,
    guestBreakfast: 0,
    guestLunch: 0,
    guestDinner: 0,
    notes: '',
  });

  const fetchDailyMeals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meals?date=${activeDate}`);
      if (res.ok) {
        const json = await res.json();
        setMeals(json.data || []);
        setMealSummary(json.summary || {});
      }
    } catch (e) {
      console.error(e);
      error('মিলের তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlement = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/meals/settlement?month=${selectedMonth}`);
      if (res.ok) {
        const json = await res.json();
        setSettlementData(json.data);
        setIsLocked(json.isLocked);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await fetch('/api/residents?status=ACTIVE');
      if (res.ok) {
        const json = await res.json();
        setResidents(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeView === 'DAILY_SHEET') {
      fetchDailyMeals();
    } else {
      fetchSettlement();
    }
  }, [activeDate, selectedMonth, activeView]);

  useEffect(() => {
    fetchResidents();
  }, []);

  // Save Meal Entry
  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsMealModalOpen(false);
      fetchDailyMeals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'মিল আপডেট ব্যর্থ হয়েছে';
      error(msg);
    }
  };

  // Lock Monthly Settlement
  const handleLockSettlement = async () => {
    if (!confirm(`${selectedMonth} মাসের হিসাব লক করলে তা আর সাধারণ পরিবর্তন করা যাবে না। আপনি কি নিশ্চিত?`)) {
      return;
    }

    try {
      const res = await fetch('/api/meals/settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      fetchSettlement();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'হিসাব লক সম্পন্ন করা যায়নি';
      error(msg);
    }
  };

  const handleExportSettlement = () => {
    if (!settlementData?.residentBreakdown) return;
    const rows = settlementData.residentBreakdown.map((r: any) => ({
      'বর্ডারের নাম': r.residentName,
      'রুম ও সিট': `${r.roomNumber} - ${r.seatNumber}`,
      'মোট মিল ইউনিট': r.totalUnits,
      'মিল চার্জ (টাকা)': r.mealBillPoisha / 100,
      'জমা দেওয়া অগ্রিম (টাকা)': r.totalDepositPoisha / 100,
      'উদ্বৃত্ত / বকেয়া (টাকা)': r.balancePoisha / 100,
      'স্ট্যাটাস': r.balancePoisha >= 0 ? 'ফেরতযোগ্য' : 'বকেয়া',
    }));
    exportToExcel(`Meal_Settlement_${selectedMonth}`, `${selectedMonth} মিল সেটেলমেন্ট`, rows);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              মেস মিল ব্যবস্থাপনা ও রেট হিসাব
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              প্রতিদিনের মিল তালিকা, নাস্তা-দুপুর-রাত নিয়ন্ত্রণ এবং মাসিক রেট চূড়ান্তকরণ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setMealForm({ ...mealForm, date: activeDate });
                setIsMealModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>মিল এন্ট্রি / পরিবর্তন</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('DAILY_SHEET')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'DAILY_SHEET'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>দৈনিক মিল শিট</span>
            </button>
            <button
              onClick={() => setActiveView('MONTHLY_SETTLEMENT')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeView === 'MONTHLY_SETTLEMENT'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>মাসিক মিল সেটেলমেন্ট ও রেট</span>
            </button>
          </div>

          {activeView === 'DAILY_SHEET' ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">তারিখ:</span>
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">মাস:</span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
              />
            </div>
          )}
        </div>

        {/* 1. DAILY MEAL SHEET VIEW */}
        {activeView === 'DAILY_SHEET' && (
          <div className="space-y-6">
            {/* Today Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">সকালের নাস্তা</span>
                <span className="text-xl font-bold text-blue-900">
                  {toBengaliNumber(mealSummary?.totalBreakfast || 0)} টি
                </span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">দুপুরের খাবার</span>
                <span className="text-xl font-bold text-blue-900">
                  {toBengaliNumber(mealSummary?.totalLunch || 0)} টি
                </span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">রাতের খাবার</span>
                <span className="text-xl font-bold text-blue-900">
                  {toBengaliNumber(mealSummary?.totalDinner || 0)} টি
                </span>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-emerald-100 text-center">
                <span className="text-xs text-emerald-700 font-semibold block mb-1">মোট মিল ইউনিট</span>
                <span className="text-xl font-bold text-emerald-800">
                  {toBengaliNumber(mealSummary?.grandTotalUnits || 0)}
                </span>
              </div>
            </div>

            {/* Daily Meals Table */}
            {loading ? (
              <LoadingSkeleton rows={6} />
            ) : meals.length === 0 ? (
              <EmptyState
                title={`${formatBengaliDate(activeDate)} তারিখে কোনো মিল রেকর্ড নেই`}
                description="নতুন বর্ডারদের জন্য মিল চালু করতে উপরের 'মিল এন্ট্রি / পরিবর্তন' বাটনে ক্লিক করুন।"
                icon={UtensilsCrossed}
                actionText="মিল চালু করুন"
                onAction={() => setIsMealModalOpen(true)}
              />
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">বর্ডারের নাম</th>
                        <th className="p-3.5">রুম ও সিট</th>
                        <th className="p-3.5 text-center">সকাল</th>
                        <th className="p-3.5 text-center">দুপুর</th>
                        <th className="p-3.5 text-center">রাত</th>
                        <th className="p-3.5 text-center">মেহমান মিল</th>
                        <th className="p-3.5 text-center">মোট ইউনিট</th>
                        <th className="p-3.5 text-right">সম্পাদনা</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {meals.map((m) => (
                        <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-800">
                            {m.residentId?.fullName}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {m.residentId?.roomId?.roomNumber || '—'} ({m.residentId?.seatId?.seatNumber || '—'})
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                m.breakfast > 0
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {m.breakfast > 0 ? 'চালু' : 'বন্ধ'}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {toBengaliNumber(m.lunch)}
                          </td>
                          <td className="p-3.5 text-center font-bold text-slate-800">
                            {toBengaliNumber(m.dinner)}
                          </td>
                          <td className="p-3.5 text-center text-slate-500">
                            {m.guestBreakfast + m.guestLunch + m.guestDinner > 0 ? (
                              <span className="text-amber-700 font-bold">
                                {toBengaliNumber(m.guestBreakfast + m.guestLunch + m.guestDinner)} টি
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3.5 text-center font-black text-blue-900 text-sm">
                            {toBengaliNumber(m.totalUnits)}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setMealForm({
                                  residentId: m.residentId?._id,
                                  date: m.date,
                                  breakfast: m.breakfast,
                                  lunch: m.lunch,
                                  dinner: m.dinner,
                                  guestBreakfast: m.guestBreakfast,
                                  guestLunch: m.guestLunch,
                                  guestDinner: m.guestDinner,
                                  notes: m.notes || '',
                                });
                                setIsMealModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              পরিবর্তন
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. MONTHLY MEAL SETTLEMENT & RATE CALCULATION VIEW */}
        {activeView === 'MONTHLY_SETTLEMENT' && (
          <div className="space-y-6">
            {/* Calculation Formula Banner */}
            <div className="p-6 rounded-3xl bg-linear-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-800/80">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                    {isLocked ? 'লকড / চূড়ান্ত হিসাব' : 'চলতি খসড়া হিসাব (Live Draft)'}
                  </span>
                  <h2 className="text-xl font-bold mt-2">
                    {selectedMonth} মাসের মিল রেট নির্ধারণ
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    মোট মেস বাজার ও খরচকে সকল বর্ডারের খাওয়া মোট মিল ইউনিট দিয়ে ভাগ করে রেট নির্ণয় করা হয়।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportSettlement}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>এক্সপোর্ট</span>
                  </button>
                  {!isLocked && (
                    <button
                      onClick={handleLockSettlement}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      <span>হিসাব চূড়ান্ত ও লক করুন</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Settlement Cards Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div>
                  <span className="text-[11px] text-blue-300 font-semibold block">মোট বাজার খরচ:</span>
                  <div className="text-lg font-bold">
                    {formatBengaliCurrency((settlementData?.totalBazarCostPoisha || 0) / 100)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-blue-300 font-semibold block">অতিরিক্ত মেস খরচ:</span>
                  <div className="text-lg font-bold">
                    {formatBengaliCurrency((settlementData?.extraMessExpensesPoisha || 0) / 100)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-blue-300 font-semibold block">মোট মিল ইউনিট:</span>
                  <div className="text-lg font-bold text-amber-300">
                    {toBengaliNumber(settlementData?.totalMealUnits || 0)}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-300 font-bold block">নির্ধারিত মিল রেট:</span>
                  <div className="text-2xl font-black text-emerald-400">
                    {formatBengaliCurrency((settlementData?.calculatedMealRatePoisha || 0) / 100)}
                    <span className="text-xs font-normal text-white"> /ইউনিট</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resident Wise Settlement Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">
                  বর্ডারভিত্তিক মিল চার্জ ও জমার চূড়ান্ত বিবরণী
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">বর্ডারের নাম</th>
                      <th className="p-3.5">রুম ও সিট</th>
                      <th className="p-3.5 text-center">খাওয়া মিল ইউনিট</th>
                      <th className="p-3.5 text-right">মোট মিল বিল</th>
                      <th className="p-3.5 text-right">অগ্রিম জমা</th>
                      <th className="p-3.5 text-right">উদ্বৃত্ত / বকেয়া</th>
                      <th className="p-3.5 text-center">অবস্থা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {settlementData?.residentBreakdown?.map((res: any) => {
                      const isSurplus = res.balancePoisha >= 0;
                      return (
                        <tr key={res.residentId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-800">{res.residentName}</td>
                          <td className="p-3.5 text-slate-600">
                            রুম {res.roomNumber} ({res.seatNumber})
                          </td>
                          <td className="p-3.5 text-center font-bold text-blue-900">
                            {toBengaliNumber(res.totalUnits)}
                          </td>
                          <td className="p-3.5 text-right font-semibold text-slate-800">
                            {formatBengaliCurrency(res.mealBillPoisha / 100)}
                          </td>
                          <td className="p-3.5 text-right font-semibold text-emerald-700">
                            {formatBengaliCurrency(res.totalDepositPoisha / 100)}
                          </td>
                          <td
                            className={`p-3.5 text-right font-bold text-sm ${
                              isSurplus ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {formatBengaliCurrency(Math.abs(res.balancePoisha) / 100)}
                          </td>
                          <td className="p-3.5 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSurplus
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isSurplus ? 'উদ্বৃত্ত (ফেরত)' : 'বকেয়া দিতে হবে'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add or Edit Meal */}
        <Modal
          isOpen={isMealModalOpen}
          onClose={() => setIsMealModalOpen(false)}
          title="বর্ডার মিল এন্ট্রি ও পরিবর্তন"
          subtitle="নাস্তা, দুপুর ও রাতের খাবারের সংখ্যা নির্ধারণ করুন"
        >
          <form onSubmit={handleSaveMeal} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বর্ডার নির্বাচন করুন *
              </label>
              <select
                required
                value={mealForm.residentId}
                onChange={(e) => setMealForm({ ...mealForm, residentId: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">বর্ডার বেছে নিন...</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName} ({r.residentId}) - রুম: {r.roomId?.roomNumber || '—'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                তারিখ নির্বাচন করুন *
              </label>
              <input
                type="date"
                required
                value={mealForm.date}
                onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            {/* Regular Meals */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                নিয়মিত খাবার (সংখ্যা):
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    সকালের নাস্তা
                  </label>
                  <select
                    value={mealForm.breakfast}
                    onChange={(e) => setMealForm({ ...mealForm, breakfast: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value={1}>১টি (চালু)</option>
                    <option value={0}>০ (বন্ধ)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    দুপুরের খাবার
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={mealForm.lunch}
                    onChange={(e) => setMealForm({ ...mealForm, lunch: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    রাতের খাবার
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={mealForm.dinner}
                    onChange={(e) => setMealForm({ ...mealForm, dinner: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Guest Meals */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                মেহমান মিল (যদি থাকে):
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    মেহমান নাস্তা
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealForm.guestBreakfast}
                    onChange={(e) => setMealForm({ ...mealForm, guestBreakfast: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    মেহমান দুপুর
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealForm.guestLunch}
                    onChange={(e) => setMealForm({ ...mealForm, guestLunch: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                    মেহমান রাত
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={mealForm.guestDinner}
                    onChange={(e) => setMealForm({ ...mealForm, guestDinner: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsMealModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                মিল সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
