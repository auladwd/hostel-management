'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  PlusCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  Shield,
  Filter,
  Send,
  User,
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
  COMPLAINT_PRIORITY_LABELS,
  COMPLAINT_STATUS_LABELS,
} from '@/lib/bengali';

export default function ComplaintsPage() {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Complaint Form
  const [complaintForm, setComplaintForm] = useState({
    residentId: '',
    category: 'WATER_SUPPLY',
    title: '',
    description: '',
    priority: 'MEDIUM',
    imageUrl: '',
  });

  // Action / Comment Form
  const [newComment, setNewComment] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (categoryFilter !== 'ALL') queryParams.append('category', categoryFilter);

      const [cRes, rRes] = await Promise.all([
        fetch(`/api/complaints?${queryParams.toString()}`),
        fetch('/api/residents?status=ACTIVE'),
      ]);

      if (cRes.ok) {
        const json = await cRes.json();
        setComplaints(json.data || []);
      }
      if (rRes.ok) {
        const rJson = await rRes.json();
        setResidents(rJson.data || []);
      }
    } catch (e) {
      console.error(e);
      error('অভিযোগ লোড করা যায়নি');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, categoryFilter]);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(complaintForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsSubmitModalOpen(false);
      setComplaintForm({
        residentId: '',
        category: 'WATER_SUPPLY',
        title: '',
        description: '',
        priority: 'MEDIUM',
        imageUrl: '',
      });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'অভিযোগ জমা দেওয়া যায়নি';
      error(msg);
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    try {
      const res = await fetch('/api/complaints', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: selectedComplaint._id,
          status: statusUpdate || undefined,
          resolutionNotes: resolutionNotes || undefined,
          newComment: newComment || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success('অভিযোগের অগ্রগতি সফলভাবে সংরক্ষিত হয়েছে');
      setIsDetailModalOpen(false);
      setNewComment('');
      setResolutionNotes('');
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'আপডেট সম্পন্ন করা যায়নি';
      error(msg);
    }
  };

  const CATEGORY_NAMES: Record<string, string> = {
    ROOM_MAINTENANCE: 'রুম মেরামত ও ফার্নিচার',
    WATER_SUPPLY: 'পানি সরবরাহ ও প্লাম্বিং',
    ELECTRICITY_INTERNET: 'বিদ্যুৎ ও ওয়াইফাই',
    CLEANING_WASHROOM: 'ওয়াশরুম ও পরিচ্ছন্নতা',
    FOOD_QUALITY: 'খাবারের মান ও মেস',
    SECURITY_DISCIPLINE: 'নিরাপত্তা ও শৃঙ্খলা',
    OTHER: 'অন্যান্য সমস্যা',
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              অভিযোগ ও সমাধান ব্যবস্থাপনা
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              বর্ডারদের সমস্যা ও অভিযোগ ট্র্যাকিং, তদন্ত নোট এবং সমাধান অগ্রগতি
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন অভিযোগ দাখিল</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">স্ট্যাটাস:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">সকল স্ট্যাটাস</option>
              <option value="SUBMITTED">জমা হয়েছে (নতুন)</option>
              <option value="IN_PROGRESS">প্রক্রিয়াধীন</option>
              <option value="RESOLVED">সমাধানকৃত</option>
              <option value="CLOSED">সম্পন্ন</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500">ক্যাটাগরি:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
            >
              <option value="ALL">সকল সমস্যা</option>
              <option value="ROOM_MAINTENANCE">রুম মেরামত</option>
              <option value="WATER_SUPPLY">পানি সরবরাহ</option>
              <option value="ELECTRICITY_INTERNET">বিদ্যুৎ ও ইন্টারনেট</option>
              <option value="CLEANING_WASHROOM">পরিচ্ছন্নতা</option>
              <option value="FOOD_QUALITY">খাবারের মান</option>
            </select>
          </div>
        </div>

        {/* Complaints Grid */}
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : complaints.length === 0 ? (
          <EmptyState
            title="কোনো অভিযোগ পাওয়া যায়নি"
            description="বর্তমানে এই ক্যাটাগরিতে কোনো অমীমাংসিত অভিযোগ নেই।"
            icon={CheckCircle2}
            actionText="নতুন অভিযোগ জানান"
            onAction={() => setIsSubmitModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {complaints.map((c) => {
              const statusCfg =
                COMPLAINT_STATUS_LABELS[c.status as keyof typeof COMPLAINT_STATUS_LABELS] ||
                COMPLAINT_STATUS_LABELS.SUBMITTED;
              const priorityCfg =
                COMPLAINT_PRIORITY_LABELS[c.priority as keyof typeof COMPLAINT_PRIORITY_LABELS] ||
                COMPLAINT_PRIORITY_LABELS.MEDIUM;

              return (
                <div
                  key={c._id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-900">{c.ticketNumber}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                          <span className={`text-[10px] font-bold ${priorityCfg.color}`}>
                            ({priorityCfg.label})
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5 leading-snug">
                          {c.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 py-3 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 flex justify-between">
                      <span>বর্ডার: <strong className="text-slate-800">{c.residentId?.fullName}</strong></span>
                      <span>রুম: {c.residentId?.roomId?.roomNumber || '—'}</span>
                    </div>

                    {c.resolutionNotes && (
                      <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900">
                        <strong>সমাধান নোট:</strong> {c.resolutionNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-medium">
                    <span>{formatBengaliDate(c.createdAt)}</span>
                    <button
                      onClick={() => {
                        setSelectedComplaint(c);
                        setStatusUpdate(c.status);
                        setResolutionNotes(c.resolutionNotes || '');
                        setIsDetailModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 font-bold transition-colors flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>অগ্রগতি ও মন্তব্য ({toBengaliNumber(c.comments?.length || 0)})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: New Complaint */}
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="নতুন অভিযোগ দাখিল"
          subtitle="রুমের সমস্যা বা অভিযোগের সঠিক বিবরণ প্রদান করুন"
        >
          <form onSubmit={handleSubmitComplaint} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বর্ডার নির্বাচন করুন *
              </label>
              <select
                required
                value={complaintForm.residentId}
                onChange={(e) => setComplaintForm({ ...complaintForm, residentId: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">বর্ডার বেছে নিন...</option>
                {residents.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName} ({r.roomId?.roomNumber || 'রুম'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  অভিযোগের ক্যাটাগরি *
                </label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="WATER_SUPPLY">পানি সরবরাহ ও ওয়াশরুম</option>
                  <option value="ELECTRICITY_INTERNET">বিদ্যুৎ ও ইন্টারনেট</option>
                  <option value="ROOM_MAINTENANCE">রুম মেরামত ও ফার্নিচার</option>
                  <option value="CLEANING_WASHROOM">পরিচ্ছন্নতা</option>
                  <option value="FOOD_QUALITY">খাবারের মান</option>
                  <option value="SECURITY_DISCIPLINE">নিরাপত্তা ও শৃঙ্খলা</option>
                  <option value="OTHER">অন্যান্য</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  জরুরিতা (Priority) *
                </label>
                <select
                  value={complaintForm.priority}
                  onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="LOW">সাধারণ (Low)</option>
                  <option value="MEDIUM">মাঝারি (Medium)</option>
                  <option value="HIGH">জরুরি (High)</option>
                  <option value="URGENT">অতি জরুরি (Urgent)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                অভিযোগের বিষয় / শিরোনাম *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: ফ্যান কাজ করছে না / বেসিন চোকড"
                value={complaintForm.title}
                onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বিস্তারিত বিবরণ *
              </label>
              <textarea
                required
                rows={3}
                placeholder="সমস্যার বিস্তারিত বিবরণ লিখুন..."
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                অভিযোগ দাখিল করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Complaint Detail & Comment Thread */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`টিকিট: ${selectedComplaint?.ticketNumber}`}
          subtitle={selectedComplaint?.title}
          maxWidth="2xl"
        >
          {selectedComplaint && (
            <form onSubmit={handleUpdateComplaint} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p><strong>বর্ডার:</strong> {selectedComplaint.residentId?.fullName}</p>
                <p><strong>বিবরণ:</strong> {selectedComplaint.description}</p>
              </div>

              {/* Threaded Comments */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">মন্তব্য ও আলোচনা:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedComplaint.comments?.length > 0 ? (
                    selectedComplaint.comments.map((comm: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-0.5">
                          <span>{comm.userName} ({comm.userRole})</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {formatBengaliDate(comm.createdAt)} {formatBengaliTime(comm.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-600">{comm.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">এখনো কোনো মন্তব্য নেই</div>
                  )}
                </div>
              </div>

              {/* Add New Comment */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নতুন মন্তব্য যোগ করুন
                </label>
                <input
                  type="text"
                  placeholder="আপনার মন্তব্য লিখুন..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              {/* Status Update & Resolution Notes */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    স্ট্যাটাস পরিবর্তন
                  </label>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="SUBMITTED">জমা হয়েছে</option>
                    <option value="IN_PROGRESS">প্রক্রিয়াধীন</option>
                    <option value="RESOLVED">সমাধানকৃত</option>
                    <option value="CLOSED">সম্পন্ন ও বন্ধ</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সমাধান নোট
                  </label>
                  <input
                    type="text"
                    placeholder="কী সমাধান করা হয়েছে..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
                >
                  অগ্রগতি সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
