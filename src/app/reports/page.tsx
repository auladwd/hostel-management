'use client';

import React, { useState } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  Receipt,
  UtensilsCrossed,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useToast } from '@/components/ui/Toast';
import { exportToExcel, generatePdfDocument } from '@/lib/export';
import {
  formatBengaliCurrency,
  formatBengaliDate,
  toBengaliNumber,
} from '@/lib/bengali';

export default function ReportsPage() {
  const { success, error } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7) // "YYYY-MM"
  );
  const [loadingReport, setLoadingReport] = useState<string | null>(null);

  // 1. Download Occupancy Report
  const handleOccupancyReport = async () => {
    setLoadingReport('OCCUPANCY');
    try {
      const res = await fetch('/api/seats');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const rows = json.data.map((s: any) => ({
        'সিট নম্বর': s.seatNumber,
        'রুম নম্বর': s.roomId?.roomNumber || '—',
        'ভবন': s.buildingId?.name || '—',
        'স্ট্যাটাস': s.status,
        'বর্তমান বর্ডার': s.currentResidentId?.fullName || 'ফাঁকা',
        'বর্ডার আইডি': s.currentResidentId?.residentId || '—',
        'মাসিক ভাড়া (টাকা)': s.monthlyRentPoisha / 100,
      }));

      exportToExcel(`Hostel_Seat_Occupancy_${Date.now()}`, 'সিট অকুপেন্সি রিপোর্ট', rows);
      success('সিট অকুপেন্সি রিপোর্ট সফলভাবে ডাউনলোড হয়েছে');
    } catch (e) {
      error('রিপোর্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setLoadingReport(null);
    }
  };

  // 2. Download Residents Register Report
  const handleResidentsReport = async () => {
    setLoadingReport('RESIDENTS');
    try {
      const res = await fetch('/api/residents?status=ALL');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const rows = json.data.map((r: any) => ({
        'বর্ডার আইডি': r.residentId,
        'পূর্ণ নাম': r.fullName,
        'মোবাইল নম্বর': r.phone,
        'এনআইডি / জন্মসনদ': r.nidOrBirthCert,
        'প্রতিষ্ঠান / কর্মক্ষেত্র': r.institutionOrWorkplace,
        'রুম ও সিট': `${r.roomId?.roomNumber || '—'} (${r.seatId?.seatNumber || '—'})`,
        'মাসিক ভাড়া (টাকা)': r.monthlyRentPoisha / 100,
        'জামানত (টাকা)': r.securityDepositPoisha / 100,
        'ভর্তির তারিখ': formatBengaliDate(r.admissionDate),
        'স্ট্যাটাস': r.status,
      }));

      exportToExcel(`Residents_Register_${Date.now()}`, 'বর্ডার তালিকা রেজিস্টার', rows);
      success('বর্ডার রেজিস্টার সফলভাবে ডাউনলোড হয়েছে');
    } catch (e) {
      error('রিপোর্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setLoadingReport(null);
    }
  };

  // 3. Download Rent & Dues Report
  const handleRentDuesReport = async () => {
    setLoadingReport('RENT');
    try {
      const res = await fetch(`/api/rent/invoices?month=${selectedMonth}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const rows = json.data.map((inv: any) => ({
        'ইনভয়েস নং': inv.invoiceNumber,
        'বর্ডারের নাম': inv.residentId?.fullName,
        'আইডি': inv.residentId?.residentId,
        'মাস': inv.billingMonth,
        'রুম ভাড়া (টাকা)': inv.roomRentPoisha / 100,
        'ইউটিলিটি ও সার্ভিস': (inv.utilityChargesPoisha + inv.serviceChargesPoisha) / 100,
        'মোট দাবি (টাকা)': inv.totalPayablePoisha / 100,
        'পরিশোধিত (টাকা)': inv.paidAmountPoisha / 100,
        'বকেয়া (টাকা)': inv.dueAmountPoisha / 100,
        'স্ট্যাটাস': inv.status,
      }));

      exportToExcel(`Rent_Dues_Report_${selectedMonth}`, `${selectedMonth} ভাড়া ও বকেয়া রিপোর্ট`, rows);
      success('ভাড়া ও বকেয়া রিপোর্ট ডাউনলোড হয়েছে');
    } catch (e) {
      error('রিপোর্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setLoadingReport(null);
    }
  };

  // 4. Download Bazar Expenses Report
  const handleBazarReport = async () => {
    setLoadingReport('BAZAR');
    try {
      const res = await fetch(`/api/meals/bazar?month=${selectedMonth}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const rows = json.data.map((b: any) => ({
        'ভাউচার নং': b.voucherNumber,
        'তারিখ': b.purchaseDate,
        'ক্যাটাগরি': b.category,
        'বাজার করেছেন': b.purchasedBy,
        'মোট খরচ (টাকা)': b.totalAmountPoisha / 100,
        'মন্তব্য': b.notes || '',
      }));

      exportToExcel(`Bazar_Report_${selectedMonth}`, `${selectedMonth} বাজার রিপোর্ট`, rows);
      success('বাজার খরচ রিপোর্ট ডাউনলোড হয়েছে');
    } catch (e) {
      error('রিপোর্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setLoadingReport(null);
    }
  };

  // 5. Download Monthly Meal Settlement
  const handleMealSettlementReport = async () => {
    setLoadingReport('MEALS');
    try {
      const res = await fetch(`/api/meals/settlement?month=${selectedMonth}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      const data = json.data;
      const rows = data.residentBreakdown.map((r: any) => ({
        'বর্ডারের নাম': r.residentName,
        'রুম ও সিট': `${r.roomNumber} - ${r.seatNumber}`,
        'খাওয়া মিল ইউনিট': r.totalUnits,
        'মিল রেট (টাকা)': data.calculatedMealRatePoisha / 100,
        'মোট মিল চার্জ (টাকা)': r.mealBillPoisha / 100,
        'অগ্রিম জমা (টাকা)': r.totalDepositPoisha / 100,
        'উদ্বৃত্ত / বকেয়া (টাকা)': r.balancePoisha / 100,
        'অবস্থা': r.balancePoisha >= 0 ? 'ফেরতযোগ্য' : 'বকেয়া',
      }));

      exportToExcel(`Meal_Settlement_${selectedMonth}`, `${selectedMonth} মিল সেটেলমেন্ট`, rows);
      success('মিল রেট ও সেটেলমেন্ট রিপোর্ট ডাউনলোড হয়েছে');
    } catch (e) {
      error('রিপোর্ট তৈরিতে সমস্যা হয়েছে');
    } finally {
      setLoadingReport(null);
    }
  };

  const reportCards = [
    {
      id: 'OCCUPANCY',
      title: 'সিট অকুপেন্সি ও প্রাপ্যতা রিপোর্ট',
      description: 'হোস্টেলের সকল ভবন, রুম ও সিটের বর্তমান বরাদ্দ ও ফাঁকা সিটের তালিকা।',
      icon: Building2,
      onDownload: handleOccupancyReport,
    },
    {
      id: 'RESIDENTS',
      title: 'বর্ডার ভর্তি ও ব্যক্তিগত রেজিস্টার',
      description: 'সকল সক্রিয় ও প্রাক্তন বর্ডারের পূর্ণাঙ্গ তথ্য, মোবাইল, অভিভাবক ও এনআইডি।',
      icon: Users,
      onDownload: handleResidentsReport,
    },
    {
      id: 'RENT',
      title: 'মাসিক ভাড়া আদায় ও বকেয়া রিপোর্ট',
      description: 'মাসভিত্তিক রুম ভাড়া, ইউটিলিটি চার্জ, সংগৃহীত টাকা ও বকেয়ার বিবরণ।',
      icon: Receipt,
      onDownload: handleRentDuesReport,
    },
    {
      id: 'MEALS',
      title: 'মাসিক মিল সেটেলমেন্ট ও রেট বিবরণী',
      description: 'মোট বাজার খরচ, খাওয়া মোট মিল ইউনিট, হিসাবকৃত মিল রেট ও বর্ডারভিত্তিক চার্জ।',
      icon: UtensilsCrossed,
      onDownload: handleMealSettlementReport,
    },
    {
      id: 'BAZAR',
      title: 'দৈনিক বাজার ও মুদি খরচ রিপোর্ট',
      description: 'প্রতিদিনের বাজার ভাউচার, চাল-ডাল-তেল-সবজির পরিমাণ ও একক দরের বিবরণ।',
      icon: DollarSign,
      onDownload: handleBazarReport,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            রিপোর্ট ও অ্যানালিটিক্স কেন্দ্র
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            সিট অকুপেন্সি, ভাড়া বকেয়া, মেস হিসাব ও আর্থিক বিবরণীর এক্সেল ও পিডিএফ রিপোর্ট
          </p>
        </div>

        {/* Global Month Filter */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-5 h-5 text-blue-900" />
          <span className="text-xs font-bold text-slate-700">হিসাবের মাস নির্বাচন:</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-300 font-bold"
          />
        </div>

        {/* Report Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportCards.map((rc) => {
            const Icon = rc.icon;
            const isLoading = loadingReport === rc.id;

            return (
              <div
                key={rc.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-1">{rc.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">
                    {rc.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Excel / CSV ফরম্যাট</span>
                  <button
                    onClick={rc.onDownload}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isLoading ? 'ডাউনলোড হচ্ছে...' : 'ডাউনলোড'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
