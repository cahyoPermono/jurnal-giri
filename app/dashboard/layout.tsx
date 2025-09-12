"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  LayoutDashboard,
  Users,
  Tag,
  PlusCircle,
  List,
  ArrowRightLeft,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  UserCog,
  Shield,
  LogOut,
  User
} from "lucide-react";
import type { Session } from "next-auth";

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
    return <p className="flex min-h-screen items-center justify-center">Memuat dashboard...</p>;
  }

  if (!session) {
    return null; // Or a loading spinner, as redirect will happen
  }

  const navLinkClass = (href: string) =>
    `w-full justify-start gap-3 px-3 py-2 h-auto text-left font-normal transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${
      pathname === href
        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        : "text-sidebar-foreground"
    }`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white shadow-md p-4 flex flex-col justify-between">
        <div>
          <img src="/logonobg.png" alt="Giri Financials Logo" className="w-32 h-auto mx-auto mb-6" />

          <Collapsible open={isMainOpen} onOpenChange={setIsMainOpen} className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
              Navigasi Utama
              <ChevronDown className={`h-5 w-5 transition-transform ${isMainOpen ? "rotate-180" : "rotate-0"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Button asChild variant="ghost" className={navLinkClass("/dashboard")}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/students")}>
                <Link href="/dashboard/students">
                  <Users className="h-4 w-4" />
                  Kelola Siswa
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/categories")}>
                <Link href="/dashboard/categories">
                  <Tag className="h-4 w-4" />
                  Kelola Kategori
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/new")}>
                <Link href="/dashboard/transactions/new">
                  <PlusCircle className="h-4 w-4" />
                  Catat Transaksi Baru
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions")}>
                <Link href="/dashboard/transactions">
                  <List className="h-4 w-4" />
                  Lihat Transaksi
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/transfer")}>
                <Link href="/dashboard/transactions/transfer">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Dana
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Collapsible open={isReportsOpen} onOpenChange={setIsReportsOpen} className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
              Laporan
              <ChevronDown className={`h-5 w-5 transition-transform ${isReportsOpen ? "rotate-180" : "rotate-0"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/general-journal")}>
                <Link href="/dashboard/reports/general-journal">
                  <FileText className="h-4 w-4" />
                  Jurnal Umum
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/profit-loss")}>
                <Link href="/dashboard/reports/profit-loss">
                  <TrendingUp className="h-4 w-4" />
                  Laba Rugi
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/cash-flow")}>
                <Link href="/dashboard/reports/cash-flow">
                  <DollarSign className="h-4 w-4" />
                  Arus Kas
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/rekap-semester")}>
                <Link href="/dashboard/reports/rekap-semester">
                  <Calendar className="h-4 w-4" />
                  Rekap Semester
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/student-liabilities")}>
                <Link href="/dashboard/reports/student-liabilities">
                  <CreditCard className="h-4 w-4" />
                  Hutang Siswa
                </Link>
              </Button>
            </CollapsibleContent>
          </Collapsible>

          {(session as Session)?.user?.role === "ADMIN" && (
            <Collapsible open={isAdminToolsOpen} onOpenChange={setIsAdminToolsOpen} className="mb-2">
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
                Alat Admin
                <ChevronDown className={`h-5 w-5 transition-transform ${isAdminToolsOpen ? "rotate-180" : "rotate-0"}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/users")}>
                  <Link href="/dashboard/admin/users">
                    <UserCog className="h-4 w-4" />
                    Kelola Operator
                  </Link>
                </Button>
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/audit-logs")}>
                  <Link href="/dashboard/admin/audit-logs">
                    <Shield className="h-4 w-4" />
                    Log Audit
                  </Link>
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>

        {/* User Info Section */}
        <div className="border-t border-sidebar-border pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
              <User className="h-4 w-4 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {(session as Session)?.user?.name || "User"}
              </p>
              <p className="text-xs text-sidebar-foreground/70 capitalize">
                {(session as Session)?.user?.role?.toLowerCase() || "user"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full gap-3 justify-start px-3 py-2 h-auto text-left font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </Button>
        </div>
      </aside>
      <main className="flex-grow p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
