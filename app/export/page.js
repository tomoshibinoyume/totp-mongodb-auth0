'use client';
import Image from "next/image";
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react"
import { authOptions } from "@/lib/authOptions";
import { useRouter } from 'next/navigation';
import styles from "../page.module.css";

export default function ExportPage() {
  const { data: session, status } = useSession()
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
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen py-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    <main className="flex flex-col gap-[32px] w-full row-start-2 items-center sm:items-start">
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
    {status === 'loading' || isLoading && (
      <div className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center m-auto">
      <div className={`${styles.ctas} m-auto`}>
      読み込み中...
      </div>
      </div>
    )}
    </main>
    <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
    <div className={`${styles.ctas} m-auto`}>
    {status === 'loading' || isLoading ? '' : 'This is export page.'}
    </div>
    </footer>
    </div>
  )
}
