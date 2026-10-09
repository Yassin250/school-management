import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import {
  listClassAttendanceOverview,
  listPendingAttendanceCorrections,
} from "@/lib/services/attendance/attendance";
import { approveCorrectionAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Attendance — Principal" };

export default async function PrincipalAttendancePage() {
  const user = await requireCurrentUser();
  if (!(await canForUser(user, "attendance.reports"))) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        Access denied.
      </div>
    );
  }

  const [sessions, corrections] = await Promise.all([
    listClassAttendanceOverview(user),
    listPendingAttendanceCorrections(user).catch(() => []),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Attendance Oversight</h1>
        <p className="text-sm text-muted-foreground">
          Monitor finalized sessions and approve attendance corrections.
        </p>
      </div>

      {corrections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending correction requests</CardTitle>
            <CardDescription>Review and apply approved changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {corrections.map((c) => (
              <div
                key={c.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {c.attendance.student.firstName}{" "}
                    {c.attendance.student.lastName} ({c.attendance.student.studentCode})
                  </p>
                  <p className="text-muted-foreground">
                    {c.session.class.name} · Requested by {c.requestedBy.username}
                  </p>
                  <p className="text-xs mt-1">{c.reason}</p>
                </div>
                <form action={approveCorrectionAction}>
                  <input type="hidden" name="correctionId" value={c.id} />
                  <Button type="submit" size="sm">
                    Approve correction
                  </Button>
                </form>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>School attendance snapshot</CardTitle>
          <CardDescription>Recent finalized sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Students marked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.slice(0, 20).map((s) => (
                <TableRow key={s.sessionId}>
                  <TableCell>
                    {s.sessionDate.toLocaleDateString("en-RW")}
                  </TableCell>
                  <TableCell>{s.className}</TableCell>
                  <TableCell>{s.recordCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
