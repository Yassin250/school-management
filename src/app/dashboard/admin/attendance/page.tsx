import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { listClassAttendanceOverview } from "@/lib/services/attendance/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Attendance Overview — School Admin" };

export default async function AdminAttendanceOverviewPage() {
  const user = await requireCurrentUser();
  const allowed = await canForUser(user, "attendance.reports");
  if (!allowed) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        You do not have permission to view attendance reports.
      </div>
    );
  }

  const sessions = await listClassAttendanceOverview(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Overview</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of finalized attendance sessions across the school.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent finalized sessions</CardTitle>
          <CardDescription>Last 50 finalized sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No finalized attendance sessions yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell>
                      {s.sessionDate.toLocaleDateString("en-RW")}
                    </TableCell>
                    <TableCell>{s.className}</TableCell>
                    <TableCell>{s.recordCount}</TableCell>
                    <TableCell>{s.status}</TableCell>
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
