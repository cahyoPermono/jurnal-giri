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
  no: number;
  tanggal: string;
  uraian: string;
  amount: number;
  saldo: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface RekapPenerimaanBulanReport {
  month: number;
  year: number;
  type: string;
  report: ReportRow[];
  totalAmount: number;
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

export default function RekapPenerimaanBulanReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<RekapPenerimaanBulanReport | null>(null);
  const [month, setMonth] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [type, setType] = useState<string>("penerimaan");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  // Clear report data when type changes
  useEffect(() => {
    setReportData(null);
  }, [type]);

  const fetchReportData = async (page: number = 1) => {
    if (!month || !year) {
      toast.error("Bulan dan tahun harus diisi");
      return;
    }

    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.append("month", month);
    params.append("year", year);
    params.append("type", type);
    params.append("page", page.toString());
    params.append("limit", pageSize.toString());

    try {
      const res = await fetch(`/api/reports/rekap-penerimaan-bulan?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch rekap penerimaan bulan report");
      }
      const data = await res.json();
      setReportData(data);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch rekap penerimaan bulan report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    const filename = type === "pengeluaran"
      ? "rekap-pengeluaran-bulan-report.pdf"
      : "rekap-penerimaan-bulan-report.pdf";
    exportToPdf("rekap-penerimaan-bulan-report", filename, { type, totalAmount: reportData?.totalAmount });
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  const columnHeader = type === "pengeluaran" ? "Credit" : "Debet";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rekap Penerimaan/Pengeluaran per Bulan</CardTitle>
        <CardDescription>Laporan rekapitulasi penerimaan/pengeluaran berdasarkan bulan dan tahun.</CardDescription>
      </CardHeader>
      <CardContent id="rekap-penerimaan-bulan-report" className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="type">Tipe</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="penerimaan">Penerimaan</SelectItem>
                <SelectItem value="pengeluaran">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

        <Button onClick={() => fetchReportData(1)} disabled={loading} className="mb-4">
          {loading ? "Memuat..." : "Tampilkan Laporan"}
        </Button>

        {reportData && (
          <>
            <div className="mb-4">
              <p className="text-lg font-medium">Tipe: {type === "penerimaan" ? "Penerimaan" : "Pengeluaran"}</p>
              <p className="text-lg font-medium">Bulan: {monthNames[reportData.month]}</p>
              <p className="text-lg font-medium">Tahun: {reportData.year}</p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Uraian</TableHead>
                  <TableHead>{columnHeader}</TableHead>
                  <TableHead>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.report.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.no}</TableCell>
                    <TableCell>{row.tanggal}</TableCell>
                    <TableCell>{row.uraian}</TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{formatCurrency(row.saldo)}</TableCell>
                  </TableRow>
                ))}
                {reportData.report.length > 0 && (
                  <TableRow className="font-bold bg-gray-50">
                    <TableCell colSpan={3} className="text-right">Total</TableCell>
                    <TableCell>{formatCurrency(reportData.totalAmount)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
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
          <p className="text-gray-500 text-center">Pilih tipe, bulan dan tahun untuk melihat laporan.</p>
        )}
      </CardContent>
    </Card>
  );
}
