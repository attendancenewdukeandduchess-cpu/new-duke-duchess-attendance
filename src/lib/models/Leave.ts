import { Schema, Document, models, model, Types } from 'mongoose';

export interface ILeave extends Document {
  userId: Types.ObjectId;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Personal Leave' | 'Other';
  fromDate: Date;
  toDate: Date;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
}

const LeaveSchema = new Schema<ILeave>({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Personal Leave', 'Other'], required: true },
  fromDate:  { type: Date, required: true },
  toDate:    { type: Date, required: true },
  reason:    { type: String, required: true },
  status:    { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy:{ type: String },
}, { timestamps: true });

export const Leave = models.Leave || model<ILeave>('Leave', LeaveSchema);
