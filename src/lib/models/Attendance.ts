import { Schema, Document, models, model, Types } from 'mongoose';

export interface IAttendance extends Document {
  userId: Types.ObjectId;
  date: string;
  checkInTime?: Date;
  checkInSelfie?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutTime?: Date;
  checkOutSelfie?: string;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  gpsAccuracy?: number;
  distanceFromSalon?: number;
  status: 'PRESENT' | 'LATE' | 'ABSENT';
}

const AttendanceSchema = new Schema<IAttendance>({
  userId:             { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date:               { type: String, required: true }, // YYYY-MM-DD
  checkInTime:        { type: Date },
  checkInSelfie:      { type: String },
  checkInLatitude:    { type: Number },
  checkInLongitude:   { type: Number },
  checkOutTime:       { type: Date },
  checkOutSelfie:     { type: String },
  checkOutLatitude:   { type: Number },
  checkOutLongitude:  { type: Number },
  gpsAccuracy:        { type: Number },
  distanceFromSalon:  { type: Number },
  status:             { type: String, enum: ['PRESENT', 'LATE', 'ABSENT'], default: 'PRESENT' },
}, { timestamps: true });

// Ensure one record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);
