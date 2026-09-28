import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVisitorRecord extends Document {
  visitorName: string;
  visitorPhone: string;
  residentId: mongoose.Types.ObjectId;
  relationWithResident: string;
  purpose: string;
  nidOrIdNumber?: string;
  entryTime: Date;
  exitTime?: Date;
  recordedBy: mongoose.Types.ObjectId;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VisitorRecordSchema = new Schema<IVisitorRecord>(
  {
    visitorName: {
      type: String,
      required: true,
      trim: true,
    },
    visitorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    residentId: {
      type: Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
      index: true,
    },
    relationWithResident: {
      type: String,
      required: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    nidOrIdNumber: {
      type: String,
      default: '',
    },
    entryTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    exitTime: {
      type: Date,
      default: null,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

VisitorRecordSchema.index({ entryTime: -1 });

export const VisitorRecord: Model<IVisitorRecord> =
  mongoose.models.VisitorRecord ||
  mongoose.model<IVisitorRecord>('VisitorRecord', VisitorRecordSchema);

export default VisitorRecord;
