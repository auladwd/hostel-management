import mongoose, { Schema, Document, Model } from 'mongoose';

export type StaffRole =
  | 'HOSTEL_MANAGER'
  | 'ACCOUNTANT'
  | 'MEAL_MANAGER'
  | 'COOK'
  | 'CLEANER'
  | 'SECURITY_GUARD'
  | 'MAINTENANCE_STAFF';

export interface IStaff extends Document {
  staffId: string; // e.g. "STF-001"
  userId?: mongoose.Types.ObjectId;
  fullName: string;
  phone: string;
  role: StaffRole;
  nid: string;
  monthlySalaryPoisha: number;
  joiningDate: Date;
  emergencyContact: string;
  status: 'ACTIVE' | 'RESIGNED' | 'SUSPENDED';
  photoUrl?: string;
  responsibilities?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StaffSchema = new Schema<IStaff>(
  {
    staffId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: [
        'HOSTEL_MANAGER',
        'ACCOUNTANT',
        'MEAL_MANAGER',
        'COOK',
        'CLEANER',
        'SECURITY_GUARD',
        'MAINTENANCE_STAFF',
      ],
      required: true,
    },
    nid: {
      type: String,
      required: true,
      trim: true,
    },
    monthlySalaryPoisha: {
      type: Number,
      required: true,
      default: 1500000, // ৳ 15,000
    },
    joiningDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    emergencyContact: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'RESIGNED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    photoUrl: {
      type: String,
      default: '',
    },
    responsibilities: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Staff: Model<IStaff> =
  mongoose.models.Staff || mongoose.model<IStaff>('Staff', StaffSchema);

export default Staff;
