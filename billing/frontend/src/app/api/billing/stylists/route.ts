import { NextRequest, NextResponse } from 'next/server';
import { getDb, getMongoClient } from '@/lib/mongodb';

const DEFAULT_STYLISTS = [
  { id: 'E001', name: 'Priya Sharma', designation: 'Senior Hair Stylist' },
  { id: 'E008', name: 'Puja Chetry', designation: 'Stylist' },
  { id: 'E009', name: 'Mohamed Rihan', designation: 'Senior Stylist' },
  { id: 'E011', name: 'Raj R', designation: 'Make up Artist' },
  { id: '001',  name: 'Asha', designation: 'Senior Stylist' },
  { id: '12345', name: 'Ruthvik', designation: 'Senior Stylist' },
];

export async function GET() {
  try {
    const client = await getMongoClient();

    // 1. Fetch from attendance db users (role EMPLOYEE or STAFF)
    let attendanceStaff: any[] = [];
    try {
      const attDb = client.db('duke-duchess-attendance');
      attendanceStaff = await attDb.collection('users')
        .find({
          $or: [
            { role: { $in: ['EMPLOYEE', 'STAFF'] } },
            { designation: { $regex: /stylist|artist|therapist|barber/i } }
          ],
          status: { $ne: 'INACTIVE' }
        })
        .project({ _id: 1, employeeId: 1, name: 1, designation: 1, department: 1 })
        .toArray();
    } catch (e) {
      console.warn('Could not fetch attendance staff:', e);
    }

    // 2. Fetch custom stylists from billing db
    let billingStylists: any[] = [];
    try {
      const billDb = client.db('duke-duchess-billing');
      billingStylists = await billDb.collection('billing_stylists').find({}).toArray();
    } catch (e) {
      console.warn('Could not fetch billing stylists:', e);
    }

    // 3. Merge attendance staff, custom billing stylists, and default stylists
    const map = new Map<string, { id?: string; name: string; designation?: string }>();

    // Seed defaults first
    DEFAULT_STYLISTS.forEach(s => map.set(s.name.trim().toLowerCase(), s));

    // Add attendance staff
    attendanceStaff.forEach(s => {
      if (s.name && s.name.trim()) {
        map.set(s.name.trim().toLowerCase(), {
          id: s.employeeId || String(s._id),
          name: s.name.trim(),
          designation: s.designation || 'Stylist'
        });
      }
    });

    // Add custom billing stylists
    billingStylists.forEach(s => {
      if (s.name && s.name.trim()) {
        map.set(s.name.trim().toLowerCase(), {
          id: s.id || String(s._id),
          name: s.name.trim(),
          designation: s.designation || 'Stylist'
        });
      }
    });

    const list = Array.from(map.values());
    return NextResponse.json({ stylists: list });
  } catch (err: unknown) {
    console.error('GET /api/billing/stylists error:', err);
    return NextResponse.json({ stylists: DEFAULT_STYLISTS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name || '').trim();
    const designation = (body.designation || 'Stylist').trim();
    if (!name) {
      return NextResponse.json({ error: 'Stylist name is required' }, { status: 400 });
    }

    const db = await getDb();
    const newStylist = {
      id: `STY-${Date.now().toString().slice(-4)}`,
      name,
      designation,
      createdAt: new Date()
    };

    await db.collection('billing_stylists').updateOne(
      { name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      { $setOnInsert: newStylist },
      { upsert: true }
    );

    return NextResponse.json({ success: true, stylist: newStylist });
  } catch (err: unknown) {
    console.error('POST /api/billing/stylists error:', err);
    return NextResponse.json({ error: 'Failed to add stylist' }, { status: 500 });
  }
}
