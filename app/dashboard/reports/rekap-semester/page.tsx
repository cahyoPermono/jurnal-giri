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
  bulan: number;
  saldoAwal: number;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
}

interface RekapSemesterReport {
  semester: number;
  academicYear: string;
  report: ReportRow[];
}

const monthNames = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function RekapSemesterReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<RekapSemesterReport | null>(null);
  const [semester, setSemester] = useState<string>("1");
  const [academicYear, setAcademicYear] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  const fetchReportData = async () => {
    if (!academicYear) {
      toast.error("Tahun ajaran harus diisi");
      return;
    }

    setError(null);
    const params = new URLSearchParams();
    params.append("semester", semester);
    params.append("academicYear", academicYear);

    try {
      const res = await fetch(`/api/reports/rekap-semester?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch rekap semester report");
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch rekap semester report: " + err.message);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("rekap-semester-report", "rekap-semester-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rekap Penerimaan dan Pengeluaran per Semester</CardTitle>
        <CardDescription>Laporan rekapitulasi penerimaan dan pengeluaran berdasarkan semester.</CardDescription>
      </CardHeader>
      <CardContent id="rekap-semester-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Semester 1</SelectItem>
                <SelectItem value="2">Semester 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="academicYear">Tahun Ajaran</Label>
            <Input
              id="academicYear"
              placeholder="Contoh: 2018/2019"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={fetchReportData} className="mb-4">Tampilkan Laporan</Button>

        {reportData && (
          <>
            <div className="mb-4">
              <p className="text-lg font-medium">Semester: {reportData.semester}</p>
              <p className="text-lg font-medium">Tahun Ajaran: {reportData.academicYear}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bulan</TableHead>
                  <TableHead>Saldo Awal</TableHead>
                  <TableHead>Penerimaan</TableHead>
                  <TableHead>Pengeluaran</TableHead>
                  <TableHead>Saldo Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.report.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{monthNames[row.bulan]}</TableCell>
                    <TableCell>{formatCurrency(row.saldoAwal)}</TableCell>
                    <TableCell>{formatCurrency(row.penerimaan)}</TableCell>
                    <TableCell>{formatCurrency(row.pengeluaran)}</TableCell>
                    <TableCell>{formatCurrency(row.saldoAkhir)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Button onClick={handleExportPdf} className="mt-4">Ekspor ke PDF</Button>
          </>
        )}

        {!reportData && !error && (
          <p className="text-gray-500 text-center">Pilih semester dan tahun ajaran untuk melihat laporan.</p>
        )}
      </CardContent>
    </Card>
  );
}
