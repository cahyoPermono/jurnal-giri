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
import { CalendarIcon, Wallet, ArrowRight, DollarSign } from "lucide-react";

import { toast } from "sonner";

interface FinancialAccount {
  id: string;
  name: string;
  balance: number;
}

export default function TransferPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState<string | undefined>(undefined);
  const [destinationAccountId, setDestinationAccountId] = useState<string | undefined>(undefined);

  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
    }

    fetchFinancialAccounts();
  }, [session, status, router]);

  useEffect(() => {
    // Set current date only on client side after component mounts
    if (!date) {
      setDate(new Date());
    }
  }, [date]);

  // Validate amount against source account balance
  useEffect(() => {
    if (amount && sourceAccountId) {
      const parsedAmount = parseFloat(amount);
      const sourceAccount = financialAccounts.find(acc => acc.id === sourceAccountId);

      if (sourceAccount && parsedAmount > sourceAccount.balance) {
        setAmountError(`Insufficient funds. Available balance: Rp ${sourceAccount.balance.toLocaleString('id-ID')}`);
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  }, [amount, sourceAccountId, financialAccounts]);

  const fetchFinancialAccounts = async () => {
    try {
      const res = await fetch("/api/financial-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch financial accounts");
      }
      const data = await res.json();
      setFinancialAccounts(data);
      if (data.length > 0) {
        setSourceAccountId(data[0].id);
        if (data.length > 1) {
          setDestinationAccountId(data[1].id);
        } else {
          setDestinationAccountId(data[0].id); // Fallback if only one account
        }
      }
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch financial accounts: " + err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/transactions/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: date?.toISOString(),
          description,
          amount: parseFloat(amount),
          sourceAccountId,
          destinationAccountId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to perform transfer");
      }

      toast.success("Transfer successful!");
      setDate(new Date());
      setDescription("");
      setAmount("");
      // Re-fetch accounts to update balances displayed elsewhere if needed
      fetchFinancialAccounts();
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to perform transfer: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transfer Funds</CardTitle>
        <CardDescription>Move funds between your internal financial accounts.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleTransfer} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Transfer Section */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
            <div className="flex items-center justify-between gap-4">
              {/* From Account */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="sourceAccount" className="text-sm font-medium">From Account</Label>
                </div>
                <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select source account" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sourceAccountId && (
                  <div className="mt-2 p-2 bg-blue-100 rounded-md">
                    <p className="text-xs text-blue-800 font-medium">
                      Available Balance: Rp {financialAccounts.find(acc => acc.id === sourceAccountId)?.balance?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0">
                <ArrowRight className="h-6 w-6 text-gray-400" />
              </div>

              {/* To Account */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-green-600" />
                  <Label htmlFor="destinationAccount" className="text-sm font-medium">To Account</Label>
                </div>
                <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select destination account" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {destinationAccountId && (
                  <div className="mt-2 p-2 bg-green-100 rounded-md">
                    <p className="text-xs text-green-800 font-medium">
                      Current Balance: Rp {financialAccounts.find(acc => acc.id === destinationAccountId)?.balance?.toLocaleString('id-ID') || '0'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <Label htmlFor="amount" className="text-sm font-medium">Transfer Amount</Label>
              </div>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                className={cn("bg-white", amountError && "border-red-500")}
                placeholder="Enter amount to transfer"
              />
              {amountError && (
                <p className="text-red-600 text-sm mt-1">{amountError}</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!!amountError || !amount || !sourceAccountId || !destinationAccountId}
            >
              Perform Transfer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
