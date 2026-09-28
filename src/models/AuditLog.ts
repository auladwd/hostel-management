import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  action: string; // e.g. "RESIDENT_ADMISSION", "RENT_PAYMENT", "MEAL_LOCK"
  entity: string; // "Resident", "Payment", "MonthlyMealSettlement"
  entityId?: string;
  performedByUserId: mongoose.Types.ObjectId;
  performedByEmail: string;
  performedByRole: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    entity: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      default: '',
    },
    performedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByEmail: {
      type: String,
      required: true,
    },
    performedByRole: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
