import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStaffSalary extends Document {
  voucherNumber: string; // e.g. "SLR-202610-001"
  staffId: mongoose.Types.ObjectId;
  salaryMonth: string; // "YYYY-MM" e.g. "2026-10"
  baseSalaryPoisha: number;
  bonusPoisha: number;
  deductionsPoisha: number;
  netPayablePoisha: number;
  paidAmountPoisha: number;
  paymentDate: Date;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'BKASH' | 'NAGAD';
  transactionReference?: string;
  paidBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSalarySchema = new Schema<IStaffSalary>(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    staffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: true,
      index: true,
    },
    salaryMonth: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    baseSalaryPoisha: {
      type: Number,
      required: true,
    },
    bonusPoisha: {
      type: Number,
      default: 0,
    },
    deductionsPoisha: {
      type: Number,
      default: 0,
    },
    netPayablePoisha: {
      type: Number,
      required: true,
    },
    paidAmountPoisha: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'BKASH', 'NAGAD'],
      default: 'CASH',
    },
    transactionReference: {
      type: String,
      default: '',
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

StaffSalarySchema.index({ staffId: 1, salaryMonth: 1 }, { unique: true });

export const StaffSalary: Model<IStaffSalary> =
  mongoose.models.StaffSalary || mongoose.model<IStaffSalary>('StaffSalary', StaffSalarySchema);

export default StaffSalary;
