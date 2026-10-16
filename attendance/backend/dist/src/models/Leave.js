"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Leave = void 0;
const mongoose_1 = require("mongoose");
const LeaveSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    leaveType: { type: String, enum: ['Casual Leave', 'Sick Leave', 'Personal Leave', 'Other'], required: true },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    approvedBy: { type: String },
}, { timestamps: true });
exports.Leave = mongoose_1.models.Leave || (0, mongoose_1.model)('Leave', LeaveSchema);
