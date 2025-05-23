'use client';
import Image from "next/image";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from 'next/navigation';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import styles from "../page.module.css";

export default function SettingPage() {
  const { data: session, status } = useSession();
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpVerify, setTotpVerify] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
        <div className={`${styles.ctas} m-auto text-center`}>
        読み込み中...
        </div>
      ) : (
          <>
          <div className={`${styles.ctas} m-auto text-center`}>
          <p>ようこそ、{session.user.name} さん</p>
          </div>
          <div className={`${styles.ctas} m-auto`}>
          <Link href="/totp-setup" className={styles.secondary}>
          <Image
          className={styles.logo}
          src="/key-solid.svg"
          alt="key-solid"
          width={20}
          height={20}
          />
          多要素認証
          </Link>
          </div>
          </>
      )}
      </main>

      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">

      </footer>
      </div>
    );
}
