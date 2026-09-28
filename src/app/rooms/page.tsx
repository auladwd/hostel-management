'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Bed,
  CheckCircle2,
  AlertCircle,
  Filter,
  UserCheck,
  ArrowRightLeft,
  LogOut,
  Settings,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  formatBengaliCurrency,
  toBengaliNumber,
  SEAT_STATUS_LABELS,
} from '@/lib/bengali';
import { SeatStatus } from '@/models/Seat';

export default function RoomsPage() {
  const { success, error } = useToast();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isBuildingModalOpen, setIsBuildingModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<any | null>(null);
  const [isSeatActionModalOpen, setIsSeatActionModalOpen] = useState(false);

  // Building Form State
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    code: '',
    totalFloors: 3,
    address: '',
    caretakerName: '',
    caretakerPhone: '',
  });

  // Room Form State
  const [roomForm, setRoomForm] = useState({
    buildingId: '',
    floorId: '',
    roomNumber: '',
    roomType: 'DOUBLE',
    capacity: 2,
    hasAttachedBath: false,
    hasBalcony: false,
    hasAirConditioner: false,
    baseRentTaka: 3500,
  });

  // Seat Action State
  const [actionType, setActionType] = useState<'ALLOCATE' | 'TRANSFER' | 'VACATE' | 'SET_STATUS'>('ALLOCATE');
  const [targetResidentId, setTargetResidentId] = useState('');
  const [targetSeatId, setTargetSeatId] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [newSeatStatus, setNewSeatStatus] = useState<SeatStatus>('AVAILABLE');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, rRes, resRes] = await Promise.all([
        fetch('/api/buildings'),
        fetch('/api/rooms'),
        fetch('/api/residents?status=ACTIVE'),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        setBuildings(bData.data || []);
        if (bData.data?.length > 0 && !selectedBuildingId) {
          setSelectedBuildingId(bData.data[0]._id);
        }
      }

      if (rRes.ok) {
        const rData = await rRes.json();
        setRooms(rData.data || []);
      }

      if (resRes.ok) {
        const resData = await resRes.json();
        setResidents(resData.data || []);
      }
    } catch (e) {
      console.error(e);
      error('তথ্য লোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Building Creation
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/buildings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildingForm),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success('নতুন ভবন সফলভাবে যুক্ত হয়েছে');
      setIsBuildingModalOpen(false);
      setBuildingForm({ name: '', code: '', totalFloors: 3, address: '', caretakerName: '', caretakerPhone: '' });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'ভবন তৈরি করা যায়নি';
      error(msg);
    }
  };

  // Handle Room Creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedBld = buildings.find((b) => b._id === (roomForm.buildingId || selectedBuildingId));
      if (!selectedBld) throw new Error('ভবন নির্বাচন করুন');

      // Default to 1st floor if not chosen
      const payload = {
        ...roomForm,
        buildingId: selectedBld._id,
        floorId: roomForm.floorId || selectedBld._id, // API handles or creates floor
      };

      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success('রুম ও সিট সফলভাবে তৈরি হয়েছে');
      setIsRoomModalOpen(false);
      setRoomForm({
        buildingId: '',
        floorId: '',
        roomNumber: '',
        roomType: 'DOUBLE',
        capacity: 2,
        hasAttachedBath: false,
        hasBalcony: false,
        hasAirConditioner: false,
        baseRentTaka: 3500,
      });
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'রুম তৈরি করা যায়নি';
      error(msg);
    }
  };

  // Handle Seat Action (Allocate / Transfer / Vacate / Set Status)
  const handleSeatAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;

    try {
      const res = await fetch('/api/seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          seatId: selectedSeat._id,
          residentId: targetResidentId,
          targetSeatId,
          reason: actionReason,
          newStatus: newSeatStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      success(data.message);
      setIsSeatActionModalOpen(false);
      setSelectedSeat(null);
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'সিট অ্যাকশন সম্পন্ন করা যায়নি';
      error(msg);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedBuildingId && r.buildingId?._id !== selectedBuildingId && r.buildingId !== selectedBuildingId) {
      return false;
    }
    return true;
  });

  // Available seats for transfer
  const availableSeats = rooms
    .flatMap((r) => r.seats || [])
    .filter((s) => s.status === 'AVAILABLE');

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              ভবন, রুম ও সিট বিন্যাস
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              সিটের বর্তমান অবস্থা পর্যবেক্ষণ, নতুন বর্ডার বরাদ্দ ও সিট পরিবর্তন
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBuildingModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              <Building2 className="w-4 h-4 text-blue-800" />
              <span>নতুন ভবন</span>
            </button>
            <button
              onClick={() => {
                setRoomForm((prev) => ({ ...prev, buildingId: selectedBuildingId }));
                setIsRoomModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-900 hover:bg-blue-800 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন রুম ও সিট</span>
            </button>
          </div>
        </div>

        {/* Buildings Overview Tabs */}
        {buildings.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {buildings.map((b) => (
              <button
                key={b._id}
                onClick={() => setSelectedBuildingId(b._id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedBuildingId === b._id
                    ? 'bg-blue-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>{b.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    selectedBuildingId === b._id
                      ? 'bg-blue-800 text-blue-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {toBengaliNumber(b.occupiedSeats || 0)}/{toBengaliNumber(b.totalSeats || 0)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-white rounded-2xl border border-slate-200 text-xs font-medium">
          <span className="text-slate-500 font-bold">সিট নির্দেশিকা:</span>
          {Object.entries(SEAT_STATUS_LABELS).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full border ${val.bg}`}></span>
              <span className={val.color}>{val.label}</span>
            </div>
          ))}
        </div>

        {/* Rooms & Seats Visual Grid */}
        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : filteredRooms.length === 0 ? (
          <EmptyState
            title="কোনো রুম পাওয়া যায়নি"
            description="এই ভবনে এখনো কোনো রুম তৈরি করা হয়নি। নতুন রুম ও সিট যোগ করুন।"
            icon={Building2}
            actionText="নতুন রুম তৈরি করুন"
            onAction={() => setIsRoomModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {/* Room Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">
                        রুম {room.roomNumber}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {room.roomType}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      ভাড়া: {formatBengaliCurrency(room.baseRentPoisha / 100)} / মাস
                    </div>
                  </div>

                  {/* Amenities Badges */}
                  <div className="flex items-center gap-1 text-[11px] font-semibold">
                    {room.hasAirConditioner && (
                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                        AC
                      </span>
                    )}
                    {room.hasAttachedBath && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                        বাথ
                      </span>
                    )}
                    {room.hasBalcony && (
                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-md">
                        বারান্দা
                      </span>
                    )}
                  </div>
                </div>

                {/* Seats Visual Box */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    সিটসমূহ ({toBengaliNumber(room.seats?.length || 0)}টি)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {room.seats?.map((seat: any) => {
                      const statusConfig =
                        SEAT_STATUS_LABELS[seat.status as keyof typeof SEAT_STATUS_LABELS] ||
                        SEAT_STATUS_LABELS.AVAILABLE;

                      return (
                        <div
                          key={seat._id}
                          onClick={() => {
                            setSelectedSeat(seat);
                            if (seat.status === 'AVAILABLE') {
                              setActionType('ALLOCATE');
                            } else if (seat.status === 'OCCUPIED') {
                              setActionType('TRANSFER');
                            } else {
                              setActionType('SET_STATUS');
                            }
                            setIsSeatActionModalOpen(true);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${statusConfig.bg} relative group`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-800">
                              {seat.seatNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border ${statusConfig.color}`}
                            >
                              {statusConfig.label}
                            </span>
                          </div>

                          {seat.currentResidentId ? (
                            <div className="mt-1">
                              <div className="text-xs font-bold text-slate-900 line-clamp-1">
                                {seat.currentResidentId.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                আইডি: {seat.currentResidentId.residentId}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-emerald-800/80 font-medium">
                              বরাদ্দ করতে ক্লিক করুন
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between px-5 font-semibold">
                  <span>বরাদ্দকৃত: {toBengaliNumber(room.occupiedCount || 0)}</span>
                  <span className="text-emerald-700">ফাঁকা: {toBengaliNumber(room.availableCount || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 1. Modal: Add Building */}
        <Modal
          isOpen={isBuildingModalOpen}
          onClose={() => setIsBuildingModalOpen(false)}
          title="নতুন হোস্টেল ভবন যোগ করুন"
          subtitle="ভবনের নাম, কোড ও মোট তলার বিবরণ লিখুন"
        >
          <form onSubmit={handleCreateBuilding} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ভবনের নাম (বাংলায়) *
              </label>
              <input
                type="text"
                required
                placeholder="যেমন: নিলয় ভবন / ভবন-২"
                value={buildingForm.name}
                onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ভবন কোড *
                </label>
                <input
                  type="text"
                  required
                  placeholder="BLD-B"
                  value={buildingForm.code}
                  onChange={(e) => setBuildingForm({ ...buildingForm, code: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  মোট তলা সংখ্যা *
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={buildingForm.totalFloors}
                  onChange={(e) => setBuildingForm({ ...buildingForm, totalFloors: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ভবনের ঠিকানা
              </label>
              <input
                type="text"
                placeholder="ঠিকানা লিখুন"
                value={buildingForm.address}
                onChange={(e) => setBuildingForm({ ...buildingForm, address: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsBuildingModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                ভবন সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* 2. Modal: Add Room & Seats */}
        <Modal
          isOpen={isRoomModalOpen}
          onClose={() => setIsRoomModalOpen(false)}
          title="নতুন রুম ও সিট তৈরি করুন"
          subtitle="রুম নম্বর এবং ধারণক্ষমতা অনুযায়ী স্বয়ংক্রিয়ভাবে সিট তৈরি হবে"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ভবন নির্বাচন করুন *
              </label>
              <select
                required
                value={roomForm.buildingId || selectedBuildingId}
                onChange={(e) => setRoomForm({ ...roomForm, buildingId: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
              >
                {buildings.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  রুম নম্বর *
                </label>
                <input
                  type="text"
                  required
                  placeholder="১০১, ২০২ ইত্যাদি"
                  value={roomForm.roomNumber}
                  onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  রুমের ধরন
                </label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="SINGLE">একক সিট (Single)</option>
                  <option value="DOUBLE">দ্বৈত সিট (Double)</option>
                  <option value="TRIPLE">তিন সিট (Triple)</option>
                  <option value="FOUR_BED">চার সিট (Four-bed)</option>
                  <option value="DORMITORY">ডরমিটরি (Dormitory)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  সিট ধারণক্ষমতা (Capacity) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={roomForm.capacity}
                  onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রতি সিটের মাসিক ভাড়া (টাকা) *
                </label>
                <input
                  type="number"
                  min="500"
                  required
                  value={roomForm.baseRentTaka}
                  onChange={(e) => setRoomForm({ ...roomForm, baseRentTaka: Number(e.target.value) })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            {/* Room Amenities */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">সুবিধাসমূহ:</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomForm.hasAirConditioner}
                    onChange={(e) => setRoomForm({ ...roomForm, hasAirConditioner: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span>এসি (Air Conditioner)</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomForm.hasAttachedBath}
                    onChange={(e) => setRoomForm({ ...roomForm, hasAttachedBath: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span>অ্যাটাচড ওয়াশরুম</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roomForm.hasBalcony}
                    onChange={(e) => setRoomForm({ ...roomForm, hasBalcony: e.target.checked })}
                    className="rounded text-blue-900"
                  />
                  <span>বারান্দা (Balcony)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsRoomModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                রুম ও সিট তৈরি করুন
              </button>
            </div>
          </form>
        </Modal>

        {/* 3. Modal: Seat Actions (Allocate / Transfer / Vacate) */}
        <Modal
          isOpen={isSeatActionModalOpen}
          onClose={() => setIsSeatActionModalOpen(false)}
          title={`সিট অ্যাকশন: ${selectedSeat?.seatNumber}`}
          subtitle={`বর্তমান স্ট্যাটাস: ${selectedSeat ? SEAT_STATUS_LABELS[selectedSeat.status as keyof typeof SEAT_STATUS_LABELS]?.label : ''}`}
        >
          <form onSubmit={handleSeatAction} className="space-y-4">
            {/* Action Type Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              {selectedSeat?.status === 'AVAILABLE' && (
                <button
                  type="button"
                  onClick={() => setActionType('ALLOCATE')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    actionType === 'ALLOCATE' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  বরাদ্দ প্রদান
                </button>
              )}
              {selectedSeat?.status === 'OCCUPIED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType('TRANSFER')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      actionType === 'TRANSFER' ? 'bg-white text-blue-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    সিট বদল (Transfer)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('VACATE')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      actionType === 'VACATE' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    সিট ত্যাগ (Vacate)
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setActionType('SET_STATUS')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  actionType === 'SET_STATUS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                স্ট্যাটাস পরিবর্তন
              </button>
            </div>

            {/* ACTION: ALLOCATE */}
            {actionType === 'ALLOCATE' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বর্ডার নির্বাচন করুন *
                </label>
                <select
                  required
                  value={targetResidentId}
                  onChange={(e) => setTargetResidentId(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="">বর্ডার বেছে নিন...</option>
                  {residents.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName} ({r.residentId}) - {r.phone}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  সিট বরাদ্দের সাথে সাথে বর্ডারের প্রোফাইলে এই সিট ও ভাড়া যুক্ত হয়ে যাবে।
                </p>
              </div>
            )}

            {/* ACTION: TRANSFER */}
            {actionType === 'TRANSFER' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-xl text-xs text-blue-900 font-semibold">
                  বর্তমান বর্ডার: {selectedSeat?.currentResidentId?.fullName}
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    নতুন ফাঁকা সিট নির্বাচন করুন *
                  </label>
                  <select
                    required
                    value={targetSeatId}
                    onChange={(e) => setTargetSeatId(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="">নতুন সিট বেছে নিন...</option>
                    {availableSeats.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.seatNumber} (ভাড়া: ৳ {s.monthlyRentPoisha / 100})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সিট বদলের কারণ
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: বড় রুমে স্থানান্তর"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* ACTION: VACATE */}
            {actionType === 'VACATE' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs font-semibold">
                  সতর্কতা: সিটটি ফাঁকা করা হলে {selectedSeat?.currentResidentId?.fullName}-এর বর্তমান সক্রিয় আসন শেষ হবে এবং তার স্ট্যাটাস চেক-আউটে রূপান্তরিত হবে।
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    সিট ত্যাগের কারণ
                  </label>
                  <input
                    type="text"
                    placeholder="কোর্স শেষ / হোস্টেল ত্যাগ"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* ACTION: SET STATUS */}
            {actionType === 'SET_STATUS' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নতুন স্ট্যাটাস নির্ধারণ করুন *
                </label>
                <select
                  value={newSeatStatus}
                  onChange={(e) => setNewSeatStatus(e.target.value as SeatStatus)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="AVAILABLE">ফাঁকা আছে (Available)</option>
                  <option value="RESERVED">সংরক্ষিত (Reserved)</option>
                  <option value="MAINTENANCE">মেরামত চলছে (Maintenance)</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsSeatActionModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-xs"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
