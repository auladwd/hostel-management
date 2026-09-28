import mongoose, { Schema, Document, Model } from 'mongoose';

export type ApplicationMode = 'HOSTEL_ONLY' | 'MESS_ONLY' | 'COMBINED';

export interface ISettings extends Document {
  hostelName: string;
  hostelNameEn?: string;
  tagline?: string;
  logoUrl?: string;
  address: string;
  phone: string;
  email: string;
  activeMode: ApplicationMode;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  receiptPrefix: string;
  residentIdPrefix: string;
  rentDueDay: number;
  lateFeePoisha: number;
  securityDepositPoisha: number;
  // Meal cutoff times (HH:mm in 24h Asia/Dhaka time)
  mealCutoffBreakfast: string;
  mealCutoffLunch: string;
  mealCutoffDinner: string;
  mealWeights: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  rulesAndPolicies?: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    hostelName: {
      type: String,
      required: true,
      default: 'গ্রিন ভিউ বয়েজ হোস্টেল ও মেস',
      trim: true,
    },
    hostelNameEn: {
      type: String,
      default: 'Green View Boys Hostel & Mess',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'একটি নিরাপদ, সুশৃঙ্খল ও আন্তরিক আবাসিক পরিবেশ',
      trim: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      required: true,
      default: 'বাড়ি নং ১২, রোড নং ৫, ধানমন্ডি, ঢাকা-১২০৫',
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      default: '+৮৮০১৭১২৩৪৫৬৭৮',
      trim: true,
    },
    email: {
      type: String,
      required: true,
      default: 'contact@hostel.example.com',
      trim: true,
    },
    activeMode: {
      type: String,
      enum: ['HOSTEL_ONLY', 'MESS_ONLY', 'COMBINED'],
      default: 'COMBINED',
    },
    currency: {
      type: String,
      default: 'BDT',
    },
    currencySymbol: {
      type: String,
      default: '৳',
    },
    invoicePrefix: {
      type: String,
      default: 'INV',
    },
    receiptPrefix: {
      type: String,
      default: 'RCT',
    },
    residentIdPrefix: {
      type: String,
      default: 'HST',
    },
    rentDueDay: {
      type: Number,
      default: 5,
      min: 1,
      max: 28,
    },
    lateFeePoisha: {
      type: Number,
      default: 10000, // ৳ 100 in poisha
    },
    securityDepositPoisha: {
      type: Number,
      default: 300000, // ৳ 3,000 in poisha
    },
    mealCutoffBreakfast: {
      type: String,
      default: '22:00', // Previous night 10:00 PM
    },
    mealCutoffLunch: {
      type: String,
      default: '09:00', // Same morning 9:00 AM
    },
    mealCutoffDinner: {
      type: String,
      default: '16:00', // Same afternoon 4:00 PM
    },
    mealWeights: {
      breakfast: { type: Number, default: 0.5 },
      lunch: { type: Number, default: 1.0 },
      dinner: { type: Number, default: 1.0 },
    },
    rulesAndPolicies: {
      type: String,
      default: '১. রাত ১০:৩০ টার মধ্যে হোস্টেলে প্রবেশ বাধ্যতামূলক।\n২. হোস্টেল প্রাঙ্গণে ধূমপান ও মাদক সম্পূর্ণ নিষিদ্ধ।\n৩. মিল পরিবর্তন নির্ধারিত সময়ের পূর্বে সম্পন্ন করতে হবে।',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings: Model<ISettings> =
  mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
