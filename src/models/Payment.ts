import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER';
export type PaymentPurpose = 'RENT_INVOICE' | 'SECURITY_DEPOSIT' | 'ADMISSION_FEE' | 'MEAL_DEPOSIT' | 'OTHER';

export interface IPayment extends Document {
  receiptNumber: string; // e.g. "RCT-202610-0001"
  residentId: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId; // null if advance meal deposit or separate security deposit
  purpose: PaymentPurpose;
  amountPoisha: number;
  paymentMethod: PaymentMethod;
  transactionId?: string; // e.g. bKash TrxID
  bankAccountDetails?: string;
  paymentDate: Date;
  collectedBy: mongoose.Types.ObjectId;
  remarks?: string;
  isCancelled: boolean;
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'RentInvoice',
      default: null,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['RENT_INVOICE', 'SECURITY_DEPOSIT', 'ADMISSION_FEE', 'MEAL_DEPOSIT', 'OTHER'],
      default: 'RENT_INVOICE',
      index: true,
    },
    amountPoisha: {
      type: Number,
      required: true,
      min: 1, // At least 1 poisha
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BKASH', 'NAGAD', 'ROCKET', 'BANK_TRANSFER'],
      required: true,
    },
    transactionId: {
      type: String,
      default: '',
      trim: true,
    },
    bankAccountDetails: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    remarks: {
      type: String,
      default: '',
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.index({ residentId: 1, paymentDate: -1 });

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
