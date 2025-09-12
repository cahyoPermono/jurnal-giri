import Link from "next/link";
import DashboardContent from "@/components/dashboard-content";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ringkasan Admin</h2>
      <p className="text-gray-600">Ini adalah konten khusus admin. Gunakan sidebar untuk navigasi.</p>
      <DashboardContent />
    </div>
  );
}
