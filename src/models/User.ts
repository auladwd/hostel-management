import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'OWNER' | 'HOSTEL_MANAGER' | 'ACCOUNTANT' | 'MEAL_MANAGER' | 'STAFF' | 'RESIDENT';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface IUser extends Document {
  firebaseUid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  role: UserRole;
  status: UserStatus;
  linkedResidentId?: mongoose.Types.ObjectId;
  linkedStaffId?: mongoose.Types.ObjectId;
  permissions?: string[];
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    photoURL: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      enum: ['OWNER', 'HOSTEL_MANAGER', 'ACCOUNTANT', 'MEAL_MANAGER', 'STAFF', 'RESIDENT'],
      default: 'RESIDENT',
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      index: true,
    },
    linkedResidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
    },
    linkedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    permissions: {
      type: [String],
      default: [],
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
