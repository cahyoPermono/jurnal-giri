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

interface Parameter {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export default function ManageParametersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [editingParameter, setEditingParameter] = useState<Parameter | null>(null);
  const [editValue, setEditValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as any)?.role !== "ADMIN") {
      router.push("/login"); // Redirect if not authenticated or not admin
    }

    fetchParameters();
  }, [session, status, router]);

  const fetchParameters = async () => {
    try {
      const res = await fetch("/api/parameters");
      if (!res.ok) {
        throw new Error("Failed to fetch parameters");
      }
      const data = await res.json();
      setParameters(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch parameters: " + err.message);
    }
  };

  const handleAddParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/parameters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key, value }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add parameter");
      }

      setSuccess("Parameter added successfully!");
      toast.success("Parameter added successfully!");
      setKey("");
      setValue("");
      fetchParameters(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to add parameter: " + err.message);
    }
  };

  const handleUpdateParameter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParameter) return;

    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/parameters", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key: editingParameter.key, value: editValue }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update parameter");
      }

      setSuccess("Parameter updated successfully!");
      toast.success("Parameter updated successfully!");
      setEditingParameter(null);
      setEditValue("");
      fetchParameters(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to update parameter: " + err.message);
    }
  };

  const handleDeleteParameter = async (key: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/parameters?key=${encodeURIComponent(key)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete parameter");
      }

      setSuccess("Parameter deleted successfully!");
      toast.success("Parameter deleted successfully!");
      fetchParameters(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to delete parameter: " + err.message);
    }
  };

  const openEditDialog = (parameter: Parameter) => {
    setEditingParameter(parameter);
    setEditValue(parameter.value);
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kelola Parameter</CardTitle>
        <CardDescription>Kelola parameter sistem seperti biaya SPP, biaya pendaftaran, dll.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div>
          <h3 className="text-lg font-semibold mb-4">Tambah Parameter Baru</h3>
          <form onSubmit={handleAddParameter} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="contoh: spp_amount"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="contoh: 500000"
                required
              />
            </div>
            <Button type="submit" className="col-span-full md:col-span-1">
              Tambah Parameter
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Parameter Sistem</h3>
          {parameters.length === 0 ? (
            <p className="text-gray-500">Belum ada parameter.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Diupdate</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parameters.map((parameter) => (
                    <TableRow key={parameter.id}>
                      <TableCell className="font-medium">{parameter.key}</TableCell>
                      <TableCell>{parameter.value}</TableCell>
                      <TableCell>{new Date(parameter.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(parameter.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(parameter)}>
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
                                Tindakan ini tidak dapat dibatalkan. Ini akan menghapus parameter secara permanen.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Batal</Button>
                              <Button variant="destructive" onClick={() => handleDeleteParameter(parameter.key)}>Hapus</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingParameter} onOpenChange={() => setEditingParameter(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Parameter</DialogTitle>
              <DialogDescription>
                Ubah nilai parameter {editingParameter?.key}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateParameter}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-key">Key</Label>
                  <Input
                    id="edit-key"
                    type="text"
                    value={editingParameter?.key || ""}
                    disabled
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-value">Value</Label>
                  <Input
                    id="edit-value"
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingParameter(null)}>
                  Batal
                </Button>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
