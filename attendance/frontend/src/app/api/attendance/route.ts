import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { AttendanceAttempt } from '@/lib/models/AttendanceAttempt';
import { SalonSettings } from '@/lib/models/SalonSettings';
import { User } from '@/lib/models/User';
import { verifyEmployeeGeofence, BRANCHES, BranchId } from '@/lib/branches';

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

  // ── 2. Get employee details & assigned branch ──────────────────────────
  const userId = (session.user as any).id;
  const user = await User.findById(userId).lean() as any;
  const assignedBranchId: BranchId = (user?.branch as BranchId) || 'NAGARBHAVI';

  // ── 3. Multi-Branch Geofence Check (Nagarbhavi vs RR Nagar) ─────────────
  const geofenceResult = verifyEmployeeGeofence(latitude, longitude, assignedBranchId);
  const { isAllowed, matchedBranch, distance, allowedRadius, closestBranch, minDistance } = geofenceResult;

  const now      = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // ── 4. Outside geofence → record rejected attempt ────────────────────────
  if (!isAllowed) {
    await AttendanceAttempt.create({
      userId,
      latitude,
      longitude,
      accuracy,
      distance: minDistance,
      branch: closestBranch.id,
      selfie,
      rejectionReason: `Outside allowed radius (${minDistance}m from ${closestBranch.shortName}, limit ${allowedRadius}m)`
    });
    return NextResponse.json({
      error: 'Outside Geofence',
      distance: minDistance,
      allowed: allowedRadius,
      branchName: closestBranch.shortName
    }, { status: 403 });
  }

  // ── 5. Determine attendance status ───────────────────────────────────────
  let settings = await SalonSettings.findOne().lean() as any;
  const [startH, startM] = (settings?.workStartTime || '09:30').split(':').map(Number);
  const graceMinutes     = settings?.gracePeriodMinutes || 15;
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
        gpsAccuracy: accuracy, distanceFromSalon: distance,
        branch: matchedBranch.id
      });
    } else {
      attendance.checkInTime      = now;
      attendance.checkInSelfie    = selfie;
      attendance.checkInLatitude  = latitude;
      attendance.checkInLongitude = longitude;
      attendance.gpsAccuracy      = accuracy;
      attendance.distanceFromSalon = distance;
      attendance.branch           = matchedBranch.id;
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
    distance: distance,
    branch:  matchedBranch.id,
    branchName: matchedBranch.shortName
  });
}
