"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const node_dns_1 = __importDefault(require("node:dns"));
// Fix for Windows DNS ECONNREFUSED on querySrv for MongoDB Atlas
try {
    node_dns_1.default.setServers(['8.8.8.8', '8.8.4.4']);
}
catch (e) {
    // Ignore in environments where setServers is restricted
}
// Cached connection for Next.js serverless environment
let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}
async function connectDB() {
    // Validate at connection time (not build time) so `next build` succeeds without a real URI
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
        throw new Error('Please define the MONGODB_URI environment variable in .env');
    }
    if (cached.conn)
        return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose_1.default.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
    }
    try {
        cached.conn = await cached.promise;
    }
    catch (e) {
        cached.promise = null;
        throw e;
    }
    return cached.conn;
}
