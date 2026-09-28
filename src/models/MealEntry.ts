import mongoose, { Schema, Document, Model } from 'mongoose';

export type MealEntryStatus = 'ACTIVE' | 'CANCELLED_BY_RESIDENT' | 'APPROVED_BY_MANAGER';

export interface IMealEntry extends Document {
  residentId: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  // Regular meals
  breakfast: number; // 0 or 1
  lunch: number; // 0, 1, 2
  dinner: number; // 0, 1, 2
  // Guest meals
  guestBreakfast: number;
  guestLunch: number;
  guestDinner: number;
  // Weighted meal units
  totalUnits: number;
  status: MealEntryStatus;
  cancellationCutoffPassed?: boolean;
  cancelledAt?: Date;
  notes?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MealEntrySchema = new Schema<IMealEntry>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true, // "YYYY-MM-DD" format allows fast day and month filtering
    },
    breakfast: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    lunch: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    dinner: {
      type: Number,
      default: 1,
      min: 0,
      max: 10,
    },
    guestBreakfast: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    guestLunch: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    guestDinner: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    totalUnits: {
      type: Number,
      required: true,
      default: 2.5, // e.g. 0.5 + 1.0 + 1.0
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED_BY_RESIDENT', 'APPROVED_BY_MANAGER'],
      default: 'ACTIVE',
      index: true,
    },
    cancellationCutoffPassed: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Only 1 entry per resident per date
MealEntrySchema.index({ residentId: 1, date: 1 }, { unique: true });

export const MealEntry: Model<IMealEntry> =
  mongoose.models.MealEntry || mongoose.model<IMealEntry>('MealEntry', MealEntrySchema);

export default MealEntry;
