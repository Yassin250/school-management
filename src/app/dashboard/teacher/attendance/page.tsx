import { requireCurrentUser } from "@/lib/auth/session";
import {
  getAttendanceSessionRoster,
  listTeacherLessons,
} from "@/lib/services/attendance/attendance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, UserCheck } from "lucide-react";
import { AttendanceForm } from "./attendance-form";

export const metadata = { title: "Attendance — Teacher" };

interface PageProps {
  searchParams: Promise<{ lessonId?: string; date?: string }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  const lessonsRaw = await listTeacherLessons(user);
  if (lessonsRaw.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <UserCheck className="mx-auto h-12 w-12 opacity-40 mb-3" />
          <p className="font-medium text-foreground">No lessons assigned for attendance.</p>
        </CardContent>
      </Card>
    );
  }

  const lessons = lessonsRaw.map((l) => ({
    id: l.id,
    classId: l.classId,
    label: `${l.class.name} — ${l.subject?.name ?? l.module?.name ?? "Lesson"} (${l.startTime}–${l.endTime})`,
  }));

  const selectedLessonId =
    params.lessonId && lessons.some((l) => l.id === params.lessonId)
      ? params.lessonId
      : lessons[0].id;

  const sessionDate = params.date ? new Date(params.date) : new Date();
  const roster = await getAttendanceSessionRoster(
    user,
    selectedLessonId,
    sessionDate,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark daily lesson attendance for your assigned classes.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            {roster.sessionDate.toLocaleDateString("en-RW", { dateStyle: "full" })}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {roster.class.name} · {roster.lesson.subjectName}
          </CardTitle>
          <CardDescription>
            {roster.class.educationLevelName} · {roster.students.length} students ·{" "}
            {roster.lesson.startTime}–{roster.lesson.endTime}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AttendanceForm
            lessons={lessons}
            selectedLessonId={selectedLessonId}
            sessionDateIso={roster.sessionDate.toISOString()}
            roster={roster}
          />
        </CardContent>
      </Card>
    </div>
  );
}
