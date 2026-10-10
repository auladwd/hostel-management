'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Receipt,
  UtensilsCrossed,
  DollarSign,
  AlertCircle,
  TrendingUp,
  PlusCircle,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSkeleton, CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatBengaliCurrency, toBengaliNumber, formatBengaliDate } from '@/lib/bengali';
import { fetchWithDemo } from '@/lib/apiClient';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetchWithDemo('/api/dashboard/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm('আপনি কি ডেমো ডাটা (ভবন, রুম, সিট, বর্ডার, ভাড়া ও বাজার) ডেটাবেজে যুক্ত করতে চান?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      alert(json.message);
      fetchStats();
    } catch (e) {
      console.error(e);
      alert('সিড ব্যর্থ হয়েছে');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
          <CardSkeleton />
          <LoadingSkeleton rows={4} />
        </div>
      </AppShell>
    );
  }

  // 1. RESIDENT PORTAL DASHBOARD VIEW
  if (data?.role === 'RESIDENT') {
    const resData = data.data;
    const resident = resData?.resident;

    return (
      <AppShell>
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="p-6 rounded-3xl bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-700/60 text-blue-200 border border-blue-400/20">
                  বর্ডার পোর্টাল
                </span>
                <h1 className="text-2xl font-bold mt-2">
                  স্বাগতম, {resident?.fullName || 'বর্ডার'}!
                </h1>
                <p className="text-xs text-blue-200 mt-1">
                  সিট: {resident?.seatId?.seatNumber || 'নির্ধারিত হয়নি'} | রুম: {resident?.roomId?.roomNumber || '—'} | ভবন: {resident?.buildingId?.name || '—'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/portal/meals"
                  className="px-4 py-2.5 rounded-xl bg-white text-blue-950 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm"
                >
                  মিল পরিবর্তন করুন
                </Link>
                <Link
                  href="/portal/leave"
                  className="px-4 py-2.5 rounded-xl bg-blue-800 text-white font-bold text-xs hover:bg-blue-700 transition-colors border border-blue-600"
                >
                  ছুটির আবেদন
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="বর্তমান বকেয়া ভাড়া"
              value={formatBengaliCurrency(resData.totalDuesPoisha / 100)}
              icon={Receipt}
              variant={resData.totalDuesPoisha > 0 ? 'rose' : 'emerald'}
              subtitle={resData.totalDuesPoisha > 0 ? 'দ্রুত পরিশোধ করুন' : 'সকল বকেয়া পরিশোধিত'}
            />
            <StatCard
              title="চলতি মাসের মোট মিল"
              value={`${toBengaliNumber(resData.monthMealUnits)} ইউনিট`}
              icon={UtensilsCrossed}
              variant="blue"
              subtitle="আপনার খাওয়া মিল"
            />
            <StatCard
              title="চলতি সম্ভাব্য মিল রেট"
              value={formatBengaliCurrency(resData.estimatedMealRatePoisha / 100)}
              icon={TrendingUp}
              variant="amber"
              subtitle="প্রতি মিল ইউনিট"
            />
            <StatCard
              title="মোট জমা টাকা"
              value={formatBengaliCurrency(resData.totalPaidPoisha / 100)}
              icon={DollarSign}
              variant="emerald"
              subtitle="লাইফটাইম জমা"
            />
          </div>

          {/* Today Meal Status Card */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-blue-700" />
                <span>আজকের মিল স্ট্যাটাস</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {formatBengaliDate(new Date())}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">সকালের নাস্তা</span>
                <span className={`text-lg font-bold ${resData.todayMeal?.breakfast ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {resData.todayMeal?.breakfast ? 'চালু (১)' : 'বন্ধ (০)'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">দুপুরের খাবার</span>
                <span className={`text-lg font-bold ${resData.todayMeal?.lunch ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {resData.todayMeal?.lunch ? `চালু (${toBengaliNumber(resData.todayMeal.lunch)})` : 'বন্ধ (০)'}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-semibold block mb-1">রাতের খাবার</span>
                <span className={`text-lg font-bold ${resData.todayMeal?.dinner ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {resData.todayMeal?.dinner ? `চালু (${toBengaliNumber(resData.todayMeal.dinner)})` : 'বন্ধ (০)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // 2. MANAGEMENT & OWNER DASHBOARD VIEW
  const stats = data?.data;
  const occupancyData = [
    { name: 'বরাদ্দকৃত সিট', value: stats?.occupancy?.occupiedSeats || 0, color: '#1e3a8a' },
    { name: 'ফাঁকা সিট', value: stats?.occupancy?.availableSeats || 0, color: '#059669' },
    { name: 'সংরক্ষিত সিট', value: stats?.occupancy?.reservedSeats || 0, color: '#d97706' },
    { name: 'মেরামতাধীন', value: stats?.occupancy?.maintenanceSeats || 0, color: '#e11d48' },
  ];

  const financialComparisonData = [
    {
      name: 'ভাড়া আদায়',
      টাকা: (stats?.finances?.monthlyRentCollectionPoisha || 0) / 100,
    },
    {
      name: 'মিল জমা',
      টাকা: (stats?.finances?.monthlyMealDepositsPoisha || 0) / 100,
    },
    {
      name: 'মোট খরচ',
      টাকা: (stats?.finances?.totalExpensesPoisha || 0) / 100,
    },
    {
      name: 'বাজার খরচ',
      টাকা: (stats?.finances?.groceryExpensesPoisha || 0) / 100,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with Quick Actions & Seed Option */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ওভারভিউ ড্যাশবোর্ড
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              রুম, সিট অকুপেন্সি, ভাড়া আদায় ও মেসের সামগ্রিক পরিসংখ্যান
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
              title="টেস্টিংয়ের সুবিধার্থে ডেমো ডাটা যুক্ত করুন"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{seeding ? 'সিড হচ্ছে...' : 'ডেমো ডাটা সিড'}</span>
            </button>
            <Link
              href="/residents"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন ভর্তি</span>
            </Link>
            <Link
              href="/rent"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>ইনভয়েস ও রসিদ</span>
            </Link>
          </div>
        </div>

        {/* Primary Metric Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="মোট বর্ডার"
            value={`${toBengaliNumber(stats?.residents?.total || 0)} জন`}
            subtitle={`সক্রিয়: ${toBengaliNumber(stats?.residents?.active || 0)} | ছুটিতে: ${toBengaliNumber(stats?.residents?.onLeave || 0)}`}
            icon={Users}
            variant="blue"
          />
          <StatCard
            title="সিট অকুপেন্সি রেট"
            value={`${toBengaliNumber(stats?.occupancy?.ratePercent || 0)}%`}
            subtitle={`বরাদ্দ: ${toBengaliNumber(stats?.occupancy?.occupiedSeats || 0)} / মোট: ${toBengaliNumber(stats?.occupancy?.totalSeats || 0)}`}
            icon={Building2}
            variant="emerald"
            badge={`ফাঁকা: ${toBengaliNumber(stats?.occupancy?.availableSeats || 0)}`}
          />
          <StatCard
            title="চলতি মাসের ভাড়া আদায়"
            value={formatBengaliCurrency((stats?.finances?.monthlyRentCollectionPoisha || 0) / 100)}
            subtitle={`বকেয়া: ${formatBengaliCurrency((stats?.finances?.outstandingRentDuesPoisha || 0) / 100)}`}
            icon={DollarSign}
            variant="emerald"
          />
          <StatCard
            title="চলতি সম্ভাব্য মিল রেট"
            value={formatBengaliCurrency((stats?.meals?.currentMealRatePoisha || 6500) / 100)}
            subtitle={`আজকের মোট মিল: ${toBengaliNumber((stats?.meals?.todayBreakfast || 0) + (stats?.meals?.todayLunch || 0) + (stats?.meals?.todayDinner || 0))}`}
            icon={UtensilsCrossed}
            variant="amber"
          />
        </div>

        {/* Interactive Data Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expenses Bar Chart */}
          <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 mb-1">
              চলতি মাসের আর্থিক প্রবাহ
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              ভাড়া আদায়, মিলের অগ্রিম জমা, মোট ব্যয় ও বাজার খরচের চিত্র
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialComparisonData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                  <Tooltip
                    formatter={(value: any) => [`৳ ${toBengaliNumber(value)}`, 'টাকা']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="টাকা" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Seat Occupancy Pie Chart */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800 mb-1">
                সিট ব্যবহারের অবস্থা
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                মোট {toBengaliNumber(stats?.occupancy?.totalSeats || 0)}টি সিটের বিভাজন
              </p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {occupancyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${toBengaliNumber(val)} টি`, 'সংখ্যা']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center text-xs font-semibold text-slate-500 mt-2">
              ফাঁকা সিট রয়েছে: <span className="text-emerald-700 font-bold">{toBengaliNumber(stats?.occupancy?.availableSeats || 0)}টি</span>
            </div>
          </div>
        </div>

        {/* Today's Meals and Quick Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Meals Tally */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-blue-800" />
              <span>আজকের রান্না প্রস্তুতি</span>
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">সকালের নাস্তা</span>
                <span className="text-base font-bold text-blue-900">
                  {toBengaliNumber(stats?.meals?.todayBreakfast || 0)} টি
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">দুপুরের খাবার</span>
                <span className="text-base font-bold text-blue-900">
                  {toBengaliNumber(stats?.meals?.todayLunch || 0)} টি
                </span>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700">রাতের খাবার</span>
                <span className="text-base font-bold text-blue-900">
                  {toBengaliNumber(stats?.meals?.todayDinner || 0)} টি
                </span>
              </div>
            </div>
          </div>

          {/* Recent Admissions */}
          <div className="lg:col-span-2 p-6 bg-white rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800">
                সাম্প্রতিক ভর্তি হওয়া বর্ডার
              </h2>
              <Link href="/residents" className="text-xs font-bold text-blue-800 hover:underline">
                সকল বর্ডার দেখুন →
              </Link>
            </div>
            {stats?.recentAdmissions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="p-3">আইডি</th>
                      <th className="p-3">নাম</th>
                      <th className="p-3">রুম ও সিট</th>
                      <th className="p-3">মোবাইল</th>
                      <th className="p-3">ভর্তির তারিখ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats.recentAdmissions.map((res: any) => (
                      <tr key={res._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-blue-900">{res.residentId}</td>
                        <td className="p-3 font-semibold text-slate-800">{res.fullName}</td>
                        <td className="p-3 text-slate-600">
                          {res.roomId?.roomNumber || '—'} ({res.seatId?.seatNumber || '—'})
                        </td>
                        <td className="p-3 text-slate-600">{toBengaliNumber(res.phone)}</td>
                        <td className="p-3 text-slate-500">{formatBengaliDate(res.admissionDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                এখনো কোনো বর্ডার নিবন্ধিত হয়নি
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
