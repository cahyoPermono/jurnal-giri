"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportToPdf } from "@/lib/pdf-export";
import { toast } from "sonner";

interface StudentReportData {
  id: string;
  name: string;
  nis: string;
  unpaidItems: {
    type: string;
    month?: string;
    amount: number;
  }[];
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchReportData();
  }, [session, status, router]);

  const fetchReportData = async () => {
    setError(null);
    try {
      const res = await fetch(`/api/reports/student-liabilities`);
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

        <Button onClick={handleExportPdf} className="mb-4">Export to PDF</Button>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No student liabilities found.
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.nis}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Liabilities
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Liabilities for {student.name}</DialogTitle>
                            <DialogDescription>List of unpaid obligations.</DialogDescription>
                          </DialogHeader>
                          <div className="rounded-md border mt-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Month</TableHead>
                                  <TableHead>Amount</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {student.unpaidItems.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={3} className="h-12 text-center">
                                      No liabilities for this student.
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  student.unpaidItems.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{item.type}</TableCell>
                                      <TableCell>{item.month || '-'}</TableCell>
                                      <TableCell>{item.amount.toFixed(2)}</TableCell>
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
