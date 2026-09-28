import mongoose, { Schema, Document, Model } from 'mongoose';

export type ComplaintCategory =
  | 'ROOM_MAINTENANCE'
  | 'WATER_SUPPLY'
  | 'ELECTRICITY_INTERNET'
  | 'CLEANING_WASHROOM'
  | 'FOOD_QUALITY'
  | 'SECURITY_DISCIPLINE'
  | 'OTHER';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ComplaintStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface IComplaintComment {
  commentBy: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  comment: string;
  createdAt: Date;
}

export interface IComplaint extends Document {
  ticketNumber: string; // e.g. "CMP-2026-001"
  residentId: mongoose.Types.ObjectId;
  category: ComplaintCategory;
  title: string;
  description: string;
  imageUrl?: string;
  imagePublicId?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedStaffId?: mongoose.Types.ObjectId;
  resolutionNotes?: string;
  resolvedAt?: Date;
  comments: IComplaintComment[];
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintCommentSchema = new Schema<IComplaintComment>(
  {
    commentBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userRole: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const ComplaintSchema = new Schema<IComplaint>(
  {
    ticketNumber: {
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
    category: {
      type: String,
      enum: [
        'ROOM_MAINTENANCE',
        'WATER_SUPPLY',
        'ELECTRICITY_INTERNET',
        'CLEANING_WASHROOM',
        'FOOD_QUALITY',
        'SECURITY_DISCIPLINE',
        'OTHER',
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM',
    },
    status: {
      type: String,
      enum: ['SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'SUBMITTED',
      index: true,
    },
    assignedStaffId: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    comments: {
      type: [ComplaintCommentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

ComplaintSchema.index({ createdAt: -1, status: 1 });

export const Complaint: Model<IComplaint> =
  mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);

export default Complaint;
