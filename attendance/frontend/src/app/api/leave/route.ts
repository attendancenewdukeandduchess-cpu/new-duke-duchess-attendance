import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Leave } from '@/lib/models/Leave';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const userId = (session.user as any).id;
  const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();

  return NextResponse.json({ leaves });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leaveType, fromDate, toDate, reason } = await req.json();
  if (!leaveType || !fromDate || !toDate || !reason) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  await connectDB();
  const userId = (session.user as any).id;
  const leave = await Leave.create({ userId, leaveType, fromDate: new Date(fromDate), toDate: new Date(toDate), reason });

  return NextResponse.json({ leave }, { status: 201 });
}
