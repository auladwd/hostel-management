'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Printer,
  CreditCard,
  Phone,
  Building2,
  Calendar,
  UserCheck,
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

export default function ResidentsPage() {
  const { success, error } = useToast();
  const [residents, setResidents] = useState<any[]>([]);
  const [availableSeats, setAvailableSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  // Admission Modal State
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Admission Form Fields
  const [form, setForm] = useState({
    fullName: '',
    fullNameEn: '',
    phone: '',
    email: '',
    nidOrBirthCert: '',
    documentType: 'NID',
    dateOfBirth: '',
    bloodGroup: '',
    gender: 'MALE',
    presentAddress: '',
    permanentAddress: '',
    guardianName: '',
    guardianRelation: 'পিতা',
    guardianPhone: '',
    guardianAddress: '',
    emergencyContactName: '',
    emergencyContactRelation: 'পিতা',
    emergencyContactPhone: '',
    institutionOrWorkplace: '',
    designationOrDepartment: '',
    idCardNumber: '',
    seatId: '',
    monthlyRentTaka: 3500,
    securityDepositTaka: 3000,
    admissionFeeTaka: 500,
    paymentMethod: 'CASH',
    transactionId: '',
  });

  const fetchResidents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (search) queryParams.append('search', search);

      const res = await fetch(`/api/residents?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setResidents(json.data || []);
      }
    } catch (e) {
      console.error(e);
      error('বর্ডার তালিকা লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeats = async () => {
    try {
      const res = await fetch('/api/seats?status=AVAILABLE');
      if (res.ok) {
        const json = await res.json();
        setAvailableSeats(json.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [statusFilter]);

  useEffect(() => {
    fetchSeats();
  }, [isAdmissionModalOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResidents();
  };

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsAdmissionModalOpen(false);
      fetchResidents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ভর্তি প্রক্রিয়া সম্পন্ন করা যায়নি';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              বর্ডার ও শিক্ষার্থী ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              নতুন ভর্তি, প্রোফাইল তথ্য, সিট বরাদ্দ ও পরিচয়পত্র
            </p>
          </div>
          <button
            onClick={() => setIsAdmissionModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন বর্ডার ভর্তি ফরম</span>
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="নাম, ফোন, আইডি বা এনআইডি..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-blue-900"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
            {[
              { label: 'সকল', value: 'ALL' },
              { label: 'সক্রিয় বর্ডার', value: 'ACTIVE' },
              { label: 'ছুটিতে আছেন', value: 'ON_LEAVE' },
              { label: 'প্রাক্তন (চেক-আউট)', value: 'CHECKED_OUT' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === tab.value
                    ? 'bg-blue-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resident Data Table */}
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : residents.length === 0 ? (
          <EmptyState
            title="কোনো বর্ডার পাওয়া যায়নি"
            description="অনুসন্ধানের শর্ত অনুযায়ী কোনো বর্ডার রেকর্ড খুঁজে পাওয়া যায়নি।"
            icon={Users}
            actionText="নতুন বর্ডার ভর্তি করুন"
            onAction={() => setIsAdmissionModalOpen(true)}
          />
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">আইডি</th>
                    <th className="p-3.5">বর্ডারের নাম</th>
                    <th className="p-3.5">রুম ও সিট</th>
                    <th className="p-3.5">মোবাইল</th>
                    <th className="p-3.5">প্রতিষ্ঠান / কর্মক্ষেত্র</th>
                    <th className="p-3.5">মাসিক ভাড়া</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {residents.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-blue-900">{r.residentId}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-800">{r.fullName}</div>
                        {r.fullNameEn && <div className="text-[10px] text-slate-400">{r.fullNameEn}</div>}
                      </td>
                      <td className="p-3.5">
                        {r.roomId ? (
                          <span className="font-semibold text-slate-700">
                            রুম {r.roomId.roomNumber} ({r.seatId?.seatNumber})
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold">সিট বরাদ্দ নেই</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">{toBengaliNumber(r.phone)}</td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        {r.institutionOrWorkplace}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        {formatBengaliCurrency(r.monthlyRentPoisha / 100)}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : r.status === 'ON_LEAVE'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {r.status === 'ACTIVE' ? 'সক্রিয়' : r.status === 'ON_LEAVE' ? 'ছুটিতে' : 'প্রাক্তন'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/residents/${r._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>প্রোফাইল</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Full Admission Form */}
        <Modal
          isOpen={isAdmissionModalOpen}
          onClose={() => setIsAdmissionModalOpen(false)}
          title="নতুন বর্ডার ভর্তি ফরম"
          subtitle="বর্ডারের ব্যক্তিগত, অভিভাবক ও সিট বরাদ্দের তথ্য পূরণ করুন"
          maxWidth="4xl"
        >
          <form onSubmit={handleAdmissionSubmit} className="space-y-6">
            {/* 1. Personal Information */}
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">
                ১. ব্যক্তিগত তথ্য
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    বর্ডারের পূর্ণ নাম (বাংলায়) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: তানভীর আহমেদ"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ইংরেজি নাম (Full Name)
                  </label>
                  <input
                    type="text"
                    placeholder="Tanvir Ahmed"
                    value={form.fullNameEn}
                    onChange={(e) => setForm({ ...form, fullNameEn: e.target.value })}
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
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    জাতীয় পরিচয়পত্র / জন্মনিবন্ধন নং *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="NID / জন্মসনদ নম্বর"
                    value={form.nidOrBirthCert}
                    onChange={(e) => setForm({ ...form, nidOrBirthCert: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    রক্তের গ্রুপ
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">নির্বাচন করুন</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    শিক্ষা প্রতিষ্ঠান / কর্মক্ষেত্র *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="বিশ্ববিদ্যালয় বা অফিসের নাম"
                    value={form.institutionOrWorkplace}
                    onChange={(e) => setForm({ ...form, institutionOrWorkplace: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    বর্তমান ঠিকানা *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="বর্তমান ঠিকানা"
                    value={form.presentAddress}
                    onChange={(e) => setForm({ ...form, presentAddress: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    স্থায়ী ঠিকানা *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="গ্রাম, থানা, জেলা"
                    value={form.permanentAddress}
                    onChange={(e) => setForm({ ...form, permanentAddress: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* 2. Guardian Details */}
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">
                ২. অভিভাবক ও জরুরি যোগাযোগ
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    অভিভাবকের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="পিতা / মাতার নাম"
                    value={form.guardianName}
                    onChange={(e) => setForm({ ...form, guardianName: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সম্পর্ক *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="পিতা / মাতা / ভাই"
                    value={form.guardianRelation}
                    onChange={(e) => setForm({ ...form, guardianRelation: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    অভিভাবকের মোবাইল *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="০১৭xxxxxxxx"
                    value={form.guardianPhone}
                    onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. Seat & Billing */}
            <div>
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 pb-1 border-b border-blue-100">
                ৩. সিট বরাদ্দ ও ভর্তি ফি
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সিট নির্বাচন করুন
                  </label>
                  <select
                    value={form.seatId}
                    onChange={(e) => {
                      const selected = availableSeats.find((s) => s._id === e.target.value);
                      setForm({
                        ...form,
                        seatId: e.target.value,
                        monthlyRentTaka: selected ? selected.monthlyRentPoisha / 100 : form.monthlyRentTaka,
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">পরে বরাদ্দ দেওয়া হবে</option>
                    {availableSeats.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.seatNumber} (ভাড়া: ৳ {s.monthlyRentPoisha / 100})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    মাসিক ভাড়া (টাকা) *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.monthlyRentTaka}
                    onChange={(e) => setForm({ ...form, monthlyRentTaka: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    জামানত বা সিকিউরিটি ডিপোজিট (টাকা)
                  </label>
                  <input
                    type="number"
                    value={form.securityDepositTaka}
                    onChange={(e) => setForm({ ...form, securityDepositTaka: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Initial Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ভর্তি ফি (টাকা)
                  </label>
                  <input
                    type="number"
                    value={form.admissionFeeTaka}
                    onChange={(e) => setForm({ ...form, admissionFeeTaka: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    জমা দেওয়ার মাধ্যম
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="CASH">নগদ ক্যাশ (Cash)</option>
                    <option value="BKASH">বিকাশ (bKash)</option>
                    <option value="NAGAD">নগদ (Nagad)</option>
                    <option value="BANK_TRANSFER">ব্যাংক স্থানান্তর</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ট্রানজেকশন আইডি (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="TrxID..."
                    value={form.transactionId}
                    onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAdmissionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'ভর্তি সম্পন্ন হচ্ছে...' : 'ভর্তি নিশ্চিত করুন ও রশিদ তৈরি করুন'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
