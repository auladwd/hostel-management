import mongoose, { Schema, Document, Model } from 'mongoose';

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface IRentInvoice extends Document {
  invoiceNumber: string; // e.g. "INV-202610-0001"
  residentId: mongoose.Types.ObjectId;
  billingMonth: string; // "YYYY-MM" e.g. "2026-10"
  roomRentPoisha: number;
  utilityChargesPoisha: number;
  serviceChargesPoisha: number;
  admissionFeePoisha: number;
  securityDepositPoisha: number;
  lateFeePoisha: number;
  discountPoisha: number;
  totalPayablePoisha: number;
  paidAmountPoisha: number;
  dueAmountPoisha: number;
  status: InvoicePaymentStatus;
  dueDate: Date;
  generatedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RentInvoiceSchema = new Schema<IRentInvoice>(
  {
    invoiceNumber: {
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
    billingMonth: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    roomRentPoisha: {
      type: Number,
      required: true,
      default: 0,
    },
    utilityChargesPoisha: {
      type: Number,
      default: 0,
    },
    serviceChargesPoisha: {
      type: Number,
      default: 0,
    },
    admissionFeePoisha: {
      type: Number,
      default: 0,
    },
    securityDepositPoisha: {
      type: Number,
      default: 0,
    },
    lateFeePoisha: {
      type: Number,
      default: 0,
    },
    discountPoisha: {
      type: Number,
      default: 0,
    },
    totalPayablePoisha: {
      type: Number,
      required: true,
    },
    paidAmountPoisha: {
      type: Number,
      default: 0,
    },
    dueAmountPoisha: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      default: 'UNPAID',
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    generatedBy: {
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

// Prevent duplicate monthly invoices for the same resident
RentInvoiceSchema.index({ residentId: 1, billingMonth: 1 }, { unique: true });

export const RentInvoice: Model<IRentInvoice> =
  mongoose.models.RentInvoice || mongoose.model<IRentInvoice>('RentInvoice', RentInvoiceSchema);

export default RentInvoice;
