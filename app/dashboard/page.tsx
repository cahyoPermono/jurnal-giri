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
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Selamat datang di Dashboard Anda!</h2>
        <p className="mt-2 text-gray-600">Silakan pilih opsi dari sidebar untuk mulai mengelola data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kelola Siswa</h3>
          <p className="text-gray-600 mb-4">Tambah, edit, dan kelola data siswa</p>
          <a href="/dashboard/students" className="text-blue-600 hover:text-blue-800 font-medium">
            Buka Kelola Siswa →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaksi</h3>
          <p className="text-gray-600 mb-4">Catat transaksi baru dan lihat riwayat</p>
          <a href="/dashboard/transactions" className="text-blue-600 hover:text-blue-800 font-medium">
            Buka Transaksi →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Laporan</h3>
          <p className="text-gray-600 mb-4">Lihat berbagai laporan keuangan</p>
          <a href="/dashboard/reports" className="text-blue-600 hover:text-blue-800 font-medium">
            Buka Laporan →
          </a>
        </div>
      </div>
    </div>
  );
}
