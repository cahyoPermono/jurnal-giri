import Link from "next/link";
import DashboardContent from "@/components/dashboard-content";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Utama</h1>
        <p className="text-gray-600 mt-2">Ringkasan keuangan dan aktivitas sekolah</p>
      </div>
      <DashboardContent />
    </div>
  );
}
