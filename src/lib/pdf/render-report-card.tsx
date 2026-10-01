// ============================================================
// Report Card PDF Renderer
// ============================================================
// Renders a ReportCard record into a PDF buffer.
// ============================================================

import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/errors";
import {
  ReportCardPdf,
  type ReportCardPdfData,
} from "./report-card-template";

export async function renderReportCardPdf(
  reportCardId: string,
): Promise<Buffer> {
  const reportCard = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    include: {
      student: {
        select: {
          studentCode: true,
          firstName: true,
          lastName: true,
          sex: true,
        },
      },
      academicYear: { select: { name: true } },
      term: { select: { name: true } },
      class: {
        select: {
          name: true,
          educationLevel: { select: { name: true } },
        },
      },
      items: {
        include: {
          subject: { select: { name: true } },
          module: { select: { name: true } },
        },
      },
      approvedBy: { select: { username: true } },
    },
  });

  if (!reportCard) {
    throw new NotFoundError("ReportCard", reportCardId);
  }

  const school = await prisma.schoolInfo.findFirst();

  const data: ReportCardPdfData = {
    school: {
      name: school?.name ?? "School",
      motto: school?.motto ?? null,
      address: school?.address ?? null,
      city: school?.city ?? null,
      phone: school?.phone ?? null,
      email: school?.email ?? null,
    },
    student: {
      studentCode: reportCard.student.studentCode,
      firstName: reportCard.student.firstName,
      lastName: reportCard.student.lastName,
      sex: reportCard.student.sex,
    },
    academicYear: reportCard.academicYear.name,
    term: reportCard.term.name,
    className: reportCard.class.name,
    educationLevel: reportCard.class.educationLevel.name,
    items: reportCard.items.map((it) => ({
      subjectName: it.subject?.name ?? it.module?.name ?? "Subject",
      score: it.score !== null ? Number(it.score) : null,
      maxScore: it.maxScore !== null ? Number(it.maxScore) : null,
      grade: it.grade,
      comment: it.comment,
    })),
    totalScore:
      reportCard.totalScore !== null ? Number(reportCard.totalScore) : null,
    averageScore:
      reportCard.averageScore !== null
        ? Number(reportCard.averageScore)
        : null,
    attendance: {
      present: reportCard.attendancePresent ?? 0,
      absent: reportCard.attendanceAbsent ?? 0,
      late: reportCard.attendanceLate ?? 0,
      excused: reportCard.attendanceExcused ?? 0,
    },
    teacherComment: reportCard.teacherComment,
    principalComment: reportCard.principalComment,
    referenceCode: reportCard.referenceCode,
    generatedAt: reportCard.generatedAt ?? reportCard.createdAt,
    approvedByName: reportCard.approvedBy?.username ?? null,
  };

  const buffer = await renderToBuffer(<ReportCardPdf data={data} />);
  return Buffer.from(buffer);
}