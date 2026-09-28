'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  UtensilsCrossed,
  Receipt,
  Save,
  Clock,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';

export default function SettingsPage() {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    hostelName: '',
    hostelNameEn: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    activeMode: 'COMBINED',
    rentDueDay: 5,
    lateFeeTaka: 100,
    mealCutoffBreakfast: '22:00',
    mealCutoffLunch: '09:00',
    mealCutoffDinner: '16:00',
    mealWeights: {
      breakfast: 0.5,
      lunch: 1.0,
      dinner: 1.0,
    },
    rulesAndPolicies: '',
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        const d = json.data;
        if (d) {
          setForm({
            hostelName: d.hostelName || '',
            hostelNameEn: d.hostelNameEn || '',
            tagline: d.tagline || '',
            address: d.address || '',
            phone: d.phone || '',
            email: d.email || '',
            activeMode: d.activeMode || 'COMBINED',
            rentDueDay: d.rentDueDay || 5,
            lateFeeTaka: (d.lateFeePoisha || 10000) / 100,
            mealCutoffBreakfast: d.mealCutoffBreakfast || '22:00',
            mealCutoffLunch: d.mealCutoffLunch || '09:00',
            mealCutoffDinner: d.mealCutoffDinner || '16:00',
            mealWeights: d.mealWeights || { breakfast: 0.5, lunch: 1.0, dinner: 1.0 },
            rulesAndPolicies: d.rulesAndPolicies || '',
          });
        }
      }
    } catch (e) {
      console.error(e);
      error('সেটিংস লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সেটিংস আপডেট ব্যর্থ হয়েছে';
      error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            হোস্টেল ও সিস্টেম সেটিংস
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            হোস্টেলের ব্র্যান্ডিং, অপারেশনাল মোড, মিল কাটঅফ ও ভাড়া নীতি পরিবর্তন
          </p>
        </div>

        {loading ? (
          <LoadingSkeleton rows={8} />
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. Operational Mode Switcher */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                <span>১. অ্যাপ্লিকেশন অপারেটিং মোড নির্বাচন</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                হোস্টেল নাকি মেস নাকি যৌথ - আপনার প্রতিষ্ঠানের ধরন অনুযায়ী মোড নির্বাচন করুন। সাইডবার ও মডিউল স্বয়ংক্রিয়ভাবে খাপ খেয়ে যাবে।
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: 'COMBINED',
                    title: 'হোস্টেল ও মেস যৌথ মোড',
                    desc: 'রুম ভাড়া + মেসের তিন বেলা খাবার ও বাজার হিসাব একসাথে',
                  },
                  {
                    value: 'HOSTEL_ONLY',
                    title: 'শুধুমাত্র হোস্টেল মোড',
                    desc: 'রুম ও সিট বরাদ্দ, মাসিক ভাড়া আদায় ও কর্মচারী পরিচালনা',
                  },
                  {
                    value: 'MESS_ONLY',
                    title: 'শুধুমাত্র ব্যাচেলর মেস মোড',
                    desc: 'দৈনিক মিল ক্যালেন্ডার, বাজার হিসাব ও মিল রেট বণ্টন',
                  },
                ].map((m) => (
                  <label
                    key={m.value}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      form.activeMode === m.value
                        ? 'border-blue-900 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-sm text-slate-900">{m.title}</span>
                        <input
                          type="radio"
                          name="activeMode"
                          value={m.value}
                          checked={form.activeMode === m.value}
                          onChange={(e) => setForm({ ...form, activeMode: e.target.value as any })}
                          className="text-blue-900"
                        />
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 2. Hostel Branding & Contacts */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <span>২. প্রতিষ্ঠান ব্র্যান্ডিং ও যোগাযোগের ঠিকানা</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    হোস্টেল বা মেসের নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.hostelName}
                    onChange={(e) => setForm({ ...form, hostelName: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ইংরেজি নাম (Hostel Name in English)
                  </label>
                  <input
                    type="text"
                    value={form.hostelNameEn}
                    onChange={(e) => setForm({ ...form, hostelNameEn: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ট্যাগলাইন / স্লোগান
                  </label>
                  <input
                    type="text"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    অফিসিয়াল মোবাইল নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    অফিসিয়াল ইমেইল *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ঠিকানা *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. Billing & Invoicing Rules */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span>৩. ভাড়া ও ইনভয়েস বিলিং নীতি</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    মাসের কত তারিখের মধ্যে ভাড়া পরিশোধ বাধ্যতামূলক? *
                  </label>
                  <select
                    value={form.rentDueDay}
                    onChange={(e) => setForm({ ...form, rentDueDay: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20].map((d) => (
                      <option key={d} value={d}>
                        প্রতি মাসের {d} তারিখের মধ্যে
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    বিলম্ব ফি বা জরিমানা (টাকা)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.lateFeeTaka}
                    onChange={(e) => setForm({ ...form, lateFeeTaka: Number(e.target.value) })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 4. Mess & Meal Policy */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span>৪. মেস মিল কাটঅফ সময় ও মিল ওয়েট (ইউনিট)</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সকালের নাস্তা কাটঅফ সময়
                  </label>
                  <input
                    type="time"
                    value={form.mealCutoffBreakfast}
                    onChange={(e) => setForm({ ...form, mealCutoffBreakfast: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">পূর্বের রাত ১০:০০ টা (স্ট্যান্ডার্ড)</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    দুপুরের খাবার কাটঅফ সময়
                  </label>
                  <input
                    type="time"
                    value={form.mealCutoffLunch}
                    onChange={(e) => setForm({ ...form, mealCutoffLunch: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">একই দিন সকাল ৯:০০ টা</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    রাতের খাবার কাটঅফ সময়
                  </label>
                  <input
                    type="time"
                    value={form.mealCutoffDinner}
                    onChange={(e) => setForm({ ...form, mealCutoffDinner: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">একই দিন বিকাল ৪:০০ টা</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সকালের নাস্তা মিল ওজন (Weight)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.mealWeights.breakfast}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mealWeights: { ...form.mealWeights, breakfast: Number(e.target.value) },
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">সাধারণত ০.৫ ইউনিট</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    দুপুরের খাবার মিল ওজন
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.mealWeights.lunch}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mealWeights: { ...form.mealWeights, lunch: Number(e.target.value) },
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">সাধারণত ১.০ ইউনিট</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    রাতের খাবার মিল ওজন
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={form.mealWeights.dinner}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mealWeights: { ...form.mealWeights, dinner: Number(e.target.value) },
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">সাধারণত ১.০ ইউনিট</span>
                </div>
              </div>
            </div>

            {/* 5. Rules and Policies */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>৫. হোস্টেলের শৃঙ্খলা ও সাধারণ নিয়মাবলী</span>
              </h2>
              <textarea
                rows={4}
                value={form.rulesAndPolicies}
                onChange={(e) => setForm({ ...form, rulesAndPolicies: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-2xl shadow-md transition-all duration-150 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'সংরক্ষণ করা হচ্ছে...' : 'সকল সেটিংস সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
