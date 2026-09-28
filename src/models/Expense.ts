import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory =
  | 'UTILITY_ELECTRICITY'
  | 'UTILITY_GAS'
  | 'UTILITY_WATER'
  | 'UTILITY_INTERNET'
  | 'STAFF_SALARY'
  | 'MAINTENANCE_REPAIR'
  | 'CLEANING_HYGIENE'
  | 'OFFICE_RENT'
  | 'BAZAR_EXPENSE'
  | 'OTHER_EXPENSE';

export interface IExpense extends Document {
  voucherNumber: string; // e.g. "EXP-202610-001"
  category: ExpenseCategory;
  title: string;
  description?: string;
  amountPoisha: number;
  expenseDate: Date;
  paidTo: string; // Payee name
  paymentSource: 'CASH_IN_HAND' | 'BANK_ACCOUNT' | 'BKASH_MERCHANT' | 'NAGAD_MERCHANT';
  receiptImageUrl?: string;
  receiptPublicId?: string;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'UTILITY_ELECTRICITY',
        'UTILITY_GAS',
        'UTILITY_WATER',
        'UTILITY_INTERNET',
        'STAFF_SALARY',
        'MAINTENANCE_REPAIR',
        'CLEANING_HYGIENE',
        'OFFICE_RENT',
        'BAZAR_EXPENSE',
        'OTHER_EXPENSE',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    amountPoisha: {
      type: Number,
      required: true,
      min: 1,
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    paidTo: {
      type: String,
      required: true,
      trim: true,
    },
    paymentSource: {
      type: String,
      enum: ['CASH_IN_HAND', 'BANK_ACCOUNT', 'BKASH_MERCHANT', 'NAGAD_MERCHANT'],
      default: 'CASH_IN_HAND',
    },
    receiptImageUrl: {
      type: String,
      default: '',
    },
    receiptPublicId: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ expenseDate: -1, category: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
