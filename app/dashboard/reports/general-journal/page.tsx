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
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { exportToPdf } from "@/lib/pdf-export";

import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
  account: { name: string };
  category?: { name: string };
  student?: { name: string };
  user: { name: string };
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

export default function GeneralJournalReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, typeFilter, accountFilter, categoryFilter, studentFilter]);

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchFilterData();
    fetchTransactions();
  }, [session, status, router]);

  useEffect(() => {
    // Set current date only on client side after component mounts
    if (!startDate) {
      setStartDate(new Date());
    }
    if (!endDate) {
      setEndDate(new Date());
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate, typeFilter, accountFilter, categoryFilter, studentFilter, currentPage, pageSize]);

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
      setStudents(studentsData.students);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch filter data: " + err.message);
    }
  };

  const fetchTransactions = async () => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);
    if (accountFilter && accountFilter !== "all") params.append("accountId", accountFilter);
    if (categoryFilter && categoryFilter !== "all") params.append("categoryId", categoryFilter);
    if (studentFilter && studentFilter !== "all") params.append("studentId", studentFilter);
    params.append("page", currentPage.toString());
    params.append("limit", pageSize.toString());

    try {
      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await res.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch transactions: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("general-journal-report", "general-journal-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  const filteredCategoriesForFilter = categories.filter(cat => typeFilter === "all" || cat.type === typeFilter);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>General Journal Report</CardTitle>
        <CardDescription>View all financial transactions in chronological order.</CardDescription>
      </CardHeader>
      <CardContent id="general-journal-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Date</Label>
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
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
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
            <Label htmlFor="endDate">End Date</Label>
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
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
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
            <Label htmlFor="typeFilter">Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DEBIT">DEBIT (Income)</SelectItem>
                <SelectItem value="CREDIT">CREDIT (Expense)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountFilter">Account</Label>
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {financialAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoryFilter">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filteredCategoriesForFilter.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="studentFilter">Student</Label>
            <Select value={studentFilter} onValueChange={setStudentFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleExportPdf} className="mb-4">Export to PDF</Button>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{formatCurrency(transaction.amount)}</TableCell>
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

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Menampilkan {((pagination.currentPage - 1) * pagination.limit) + 1} sampai{" "}
              {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} dari{" "}
              {pagination.totalCount} transaksi
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
              >
                Sebelumnya
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    const distance = Math.abs(page - pagination.currentPage);
                    return distance === 0 || distance === 1 || page === 1 || page === pagination.totalPages;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <Button
                        variant={page === pagination.currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
