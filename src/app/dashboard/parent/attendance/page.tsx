import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getStudentAttendanceHistory } from "@/lib/services/attendance/attendance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = { title: "Children's Attendance — Parent" };

export default async function ParentAttendancePage() {
  const user = await requireCurrentUser();
  if (!user.parentId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Your account is not linked to a parent profile.{" "}
          <Link href="/dashboard/parent" className="underline">
            Return to portal
          </Link>
        </CardContent>
      </Card>
    );
  }

  const links = await prisma.parentStudent.findMany({
    where: { parentId: user.parentId },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, studentCode: true },
      },
    },
  });

  const childrenData = await Promise.all(
    links.map(async (link) => ({
      student: link.student,
      data: await getStudentAttendanceHistory(user, link.student.id),
    })),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Children&apos;s Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Finalized attendance only — scoped to your linked children.
        </p>
      </div>

      {childrenData.map(({ student, data }) => (
        <Card key={student.id}>
          <CardHeader>
            <CardTitle className="text-lg">
              {student.firstName} {student.lastName}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                ({student.studentCode})
              </span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Attendance rate: {data.summary.percentage}% · Present:{" "}
              {data.summary.present} · Absent: {data.summary.absent} · Late:{" "}
              {data.summary.late} · Excused: {data.summary.excused}
            </p>
          </CardHeader>
          <CardContent>
            {data.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No finalized records yet.</p>
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
                  {data.history.map((row) => (
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
      ))}
    </div>
  );
}
