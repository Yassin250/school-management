# RBAC Permission Matrix

**Version:** 1.1
**Status:** Final Design Contract
**Scope:** V1 — Single-school Education Management System
**Roles:** 8
**Authorization model:** Role-Based Access Control with explicit permissions and resource scoping

---

## 1. Purpose

This document defines the complete authorization model for the Education Management System.

It establishes:

1. All application permissions.
2. The permissions assigned to each of the eight roles.
3. Resource and ownership scoping rules.
4. Server-side authorization requirements.
5. The `can()` authorization pattern.
6. Permission seed data.
7. Authorization test requirements.

The system MUST use **roles + permissions**, not scattered role checks.

Incorrect:

```ts
if (user.role === "admin") {
  // allow operation
}