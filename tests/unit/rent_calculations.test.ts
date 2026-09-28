import assert from 'node:assert';
import { poishaToTaka, takaToPoisha, formatBengaliCurrency } from '../../src/lib/bengali';

console.log('Testing: Rent and Monetary Poisha Calculations...');

// 1. Taka to Poisha precision
const taka = 3500.50;
const poisha = takaToPoisha(taka);
assert.strictEqual(poisha, 350050, '৳ 3500.50 must convert exactly to 350050 poisha');

// 2. Poisha back to Taka precision
const recoveredTaka = poishaToTaka(poisha);
assert.strictEqual(recoveredTaka, 3500.50, '350050 poisha must recover to 3500.50 taka');

// 3. Invoice calculation test
const roomRentPoisha = 400000; // ৳ 4,000
const utilityChargesPoisha = 50000; // ৳ 500
const serviceChargesPoisha = 20000; // ৳ 200
const totalPayablePoisha = roomRentPoisha + utilityChargesPoisha + serviceChargesPoisha;
assert.strictEqual(totalPayablePoisha, 470000, 'Total payable must be 470000 poisha (৳ 4,700)');

// 4. Partial payment adjustment
const payment1 = 200000; // ৳ 2,000 paid
let remainingDue = totalPayablePoisha - payment1;
assert.strictEqual(remainingDue, 270000, 'Remaining due after partial payment must be 270000 poisha');

const payment2 = 270000; // ৳ 2,700 paid
remainingDue = remainingDue - payment2;
assert.strictEqual(remainingDue, 0, 'Remaining due after full payment must be exactly 0 poisha');

// 5. Bengali currency formatting
const formatted = formatBengaliCurrency(4700);
assert.ok(formatted.includes('৪,৭০০'), 'Bengali currency formatting must render ৪,৭০০');

console.log('✓ Rent & Poisha Calculations Test Passed Successfully!');
