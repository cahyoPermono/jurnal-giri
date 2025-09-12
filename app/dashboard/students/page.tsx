"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [newStudentParentName, setNewStudentParentName] = useState("");
  const [newStudentContactNumber, setNewStudentContactNumber] = useState("");
  const [newStudentEnrollmentDate, setNewStudentEnrollmentDate] = useState<
    Date | undefined
  >(new Date());

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

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
      toast.error("Gagal mengambil data siswa: " + err.message);
    }
  };



  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudentEnrollmentDate) {
      toast.error("Tanggal pendaftaran wajib diisi");
      return;
    }

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newStudentName,
          parentName: newStudentParentName || null,
          contactNumber: newStudentContactNumber || null,
          enrollmentDate: newStudentEnrollmentDate?.toISOString() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add student");
      }

      toast.success("Siswa berhasil ditambahkan!");
      setNewStudentName("");
      setNewStudentParentName("");
      setNewStudentContactNumber("");
      setNewStudentEnrollmentDate(new Date());
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal menambahkan siswa: " + err.message);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

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
          enrollmentDate: editingStudent.enrollmentDate
            ? new Date(editingStudent.enrollmentDate).toISOString()
            : null,
          graduationDate: editingStudent.graduationDate
            ? new Date(editingStudent.graduationDate).toISOString()
            : null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update student");
      }

      toast.success("Siswa berhasil diperbarui!");
      setEditingStudent(null);
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal memperbarui siswa: " + err.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/students?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete student");
      }

      toast.success("Siswa berhasil dihapus!");
      fetchStudents(); // Refresh the list
    } catch (err: any) {
      toast.error("Gagal menghapus siswa: " + err.message);
    }
  };

  if (status === "loading") {
    return <p>Memuat...</p>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Kelola Siswa</CardTitle>
        <CardDescription>Tambah, edit, atau hapus data siswa.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Tambah Siswa Baru</h3>
          <form
            onSubmit={handleAddStudent}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          >
            <div className="grid gap-2">
              <Label htmlFor="newStudentName">Nama</Label>
              <Input
                id="newStudentName"
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newStudentParentName">Nama Orang Tua</Label>
              <Input
                id="newStudentParentName"
                type="text"
                value={newStudentParentName}
                onChange={(e) => setNewStudentParentName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentContactNumber">Nomor Kontak</Label>
              <Input
                id="newStudentContactNumber"
                type="text"
                value={newStudentContactNumber}
                onChange={(e) => setNewStudentContactNumber(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newStudentEnrollmentDate">Tanggal Pendaftaran</Label>
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
                    {newStudentEnrollmentDate ? (
                      format(newStudentEnrollmentDate, "PPP")
                    ) : (
                      <span>Pilih tanggal</span>
                    )}
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

            <Button type="submit" className="col-span-full sm:col-span-2 lg:col-span-1">
              Tambah Siswa
            </Button>
          </form>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Siswa Yang Ada</h3>
          {students.length === 0 ? (
            <p className="text-gray-500">Tidak ada siswa ditemukan.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>NIS</TableHead>
                    <TableHead>Nama Orang Tua</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Aktif</TableHead>
                    <TableHead>Tanggal Pendaftaran</TableHead>
                    <TableHead>Tanggal Kelulusan</TableHead>
                    <TableHead>Dibuat Pada</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.name}
                      </TableCell>
                      <TableCell>{student.nis}</TableCell>
                      <TableCell>{student.parentName || "-"}</TableCell>
                      <TableCell>{student.contactNumber || "-"}</TableCell>
                      <TableCell>{student.active ? "Ya" : "Tidak"}</TableCell>
                      <TableCell>
                        {student.enrollmentDate
                          ? new Date(
                              student.enrollmentDate
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {student.graduationDate
                          ? new Date(
                              student.graduationDate
                            ).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(student.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingStudent(student)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeletingStudentId(student.id)}
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>



        {editingStudent && (
          <Dialog
            open={!!editingStudent}
            onOpenChange={() => setEditingStudent(null)}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Siswa</DialogTitle>
                <DialogDescription>
                  Buat perubahan pada data siswa di sini.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateStudent} className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="editName">Nama</Label>
                  <Input
                    id="editName"
                    value={editingStudent.name}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editNis">NIS</Label>
                  <Input
                    id="editNis"
                    value={editingStudent.nis}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        nis: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editParentName">Nama Orang Tua</Label>
                  <Input
                    id="editParentName"
                    value={editingStudent.parentName || ""}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        parentName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editContactNumber">Nomor Kontak</Label>
                  <Input
                    id="editContactNumber"
                    value={editingStudent.contactNumber || ""}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        contactNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editEnrollmentDate">Tanggal Pendaftaran</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingStudent.enrollmentDate &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStudent.enrollmentDate ? (
                          format(new Date(editingStudent.enrollmentDate), "PPP")
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          editingStudent.enrollmentDate
                            ? new Date(editingStudent.enrollmentDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setEditingStudent({
                            ...editingStudent,
                            enrollmentDate: date?.toISOString() || null,
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editGraduationDate">Tanggal Kelulusan</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editingStudent.graduationDate &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editingStudent.graduationDate ? (
                          format(new Date(editingStudent.graduationDate), "PPP")
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          editingStudent.graduationDate
                            ? new Date(editingStudent.graduationDate)
                            : undefined
                        }
                        onSelect={(date) =>
                          setEditingStudent({
                            ...editingStudent,
                            graduationDate: date?.toISOString() || null,
                          })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editActive">Aktif</Label>
                  <input
                    id="editActive"
                    type="checkbox"
                    checked={editingStudent.active}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        active: e.target.checked,
                      })
                    }
                    className="col-span-3"
                  />
                </div>
                <DialogFooter className="md:col-span-2">
                  <Button
                    variant="outline"
                    onClick={() => setEditingStudent(null)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Simpan perubahan</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {deletingStudentId && (
          <Dialog
            open={!!deletingStudentId}
            onOpenChange={() => setDeletingStudentId(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apakah Anda yakin?</DialogTitle>
                <DialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Ini akan
                  menghapus data siswa secara permanen.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeletingStudentId(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDeleteStudent(deletingStudentId);
                    setDeletingStudentId(null);
                  }}
                >
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}
