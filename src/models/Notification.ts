import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  recipientUserId?: mongoose.Types.ObjectId; // null means broadcast to role or all
  recipientRole?: string; // 'OWNER', 'RESIDENT', etc.
  title: string;
  message: string;
  type: 'RENT_DUE' | 'MEAL_ALERT' | 'COMPLAINT_UPDATE' | 'LEAVE_STATUS' | 'GENERAL_NOTICE';
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    recipientRole: {
      type: String,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['RENT_DUE', 'MEAL_ALERT', 'COMPLAINT_UPDATE', 'LEAVE_STATUS', 'GENERAL_NOTICE'],
      default: 'GENERAL_NOTICE',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
