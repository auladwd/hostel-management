'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  PlusCircle,
  Calendar,
  Receipt,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { StatCard } from '@/components/ui/StatCard';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';
import { exportToExcel } from '@/lib/export';

export default function FinancialPage() {
  const { success, error } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [summary, setSummary] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'UTILITY_ELECTRICITY',
    title: '',
    description: '',
    amountTaka: '',
    paidTo: '',
    paymentSource: 'CASH_IN_HAND',
    expenseDate: new Date().toISOString().substring(0, 10),
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes] = await Promise.all([
        fetch(`/api/financial/summary?month=${selectedMonth}`),
        fetch(`/api/financial/expenses?month=${selectedMonth}`),
      ]);

      if (sumRes.ok) {
        const json = await sumRes.json();
        setSummary(json.data);
      }
      if (expRes.ok) {
        const json = await expRes.json();
        setExpenses(json.data || []);
      }
    } catch (e) {
      console.error(e);
      error('আর্থিক বিবরণী লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/financial/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsExpenseModalOpen(false);
      setExpenseForm({
        category: 'UTILITY_ELECTRICITY',
        title: '',
        description: '',
        amountTaka: '',
        paidTo: '',
        paymentSource: 'CASH_IN_HAND',
        expenseDate: new Date().toISOString().substring(0, 10),
      });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'খরচ রেকর্ড করা যায়নি';
      error(msg);
    }
  };

  const handleExportStatement = () => {
    if (!summary) return;
    const rows = [
      { 'খাত': 'ভাড়া আদায়', 'পরিমাণ (টাকা)': summary.income?.rentCollectionsPoisha / 100, 'ধরন': 'আয়' },
      { 'খাত': 'মিল বাবদ জমা', 'পরিমাণ (টাকা)': summary.income?.mealDepositsPoisha / 100, 'ধরন': 'আয়' },
      { 'খাত': 'অন্যান্য আয়', 'পরিমাণ (টাকা)': summary.income?.otherIncomePoisha / 100, 'ধরন': 'আয়' },
      { 'খাত': 'ইউটিলিটি ও বিদ্যুৎ', 'পরিমাণ (টাকা)': summary.expense?.utilitiesPoisha / 100, 'ধরন': 'ব্যয়' },
      { 'খাত': 'স্টাফ বেতন', 'পরিমাণ (টাকা)': summary.expense?.salariesPoisha / 100, 'ধরন': 'ব্যয়' },
      { 'খাত': 'রক্ষণাবেক্ষণ ও পরিচ্ছন্নতা', 'পরিমাণ (টাকা)': summary.expense?.maintenancePoisha / 100, 'ধরন': 'ব্যয়' },
      { 'খাত': 'মেস বাজার খরচ', 'পরিমাণ (টাকা)': summary.expense?.groceryPoisha / 100, 'ধরন': 'ব্যয়' },
      { 'খাত': 'অন্যান্য খরচ', 'পরিমাণ (টাকা)': summary.expense?.otherExpensesPoisha / 100, 'ধরন': 'ব্যয়' },
    ];
    exportToExcel(`Financial_Statement_${selectedMonth}`, 'আর্থিক বিবরণী', rows);
  };

  const EXPENSE_CATEGORY_NAMES: Record<string, string> = {
    UTILITY_ELECTRICITY: 'বিদ্যুৎ বিল (Electricity)',
    UTILITY_GAS: 'গ্যাস বিল (Gas)',
    UTILITY_WATER: 'পানি ও স্যুয়ারেজ (Water)',
    UTILITY_INTERNET: 'ইন্টারনেট ও ওয়াইফাই',
    STAFF_SALARY: 'স্টাফ ও কর্মচারীর বেতন',
    MAINTENANCE_REPAIR: 'রক্ষণাবেক্ষণ ও মেরামত',
    CLEANING_HYGIENE: 'পরিচ্ছন্নতা সামগ্রী',
    OFFICE_RENT: 'অফিস বা বাড়ি ভাড়া',
    BAZAR_EXPENSE: 'বাজার ও কিচেন খরচ',
    OTHER_EXPENSE: 'অন্যান্য পরিচালন ব্যয়',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              আর্থিক হিসাব-নিকাশ ও বিবরণী
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              আয়, ব্যয়, নিরাপত্তা জামানত এবং উদ্বৃত্ত তহবিলের সমন্বিত হিসাব
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন খরচের ভাউচার</span>
            </button>
          </div>
        </div>

        {/* Month Selector Bar */}
        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">হিসাবের মাস:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportStatement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>এক্সেল ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Primary Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="মোট আদায়কৃত আয়"
            value={formatBengaliCurrency((summary?.income?.totalIncomeCollectedPoisha || 0) / 100)}
            subtitle="ভাড়া + মিল অগ্রিম জমা"
            icon={TrendingUp}
            variant="emerald"
          />
          <StatCard
            title="মোট পরিচালন ব্যয়"
            value={formatBengaliCurrency((summary?.expense?.totalExpensesPoisha || 0) / 100)}
            subtitle="ইউটিলিটি + বেতন + বাজার"
            icon={TrendingDown}
            variant="rose"
          />
          <StatCard
            title="নিট উদ্বৃত্ত / ব্যালেন্স"
            value={formatBengaliCurrency((summary?.netBalancePoisha || 0) / 100)}
            subtitle="আয় বিয়োগ মোট ব্যয়"
            icon={DollarSign}
            variant={summary?.netBalancePoisha >= 0 ? 'emerald' : 'rose'}
          />
          <StatCard
            title="সংগৃহীত নিরাপত্তা জামানত"
            value={formatBengaliCurrency((summary?.income?.securityDepositsPoisha || 0) / 100)}
            subtitle="ফেরতযোগ্য দায় (আয় নয়)"
            icon={Building2}
            variant="slate"
          />
        </div>

        {/* Unified Income & Expense Statement Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Side */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2 text-emerald-800">
              <TrendingUp className="w-5 h-5" />
              <span>আয়ের উৎসসমূহ (চলতি মাস)</span>
            </h2>
            <div className="divide-y divide-slate-100 py-2 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">ভাড়া ও ভর্তি ফি আদায়:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.income?.rentCollectionsPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">মিল বাবদ অগ্রিম জমা:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.income?.mealDepositsPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">অন্যান্য আয়:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.income?.otherIncomePoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t border-slate-200 font-bold text-sm text-emerald-800">
                <span>মোট আয় সংগৃহীত:</span>
                <span>{formatBengaliCurrency((summary?.income?.totalIncomeCollectedPoisha || 0) / 100)}</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-[11px] text-amber-900 border border-amber-200 mt-2">
              চলতি মাসে মোট বকেয়া দাবি রয়েছে:{' '}
              <strong className="text-rose-700">
                {formatBengaliCurrency((summary?.income?.totalDuesOutstandingPoisha || 0) / 100)}
              </strong>
            </div>
          </div>

          {/* Expense Side */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2 text-rose-800">
              <TrendingDown className="w-5 h-5" />
              <span>ব্যয়ের খাতসমূহ (চলতি মাস)</span>
            </h2>
            <div className="divide-y divide-slate-100 py-2 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">ইউটিলিটি বিল (বিদ্যুৎ/পানি/গ্যাস/নেট):</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.expense?.utilitiesPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">স্টাফ ও কর্মচারীদের বেতন:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.expense?.salariesPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">দৈনিক মেস বাজার খরচ:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.expense?.groceryPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">রক্ষণাবেক্ষণ ও পরিচ্ছন্নতা:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.expense?.maintenancePoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-slate-600">অন্যান্য পরিচালন ব্যয়:</span>
                <span className="font-bold text-slate-900">
                  {formatBengaliCurrency((summary?.expense?.otherExpensesPoisha || 0) / 100)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t border-slate-200 font-bold text-sm text-rose-800">
                <span>সর্বমোট ব্যয়:</span>
                <span>{formatBengaliCurrency((summary?.expense?.totalExpensesPoisha || 0) / 100)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Voucher List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800">
              ব্যয়ের ভাউচার তালিকা ({toBengaliNumber(expenses.length)}টি)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">ভাউচার নং</th>
                  <th className="p-3.5">ক্যাটাগরি</th>
                  <th className="p-3.5">খরচের বিবরণ</th>
                  <th className="p-3.5">গ্রহীতা</th>
                  <th className="p-3.5">পরিমাণ</th>
                  <th className="p-3.5">তারিখ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-blue-900">{e.voucherNumber}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {EXPENSE_CATEGORY_NAMES[e.category] || e.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">{e.title}</td>
                    <td className="p-3.5 text-slate-600">{e.paidTo}</td>
                    <td className="p-3.5 font-bold text-rose-700">
                      {formatBengaliCurrency(e.amountPoisha / 100)}
                    </td>
                    <td className="p-3.5 text-slate-500">{formatBengaliDate(e.expenseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Expense Voucher */}
        <Modal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="নতুন খরচের ভাউচার তৈরি করুন"
          subtitle="ইউটিলিটি, মেরামত, বেতন বা অন্যান্য খরচের বিবরণ লিখুন"
        >
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                খরচের খাত / ক্যাটাগরি *
              </label>
              <select
                value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="UTILITY_ELECTRICITY">বিদ্যুৎ বিল (Electricity)</option>
                <option value="UTILITY_GAS">গ্যাস সিলিন্ডার / বিল</option>
                <option value="UTILITY_WATER">পানি ও পয়ঃনিষ্কাশন</option>
                <option value="UTILITY_INTERNET">ইন্টারনেট ও ওয়াইফাই</option>
                <option value="MAINTENANCE_REPAIR">রক্ষণাবেক্ষণ ও মেরামত</option>
                <option value="CLEANING_HYGIENE">পরিচ্ছন্নতা সামগ্রী</option>
                <option value="OFFICE_RENT">হোস্টেল বা অফিস ভাড়া</option>
                <option value="OTHER_EXPENSE">অন্যান্য খরচ</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                খরচের শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: অক্টোবর মাসের বিদ্যুৎ বিল পরিশোধ"
                value={expenseForm.title}
                onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  টাকার পরিমাণ (টাকা) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="যেমন: ১২০০"
                  value={expenseForm.amountTaka}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amountTaka: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  টাকা কাকে প্রদান করা হয়েছে (গ্রহীতা) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: ডেসকো / ইলেকট্রিশিয়ান"
                  value={expenseForm.paidTo}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পরিশোধের উৎস
                </label>
                <select
                  value={expenseForm.paymentSource}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentSource: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="CASH_IN_HAND">হাতে থাকা নগদ ক্যাশ</option>
                  <option value="BANK_ACCOUNT">ব্যাংক অ্যাকাউন্ট</option>
                  <option value="BKASH_MERCHANT">বিকাশ</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-xs"
              >
                ভাউচার তৈরি করুন
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
