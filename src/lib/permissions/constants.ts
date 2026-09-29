// ============================================================
// Permission and Role Constants
// Source of truth: docs/rbac.md
// ============================================================

// ------------------------------------------------------------
// Permission keys
// ------------------------------------------------------------

export const PERMISSIONS = {
  // --------------------------------------------------------
  // System
  // --------------------------------------------------------
  SYSTEM_READ: "system.read",
  SYSTEM_UPDATE: "system.update",
  SYSTEM_CONFIGURATION: "system.configuration",
  SYSTEM_MAINTENANCE: "system.maintenance",

  // --------------------------------------------------------
  // Users and Authentication
  // --------------------------------------------------------
  USERS_READ: "users.read",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_ARCHIVE: "users.archive",
  USERS_RESET_PASSWORD: "users.reset_password",
  USERS_ASSIGN_ROLES: "users.assign_roles",

  ROLES_READ: "roles.read",
  ROLES_CREATE: "roles.create",
  ROLES_UPDATE: "roles.update",
  ROLES_DELETE: "roles.delete",

  PERMISSIONS_READ: "permissions.read",
  PERMISSIONS_ASSIGN: "permissions.assign",

  SECURITY_READ: "security.read",
  SECURITY_MANAGE: "security.manage",

  // --------------------------------------------------------
  // Students
  // --------------------------------------------------------
  STUDENTS_READ: "students.read",
  STUDENTS_CREATE: "students.create",
  STUDENTS_UPDATE: "students.update",
  STUDENTS_ARCHIVE: "students.archive",
  STUDENTS_RESTORE: "students.restore",
  STUDENTS_VIEW_SENSITIVE: "students.view_sensitive",

  // --------------------------------------------------------
  // Parents / Guardians
  // --------------------------------------------------------
  PARENTS_READ: "parents.read",
  PARENTS_CREATE: "parents.create",
  PARENTS_UPDATE: "parents.update",
  PARENTS_ARCHIVE: "parents.archive",
  PARENTS_RESTORE: "parents.restore",
  PARENT_STUDENT_MANAGE: "parent_student.manage",

  // --------------------------------------------------------
  // Teachers
  // --------------------------------------------------------
  TEACHERS_READ: "teachers.read",
  TEACHERS_CREATE: "teachers.create",
  TEACHERS_UPDATE: "teachers.update",
  TEACHERS_ARCHIVE: "teachers.archive",
  TEACHERS_RESTORE: "teachers.restore",

  TEACHER_ASSIGNMENTS_READ: "teacher_assignments.read",
  TEACHER_ASSIGNMENTS_CREATE: "teacher_assignments.create",
  TEACHER_ASSIGNMENTS_UPDATE: "teacher_assignments.update",
  TEACHER_ASSIGNMENTS_DELETE: "teacher_assignments.delete",

  // --------------------------------------------------------
  // Academic Structure
  // --------------------------------------------------------
  ACADEMIC_YEARS_READ: "academic_years.read",
  ACADEMIC_YEARS_CREATE: "academic_years.create",
  ACADEMIC_YEARS_UPDATE: "academic_years.update",
  ACADEMIC_YEARS_CLOSE: "academic_years.close",

  TERMS_READ: "terms.read",
  TERMS_CREATE: "terms.create",
  TERMS_UPDATE: "terms.update",
  TERMS_CLOSE: "terms.close",

  LEVELS_READ: "levels.read",
  LEVELS_CREATE: "levels.create",
  LEVELS_UPDATE: "levels.update",

  PATHWAYS_READ: "pathways.read",
  PATHWAYS_CREATE: "pathways.create",
  PATHWAYS_UPDATE: "pathways.update",

  TRADES_READ: "trades.read",
  TRADES_CREATE: "trades.create",
  TRADES_UPDATE: "trades.update",

  SUBJECTS_READ: "subjects.read",
  SUBJECTS_CREATE: "subjects.create",
  SUBJECTS_UPDATE: "subjects.update",

  MODULES_READ: "modules.read",
  MODULES_CREATE: "modules.create",
  MODULES_UPDATE: "modules.update",

  CLASSES_READ: "classes.read",
  CLASSES_CREATE: "classes.create",
  CLASSES_UPDATE: "classes.update",
  CLASSES_ARCHIVE: "classes.archive",

  // --------------------------------------------------------
  // Enrollment
  // --------------------------------------------------------
  ENROLLMENTS_READ: "enrollments.read",
  ENROLLMENTS_CREATE: "enrollments.create",
  ENROLLMENTS_UPDATE: "enrollments.update",
  ENROLLMENTS_TRANSFER: "enrollments.transfer",
  ENROLLMENTS_WITHDRAW: "enrollments.withdraw",
  ENROLLMENTS_COMPLETE: "enrollments.complete",

  // --------------------------------------------------------
  // Attendance
  // --------------------------------------------------------
  ATTENDANCE_READ: "attendance.read",
  ATTENDANCE_CREATE: "attendance.create",
  ATTENDANCE_UPDATE: "attendance.update",
  ATTENDANCE_CORRECT: "attendance.correct",
  ATTENDANCE_REPORTS: "attendance.reports",

  // --------------------------------------------------------
  // Assessments
  // --------------------------------------------------------
  ASSESSMENTS_READ: "assessments.read",
  ASSESSMENTS_CREATE: "assessments.create",
  ASSESSMENTS_UPDATE: "assessments.update",
  ASSESSMENTS_ARCHIVE: "assessments.archive",

  // --------------------------------------------------------
  // Grades
  // --------------------------------------------------------
  GRADES_READ: "grades.read",
  GRADES_ENTER: "grades.enter",
  GRADES_EDIT: "grades.edit",
  GRADES_SUBMIT: "grades.submit",
  GRADES_REVIEW: "grades.review",
  GRADES_RETURN: "grades.return",
  GRADES_APPROVE: "grades.approve",
  GRADES_REQUEST_CORRECTION: "grades.request_correction",
  GRADES_AUTHORIZE_CORRECTION: "grades.authorize_correction",
  GRADES_CANCEL_CORRECTION: "grades.cancel_correction",
  GRADES_LOCK: "grades.lock",
  GRADES_REQUEST_POST_LOCK_CORRECTION: "grades.request_post_lock_correction",

  // --------------------------------------------------------
  // Grade Scales
  // --------------------------------------------------------
  GRADE_SCALES_READ: "grade_scales.read",
  GRADE_SCALES_CREATE: "grade_scales.create",
  GRADE_SCALES_UPDATE: "grade_scales.update",
  GRADE_SCALES_ARCHIVE: "grade_scales.archive",

  // --------------------------------------------------------
  // Report Cards
  // --------------------------------------------------------
  REPORT_CARDS_READ: "report_cards.read",
  REPORT_CARDS_GENERATE: "report_cards.generate",
  REPORT_CARDS_REVIEW: "report_cards.review",
  REPORT_CARDS_UPDATE: "report_cards.update",
  REPORT_CARDS_APPROVE: "report_cards.approve",
  REPORT_CARDS_PUBLISH: "report_cards.publish",
  REPORT_CARDS_DOWNLOAD: "report_cards.download",
  REPORT_CARDS_REGENERATE: "report_cards.regenerate",

  // --------------------------------------------------------
  // Timetable
  // --------------------------------------------------------
  TIMETABLE_READ: "timetable.read",
  TIMETABLE_CREATE: "timetable.create",
  TIMETABLE_UPDATE: "timetable.update",
  TIMETABLE_PUBLISH: "timetable.publish",
  TIMETABLE_ARCHIVE: "timetable.archive",
  TIMETABLE_CONFLICTS_READ: "timetable.conflicts.read",
  TIMETABLE_CONFLICTS_RESOLVE: "timetable.conflicts.resolve",

  // --------------------------------------------------------
  // Finance
  // --------------------------------------------------------
  FEE_STRUCTURES_READ: "fee_structures.read",
  FEE_STRUCTURES_CREATE: "fee_structures.create",
  FEE_STRUCTURES_UPDATE: "fee_structures.update",
  FEE_STRUCTURES_ARCHIVE: "fee_structures.archive",

  INVOICES_READ: "invoices.read",
  INVOICES_CREATE: "invoices.create",
  INVOICES_UPDATE: "invoices.update",
  INVOICES_CANCEL: "invoices.cancel",

  PAYMENTS_READ: "payments.read",
  PAYMENTS_CREATE: "payments.create",
  PAYMENTS_UPDATE: "payments.update",
  PAYMENTS_REFUND: "payments.refund",

  RECEIPTS_READ: "receipts.read",
  RECEIPTS_CREATE: "receipts.create",
  RECEIPTS_DOWNLOAD: "receipts.download",

  DISCOUNTS_READ: "discounts.read",
  DISCOUNTS_CREATE: "discounts.create",
  DISCOUNTS_APPROVE: "discounts.approve",
  DISCOUNTS_CANCEL: "discounts.cancel",

  SCHOLARSHIPS_READ: "scholarships.read",
  SCHOLARSHIPS_CREATE: "scholarships.create",
  SCHOLARSHIPS_UPDATE: "scholarships.update",
  SCHOLARSHIPS_ARCHIVE: "scholarships.archive",

  FINANCIAL_REPORTS_READ: "financial_reports.read",
  FINANCIAL_REPORTS_EXPORT: "financial_reports.export",

  // --------------------------------------------------------
  // Communication
  // --------------------------------------------------------
  ANNOUNCEMENTS_READ: "announcements.read",
  ANNOUNCEMENTS_CREATE: "announcements.create",
  ANNOUNCEMENTS_UPDATE: "announcements.update",
  ANNOUNCEMENTS_PUBLISH: "announcements.publish",
  ANNOUNCEMENTS_ARCHIVE: "announcements.archive",

  NOTIFICATIONS_READ: "notifications.read",
  NOTIFICATIONS_MANAGE: "notifications.manage",

  // --------------------------------------------------------
  // Files
  // --------------------------------------------------------
  FILES_READ: "files.read",
  FILES_UPLOAD: "files.upload",
  FILES_UPDATE: "files.update",
  FILES_DELETE: "files.delete",

  // --------------------------------------------------------
  // Audit
  // --------------------------------------------------------
  AUDIT_LOGS_READ: "audit_logs.read",
  AUDIT_LOGS_EXPORT: "audit_logs.export",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ------------------------------------------------------------
// Role keys
// ------------------------------------------------------------

export const ROLES = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  SCHOOL_ADMIN: "SCHOOL_ADMIN",
  PRINCIPAL: "PRINCIPAL",
  TEACHER: "TEACHER",
  ACCOUNTANT: "ACCOUNTANT",
  REGISTRAR: "REGISTRAR",
  PARENT: "PARENT",
  STUDENT: "STUDENT",
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

// ------------------------------------------------------------
// Role metadata (for seeding)
// ------------------------------------------------------------

export const ROLE_METADATA: Record<
  RoleKey,
  { name: string; description: string; isSystem: true }
> = {
  [ROLES.SYSTEM_ADMIN]: {
    name: "System Administrator",
    description:
      "Manages system configuration, users, roles, permissions, and security. Does not automatically receive academic or financial authority.",
    isSystem: true,
  },
  [ROLES.SCHOOL_ADMIN]: {
    name: "School Administrator",
    description:
      "Operational school management: students, teachers, classes, academic configuration, school settings, announcements, reports.",
    isSystem: true,
  },
  [ROLES.PRINCIPAL]: {
    name: "Principal / Headteacher",
    description:
      "Academic leadership: review and approve grades, monitor attendance, oversee academic records, authorize important announcements.",
    isSystem: true,
  },
  [ROLES.TEACHER]: {
    name: "Teacher",
    description:
      "Delivers assigned classes, records attendance, creates assessments, enters marks for assigned classes/subjects/modules.",
    isSystem: true,
  },
  [ROLES.ACCOUNTANT]: {
    name: "Accountant / Bursar",
    description:
      "Manages fees, invoices, payments, receipts, discounts, scholarships, and financial reports.",
    isSystem: true,
  },
  [ROLES.REGISTRAR]: {
    name: "Registrar / Secretary",
    description:
      "Manages student records, enrollment, class assignment, transfers, parent/guardian information, official student documents.",
    isSystem: true,
  },
  [ROLES.PARENT]: {
    name: "Parent / Guardian",
    description:
      "Views information about linked children: attendance, grades, fees, report cards, announcements.",
    isSystem: true,
  },
  [ROLES.STUDENT]: {
    name: "Student",
    description:
      "Read-only access to own profile, class, subjects, timetable, attendance, grades, report information, announcements.",
    isSystem: true,
  },
};

// ------------------------------------------------------------
// Permission categories (for grouping in admin UI)
// ------------------------------------------------------------

export const PERMISSION_CATEGORIES: Record<string, string> = {
  system: "System",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  security: "Security",
  students: "Students",
  parents: "Parents",
  parent_student: "Parent-Student Links",
  teachers: "Teachers",
  teacher_assignments: "Teacher Assignments",
  academic_years: "Academic Years",
  terms: "Terms",
  levels: "Education Levels",
  pathways: "Pathways",
  trades: "TVET Trades",
  subjects: "Subjects",
  modules: "TVET Modules",
  classes: "Classes",
  enrollments: "Enrollments",
  attendance: "Attendance",
  assessments: "Assessments",
  grades: "Grades",
  grade_scales: "Grade Scales",
  report_cards: "Report Cards",
  timetable: "Timetable",
  fee_structures: "Fee Structures",
  invoices: "Invoices",
  payments: "Payments",
  receipts: "Receipts",
  discounts: "Discounts",
  scholarships: "Scholarships",
  financial_reports: "Financial Reports",
  announcements: "Announcements",
  notifications: "Notifications",
  files: "Files",
  audit_logs: "Audit Logs",
};

// ------------------------------------------------------------
// Grouped permissions for seeding
// ------------------------------------------------------------

export interface PermissionSeed {
  key: Permission;
  category: string;
  description: string;
}

export const PERMISSION_SEEDS: PermissionSeed[] = [
  // System
  { key: PERMISSIONS.SYSTEM_READ, category: "system", description: "View system information" },
  { key: PERMISSIONS.SYSTEM_UPDATE, category: "system", description: "Update system settings" },
  { key: PERMISSIONS.SYSTEM_CONFIGURATION, category: "system", description: "Manage system configuration" },
  { key: PERMISSIONS.SYSTEM_MAINTENANCE, category: "system", description: "Perform system maintenance" },

  // Users
  { key: PERMISSIONS.USERS_READ, category: "users", description: "View user accounts" },
  { key: PERMISSIONS.USERS_CREATE, category: "users", description: "Create user accounts" },
  { key: PERMISSIONS.USERS_UPDATE, category: "users", description: "Update user accounts" },
  { key: PERMISSIONS.USERS_ARCHIVE, category: "users", description: "Archive user accounts" },
  { key: PERMISSIONS.USERS_RESET_PASSWORD, category: "users", description: "Reset user passwords" },
  { key: PERMISSIONS.USERS_ASSIGN_ROLES, category: "users", description: "Assign roles to users" },

  // Roles and permissions
  { key: PERMISSIONS.ROLES_READ, category: "roles", description: "View roles" },
  { key: PERMISSIONS.ROLES_CREATE, category: "roles", description: "Create roles" },
  { key: PERMISSIONS.ROLES_UPDATE, category: "roles", description: "Update roles" },
  { key: PERMISSIONS.ROLES_DELETE, category: "roles", description: "Delete roles" },
  { key: PERMISSIONS.PERMISSIONS_READ, category: "permissions", description: "View permission definitions" },
  { key: PERMISSIONS.PERMISSIONS_ASSIGN, category: "permissions", description: "Assign permissions to roles" },

  // Security
  { key: PERMISSIONS.SECURITY_READ, category: "security", description: "View security settings" },
  { key: PERMISSIONS.SECURITY_MANAGE, category: "security", description: "Manage security settings" },

  // Students
  { key: PERMISSIONS.STUDENTS_READ, category: "students", description: "View student records" },
  { key: PERMISSIONS.STUDENTS_CREATE, category: "students", description: "Create student records" },
  { key: PERMISSIONS.STUDENTS_UPDATE, category: "students", description: "Update student records" },
  { key: PERMISSIONS.STUDENTS_ARCHIVE, category: "students", description: "Archive student records" },
  { key: PERMISSIONS.STUDENTS_RESTORE, category: "students", description: "Restore archived student records" },
  { key: PERMISSIONS.STUDENTS_VIEW_SENSITIVE, category: "students", description: "View sensitive student information (national ID)" },

  // Parents
  { key: PERMISSIONS.PARENTS_READ, category: "parents", description: "View parent records" },
  { key: PERMISSIONS.PARENTS_CREATE, category: "parents", description: "Create parent records" },
  { key: PERMISSIONS.PARENTS_UPDATE, category: "parents", description: "Update parent records" },
  { key: PERMISSIONS.PARENTS_ARCHIVE, category: "parents", description: "Archive parent records" },
  { key: PERMISSIONS.PARENTS_RESTORE, category: "parents", description: "Restore archived parent records" },
  { key: PERMISSIONS.PARENT_STUDENT_MANAGE, category: "parent_student", description: "Manage parent-student relationships" },

  // Teachers
  { key: PERMISSIONS.TEACHERS_READ, category: "teachers", description: "View teacher records" },
  { key: PERMISSIONS.TEACHERS_CREATE, category: "teachers", description: "Create teacher records" },
  { key: PERMISSIONS.TEACHERS_UPDATE, category: "teachers", description: "Update teacher records" },
  { key: PERMISSIONS.TEACHERS_ARCHIVE, category: "teachers", description: "Archive teacher records" },
  { key: PERMISSIONS.TEACHERS_RESTORE, category: "teachers", description: "Restore archived teacher records" },
  { key: PERMISSIONS.TEACHER_ASSIGNMENTS_READ, category: "teacher_assignments", description: "View teacher assignments" },
  { key: PERMISSIONS.TEACHER_ASSIGNMENTS_CREATE, category: "teacher_assignments", description: "Create teacher assignments" },
  { key: PERMISSIONS.TEACHER_ASSIGNMENTS_UPDATE, category: "teacher_assignments", description: "Update teacher assignments" },
  { key: PERMISSIONS.TEACHER_ASSIGNMENTS_DELETE, category: "teacher_assignments", description: "Delete teacher assignments" },

  // Academic years
  { key: PERMISSIONS.ACADEMIC_YEARS_READ, category: "academic_years", description: "View academic years" },
  { key: PERMISSIONS.ACADEMIC_YEARS_CREATE, category: "academic_years", description: "Create academic years" },
  { key: PERMISSIONS.ACADEMIC_YEARS_UPDATE, category: "academic_years", description: "Update academic years" },
  { key: PERMISSIONS.ACADEMIC_YEARS_CLOSE, category: "academic_years", description: "Close academic years" },

  // Terms
  { key: PERMISSIONS.TERMS_READ, category: "terms", description: "View terms" },
  { key: PERMISSIONS.TERMS_CREATE, category: "terms", description: "Create terms" },
  { key: PERMISSIONS.TERMS_UPDATE, category: "terms", description: "Update terms" },
  { key: PERMISSIONS.TERMS_CLOSE, category: "terms", description: "Close terms" },

  // Levels
  { key: PERMISSIONS.LEVELS_READ, category: "levels", description: "View education levels" },
  { key: PERMISSIONS.LEVELS_CREATE, category: "levels", description: "Create education levels" },
  { key: PERMISSIONS.LEVELS_UPDATE, category: "levels", description: "Update education levels" },

  // Pathways
  { key: PERMISSIONS.PATHWAYS_READ, category: "pathways", description: "View pathways" },
  { key: PERMISSIONS.PATHWAYS_CREATE, category: "pathways", description: "Create pathways" },
  { key: PERMISSIONS.PATHWAYS_UPDATE, category: "pathways", description: "Update pathways" },

  // Trades
  { key: PERMISSIONS.TRADES_READ, category: "trades", description: "View TVET trades" },
  { key: PERMISSIONS.TRADES_CREATE, category: "trades", description: "Create TVET trades" },
  { key: PERMISSIONS.TRADES_UPDATE, category: "trades", description: "Update TVET trades" },

  // Subjects
  { key: PERMISSIONS.SUBJECTS_READ, category: "subjects", description: "View subjects" },
  { key: PERMISSIONS.SUBJECTS_CREATE, category: "subjects", description: "Create subjects" },
  { key: PERMISSIONS.SUBJECTS_UPDATE, category: "subjects", description: "Update subjects" },

  // Modules
  { key: PERMISSIONS.MODULES_READ, category: "modules", description: "View TVET modules" },
  { key: PERMISSIONS.MODULES_CREATE, category: "modules", description: "Create TVET modules" },
  { key: PERMISSIONS.MODULES_UPDATE, category: "modules", description: "Update TVET modules" },

  // Classes
  { key: PERMISSIONS.CLASSES_READ, category: "classes", description: "View classes" },
  { key: PERMISSIONS.CLASSES_CREATE, category: "classes", description: "Create classes" },
  { key: PERMISSIONS.CLASSES_UPDATE, category: "classes", description: "Update classes" },
  { key: PERMISSIONS.CLASSES_ARCHIVE, category: "classes", description: "Archive classes" },

  // Enrollments
  { key: PERMISSIONS.ENROLLMENTS_READ, category: "enrollments", description: "View enrollments" },
  { key: PERMISSIONS.ENROLLMENTS_CREATE, category: "enrollments", description: "Create enrollments" },
  { key: PERMISSIONS.ENROLLMENTS_UPDATE, category: "enrollments", description: "Update enrollments" },
  { key: PERMISSIONS.ENROLLMENTS_TRANSFER, category: "enrollments", description: "Transfer students between classes" },
  { key: PERMISSIONS.ENROLLMENTS_WITHDRAW, category: "enrollments", description: "Withdraw students" },
  { key: PERMISSIONS.ENROLLMENTS_COMPLETE, category: "enrollments", description: "Complete enrollments" },

  // Attendance
  { key: PERMISSIONS.ATTENDANCE_READ, category: "attendance", description: "View attendance records" },
  { key: PERMISSIONS.ATTENDANCE_CREATE, category: "attendance", description: "Record attendance" },
  { key: PERMISSIONS.ATTENDANCE_UPDATE, category: "attendance", description: "Update attendance records" },
  { key: PERMISSIONS.ATTENDANCE_CORRECT, category: "attendance", description: "Correct finalized attendance" },
  { key: PERMISSIONS.ATTENDANCE_REPORTS, category: "attendance", description: "View attendance reports" },

  // Assessments
  { key: PERMISSIONS.ASSESSMENTS_READ, category: "assessments", description: "View assessments" },
  { key: PERMISSIONS.ASSESSMENTS_CREATE, category: "assessments", description: "Create assessments" },
  { key: PERMISSIONS.ASSESSMENTS_UPDATE, category: "assessments", description: "Update assessments" },
  { key: PERMISSIONS.ASSESSMENTS_ARCHIVE, category: "assessments", description: "Archive assessments" },

  // Grades
  { key: PERMISSIONS.GRADES_READ, category: "grades", description: "View grades" },
  { key: PERMISSIONS.GRADES_ENTER, category: "grades", description: "Enter new marks" },
  { key: PERMISSIONS.GRADES_EDIT, category: "grades", description: "Edit marks in editable states" },
  { key: PERMISSIONS.GRADES_SUBMIT, category: "grades", description: "Submit assessment for review" },
  { key: PERMISSIONS.GRADES_REVIEW, category: "grades", description: "Start review of submitted assessment" },
  { key: PERMISSIONS.GRADES_RETURN, category: "grades", description: "Return assessment to teacher" },
  { key: PERMISSIONS.GRADES_APPROVE, category: "grades", description: "Approve reviewed assessment" },
  { key: PERMISSIONS.GRADES_REQUEST_CORRECTION, category: "grades", description: "Request correction of approved grades" },
  { key: PERMISSIONS.GRADES_AUTHORIZE_CORRECTION, category: "grades", description: "Authorize grade correction" },
  { key: PERMISSIONS.GRADES_CANCEL_CORRECTION, category: "grades", description: "Cancel/reject grade correction" },
  { key: PERMISSIONS.GRADES_LOCK, category: "grades", description: "Lock approved assessment" },
  { key: PERMISSIONS.GRADES_REQUEST_POST_LOCK_CORRECTION, category: "grades", description: "Request correction of locked assessment" },

  // Grade scales
  { key: PERMISSIONS.GRADE_SCALES_READ, category: "grade_scales", description: "View grade scales" },
  { key: PERMISSIONS.GRADE_SCALES_CREATE, category: "grade_scales", description: "Create grade scales" },
  { key: PERMISSIONS.GRADE_SCALES_UPDATE, category: "grade_scales", description: "Update grade scales" },
  { key: PERMISSIONS.GRADE_SCALES_ARCHIVE, category: "grade_scales", description: "Archive grade scales" },

  // Report cards
  { key: PERMISSIONS.REPORT_CARDS_READ, category: "report_cards", description: "View report cards" },
  { key: PERMISSIONS.REPORT_CARDS_GENERATE, category: "report_cards", description: "Generate report cards" },
  { key: PERMISSIONS.REPORT_CARDS_REVIEW, category: "report_cards", description: "Review generated report cards" },
  { key: PERMISSIONS.REPORT_CARDS_UPDATE, category: "report_cards", description: "Update report cards" },
  { key: PERMISSIONS.REPORT_CARDS_APPROVE, category: "report_cards", description: "Approve report cards" },
  { key: PERMISSIONS.REPORT_CARDS_PUBLISH, category: "report_cards", description: "Publish report cards" },
  { key: PERMISSIONS.REPORT_CARDS_DOWNLOAD, category: "report_cards", description: "Download official report card PDFs" },
  { key: PERMISSIONS.REPORT_CARDS_REGENERATE, category: "report_cards", description: "Regenerate report cards" },

  // Timetable
  { key: PERMISSIONS.TIMETABLE_READ, category: "timetable", description: "View timetable" },
  { key: PERMISSIONS.TIMETABLE_CREATE, category: "timetable", description: "Create timetable" },
  { key: PERMISSIONS.TIMETABLE_UPDATE, category: "timetable", description: "Update timetable" },
  { key: PERMISSIONS.TIMETABLE_PUBLISH, category: "timetable", description: "Publish timetable" },
  { key: PERMISSIONS.TIMETABLE_ARCHIVE, category: "timetable", description: "Archive timetable versions" },
  { key: PERMISSIONS.TIMETABLE_CONFLICTS_READ, category: "timetable", description: "View timetable conflicts" },
  { key: PERMISSIONS.TIMETABLE_CONFLICTS_RESOLVE, category: "timetable", description: "Resolve timetable conflicts" },

  // Fee structures
  { key: PERMISSIONS.FEE_STRUCTURES_READ, category: "fee_structures", description: "View fee structures" },
  { key: PERMISSIONS.FEE_STRUCTURES_CREATE, category: "fee_structures", description: "Create fee structures" },
  { key: PERMISSIONS.FEE_STRUCTURES_UPDATE, category: "fee_structures", description: "Update fee structures" },
  { key: PERMISSIONS.FEE_STRUCTURES_ARCHIVE, category: "fee_structures", description: "Archive fee structures" },

  // Invoices
  { key: PERMISSIONS.INVOICES_READ, category: "invoices", description: "View invoices" },
  { key: PERMISSIONS.INVOICES_CREATE, category: "invoices", description: "Create invoices" },
  { key: PERMISSIONS.INVOICES_UPDATE, category: "invoices", description: "Update invoices" },
  { key: PERMISSIONS.INVOICES_CANCEL, category: "invoices", description: "Cancel invoices" },

  // Payments
  { key: PERMISSIONS.PAYMENTS_READ, category: "payments", description: "View payments" },
  { key: PERMISSIONS.PAYMENTS_CREATE, category: "payments", description: "Record payments" },
  { key: PERMISSIONS.PAYMENTS_UPDATE, category: "payments", description: "Update payment records" },
  { key: PERMISSIONS.PAYMENTS_REFUND, category: "payments", description: "Refund payments" },

  // Receipts
  { key: PERMISSIONS.RECEIPTS_READ, category: "receipts", description: "View receipts" },
  { key: PERMISSIONS.RECEIPTS_CREATE, category: "receipts", description: "Issue receipts" },
  { key: PERMISSIONS.RECEIPTS_DOWNLOAD, category: "receipts", description: "Download receipt PDFs" },

  // Discounts
  { key: PERMISSIONS.DISCOUNTS_READ, category: "discounts", description: "View discounts" },
  { key: PERMISSIONS.DISCOUNTS_CREATE, category: "discounts", description: "Create discounts" },
  { key: PERMISSIONS.DISCOUNTS_APPROVE, category: "discounts", description: "Approve discounts" },
  { key: PERMISSIONS.DISCOUNTS_CANCEL, category: "discounts", description: "Cancel discounts" },

  // Scholarships
  { key: PERMISSIONS.SCHOLARSHIPS_READ, category: "scholarships", description: "View scholarships" },
  { key: PERMISSIONS.SCHOLARSHIPS_CREATE, category: "scholarships", description: "Create scholarships" },
  { key: PERMISSIONS.SCHOLARSHIPS_UPDATE, category: "scholarships", description: "Update scholarships" },
  { key: PERMISSIONS.SCHOLARSHIPS_ARCHIVE, category: "scholarships", description: "Archive scholarships" },

  // Financial reports
  { key: PERMISSIONS.FINANCIAL_REPORTS_READ, category: "financial_reports", description: "View financial reports" },
  { key: PERMISSIONS.FINANCIAL_REPORTS_EXPORT, category: "financial_reports", description: "Export financial reports" },

  // Announcements
  { key: PERMISSIONS.ANNOUNCEMENTS_READ, category: "announcements", description: "View announcements" },
  { key: PERMISSIONS.ANNOUNCEMENTS_CREATE, category: "announcements", description: "Create announcements" },
  { key: PERMISSIONS.ANNOUNCEMENTS_UPDATE, category: "announcements", description: "Update announcements" },
  { key: PERMISSIONS.ANNOUNCEMENTS_PUBLISH, category: "announcements", description: "Publish announcements" },
  { key: PERMISSIONS.ANNOUNCEMENTS_ARCHIVE, category: "announcements", description: "Archive announcements" },

  // Notifications
  { key: PERMISSIONS.NOTIFICATIONS_READ, category: "notifications", description: "View notifications" },
  { key: PERMISSIONS.NOTIFICATIONS_MANAGE, category: "notifications", description: "Send and manage notifications" },

  // Files
  { key: PERMISSIONS.FILES_READ, category: "files", description: "View files" },
  { key: PERMISSIONS.FILES_UPLOAD, category: "files", description: "Upload files" },
  { key: PERMISSIONS.FILES_UPDATE, category: "files", description: "Update file metadata" },
  { key: PERMISSIONS.FILES_DELETE, category: "files", description: "Delete files" },

  // Audit
  { key: PERMISSIONS.AUDIT_LOGS_READ, category: "audit_logs", description: "View audit logs" },
  { key: PERMISSIONS.AUDIT_LOGS_EXPORT, category: "audit_logs", description: "Export audit logs" },
];

// ------------------------------------------------------------
// Type guards
// ------------------------------------------------------------

const ALL_PERMISSION_VALUES = new Set<string>(Object.values(PERMISSIONS));
const ALL_ROLE_VALUES = new Set<string>(Object.values(ROLES));

export function isPermission(value: string): value is Permission {
  return ALL_PERMISSION_VALUES.has(value);
}

export function isRole(value: string): value is RoleKey {
  return ALL_ROLE_VALUES.has(value);
}