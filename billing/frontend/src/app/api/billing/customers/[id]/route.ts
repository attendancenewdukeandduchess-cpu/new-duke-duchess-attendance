import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

// PATCH /api/billing/customers/[id] — update a customer (visits, tag, etc.)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id } = await params;
    const db = await getDb();
    await db.collection('billing_customers').updateOne(
      { id },
      { $set: body }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/billing/customers/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
