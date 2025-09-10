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
  createdAt: string;
}

export default function ManageCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"DEBIT" | "CREDIT" | "TRANSFER">("DEBIT");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login"); // Redirect if not authenticated
    }

    fetchCategories();
  }, [session, status, router]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await res.json();
      setCategories(data);
    } catch (err: any) {
      toast.error("Failed to fetch categories: " + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName, type: newCategoryType }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add category");
      }

      toast.success("Category added successfully!");
      setNewCategoryName("");
      setNewCategoryType("DEBIT"); // Reset to default
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Failed to add category: " + err.message);
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
        body: JSON.stringify({ id: editingCategory.id, name: editingCategory.name, type: editingCategory.type }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      toast.success("Category updated successfully!");
      setEditingCategory(null);
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Failed to update category: " + err.message);
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

      toast.success("Category deleted successfully!");
      fetchCategories(); // Refresh the list
    } catch (err: any) {
      toast.error("Failed to delete category: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Categories</CardTitle>
        <CardDescription>Add, edit, or delete transaction categories.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
          <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="newCategoryName">Name</Label>
              <Input
                id="newCategoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newCategoryType">Type</Label>
              <Select value={newCategoryType} onValueChange={(value: "DEBIT" | "CREDIT" | "TRANSFER") => setNewCategoryType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEBIT">DEBIT (Income)</SelectItem>
                  <SelectItem value="CREDIT">CREDIT (Expense)</SelectItem>
                  {/* <SelectItem value="TRANSFER">TRANSFER</SelectItem> */}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="col-span-full md:col-span-1">
              Add Category
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Categories</h3>
          {categories.length === 0 ? (
            <p className="text-gray-500">No categories found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.type}</TableCell>
                      <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingCategory(category)}>
                          Edit
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Are you absolutely sure?</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete the category record.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { /* Close dialog */ }}>Cancel</Button>
                              <Button variant="destructive" onClick={() => handleDeleteCategory(category.id)}>Delete</Button>
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

        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
                <DialogDescription>Make changes to the category record here.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateCategory} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editType">Type</Label>
                  <Select value={editingCategory.type} onValueChange={(value: "DEBIT" | "CREDIT" | "TRANSFER") => setEditingCategory({ ...editingCategory, type: value })}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEBIT">DEBIT (Income)</SelectItem>
                      <SelectItem value="CREDIT">CREDIT (Expense)</SelectItem>
                      {/* <SelectItem value="TRANSFER">TRANSFER</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}