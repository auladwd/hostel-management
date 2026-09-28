'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Receipt, CreditCard, DollarSign, Download, Printer } from 'lucide-react';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
  PAYMENT_METHOD_LABELS,
} from '@/lib/bengali';

export default function ResidentPortalRentPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRent = async () => {
      try {
        const [invRes, payRes] = await Promise.all([
          fetch('/api/rent/invoices'),
          fetch('/api/rent/payments'),
        ]);

        if (invRes.ok) {
          const invJson = await invRes.json();
          setInvoices(invJson.data || []);
        }
        if (payRes.ok) {
          const payJson = await payRes.json();
          setPayments(payJson.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRent();
  }, []);

  const totalDuePoisha = invoices.reduce((acc, inv) => acc + (inv.dueAmountPoisha || 0), 0);
  const totalPaidPoisha = payments.reduce((acc, p) => acc + (p.amountPoisha || 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            আমার ভাড়া ও পেমেন্ট রশিদ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            আপনার মাসিক ভাড়া ইনভয়েস, বকেয়া এবং জমা রশিদের বিবরণী
          </p>
        </div>

        {/* Due Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold block mb-1">
              বর্তমান বকেয়া ভাড়া
            </span>
            <div
              className={`text-3xl font-black ${
                totalDuePoisha > 0 ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {formatBengaliCurrency(totalDuePoisha / 100)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalDuePoisha > 0
                ? 'অনুগ্রহ করে হোস্টেল অফিসে অথবা বিকাশ/নগদে পরিশোধ করুন'
                : 'আপনার কোনো বকেয়া ভাড়া নেই। ধন্যবাদ!'}
            </p>
          </div>
          <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-xs">
            <span className="text-xs text-emerald-700 font-semibold block mb-1">
              মোট পরিশোধিত টাকা
            </span>
            <div className="text-3xl font-black text-emerald-800">
              {formatBengaliCurrency(totalPaidPoisha / 100)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              মোট {toBengaliNumber(payments.length)}টি জমার রশিদ পাওয়া গেছে
            </p>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-sm text-slate-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-900" />
            <span>মাসিক ইনভয়েস তালিকা</span>
          </div>
          {loading ? (
            <LoadingSkeleton rows={4} />
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              এখনো কোনো ইনভয়েস ইস্যু করা হয়নি
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">ইনভয়েস নং</th>
                    <th className="p-3.5">মাস</th>
                    <th className="p-3.5">সিট ভাড়া</th>
                    <th className="p-3.5">ইউটিলিটি ও অন্যান্য</th>
                    <th className="p-3.5">মোট প্রদেয়</th>
                    <th className="p-3.5">পরিশোধিত</th>
                    <th className="p-3.5">বকেয়া</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.map((inv) => (
                    <tr key={inv._id}>
                      <td className="p-3.5 font-bold text-blue-900">{inv.invoiceNumber}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{inv.billingMonth}</td>
                      <td className="p-3.5">{formatBengaliCurrency(inv.roomRentPoisha / 100)}</td>
                      <td className="p-3.5 text-slate-500">
                        {formatBengaliCurrency((inv.utilityChargesPoisha + inv.serviceChargesPoisha) / 100)}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {formatBengaliCurrency(inv.totalPayablePoisha / 100)}
                      </td>
                      <td className="p-3.5 text-emerald-700 font-semibold">
                        {formatBengaliCurrency(inv.paidAmountPoisha / 100)}
                      </td>
                      <td className="p-3.5 text-rose-700 font-bold">
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
