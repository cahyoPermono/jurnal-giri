"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/pdf-export";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
  account?: { name: string };
  category?: { name: string };
  student?: { name: string };
  user?: { name: string };
  // Denormalized fields for data integrity
  accountName?: string;
  categoryName?: string;
  studentName?: string;
  userName?: string;
}

interface FinancialAccount {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
}

interface Student {
  id: string;
  name: string;
}

export default function ViewTransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Calculate default dates: start of current month to end of current month
  const now = new Date();
  const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate);
  const [typeFilter, setTypeFilter] = useState<string | undefined>("all");
  const [accountFilter, setAccountFilter] = useState<string | undefined>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>("all");
  const [studentFilter, setStudentFilter] = useState<string | undefined>("all");

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchFilterData();
    fetchTransactions();
  }, [session, status, router]);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter, accountFilter, categoryFilter, studentFilter]);

  const fetchFilterData = async () => {
    try {
      const [accountsRes, categoriesRes, studentsRes] = await Promise.all([
        fetch("/api/financial-accounts"),
        fetch("/api/categories"),
        fetch("/api/students"),
      ]);

      if (!accountsRes.ok || !categoriesRes.ok || !studentsRes.ok) {
        throw new Error("Failed to fetch filter data");
      }

      const accountsData = await accountsRes.json();
      const categoriesData = await categoriesRes.json();
      const studentsData = await studentsRes.json();

      setFinancialAccounts(accountsData);
      setCategories(categoriesData);
      setStudents(studentsData);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch filter data: " + err.message);
    }
  };

  const fetchTransactions = async () => {
    setError(null);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
    if (accountFilter && accountFilter !== "all") params.append("accountId", accountFilter);
    if (categoryFilter && categoryFilter !== "all") params.append("categoryId", categoryFilter);
    if (studentFilter && studentFilter !== "all") params.append("studentId", studentFilter);

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch transactions: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  const filteredCategoriesForFilter = categories.filter(cat => typeFilter === undefined || cat.type === typeFilter);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Lihat Transaksi</CardTitle>
        <CardDescription>Jelajahi dan filter semua transaksi keuangan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="startDate">Tanggal Mulai</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="endDate">Tanggal Akhir</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pilih tanggal</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="typeFilter">Tipe</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="DEBIT">DEBIT (Pemasukan)</SelectItem>
                <SelectItem value="CREDIT">CREDIT (Pengeluaran)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountFilter">Akun</Label>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Akun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Akun</SelectItem>
                {financialAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoryFilter">Kategori</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {filteredCategoriesForFilter.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="studentFilter">Siswa</Label>
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Semua Siswa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Siswa</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <Button onClick={() => exportToPdf('transactions-table', 'transactions.pdf')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Ekspor ke PDF
          </Button>
        </div>

        <div id="transactions-table" className="rounded-md border overflow-x-auto">
          <div style={{ display: 'none' }}>
            <p id="date-range">Tanggal: {startDate ? format(startDate, "dd/MM/yyyy") : ''} ke {endDate ? format(endDate, "dd/MM/yyyy") : ''}</p>
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Akun</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Siswa</TableHead>
                <TableHead>Dicatat Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Tidak ada transaksi ditemukan.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{Number(transaction.amount).toFixed(2)}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                    <TableCell>{transaction.accountName || transaction.account?.name || "-"}</TableCell>
                    <TableCell>{transaction.categoryName || transaction.category?.name || "-"}</TableCell>
                    <TableCell>{transaction.studentName || transaction.student?.name || "-"}</TableCell>
                    <TableCell>{transaction.userName || transaction.user?.name || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
