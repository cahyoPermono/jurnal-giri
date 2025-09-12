"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
}

interface Student {
  id: string;
  nis: string;
  name: string;
  parentName: string | null;
  contactNumber: string | null;
  active: boolean;
  enrollmentDate: string | null;
  graduationDate: string | null;
  createdAt: string;
}

interface DashboardSummary {
  totalBalance: number;
  financialAccounts: FinancialAccount[];
  monthlySummary: {
    totalDebit: number;
    totalCredit: number;
  };
  notifications: string[]; // Placeholder for now
}

export default function DashboardContent() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [unpaidStudents, setUnpaidStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardSummary();
    fetchUnpaidStudents();
  }, []);

  const fetchDashboardSummary = async () => {
    try {
      const res = await fetch("/api/dashboard-summary");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard summary");
      }
      const data = await res.json();
      setSummary(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchUnpaidStudents = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch("/api/students");
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const students = await studentsRes.json();

      // Fetch financial accounts
      const accRes = await fetch("/api/financial-accounts");
      if (!accRes.ok) throw new Error("Failed to fetch financial accounts");
      const accounts = await accRes.json();

      const sppAccount = accounts.find((a: any) =>
        a.name.toLowerCase().includes("spp") ||
        a.name.toLowerCase().includes("sumbangan")
      );

      if (!sppAccount) {
        setUnpaidStudents([]);
        return;
      }

      // Get current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Fetch transactions with DEBIT type for SPP account
      const transRes = await fetch(
        `/api/transactions?accountId=${sppAccount.id}&type=DEBIT&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      if (!transRes.ok) throw new Error("Failed to fetch transactions");
      const transactions = await transRes.json();

      const paidStudentIds = new Set(
        transactions.filter((t: any) => t.studentId).map((t: any) => t.studentId)
      );

      const unpaid = students.filter((s: Student) => s.active && !paidStudentIds.has(s.id));
      setUnpaidStudents(unpaid);
    } catch (err: any) {
      console.error("Error fetching unpaid students:", err);
    }
  };

  if (error) {
    return <p className="text-red-500">Kesalahan: {error}</p>;
  }

  if (!summary) {
    return <p>Memuat ringkasan dashboard...</p>;
  }

  const chartData = [
    { name: "Pemasukan (Debit)", amount: summary.monthlySummary.totalDebit },
    { name: "Pengeluaran (Kredit)", amount: summary.monthlySummary.totalCredit },
  ];

  return (
    <div className="space-y-6">
      {unpaidStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Siswa Belum Bayar SPP Bulan Ini</CardTitle>
            <CardDescription>
              {unpaidStudents.length} siswa aktif yang perlu ditagih SPP bulan ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {unpaidStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      NIS: {student.nis} | Orang Tua: {student.parentName || "Tidak ada"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {student.contactNumber || "No contact"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t">
              <p className="text-sm text-gray-600">
                💡 Klik menu "Kelola Siswa" untuk melihat detail lengkap dan mengelola data siswa
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Saldo</CardTitle>
            <CardDescription>Kondisi keuangan keseluruhan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{summary.totalBalance.toFixed(2)}</p>
          </CardContent>
        </Card>

        {summary.financialAccounts.map((account) => (
          <Card key={account.id}>
            <CardHeader>
              <CardTitle>{account.name}</CardTitle>
              <CardDescription>Saldo Akun</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{typeof account.balance === 'string' ? parseFloat(account.balance).toFixed(2) : account.balance.toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pemasukan Bulanan vs Pengeluaran</CardTitle>
          <CardDescription>Ringkasan aktivitas keuangan bulan ini</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {summary.notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notifikasi</CardTitle>
            <CardDescription>Peringatan dan pengingat penting</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {summary.notifications.map((notification, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  {notification}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
