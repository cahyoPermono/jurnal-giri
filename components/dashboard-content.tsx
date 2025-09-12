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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardSummary();
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
