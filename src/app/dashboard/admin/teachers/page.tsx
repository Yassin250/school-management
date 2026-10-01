import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { listTeachers, type TeacherListItem, type TeacherAssignmentItem } from "@/lib/services/admin/teachers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck } from "lucide-react";

export const metadata = {
  title: "Faculty & Teacher Management - Admin",
};

export default async function TeachersAdminPage() {
  const user = await requireCurrentUser();
  const teachers: TeacherListItem[] = await listTeachers(user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Faculty & Teacher Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage teacher profiles, staff codes, and active class assignments.
          </p>
        </div>

        <Link href="/dashboard/admin/teachers/new">
          <Button className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span>Add New Teacher</span>
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Teacher Directory</CardTitle>
          <CardDescription>
            Total {teachers.length} registered faculty member{teachers.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {teachers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>No teacher profiles registered yet.</p>
              <Link href="/dashboard/admin/teachers/new" className="mt-3 inline-block">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span>Register First Teacher</span>
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Code</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Qualification</TableHead>
                  <TableHead>Phone / Email</TableHead>
                  <TableHead>Active Assignments</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t: TeacherListItem) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {t.staffCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {t.name}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t.qualification}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{t.phone}</div>
                      <div className="text-[11px] text-muted-foreground/80">{t.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {t.assignments.map((a: TeacherAssignmentItem) => (
                          <Badge key={a.id} variant="secondary" className="text-[10px]">
                            {a.className} &bull; {a.subjectName}
                          </Badge>
                        ))}
                        {t.assignments.length === 0 && (
                          <span className="text-xs text-muted-foreground">No classes assigned</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={t.status === "ACTIVE" ? "success" : "secondary"}>
                        {t.status}
                      </Badge>
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
