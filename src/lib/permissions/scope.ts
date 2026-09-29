// ============================================================
// Resource Scope Resolvers
// ============================================================
// A user may have a permission (e.g., "grades.read") but that does
// not mean they can read every grade in the school. Scope rules
// determine WHICH records the user may access.
//
// Every resolver:
//   - Takes the CurrentUser and a resource identifier.
//   - Returns true if the user is allowed to access the resource.
//   - Returns false otherwise.
//
// These are called by can() AFTER the permission check.
// ============================================================

import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/lib/auth/session";

// ============================================================
// Student scope
// ============================================================

/**
 * Is the user allowed to access this student's record?
 *
 * - SYSTEM_ADMIN, SCHOOL_ADMIN, PRINCIPAL, REGISTRAR: yes (school-wide)
 * - ACCOUNTANT: yes (financial context only — enforced at call site)
 * - TEACHER: only if the student is enrolled in a class the teacher teaches
 * - PARENT: only if the parent is linked to the student
 * - STUDENT: only their own record
 */
export async function canAccessStudent(
  user: CurrentUser,
  studentId: string,
): Promise<boolean> {
  // School-wide roles
  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("REGISTRAR") ||
    user.roles.includes("ACCOUNTANT")
  ) {
    return true;
  }

  // Student: only own record
  if (user.roles.includes("STUDENT")) {
    return user.studentId === studentId;
  }

  // Parent: only linked children
  if (user.roles.includes("PARENT")) {
    if (!user.parentId) return false;

    const link = await prisma.parentStudent.findFirst({
      where: {
        parentId: user.parentId,
        studentId,
      },
      select: { id: true },
    });

    return !!link;
  }

  // Teacher: only students in classes they are assigned to
  if (user.roles.includes("TEACHER")) {
    if (!user.teacherId) return false;

    // Find the student's current enrollment class
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
      select: { classId: true },
    });

    if (!enrollment) return false;

    // Check if the teacher is assigned to this class (any subject/module)
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherId,
        classId: enrollment.classId,
      },
      select: { id: true },
    });

    return !!assignment;
  }

  return false;
}

// ============================================================
// Class scope
// ============================================================

/**
 * Is the user allowed to access this class?
 *
 * - School-wide roles: yes
 * - TEACHER: only classes they are assigned to (or are class teacher of)
 * - Others: no
 */
export async function canAccessClass(
  user: CurrentUser,
  classId: string,
): Promise<boolean> {
  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("REGISTRAR") ||
    user.roles.includes("ACCOUNTANT")
  ) {
    return true;
  }

  if (user.roles.includes("TEACHER")) {
    if (!user.teacherId) return false;

    // Class teacher?
    const classTeacher = await prisma.class.findFirst({
      where: {
        id: classId,
        classTeacherId: user.teacherId,
      },
      select: { id: true },
    });

    if (classTeacher) return true;

    // Or assigned to teach something in this class?
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherId,
        classId,
      },
      select: { id: true },
    });

    return !!assignment;
  }

  return false;
}

// ============================================================
// Assessment scope
// ============================================================

/**
 * Is the user allowed to access this assessment?
 *
 * - School-wide academic roles (SYSTEM_ADMIN, SCHOOL_ADMIN, PRINCIPAL): yes
 * - REGISTRAR: read-only (checked at call site via permission)
 * - TEACHER: only assessments they own, or for classes they teach
 * - PARENT/STUDENT: only if the assessment is for their child/self
 */
export async function canAccessAssessment(
  user: CurrentUser,
  assessmentId: string,
): Promise<boolean> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      teacherId: true,
      classId: true,
      termId: true,
    },
  });

  if (!assessment) return false;

  // School-wide roles
  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("REGISTRAR")
  ) {
    return true;
  }

  // Teacher: own assessment or assigned class
  if (user.roles.includes("TEACHER")) {
    if (!user.teacherId) return false;
    if (assessment.teacherId === user.teacherId) return true;

    // Assigned to the class?
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherId,
        classId: assessment.classId,
      },
      select: { id: true },
    });

    return !!assignment;
  }

  // Parent or student: check if the assessment belongs to their class
  const enrollment = await prisma.enrollment.findFirst({
    where: {
      classId: assessment.classId,
      status: "ACTIVE",
      ...(user.roles.includes("STUDENT") && user.studentId
        ? { studentId: user.studentId }
        : {}),
      ...(user.roles.includes("PARENT") && user.parentId
        ? { student: { parentLinks: { some: { parentId: user.parentId } } } }
        : {}),
    },
    select: { id: true },
  });

  return !!enrollment;
}

// ============================================================
// Report card scope
// ============================================================

/**
 * Is the user allowed to access this report card?
 *
 * - School-wide academic roles: yes
 * - TEACHER: only for students in their assigned classes
 * - PARENT: only their own children
 * - STUDENT: only their own
 */
export async function canAccessReportCard(
  user: CurrentUser,
  reportCardId: string,
): Promise<boolean> {
  const reportCard = await prisma.reportCard.findUnique({
    where: { id: reportCardId },
    select: { id: true, studentId: true, classId: true },
  });

  if (!reportCard) return false;

  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("REGISTRAR")
  ) {
    return true;
  }

  if (user.roles.includes("TEACHER")) {
    if (!user.teacherId) return false;
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherId,
        classId: reportCard.classId,
      },
      select: { id: true },
    });
    return !!assignment;
  }

  if (user.roles.includes("STUDENT")) {
    return user.studentId === reportCard.studentId;
  }

  if (user.roles.includes("PARENT")) {
    if (!user.parentId) return false;
    const link = await prisma.parentStudent.findFirst({
      where: {
        parentId: user.parentId,
        studentId: reportCard.studentId,
      },
      select: { id: true },
    });
    return !!link;
  }

  return false;
}

// ============================================================
// Invoice / payment scope
// ============================================================

/**
 * Is the user allowed to access this invoice?
 *
 * - SYSTEM_ADMIN, SCHOOL_ADMIN, PRINCIPAL, ACCOUNTANT: yes
 * - REGISTRAR: read-only (checked at call site)
 * - PARENT: only their own children's invoices
 * - STUDENT: only their own
 * - TEACHER: no
 */
export async function canAccessInvoice(
  user: CurrentUser,
  invoiceId: string,
): Promise<boolean> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true, studentId: true },
  });

  if (!invoice) return false;

  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("ACCOUNTANT") ||
    user.roles.includes("REGISTRAR")
  ) {
    return true;
  }

  if (user.roles.includes("STUDENT")) {
    return user.studentId === invoice.studentId;
  }

  if (user.roles.includes("PARENT")) {
    if (!user.parentId) return false;
    const link = await prisma.parentStudent.findFirst({
      where: {
        parentId: user.parentId,
        studentId: invoice.studentId,
      },
      select: { id: true },
    });
    return !!link;
  }

  return false;
}

/**
 * Is the user allowed to access this payment?
 */
export async function canAccessPayment(
  user: CurrentUser,
  paymentId: string,
): Promise<boolean> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, studentId: true },
  });

  if (!payment) return false;

  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("ACCOUNTANT") ||
    user.roles.includes("REGISTRAR")
  ) {
    return true;
  }

  if (user.roles.includes("STUDENT")) {
    return user.studentId === payment.studentId;
  }

  if (user.roles.includes("PARENT")) {
    if (!user.parentId) return false;
    const link = await prisma.parentStudent.findFirst({
      where: {
        parentId: user.parentId,
        studentId: payment.studentId,
      },
      select: { id: true },
    });
    return !!link;
  }

  return false;
}

// ============================================================
// Attendance scope
// ============================================================

/**
 * Is the user allowed to access this attendance record?
 */
export async function canAccessAttendance(
  user: CurrentUser,
  attendanceId: string,
): Promise<boolean> {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    select: {
      id: true,
      studentId: true,
      lesson: { select: { classId: true } },
    },
  });

  if (!attendance) return false;

  if (
    user.roles.includes("SYSTEM_ADMIN") ||
    user.roles.includes("SCHOOL_ADMIN") ||
    user.roles.includes("PRINCIPAL") ||
    user.roles.includes("REGISTRAR")
  ) {
    return true;
  }

  if (user.roles.includes("TEACHER")) {
    if (!user.teacherId) return false;
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: user.teacherId,
        classId: attendance.lesson.classId,
      },
      select: { id: true },
    });
    return !!assignment;
  }

  if (user.roles.includes("STUDENT")) {
    return user.studentId === attendance.studentId;
  }

  if (user.roles.includes("PARENT")) {
    if (!user.parentId) return false;
    const link = await prisma.parentStudent.findFirst({
      where: {
        parentId: user.parentId,
        studentId: attendance.studentId,
      },
      select: { id: true },
    });
    return !!link;
  }

  return false;
}

// ============================================================
// Announcement scope
// ============================================================

/**
 * Is the user allowed to view this announcement?
 */
export async function canAccessAnnouncement(
  user: CurrentUser,
  announcementId: string,
): Promise<boolean> {
  const announcement = await prisma.announcement.findUnique({
    where: { id: announcementId },
    select: {
      id: true,
      audience: true,
      classId: true,
      authorId: true,
      publishedAt: true,
    },
  });

  if (!announcement) return false;

  // Unpublished drafts: only author or admins
  if (!announcement.publishedAt) {
    if (
      user.roles.includes("SYSTEM_ADMIN") ||
      user.roles.includes("SCHOOL_ADMIN") ||
      user.roles.includes("PRINCIPAL")
    ) {
      return true;
    }
    return announcement.authorId === user.id;
  }

  // Class-scoped announcement
  if (announcement.audience === "CLASS" && announcement.classId) {
    return canAccessClass(user, announcement.classId);
  }

  // Audience-scoped
  switch (announcement.audience) {
    case "ALL":
      return true;
    case "STUDENTS":
      return user.roles.includes("STUDENT");
    case "PARENTS":
      return user.roles.includes("PARENT");
    case "TEACHERS":
      return user.roles.includes("TEACHER");
    case "STAFF":
      return (
        user.roles.includes("SYSTEM_ADMIN") ||
        user.roles.includes("SCHOOL_ADMIN") ||
        user.roles.includes("PRINCIPAL") ||
        user.roles.includes("ACCOUNTANT") ||
        user.roles.includes("REGISTRAR") ||
        user.roles.includes("TEACHER")
      );
    default:
      return false;
  }
}