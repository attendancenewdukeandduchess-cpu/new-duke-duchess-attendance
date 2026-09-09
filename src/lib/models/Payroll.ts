import { Schema, Document, models, model, Types } from 'mongoose';

export interface IPayroll extends Document {
  userId: Types.ObjectId;
  month: string; // e.g., "September 2026"
  basicSalary: number;
  allowances: number;
  incentives: number;
  overtime: number;
  deductions: number;
  advances: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
}

const PayrollSchema = new Schema<IPayroll>({
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  month:       { type: String, required: true },
  basicSalary: { type: Number, required: true },
  allowances:  { type: Number, default: 0 },
  incentives:  { type: Number, default: 0 },
  overtime:    { type: Number, default: 0 },
  deductions:  { type: Number, default: 0 },
  advances:    { type: Number, default: 0 },
  netSalary:   { type: Number, required: true },
  status:      { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT' },
}, { timestamps: true });

export const Payroll = models.Payroll || model<IPayroll>('Payroll', PayrollSchema);
