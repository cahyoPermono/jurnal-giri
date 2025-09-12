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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { exportToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

interface CashFlowReport {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
}

export default function CashFlowReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<CashFlowReport | null>(null);
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
    // Set current date only on client side after component mounts
    if (!startDate) {
      setStartDate(new Date());
    }
    if (!endDate) {
      setEndDate(new Date());
    }
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setError(null);
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());

    try {
      const res = await fetch(`/api/reports/cash-flow?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch cash flow report");
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch cash flow report: " + err.message);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("cash-flow-report", "cash-flow-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Laporan Arus Kas</CardTitle>
        <CardDescription>Ringkasan pemasukan dan pengeluaran kas.</CardDescription>
      </CardHeader>
      <CardContent id="cash-flow-report" className="space-y-6">
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

        <Button onClick={handleExportPdf} className="mb-4">Ekspor ke PDF</Button>

        {reportData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium">Total Pemasukan:</p>
              <p className="text-lg font-bold text-green-600">{reportData.totalCashIn.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium">Total Pengeluaran:</p>
              <p className="text-lg font-bold text-red-600">{reportData.totalCashOut.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <p className="text-xl font-semibold">Arus Kas Bersih:</p>
              <p className={`text-xl font-bold ${reportData.netCashFlow >= 0 ? "text-green-700" : "text-red-700"}`}>
                {reportData.netCashFlow.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {!reportData && !error && (
          <p className="text-gray-500 text-center">Pilih rentang tanggal untuk melihat laporan.</p>
        )}
      </CardContent>
    </Card>
  );
}
