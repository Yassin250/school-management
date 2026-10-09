# System Architecture

## Overview

This is a single-school Rwanda-focused modular monolith built with Next.js App Router, TypeScript, PostgreSQL, Prisma, NextAuth credentials authentication, Tailwind, Vitest, and Playwright.

## Repository structure

The implementation does **not** use `src/modules`. Domain services live under `src/lib/services/<domain>` and are called by thin server actions and route handlers in `src/app`.

```text
src/app/                    pages, server actions, API routes
src/components/             reusable UI and navigation
src/lib/auth/               database-backed current-user resolver
src/lib/permissions/        RBAC constants, can(), scope resolvers
src/lib/services/           domain services and workflows
src/lib/audit/              append-only audit helper
prisma/                     schema, migrations, and seeds
test/                       Vitest integration/unit suites and Playwright E2E
```

## Request and authorization flow

1. NextAuth authenticates credentials and stores only the user ID in the JWT/session.
2. `getCurrentUser()` loads active roles and permissions from the database.
3. Pages, server actions, API routes, and services use that resolved user.
4. `canForUser()` checks the permission and, where supplied, a resource scope resolver.
5. Sensitive service mutations write audit records in their transaction.

`session.user.role` is not an authorization source. Navigation is advisory only; backend permission and scope checks are authoritative.

## Operational roles

The active role model has seven roles: System Administrator, School Administrator, Principal, Accountant, Teacher, Parent, and Student. Registrar is retired; the RBAC seed safely moves existing Registrar assignments to School Administrator before deleting the legacy role.

Finance writes are owned by Accountant. School Administrator has finance visibility only. Principal owns academic review, approval, result publishing, and timetable publishing, while School Administrator owns timetable editing. Teachers are constrained to their assignments.

## Data and non-goals

Prisma defines identity/RBAC, academic, teaching, attendance, assessment, report-card, finance, communication, and audit models. Phase 1 makes no schema migration and intentionally does not introduce attendance sessions, report-card versions, or assignment submissions.
