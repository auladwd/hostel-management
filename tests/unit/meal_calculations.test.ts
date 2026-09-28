import assert from 'node:assert';

console.log('Testing: Mess Meal Rate and Settlement Calculations...');

// Configured meal weights
const weights = {
  breakfast: 0.5,
  lunch: 1.0,
  dinner: 1.0,
};

// 1. Daily Meal unit calculation
function calculateUnits(
  b: number,
  l: number,
  d: number,
  gb: number = 0,
  gl: number = 0,
  gd: number = 0
): number {
  return (
    (b + gb) * weights.breakfast +
    (l + gl) * weights.lunch +
    (d + gd) * weights.dinner
  );
}

const day1Units = calculateUnits(1, 1, 1);
assert.strictEqual(day1Units, 2.5, 'Regular full day meal must equal 2.5 units');

const day2UnitsWithGuest = calculateUnits(1, 2, 1, 1, 1, 0); // 1 breakfast + 1 guest breakfast, 2 lunch + 1 guest lunch, 1 dinner
// (2 * 0.5) + (3 * 1.0) + (1 * 1.0) = 1.0 + 3.0 + 1.0 = 5.0 units
assert.strictEqual(day2UnitsWithGuest, 5.0, 'Day with guests must equal 5.0 units');

// 2. Monthly Meal Rate calculation
const totalBazarCostPoisha = 345500; // ৳ 3,455
const extraMessExpensesPoisha = 100000; // ৳ 1,000 (gas, cook)
const grandTotalMessCostPoisha = totalBazarCostPoisha + extraMessExpensesPoisha; // 445500 poisha (৳ 4,455)

const resident1Units = 45.0;
const resident2Units = 50.0;
const totalMealUnits = resident1Units + resident2Units; // 95.0 units

const mealRatePoisha = Math.round(grandTotalMessCostPoisha / totalMealUnits);
// 445500 / 95 = 4689.47 -> 4689 poisha (৳ 46.89 per unit)
assert.strictEqual(mealRatePoisha, 4689, 'Calculated meal rate must be 4689 poisha');

// 3. Resident Charges & Balance Settlement
const res1MealChargePoisha = Math.round(resident1Units * mealRatePoisha); // 45 * 4689 = 211005 poisha (৳ 2,110.05)
assert.strictEqual(res1MealChargePoisha, 211005, 'Resident 1 meal charge must be 211005 poisha');

const res1AdvanceDepositPoisha = 300000; // ৳ 3,000 deposited
const res1NetBalancePoisha = res1AdvanceDepositPoisha - res1MealChargePoisha; // +88995 poisha refund/credit
assert.strictEqual(res1NetBalancePoisha, 88995, 'Resident 1 must have 88995 poisha (৳ 889.95) surplus credit');

// 4. Safe Zero-Meal Month Handling
const zeroUnits = 0;
const zeroRate = zeroUnits > 0 ? Math.round(grandTotalMessCostPoisha / zeroUnits) : 0;
assert.strictEqual(zeroRate, 0, 'Zero-meal month must safely return 0 without divide-by-zero crash');

console.log('✓ Mess Meal Rate & Settlement Test Passed Successfully!');
