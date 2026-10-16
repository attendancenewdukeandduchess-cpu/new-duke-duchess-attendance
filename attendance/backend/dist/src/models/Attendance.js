"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Attendance = void 0;
const mongoose_1 = require("mongoose");
const AttendanceSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    checkInTime: { type: Date },
    checkInSelfie: { type: String },
    checkInLatitude: { type: Number },
    checkInLongitude: { type: Number },
    checkOutTime: { type: Date },
    checkOutSelfie: { type: String },
    checkOutLatitude: { type: Number },
    checkOutLongitude: { type: Number },
    gpsAccuracy: { type: Number },
    distanceFromSalon: { type: Number },
    status: { type: String, enum: ['PRESENT', 'LATE', 'ABSENT'], default: 'PRESENT' },
}, { timestamps: true });
// Ensure one record per user per day
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
exports.Attendance = mongoose_1.models.Attendance || (0, mongoose_1.model)('Attendance', AttendanceSchema);
