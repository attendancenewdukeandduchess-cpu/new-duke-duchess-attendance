import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Attendance } from '@/lib/models/Attendance';
import { User } from '@/lib/models/User';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();

  const { searchParams } = new URL(req.url);
  const filter    = searchParams.get('filter') || 'today';   // today | week | month | custom
  const dateFrom  = searchParams.get('dateFrom') || '';
  const dateTo    = searchParams.get('dateTo')   || '';
  const empId     = searchParams.get('employeeId') || '';     // filter by specific employee

  const now     = new Date();
  const query: any = {};

  // ── Date range ──────────────────────────────────────────────────────────────
  if (filter === 'today') {
    query.date = now.toISOString().split('T')[0];
  } else if (filter === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    query.date = { $gte: weekAgo.toISOString().split('T')[0], $lte: now.toISOString().split('T')[0] };
  } else if (filter === 'month') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    query.date = { $gte: monthStart, $lte: now.toISOString().split('T')[0] };
  } else if (filter === 'custom' && dateFrom && dateTo) {
    query.date = { $gte: dateFrom, $lte: dateTo };
  }
  // filter === 'all' → no date restriction

  // ── Employee filter (optional) ───────────────────────────────────────────
  // Get all active employees to enrich attendance records
  const employeeQuery: any = { role: 'EMPLOYEE' };
  const employees = await User.find(employeeQuery).select('-password -faceDescriptor').lean() as any[];
  const employeeMap = new Map<string, any>();
  for (const emp of employees) {
    employeeMap.set(emp._id.toString(), emp);
  }

  // If specific employee filter
  if (empId) {
    const targetEmp = employees.find(e => e._id.toString() === empId || e.employeeId === empId);
    if (targetEmp) {
      query.userId = targetEmp._id.toString();
    }
  }

  const records = await Attendance.find(query).sort({ date: -1, createdAt: -1 }).lean() as any[];

  // Enrich each record with employee info
  const enriched = records.map((rec: any) => {
    const emp = employeeMap.get(rec.userId?.toString() || '');
    return {
      ...rec,
      employee: emp ? {
        name: emp.name,
        employeeId: emp.employeeId,
        designation: emp.designation,
        department: emp.department,
      } : null,
    };
  });

  // ── Build date-wise summary (for the filtered period) ────────────────────────
  // Group by date to identify who was present/absent on each day
  const dateMap = new Map<string, { present: string[]; late: string[]; absent: string[] }>();

  // Build set of all dates in range
  const allDates: string[] = [];
  if (filter === 'today') {
    allDates.push(now.toISOString().split('T')[0]);
  } else if (filter === 'week') {
    for (let i = 0; i <= 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      allDates.push(d.toISOString().split('T')[0]);
    }
  } else if (filter === 'month') {
    const daysInMonth = now.getDate();
    for (let i = 0; i < daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      allDates.push(d.toISOString().split('T')[0]);
    }
  } else if (filter === 'custom' && dateFrom && dateTo) {
    const start = new Date(dateFrom);
    const end   = new Date(dateTo);
    for (let d = new Date(end); d >= start; d.setDate(d.getDate() - 1)) {
      allDates.push(d.toISOString().split('T')[0]);
    }
  }

  for (const date of allDates) {
    dateMap.set(date, { present: [], late: [], absent: [] });
  }

  for (const rec of enriched) {
    const entry = dateMap.get(rec.date);
    if (!entry || !rec.employee) continue;
    const empName = rec.employee.name;
    if (rec.status === 'LATE') {
      entry.late.push(empName);
      entry.present.push(empName);
    } else if (rec.status === 'PRESENT') {
      entry.present.push(empName);
    }
  }

  // ── Overall stats ────────────────────────────────────────────────────────
  let totalMinutes = 0;
  let presentCount = 0;
  let lateCount    = 0;
  for (const rec of records) {
    if (rec.status === 'PRESENT' || rec.status === 'LATE') presentCount++;
    if (rec.status === 'LATE') lateCount++;
    if (rec.checkInTime && rec.checkOutTime) {
      const diff = new Date(rec.checkOutTime).getTime() - new Date(rec.checkInTime).getTime();
      if (diff > 0) totalMinutes += Math.floor(diff / (1000 * 60));
    }
  }

  const hours    = Math.floor(totalMinutes / 60);
  const minutes  = totalMinutes % 60;
  const totalHoursStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return NextResponse.json({
    records: enriched,
    employees,
    stats: {
      totalRecords: records.length,
      presentCount,
      lateCount,
      absentCount: (employees.length * allDates.length) - presentCount,
      totalHoursStr,
    }
  });
}
