import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/auth/session";
import {
  generateReportCardAction,
  approveReportCardAction,
  publishReportCardAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle2, Send, Download } from "lucide-react";

export const metadata = {
  title: "Official Report Cards & Academic Reports - Admin",
};

export default async function ReportCardsAdminPage() {
  await requireCurrentUser();

  const currentTerm = await prisma.term.findFirst({
    where: { isCurrent: true },
    include: { academicYear: true },
  });

  const students = await prisma.student.findMany({
    where: { status: "ACTIVE" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { class: true },
        take: 1,
      },
      reportCards: {
        where: currentTerm ? { termId: currentTerm.id } : undefined,
        take: 1,
      },
    },
    orderBy: { lastName: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Academic Reports & Report Cards
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate, approve, publish, and download official term report cards.
          </p>
        </div>

        {currentTerm && (
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {currentTerm.academicYear.name} &bull; {currentTerm.name}
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Class Roster & Report Card Status</CardTitle>
          <CardDescription>
            Report cards can only be generated after all class assessments are APPROVED.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Code</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Term Average</TableHead>
                <TableHead>Report Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const rc = s.reportCards[0];
                const className = s.enrollments[0]?.class?.name ?? "Unassigned";

                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {s.studentCode}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {s.firstName} {s.lastName}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground">
                      {className}
                    </TableCell>
                    <TableCell className="text-xs font-semibold">
                      {rc?.averageScore !== null && rc?.averageScore !== undefined
                        ? `${rc.averageScore}%`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rc?.status === "PUBLISHED"
                            ? "success"
                            : rc?.status === "APPROVED"
                            ? "default"
                            : rc?.status === "GENERATED"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {rc?.status ?? "NOT GENERATED"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!rc ? (
                        currentTerm && (
                          <form action={generateReportCardAction} className="inline-block">
                            <input type="hidden" name="studentId" value={s.id} />
                            <input type="hidden" name="termId" value={currentTerm.id} />
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                              <FileText className="h-3.5 w-3.5" />
                              <span>Generate</span>
                            </Button>
                          </form>
                        )
                      ) : rc.status === "GENERATED" ? (
                        <form action={approveReportCardAction} className="inline-block">
                          <input type="hidden" name="reportCardId" value={rc.id} />
                          <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </Button>
                        </form>
                      ) : rc.status === "APPROVED" ? (
                        <form action={publishReportCardAction} className="inline-block">
                          <input type="hidden" name="reportCardId" value={rc.id} />
                          <Button size="sm" className="gap-1.5 text-xs">
                            <Send className="h-3.5 w-3.5" />
                            <span>Publish</span>
                          </Button>
                        </form>
                      ) : (
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                          <Download className="h-3.5 w-3.5" />
                          <span>Download PDF</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
