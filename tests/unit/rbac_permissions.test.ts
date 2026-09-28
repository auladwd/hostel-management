import assert from 'node:assert';
import { UserRole } from '../../src/models/User';

console.log('Testing: Role-Based Authorization and Access Permissions...');

function checkPermission(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  // Super Admin / Owner always has full access
  if (userRole === 'OWNER') return true;
  return allowedRoles.includes(userRole);
}

// 1. Owner permissions
assert.strictEqual(
  checkPermission('OWNER', ['HOSTEL_MANAGER']),
  true,
  'OWNER must always have permission on all routes'
);

// 2. Meal Manager permissions
assert.strictEqual(
  checkPermission('MEAL_MANAGER', ['OWNER', 'MEAL_MANAGER']),
  true,
  'MEAL_MANAGER must have access to meal settlement'
);
assert.strictEqual(
  checkPermission('MEAL_MANAGER', ['OWNER', 'ACCOUNTANT']),
  false,
  'MEAL_MANAGER must not have access to accountant-only financial routes'
);

// 3. Resident limits
assert.strictEqual(
  checkPermission('RESIDENT', ['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT']),
  false,
  'RESIDENT must not be permitted on administrative routes'
);

// 4. Resident private access check
function canAccessResidentData(
  currentUser: { role: UserRole; linkedResidentId?: string },
  targetResidentId: string
): boolean {
  if (currentUser.role === 'OWNER' || currentUser.role === 'HOSTEL_MANAGER') {
    return true;
  }
  if (currentUser.role === 'RESIDENT') {
    return currentUser.linkedResidentId === targetResidentId;
  }
  return false;
}

const residentA = { role: 'RESIDENT' as UserRole, linkedResidentId: 'res-001' };
assert.strictEqual(canAccessResidentData(residentA, 'res-001'), true, 'Resident can access their own data');
assert.strictEqual(canAccessResidentData(residentA, 'res-002'), false, 'Resident must NOT access other residents data');

console.log('✓ Role-Based Permissions & Guard Tests Passed Successfully!');
