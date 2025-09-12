"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Session } from "next-auth";

export default function DashboardHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const userRole = (session as Session)?.user?.role;
    if (userRole === "ADMIN") {
      router.replace("/dashboard/admin");
    } else if (userRole === "OPERATOR") {
      router.replace("/dashboard/operator");
    } else {
      // Handle cases where role is not defined or other roles
      // For now, just show a generic message or redirect to login if no session
      if (!session) {
        router.replace("/login");
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <p>Memuat dashboard...</p>;
  }

  if (!session) {
    return null; // Will be redirected by layout or this page
  }

  return (
    <div>
      <h2>Selamat datang di Dashboard Anda!</h2>
      <p>Silakan pilih opsi dari sidebar.</p>
    </div>
  );
}
