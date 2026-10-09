import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// ── PUT: update employee details (Admin only) ─────────────────────────────────
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const {
    name,
    mobile,
    email,
    designation,
    department,
    baseSalary,
    status,
    password,          // optional — only update if provided
    joiningDate,
  } = await req.json();

  const updateData: Record<string, any> = {};

  if (name !== undefined)        updateData.name        = name.trim();
  if (mobile !== undefined)      updateData.mobile      = mobile?.trim() || undefined;
  if (email !== undefined)       updateData.email       = email?.trim()  || undefined;
  if (designation !== undefined) updateData.designation = designation?.trim();
  if (department !== undefined)  updateData.department  = department?.trim();
  if (baseSalary !== undefined)  updateData.baseSalary  = Number(baseSalary);
  if (status !== undefined)      updateData.status      = status;
  if (joiningDate !== undefined) updateData.joiningDate = new Date(joiningDate);

  // Only hash + update password if a new one was provided
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password.trim(), 10);
  }

  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password').lean();

    if (!updated) {
      return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
    }

    return NextResponse.json({ employee: updated });
  } catch (e: any) {
    if (e.code === 11000) {
      return NextResponse.json({ error: 'Mobile or email already in use by another employee.' }, { status: 409 });
    }
    return NextResponse.json({ error: e.message || 'Failed to update employee.' }, { status: 500 });
  }
}

// ── DELETE: disable (soft-delete) an employee (Admin only) ───────────────────
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const { id } = await params;

  const updated = await User.findByIdAndUpdate(
    id,
    { $set: { status: 'DISABLED' } },
    { new: true }
  ).select('-password').lean();

  if (!updated) {
    return NextResponse.json({ error: 'Employee not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, message: 'Employee disabled.' });
}
