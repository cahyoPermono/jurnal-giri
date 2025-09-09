"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.role === "ADMIN") {
      router.replace("/dashboard/admin");
    } else if (session?.user?.role === "OPERATOR") {
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
    return <p>Loading dashboard...</p>;
  }

  if (!session) {
    return null; // Will be redirected by layout or this page
  }

  return (
    <div>
      <h2>Welcome to your Dashboard!</h2>
      <p>Please select an option from the sidebar.</p>
    </div>
  );
}
