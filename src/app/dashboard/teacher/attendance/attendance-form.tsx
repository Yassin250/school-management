"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Lock } from "lucide-react";
import type { AttendanceSessionView } from "@/lib/services/attendance/attendance";
import {
  recordAttendanceAction,
  finalizeAttendanceAction,
} from "./actions";

interface LessonOption {
  id: string;
  label: string;
  classId: string;
}

interface Props {
  lessons: LessonOption[];
  selectedLessonId: string;
  sessionDateIso: string;
  roster: AttendanceSessionView;
}

export function AttendanceForm({
  lessons,
  selectedLessonId,
  sessionDateIso,
  roster,
}: Props) {
  const router = useRouter();

  const onLessonChange = (lessonId: string) => {
    router.push(
      `/dashboard/teacher/attendance?lessonId=${lessonId}&date=${sessionDateIso.slice(0, 10)}`,
    );
  };

  const onDateChange = (date: string) => {
    router.push(
      `/dashboard/teacher/attendance?lessonId=${selectedLessonId}&date=${date}`,
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-xs font-medium text-muted-foreground">
            Class / Lesson
            <select
              className="mt-1 block w-full min-w-[220px] rounded-md border border-input bg-card px-2 py-1.5 text-sm"
              value={selectedLessonId}
              onChange={(e) => onLessonChange(e.target.value)}
            >
              {lessons.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Date
            <input
              type="date"
              className="mt-1 block rounded-md border border-input bg-card px-2 py-1.5 text-sm"
              value={sessionDateIso.slice(0, 10)}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </label>
        </div>
        {roster.sessionStatus && (
          <Badge variant={roster.sessionStatus === "FINALIZED" ? "default" : "outline"}>
            Session: {roster.sessionStatus}
          </Badge>
        )}
      </div>

      {roster.sessionStatus === "FINALIZED" ? (
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Lock className="h-4 w-4" />
          This session is finalized. Contact leadership for a correction request.
        </div>
      ) : null}

      <form action={recordAttendanceAction} className="space-y-4">
        <input type="hidden" name="lessonId" value={selectedLessonId} />
        <input type="hidden" name="sessionDate" value={sessionDateIso.slice(0, 10)} />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student Code</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs font-semibold text-primary">
                  {s.studentCode}
                  <input type="hidden" name="studentId" value={s.id} />
                </TableCell>
                <TableCell className="font-medium">
                  {s.firstName} {s.lastName}
                </TableCell>
                <TableCell className="text-center">
                  <select
                    name={`status_${s.id}`}
                    defaultValue={s.currentStatus}
                    disabled={!roster.canEdit}
                    className="rounded-md border border-input bg-card px-2 py-1 text-xs font-semibold disabled:opacity-60"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name={`note_${s.id}`}
                    defaultValue={s.note}
                    disabled={!roster.canEdit}
                    placeholder="Optional reason..."
                    className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs disabled:opacity-60"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {roster.canEdit && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button type="submit" variant="outline">
              Save Draft / Recorded
            </Button>
          </div>
        )}
      </form>

      {roster.canEdit && roster.sessionId && (
        <form action={finalizeAttendanceAction}>
          <input type="hidden" name="sessionId" value={roster.sessionId} />
          <div className="flex justify-end">
            <Button type="submit" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Finalize Attendance
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
