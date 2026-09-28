import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResidentMealSummary {
  residentId: mongoose.Types.ObjectId;
  residentName: string;
  roomNumber: string;
  seatNumber: string;
  totalUnits: number;
  mealBillPoisha: number;
  totalDepositPoisha: number;
  balancePoisha: number; // positive = excess credit/refund, negative = due
}

export interface IMonthlyMealSettlement extends Document {
  billingMonth: string; // "YYYY-MM" e.g. "2026-10"
  totalBazarCostPoisha: number;
  extraMessExpensesPoisha: number; // Cook salary, extra gas cylinder, etc.
  totalMessCostPoisha: number;
  totalMealUnits: number;
  calculatedMealRatePoisha: number; // Poisha per unit
  residentBreakdown: IResidentMealSummary[];
  status: 'DRAFT' | 'LOCKED';
  lockedAt?: Date;
  lockedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentMealSummarySchema = new Schema<IResidentMealSummary>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    residentName: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      default: '',
    },
    seatNumber: {
      type: String,
      default: '',
    },
    totalUnits: {
      type: Number,
      required: true,
      default: 0,
    },
    mealBillPoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDepositPoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    balancePoisha: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { _id: false }
);

const MonthlyMealSettlementSchema = new Schema<IMonthlyMealSettlement>(
  {
    billingMonth: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    totalBazarCostPoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    extraMessExpensesPoisha: {
      type: Number,
      default: 0,
    },
    totalMessCostPoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMealUnits: {
      type: Number,
      required: true,
      default: 0,
    },
    calculatedMealRatePoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    residentBreakdown: {
      type: [ResidentMealSummarySchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['DRAFT', 'LOCKED'],
      default: 'DRAFT',
      index: true,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const MonthlyMealSettlement: Model<IMonthlyMealSettlement> =
  mongoose.models.MonthlyMealSettlement ||
  mongoose.model<IMonthlyMealSettlement>('MonthlyMealSettlement', MonthlyMealSettlementSchema);

export default MonthlyMealSettlement;
