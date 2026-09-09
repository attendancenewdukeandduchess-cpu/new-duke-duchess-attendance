import { Schema, Document, models, model } from 'mongoose';

export interface ISalonSettings extends Document {
  salonName: string;
  latitude: number;
  longitude: number;
  allowedRadius: number;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  gpsRequired: boolean;
  selfieRequired: boolean;
}

const SalonSettingsSchema = new Schema<ISalonSettings>({
  salonName:          { type: String, default: 'New Duke & Duchess' },
  latitude:           { type: Number, default: 0.0 },
  longitude:          { type: Number, default: 0.0 },
  allowedRadius:      { type: Number, default: 100.0 },
  workStartTime:      { type: String, default: '09:30' },
  workEndTime:        { type: String, default: '19:30' },
  gracePeriodMinutes: { type: Number, default: 15 },
  checkInEnabled:     { type: Boolean, default: true },
  checkOutEnabled:    { type: Boolean, default: true },
  gpsRequired:        { type: Boolean, default: true },
  selfieRequired:     { type: Boolean, default: true },
}, { timestamps: true });

export const SalonSettings = models.SalonSettings || model<ISalonSettings>('SalonSettings', SalonSettingsSchema);
