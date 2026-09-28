import mongoose, { Schema, Document, Model } from 'mongoose';

export type SeatStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

export interface ISeat extends Document {
  buildingId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  seatNumber: string; // e.g. "A", "B", "১০১-১"
  monthlyRentPoisha: number;
  status: SeatStatus;
  currentResidentId?: mongoose.Types.ObjectId;
  currentAllocationId?: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema = new Schema<ISeat>(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
      index: true,
    },
    floorId: {
      type: Schema.Types.ObjectId,
      ref: 'Floor',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    seatNumber: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyRentPoisha: {
      type: Number,
      required: true,
      default: 350000, // ৳ 3,500
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE'],
      default: 'AVAILABLE',
      index: true,
    },
    currentResidentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      default: null,
      index: true,
    },
    currentAllocationId: {
      type: Schema.Types.ObjectId,
      ref: 'SeatAllocation',
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

SeatSchema.index({ roomId: 1, seatNumber: 1 }, { unique: true });

export const Seat: Model<ISeat> =
  mongoose.models.Seat || mongoose.model<ISeat>('Seat', SeatSchema);

export default Seat;
