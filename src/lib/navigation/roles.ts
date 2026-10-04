// ============================================================
// Role Display Names
// ============================================================
// Maps internal role keys to user-facing labels.
// ============================================================

export const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN: "System Administrator",
  SCHOOL_ADMIN: "School Administrator",
  PRINCIPAL: "Principal",
  TEACHER: "Teacher",
  ACCOUNTANT: "Accountant",
  REGISTRAR: "Registrar",
  PARENT: "Parent",
  STUDENT: "Student",
};

export function getRoleLabel(roleKey: string): string {
  return ROLE_LABELS[roleKey] ?? roleKey;
}