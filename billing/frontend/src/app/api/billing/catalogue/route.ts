import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

const FILTER = { key: 'main' };

// GET  → return full catalogue { menSections, womenSections, productItems }
export async function GET() {
  try {
    const db = await getDb();
    const doc = await db.collection('catalogue').findOne(FILTER);
    if (!doc) return NextResponse.json({ menSections: null, womenSections: null, productItems: null });
    return NextResponse.json({
      menSections: doc.menSections ?? null,
      womenSections: doc.womenSections ?? null,
      productItems: doc.productItems ?? null,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PUT  → full replace of catalogue (upsert)
export async function PUT(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();
    await db.collection('catalogue').updateOne(
      FILTER,
      { $set: { menSections: body.menSections, womenSections: body.womenSections, productItems: body.productItems, updatedAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PATCH → partial update (only the keys sent)
export async function PATCH(req: Request) {
  try {
    const db = await getDb();
    const body = await req.json();
    const setObj: Record<string, unknown> = { updatedAt: new Date() };
    if (body.menSections !== undefined) setObj.menSections = body.menSections;
    if (body.womenSections !== undefined) setObj.womenSections = body.womenSections;
    if (body.productItems !== undefined) setObj.productItems = body.productItems;
    await db.collection('catalogue').updateOne(
      FILTER,
      { $set: setObj },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
