"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, FileTextIcon, CoinsIcon, TagIcon, WalletIcon, UserIcon } from "lucide-react";

import { toast } from "sonner";

interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
  financialAccountId: string | null;
  financialAccount?: {
    id: string;
    name: string;
  };
}

interface Student {
  id: string;
  name: string;
}

export default function NewTransactionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [categoryId, setCategoryId] = useState<string | undefined>("none");
  const [studentId, setStudentId] = useState<string | undefined>(undefined);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // New state

  const [error, setError] = useState<string | null>(null);
  const [isStudentRequired, setIsStudentRequired] = useState(false);
  const [shouldHideStudentField, setShouldHideStudentField] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchData();
  }, [session, status, router]);

  useEffect(() => {
    // Reset accountId if selectedCategory has a financialAccountId and it's different from current accountId
    if (selectedCategory?.financialAccountId && accountId !== selectedCategory.financialAccountId) {
      setAccountId(selectedCategory.financialAccountId);
    } else if (!selectedCategory?.financialAccountId && accountId === undefined) {
      // If no specific financial account is tied to the category, and no account is selected, select the first available
      if (financialAccounts.length > 0) {
        setAccountId(financialAccounts[0].id);
      }
    }
  }, [selectedCategory, financialAccounts, accountId]);

  useEffect(() => {
    // Set current date only on client side after component mounts
    if (!date) {
      setDate(new Date());
    }
  }, [date]);

  useEffect(() => {
    // Check if student field should be required based on selected financial account and transaction type
    if (accountId && type === "DEBIT") {
      const selectedAccount = financialAccounts.find(account => account.id === accountId);
      if (selectedAccount && (selectedAccount.name === "SPP" || selectedAccount.name === "Pendaftaran")) {
        setIsStudentRequired(true);
        setShouldHideStudentField(false);
      } else {
        setIsStudentRequired(false);
        setShouldHideStudentField(true);
        setStudentId(undefined); // Clear student selection when hiding
      }
    } else {
      setIsStudentRequired(false);
      setShouldHideStudentField(false);
    }
  }, [accountId, financialAccounts, type]);

  const fetchData = async () => {
    try {
      const [accountsRes, categoriesRes, studentsRes] = await Promise.all([
        fetch("/api/financial-accounts"),
        fetch("/api/categories"),
        fetch("/api/students"),
      ]);

      if (!accountsRes.ok || !categoriesRes.ok || !studentsRes.ok) {
        throw new Error("Failed to fetch data for form");
      }

      const accountsData = await accountsRes.json();
      const categoriesData = await categoriesRes.json();
      const studentsData = await studentsRes.json();

      setFinancialAccounts(accountsData);
      setCategories(categoriesData);
      setStudents(studentsData);

      // Set default values if data exists
      if (accountsData.length > 0) setAccountId(accountsData[0].id);
    } catch (err: any) {
      setError(err.message);
      toast.error("Gagal mengambil data formulir: " + err.message);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required student field
    if (isStudentRequired && (!studentId || studentId === "none")) {
      toast.error("Siswa wajib diisi ketika Akun Keuangan adalah SPP atau Pendaftaran");
      return;
    }

    // Validate file size on frontend
    if (proofFile && proofFile.size > 1024 * 1024) {
      toast.error("Ukuran file bukti transaksi tidak boleh lebih dari 1MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("date", date?.toISOString() || "");
      formData.append("description", description);
      formData.append("amount", amount);
      formData.append("type", type);
      formData.append("accountId", accountId || "");
      formData.append("categoryId", categoryId || "none");
      formData.append("studentId", studentId || "none");
      if (proofFile) {
        formData.append("proofFile", proofFile);
      }

      const res = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add transaction");
      }

      toast.success("Transaksi berhasil ditambahkan!");
      setDate(new Date());
      setDescription("");
      setAmount("");
      setType("DEBIT");
      setProofFile(null);
      // Keep accountId, categoryId, studentId as they might be frequently reused
    } catch (err: any) {
      toast.error("Gagal menambahkan transaksi: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  const filteredCategories = categories.filter(cat => cat.type === type);

  const filteredFinancialAccounts = selectedCategory?.financialAccountId
    ? financialAccounts.filter(account => account.id === selectedCategory.financialAccountId)
    : financialAccounts;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Catat Transaksi Baru</CardTitle>
        <CardDescription>Masukkan detail untuk transaksi keuangan baru.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleAddTransaction} className="space-y-8">
          {/* Transaction Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center text-sm font-medium">
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                Tanggal
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center text-sm font-medium">
                <FileTextIcon className="mr-2 h-4 w-4 text-chart-1" />
                Deskripsi
              </Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Masukkan deskripsi transaksi"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center text-sm font-medium">
                <CoinsIcon className="mr-2 h-4 w-4 text-chart-2" />
                Jumlah
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                placeholder="0"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center text-sm font-medium">
                <TagIcon className="mr-2 h-4 w-4 text-chart-3" />
                Jenis Transaksi
              </Label>
              <Select value={type} onValueChange={(value: "DEBIT" | "CREDIT") => setType(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT (Pemasukan)</SelectItem>
                  <SelectItem value="CREDIT">CREDIT (Pengeluaran)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Classification Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="categoryId" className="flex items-center text-sm font-medium">
                <TagIcon className="mr-2 h-4 w-4 text-chart-4" />
                Kategori
              </Label>
              <Select value={categoryId} onValueChange={(value) => {
                setCategoryId(value === "none" ? undefined : value);
                setSelectedCategory(value === "none" ? null : categories.find(cat => cat.id === value) || null);
              }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada</SelectItem>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountId" className="flex items-center text-sm font-medium">
                <WalletIcon className="mr-2 h-4 w-4 text-chart-5" />
                Akun Keuangan
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Pilih akun" />
                </SelectTrigger>
                <SelectContent>
                  {filteredFinancialAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!shouldHideStudentField && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="studentId" className="flex items-center text-sm font-medium">
                  <UserIcon className="mr-2 h-4 w-4 text-secondary" />
                  Siswa {isStudentRequired ? "" : "(Opsional)"}
                </Label>
                <Select value={studentId} onValueChange={setStudentId} required={isStudentRequired}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Pilih siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak Ada</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="proofFile" className="flex items-center text-sm font-medium">
                <FileTextIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                Bukti Transaksi (Opsional)
              </Label>
              <Input
                id="proofFile"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                Maksimal 1MB. Format yang didukung: JPG, PNG, GIF, WebP, PDF, DOC, DOCX
              </p>
              {proofFile && (
                <p className="text-xs text-green-600">
                  File dipilih: {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button type="submit" className="w-full h-12 text-lg font-semibold">
              <CoinsIcon className="mr-2 h-5 w-5" />
              Catat Transaksi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
