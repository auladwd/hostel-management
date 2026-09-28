import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBuilding extends Document {
  name: string; // e.g. "ভবন-১ (প্রধান ভবন)"
  code: string; // e.g. "BLD-A"
  totalFloors: number;
  address?: string;
  caretakerName?: string;
  caretakerPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    totalFloors: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },
    address: {
      type: String,
      default: '',
    },
    caretakerName: {
      type: String,
      default: '',
    },
    caretakerPhone: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

export const Building: Model<IBuilding> =
  mongoose.models.Building || mongoose.model<IBuilding>('Building', BuildingSchema);

export default Building;
