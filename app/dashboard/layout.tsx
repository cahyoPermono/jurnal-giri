"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname

  const [isMainOpen, setIsMainOpen] = useState(true);
  const [isReportsOpen, setIsReportsOpen] = useState(true);
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(true);

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

  const navLinkClass = (href: string) =>
    `w-full justify-start ${pathname === href ? "bg-gray-100 text-primary font-semibold" : ""}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
        <div>
          <img src="/logonobg.png" alt="Giri Financials Logo" className="w-32 h-auto mx-auto mb-6" />

          <Collapsible open={isMainOpen} onOpenChange={setIsMainOpen} className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-lg font-semibold text-gray-700">
              Main Navigation
              <ChevronDown className={`h-5 w-5 transition-transform ${isMainOpen ? "rotate-180" : "rotate-0"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Button asChild variant="ghost" className={navLinkClass("/dashboard")}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/students")}>
                <Link href="/dashboard/students">Manage Students</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/categories")}>
                <Link href="/dashboard/categories">Manage Categories</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/new")}>
                <Link href="/dashboard/transactions/new">Record New Transaction</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions")}>
                <Link href="/dashboard/transactions">View Transactions</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/transfer")}>
                <Link href="/dashboard/transactions/transfer">Transfer Funds</Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen} className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-lg font-semibold text-gray-700">
              Reports
              <ChevronDown className={`h-5 w-5 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/general-journal")}>
                <Link href="/dashboard/reports/general-journal">General Journal</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/profit-loss")}>
                <Link href="/dashboard/reports/profit-loss">Profit & Loss</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/cash-flow")}>
                <Link href="/dashboard/reports/cash-flow">Cash Flow</Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/student-liabilities")}>
                <Link href="/dashboard/reports/student-liabilities">Student Liabilities</Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {session.user?.role === "ADMIN" && (
            <Collapsible open={isAdminToolsOpen} onOpenChange={setIsAdminToolsOpen} className="mb-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-lg font-semibold text-gray-700">
                Admin Tools
                <ChevronDown className={`h-5 w-5 transition-transform ${isAdminToolsOpen ? "rotate-180" : "rotate-0"}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/users")}>
                  <Link href="/dashboard/admin/users">Manage Operators</Link>
                </Button>
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/audit-logs")}>
                  <Link href="/dashboard/admin/audit-logs">Audit Logs</Link>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
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
