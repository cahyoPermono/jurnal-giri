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
  User,
  Menu,
  X,
  Settings
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md px-4 py-3 flex items-center justify-between">
        <img src="/logonobg.png" alt="Giri Financials Logo" className="h-8 w-auto" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-md p-4 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none
      `}>
        {/* Desktop Logo */}
        <div className="hidden lg:block">
          <img src="/logonobg.png" alt="Giri Financials Logo" className="w-32 h-auto mx-auto mb-6" />
        </div>

        {/* Mobile Logo */}
        <div className="lg:hidden border-b border-sidebar-border pb-4 mb-4">
          <img src="/logonobg.png" alt="Giri Financials Logo" className="w-24 h-auto mx-auto" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <Collapsible open={isMainOpen} onOpenChange={setIsMainOpen} className="mb-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-3 text-lg font-semibold text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors">
              Navigasi Utama
              <ChevronDown className={`h-5 w-5 transition-transform ${isMainOpen ? "rotate-180" : "rotate-0"}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2">
              <Button asChild variant="ghost" className={navLinkClass("/dashboard")} onClick={handleNavClick}>
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/students")} onClick={handleNavClick}>
                <Link href="/dashboard/students">
                  <Users className="h-4 w-4" />
                  Kelola Siswa
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/categories")} onClick={handleNavClick}>
                <Link href="/dashboard/categories">
                  <Tag className="h-4 w-4" />
                  Kelola Kategori
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/new")} onClick={handleNavClick}>
                <Link href="/dashboard/transactions/new">
                  <PlusCircle className="h-4 w-4" />
                  Catat Transaksi Baru
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions")} onClick={handleNavClick}>
                <Link href="/dashboard/transactions">
                  <List className="h-4 w-4" />
                  Lihat Transaksi
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/transactions/transfer")} onClick={handleNavClick}>
                <Link href="/dashboard/transactions/transfer">
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Dana
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/liabilities")} onClick={handleNavClick}>
                <Link href="/dashboard/liabilities">
                  <CreditCard className="h-4 w-4" />
                  Kelola Hutang
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
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/profit-loss")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/profit-loss">
                  <TrendingUp className="h-4 w-4" />
                  Laba Rugi
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/rekap-semester")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/rekap-semester">
                  <Calendar className="h-4 w-4" />
                  Rekap Semester
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/rekap-penerimaan-bulan")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/rekap-penerimaan-bulan">
                  <DollarSign className="h-4 w-4" />
                  Rekap Penerimaan/Pengeluaran Bulan
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/laporan-keuangan-bulanan")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/laporan-keuangan-bulanan">
                  <FileText className="h-4 w-4" />
                  Laporan Keuangan Bulanan
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/buku-kas-bulanan")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/buku-kas-bulanan">
                  <FileText className="h-4 w-4" />
                  Buku Kas Bulanan
                </Link>
              </Button>
              <Button asChild variant="ghost" className={navLinkClass("/dashboard/reports/student-liabilities")} onClick={handleNavClick}>
                <Link href="/dashboard/reports/student-liabilities">
                  <CreditCard className="h-4 w-4" />
                  Tanggungan Siswa
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
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/users")} onClick={handleNavClick}>
                  <Link href="/dashboard/admin/users">
                    <UserCog className="h-4 w-4" />
                    Kelola Operator
                  </Link>
                </Button>
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/parameters")} onClick={handleNavClick}>
                  <Link href="/dashboard/admin/parameters">
                    <Settings className="h-4 w-4" />
                    Kelola Parameter
                  </Link>
                </Button>
                <Button asChild variant="ghost" className={navLinkClass("/dashboard/admin/audit-logs")} onClick={handleNavClick}>
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

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 pt-16 lg:pt-0 p-4 lg:p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
