// ============================================================
// Report Card PDF Route
// ============================================================
// Streams a PDF for a given report card.
// Permission + scope enforced.
// ============================================================

import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { canForUser } from "@/lib/permissions/can";
import { renderReportCardPdf } from "@/lib/pdf/render-report-card";
import { isAppError, toErrorResponse } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ reportCardId: string }>;
}

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { reportCardId } = await params;
    const user = await requireCurrentUser();

    // Load the report card to get the student ID for scope check
    const reportCard = await prisma.reportCard.findUnique({
      where: { id: reportCardId },
      select: { id: true, studentId: true, status: true },
    });

    if (!reportCard) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Report card not found" } },
        { status: 404 },
      );
    }

    // Students cannot download PDFs (V1 rule)
    const isStudent = user.roles.includes("STUDENT");

    // Permission check
    const canDownload = await canForUser(
      user,
      "report_cards.download",
      { type: "report_card", reportCardId },
    );
    if (!canDownload || isStudent) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Access denied" } },
        { status: 403 },
      );
    }

    // Only allow downloading from APPROVED or PUBLISHED report cards
    if (!["APPROVED", "PUBLISHED"].includes(reportCard.status)) {
      return NextResponse.json(
        {
          error: {
            code: "CONFLICT",
            message: `Report card is in state ${reportCard.status} and cannot be downloaded yet.`,
          },
        },
        { status: 409 },
      );
    }

    const pdfBuffer = await renderReportCardPdf(reportCardId);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="report-card-${reportCardId}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}