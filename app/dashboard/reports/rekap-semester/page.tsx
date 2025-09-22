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
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ReportRow {
  bulan: number;
  saldoAwal: number;
  penerimaan: number;
  pengeluaran: number;
  saldoAkhir: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RekapSemesterReport {
  semester: number;
  academicYear: string;
  report: ReportRow[];
  pagination?: PaginationInfo;
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  const fetchReportData = async (page: number = 1) => {
    if (!academicYear) {
      toast.error("Tahun ajaran harus diisi");
      return;
    }

    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.append("semester", semester);
    params.append("academicYear", academicYear);
    params.append("page", page.toString());
    params.append("limit", pageSize.toString());

    try {
      const res = await fetch(`/api/reports/rekap-semester?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch rekap semester report");
      }
      const data = await res.json();
      setReportData(data);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch rekap semester report: " + err.message);
    } finally {
      setLoading(false);
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

        <Button onClick={() => fetchReportData(1)} disabled={loading} className="mb-4">
          {loading ? "Memuat..." : "Tampilkan Laporan"}
        </Button>

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

            {reportData.pagination && reportData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Menampilkan {((reportData.pagination.currentPage - 1) * reportData.pagination.limit) + 1} sampai{" "}
                  {Math.min(reportData.pagination.currentPage * reportData.pagination.limit, reportData.pagination.totalCount)} dari{" "}
                  {reportData.pagination.totalCount} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchReportData(currentPage - 1)}
                    disabled={!reportData.pagination.hasPrevPage || loading}
                  >
                    Sebelumnya
                  </Button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: reportData.pagination.totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        const distance = Math.abs(page - reportData.pagination!.currentPage);
                        return distance === 0 || distance === 1 || page === 1 || page === reportData.pagination!.totalPages;
                      })
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={page === reportData.pagination!.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => fetchReportData(page)}
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
                    onClick={() => fetchReportData(currentPage + 1)}
                    disabled={!reportData.pagination.hasNextPage || loading}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

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
