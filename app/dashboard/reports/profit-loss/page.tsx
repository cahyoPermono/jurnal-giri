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

interface ProfitLossReport {
  totalDebit: number;
  totalCredit: number;
  netProfitLoss: number;
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
        <CardTitle>Simple Profit and Loss Report</CardTitle>
        <CardDescription>Summary of income (debit) and expenses (credit).</CardDescription>
      </CardHeader>
      <CardContent id="profit-loss-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
        </div>

        <Button onClick={handleExportPdf} className="mb-4">Export to PDF</Button>

        {reportData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium">Total Income (Debit):</p>
              <p className="text-lg font-bold text-green-600">{parseFloat(reportData.totalDebit).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium">Total Expenses (Credit):</p>
              <p className="text-lg font-bold text-red-600">{parseFloat(reportData.totalCredit).toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <p className="text-xl font-semibold">Net Profit/Loss:</p>
              <p className={`text-xl font-bold ${parseFloat(reportData.netProfitLoss) >= 0 ? "text-green-700" : "text-red-700"}`}>
                {parseFloat(reportData.netProfitLoss).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {!reportData && !error && (
          <p className="text-gray-500 text-center">Select a date range to view the report.</p>
        )}
      </CardContent>
    </Card>
  );
}
