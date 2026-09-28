import mongoose, { Schema, Document, Model } from 'mongoose';

export type RoomType = 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_BED' | 'DORMITORY';

export interface IRoom extends Document {
  buildingId: mongoose.Types.ObjectId;
  floorId: mongoose.Types.ObjectId;
  roomNumber: string; // e.g. "১০১", "২০২"
  roomType: RoomType;
  capacity: number;
  hasAttachedBath: boolean;
  hasBalcony: boolean;
  hasAirConditioner: boolean;
  baseRentPoisha: number; // in integer poisha
  status: 'ACTIVE' | 'MAINTENANCE';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
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
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    roomType: {
      type: String,
      enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR_BED', 'DORMITORY'],
      default: 'DOUBLE',
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    hasAttachedBath: {
      type: Boolean,
      default: false,
    },
    hasBalcony: {
      type: Boolean,
      default: false,
    },
    hasAirConditioner: {
      type: Boolean,
      default: false,
    },
    baseRentPoisha: {
      type: Number,
      required: true,
      default: 350000, // ৳ 3,500
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE'],
      default: 'ACTIVE',
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

RoomSchema.index({ buildingId: 1, roomNumber: 1 }, { unique: true });

export const Room: Model<IRoom> =
  mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);

export default Room;
