import mongoose, { Schema, Document, Model } from 'mongoose';

export type ResidentStatus = 'ACTIVE' | 'ON_LEAVE' | 'CHECKED_OUT' | 'EXPELLED';

export interface IResident extends Document {
  residentId: string; // e.g. "HST-2026-001"
  userId?: mongoose.Types.ObjectId; // linked User account for portal access
  fullName: string;
  fullNameEn?: string;
  photoUrl?: string;
  photoPublicId?: string;
  phone: string;
  email?: string;
  nidOrBirthCert: string;
  documentType: 'NID' | 'BIRTH_CERTIFICATE' | 'STUDENT_ID' | 'PASSPORT';
  documentUrl?: string;
  dateOfBirth?: Date;
  bloodGroup?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  presentAddress: string;
  permanentAddress: string;
  // Guardian Information
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianAddress?: string;
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  // Academic / Occupation Info
  institutionOrWorkplace: string;
  designationOrDepartment?: string;
  idCardNumber?: string;
  // Allocation Reference
  buildingId?: mongoose.Types.ObjectId;
  roomId?: mongoose.Types.ObjectId;
  seatId?: mongoose.Types.ObjectId;
  admissionDate: Date;
  monthlyRentPoisha: number;
  securityDepositPoisha: number;
  status: ResidentStatus;
  checkoutDate?: Date;
  checkoutRemarks?: string;
  createdById?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResidentSchema = new Schema<IResident>(
  {
    residentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    fullNameEn: {
      type: String,
      default: '',
      trim: true,
    },
    photoUrl: {
      type: String,
      default: '',
    },
    photoPublicId: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    nidOrBirthCert: {
      type: String,
      required: true,
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['NID', 'BIRTH_CERTIFICATE', 'STUDENT_ID', 'PASSPORT'],
      default: 'NID',
    },
    documentUrl: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''],
      default: '',
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      default: 'MALE',
    },
    presentAddress: {
      type: String,
      required: true,
    },
    permanentAddress: {
      type: String,
      required: true,
    },
    guardianName: {
      type: String,
      required: true,
    },
    guardianRelation: {
      type: String,
      required: true,
    },
    guardianPhone: {
      type: String,
      required: true,
    },
    guardianAddress: {
      type: String,
      default: '',
    },
    emergencyContactName: {
      type: String,
      required: true,
    },
    emergencyContactRelation: {
      type: String,
      required: true,
    },
    emergencyContactPhone: {
      type: String,
      required: true,
    },
    institutionOrWorkplace: {
      type: String,
      required: true,
    },
    designationOrDepartment: {
      type: String,
      default: '',
    },
    idCardNumber: {
      type: String,
      default: '',
    },
    buildingId: {
      type: Schema.Types.ObjectId,
      ref: 'Building',
      default: null,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    seatId: {
      type: Schema.Types.ObjectId,
      ref: 'Seat',
      default: null,
    },
    admissionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    monthlyRentPoisha: {
      type: Number,
      required: true,
      default: 350000,
    },
    securityDepositPoisha: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'CHECKED_OUT', 'EXPELLED'],
      default: 'ACTIVE',
      index: true,
    },
    checkoutDate: {
      type: Date,
      default: null,
    },
    checkoutRemarks: {
      type: String,
      default: '',
    },
    createdById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ResidentSchema.index({ fullName: 'text', phone: 'text', residentId: 'text' });

export const Resident: Model<IResident> =
  mongoose.models.Resident || mongoose.model<IResident>('Resident', ResidentSchema);

export default Resident;
