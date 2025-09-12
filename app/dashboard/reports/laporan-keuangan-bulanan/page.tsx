"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { exportToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

interface ReportRow {
  no1: number | string;
  penerimaan: string;
  totalPenerimaan: number | string;
  no2: number | string;
  pengeluaran: string;
  totalPengeluaran: number | string;
}

interface LaporanKeuanganBulananReport {
  month: number;
  year: number;
  report: ReportRow[];
  saldoAkhir: number;
  signatureDate: string;
}

const monthNames = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatCurrency = (amount: number | string) => {
  if (typeof amount === 'string' || amount === 0) return amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function LaporanKeuanganBulananReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<LaporanKeuanganBulananReport | null>(null);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  const fetchReportData = async () => {
    if (!month || !year) {
      toast.error("Bulan dan tahun harus diisi");
      return;
    }

    setError(null);
    const params = new URLSearchParams();
    params.append("month", month);
    params.append("year", year);

    try {
      const res = await fetch(`/api/reports/laporan-keuangan-bulanan?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch laporan keuangan bulanan report");
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch laporan keuangan bulanan report: " + err.message);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("laporan-keuangan-bulanan-report", "laporan-keuangan-bulanan-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Laporan Keuangan Bulanan</CardTitle>
        <CardDescription>Laporan keuangan bulanan KB Sunan Giri.</CardDescription>
      </CardHeader>
      <CardContent id="laporan-keuangan-bulanan-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="month">Bulan</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {monthNames.slice(1).map((name, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="year">Tahun</Label>
            <Input
              id="year"
              placeholder="Contoh: 2018"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={fetchReportData} className="mb-4">Tampilkan Laporan</Button>

        {reportData && (
          <>
            <div className="mb-4">
              <p className="text-lg font-medium">Bulan: {monthNames[reportData.month]}</p>
              <p className="text-lg font-medium">Tahun: {reportData.year}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Penerimaan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Pengeluaran</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.report.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.no1}</TableCell>
                    <TableCell>{row.penerimaan}</TableCell>
                    <TableCell>{formatCurrency(row.totalPenerimaan)}</TableCell>
                    <TableCell>{row.no2}</TableCell>
                    <TableCell>{row.pengeluaran}</TableCell>
                    <TableCell>{formatCurrency(row.totalPengeluaran)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 text-right">
              <p className="text-lg font-medium">Saldo akhir bulan: {formatCurrency(reportData.saldoAkhir)}</p>
            </div>

            <Button onClick={handleExportPdf} className="mt-4">Ekspor ke PDF</Button>
          </>
        )}

        {!reportData && !error && (
          <p className="text-gray-500 text-center">Pilih bulan dan tahun untuk melihat laporan.</p>
        )}
      </CardContent>
    </Card>
  );
}
