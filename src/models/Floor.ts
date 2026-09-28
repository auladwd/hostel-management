import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFloor extends Document {
  buildingId: mongoose.Types.ObjectId;
  floorNumber: number; // 0 for Ground Floor, 1 for 1st Floor, etc.
  name: string; // e.g. "নিচতলা", "১ম তলা"
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FloorSchema = new Schema<IFloor>(
  {
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      required: true,
      index: true,
    },
    floorNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

FloorSchema.index({ buildingId: 1, floorNumber: 1 }, { unique: true });

export const Floor: Model<IFloor> =
  mongoose.models.Floor || mongoose.model<IFloor>('Floor', FloorSchema);

export default Floor;
