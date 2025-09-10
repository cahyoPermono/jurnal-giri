import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

interface StudentReportData {
  id: string;
  name: string;
  nis: string;
  liability: number;
  transactions: {
    id: string;
    date: Date;
    description: string;
    amount: number;
    type: "DEBIT" | "CREDIT" | "TRANSFER";
  }[];
}

export default function StudentLiabilitiesReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [reportData, setReportData] = useState<StudentReportData[]>([]);
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
      const res = await fetch(`/api/reports/student-liabilities?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch student liabilities report");
      }
      const data = await res.json();
      setReportData(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch student liabilities report: " + err.message);
    }
  };

  const handleExportPdf = () => {
    exportToPdf("student-liabilities-report", "student-liabilities-report.pdf");
    toast.success("PDF export started!");
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Student Liabilities Report</CardTitle>
        <CardDescription>Overview of student financial obligations.</CardDescription>
      </CardHeader>
      <CardContent id="student-liabilities-report" className="space-y-6">
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Liability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No student liabilities found for the selected period.
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.nis}</TableCell>
                    <TableCell className={parseFloat(student.liability) >= 0 ? "text-green-600" : "text-red-600"}>
                      {parseFloat(student.liability).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Transactions
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Transactions for {student.name}</DialogTitle>
                            <DialogDescription>All transactions related to this student.</DialogDescription>
                          </DialogHeader>
                          <div className="rounded-md border mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Type</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {student.transactions.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="h-12 text-center">
                                      No transactions for this student.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  student.transactions.map(tx => (
                                    <TableRow key={tx.id}>
                                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                                      <TableCell>{tx.description}</TableCell>
                                      <TableCell>{parseFloat(tx.amount).toFixed(2)}</TableCell>
                                      <TableCell>{tx.type}</TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
