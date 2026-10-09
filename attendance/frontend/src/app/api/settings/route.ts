import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { SalonSettings } from '@/lib/models/SalonSettings';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  // Only return non-sensitive settings to employees; admin gets full settings
  const role = (session.user as any).role;
  const settings = await SalonSettings.findOne().lean() as any;

  if (role === 'ADMIN') {
    return NextResponse.json({ settings });
  }

  // Employees only see working hours & grace period – NOT the exact coordinates
  return NextResponse.json({
    settings: {
      workStartTime: settings?.workStartTime,
      workEndTime: settings?.workEndTime,
      gracePeriodMinutes: settings?.gracePeriodMinutes,
      checkInEnabled: settings?.checkInEnabled,
      checkOutEnabled: settings?.checkOutEnabled,
    }
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  await connectDB();

  const settings = await SalonSettings.findOneAndUpdate(
    {},
    { $set: body },
    { upsert: true, new: true }
  ).lean();

  return NextResponse.json({ settings });
}
