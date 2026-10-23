import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceAttempt } from '@/lib/models/AttendanceAttempt';
import { SalonSettings } from '@/lib/models/SalonSettings';
import { User } from '@/lib/models/User';

// ── SALON LOCATION (source of truth – hardcoded) ──────────────────────────────
const SALON_LAT    = 12.968489;
const SALON_LNG    = 77.501320;
const SALON_RADIUS = 50; // meters

// Haversine formula – server-side geofencing (employees never see salon coordinates)
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

// ── GET: fetch today's attendance for the logged-in employee ──────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId   = (session.user as any).id;
  const todayStr = new Date().toISOString().split('T')[0];
  const attendance = await Attendance.findOne({ userId, date: todayStr }).lean();

  return NextResponse.json({ attendance });
}

// ── POST: mark check-in or check-out ─────────────────────────────────────────
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { latitude, longitude, accuracy, selfie, type } = await req.json();

  await connectDB();

  // ── 1. GPS Accuracy check (must be ≤ 150 m accuracy reading) ────────────
  if (accuracy > 150) {
    return NextResponse.json({ error: 'GPS accuracy too low. Please enable precise location and try again.' }, { status: 400 });
  }

  // ── 2. Get salon settings & auto-fix DB if coordinates are wrong ──────────
  let settings = await SalonSettings.findOne().lean() as any;
  if (!settings) {
    // No settings at all – create with correct values
    settings = await SalonSettings.findOneAndUpdate({}, {
      $set: {
        latitude: SALON_LAT, longitude: SALON_LNG, allowedRadius: SALON_RADIUS,
        salonName: 'New Duke & Duchess', workStartTime: '09:30', workEndTime: '19:30',
        gracePeriodMinutes: 15, checkInEnabled: true, checkOutEnabled: true,
        gpsRequired: true, selfieRequired: true
      }
    }, { upsert: true, new: true }).lean() as any;
  } else if (settings.latitude !== SALON_LAT || settings.longitude !== SALON_LNG || settings.allowedRadius !== SALON_RADIUS) {
    // DB has stale/wrong coordinates – silently correct them
    await SalonSettings.updateMany({}, {
      $set: { latitude: SALON_LAT, longitude: SALON_LNG, allowedRadius: SALON_RADIUS }
    });
    settings.latitude      = SALON_LAT;
    settings.longitude     = SALON_LNG;
    settings.allowedRadius = SALON_RADIUS;
  }

  // ── 3. Calculate distance using hardcoded correct coordinates ────────────
  const distance = haversineDistance(latitude, longitude, SALON_LAT, SALON_LNG);
  const userId   = (session.user as any).id;
  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // ── 4. Outside geofence → record rejected attempt ────────────────────────
  if (distance > SALON_RADIUS) {
    await AttendanceAttempt.create({
      userId,
      latitude,
      longitude,
      accuracy,
      distance,
      selfie,
      rejectionReason: `Outside allowed radius (${Math.round(distance)}m from salon, limit ${SALON_RADIUS}m)`
    });
    return NextResponse.json({
      error: 'Outside Geofence',
      distance: Math.round(distance),
      allowed:  SALON_RADIUS
    }, { status: 403 });
  }

  // ── 5. Determine attendance status ───────────────────────────────────────
  const [startH, startM] = (settings.workStartTime || '09:30').split(':').map(Number);
  const graceMinutes     = settings.gracePeriodMinutes || 15;
  const lateThreshold    = new Date(now);
  lateThreshold.setHours(startH, startM + graceMinutes, 0, 0);
  const attendanceStatus = now > lateThreshold ? 'LATE' : 'PRESENT';

  // ── 6. Check existing record for today ───────────────────────────────────
  let attendance = await Attendance.findOne({ userId, date: todayStr });

  if (type === 'CHECK_IN') {
    if (attendance?.checkInTime) {
      return NextResponse.json({ error: 'Already checked in today.' }, { status: 400 });
    }
    if (!attendance) {
      attendance = await Attendance.create({
        userId, date: todayStr, status: attendanceStatus,
        checkInTime: now, checkInSelfie: selfie,
        checkInLatitude: latitude, checkInLongitude: longitude,
        gpsAccuracy: accuracy, distanceFromSalon: Math.round(distance)
      });
    } else {
      attendance.checkInTime      = now;
      attendance.checkInSelfie    = selfie;
      attendance.checkInLatitude  = latitude;
      attendance.checkInLongitude = longitude;
      attendance.gpsAccuracy      = accuracy;
      attendance.distanceFromSalon = Math.round(distance);
      attendance.status           = attendanceStatus;
      await attendance.save();
    }
  } else if (type === 'CHECK_OUT') {
    if (!attendance?.checkInTime) {
      return NextResponse.json({ error: 'You must check in first.' }, { status: 400 });
    }
    if (attendance.checkOutTime) {
      return NextResponse.json({ error: 'Already checked out today.' }, { status: 400 });
    }
    attendance.checkOutTime      = now;
    attendance.checkOutSelfie    = selfie;
    attendance.checkOutLatitude  = latitude;
    attendance.checkOutLongitude = longitude;
    await attendance.save();
  }

  return NextResponse.json({
    success: true,
    status:  attendanceStatus,
    time:    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    distance: Math.round(distance)
  });
}
