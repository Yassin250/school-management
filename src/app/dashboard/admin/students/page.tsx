import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { listStudents } from "@/lib/services/admin/students";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus } from "lucide-react";

export const metadata = {
  title: "Student Roster & Management - Admin",
};

export default async function StudentsAdminPage() {
  const user = await requireCurrentUser();
  const { students, total } = await listStudents(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Student Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage student records, registrations, and active enrollment statuses.
          </p>
        </div>

        <Link href="/dashboard/admin/students/new">
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Enroll New Student</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Student Directory</CardTitle>
              <CardDescription>
                Total {total} registered student{total === 1 ? "" : "s"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No student records found in the system.</p>
              <Link href="/dashboard/admin/students/new" className="mt-3 inline-block">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Add First Student</span>
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Code</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Sex</TableHead>
                  <TableHead>Current Class</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact / Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {s.studentCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {s.firstName} {s.lastName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.sex}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {s.currentClass}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.currentLevel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.status === "ACTIVE" ? "success" : "secondary"}
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.phone || s.email || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
