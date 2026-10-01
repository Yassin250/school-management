import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import { getClassTimetable } from "@/lib/services/timetable/timetable";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";

export const metadata = {
  title: "School Timetable & Schedule",
};

export default async function TimetablePage() {
  const user = await requireCurrentUser();

  const firstClass = await prisma.class.findFirst({
    where: { isActive: true },
    include: { educationLevel: true },
  });

  let schedule = null;
  if (firstClass) {
    schedule = await getClassTimetable(user, firstClass.id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Weekly Class Schedule & Timetable
          </h1>
          <p className="text-sm text-muted-foreground">
            View period allocations, subject schedules, and room assignments.
          </p>
        </div>

        {schedule?.class && (
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {schedule.class.name} &bull; {schedule.class.levelName}
          </Badge>
        )}
      </div>

      {!schedule || schedule.lessons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground">No timetable schedule published yet.</p>
            <p className="text-xs mt-1">Timetable versions will appear once finalized by administration.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class Schedule</CardTitle>
            <CardDescription>
              {schedule.class?.name} &bull; Academic Year {schedule.class?.academicYearName}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Subject / Module</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Room</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.lessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-semibold text-foreground">
                      {lesson.dayName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-primary" />
                        <span>{lesson.startTime} &ndash; {lesson.endTime}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {lesson.subjectName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lesson.teacherName}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground/70" />
                        <span>{lesson.room}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
