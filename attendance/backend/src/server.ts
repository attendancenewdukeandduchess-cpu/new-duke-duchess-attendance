import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db';
import { User } from './models/User';
import { Attendance } from './models/Attendance';
import { AttendanceAttempt } from './models/AttendanceAttempt';
import { SalonSettings } from './models/SalonSettings';
import { Leave } from './models/Leave';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: Haversine Distance
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'New Duke & Duchess Attendance Backend' });
});

// ── Auth Endpoint ────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectDB();
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
      return res.status(400).json({ error: 'Employee ID and password required.' });
    }

    const id = employeeId.trim();
    const user = await User.findOne({
      $or: [
        { employeeId: { $regex: new RegExp(`^${id}$`, 'i') } },
        { mobile: id }
      ],
      status: 'ACTIVE'
    }).lean() as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or inactive account.' });
    }

    const isValid = (password === user.password) || await bcrypt.compare(password, user.password).catch(() => false);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        designation: user.designation || '',
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// ── Attendance Endpoint ──────────────────────────────────────────────────────
app.get('/api/attendance', async (req, res) => {
  try {
    await connectDB();
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId parameter required' });

    const todayStr = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ userId, date: todayStr }).lean();
    res.json({ attendance });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  try {
    await connectDB();
    const { userId, latitude, longitude, accuracy, selfie, type } = req.body;

    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (accuracy > 150) {
      return res.status(400).json({ error: 'GPS accuracy too low. Please enable precise location.' });
    }

    let settings = await SalonSettings.findOne().lean() as any;
    if (!settings || settings.latitude === 0) {
      return res.status(500).json({ error: 'Salon location not configured.' });
    }

    const distance = haversineDistance(latitude, longitude, settings.latitude, settings.longitude);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (distance > settings.allowedRadius) {
      await AttendanceAttempt.create({
        userId, latitude, longitude, accuracy, distance, selfie,
        rejectionReason: `Outside allowed radius (${Math.round(distance)}m from salon)`
      });
      return res.status(403).json({
        error: 'Outside Geofence',
        distance: Math.round(distance),
        allowed: settings.allowedRadius
      });
    }

    const [startH, startM] = settings.workStartTime.split(':').map(Number);
    const graceMinutes = settings.gracePeriodMinutes || 15;
    const lateThreshold = new Date(now);
    lateThreshold.setHours(startH, startM + graceMinutes, 0, 0);
    const attendanceStatus = now > lateThreshold ? 'LATE' : 'PRESENT';

    let attendance = await Attendance.findOne({ userId, date: todayStr });

    if (type === 'CHECK_IN') {
      if (attendance?.checkInTime) return res.status(400).json({ error: 'Already checked in today.' });
      if (!attendance) {
        attendance = await Attendance.create({
          userId, date: todayStr, status: attendanceStatus,
          checkInTime: now, checkInSelfie: selfie,
          checkInLatitude: latitude, checkInLongitude: longitude,
          gpsAccuracy: accuracy, distanceFromSalon: Math.round(distance)
        });
      } else {
        attendance.checkInTime = now;
        attendance.checkInSelfie = selfie;
        attendance.checkInLatitude = latitude;
        attendance.checkInLongitude = longitude;
        attendance.gpsAccuracy = accuracy;
        attendance.distanceFromSalon = Math.round(distance);
        attendance.status = attendanceStatus;
        await attendance.save();
      }
    } else if (type === 'CHECK_OUT') {
      if (!attendance?.checkInTime) return res.status(400).json({ error: 'You must check in first.' });
      if (attendance.checkOutTime) return res.status(400).json({ error: 'Already checked out today.' });
      attendance.checkOutTime = now;
      attendance.checkOutSelfie = selfie;
      attendance.checkOutLatitude = latitude;
      attendance.checkOutLongitude = longitude;
      await attendance.save();
    }

    res.json({
      success: true,
      status: attendanceStatus,
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      distance: Math.round(distance)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Admin Employees ──────────────────────────────────────────────────────────
app.get('/api/admin/employees', async (req, res) => {
  try {
    await connectDB();
    const employees = await User.find({}).sort({ createdAt: -1 }).lean();
    res.json({ employees });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/employees', async (req, res) => {
  try {
    await connectDB();
    const { employeeId, name, password, mobile, email, designation, department, baseSalary } = req.body;
    if (!employeeId || !name || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmp = await User.create({
      employeeId, name, password: hashedPassword, mobile, email, designation, department, baseSalary
    });

    res.json({ success: true, employee: newEmp });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`✓ Attendance Backend running on port ${PORT}`);
  } catch (e) {
    console.error('Failed to connect DB on server startup:', e);
  }
});
