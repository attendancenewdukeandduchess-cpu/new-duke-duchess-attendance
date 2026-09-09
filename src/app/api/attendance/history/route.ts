import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get('filter') || 'month'; // today | week | month

  await connectDB();

  const now = new Date();
  let startDate: Date;

  if (filter === 'today') {
    startDate = new Date(now.toISOString().split('T')[0]);
  } else if (filter === 'week') {
    startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startStr = startDate.toISOString().split('T')[0];
  const endStr   = now.toISOString().split('T')[0];

  const records = await Attendance.find({
    userId,
    date: { $gte: startStr, $lte: endStr }
  }).sort({ date: -1 }).lean();

  return NextResponse.json({ records });
}
