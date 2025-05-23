'use client';
import Image from "next/image";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import styles from "../page.module.css";

export default function TotpSetupPage() {
  const { data: session, status } = useSession();
  const [secretKey, setSecretKey] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);
  const [showVerify, setShowVerify] = useState(false);
  const [token, setToken] = useState('');
  //
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpVerify, setTotpVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // ユーザーデータ取得
  const fetchTotpVerify = async (id, email) => {
    try {
      const res = await fetch("/api/totp/info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, email }),
      });

      if (!res.ok) {
        throw new Error("Fetch failed");
      }

      const data = await res.json();
      setTotpSecret(data?.totpSecret ?? false);
      setTotpVerify(data?.totpVerify ?? false);

      if (!data?.totpVerify) {
        router.push("/");
        return;
      }
      setIsLoading(false);
    } catch (e) {
      console.log("TOTP info fetch error:", e);
      setTotpSecret(false);
      setTotpVerify(false);
      router.push("/");
    }
  };


  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !session?.user?.id || !session?.user?.email) {
      router.push("/");
      return;
    }
    fetchTotpVerify(session.user.id, session.user.email);
  }, [session, status, router]);

  const fetchQRCode = async () => {
    const res = await fetch(`/api/totp/setup?id=${encodeURIComponent(session.user.id)}&email=${encodeURIComponent(session.user.email)}`);
    if (!res.ok) {
      console.error("Failed to get QR code");
      return;
    }
    const data = await res.json();
    // console.log(data);
    setSecretKey(data.secret);
    const otpauth = authenticator.keyuri('demo', 'TOTP_MongoDB_NEXT', data.secret);
    const qrImageUrl = await QRCode.toDataURL(otpauth);
    setQrCode(qrImageUrl);
  };

  const handleSetupMfa = async () => {
    fetchQRCode();
    setShowQrCode(true);
    setShowSecretKey(false);
    setShowVerify(false);
  };

  const handleSetupQrcode = async () => {
    setShowQrCode(true);
    setShowSecretKey(false);
    setShowVerify(false);
  };

  const handleSetupSecretKey = async () => {
    setShowQrCode(false);
    setShowSecretKey(true);
    setShowVerify(false);
  };

  const handleShowVerifyMfa = async () => {
    setShowQrCode(false);
    setShowSecretKey(false);
    setShowVerify(true);
  }

  const handleClipboardSecretKey = async () => {
    await navigator.clipboard.writeText(secretKey);
    alert(`シークレットキーをコピーしました。`);
  }

  const handleClipboardCodeName = async () => {
    await navigator.clipboard.writeText('TOTP_NEXT_demo');
    alert(`コード名「TOTP_NEXT_demo」をコピーしました。`);
  }

  const handleFocus = async () => {
    const text = await navigator.clipboard.readText();
    const sliced = text.slice(0, 6);
    if (/^\d+$/.test(sliced)) {
      setToken(sliced);
    }
  }


    const handleVerifyMfa = async () => {
      // console.log('handleVerifyMfa =>');
      const res = await fetch('/api/totp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          token: token,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        console.log("2FAトークン検証に失敗しました:", data.message);
        setToken('');
        alert(data.message || "トークンの検証に失敗しました");
        return;
      }
      // 成功した場合、UIリセット
      setSecretKey(null);
      setQrCode(null);
      setShowQrCode(false);
      setShowSecretKey(false);
      setShowVerify(false);
      setToken('');
      router.push("/");
      // alert("✅ MFA 検証成功しました！");
    }

  return (
    <div className="grid items-center justify-items-center min-h-screen px-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <main className="flex flex-col gap-[32px] row-start-2 items-center items-start">
    <div className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center m-auto">
    <Link href="/">
    <Image
    className="dark:invert"
    src="/next.svg"
    alt="Next.js logo"
    width={180}
    height={38}
    priority
    />
    </Link>
    <Link href="/">
    <Image
    className={styles.logo}
    src="/MongoDB_SlateBlue.svg"
    alt="MongoDB logo"
    width={180}
    height={38}
    priority
    />
    </Link>
    </div>

    {status === "loading" || isLoading ? (
      <div className={`${styles.ctas} m-auto`}>
      読み込み中...
      </div>
    ) : session ? (
      <>
      <div className={`${styles.ctas} m-auto text-center`}>
      <p>ようこそ、{session.user.name} さん</p>
      </div>
      <div className="flex-grow flex gap-4 w-full">
      <div className="w-2/3 m-auto">
      <p className="text-center mb-5">多要素認証：{totpSecret && totpVerify ? '設定済み' : '設定されていません'}</p>
      <button className="w-full text-sm" onClick={handleSetupMfa}>{totpVerify ? 'シークレットキーの再発行' : 'シークレットキーの発行'}</button>
      </div>
      </div>
      <div className="flex-grow flex gap-4 w-full">
      <div className="w-1/2">
      <button className="w-full text-sm" disabled={!qrCode} onClick={handleSetupQrcode}>QRコード</button>
      </div>

      <div className="w-1/2">
      <button className="w-full text-sm" disabled={!secretKey} onClick={handleSetupSecretKey}>シークレットキー</button>
      </div>
      </div>

      {showQrCode && qrCode  && (
        <>
        <p>以下のQRコードをAuthenticatorアプリでスキャンしてください。</p>
        <div className="m-auto">
        <Image
        className="m-auto"
        src={qrCode}
        alt="QRコード"
        width={120}
        height={120}
        priority
        />
        </div>
        <button className="w-1/2 text-sm mt-7 m-auto" onClick={handleShowVerifyMfa}>認証</button>
        </>
      )}

      {showSecretKey && (
        <div className="text-center">
        <p className="mb-5">以下のコード名とシークレットキーをAuthenticatorアプリに入力して下さい。</p>
        <p className="mb-3 text-sm">コード名（任意）</p>
        <button className="mb-3 w-[200]" onClick={handleClipboardCodeName}>
        TOTP_NEXT_demo
        </button>
        <p className="my-3 text-sm">シークレットキー</p>
        <button className="w-auto" onClick={handleClipboardSecretKey}>
        {secretKey}
        </button>
        <button className="w-1/2 text-sm mt-7" onClick={handleShowVerifyMfa}>認証</button>
        </div>
      )}

      {showVerify && (
        <div className="w-full">
        <p className="text-center mb-5">6桁のコードを入力して下さい。</p>
        <input
        className="mx-auto block text-center w-[158px] mb-5 py-1 input-code"
        type="text"
        minLength="6"
        maxLength="6"
        placeholder="123456"
        value={token}
        onFocus={handleFocus}
        onChange={(e) => setToken(e.target.value)}
        />
        <div className="w-full flex justify-center mt-4">
        <button className="w-1/2 text-sm" disabled={!(token.length === 6 && /^\d+$/.test(token))} onClick={handleVerifyMfa}>送信</button>
        </div>
        </div>
      )}
      </>
    ) : (
      <>
      <div className={`${styles.ctas} m-auto mt-5`}>
      <button
      onClick={() => signIn("auth0")}
      className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
      >
      ログイン
      </button>
      </div>
      </>
    )}
    </main>

    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

    </footer>
    </div>
  );
}
