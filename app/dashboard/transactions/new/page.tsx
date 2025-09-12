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
import { CalendarIcon } from "lucide-react";

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

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null); // New state

  const [error, setError] = useState<string | null>(null);
  const [isStudentRequired, setIsStudentRequired] = useState(false);

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
      } else {
        setIsStudentRequired(false);
      }
    } else {
      setIsStudentRequired(false);
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
      toast.error("Failed to fetch form data: " + err.message);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required student field
    if (isStudentRequired && (!studentId || studentId === "none")) {
      toast.error("Student is required when Financial Account is SPP or Pendaftaran");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date?.toISOString(),
          description,
          amount: parseFloat(amount),
          type,
          accountId,
          categoryId: categoryId === "none" ? null : categoryId,
          studentId: studentId === "none" ? null : studentId, // Handle "none" value
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add transaction");
      }

      toast.success("Transaction added successfully!");
      setDate(new Date());
      setDescription("");
      setAmount("");
      setType("DEBIT");
      // Keep accountId, categoryId, studentId as they might be frequently reused
    } catch (err: any) {
      toast.error("Failed to add transaction: " + err.message);
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
        <CardTitle>Record New Transaction</CardTitle>
        <CardDescription>Enter details for a new financial transaction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
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

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              step="0.01"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select value={type} onValueChange={(value: "DEBIT" | "CREDIT") => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBIT">DEBIT (Income)</SelectItem>
                <SelectItem value="CREDIT">CREDIT (Expense)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoryId">Category</Label>
            <Select value={categoryId} onValueChange={(value) => {
              setCategoryId(value === "none" ? undefined : value);
              setSelectedCategory(value === "none" ? null : categories.find(cat => cat.id === value) || null);
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="accountId">Financial Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
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

          <div className="grid gap-2">
            <Label htmlFor="studentId">
              Student {isStudentRequired ? "" : "(Optional)"}
            </Label>
            <Select value={studentId} onValueChange={setStudentId} required={isStudentRequired}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              Record Transaction
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
