'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Filter,
  CreditCard,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
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
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '@/lib/bengali';
import { exportToExcel } from '@/lib/export';

export default function RentPage() {
  const { success, error } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: Invoices or Money Receipts
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS'>('INVOICES');

  // Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Generate Invoices Form
  const [generateForm, setGenerateForm] = useState({
    billingMonth: new Date().toISOString().substring(0, 7), // "YYYY-MM"
    utilityChargesTaka: 500,
    serviceChargesTaka: 200,
    notes: '',
  });

  // Collect Payment Form
  const [paymentForm, setPaymentForm] = useState({
    residentId: '',
    invoiceId: '',
    purpose: 'RENT_INVOICE',
    amountTaka: '',
    paymentMethod: 'BKASH',
    transactionId: '',
    remarks: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (monthFilter) queryParams.append('month', monthFilter);
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);

      const [invRes, payRes, resRes] = await Promise.all([
        fetch(`/api/rent/invoices?${queryParams.toString()}`),
        fetch('/api/rent/payments'),
        fetch('/api/residents?status=ACTIVE'),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.data || []);
      }
      if (payRes.ok) {
        const payData = await payRes.json();
        setPayments(payData.data || []);
      }
      if (resRes.ok) {
        const resData = await resRes.json();
        setResidents(resData.data || []);
      }
    } catch (e) {
      console.error(e);
      error('ভাড়ার তথ্য লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [monthFilter, statusFilter]);

  // Handle Bulk Invoice Generation
  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rent/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsGenerateModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ইনভয়েস তৈরি ব্যর্থ হয়েছে';
      error(msg);
    }
  };

  // Handle Payment Collection
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rent/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsPaymentModalOpen(false);
      // Auto open printable receipt modal
      setSelectedReceipt(data.data);
      setIsReceiptModalOpen(true);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'পেমেন্ট গ্রহণ সম্পন্ন করা যায়নি';
      error(msg);
    }
  };

  // Handle Export
  const handleExportInvoices = () => {
    const rows = invoices.map((inv) => ({
      'ইনভয়েস নম্বর': inv.invoiceNumber,
      'বর্ডারের নাম': inv.residentId?.fullName,
      'আইডি': inv.residentId?.residentId,
      'মাস': inv.billingMonth,
      'রুম ভাড়া (টাকা)': inv.roomRentPoisha / 100,
      'ইউটিলিটি ও সার্ভিস (টাকা)': (inv.utilityChargesPoisha + inv.serviceChargesPoisha) / 100,
      'মোট দাবি (টাকা)': inv.totalPayablePoisha / 100,
      'পরিশোধিত (টাকা)': inv.paidAmountPoisha / 100,
      'বকেয়া (টাকা)': inv.dueAmountPoisha / 100,
      'স্ট্যাটাস': inv.status,
    }));
    exportToExcel('Hostel_Rent_Invoices', 'ইনভয়েস তালিকা', rows);
  };

  // Unpaid invoices of selected resident for dropdown
  const residentInvoices = invoices.filter(
    (inv) => inv.residentId?._id === paymentForm.residentId && inv.dueAmountPoisha > 0
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ভাড়া আদায় ও ইনভয়েস ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              মাসিক ইনভয়েস জেনারেট, টাকা জমার রসিদ এবং বকেয়া ট্র্যাকিং
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>মাসিক ইনভয়েস তৈরি করুন</span>
            </button>
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>টাকা জমা গ্রহণ (পেমেন্ট)</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs and Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'INVOICES'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>মাসিক ইনভয়েস তালিকা</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-800 text-white">
                {toBengaliNumber(invoices.length)}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'PAYMENTS'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>টাকা জমার রশিদসমূহ</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {toBengaliNumber(payments.length)}
              </span>
            </button>
          </div>

          {activeTab === 'INVOICES' && (
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="ALL">সকল স্ট্যাটাস</option>
                <option value="UNPAID">বকেয়া (Unpaid)</option>
                <option value="PARTIAL">আংশিক (Partial)</option>
                <option value="PAID">পরিশোধিত (Paid)</option>
              </select>
              <button
                onClick={handleExportInvoices}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="এক্সেল ফাইল ডাউনলোড করুন"
              >
                <Download className="w-3.5 h-3.5" />
                <span>এক্সেল</span>
              </button>
            </div>
          )}
        </div>

        {/* 1. Invoices Table */}
        {activeTab === 'INVOICES' && (
          loading ? (
            <LoadingSkeleton rows={6} />
          ) : invoices.length === 0 ? (
            <EmptyState
              title="কোনো ইনভয়েস নেই"
              description="চলতি মাসের জন্য এখনো কোনো ইনভয়েস তৈরি করা হয়নি। উপরের বাটন দিয়ে তৈরি করুন।"
              icon={Receipt}
              actionText="মাসিক ইনভয়েস তৈরি করুন"
              onAction={() => setIsGenerateModalOpen(true)}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">ইনভয়েস নং</th>
                      <th className="p-3.5">বর্ডারের নাম</th>
                      <th className="p-3.5">মাস</th>
                      <th className="p-3.5">সিট ভাড়া</th>
                      <th className="p-3.5">ইউটিলিটি</th>
                      <th className="p-3.5">মোট প্রদেয়</th>
                      <th className="p-3.5">পরিশোধিত</th>
                      <th className="p-3.5">বকেয়া</th>
                      <th className="p-3.5">স্ট্যাটাস</th>
                      <th className="p-3.5 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-blue-900">{inv.invoiceNumber}</td>
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800">{inv.residentId?.fullName}</div>
                          <div className="text-[10px] text-slate-400">আইডি: {inv.residentId?.residentId}</div>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">{inv.billingMonth}</td>
                        <td className="p-3.5">{formatBengaliCurrency(inv.roomRentPoisha / 100)}</td>
                        <td className="p-3.5 text-slate-500">
                          {formatBengaliCurrency((inv.utilityChargesPoisha + inv.serviceChargesPoisha) / 100)}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {formatBengaliCurrency(inv.totalPayablePoisha / 100)}
                        </td>
                        <td className="p-3.5 font-semibold text-emerald-700">
                          {formatBengaliCurrency(inv.paidAmountPoisha / 100)}
                        </td>
                        <td className="p-3.5 font-bold text-rose-700">
                          {formatBengaliCurrency(inv.dueAmountPoisha / 100)}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'PARTIAL'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {inv.status === 'PAID' ? 'পরিশোধিত' : inv.status === 'PARTIAL' ? 'আংশিক' : 'বকেয়া'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          {inv.dueAmountPoisha > 0 && (
                            <button
                              onClick={() => {
                                setPaymentForm({
                                  ...paymentForm,
                                  residentId: inv.residentId?._id,
                                  invoiceId: inv._id,
                                  amountTaka: (inv.dueAmountPoisha / 100).toString(),
                                });
                                setIsPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              জমা নিন
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* 2. Payments / Money Receipts Table */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">রশিদ নং</th>
                    <th className="p-3.5">বর্ডারের নাম</th>
                    <th className="p-3.5">উদ্দেশ্য</th>
                    <th className="p-3.5">জমার পরিমাণ</th>
                    <th className="p-3.5">মাধ্যম</th>
                    <th className="p-3.5">তারিখ</th>
                    <th className="p-3.5">সংগ্রাহক</th>
                    <th className="p-3.5 text-right">রশিদ প্রিন্ট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {payments.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-blue-900">{p.receiptNumber}</td>
                      <td className="p-3.5 font-bold text-slate-800">{p.residentId?.fullName}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {p.purpose === 'RENT_INVOICE'
                            ? 'মাসিক ভাড়া'
                            : p.purpose === 'MEAL_DEPOSIT'
                            ? 'মিল অগ্রিম'
                            : p.purpose === 'SECURITY_DEPOSIT'
                            ? 'জামানত'
                            : 'ভর্তি ফি'}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-emerald-800 text-sm">
                        {formatBengaliCurrency(p.amountPoisha / 100)}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700">
                        {PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod}
                        {p.transactionId && (
                          <div className="text-[10px] text-slate-400">Trx: {p.transactionId}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-500">{formatBengaliDate(p.paymentDate)}</td>
                      <td className="p-3.5 text-slate-600">{p.collectedBy?.displayName || 'অফিস'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceipt(p);
                            setIsReceiptModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>রশিদ দেখুন</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Generate Invoices */}
        <Modal
          isOpen={isGenerateModalOpen}
          onClose={() => setIsGenerateModalOpen(false)}
          title="মাসিক ভাড়া ইনভয়েস তৈরি করুন"
          subtitle="সকল সক্রিয় বর্ডারের জন্য স্বয়ংক্রিয়ভাবে ইনভয়েস তৈরি হবে (ডুপ্লিকেট প্রতিরোধ সুরক্ষিত)"
        >
          <form onSubmit={handleGenerateInvoices} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                হিসাবের মাস নির্বাচন করুন *
              </label>
              <input
                type="month"
                required
                value={generateForm.billingMonth}
                onChange={(e) => setGenerateForm({ ...generateForm, billingMonth: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ইউটিলিটি বিল (বিদ্যুৎ/পানি/গ্যাস)
                </label>
                <input
                  type="number"
                  min="0"
                  value={generateForm.utilityChargesTaka}
                  onChange={(e) => setGenerateForm({ ...generateForm, utilityChargesTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সার্ভিস ও ওয়াইফাই চার্জ (টাকা)
                </label>
                <input
                  type="number"
                  min="0"
                  value={generateForm.serviceChargesTaka}
                  onChange={(e) => setGenerateForm({ ...generateForm, serviceChargesTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                মন্তব্য / বিশেষ দ্রষ্টব্য
              </label>
              <input
                type="text"
                placeholder="যেমন: ৫ তারিখের মধ্যে ভাড়া পরিশোধ আবশ্যক"
                value={generateForm.notes}
                onChange={(e) => setGenerateForm({ ...generateForm, notes: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                ইনভয়েস তৈরি শুরু করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Collect Payment */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="ভাড়া বা জমার টাকা গ্রহণ"
          subtitle="বর্ডারের জমা রেকর্ড করুন ও মানি রিসিট ইস্যু করুন"
        >
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বর্ডার নির্বাচন করুন *
              </label>
              <select
                required
                value={paymentForm.residentId}
                onChange={(e) => setPaymentForm({ ...paymentForm, residentId: e.target.value })}
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

            {residentInvoices.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নির্দিষ্ট ইনভয়েস সমন্বয় (বকেয়া ইনভয়েস)
                </label>
                <select
                  value={paymentForm.invoiceId}
                  onChange={(e) => {
                    const inv = residentInvoices.find((i) => i._id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      invoiceId: e.target.value,
                      amountTaka: inv ? (inv.dueAmountPoisha / 100).toString() : paymentForm.amountTaka,
                    });
                  }}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">ইনভয়েস ছাড়াও সাধারণ জমা হিসেবে জমা নিন</option>
                  {residentInvoices.map((inv) => (
                    <option key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} ({inv.billingMonth}) - বকেয়া: ৳ {inv.dueAmountPoisha / 100}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  জমার পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: ৩০০০"
                  value={paymentForm.amountTaka}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountTaka: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পেমেন্ট মাধ্যম *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CASH">নগদ ক্যাশ (Cash)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="BANK_TRANSFER">ব্যাংক স্থানান্তর</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ট্রানজেকশন আইডি / রেফারেন্স (বিকাশ/নগদ এর ক্ষেত্রে)
              </label>
              <input
                type="text"
                placeholder="যেমন: BKASH89230192"
                value={paymentForm.transactionId}
                onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs"
              >
                পেমেন্ট সম্পন্ন করুন ও রসিদ তৈরি করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Printable Money Receipt */}
        <Modal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          title="টাকা জমার অফিশিয়াল রশিদ"
          subtitle="Money Receipt"
        >
          {selectedReceipt && (
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-center pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900">মানি রিসিট</h3>
                  <div className="text-xs text-blue-900 font-bold mt-0.5">
                    রশিদ নং: {selectedReceipt.receiptNumber}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    তারিখ: {formatBengaliDate(selectedReceipt.paymentDate)}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">বর্ডারের নাম:</span>
                    <span className="font-bold text-slate-900">{selectedReceipt.residentId?.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">বর্ডার আইডি:</span>
                    <span className="font-bold">{selectedReceipt.residentId?.residentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">জমার উদ্দেশ্য:</span>
                    <span>
                      {selectedReceipt.purpose === 'RENT_INVOICE'
                        ? 'মাসিক ভাড়া'
                        : selectedReceipt.purpose === 'MEAL_DEPOSIT'
                        ? 'মিল অগ্রিম'
                        : 'জামানত / ফি'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">পরিশোধের মাধ্যম:</span>
                    <span className="font-semibold">{PAYMENT_METHOD_LABELS[selectedReceipt.paymentMethod]}</span>
                  </div>
                  {selectedReceipt.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">ট্রানজেকশন আইডি:</span>
                      <span className="font-mono text-slate-800">{selectedReceipt.transactionId}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                  <span>মোট জমার পরিমাণ:</span>
                  <span className="text-lg text-emerald-800">
                    {formatBengaliCurrency(selectedReceipt.amountPoisha / 100)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>রশিদ প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
