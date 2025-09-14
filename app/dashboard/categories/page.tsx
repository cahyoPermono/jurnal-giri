"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
  type: "DEBIT" | "CREDIT" | "TRANSFER";
  isProtected: boolean;
  financialAccountId: string | null; // New field
  financialAccount?: { // New field for relation
    id: string;
    name: string;
  };
  createdAt: string;
}

interface FinancialAccount {
  id: string;
  name: string;
}

export default function ManageCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialAccounts, setFinancialAccounts] = useState<FinancialAccount[]>([]); // New state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"DEBIT" | "CREDIT" | "TRANSFER">("DEBIT");
  const [newCategoryFinancialAccountId, setNewCategoryFinancialAccountId] = useState<string | null>(null); // New state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login"); // Redirect if not authenticated
    }

    fetchCategories();
    fetchFinancialAccounts();
  }, [session, status, router]);

  const fetchFinancialAccounts = async () => {
    try {
      const res = await fetch("/api/financial-accounts");
      if (!res.ok) {
        throw new Error("Failed to fetch financial accounts");
      }
      const data = await res.json();
      setFinancialAccounts(data);
    } catch (err: any) {
      toast.error("Gagal mengambil akun keuangan: " + err.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      toast.error("Gagal mengambil kategori: " + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for required fields
    if (!newCategoryName.trim()) {
      toast.error("Nama kategori diperlukan");
      return;
    }
    if (!newCategoryType) {
      toast.error("Tipe kategori diperlukan");
      return;
    }
    if (!newCategoryFinancialAccountId) {
      toast.error("Akun keuangan diperlukan");
      return;
    }

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName, type: newCategoryType, financialAccountId: newCategoryFinancialAccountId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add category");
      }

      toast.success("Kategori berhasil ditambahkan!");
      setNewCategoryName("");
      setNewCategoryType("DEBIT"); // Reset to default
      setNewCategoryFinancialAccountId(null); // Reset financial account
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal menambah kategori: " + err.message);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingCategory) return;

    try {
      const res = await fetch("/api/categories", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: editingCategory.id, name: editingCategory.name, type: editingCategory.type, financialAccountId: editingCategory.financialAccountId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      toast.success("Kategori berhasil diperbarui!");
      setEditingCategory(null);
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal memperbarui kategori: " + err.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {

    try {
      const res = await fetch(`/api/categories?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete category");
      }

      toast.success("Kategori berhasil dihapus!");
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal menghapus kategori: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kelola Kategori</CardTitle>
        <CardDescription>Tambah, edit, atau hapus kategori transaksi.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Tambah Kategori Baru</h3>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="newCategoryName">Nama</Label>
              <Input
                id="newCategoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newCategoryType">Tipe</Label>
              <Select value={newCategoryType} onValueChange={(value: "DEBIT" | "CREDIT" | "TRANSFER") => setNewCategoryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT (Pemasukan)</SelectItem>
                  <SelectItem value="CREDIT">CREDIT (Pengeluaran)</SelectItem>
                  {/* <SelectItem value="TRANSFER">TRANSFER</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newCategoryFinancialAccount">Akun Keuangan</Label>
              <Select
                  value={newCategoryFinancialAccountId || ""}
                  onValueChange={(value) => setNewCategoryFinancialAccountId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
            <Button type="submit" className="col-span-full sm:col-span-2 md:col-span-1">
              Tambah Kategori
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Kategori yang Ada</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500">Tidak ada kategori ditemukan.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Akun Keuangan</TableHead>
                    <TableHead>Dibuat Pada</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.type}</TableCell>
                      <TableCell>{category.financialAccount?.name || "N/A"}</TableCell>
                      <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        {category.isProtected ? (
                          <span className="text-sm text-muted-foreground flex items-center justify-end">
                            🔒 Sistem
                          </span>
                        ) : (
                          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                              Edit
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  Hapus
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Apakah Anda yakin?</DialogTitle>
                                  <DialogDescription>
                                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus catatan kategori secara permanen.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => { /* Close dialog */ }}>Batal</Button>
                                  <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>Hapus</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Kategori</DialogTitle>
                <DialogDescription>Buat perubahan pada catatan kategori di sini.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateCategory} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Nama</Label>
                  <Input
                    id="editName"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editType">Tipe</Label>
                  <Select value={editingCategory.type} onValueChange={(value: "DEBIT" | "CREDIT" | "TRANSFER") => setEditingCategory({ ...editingCategory, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Pilih tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEBIT">DEBIT (Pemasukan)</SelectItem>
                      <SelectItem value="CREDIT">CREDIT (Pengeluaran)</SelectItem>
                      {/* <SelectItem value="TRANSFER">TRANSFER</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editFinancialAccount">Akun Keuangan (Opsional)</Label>
                  <Select
                    value={editingCategory.financialAccountId || ""}
                    onValueChange={(value) => setEditingCategory({ ...editingCategory, financialAccountId: value || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                    <SelectContent>
                      {financialAccounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Batal</Button>
                  <Button type="submit">Simpan Perubahan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
