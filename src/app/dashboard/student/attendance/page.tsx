import { requireCurrentUser } from "@/lib/auth/session";
import { getStudentAttendanceHistory } from "@/lib/services/attendance/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "My Attendance — Student" };

export default async function StudentAttendancePage() {
  const user = await requireCurrentUser();
  if (!user.studentId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Your account is not linked to a student profile.
        </CardContent>
      </Card>
    );
  }

  const { summary, history } = await getStudentAttendanceHistory(
    user,
    user.studentId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Official attendance from finalized sessions only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>
            {summary.total} sessions · {summary.percentage}% attendance rate
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-muted-foreground">Present</p>
            <p className="text-xl font-semibold">{summary.present}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Absent</p>
            <p className="text-xl font-semibold">{summary.absent}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Late</p>
            <p className="text-xl font-semibold">{summary.late}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Excused</p>
            <p className="text-xl font-semibold">{summary.excused}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.sessionDate.toLocaleDateString("en-RW")}
                    </TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell>{row.subjectName}</TableCell>
                    <TableCell>{row.status}</TableCell>
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
