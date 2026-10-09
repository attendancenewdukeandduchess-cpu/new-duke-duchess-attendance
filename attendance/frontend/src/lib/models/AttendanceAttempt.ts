import { Schema, Document, models, model, Types } from 'mongoose';

export interface IAttendanceAttempt extends Document {
  userId: Types.ObjectId;
  timestamp: Date;
  latitude: number;
  longitude: number;
  accuracy: number;
  distance: number;
  selfie?: string;
  rejectionReason: string;
}

const AttendanceAttemptSchema = new Schema<IAttendanceAttempt>({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp:       { type: Date, default: Date.now },
  latitude:        { type: Number, required: true },
  longitude:       { type: Number, required: true },
  accuracy:        { type: Number, required: true },
  distance:        { type: Number, required: true },
  selfie:          { type: String },
  rejectionReason: { type: String, required: true },
}, { timestamps: true });

export const AttendanceAttempt = models.AttendanceAttempt || model<IAttendanceAttempt>('AttendanceAttempt', AttendanceAttemptSchema);
