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
  const filter = searchParams.get('filter') || 'month'; // today | week | month | all

  await connectDB();

  const now = new Date();
  const query: any = { userId };

  if (filter === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    query.date = todayStr;
  } else if (filter === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    query.date = { $gte: weekAgo.toISOString().split('T')[0], $lte: now.toISOString().split('T')[0] };
  } else if (filter === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    query.date = { $gte: monthStart, $lte: now.toISOString().split('T')[0] };
  }
  // If 'all', no date filter is applied

  const records = await Attendance.find(query).sort({ date: -1 }).lean() as any[];

  // Calculate summary stats
  let totalMinutes = 0;
  let presentDays = 0;
  let lateDays = 0;

  for (const rec of records) {
    if (rec.status === 'LATE') {
      lateDays++;
      presentDays++;
    } else if (rec.status === 'PRESENT') {
      presentDays++;
    }

    if (rec.checkInTime && rec.checkOutTime) {
      const diff = new Date(rec.checkOutTime).getTime() - new Date(rec.checkInTime).getTime();
      if (diff > 0) {
        totalMinutes += Math.floor(diff / (1000 * 60));
      }
    }
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const totalHoursStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return NextResponse.json({
    records,
    stats: {
      totalRecords: records.length,
      presentDays,
      lateDays,
      totalHoursStr,
      totalMinutes
    }
  });
}
