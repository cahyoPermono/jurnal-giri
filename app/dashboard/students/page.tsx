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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface Student {
  id: string;
  nis: string;
  name: string;
  parentName: string | null;
  contactNumber: string | null;
  active: boolean;
  enrollmentDate: string | null;
  graduationDate: string | null;
  createdAt: string;
}

export default function ManageStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentNis, setNewStudentNis] = useState("");
  const [newStudentParentName, setNewStudentParentName] = useState("");
  const [newStudentContactNumber, setNewStudentContactNumber] = useState("");
  const [newStudentEnrollmentDate, setNewStudentEnrollmentDate] = useState<Date | undefined>(undefined);
  const [newStudentGraduationDate, setNewStudentGraduationDate] = useState<Date | undefined>(undefined);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login"); // Redirect if not authenticated
    }

    fetchStudents();
  }, [session, status, router]);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      if (!res.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await res.json();
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to fetch students: " + err.message);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStudentName,
          nis: newStudentNis,
          parentName: newStudentParentName || null,
          contactNumber: newStudentContactNumber || null,
          enrollmentDate: newStudentEnrollmentDate?.toISOString() || null,
          graduationDate: newStudentGraduationDate?.toISOString() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add student");
      }

      setSuccess("Student added successfully!");
      toast.success("Student added successfully!");
      setNewStudentName("");
      setNewStudentNis("");
      setNewStudentParentName("");
      setNewStudentContactNumber("");
      setNewStudentEnrollmentDate(undefined);
      setNewStudentGraduationDate(undefined);
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to add student: " + err.message);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!editingStudent) return;

    try {
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingStudent.id,
          name: editingStudent.name,
          nis: editingStudent.nis,
          parentName: editingStudent.parentName || null,
          contactNumber: editingStudent.contactNumber || null,
          active: editingStudent.active,
          enrollmentDate: editingStudent.enrollmentDate ? new Date(editingStudent.enrollmentDate).toISOString() : null,
          graduationDate: editingStudent.graduationDate ? new Date(editingStudent.graduationDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update student");
      }

      setSuccess("Student updated successfully!");
      toast.success("Student updated successfully!");
      setEditingStudent(null);
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to update student: " + err.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/students?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete student");
      }

      setSuccess("Student deleted successfully!");
      toast.success("Student deleted successfully!");
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
      toast.error("Failed to delete student: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Students</CardTitle>
        <CardDescription>Add, edit, or delete student records.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}

        <div>
          <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
          <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
            <div className="grid gap-2">
              <Label htmlFor="newStudentName">Name</Label>
              <Input
                id="newStudentName"
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentNis">NIS (Optional)</Label>
              <Input
                id="newStudentNis"
                type="text"
                value={newStudentNis}
                onChange={(e) => setNewStudentNis(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentParentName">Parent Name</Label>
              <Input
                id="newStudentParentName"
                type="text"
                value={newStudentParentName}
                onChange={(e) => setNewStudentParentName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentContactNumber">Contact Number</Label>
              <Input
                id="newStudentContactNumber"
                type="text"
                value={newStudentContactNumber}
                onChange={(e) => setNewStudentContactNumber(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentEnrollmentDate">Enrollment Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newStudentEnrollmentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newStudentEnrollmentDate ? format(newStudentEnrollmentDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newStudentEnrollmentDate}
                    onSelect={setNewStudentEnrollmentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentGraduationDate">Graduation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newStudentGraduationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newStudentGraduationDate ? format(newStudentGraduationDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={newStudentGraduationDate}
                    onSelect={setNewStudentGraduationDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button type="submit" className="col-span-full md:col-span-1">
              Add Student
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Existing Students</h3>
          {students.length === 0 ? (
            <p className="text-gray-500">No students found.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Parent Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead>Graduation Date</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.nis}</TableCell>
                      <TableCell>{student.parentName || "-"}</TableCell>
                      <TableCell>{student.contactNumber || "-"}</TableCell>
                      <TableCell>{student.active ? "Yes" : "No"}</TableCell>
                      <TableCell>{student.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{student.graduationDate ? new Date(student.graduationDate).toLocaleDateString() : "-"}</TableCell>
                      <TableCell>{new Date(student.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="mr-2" onClick={() => setEditingStudent(student)}>
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
                                This action cannot be undone. This will permanently delete the student record.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => { /* Close dialog */ }}>Cancel</Button>
                              <Button variant="destructive" onClick={() => handleDeleteStudent(student.id)}>Delete</Button>
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

        {editingStudent && (
          <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>Make changes to the student record here.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateStudent} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Name</Label>
                  <Input
                    id="editName"
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editNis">NIS</Label>
                  <Input
                    id="editNis"
                    value={editingStudent.nis}
                    onChange={(e) => setEditingStudent({ ...editingStudent, nis: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editParentName">Parent Name</Label>
                  <Input
                    id="editParentName"
                    value={editingStudent.parentName || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editContactNumber">Contact Number</Label>
                  <Input
                    id="editContactNumber"
                    value={editingStudent.contactNumber || ""}
                    onChange={(e) => setEditingStudent({ ...editingStudent, contactNumber: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEnrollmentDate">Enrollment Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingStudent.enrollmentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStudent.enrollmentDate ? format(new Date(editingStudent.enrollmentDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingStudent.enrollmentDate ? new Date(editingStudent.enrollmentDate) : undefined}
                        onSelect={(date) => setEditingStudent({ ...editingStudent, enrollmentDate: date?.toISOString() || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editGraduationDate">Graduation Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingStudent.graduationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStudent.graduationDate ? format(new Date(editingStudent.graduationDate), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editingStudent.graduationDate ? new Date(editingStudent.graduationDate) : undefined}
                        onSelect={(date) => setEditingStudent({ ...editingStudent, graduationDate: date?.toISOString() || null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editActive">Active</Label>
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={editingStudent.active}
                    onChange={(e) => setEditingStudent({ ...editingStudent, active: e.target.checked })}
                    className="col-span-3"
                  />
                </div>
                <DialogFooter className="md:col-span-2">
                  <Button variant="outline" onClick={() => setEditingStudent(null)}>Cancel</Button>
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