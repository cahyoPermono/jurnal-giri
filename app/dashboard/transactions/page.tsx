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
import { CalendarIcon, DownloadIcon, EyeIcon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";
import { exportToPdf } from "@/lib/pdf-export";
import ThermalReceipt from "@/components/thermal-receipt";

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
  studentNis?: string;
  studentGroup?: string;
  userName?: string;
  proofFile?: string;
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
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

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

  const handlePrintReceipt = (transaction: Transaction) => {
    setReceiptTransaction(transaction);
    setShowReceipt(true);
  };

  const handlePrint = () => {
    if (receiptTransaction) {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Nota Transaksi</title>
              <style>
                @media print {
                  @page {
                    size: 58mm auto;
                    margin: 0;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  .thermal-receipt {
                    width: 48mm;
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    line-height: 1.2;
                    margin: 0 auto;
                    padding: 5mm;
                    background: white;
                    color: black;
                  }
                  .thermal-receipt * {
                    box-sizing: border-box;
                  }
                }
                @media screen {
                  .thermal-receipt {
                    width: 58mm;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.4;
                    margin: 20px auto;
                    padding: 10px;
                    border: 1px solid #ccc;
                    background: white;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                  }
                }
              </style>
            </head>
            <body>
              <div class="thermal-receipt">
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 5px;">
                  <div style="font-size: 14px; font-weight: bold; margin-bottom: 3px;">KWITANSI PEMBAYARAN</div>
                  <div style="font-size: 11px; font-weight: bold;">Yayasan Pendidikan dan dakwah muslimat NU SUNAN GIRI</div>
                  <div style="font-size: 9px;">Taman pengasuhan anak INDIRA GIRI & Kelompok Bermain SUNAN GIRI</div>
                  <div style="font-size: 8px;">JL HOS COKROAMINOTO 7 Balung Jember 68181</div>
                  <div style="font-size: 8px;">WA 087743495335</div>
                </div>

                <!-- Separator -->
                <div style="border-top: 2px solid #000; margin: 8px 0;"></div>

                <!-- Receipt Number and Date -->
                <div style="margin-bottom: 8px;">
                  <div style="display: flex; justify-content: space-between; font-size: 9px;">
                    <div><strong>No. Kwitansi:</strong> ${receiptTransaction.id.slice(-8).toUpperCase()}</div>
                    <div><strong>Tanggal:</strong> ${new Date(receiptTransaction.date).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </div>
                </div>

                <!-- Separator -->
                <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

                <!-- Student Details (if applicable) -->
                ${receiptTransaction.studentName ? `
                <div style="margin-bottom: 8px;">
                  <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">TELAH TERIMA DARI:</div>
                  <div style="font-size: 9px;">Nama Siswa: ${receiptTransaction.studentName}</div>
                  ${receiptTransaction.studentNis ? `<div style="font-size: 9px;">NIS: ${receiptTransaction.studentNis}</div>` : ''}
                  ${receiptTransaction.studentGroup ? `<div style="font-size: 9px;">Kelompok: ${receiptTransaction.studentGroup}</div>` : ''}
                </div>
                ` : ''}

                <!-- Payment Details -->
                <div style="margin-bottom: 8px;">
                  <div style="font-size: 10px; font-weight: bold; margin-bottom: 3px;">UNTUK PEMBAYARAN:</div>
                  <div style="font-size: 9px; word-wrap: break-word;">${receiptTransaction.description}</div>
                  ${receiptTransaction.categoryName ? `<div style="font-size: 9px;">Kategori: ${receiptTransaction.categoryName}</div>` : ''}
                </div>

                <!-- Amount Section -->
                <div style="border: 2px solid #000; padding: 8px; margin: 8px 0; text-align: center;">
                  <div style="font-size: 12px; font-weight: bold; margin-bottom: 3px;">JUMLAH BAYAR</div>
                  <div style="font-size: 16px; font-weight: bold;">
                    ${new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(receiptTransaction.amount)}
                  </div>
                  <div style="font-size: 9px; margin-top: 3px;">
                    (${receiptTransaction.type === 'DEBIT' ? 'Pemasukan' : receiptTransaction.type === 'CREDIT' ? 'Pengeluaran' : 'Transfer'})
                  </div>
                </div>

                <!-- Account Info -->
                ${receiptTransaction.accountName ? `
                <div style="margin-bottom: 8px; font-size: 9px;">
                  <div><strong>Akun:</strong> ${receiptTransaction.accountName}</div>
                </div>
                ` : ''}

                <!-- Recorded By -->
                <div style="margin-bottom: 8px; font-size: 9px;">
                  <div><strong>Dicatat oleh:</strong> ${receiptTransaction.userName}</div>
                </div>

                <!-- Footer -->
                <div style="text-align: center; margin-top: 10px; font-size: 9px;">
                  <div style="font-weight: bold;">Terima Kasih atas Pembayaran Anda</div>
                  <div style="margin-top: 3px;">KB SUNAN GIRI</div>
                </div>

                <!-- Signatures -->
                <div style="margin-top: 15px; font-size: 9px;">
                  <div style="display: flex; justify-content: space-between;">
                    <div style="text-align: center;">
                      <div style="margin-bottom: 20px;">Pengelola KB</div>
                      <div style="border-top: 1px solid #000; padding-top: 2px;">Zulfa Mazidah, S.Pd.I</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="margin-bottom: 20px;">Bendahara</div>
                      <div style="border-top: 1px solid #000; padding-top: 2px;">Wiwin Fauziyah, S.sos</div>
                    </div>
                  </div>
                </div>

                <!-- Print timestamp -->
                <div style="text-align: center; margin-top: 10px; font-size: 8px; border-top: 1px dashed #000; padding-top: 5px;">
                  <div>Diprint: ${new Date().toLocaleString('id-ID')}</div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        // Add a small delay to ensure content is loaded before printing
        setTimeout(() => {
          printWindow.print();
          // Close the print window after printing
          printWindow.onafterprint = () => {
            printWindow.close();
          };
        }, 100);
      }
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    setReceiptTransaction(null);
  };

  const exportProofsToPdf = async () => {
    const transactionsWithProofs = transactions.filter(t => t.proofFile);

    if (transactionsWithProofs.length === 0) {
      toast.error("Tidak ada transaksi dengan bukti untuk diekspor");
      return;
    }

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15; // Reduced margin for more space

      // Header
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('BUKTI TRANSAKSI', pageWidth / 2, margin, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text('KB SUNAN GIRI', pageWidth / 2, margin + 6, { align: 'center' });

      // Add date range information
      const dateRangeText = startDate && endDate
        ? `Periode: ${startDate.toLocaleDateString('id-ID')} - ${endDate.toLocaleDateString('id-ID')}`
        : 'Semua Periode';
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text(dateRangeText, pageWidth / 2, margin + 12, { align: 'center' });

      let yPosition = margin + 20;

      for (const transaction of transactionsWithProofs) {
        // Check if we need a new page (leave space for signature)
        if (yPosition > pageHeight - 80) {
          pdf.addPage();
          yPosition = margin;
        }

        // Transaction details - only essential info
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const dateStr = new Date(transaction.date).toLocaleDateString('id-ID');
        const amountStr = `Rp ${Number(transaction.amount).toLocaleString('id-ID')}`;

        pdf.text(`Tanggal: ${dateStr}`, margin, yPosition);
        yPosition += 4;
        pdf.text(`Deskripsi: ${transaction.description}`, margin, yPosition);
        yPosition += 4;
        pdf.text(`Jumlah: ${amountStr}`, margin, yPosition);
        yPosition += 4;
        pdf.text(`Tipe: ${transaction.type}`, margin, yPosition);
        yPosition += 6;

        // Try to add the proof image
        if (transaction.proofFile) {
          try {
            const response = await fetch(transaction.proofFile);
            if (response.ok) {
              const blob = await response.blob();
              if (blob.type.startsWith('image/')) {
                const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(blob);
                });

                // Create image element to get dimensions
                const img = new Image();
                await new Promise((resolve) => {
                  img.onload = resolve;
                  img.src = base64;
                });

                // Calculate proportional dimensions to fit within page
                const maxWidth = pageWidth - 2 * margin;
                const maxHeight = 60; // Smaller height for more compact layout

                let imgWidth = maxWidth;
                let imgHeight = (img.height * maxWidth) / img.width;

                // If height exceeds max, scale down
                if (imgHeight > maxHeight) {
                  imgHeight = maxHeight;
                  imgWidth = (img.width * maxHeight) / img.height;
                }

                pdf.addImage(base64, 'JPEG', margin, yPosition, imgWidth, imgHeight);
                yPosition += imgHeight + 8;
              } else {
                pdf.setFontSize(8);
                pdf.text(`Bukti: ${blob.type} - Tidak dapat ditampilkan`, margin, yPosition);
                yPosition += 8;
              }
            }
          } catch (error) {
            pdf.setFontSize(8);
            pdf.text(`Bukti: Gagal memuat file`, margin, yPosition);
            yPosition += 8;
          }
        }

        // Smaller space between transactions
        yPosition += 10;
      }

      // Add signature at the end
      const currentDate = new Date();
      const formattedDate = `${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`;

      pdf.setFontSize(8);
      pdf.text(`Jember, ${formattedDate}`, pageWidth - margin - 50, yPosition);

      const titleY = yPosition + 5;
      pdf.text('Pengelola KB', margin, titleY);
      pdf.text('Bendahara', pageWidth - margin - 50, titleY);

      const signatureY = titleY + 15;
      pdf.text('(Zulfa Mazidah, S.Pd.I)', margin, signatureY);
      pdf.text('(Wiwin Fauziyah, S.sos)', pageWidth - margin - 50, signatureY);

      pdf.save('bukti-transaksi.pdf');
      toast.success("PDF bukti berhasil diekspor");
    } catch (error) {
      console.error("Error exporting proofs to PDF:", error);
      toast.error("Gagal mengekspor PDF bukti");
    }
  };

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

        <div className="flex justify-end mb-4 space-x-2">
          <Button onClick={() => exportProofsToPdf()} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export Bukti
          </Button>
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
                <TableHead>Bukti</TableHead>
                <TableHead>Print</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
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
                    <TableCell>
                      {transaction.proofFile ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(transaction.proofFile, '_blank')}
                        >
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Lihat
                        </Button>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReceipt(transaction)}
                      >
                        <PrinterIcon className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Receipt Modal */}
      {showReceipt && receiptTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Preview Nota Thermal</h3>
              <button
                onClick={handleCloseReceipt}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <ThermalReceipt
                transaction={receiptTransaction}
                onClose={handleCloseReceipt}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCloseReceipt}
              >
                Batal
              </Button>
              <Button
                onClick={handlePrint}
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Nota
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
