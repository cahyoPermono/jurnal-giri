"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Do nothing while loading

    if (!session) {
      router.push("/login"); // Redirect to login if not authenticated
    }
  }, [session, status, router]);

  if (status === "loading") {
    return <p className="flex min-h-screen items-center justify-center">Loading dashboard...</p>;
  }

  if (!session) {
    return null; // Or a loading spinner, as redirect will happen
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
        <div>
          <img src="/logonobg.png" alt="Giri Financials Logo" className="w-32 h-auto mx-auto mb-6" />
          <nav className="space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/students">Manage Students</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/categories">Manage Categories</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/transactions/new">Record New Transaction</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/transactions">View Transactions</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/transactions/transfer">Transfer Funds</Link>
            </Button>

            <h3 className="text-lg font-semibold mt-4 mb-2">Reports</h3>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/reports/general-journal">General Journal</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/reports/profit-loss">Profit & Loss</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/reports/cash-flow">Cash Flow</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href="/dashboard/reports/student-liabilities">Student Liabilities</Link>
            </Button>

            {session.user?.role === "ADMIN" && (
              <>
                <h3 className="text-lg font-semibold mt-4 mb-2">Admin Tools</h3>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/dashboard/admin/users">Manage Operators</Link>
                </Button>
                <Button asChild variant="ghost" className="w-full justify-start">
                  <Link href="/dashboard/admin/audit-logs">Audit Logs</Link>
                </Button>
              </>
            )}
            {/* Add more navigation links here based on roles */}
          </nav>
        </div>
        <Button onClick={() => signOut()} variant="outline" className="w-full">
          Sign Out
        </Button>
      </aside>
      <main className="flex-grow p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
