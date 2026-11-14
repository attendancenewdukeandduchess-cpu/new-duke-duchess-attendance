import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const customers = await db.collection('billing_customers').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(customers);
  } catch (err) {
    console.error('GET /api/billing/customers error:', err);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, createdAt: new Date() };
    // upsert by id so re-seeding doesn't duplicate
    await db.collection('billing_customers').updateOne(
      { id: doc.id },
      { $setOnInsert: doc },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/billing/customers error:', err);
    return NextResponse.json({ error: 'Failed to save customer' }, { status: 500 });
  }
}
