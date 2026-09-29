# Grade Workflow State Machine

**Version:** 1.0
**Status:** Final Design Contract
**Applies to:** All assessments (Assignment, Quiz, Test, Mid-Term, Final Exam, Project, Practical)

---

## 1. Purpose

The grade workflow controls the lifecycle of an assessment from initial creation through final locking.

**Core principle:**

A teacher may enter and revise marks only before approval. Once approved, marks become academically authoritative. Any later change must go through a controlled correction workflow — never a silent edit.

---

## 2. States

| State | Meaning | Marks editable? |
|---|---|---|
| `DRAFT` | Teacher preparing assessment and entering marks | Yes |
| `SUBMITTED` | Teacher completed and submitted for review | No |
| `UNDER_REVIEW` | Authorized reviewer checking submission | No |
| `RETURNED` | Reviewer found a problem, sent back to teacher | Yes |
| `APPROVED` | Assessment and marks academically approved | No |
| `CORRECTION_PENDING` | Correction to approved marks formally requested | No until authorized |
| `LOCKED` | Permanently finalized for academic record | No |

**Important distinction:** `APPROVED` does not mean "nothing can ever change." It means the current marks are approved and cannot be directly edited. If a mistake is discovered, the correction workflow is used.

---

## 3. State Diagram

```text
DRAFT
  │ submit
  ▼
SUBMITTED
  │ review
  ▼
UNDER_REVIEW ────return───► RETURNED
  │                           │
  │ approve                   │ edit
  ▼                           ▼
APPROVED                    DRAFT
  │
  ├── lock ──► LOCKED
  │
  └── request_correction
        ▼
     CORRECTION_PENDING
        │
        ├── authorize_correction ──► DRAFT
        │
        └── cancel_correction ──► LOCKED
```

**Critical rule:** `APPROVED → DRAFT` must NEVER be allowed. The only path back to editing after approval is:
```text
APPROVED → CORRECTION_PENDING → DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED
```

This preserves the audit trail.

---

## 4. Transition: DRAFT → SUBMITTED

**Actor:** Teacher assigned to the assessment. Authorized admin may submit on behalf where policy permits.

**Permission:** `grades.submit`

**Preconditions:**
1. Assessment exists
2. Belongs to teacher or actor has delegated authority
3. Current state is DRAFT
4. Active academic context
5. Valid class
6. Either subject or module (as appropriate)
7. `maxScore > 0`
8. All expected students have a result
9. Each result valid: `score ∈ [0, maxScore]` OR `isAbsent = true`
10. No result with invalid score AND `isAbsent = false`
11. No duplicate student result (DB enforces via `@@unique([assessmentId, studentId])`)

**Effects:**
- `status = SUBMITTED`
- `submittedAt = now()`
- `updatedAt = now()`

**Audit:**
```text
action: SUBMIT
entity: Assessment
previous: { status: "DRAFT" }
new: { status: "SUBMITTED", submittedAt: "..." }
```

---

## 5. Transition: SUBMITTED → UNDER_REVIEW

**Actor:** Principal, School Admin, or authorized academic reviewer.

**Permission:** `grades.review`

**Preconditions:**
- Current state is SUBMITTED
- Actor has review permission
- Actor is not the submitting teacher (if school policy requires independent review)

**Effects:**
- `status = UNDER_REVIEW`
- `reviewedAt = now()`
- `reviewedById = actor.id`
- `updatedAt = now()`

**Audit:**
```text
action: REVIEW_START
previous: { status: "SUBMITTED" }
new: { status: "UNDER_REVIEW", reviewedAt: "..." }
```

---

## 6. Transition: UNDER_REVIEW → APPROVED

**Actor:** Authorized academic approver (Principal, School Admin).

**Permission:** `grades.approve`

**Preconditions:**
Reviewer verifies:
- Marks complete
- Marks within valid ranges
- Absent students correctly identified
- Correct class, subject/module, term
- Teacher assigned to class/subject/module
- Valid weight
- No unresolved correction
- No conflicting academic record

**Effects:**
- `status = APPROVED`
- `approvedAt = now()`
- `approvedById = actor.id`
- `updatedAt = now()`

**Audit:**
```text
action: APPROVE
previous: { status: "UNDER_REVIEW" }
new: { status: "APPROVED", approvedAt: "...", approvedById: "..." }
```

---

## 7. Transition: UNDER_REVIEW → RETURNED

**Actor:** Academic reviewer.

**Permission:** `grades.return`

**Preconditions:**
Specific reason required. Examples:
- Missing student results
- Incorrect score
- Incorrect absent status
- Wrong class/subject/module
- Incorrect weight
- Duplicate/misassigned student
- Suspicious data
- Supporting information required

**Effects:**
- `status = RETURNED`
- `returnedAt = now()`
- `returnedById = actor.id`
- `returnedReason = <reason>`
- `updatedAt = now()`

**Audit:** reason must be in audit record.

---

## 8. Transition: RETURNED → DRAFT

**Actor:** Original teacher or authorized academic staff.

**Permission:** `grades.edit`

**Meaning:** Teacher allowed to correct the assessment. Does NOT jump directly to SUBMITTED — returns to DRAFT so it's clear the teacher is actively editing.

**Effects:**
- `status = DRAFT`
- `updatedAt = now()`

**Audit:**
```text
action: REOPEN_AFTER_RETURN
previous: { status: "RETURNED" }
new: { status: "DRAFT" }
```

---

## 9. Transition: DRAFT → SUBMITTED after return

Same submission rules. The system re-validates the entire assessment. Audit shows:
```text
RETURNED → DRAFT → SUBMITTED
```
Not hidden inside an ordinary update.

---

## 10. Transition: APPROVED → CORRECTION_PENDING

**Actor:** Teacher or authorized academic administrator.

**Permission:** `grades.request_correction`

**Important:** Requester does NOT directly modify the approved mark. They request correction.

**Required information:**
- `assessmentId`
- `reason`
- `affectedStudentIds`
- `description`
- `requestedBy`
- `requestedAt`

**Effects:**
- `status = CORRECTION_PENDING`
- `updatedAt = now()`
- Approved values remain untouched

**Audit:**
```text
action: CORRECTION_REQUESTED
previous: { status: "APPROVED" }
new: { status: "CORRECTION_PENDING" }
metadata: { reason, affectedStudentIds }
```

**Database:** a `GradeCorrectionRequest` row is created with `status = PENDING`.

---

## 11. Transition: CORRECTION_PENDING → DRAFT

**Actor:** Authorized academic administrator.

**Permission:** `grades.authorize_correction`

**Meaning:** Correction authorized; assessment may be edited. Only after authorization can approved assessment become editable.

Original approved values remain recoverable through audit history.

**Effects:**
- `status = DRAFT`
- `GradeCorrectionRequest.status = AUTHORIZED`
- `authorizedAt = now()`
- `authorizedById = actor.id`

---

## 12. Transition: CORRECTION_PENDING → LOCKED

**Exceptional path.** The correction request was reviewed and rejected/cancelled. Previously approved values remain authoritative and are locked.

**Permission:** `grades.cancel_correction`

**Effects:**
- `status = LOCKED`
- `GradeCorrectionRequest.status = REJECTED`
- `rejectedAt = now()`
- `rejectedById = actor.id`
- `rejectionReason = <reason>`

Audit must explain why.

---

## 13. Transition: APPROVED → LOCKED

**Actor:** Authorized academic administrator.

**Permission:** `grades.lock`

**Typical triggers:**
- Report-card processing completed
- Term academic records closed
- Final verification completed
- Administrative locking

**Effects:**
- `status = LOCKED`
- `lockedAt = now()`
- `lockedById = actor.id`
- `updatedAt = now()`

After this, ordinary grade editing is impossible.

---

## 14. Transition: LOCKED → CORRECTION_PENDING

**Very restricted.**

**Actor:** Principal / School Admin / System Admin (only where technically necessary).

**Permission:** `grades.request_post_lock_correction`

**Mandatory reason required.**

Examples:
- Documented data-entry mistake
- Officially approved academic correction
- Administrative error
- Duplicated/misassigned result

**There is no `LOCKED → DRAFT`.**

The only route is:
```text
LOCKED → CORRECTION_PENDING → DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → LOCKED
```

---

## 15. Permission Mapping

| Transition | Permission |
|---|---|
| `DRAFT → SUBMITTED` | `grades.submit` |
| `SUBMITTED → UNDER_REVIEW` | `grades.review` |
| `UNDER_REVIEW → APPROVED` | `grades.approve` |
| `UNDER_REVIEW → RETURNED` | `grades.return` |
| `RETURNED → DRAFT` | `grades.edit` |
| `APPROVED → CORRECTION_PENDING` | `grades.request_correction` |
| `CORRECTION_PENDING → DRAFT` | `grades.authorize_correction` |
| `CORRECTION_PENDING → LOCKED` | `grades.cancel_correction` |
| `APPROVED → LOCKED` | `grades.lock` |
| `LOCKED → CORRECTION_PENDING` | `grades.request_post_lock_correction` |

---

## 16. Audit Requirements

Every workflow transition MUST create an `AuditLog`.

Minimum fields:
- `actorId`
- `action`
- `entity` (`Assessment` or `AssessmentResult`)
- `entityId`
- timestamp
- previous state
- new state
- reason

For mark changes:
```text
action: GRADE_RESULT_UPDATED
entity: AssessmentResult
entityId: <result id>
previous: { score, isAbsent, note }
new: { score, isAbsent, note }
reason: "..."
```

---

## 17. AssessmentResult Rules

Schema fields: `assessmentId`, `studentId`, `score`, `isAbsent`, `note`, `enteredById`, `enteredAt`, `updatedAt`.
Unique: `@@unique([assessmentId, studentId])`.

**Rules:**
- Normal student: `isAbsent = false`, `score ∈ [0, maxScore]`
- Absent student: `isAbsent = true`, `score = null`
- Reject contradictory: `isAbsent = true` AND `score = 75`

`AssessmentResult` has no workflow status.
`Assessment.status` controls the lifecycle of all its results.

---

## 18. Teacher Leaves the School

- Assessment in `DRAFT` → remains associated with original teacher; admin can reassign
- Assessment in `SUBMITTED` / `UNDER_REVIEW` → reviewer continues
- Assessment in `APPROVED` / `LOCKED` → unaffected
- Historical assessment ownership remains auditable

---

## 19. Term Ends

- Before term closes: normal workflow
- During closure: system checks for unresolved assessments (DRAFT, SUBMITTED, UNDER_REVIEW, RETURNED, CORRECTION_PENDING). Unresolved appear in academic closure report.
- After closure: normal teachers cannot modify. Exceptional correction requires `LOCKED → CORRECTION_PENDING` with elevated permission and mandatory reason.

---

## 20. Report Card Interaction

**A report card MUST NEVER be generated from unapproved grades.**

Before generating a report card, verify every required assessment contributing to the term result is `APPROVED` or `LOCKED`.

Reject if any required assessment is `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `RETURNED`, or `CORRECTION_PENDING`.

**Flow:**
```text
Assessments → enter marks → SUBMITTED → UNDER_REVIEW → APPROVED
→ all required approved? → YES
→ calculate term results → generate Report Card
→ review/approve → publish → LOCK assessments
```

**Critical correction rule:** If an approved/locked assessment is corrected after a report card has been generated, the affected report card MUST be marked for regeneration/review. It must not silently remain the official record.
```text
Approved assessment → Report Card GENERATED → Grade correction
→ CORRECTION_PENDING → Corrected assessment APPROVED
→ Existing report card becomes stale (ReportCard.needsRegeneration = true)
→ Regenerate → Approve → Publish revised report
```

---

## 21. Database Support

`Assessment` fields: `status`, `submittedAt`, `reviewedAt`, `reviewedById`, `approvedAt`, `approvedById`, `returnedAt`, `returnedById`, `returnedReason`, `lockedAt`, `lockedById`, plus context (`teacherId`, `termId`, `classId`, `subjectId`, `moduleId`, `maxScore`, `weight`).

`AssessmentResult`: `score`, `isAbsent`, `note`, `enteredById`, `enteredAt`, `updatedAt`, with `@@unique([assessmentId, studentId])`.

`GradeCorrectionRequest`: full correction workflow record.

**Not enforced by database:** state transition legality. That belongs in the grade domain/service layer.

**Central operation:**

```ts
transitionAssessment(assessmentId, targetState, actor, reason)
```

No arbitrary code should run `prisma.assessment.update({ data: { status: "APPROVED" } })`.

---

## 22. Transaction Requirement

Every state transition should occur inside a database transaction when changing multiple records or creating an audit record.

```text
BEGIN TRANSACTION
  1. Verify actor permission
  2. Load assessment
  3. Verify current state
  4. Validate transition
  5. Validate results
  6. Update assessment
  7. Write audit record
COMMIT
```
Any failure → ROLLBACK.

---

## 23. Invalid Transitions

Reject with conflict-style domain error:

```text
APPROVED → SUBMITTED       ✗
APPROVED → RETURNED        ✗
DRAFT → APPROVED           ✗
RETURNED → APPROVED        ✗
LOCKED → APPROVED          ✗
LOCKED → DRAFT             ✗
```

UI must never offer these. Server must reject them anyway.

---

## 24. Minimum Test Cases

### State initialization
- New assessment starts as DRAFT

### Submission
- Teacher can submit valid DRAFT
- Teacher cannot submit incomplete
- Teacher cannot submit outside scope
- SUBMITTED cannot be edited

### Review
- Authorized reviewer starts review
- Unauthorized user cannot start review
- Reviewer can approve valid
- Reviewer can return invalid
- RETURNED has return reason

### Correction
- RETURNED → DRAFT
- Teacher corrects returned results
- Corrected assessment resubmitted
- APPROVED cannot be directly edited
- APPROVED can enter CORRECTION_PENDING
- Unauthorized user cannot request correction
- Authorized user can authorize correction
- Corrected assessment passes review again

### Locking
- APPROVED can be locked
- LOCKED cannot normally be edited
- LOCKED cannot go directly to DRAFT
- Post-lock correction creates CORRECTION_PENDING

### Result integrity
- Duplicate student result rejected
- Score above maxScore rejected
- Negative score rejected
- Absent student handled correctly
- Invalid absent/score combination rejected

### Report cards
- Report card fails when assessment is DRAFT
- Fails when SUBMITTED
- Fails when UNDER_REVIEW
- Fails when RETURNED
- Fails when CORRECTION_PENDING
- Succeeds when APPROVED
- Succeeds when LOCKED
- Correction after report generation flags regeneration

### Concurrency
- Two reviewers cannot simultaneously approve
- Teacher cannot submit after another actor approved
- Two correction requests cannot overwrite
- Audit and state change succeed or fail together

---

## 25. Final Contract

```text
                  ┌──────────────┐
                  │    DRAFT     │
                  └──────┬───────┘
                         │ submit
                         ▼
                  ┌──────────────┐
                  │  SUBMITTED   │
                  └──────┬───────┘
                         │ review
                         ▼
                ┌──────────────────┐
                │   UNDER_REVIEW   │
                └───────┬────┬─────┘
                        │    │
                  approve    │ return
                        │    ▼
                        │  RETURNED
                        │    │
                        │    │ edit
                        │    ▼
                        │  DRAFT
                        │
                        ▼
                   APPROVED
                     │   │
          correction │   │ lock
                     ▼   ▼
          CORRECTION_PENDING
                │          │
       authorize│          │ cancel
                ▼          ▼
              DRAFT      LOCKED
                │
                ▼
            SUBMITTED
                │
                ▼
          UNDER_REVIEW
                │
                ▼
             APPROVED
                │
                ▼
              LOCKED
```

**Invariants:**
- No approval without review
- No report card from unapproved grades
- No direct editing of approved grades
- No direct editing of locked grades
- Every correction auditable
- Every transition permission-controlled
- Every mark change records previous and new values
- Teacher ownership does not disappear when teacher leaves
- Term closure does not silently destroy incomplete work
- Post-report-card correction triggers controlled regeneration
- Server enforces every rule; UI only reflects
- Assessment status is workflow authority for its results
