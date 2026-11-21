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

    // Auto-add / update customer in billing_customers whenever a bill is generated
    const customerName = (doc.customer || '').trim();
    const phone = (doc.phone || '').trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (customerName && customerName.toLowerCase() !== 'walk-in client') {
      let existing = null;
      if (cleanPhone) {
        existing = await db.collection('billing_customers').findOne({
          phone: { $regex: cleanPhone }
        });
      }
      if (!existing) {
        existing = await db.collection('billing_customers').findOne({
          name: { $regex: new RegExp(`^${customerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
      }

      if (existing) {
        await db.collection('billing_customers').updateOne(
          { _id: existing._id },
          {
            $inc: { visits: 1 },
            $set: {
              ...(phone && !existing.phone ? { phone } : {}),
              updatedAt: new Date()
            }
          }
        );
      } else {
        // Find max customer ID
        const allCust = await db.collection('billing_customers').find({}).toArray();
        let maxId = 0;
        allCust.forEach((c: any) => {
          const m = (c.id || '').match(/CUST-(\d+)/);
          if (m) {
            const num = parseInt(m[1], 10);
            if (num > maxId) maxId = num;
          }
        });
        const newCustId = `CUST-${String(maxId + 1).padStart(3, '0')}`;
        await db.collection('billing_customers').insertOne({
          id: newCustId,
          name: customerName,
          phone: phone,
          email: '',
          visits: 1,
          balance: 0,
          tag: 'Regular',
          createdAt: new Date()
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/billing/invoices error:', err);
    return NextResponse.json({ error: 'Failed to save invoice' }, { status: 500 });
  }
}
