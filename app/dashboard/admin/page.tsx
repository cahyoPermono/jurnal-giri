import Link from "next/link";
import DashboardContent from "@/components/dashboard-content";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Admin Overview</h2>
      <p className="text-gray-600">This is the admin specific content. Use the sidebar for navigation.</p>
      <DashboardContent />
    </div>
  );
}
