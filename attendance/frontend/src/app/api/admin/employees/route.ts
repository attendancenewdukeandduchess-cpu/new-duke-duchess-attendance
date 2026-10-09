import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import bcrypt from 'bcryptjs';

// GET all employees (Admin only) with today's attendance status
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const employees = await User.find({ role: 'EMPLOYEE' })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean() as any[];

  // Fetch today's attendance for all staff
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = await Attendance.find({ date: todayStr }).lean() as any[];
  const attendanceMap = new Map();
  for (const att of todayAttendances) {
    attendanceMap.set(att.userId.toString(), att);
  }

  const enrichedEmployees = employees.map((emp) => ({
    ...emp,
    todayAttendance: attendanceMap.get(emp._id.toString()) || null
  }));

  return NextResponse.json({ employees: enrichedEmployees });
}

// POST create new employee (Admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { employeeId, name, mobile, email, designation, department, baseSalary, password } = await req.json();
  
  if (!employeeId || !name || !password) {
    return NextResponse.json({ error: 'Employee ID, name, and password are required.' }, { status: 400 });
  }

  await connectDB();
  const hashed = await bcrypt.hash(password, 10);
  
  try {
    const employee = await User.create({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      mobile: mobile ? mobile.trim() : undefined,
      email: email ? email.trim() : undefined,
      designation: designation ? designation.trim() : 'Stylist',
      department: department ? department.trim() : 'Styling',
      baseSalary: baseSalary ? Number(baseSalary) : 0,
      password: hashed,
      role: 'EMPLOYEE',
      status: 'ACTIVE'
    });
    return NextResponse.json({ employee: { ...employee.toObject(), password: undefined } }, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) {
      return NextResponse.json({ error: 'Employee ID or mobile number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message || 'Failed to create employee.' }, { status: 500 });
  }
}
