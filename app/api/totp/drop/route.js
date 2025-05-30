import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';

export async function POST(request) {
  const { userId } = await request.json();
  console.log(userId);
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const db = await getMongoDb();
  await db.collection('users').updateOne(
    { userId },
    {
      $set: {
        totpSecret: null,
        totpVerify: false,
        totpDrop: true,
        updatedAt: null,
        totpVerifiedAt: null,
      }
    },
    { upsert: true }
  );

  const user = await db.collection('users').findOne({ userId });
  console.log(user);

  return NextResponse.json({
    totpSecret: !!user.totpSecret,
    totpVerify: user.totpVerify ?? false,
    totpDrop: true,
  });
}
