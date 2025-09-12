import DashboardContent from "@/components/dashboard-content";

export default function OperatorDashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Ringkasan Operator</h2>
      <p className="text-gray-600">Ini adalah konten khusus operator. Gunakan sidebar untuk navigasi.</p>
      <DashboardContent />
    </div>
  );
}
