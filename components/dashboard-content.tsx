"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Landmark,
  BarChart3
} from "lucide-react";

interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
  isBank: boolean;
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
  const [unpaidRegistrationStudents, setUnpaidRegistrationStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{ip: string, port: string} | null>(null);

  useEffect(() => {
    fetchDashboardSummary();
    fetchUnpaidStudents();
    fetchUnpaidRegistrationStudents();
    fetchNetworkInfo();
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/network-ip');
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data);
      }
    } catch (err) {
      console.error('Error fetching network info:', err);
    }
  };

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

      const bankAccount = accounts.find((a: any) => a.name === "Bank");

      // Get current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const paidStudentIds = new Set();

      // Check SPP account transactions
      if (sppAccount) {
        const sppTransRes = await fetch(
          `/api/transactions?accountId=${sppAccount.id}&type=DEBIT&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
        );
        if (sppTransRes.ok) {
          const sppTransactions = await sppTransRes.json();
          sppTransactions.filter((t: any) => t.studentId).forEach((t: any) => paidStudentIds.add(t.studentId));
        }
      }

      // Check bank account transactions with SPP Bank category
      if (bankAccount) {
        const bankSppTransRes = await fetch(
          `/api/transactions?accountId=${bankAccount.id}&type=DEBIT&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
        );
        if (bankSppTransRes.ok) {
          const bankTransactions = await bankSppTransRes.json();
          bankTransactions
            .filter((t: any) => t.studentId && t.categoryName === "SPP Bank")
            .forEach((t: any) => paidStudentIds.add(t.studentId));
        }
      }

      const unpaid = students.filter((s: Student) => s.active && !paidStudentIds.has(s.id));
      setUnpaidStudents(unpaid);
    } catch (err: any) {
      console.error("Error fetching unpaid students:", err);
    }
  };

  const fetchUnpaidRegistrationStudents = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch("/api/students");
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const students = await studentsRes.json();

      // Fetch financial accounts
      const accRes = await fetch("/api/financial-accounts");
      if (!accRes.ok) throw new Error("Failed to fetch financial accounts");
      const accounts = await accRes.json();

      const registrationAccount = accounts.find((a: any) =>
        a.name.toLowerCase().includes("pendaftaran") ||
        a.name.toLowerCase().includes("registration") ||
        a.name.toLowerCase().includes("daftar")
      );

      const bankAccount = accounts.find((a: any) => a.name === "Bank");

      const paidStudentIds = new Set();

      // Check registration account transactions
      if (registrationAccount) {
        const regTransRes = await fetch(
          `/api/transactions?accountId=${registrationAccount.id}&type=DEBIT`
        );
        if (regTransRes.ok) {
          const regTransactions = await regTransRes.json();
          regTransactions.filter((t: any) => t.studentId).forEach((t: any) => paidStudentIds.add(t.studentId));
        }
      }

      // Check bank account transactions with Pendaftaran Bank category
      if (bankAccount) {
        const bankRegTransRes = await fetch(
          `/api/transactions?accountId=${bankAccount.id}&type=DEBIT`
        );
        if (bankRegTransRes.ok) {
          const bankTransactions = await bankRegTransRes.json();
          bankTransactions
            .filter((t: any) => t.studentId && t.categoryName === "Pendaftaran Bank")
            .forEach((t: any) => paidStudentIds.add(t.studentId));
        }
      }

      const unpaid = students.filter((s: Student) => s.active && !paidStudentIds.has(s.id));
      setUnpaidRegistrationStudents(unpaid);
    } catch (err: any) {
      console.error("Error fetching unpaid registration students:", err);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">

      {/* Network Access Information */}
      {networkInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <div className="p-1.5 bg-blue-100 rounded-full">
                <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0 9c-1.657 0-3-4.03-3-9s1.343-9 3-9m0 18c1.657 0 3-4.03 3-9s-1.343-9-3-9" />
                </svg>
              </div>
              Akses dari Jaringan
            </CardTitle>
            <CardDescription className="text-blue-600">
              Bagikan URL ini agar device lain di jaringan yang sama dapat mengakses aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white/80 p-4 rounded-lg border border-blue-200/50">
              <p className="text-sm text-gray-700 mb-2">URL untuk akses jaringan:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded text-sm font-mono text-gray-800 border">
                  http://{networkInfo.ip}:{networkInfo.port}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`http://${networkInfo.ip}:${networkInfo.port}`)}
                  className="px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  Salin
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pastikan firewall tidak memblokir port {networkInfo.port}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Students Alert */}
      {unpaidStudents.length > 0 && (
        <Card className="border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-amber-900 text-base">Siswa Belum Bayar SPP</CardTitle>
                  <CardDescription className="text-amber-700 text-sm">
                    {unpaidStudents.length} siswa perlu ditagih
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {unpaidStudents.length} siswa
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`space-y-1.5 ${unpaidStudents.length > 3 ? 'max-h-48 overflow-y-auto' : ''}`}>
              {unpaidStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 bg-white/60 rounded-md border border-amber-200/50 hover:bg-white/80 transition-colors">
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-3 w-3 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{student.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      NIS: {student.nis}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {student.contactNumber || "No contact"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/50">
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <span className="text-amber-500">💡</span>
                Kelola siswa di menu "Kelola Siswa"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unpaid Registration Students Alert */}
      {unpaidRegistrationStudents.length > 0 && (
        <Card className="border-red-300 bg-gradient-to-r from-red-50 to-pink-50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-red-900 text-base">Siswa Belum Bayar Uang Pendaftaran</CardTitle>
                  <CardDescription className="text-red-700 text-sm">
                    {unpaidRegistrationStudents.length} siswa perlu ditagih
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unpaidRegistrationStudents.length} siswa
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className={`space-y-1.5 ${unpaidRegistrationStudents.length > 3 ? 'max-h-48 overflow-y-auto' : ''}`}>
              {unpaidRegistrationStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-2 bg-white/60 rounded-md border border-red-200/50 hover:bg-white/80 transition-colors">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-3 w-3 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{student.name}</p>
                    <p className="text-xs text-gray-600 truncate">
                      NIS: {student.nis}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">
                      {student.contactNumber || "No contact"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-red-200/50">
              <p className="text-xs text-red-700 flex items-center gap-1">
                <span className="text-red-500">💡</span>
                Kelola siswa di menu "Kelola Siswa"
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Balance Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Wallet className="h-5 w-5" />
              Total Saldo
            </CardTitle>
            <CardDescription className="text-green-600">Kondisi keuangan keseluruhan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-900">{formatCurrency(summary.totalBalance)}</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">Saldo terkini</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Debit Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <TrendingUp className="h-5 w-5" />
              Pemasukan Bulan Ini
            </CardTitle>
            <CardDescription className="text-blue-600">Total debit bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(summary.monthlySummary.totalDebit)}</p>
            <div className="flex items-center mt-2">
              <DollarSign className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm text-blue-600">Dana masuk</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Credit Card */}
        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <TrendingDown className="h-5 w-5" />
              Pengeluaran Bulan Ini
            </CardTitle>
            <CardDescription className="text-red-600">Total kredit bulan ini</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-900">{formatCurrency(summary.monthlySummary.totalCredit)}</p>
            <div className="flex items-center mt-2">
              <CreditCard className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600">Dana keluar</span>
            </div>
          </CardContent>
        </Card>

        {/* Individual Account Cards */}
        {summary.financialAccounts.map((account) => (
          <Card key={account.id} className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Landmark className="h-5 w-5" />
                {account.name}
              </CardTitle>
              <CardDescription className="text-gray-600">Saldo Akun</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(account.balance)}
              </p>
              <div className="flex items-center mt-2">
                <Wallet className="h-4 w-4 text-gray-600 mr-1" />
                <span className="text-sm text-gray-600">Saldo terkini</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Monthly Chart */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <BarChart3 className="h-5 w-5" />
            Pemasukan vs Pengeluaran Bulanan
          </CardTitle>
          <CardDescription className="text-gray-600">
            Ringkasan aktivitas keuangan bulan ini
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
              />
              <YAxis
                stroke="#666"
                fontSize={12}
                tick={{ fill: '#666' }}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="amount"
                fill="url(#colorGradient)"
                radius={[4, 4, 0, 0]}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Notifications */}
      {summary.notifications.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Notifikasi
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Peringatan dan pengingat penting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.notifications.map((notification, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
