'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Calendar,
  Filter,
  Trash2,
  Receipt,
  Download,
  DollarSign,
  User,
  Package,
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

export default function BazarPage() {
  const { success, error } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [totalBazarPoisha, setTotalBazarPoisha] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal
  const [isBazarModalOpen, setIsBazarModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Bazar Entry Form
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().substring(0, 10)
  );
  const [category, setCategory] = useState('GROCERY');
  const [purchasedBy, setPurchasedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<
    Array<{ itemName: string; quantity: number; unit: string; unitPriceTaka: number }>
  >([{ itemName: '', quantity: 1, unit: 'কেজি', unitPriceTaka: 0 }]);

  const fetchBazar = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedMonth) queryParams.append('month', selectedMonth);
      if (selectedCategory !== 'ALL') queryParams.append('category', selectedCategory);

      const res = await fetch(`/api/meals/bazar?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setPurchases(json.data || []);
        setTotalBazarPoisha(json.summary?.totalBazarPoisha || 0);
      }
    } catch (e) {
      console.error(e);
      error('বাজার হিসাব লোড করতে ব্যর্থ হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBazar();
  }, [selectedMonth, selectedCategory]);

  // Item handlers
  const handleAddItem = () => {
    setItems([...items, { itemName: '', quantity: 1, unit: 'কেজি', unitPriceTaka: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  // Form total calculation
  const calculatedFormTotal = items.reduce(
    (acc, it) => acc + (Number(it.quantity) || 0) * (Number(it.unitPriceTaka) || 0),
    0
  );

  const handleSubmitBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/meals/bazar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseDate,
          category,
          purchasedBy,
          items,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsBazarModalOpen(false);
      setItems([{ itemName: '', quantity: 1, unit: 'কেজি', unitPriceTaka: 0 }]);
      setPurchasedBy('');
      setNotes('');
      fetchBazar();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'বাজার এন্ট্রি ব্যর্থ হয়েছে';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    const rows = purchases.map((p) => ({
      'ভাউচার নং': p.voucherNumber,
      'তারিখ': p.purchaseDate,
      'ক্যাটাগরি': p.category,
      'মোট খরচ (টাকা)': p.totalAmountPoisha / 100,
      'বাজার করেছেন': p.purchasedBy,
      'আইটেমস সংখ্যা': p.items?.length || 0,
      'মন্তব্য': p.notes || '',
    }));
    exportToExcel(`Bazar_Report_${selectedMonth}`, `${selectedMonth} বাজার তালিকা`, rows);
  };

  const CATEGORY_NAMES: Record<string, string> = {
    GROCERY: 'মুদি সামগ্রী (Grocery)',
    VEGETABLES: 'কাঁচাবাজার ও সবজি',
    FISH_AND_MEAT: 'মাছ ও মাংস',
    SPICES_OIL: 'তেল ও মসলা',
    GAS_AND_FUEL: 'গ্যাস সিলিন্ডার ও জ্বালানি',
    OTHER: 'অন্যান্য নিত্যপণ্য',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              দৈনিক মেস বাজার ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              আইটেমভিত্তিক বাজার এন্ট্রি, রসিদ ভাউচার ও মাসিক মোট বাজার খরচ
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBazarModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন বাজার এন্ট্রি</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Banner */}
        <div className="p-6 bg-linear-to-r from-blue-900 to-indigo-900 text-white rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blue-200">
              {selectedMonth} মাসের মোট বাজার ব্যয়
            </span>
            <div className="text-3xl font-black mt-1">
              {formatBengaliCurrency(totalBazarPoisha / 100)}
            </div>
            <p className="text-[11px] text-blue-200 mt-1">
              মোট {toBengaliNumber(purchases.length)}টি বাজার ভাউচার রেকর্ড করা হয়েছে
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>এক্সেল ডাউনলোড</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">মাস:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">ক্যাটাগরি:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">সকল ক্যাটাগরি</option>
              <option value="GROCERY">মুদি সামগ্রী</option>
              <option value="VEGETABLES">কাঁচাবাজার ও সবজি</option>
              <option value="FISH_AND_MEAT">মাছ ও মাংস</option>
              <option value="SPICES_OIL">তেল ও মসলা</option>
              <option value="GAS_AND_FUEL">গ্যাস সিলিন্ডার</option>
            </select>
          </div>
        </div>

        {/* Purchases List */}
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : purchases.length === 0 ? (
          <EmptyState
            title="কোনো বাজার রেকর্ড পাওয়া যায়নি"
            description="নির্বাচিত মাসে এখনো কোনো বাজার এন্ট্রি যুক্ত করা হয়নি।"
            icon={ShoppingCart}
            actionText="নতুন বাজার যোগ করুন"
            onAction={() => setIsBazarModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchases.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-blue-900">{p.voucherNumber}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {CATEGORY_NAMES[p.category] || p.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        তারিখ: {formatBengaliDate(p.purchaseDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 block">
                        {formatBengaliCurrency(p.totalAmountPoisha / 100)}
                      </span>
                      <span className="text-[10px] text-slate-400">মোট খরচ</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="py-3 space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      আইটেমস ({toBengaliNumber(p.items?.length || 0)}টি):
                    </div>
                    <div className="divide-y divide-slate-50">
                      {p.items?.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between py-1 text-slate-700">
                          <span>
                            {it.itemName} ({toBengaliNumber(it.quantity)} {it.unit})
                          </span>
                          <span className="font-semibold text-slate-900">
                            {formatBengaliCurrency(it.totalPricePoisha / 100)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500 font-medium">
                  <span>বাজারকারী: <strong className="text-slate-800">{p.purchasedBy}</strong></span>
                  {p.notes && <span className="italic">{p.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Bazar Entry */}
        <Modal
          isOpen={isBazarModalOpen}
          onClose={() => setIsBazarModalOpen(false)}
          title="নতুন বাজার এন্ট্রি ফরম"
          subtitle="বাজারের তারিখ, আইটেমস, পরিমাণ ও দর উল্লেখ করুন"
          maxWidth="2xl"
        >
          <form onSubmit={handleSubmitBazar} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বাজারের তারিখ *
                </label>
                <input
                  type="date"
                  required
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ক্যাটাগরি *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="GROCERY">মুদি সামগ্রী (Grocery)</option>
                  <option value="VEGETABLES">কাঁচাবাজার ও সবজি</option>
                  <option value="FISH_AND_MEAT">মাছ ও মাংস</option>
                  <option value="SPICES_OIL">তেল ও মসলা</option>
                  <option value="GAS_AND_FUEL">গ্যাস সিলিন্ডার ও জ্বালানি</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বাজার কে করেছেন (নাম) *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: মো: আলাউদ্দিন (বাবুর্চি) / সাকিব (বর্ডার)"
                value={purchasedBy}
                onChange={(e) => setPurchasedBy(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            {/* Line Items Builder */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">বাজার আইটেম তালিকা *</span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs font-bold text-blue-900 hover:text-blue-800 flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>আইটেম যোগ করুন</span>
                </button>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <input
                      type="text"
                      required
                      placeholder="আইটেমের নাম (চাল, তেল ইত্যাদি)"
                      value={it.itemName}
                      onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                      className="flex-2 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      placeholder="পরিমাণ"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-20 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                    <select
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className="w-20 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="কেজি">কেজি</option>
                      <option value="লিটার">লিটার</option>
                      <option value="পিস">পিস</option>
                      <option value="হালি">হালি</option>
                      <option value="গ্রাম">গ্রাম</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="একক দর"
                      value={it.unitPriceTaka || ''}
                      onChange={(e) => handleItemChange(idx, 'unitPriceTaka', e.target.value)}
                      className="w-24 text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Display */}
            <div className="p-3 bg-blue-50 rounded-xl flex justify-between items-center text-xs font-bold text-blue-950">
              <span>মোট বাজার খরচ:</span>
              <span className="text-base text-blue-900">
                {formatBengaliCurrency(calculatedFormTotal)}
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="দোকানের নাম বা বিশেষ বিবরণ"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBazarModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'সংরক্ষণ হচ্ছে...' : 'বাজার সংরক্ষণ করুন'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
