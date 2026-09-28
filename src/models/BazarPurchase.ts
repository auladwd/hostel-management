import mongoose, { Schema, Document, Model } from 'mongoose';

export type BazarCategory =
  | 'GROCERY'
  | 'VEGETABLES'
  | 'FISH_AND_MEAT'
  | 'SPICES_OIL'
  | 'GAS_AND_FUEL'
  | 'OTHER';

export interface IBazarItem {
  itemName: string;
  quantity: number;
  unit: string; // e.g. "কেজি", "লিটার", "পিস", "হালি", "গ্রাম"
  unitPricePoisha: number;
  totalPricePoisha: number;
}

export interface IBazarPurchase extends Document {
  voucherNumber: string; // e.g. "BZR-202610-001"
  purchaseDate: string; // "YYYY-MM-DD"
  category: BazarCategory;
  items: IBazarItem[];
  totalAmountPoisha: number;
  purchasedBy: string; // Name of person who did the bazar
  purchasedByResidentId?: mongoose.Types.ObjectId;
  receiptImageUrl?: string;
  receiptPublicId?: string;
  isApproved: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BazarItemSchema = new Schema<IBazarItem>(
  {
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    unit: {
      type: String,
      required: true,
      default: 'কেজি',
    },
    unitPricePoisha: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPricePoisha: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const BazarPurchaseSchema = new Schema<IBazarPurchase>(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    purchaseDate: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['GROCERY', 'VEGETABLES', 'FISH_AND_MEAT', 'SPICES_OIL', 'GAS_AND_FUEL', 'OTHER'],
      default: 'GROCERY',
    },
    items: {
      type: [BazarItemSchema],
      required: true,
      validate: [(val: IBazarItem[]) => val.length > 0, 'কমপক্ষে একটি বাজার আইটেম যোগ করুন'],
    },
    totalAmountPoisha: {
      type: Number,
      required: true,
      min: 1,
    },
    purchasedBy: {
      type: String,
      required: true,
      trim: true,
    },
    purchasedByResidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
    },
    receiptImageUrl: {
      type: String,
      default: '',
    },
    receiptPublicId: {
      type: String,
      default: '',
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
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

BazarPurchaseSchema.index({ purchaseDate: -1 });

export const BazarPurchase: Model<IBazarPurchase> =
  mongoose.models.BazarPurchase ||
  mongoose.model<IBazarPurchase>('BazarPurchase', BazarPurchaseSchema);

export default BazarPurchase;
