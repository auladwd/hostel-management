'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Printer,
  CreditCard,
  UserCheck,
  Phone,
  Mail,
  Home,
  Receipt,
  UtensilsCrossed,
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';

export default function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResident = async () => {
      try {
        const res = await fetch(`/api/residents/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchResident();
  }, [id]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <LoadingSkeleton rows={8} />
        </div>
      </AppShell>
    );
  }

  if (!data?.resident) {
    return (
      <AppShell>
        <div className="p-12 text-center text-slate-500 font-bold">
          বর্ডারের কোনো তথ্য পাওয়া যায়নি
        </div>
      </AppShell>
    );
  }

  const r = data.resident;
  const fin = data.financialSummary;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back and Action Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
          <Link
            href="/residents"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>বর্ডার তালিকায় ফিরে যান</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>ভর্তি ফরম প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Printable Admission Form & Profile Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs print-container">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center text-2xl font-bold">
                {r.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900">{r.fullName}</h1>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {r.status === 'ACTIVE' ? 'সক্রিয় বর্ডার' : r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  আইডি: <span className="font-bold text-blue-900">{r.residentId}</span> | ভর্তির তারিখ: {formatBengaliDate(r.admissionDate)}
                </p>
              </div>
            </div>

            {/* Room & Seat Pill */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-right sm:text-right w-full sm:w-auto">
              <div className="text-[11px] font-semibold text-slate-500">বর্তমান বরাদ্দ</div>
              <div className="text-sm font-bold text-slate-900">
                রুম {r.roomId?.roomNumber || '—'} (সিট {r.seatId?.seatNumber || '—'})
              </div>
              <div className="text-xs font-semibold text-blue-900 mt-0.5">
                ভাড়া: {formatBengaliCurrency(r.monthlyRentPoisha / 100)}/মাস
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-200 text-xs">
            {/* Personal Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-900 mb-3">
                ব্যক্তিগত তথ্য
              </h3>
              <p><span className="text-slate-500">মোবাইল:</span> <span className="font-bold">{toBengaliNumber(r.phone)}</span></p>
              <p><span className="text-slate-500">ইমেইল:</span> {r.email || '—'}</p>
              <p><span className="text-slate-500">এনআইডি/জন্মসনদ:</span> {toBengaliNumber(r.nidOrBirthCert)}</p>
              <p><span className="text-slate-500">রক্তের গ্রুপ:</span> <span className="font-bold text-rose-700">{r.bloodGroup || '—'}</span></p>
              <p><span className="text-slate-500">প্রতিষ্ঠান:</span> {r.institutionOrWorkplace}</p>
            </div>

            {/* Guardian Details */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-900 mb-3">
                অভিভাবকের তথ্য
              </h3>
              <p><span className="text-slate-500">নাম:</span> <span className="font-bold">{r.guardianName}</span> ({r.guardianRelation})</p>
              <p><span className="text-slate-500">মোবাইল:</span> <span className="font-bold">{toBengaliNumber(r.guardianPhone)}</span></p>
              <p><span className="text-slate-500">জরুরি যোগাযোগ:</span> {r.emergencyContactName} ({toBengaliNumber(r.emergencyContactPhone)})</p>
            </div>

            {/* Addresses */}
            <div className="space-y-2">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-blue-900 mb-3">
                ঠিকানা
              </h3>
              <p><span className="text-slate-500">বর্তমান:</span> {r.presentAddress}</p>
              <p><span className="text-slate-500">স্থায়ী:</span> {r.permanentAddress}</p>
              <p><span className="text-slate-500">জামানত:</span> <span className="font-bold text-emerald-800">{formatBengaliCurrency(r.securityDepositPoisha / 100)}</span></p>
            </div>
          </div>

          {/* Printable Signature Area */}
          <div className="hidden print-only pt-16 grid grid-cols-2 text-center text-xs font-bold text-slate-700">
            <div>
              <div className="w-48 border-t border-slate-400 mx-auto mb-1"></div>
              <span>বর্ডারের স্বাক্ষর</span>
            </div>
            <div>
              <div className="w-48 border-t border-slate-400 mx-auto mb-1"></div>
              <span>কর্তৃপক্ষের স্বাক্ষর ও সিল</span>
            </div>
          </div>
        </div>

        {/* Financial Summary & Invoices Section (no-print) */}
        <div className="space-y-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500 font-semibold">মোট ইনভয়েস দাবি</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatBengaliCurrency((fin?.totalInvoicedPoisha || 0) / 100)}
              </div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-emerald-100 shadow-2xs">
              <span className="text-xs text-emerald-700 font-semibold">পরিশোধিত মোট টাকা</span>
              <div className="text-xl font-bold text-emerald-800 mt-1">
                {formatBengaliCurrency((fin?.totalPaidPoisha || 0) / 100)}
              </div>
            </div>
            <div className="p-5 bg-white rounded-2xl border border-rose-100 shadow-2xs">
              <span className="text-xs text-rose-700 font-semibold">মোট বকেয়া পরিমাণ</span>
              <div className="text-xl font-bold text-rose-800 mt-1">
                {formatBengaliCurrency((fin?.totalDuePoisha || 0) / 100)}
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-900" />
              <span>ভাড়া ইনভয়েস ও জমার ইতিহাস</span>
            </h3>
            {data.invoices?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">ইনভয়েস নং</th>
                      <th className="p-3">মাস</th>
                      <th className="p-3">মোট দাবি</th>
                      <th className="p-3">পরিশোধিত</th>
                      <th className="p-3">বকেয়া</th>
                      <th className="p-3">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {data.invoices.map((inv: any) => (
                      <tr key={inv._id}>
                        <td className="p-3 font-bold text-blue-900">{inv.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-slate-800">{inv.billingMonth}</td>
                        <td className="p-3">{formatBengaliCurrency(inv.totalPayablePoisha / 100)}</td>
                        <td className="p-3 text-emerald-700">{formatBengaliCurrency(inv.paidAmountPoisha / 100)}</td>
                        <td className="p-3 text-rose-700 font-bold">{formatBengaliCurrency(inv.dueAmountPoisha / 100)}</td>
                        <td className="p-3">
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
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                এখনো কোনো ইনভয়েস তৈরি করা হয়নি
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
