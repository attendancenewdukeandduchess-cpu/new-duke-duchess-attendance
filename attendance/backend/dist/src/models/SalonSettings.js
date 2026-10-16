"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalonSettings = void 0;
const mongoose_1 = require("mongoose");
const SalonSettingsSchema = new mongoose_1.Schema({
    salonName: { type: String, default: 'New Duke & Duchess' },
    latitude: { type: Number, default: 0.0 },
    longitude: { type: Number, default: 0.0 },
    allowedRadius: { type: Number, default: 20.0 },
    workStartTime: { type: String, default: '09:30' },
    workEndTime: { type: String, default: '19:30' },
    gracePeriodMinutes: { type: Number, default: 15 },
    checkInEnabled: { type: Boolean, default: true },
    checkOutEnabled: { type: Boolean, default: true },
    gpsRequired: { type: Boolean, default: true },
    selfieRequired: { type: Boolean, default: true },
}, { timestamps: true });
exports.SalonSettings = mongoose_1.models.SalonSettings || (0, mongoose_1.model)('SalonSettings', SalonSettingsSchema);
