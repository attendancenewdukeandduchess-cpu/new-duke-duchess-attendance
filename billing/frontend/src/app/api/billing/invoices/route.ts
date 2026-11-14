import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDb();
    const invoices = await db.collection('billing_invoices').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json(invoices);
  } catch (err) {
    console.error('GET /api/billing/invoices error:', err);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = await getDb();
    const doc = { ...body, createdAt: new Date() };
    await db.collection('billing_invoices').updateOne(
      { id: doc.id },
      { $setOnInsert: doc },
      { upsert: true }
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/billing/invoices error:', err);
    return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
  }
}
