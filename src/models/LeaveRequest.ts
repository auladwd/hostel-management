import mongoose, { Schema, Document, Model } from 'mongoose';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface ILeaveRequest extends Document {
  residentId: mongoose.Types.ObjectId;
  departureDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  reason: string;
  destinationAddress: string;
  emergencyPhone: string;
  status: LeaveStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvalRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    departureDate: {
      type: Date,
      required: true,
    },
    expectedReturnDate: {
      type: Date,
      required: true,
    },
    actualReturnDate: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    destinationAddress: {
      type: String,
      required: true,
      trim: true,
    },
    emergencyPhone: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalRemarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest || mongoose.model<ILeaveRequest>('LeaveRequest', LeaveRequestSchema);

export default LeaveRequest;
