"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon, BellIcon, CreditCardIcon, DollarSignIcon } from "lucide-react";
import { toast } from "sonner";

interface Liability {
  id: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  description?: string;
  notes?: string;
  transaction?: {
    id: string;
    description: string;
    date: string;
  };
  user?: {
    name?: string;
    email?: string;
  };
  createdAt: string;
}

export default function LiabilitiesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [summary, setSummary] = useState({ pending: 0, overdue: 0, total: 0 });
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all");
  const [vendorFilter, setVendorFilter] = useState<string | undefined>("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchSummaryData = async () => {
        try {
          const res = await fetch('/api/liabilities'); // Fetch all liabilities
          if (!res.ok) {
            console.error('Failed to fetch summary data');
            return;
          }
          const allLiabilities: Liability[] = await res.json();
          const totalPending = allLiabilities
            .filter(l => l.status === "PENDING")
            .reduce((sum, l) => sum + l.amount, 0);
          const totalOverdue = allLiabilities
            .filter(l => l.status === "OVERDUE")
            .reduce((sum, l) => sum + l.amount, 0);
          setSummary({
            pending: totalPending,
            overdue: totalOverdue,
            total: allLiabilities.length,
          });
        } catch (err) {
          console.error("Failed to fetch summary:", err);
        }
      };
      fetchSummaryData();
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchLiabilities();
  }, [session, status, router]);

  useEffect(() => {
    fetchLiabilities();
  }, [startDate, endDate, statusFilter, vendorFilter]);

  const fetchLiabilities = async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate.toISOString());
    if (endDate) params.append("endDate", endDate.toISOString());
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (vendorFilter) params.append("vendor", vendorFilter);

    try {
      const res = await fetch(`/api/liabilities?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch liabilities");
      }
      const data = await res.json();
      setLiabilities(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch liabilities: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "OVERDUE":
        return <AlertTriangleIcon className="h-4 w-4 text-red-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-800 bg-green-100";
      case "OVERDUE":
        return "text-red-800 bg-red-100";
      default:
        return "text-yellow-800 bg-yellow-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  const generateReminders = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/liabilities/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysAhead: 7 }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate reminders');
      }

      const data = await res.json();
      toast.success(data.message);

      // Refresh liabilities to show updated status
      await fetchLiabilities();
    } catch (err: any) {
      toast.error("Failed to generate reminders: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const payLiability = async (liability: Liability) => {
    if (!confirm(`Apakah Anda yakin ingin membayar hutang ke ${liability.vendorName} sebesar ${formatCurrency(liability.amount)}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch('/api/liabilities/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          liabilityId: liability.id,
          description: `Pembayaran hutang ke ${liability.vendorName}`,
          amount: liability.amount,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to pay liability');
      }

      const data = await res.json();
      toast.success(`Hutang ke ${liability.vendorName} berhasil dibayar!`);

      // Refresh liabilities to show updated status
      await fetchLiabilities();
    } catch (err: any) {
      toast.error("Failed to pay liability: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daftar Hutang</CardTitle>
          <CardDescription>Kelola dan pantau semua hutang vendor/supplier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hutang Pending</p>
                    <p className="text-2xl font-bold text-yellow-800">{formatCurrency(summary.pending)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Hutang Overdue</p>
                    <p className="text-2xl font-bold text-red-800">{formatCurrency(summary.overdue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hutang</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {summary.total} item{summary.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Actions */}
          <div className="flex justify-end">
            <Button
              onClick={generateReminders}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <BellIcon className="mr-2 h-4 w-4" />
              Generate Reminder
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              <Label htmlFor="statusFilter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Lunas</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vendorFilter">Vendor</Label>
              <Input
                id="vendorFilter"
                type="text"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                placeholder="Cari vendor..."
              />
            </div>
          </div>

          {/* Liabilities Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Dibuat Oleh</TableHead>
                  <TableHead>Tanggal Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Memuat...
                    </TableCell>
                  </TableRow>
                ) : liabilities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Tidak ada hutang ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  liabilities.map((liability) => (
                    <TableRow key={liability.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <BuildingIcon className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{liability.vendorName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(liability.amount)}
                      </TableCell>
                      <TableCell>
                        {new Date(liability.dueDate).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(liability.status)}
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getStatusColor(liability.status)
                          )}>
                            {liability.status === "PENDING" ? "Pending" :
                             liability.status === "PAID" ? "Lunas" : "Overdue"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {liability.description || liability.transaction?.description || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {liability.user?.name || liability.user?.email || "Unknown"}
                      </TableCell>
                      <TableCell>
                        {new Date(liability.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        {liability.status === "PENDING" && (
                          <Button
                            onClick={() => payLiability(liability)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSignIcon className="mr-1 h-3 w-3" />
                            Bayar
                          </Button>
                        )}
                        {liability.status === "PAID" && (
                          <span className="text-green-600 text-sm font-medium">Lunas</span>
                        )}
                        {liability.status === "OVERDUE" && (
                          <Button
                            onClick={() => payLiability(liability)}
                            size="sm"
                            variant="destructive"
                          >
                            <AlertTriangleIcon className="mr-1 h-3 w-3" />
                            Bayar Sekarang
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
