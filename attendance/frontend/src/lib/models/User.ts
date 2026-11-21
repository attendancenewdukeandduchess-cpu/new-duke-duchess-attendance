import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IUser extends Document {
  employeeId: string;
  name: string;
  mobile?: string;
  email?: string;
  password: string;
  role: 'EMPLOYEE' | 'ADMIN';
  branch?: 'NAGARBHAVI' | 'RR_NAGAR';
  designation?: string;
  department?: string;
  joiningDate: Date;
  baseSalary: number;
  status: 'ACTIVE' | 'DISABLED';
  profilePhoto?: string;
  faceDescriptor?: number[];
}

const UserSchema = new Schema<IUser>({
  employeeId: { type: String, required: true, unique: true },
  name:       { type: String, required: true },
  mobile:     { type: String, unique: true, sparse: true },
  email:      { type: String, unique: true, sparse: true },
  password:   { type: String, required: true },
  role:       { type: String, enum: ['EMPLOYEE', 'ADMIN'], default: 'EMPLOYEE' },
  branch:     { type: String, enum: ['NAGARBHAVI', 'RR_NAGAR'], default: 'NAGARBHAVI' },
  designation:{ type: String },
  department: { type: String },
  joiningDate:{ type: Date, default: Date.now },
  baseSalary: { type: Number, default: 0 },
  status:     { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  profilePhoto:{ type: String },
  faceDescriptor: { type: [Number] },
}, { timestamps: true });

export const User = models.User || model<IUser>('User', UserSchema);
