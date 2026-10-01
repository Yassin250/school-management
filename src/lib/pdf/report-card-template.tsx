// ============================================================
// Report Card PDF Template
// ============================================================
// React-PDF component that renders a single report card.
// Pure rendering — no DB access, no permissions.
// ============================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface ReportCardPdfData {
  school: {
    name: string;
    motto: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
  };
  student: {
    studentCode: string;
    firstName: string;
    lastName: string;
    sex: string;
  };
  academicYear: string;
  term: string;
  className: string;
  educationLevel: string;
  items: Array<{
    subjectName: string;
    score: number | null;
    maxScore: number | null;
    grade: string | null;
    comment: string | null;
  }>;
  totalScore: number | null;
  averageScore: number | null;
  attendance: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  teacherComment: string | null;
  principalComment: string | null;
  referenceCode: string | null;
  generatedAt: Date;
  approvedByName: string | null;
}

// ------------------------------------------------------------
// Styles
// ------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#111111",
    paddingBottom: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  schoolName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  motto: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#555555",
    marginTop: 2,
  },
  contact: {
    fontSize: 8,
    color: "#777777",
    marginTop: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  studentBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  studentColumn: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: "#888888",
    letterSpacing: 1,
  },
  value: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 1,
  },
  table: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f3f3",
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  colSubject: { flex: 3 },
  colScore: { flex: 1, textAlign: "center" },
  colMax: { flex: 1, textAlign: "center" },
  colGrade: { flex: 1, textAlign: "center" },
  colComment: { flex: 3 },
  headerText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#444444",
    letterSpacing: 1,
  },
  summaryBlock: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    flexDirection: "row",
  },
  summaryItem: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  commentBlock: {
    marginTop: 14,
  },
  commentTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    color: "#444444",
    marginBottom: 3,
  },
  commentText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: "auto",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    flex: 2,
  },
  footerRight: {
    flex: 1,
    textAlign: "right",
  },
  footerMeta: {
    fontSize: 8,
    color: "#888888",
    marginTop: 2,
  },
  signature: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginTop: 20,
    textAlign: "right",
  },
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function pct(score: number | null, max: number | null): string {
  if (score === null || max === null || max === 0) return "-";
  return `${Math.round((score / max) * 1000) / 10}%`;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export function ReportCardPdf({ data }: { data: ReportCardPdfData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>{data.school.name}</Text>
          {data.school.motto && (
            <Text style={styles.motto}>"{data.school.motto}"</Text>
          )}
          <Text style={styles.contact}>
            {[data.school.address, data.school.city, data.school.phone]
              .filter(Boolean)
              .join("  ·  ")}
          </Text>
          <Text style={styles.title}>TERM REPORT CARD</Text>
          <Text style={styles.subtitle}>
            Academic Year {data.academicYear}  ·  {data.term}
          </Text>
        </View>

        {/* Student */}
        <View style={styles.studentBlock}>
          <View style={styles.studentColumn}>
            <Text style={styles.label}>STUDENT</Text>
            <Text style={styles.value}>
              {data.student.lastName} {data.student.firstName}
            </Text>
          </View>
          <View style={styles.studentColumn}>
            <Text style={styles.label}>STUDENT CODE</Text>
            <Text style={styles.value}>{data.student.studentCode}</Text>
          </View>
          <View style={styles.studentColumn}>
            <Text style={styles.label}>CLASS</Text>
            <Text style={styles.value}>
              {data.className} ({data.educationLevel})
            </Text>
          </View>
          <View style={styles.studentColumn}>
            <Text style={styles.label}>SEX</Text>
            <Text style={styles.value}>{data.student.sex}</Text>
          </View>
        </View>

        {/* Marks table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, styles.colSubject]}>SUBJECT</Text>
            <Text style={[styles.headerText, styles.colScore]}>MARKS</Text>
            <Text style={[styles.headerText, styles.colMax]}>MAX</Text>
            <Text style={[styles.headerText, styles.colScore]}>%</Text>
            <Text style={[styles.headerText, styles.colGrade]}>GRADE</Text>
            <Text style={[styles.headerText, styles.colComment]}>COMMENT</Text>
          </View>

          {data.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colSubject}>{item.subjectName}</Text>
              <Text style={styles.colScore}>
                {item.score !== null ? item.score : "-"}
              </Text>
              <Text style={styles.colMax}>
                {item.maxScore !== null ? item.maxScore : "-"}
              </Text>
              <Text style={styles.colScore}>
                {pct(item.score, item.maxScore)}
              </Text>
              <Text style={styles.colGrade}>{item.grade ?? "-"}</Text>
              <Text style={styles.colComment}>{item.comment ?? ""}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summaryBlock}>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>TOTAL SCORE</Text>
            <Text style={styles.summaryValue}>{data.totalScore ?? "-"}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>AVERAGE</Text>
            <Text style={styles.summaryValue}>
              {data.averageScore !== null ? `${data.averageScore}%` : "-"}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>PRESENT</Text>
            <Text style={styles.summaryValue}>{data.attendance.present}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>ABSENT</Text>
            <Text style={styles.summaryValue}>{data.attendance.absent}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>LATE</Text>
            <Text style={styles.summaryValue}>{data.attendance.late}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.label}>EXCUSED</Text>
            <Text style={styles.summaryValue}>{data.attendance.excused}</Text>
          </View>
        </View>

        {/* Comments */}
        {data.teacherComment && (
          <View style={styles.commentBlock}>
            <Text style={styles.commentTitle}>TEACHER'S REMARKS</Text>
            <Text style={styles.commentText}>{data.teacherComment}</Text>
          </View>
        )}

        {data.principalComment && (
          <View style={styles.commentBlock}>
            <Text style={styles.commentTitle}>PRINCIPAL'S REMARKS</Text>
            <Text style={styles.commentText}>{data.principalComment}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.label}>REFERENCE CODE</Text>
            <Text style={styles.value}>{data.referenceCode ?? "-"}</Text>
            <Text style={styles.footerMeta}>
              Generated on {fmtDate(data.generatedAt)}
            </Text>
            {data.approvedByName && (
              <Text style={styles.footerMeta}>
                Approved by: {data.approvedByName}
              </Text>
            )}
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.footerMeta}>Authorized signature</Text>
            <Text style={styles.signature}>______________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}