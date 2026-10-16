"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceAttempt = void 0;
const mongoose_1 = require("mongoose");
const AttendanceAttemptSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Date, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    distance: { type: Number, required: true },
    selfie: { type: String },
    rejectionReason: { type: String, required: true },
}, { timestamps: true });
exports.AttendanceAttempt = mongoose_1.models.AttendanceAttempt || (0, mongoose_1.model)('AttendanceAttempt', AttendanceAttemptSchema);
