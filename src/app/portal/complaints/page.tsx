'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { AlertTriangle, PlusCircle, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import {
  formatBengaliDate,
  formatBengaliTime,
  toBengaliNumber,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_PRIORITY_LABELS,
} from '@/lib/bengali';

export default function ResidentPortalComplaintsPage() {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    category: 'ROOM_MAINTENANCE',
    title: '',
    description: '',
    priority: 'MEDIUM',
  });

  const fetchMyComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const json = await res.json();
        setComplaints(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setForm({
        category: 'ROOM_MAINTENANCE',
        title: '',
        description: '',
        priority: 'MEDIUM',
      });
      fetchMyComplaints();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অভিযোগ জমা হয়নি';
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
            অভিযোগ ও সহায়তা কেন্দ্র
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            রুমের ফার্নিচার, পানি, বিদ্যুৎ, পরিচ্ছন্নতা বা খাবার সংক্রান্ত সমস্যা জানান
          </p>
        </div>

        {/* Submit Complaint Box */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-900" />
            <span>নতুন অভিযোগ দাখিল ফরম</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সমস্যার ধরন (ক্যাটাগরি) *
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ROOM_MAINTENANCE">রুম মেরামত ও ফার্নিচার</option>
                  <option value="WATER_SUPPLY">পানি সরবরাহ ও ওয়াশরুম</option>
                  <option value="ELECTRICITY_INTERNET">বিদ্যুৎ ও ইন্টারনেট</option>
                  <option value="CLEANING_WASHROOM">পরিচ্ছন্নতা</option>
                  <option value="FOOD_QUALITY">খাবারের মান ও মেস</option>
                  <option value="SECURITY_DISCIPLINE">নিরাপত্তা ও শৃঙ্খলা</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  জরুরিতা (Priority) *
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="LOW">সাধারণ (Low)</option>
                  <option value="MEDIUM">মাঝারি (Medium)</option>
                  <option value="HIGH">জরুরি (High)</option>
                  <option value="URGENT">অতি জরুরি (Urgent)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                অভিযোগের শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ১০১ নম্বর রুমের ফ্যান কাজ করছে না"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বিস্তারিত বিবরণ *
              </label>
              <textarea
                required
                rows={3}
                placeholder="সমস্যাটির বিস্তারিত ব্যাখ্যা লিখুন..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : 'অভিযোগ দাখিল করুন'}
              </button>
            </div>
          </form>
        </div>

        {/* Complaints List */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">আমার অভিযোগের তালিকা</h3>
          {loading ? (
            <LoadingSkeleton rows={3} />
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
              আপনার কোনো সক্রিয় অভিযোগ নেই
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {complaints.map((c) => {
                const statusCfg =
                  COMPLAINT_STATUS_LABELS[c.status as keyof typeof COMPLAINT_STATUS_LABELS] ||
                  COMPLAINT_STATUS_LABELS.SUBMITTED;

                return (
                  <div key={c._id} className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900">{c.ticketNumber}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">{formatBengaliDate(c.createdAt)}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 mt-2">{c.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{c.description}</p>

                    {c.resolutionNotes && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                        <strong>কর্তৃপক্ষের সমাধান নোট:</strong> {c.resolutionNotes}
                      </div>
                    )}
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
