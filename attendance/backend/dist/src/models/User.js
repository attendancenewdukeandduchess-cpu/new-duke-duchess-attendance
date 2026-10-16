"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mobile: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['EMPLOYEE', 'ADMIN'], default: 'EMPLOYEE' },
    designation: { type: String },
    department: { type: String },
    joiningDate: { type: Date, default: Date.now },
    baseSalary: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
    profilePhoto: { type: String },
    faceDescriptor: { type: [Number] },
}, { timestamps: true });
exports.User = mongoose_1.models.User || (0, mongoose_1.model)('User', UserSchema);
