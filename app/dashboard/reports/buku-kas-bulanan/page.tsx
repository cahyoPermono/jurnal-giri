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
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface BukuKasEntry {
  tanggal: string;
  no: number;
  uraian: string;
  debet: number;
  credit: number;
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

export default function BukuKasBulananReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<BukuKasEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [minggu, setMinggu] = useState<string>("");
  const [bulan, setBulan] = useState<string>("");
  const [tahun, setTahun] = useState<string>("");
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

  const fetchReportData = async (page: number = 1) => {
    if (!minggu || !bulan || !tahun) {
      toast.error("Semua field harus diisi");
      return;
    }

    setError(null);
    setLoading(true);

    const params = new URLSearchParams();
    params.append("minggu", minggu);
    params.append("bulan", bulan);
    params.append("tahun", tahun);
    params.append("page", page.toString());
    params.append("limit", pageSize.toString());

    try {
      const res = await fetch(`/api/reports/buku-kas-bulanan?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch buku kas bulanan report");
      }
      const data = await res.json();
      setReportData(data.entries);
      setPagination(data.pagination);
      setCurrentPage(page);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch buku kas bulanan report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("buku-kas-bulanan-report", "buku-kas-bulanan-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Buku Kas Bulanan</CardTitle>
        <CardDescription>Laporan transaksi kas bulanan berdasarkan minggu, bulan, dan tahun.</CardDescription>
      </CardHeader>
      <CardContent id="buku-kas-bulanan-report" className="space-y-6">
        {/* Hidden elements for PDF export */}
        <div style={{ display: 'none' }}>
          <p>Bulan: {bulan ? ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][parseInt(bulan) - 1] : ''}</p>
          <p>Tahun: {tahun}</p>
          <p>{minggu === '1-2' ? 'Minggu ke 1-2' : minggu === '3-4' ? 'Minggu ke 3-4' : ''}</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="grid gap-2">
            <Label htmlFor="minggu">Minggu</Label>
            <Select value={minggu} onValueChange={setMinggu}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih minggu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2">Minggu ke 1-2</SelectItem>
                <SelectItem value="3-4">Minggu ke 3-4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulan">Bulan</Label>
            <Select value={bulan} onValueChange={setBulan}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Januari</SelectItem>
                <SelectItem value="2">Februari</SelectItem>
                <SelectItem value="3">Maret</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">Mei</SelectItem>
                <SelectItem value="6">Juni</SelectItem>
                <SelectItem value="7">Juli</SelectItem>
                <SelectItem value="8">Agustus</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">Oktober</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">Desember</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tahun">Tahun</Label>
            <Input
              id="tahun"
              type="number"
              placeholder="Masukkan tahun"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              min="2000"
              max="2100"
            />
          </div>
        </div>

        <Button onClick={() => fetchReportData(1)} disabled={loading} className="mb-4">
          {loading ? "Memuat..." : "Tampilkan Laporan"}
        </Button>

        {reportData.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>No.</TableHead>
                  <TableHead>Uraian</TableHead>
                  <TableHead className="text-right">Debet</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((entry, index) => {
                  // Baris kosong
                  if (entry.no === 0 && entry.uraian === "") {
                    return (
                      <TableRow key={index}>
                        <TableCell colSpan={6} className="h-4"></TableCell>
                      </TableRow>
                    );
                  }

                  // Baris total
                  if (entry.uraian === "TOTAL") {
                    return (
                      <TableRow key={index} className="border-t-2 font-bold bg-gray-50">
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="font-bold">{entry.uraian}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(entry.debet)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(entry.credit)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(entry.saldo)}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  // Baris normal
                  return (
                    <TableRow key={index}>
                      <TableCell>{entry.tanggal}</TableCell>
                      <TableCell>{entry.no}</TableCell>
                      <TableCell>{entry.uraian}</TableCell>
                      <TableCell className="text-right">
                        {entry.debet > 0 ? formatCurrency(entry.debet) : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : ""}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(entry.saldo)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Menampilkan {((pagination.currentPage - 1) * pagination.limit) + 1} sampai{" "}
                  {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} dari{" "}
                  {pagination.totalCount} entries
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchReportData(currentPage - 1)}
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
                    disabled={!pagination.hasNextPage || loading}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

            <Button onClick={handleExportPdf} className="mt-4">Ekspor ke PDF</Button>
          </>
        )}

        {!reportData.length && !error && !loading && (
          <p className="text-gray-500 text-center">Pilih filter dan klik "Tampilkan Laporan" untuk melihat data.</p>
        )}
      </CardContent>
    </Card>
  );
}
