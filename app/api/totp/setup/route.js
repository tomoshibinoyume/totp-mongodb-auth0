import { NextResponse } from 'next/server';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { encrypt } from '@/lib/crypto';
import { getMongoDb } from '@/lib/mongodb';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  const email = searchParams.get("email"); // UI側で渡してもOK（任意）
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  const secret = authenticator.generateSecret();
  const encryptedSecret = encrypt(secret);
  // const otpauth = authenticator.keyuri(email || userId, 'TOTP_AUTH0_NEXT', secret); // fallback: userId
  // const qr = await QRCode.toDataURL(otpauth);
  const db = await getMongoDb();
  await db.collection('users').updateOne(
    { userId },
    {
      $set: {
        email,
        totpSecret: encryptedSecret,
        totpVerify: false,
        totpDrop: false,
        updatedAt: new Date(),
      }
    },
    { upsert: true }
  );
  return NextResponse.json({
    totpSecret: secret,
    totpVerify: false,
    totpDrop: false,
  });
  // return NextResponse.json({ secret });
}
