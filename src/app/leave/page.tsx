'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  PlusCircle,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  User,
  Shield,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatBengaliDate,
  formatBengaliTime,
  toBengaliNumber,
  LEAVE_STATUS_LABELS,
} from '@/lib/bengali';

export default function LeaveAndVisitorPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'LEAVE' | 'VISITORS'>('LEAVE');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isVisitorModalOpen, setIsVisitorModalOpen] = useState(false);

  // Forms
  const [leaveForm, setLeaveForm] = useState({
    residentId: '',
    departureDate: '',
    expectedReturnDate: '',
    reason: '',
    destinationAddress: '',
    emergencyPhone: '',
  });

  const [visitorForm, setVisitorForm] = useState({
    visitorName: '',
    visitorPhone: '',
    residentId: '',
    relationWithResident: 'আত্মীয়',
    purpose: '',
    nidOrIdNumber: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lRes, vRes, rRes] = await Promise.all([
        fetch('/api/leave'),
        fetch('/api/visitors'),
        fetch('/api/residents?status=ACTIVE'),
      ]);

      if (lRes.ok) {
        const json = await lRes.json();
        setLeaves(json.data || []);
      }
      if (vRes.ok) {
        const json = await vRes.json();
        setVisitors(json.data || []);
      }
      if (rRes.ok) {
        const json = await rRes.json();
        setResidents(json.data || []);
      }
    } catch (e) {
      console.error(e);
      error('তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leaveForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsLeaveModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ছুটির আবেদন জমা হয়নি';
      error(msg);
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: string) => {
    try {
      const res = await fetch('/api/leave', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId, status }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'স্ট্যাটাস পরিবর্তন করা যায়নি';
      error(msg);
    }
  };

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitorForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsVisitorModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ভিজিটর এন্ট্রি ব্যর্থ হয়েছে';
      error(msg);
    }
  };

  const handleVisitorExit = async (visitorId: string) => {
    try {
      const res = await fetch('/api/visitors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'প্রস্থান রেকর্ড করা সম্ভব হয়নি';
      error(msg);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ছুটি ও অতিথি (ভিজিটর) ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              বর্ডারদের ছুটির অনুমোদন ও হোস্টেল প্রবেশ-প্রস্থান রেজিস্টার
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'LEAVE' ? (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন ছুটির আবেদন</span>
              </button>
            ) : (
              <button
                onClick={() => setIsVisitorModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন অতিথি এন্ট্রি</span>
              </button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('LEAVE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEAVE' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>ছুটির আবেদনসমূহ</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-800 text-white">
              {toBengaliNumber(leaves.length)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('VISITORS')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'VISITORS' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ভিজিটর ও অতিথি খাতা</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {toBengaliNumber(visitors.length)}
            </span>
          </button>
        </div>

        {/* 1. Leave Requests Table */}
        {activeTab === 'LEAVE' && (
          loading ? (
            <LoadingSkeleton rows={5} />
          ) : leaves.length === 0 ? (
            <EmptyState
              title="কোনো ছুটির আবেদন নেই"
              description="বর্তমানে কোনো বর্ডার ছুটির আবেদন করেননি।"
              icon={CalendarCheck}
              actionText="ছুটির আবেদন করুন"
              onAction={() => setIsLeaveModalOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">বর্ডারের নাম</th>
                      <th className="p-3.5">রুম ও সিট</th>
                      <th className="p-3.5">প্রস্থানের তারিখ</th>
                      <th className="p-3.5">প্রত্যাশিত ফেরা</th>
                      <th className="p-3.5">ছুটির কারণ ও গন্তব্য</th>
                      <th className="p-3.5">জরুরি মোবাইল</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {leaves.map((l) => {
                      const statusConfig =
                        LEAVE_STATUS_LABELS[l.status as keyof typeof LEAVE_STATUS_LABELS] ||
                        LEAVE_STATUS_LABELS.PENDING;

                      return (
                        <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-800">{l.residentId?.fullName}</td>
                          <td className="p-3.5 text-slate-600">
                            {l.residentId?.roomId?.roomNumber || '—'} ({l.residentId?.seatId?.seatNumber || '—'})
                          </td>
                          <td className="p-3.5 text-slate-700">{formatBengaliDate(l.departureDate)}</td>
                          <td className="p-3.5 text-slate-700">{formatBengaliDate(l.expectedReturnDate)}</td>
                          <td className="p-3.5 max-w-xs">
                            <span className="font-semibold text-slate-800 block">{l.reason}</span>
                            <span className="text-[10px] text-slate-400">{l.destinationAddress}</span>
                          </td>
                          <td className="p-3.5 text-slate-600">{toBengaliNumber(l.emergencyPhone)}</td>
                          <td className="p-3.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1">
                            {l.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleUpdateLeaveStatus(l._id, 'APPROVED')}
                                  className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold"
                                >
                                  অনুমোদন
                                </button>
                                <button
                                  onClick={() => handleUpdateLeaveStatus(l._id, 'REJECTED')}
                                  className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold"
                                >
                                  বাতিল
                                </button>
                              </>
                            )}
                            {l.status === 'APPROVED' && (
                              <button
                                onClick={() => handleUpdateLeaveStatus(l._id, 'COMPLETED')}
                                className="px-2 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
                              >
                                ফিরে এসেছেন
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* 2. Security Visitor Log Table */}
        {activeTab === 'VISITORS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">অতিথির নাম</th>
                    <th className="p-3.5">মোবাইল নম্বর</th>
                    <th className="p-3.5">সাক্ষাৎকৃত বর্ডার</th>
                    <th className="p-3.5">সম্পর্ক ও উদ্দেশ্য</th>
                    <th className="p-3.5">প্রবেশের সময়</th>
                    <th className="p-3.5">প্রস্থানের সময়</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {visitors.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">{v.visitorName}</td>
                      <td className="p-3.5 text-slate-600">{toBengaliNumber(v.visitorPhone)}</td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {v.residentId?.fullName} (রুম {v.residentId?.roomId?.roomNumber || '—'})
                      </td>
                      <td className="p-3.5">
                        <span className="font-semibold text-slate-800">{v.purpose}</span>
                        <span className="text-[10px] text-slate-400 block">সম্পর্ক: {v.relationWithResident}</span>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {formatBengaliDate(v.entryTime, 'short')} - {formatBengaliTime(v.entryTime)}
                      </td>
                      <td className="p-3.5">
                        {v.exitTime ? (
                          <span className="text-slate-600">{formatBengaliTime(v.exitTime)}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                            ভেতরে আছেন
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!v.exitTime && (
                          <button
                            onClick={() => handleVisitorExit(v._id)}
                            className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                            প্রস্থান রেকর্ড
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: New Leave Request */}
        <Modal
          isOpen={isLeaveModalOpen}
          onClose={() => setIsLeaveModalOpen(false)}
          title="নতুন ছুটির আবেদন"
          subtitle="হোস্টেল ত্যাগের তারিখ, প্রত্যাশিত ফেরা ও জরুরি যোগাযোগ"
        >
          <form onSubmit={handleCreateLeave} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বর্ডার নির্বাচন করুন *
              </label>
              <select
                required
                value={leaveForm.residentId}
                onChange={(e) => setLeaveForm({ ...leaveForm, residentId: e.target.value })}
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রস্থানের তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.departureDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, departureDate: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রত্যাশিত ফেরার তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={leaveForm.expectedReturnDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, expectedReturnDate: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ছুটির কারণ *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: সেমিস্টার ফাইনাল ছুটি / অসুস্থতা"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ছুটিকালীন গন্তব্যের ঠিকানা *
              </label>
              <input
                type="text"
                required
                placeholder="গ্রাম, থানা, জেলা"
                value={leaveForm.destinationAddress}
                onChange={(e) => setLeaveForm({ ...leaveForm, destinationAddress: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
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
                value={leaveForm.emergencyPhone}
                onChange={(e) => setLeaveForm({ ...leaveForm, emergencyPhone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                আবেদন জমা দিন
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: New Visitor Entry */}
        <Modal
          isOpen={isVisitorModalOpen}
          onClose={() => setIsVisitorModalOpen(false)}
          title="নতুন অতিথি (ভিজিটর) এন্ট্রি"
          subtitle="হোস্টেলে আগত অতিথির তথ্য ও নিরাপত্তা রেজিস্টার"
        >
          <form onSubmit={handleCreateVisitor} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  অতিথির নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="অতিথির নাম"
                  value={visitorForm.visitorName}
                  onChange={(e) => setVisitorForm({ ...visitorForm, visitorName: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="০১৭xxxxxxxx"
                  value={visitorForm.visitorPhone}
                  onChange={(e) => setVisitorForm({ ...visitorForm, visitorPhone: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  কোন বর্ডারের কাছে এসেছেন? *
                </label>
                <select
                  required
                  value={visitorForm.residentId}
                  onChange={(e) => setVisitorForm({ ...visitorForm, residentId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">বর্ডার নির্বাচন করুন...</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName} ({r.roomId?.roomNumber || 'রুম'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সম্পর্ক
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পিতা / ভাই / বন্ধু"
                  value={visitorForm.relationWithResident}
                  onChange={(e) => setVisitorForm({ ...visitorForm, relationWithResident: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                সাক্ষাতের উদ্দেশ্য *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: বই দিতে এসেছেন / ব্যক্তিগত সাক্ষাৎ"
                value={visitorForm.purpose}
                onChange={(e) => setVisitorForm({ ...visitorForm, purpose: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsVisitorModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                এন্ট্রি সম্পন্ন করুন
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
