"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { exportToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

interface CategoryBreakdown {
  category: string;
  amount: number;
}

interface ProfitLossReport {
  totalDebit: number;
  totalCredit: number;
  netProfitLoss: number;
  incomeBreakdown: CategoryBreakdown[];
  expenseBreakdown: CategoryBreakdown[];
}

export default function ProfitLossReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<ProfitLossReport | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchReportData();
  }, [session, status, router]);

  useEffect(() => {
    // Set current month date range only on client side after component mounts
    if (!startDate || !endDate) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(startOfMonth);
      setEndDate(endOfMonth);
    }
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setError(null);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    try {
      const res = await fetch(`/api/reports/profit-loss?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch profit/loss report");
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch profit/loss report: " + err.message);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("profit-loss-report", "profit-loss-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Laporan Laba Rugi</CardTitle>
        <CardDescription>Analisis keuangan komprehensif dengan rincian penerimaan dan pengeluaran berdasarkan kategori.</CardDescription>
      </CardHeader>
      <CardContent id="profit-loss-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={fetchReportData} variant="default">
            Buat Laporan
          </Button>
          <Button onClick={handleExportPdf} variant="outline">
            Ekspor ke PDF
          </Button>
        </div>

        {reportData && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Penerimaan</p>
                      <p className="text-2xl font-bold text-green-600">
                        Rp {reportData.totalDebit.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-8 w-8 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Pengeluaran</p>
                      <p className="text-2xl font-bold text-red-600">
                        Rp {reportData.totalCredit.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className={`h-8 w-8 ${reportData.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Laba Rugi Bersih</p>
                      <p className={`text-2xl font-bold ${reportData.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Rp {reportData.netProfitLoss.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Rincian Penerimaan berdasarkan Kategori</CardTitle>
                <CardDescription>Sumber penerimaan terperinci</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Persentase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.incomeBreakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="text-right text-green-600">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {reportData.totalDebit > 0
                            ? ((item.amount / reportData.totalDebit) * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.incomeBreakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Tidak ada data penerimaan untuk periode yang dipilih
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Expense Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Rincian Pengeluaran berdasarkan Kategori</CardTitle>
                <CardDescription>Kategori pengeluaran terperinci</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kategori</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-right">Persentase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.expenseBreakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.category}</TableCell>
                        <TableCell className="text-right text-red-600">
                          Rp {item.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {reportData.totalCredit > 0
                            ? ((item.amount / reportData.totalCredit) * 100).toFixed(1)
                            : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.expenseBreakdown.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          Tidak ada data pengeluaran untuk periode yang dipilih
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {!reportData && !error && (
          <p className="text-gray-500 text-center">Pilih rentang tanggal untuk melihat laporan.</p>
        )}
      </CardContent>
    </Card>
  );
}
