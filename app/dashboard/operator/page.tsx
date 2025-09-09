import DashboardContent from "@/components/dashboard-content";

export default function OperatorDashboardPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Operator Overview</h2>
      <p className="text-gray-600">This is the operator specific content. Use the sidebar for navigation.</p>
      <DashboardContent />
    </div>
  );
}
