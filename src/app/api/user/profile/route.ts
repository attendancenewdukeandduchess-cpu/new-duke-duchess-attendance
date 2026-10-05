import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Leave } from '@/lib/models/Leave';
import { Attendance } from '@/lib/models/Attendance';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const userId = (session.user as any).id;

  const user = await User.findById(userId).select('-password').lean() as any;
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Fetch user leaves
  const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();
  const approvedCount = leaves.filter((l: any) => l.status === 'APPROVED').length;
  const pendingCount  = leaves.filter((l: any) => l.status === 'PENDING').length;
  const totalQuota = 12;
  const availableBalance = Math.max(0, totalQuota - approvedCount);

  // Fetch month attendance stats
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = now.toISOString().split('T')[0];

  const monthRecords = await Attendance.find({
    userId,
    date: { $gte: startOfMonth, $lte: endOfMonth }
  }).lean();

  let totalMinutes = 0;
  let onTimeCount = 0;

  for (const rec of monthRecords) {
    if (rec.status === 'PRESENT') onTimeCount++;
    if (rec.checkInTime && rec.checkOutTime) {
      const diff = new Date(rec.checkOutTime).getTime() - new Date(rec.checkInTime).getTime();
      if (diff > 0) {
        totalMinutes += Math.floor(diff / (1000 * 60));
      }
    }
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return NextResponse.json({
    user: {
      id: user._id,
      employeeId: user.employeeId,
      name: user.name,
      mobile: user.mobile || '',
      email: user.email || '',
      role: user.role,
      designation: user.designation || 'Staff',
      department: user.department || 'General',
      joiningDate: user.joiningDate || user.createdAt,
      baseSalary: user.baseSalary || 25000,
      status: user.status || 'ACTIVE'
    },
    leaves,
    leaveStats: {
      totalQuota,
      available: availableBalance,
      approved: approvedCount,
      pending: pendingCount
    },
    attendanceStats: {
      totalDays: monthRecords.length,
      totalHoursStr: `${hours}h ${minutes}m`,
      onTimeCount
    }
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { mobile, email } = await req.json();
  await connectDB();
  const userId = (session.user as any).id;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { ...(mobile ? { mobile } : {}), ...(email ? { email } : {}) } },
    { returnDocument: 'after' }
  ).select('-password').lean();

  return NextResponse.json({ user: updatedUser });
}
