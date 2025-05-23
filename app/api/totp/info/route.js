import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import { getMongoDb } from '@/lib/mongodb';
import { decrypt } from '@/lib/crypto';

export async function POST(request) {
  const { id: userId, email } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const db = await getMongoDb();
  const user = await db.collection('users').findOne({ userId });

  if (!user || !user.totpSecret) {
    console.log('no user database', user);
    return NextResponse.json({ success: false, message: 'Secret not found' }, { status: 400 });
  }

  return NextResponse.json({
    totpSecret: !!user.totpSecret,
    totpVerify: user.totpVerify ?? false,
  });
}
