import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { getClassAttendanceRoster } from "@/lib/services/attendance/attendance";
import { recordAttendanceAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, UserCheck, Calendar } from "lucide-react";

export const metadata = {
  title: "Lesson Attendance - Teacher",
};

export default async function AttendancePage() {
  const user = await requireCurrentUser();

  // Load teacher's assigned classes and today's lessons
  const teacher = await prisma.teacher.findFirst({
    where: { userId: user.id },
    include: {
      assignments: {
        include: {
          class: {
            include: { educationLevel: true },
          },
          subject: true,
        },
      },
    },
  });

  const firstClass = teacher?.assignments[0]?.class;
  const firstLesson = await prisma.lesson.findFirst({
    where: { teacherId: teacher?.id },
    include: { class: true, subject: true },
  });

  let roster = null;
  if (firstClass) {
    roster = await getClassAttendanceRoster(user, firstClass.id, firstLesson?.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Daily Lesson Attendance
          </h1>
          <p className="text-sm text-muted-foreground">
            Mark per-period student presence and excused absences.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>{new Date().toLocaleDateString("en-RW", { dateStyle: "full" })}</span>
        </div>
      </div>

      {!roster || !firstLesson ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground">No active teaching lessons assigned for attendance.</p>
            <p className="text-xs mt-1">Please ensure you have scheduled timetable periods.</p>
          </CardContent>
        </Card>
      ) : (
        <form action={recordAttendanceAction} className="space-y-6">
          <input type="hidden" name="lessonId" value={firstLesson.id} />

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {roster.class.name} &bull; {firstLesson.subject?.name ?? "Lesson"}
                  </CardTitle>
                  <CardDescription>
                    {roster.class.educationLevelName} &bull; {roster.students.length} Enrolled Students
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {firstLesson.startTime} &ndash; {firstLesson.endTime}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Notes / Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        {s.studentCode}
                        <input type="hidden" name="studentId" value={s.id} />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {s.firstName} {s.lastName}
                      </TableCell>
                      <TableCell className="text-center">
                        <select
                          name={`status_${s.id}`}
                          defaultValue={s.currentStatus}
                          className="rounded-md border border-input bg-card px-2.5 py-1 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="PRESENT">✅ Present</option>
                          <option value="ABSENT">❌ Absent</option>
                          <option value="LATE">⏱️ Late</option>
                          <option value="EXCUSED">📄 Excused</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          name={`note_${s.id}`}
                          defaultValue={s.note}
                          placeholder="Optional absence reason..."
                          className="w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button type="submit" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Save & Finalize Attendance</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
