"use client";

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

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ManageUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || (session.user as any)?.role !== "ADMIN") {
      router.push("/login"); // Redirect if not authenticated or not admin
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch users: " + err.message);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, role: "OPERATOR" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add user");
      }

      setSuccess("User added successfully!");
      toast.success("User added successfully!");
      setName("");
      setEmail("");
      setPassword("");
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to add user: " + err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete user");
      }

      setSuccess("User deleted successfully!");
      toast.success("User deleted successfully!");
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to delete user: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Operators</CardTitle>
        <CardDescription>Add new operators or view existing ones.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div>
          <h3 className="text-lg font-semibold mb-4">Add New Operator</h3>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="col-span-full md:col-span-1">
              Add Operator
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Operators</h3>
          {users.length === 0 ? (
            <p className="text-gray-500">No operators found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
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
                                This action cannot be undone. This will permanently delete the user record.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button variant="destructive" onClick={() => handleDeleteUser(user.id)}>Delete</Button>
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
      </CardContent>
    </Card>
  );
}
