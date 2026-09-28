import assert from 'node:assert';

console.log('Testing: Seat Allocation and Occupancy Rules...');

interface MockSeat {
  id: string;
  seatNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  currentResidentId?: string | null;
}

interface MockAllocation {
  id: string;
  seatId: string;
  residentId: string;
  status: 'ACTIVE' | 'TRANSFERRED' | 'VACATED';
}

const seats: MockSeat[] = [
  { id: 's1', seatNumber: '১০১-A', status: 'AVAILABLE', currentResidentId: null },
  { id: 's2', seatNumber: '১০১-B', status: 'AVAILABLE', currentResidentId: null },
];

const allocations: MockAllocation[] = [];

// Rule 1: Cannot allocate to a non-available seat
function allocateSeat(seatId: string, residentId: string) {
  const seat = seats.find((s) => s.id === seatId);
  if (!seat || seat.status !== 'AVAILABLE') {
    throw new Error('সিটটি ফাঁকা নেই');
  }

  // Prevent double allocation of same resident
  const hasActive = allocations.some((a) => a.residentId === residentId && a.status === 'ACTIVE');
  if (hasActive) {
    throw new Error('বর্ডার ইতিমধ্যে অন্য একটি সিটে সক্রিয় রয়েছে');
  }

  seat.status = 'OCCUPIED';
  seat.currentResidentId = residentId;
  allocations.push({
    id: `alloc-${Date.now()}`,
    seatId,
    residentId,
    status: 'ACTIVE',
  });
}

// 1. Initial successful allocation
allocateSeat('s1', 'res1');
assert.strictEqual(seats[0].status, 'OCCUPIED');
assert.strictEqual(seats[0].currentResidentId, 'res1');

// 2. Collision test: Attempting to allocate occupied seat must throw
assert.throws(
  () => allocateSeat('s1', 'res2'),
  /সিটটি ফাঁকা নেই/,
  'Attempting to allocate already occupied seat must fail'
);

// 3. Resident collision: Attempting to allocate resident to second seat must throw
assert.throws(
  () => allocateSeat('s2', 'res1'),
  /বর্ডার ইতিমধ্যে অন্য একটি সিটে সক্রিয় রয়েছে/,
  'Resident with existing active seat must not be duplicate allocated'
);

// Rule 2: Transfer seat
function transferSeat(fromSeatId: string, toSeatId: string) {
  const fromSeat = seats.find((s) => s.id === fromSeatId);
  const toSeat = seats.find((s) => s.id === toSeatId);

  assert.ok(fromSeat && fromSeat.status === 'OCCUPIED');
  assert.ok(toSeat && toSeat.status === 'AVAILABLE');

  const residentId = fromSeat.currentResidentId!;

  // Deactivate old allocation
  const oldAlloc = allocations.find((a) => a.seatId === fromSeatId && a.status === 'ACTIVE');
  if (oldAlloc) oldAlloc.status = 'TRANSFERRED';

  // Vacate old seat
  fromSeat.status = 'AVAILABLE';
  fromSeat.currentResidentId = null;

  // Occupy new seat
  toSeat.status = 'OCCUPIED';
  toSeat.currentResidentId = residentId;

  allocations.push({
    id: `alloc-trans-${Date.now()}`,
    seatId: toSeatId,
    residentId,
    status: 'ACTIVE',
  });
}

// Test Transfer
transferSeat('s1', 's2');
assert.strictEqual(seats[0].status, 'AVAILABLE', 'Original seat must become available after transfer');
assert.strictEqual(seats[1].status, 'OCCUPIED', 'Target seat must become occupied after transfer');
assert.strictEqual(seats[1].currentResidentId, 'res1');

console.log('✓ Seat Allocation & Transfer Rules Passed Successfully!');
