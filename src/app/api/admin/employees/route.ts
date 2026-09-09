import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import { Attendance } from '@/lib/models/Attendance';
import bcrypt from 'bcryptjs';

// GET all employees (Admin only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const employees = await User.find({ role: 'EMPLOYEE' })
    .select('-password')
    .lean();

  return NextResponse.json({ employees });
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
    const employee = await User.create({ employeeId, name, mobile, email, designation, department, baseSalary, password: hashed });
    return NextResponse.json({ employee: { ...employee.toObject(), password: undefined } }, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) return NextResponse.json({ error: 'Employee ID or mobile already exists.' }, { status: 409 });
    throw e;
  }
}
