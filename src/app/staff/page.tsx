'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  PlusCircle,
  CreditCard,
  Phone,
  Shield,
  Clock,
  DollarSign,
  Download,
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

export default function StaffPage() {
  const { success, error } = useToast();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'STAFF' | 'SALARIES'>('STAFF');

  // Modals
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);

  // Forms
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    phone: '',
    role: 'COOK',
    nid: '',
    monthlySalaryTaka: 15000,
    emergencyContact: '',
    responsibilities: '',
  });

  const [salaryForm, setSalaryForm] = useState({
    staffId: '',
    salaryMonth: new Date().toISOString().substring(0, 7),
    bonusTaka: 0,
    deductionsTaka: 0,
    paymentMethod: 'CASH',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, salRes] = await Promise.all([
        fetch('/api/staff'),
        fetch('/api/staff/salaries'),
      ]);

      if (sRes.ok) {
        const json = await sRes.json();
        setStaffList(json.data || []);
      }
      if (salRes.ok) {
        const json = await salRes.json();
        setSalaries(json.data || []);
      }
    } catch (e) {
      console.error(e);
      error('স্টাফ তথ্য লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsStaffModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'স্টাফ যুক্ত করা যায়নি';
      error(msg);
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salaryForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsSalaryModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'বেতন প্রদান করা যায়নি';
      error(msg);
    }
  };

  const STAFF_ROLES: Record<string, string> = {
    HOSTEL_MANAGER: 'হোস্টেল ম্যানেজার',
    ACCOUNTANT: 'হিসাবরক্ষক',
    MEAL_MANAGER: 'মিল ম্যানেজার',
    COOK: 'বাবুর্চি / শেফ',
    CLEANER: 'পরিচ্ছন্নতাকর্মী',
    SECURITY_GUARD: 'নিরাপত্তা প্রহরী',
    MAINTENANCE_STAFF: 'রক্ষণাবেক্ষণ কর্মী',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              স্টাফ ও বেতন ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              কর্মচারীদের তথ্য, দায়িত্ব, মাসিক বেতন নির্ধারণ ও পরিশোধ রেকর্ড
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন স্টাফ নিয়োগ</span>
            </button>
            <button
              onClick={() => setIsSalaryModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>বেতন প্রদান করুন</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab('STAFF')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STAFF' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>স্টাফ তালিকা</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-800 text-white">
              {toBengaliNumber(staffList.length)}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('SALARIES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SALARIES' ? 'bg-blue-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>বেতন পরিশোধ ইতিহাস</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {toBengaliNumber(salaries.length)}
            </span>
          </button>
        </div>

        {/* 1. Staff List Grid */}
        {activeTab === 'STAFF' && (
          loading ? (
            <LoadingSkeleton rows={4} />
          ) : staffList.length === 0 ? (
            <EmptyState
              title="কোনো স্টাফ পাওয়া যায়নি"
              description="এখনো কোনো কর্মচারী নিবন্ধন করা হয়নি। নতুন স্টাফ নিয়োগ বোতামে ক্লিক করুন।"
              icon={UserCheck}
              actionText="নতুন স্টাফ যোগ করুন"
              onAction={() => setIsStaffModalOpen(true)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {staffList.map((s) => (
                <div
                  key={s._id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{s.fullName}</h3>
                        <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {STAFF_ROLES[s.role] || s.role}
                        </span>
                      </div>
                      <span className="text-xs font-black text-slate-900">
                        {formatBengaliCurrency(s.monthlySalaryPoisha / 100)}
                        <span className="text-[10px] font-normal text-slate-400 block text-right">/মাস</span>
                      </span>
                    </div>

                    <div className="py-3 space-y-1.5 text-xs text-slate-600">
                      <p><span className="text-slate-400">স্টাফ আইডি:</span> <span className="font-bold text-slate-800">{s.staffId}</span></p>
                      <p><span className="text-slate-400">মোবাইল:</span> {toBengaliNumber(s.phone)}</p>
                      <p><span className="text-slate-400">এনআইডি:</span> {toBengaliNumber(s.nid)}</p>
                      {s.responsibilities && (
                        <p><span className="text-slate-400">দায়িত্ব:</span> {s.responsibilities}</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-semibold">
                    <span>যোগদান: {formatBengaliDate(s.joiningDate)}</span>
                    <button
                      onClick={() => {
                        setSalaryForm({ ...salaryForm, staffId: s._id });
                        setIsSalaryModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      বেতন দিন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 2. Salary Payments List */}
        {activeTab === 'SALARIES' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">ভাউচার নং</th>
                    <th className="p-3.5">স্টাফের নাম</th>
                    <th className="p-3.5">পদবী</th>
                    <th className="p-3.5">মাস</th>
                    <th className="p-3.5">মূল বেতন</th>
                    <th className="p-3.5">বোনাস/কর্তন</th>
                    <th className="p-3.5">পরিশোধিত টাকা</th>
                    <th className="p-3.5">তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {salaries.map((sal) => (
                    <tr key={sal._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-blue-900">{sal.voucherNumber}</td>
                      <td className="p-3.5 font-bold text-slate-800">{sal.staffId?.fullName}</td>
                      <td className="p-3.5 text-slate-600">{STAFF_ROLES[sal.staffId?.role] || '—'}</td>
                      <td className="p-3.5 font-semibold text-slate-700">{sal.salaryMonth}</td>
                      <td className="p-3.5">{formatBengaliCurrency(sal.baseSalaryPoisha / 100)}</td>
                      <td className="p-3.5 text-slate-500">
                        +{formatBengaliCurrency(sal.bonusPoisha / 100)} / -{formatBengaliCurrency(sal.deductionsPoisha / 100)}
                      </td>
                      <td className="p-3.5 font-black text-emerald-800 text-sm">
                        {formatBengaliCurrency(sal.paidAmountPoisha / 100)}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatBengaliDate(sal.paymentDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Add Staff */}
        <Modal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          title="নতুন স্টাফ নিবন্ধন ফরম"
          subtitle="হোস্টেল কর্মচারীর ব্যক্তিগত বিবরণ ও মাসিক বেতন নির্ধারণ"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                স্টাফের পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: মো: আলাউদ্দিন"
                value={staffForm.fullName}
                onChange={(e) => setStaffForm({ ...staffForm, fullName: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  মোবাইল নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="০১৭xxxxxxxx"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পদবী / ভূমিকা *
                </label>
                <select
                  value={staffForm.role}
                  onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="COOK">বাবুর্চি / শেফ (Cook)</option>
                  <option value="HOSTEL_MANAGER">হোস্টেল ম্যানেজার</option>
                  <option value="ACCOUNTANT">হিসাবরক্ষক (Accountant)</option>
                  <option value="CLEANER">পরিচ্ছন্নতাকর্মী (Cleaner)</option>
                  <option value="SECURITY_GUARD">নিরাপত্তা প্রহরী (Security)</option>
                  <option value="MAINTENANCE_STAFF">রক্ষণাবেক্ষণ কর্মী</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  এনআইডি নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="NID নম্বর"
                  value={staffForm.nid}
                  onChange={(e) => setStaffForm({ ...staffForm, nid: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নির্ধারিত মাসিক বেতন (টাকা) *
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={staffForm.monthlySalaryTaka}
                  onChange={(e) => setStaffForm({ ...staffForm, monthlySalaryTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                দায়িত্বের সংক্ষিপ্ত বিবরণ
              </label>
              <input
                type="text"
                placeholder="যেমন: তিন বেলা রান্না ও কিচেনের পরিচ্ছন্নতা"
                value={staffForm.responsibilities}
                onChange={(e) => setStaffForm({ ...staffForm, responsibilities: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                স্টাফ সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Pay Salary */}
        <Modal
          isOpen={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          title="স্টাফ বেতন পরিশোধ ভাউচার"
          subtitle="বেতন পরিশোধ করলে স্বয়ংক্রিয়ভাবে মোট খরচ লেজারে অন্তর্ভুক্ত হবে"
        >
          <form onSubmit={handlePaySalary} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                স্টাফ নির্বাচন করুন *
              </label>
              <select
                required
                value={salaryForm.staffId}
                onChange={(e) => setSalaryForm({ ...salaryForm, staffId: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">স্টাফ বেছে নিন...</option>
                {staffList.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.fullName} ({STAFF_ROLES[s.role] || s.role}) - মূল বেতন: ৳ {s.monthlySalaryPoisha / 100}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বেতনের মাস *
                </label>
                <input
                  type="month"
                  required
                  value={salaryForm.salaryMonth}
                  onChange={(e) => setSalaryForm({ ...salaryForm, salaryMonth: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পেমেন্ট মাধ্যম *
                </label>
                <select
                  value={salaryForm.paymentMethod}
                  onChange={(e) => setSalaryForm({ ...salaryForm, paymentMethod: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CASH">নগদ ক্যাশ</option>
                  <option value="BANK_TRANSFER">ব্যাংক ট্রান্সফার</option>
                  <option value="BKASH">বিকাশ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বোনাস / বকশিশ (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryForm.bonusTaka}
                  onChange={(e) => setSalaryForm({ ...salaryForm, bonusTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  অনুপস্থিতি বা ঋণ কর্তন (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={salaryForm.deductionsTaka}
                  onChange={(e) => setSalaryForm({ ...salaryForm, deductionsTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsSalaryModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                বেতন পরিশোধ ও ভাউচার তৈরি করুন
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
