import mongoose, { Schema, Document, Model } from 'mongoose';

export type AllocationStatus = 'ACTIVE' | 'TRANSFERRED' | 'VACATED' | 'CANCELLED';

export interface ISeatAllocation extends Document {
  residentId: mongoose.Types.ObjectId;
  seatId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  buildingId: mongoose.Types.ObjectId;
  allocatedFrom: Date;
  allocatedUntil?: Date;
  actualVacatedDate?: Date;
  agreedMonthlyRentPoisha: number;
  securityDepositPoisha: number;
  status: AllocationStatus;
  transferredToSeatId?: mongoose.Types.ObjectId;
  reasonForVacateOrTransfer?: string;
  allocatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SeatAllocationSchema = new Schema<ISeatAllocation>(
  {
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
    },
    allocatedFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    allocatedUntil: {
      type: Date,
      default: null,
    },
    actualVacatedDate: {
      type: Date,
      default: null,
    },
    agreedMonthlyRentPoisha: {
      type: Number,
      required: true,
    },
    securityDepositPoisha: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'TRANSFERRED', 'VACATED', 'CANCELLED'],
      default: 'ACTIVE',
      index: true,
    },
    transferredToSeatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      default: null,
    },
    reasonForVacateOrTransfer: {
      type: String,
      default: '',
    },
    allocatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure only 1 ACTIVE allocation exists per seat at any time
SeatAllocationSchema.index(
  { seatId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
  }
);

export const SeatAllocation: Model<ISeatAllocation> =
  mongoose.models.SeatAllocation ||
  mongoose.model<ISeatAllocation>('SeatAllocation', SeatAllocationSchema);

export default SeatAllocation;
