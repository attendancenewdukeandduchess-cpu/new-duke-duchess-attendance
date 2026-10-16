"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payroll = void 0;
const mongoose_1 = require("mongoose");
const PayrollSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    advances: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT' },
}, { timestamps: true });
exports.Payroll = mongoose_1.models.Payroll || (0, mongoose_1.model)('Payroll', PayrollSchema);
