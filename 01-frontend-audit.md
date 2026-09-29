# Phase 1 — Deep Frontend Audit

## Findings Table

| ID | Severity | Type | Area | Location | Description | Fix | Effort |
|---|---|---|---|---|---|---|---|
| FE-001 | P0 — Critical | [RISK] | Authorisation | `src/component/Menu.tsx:107` | Role-based visibility uses `visible` array checked only on UI — clicking hidden routes directly bypasses access control. Hiding a button ≠ access control. | Add server-side middleware/route guards that verify role before rendering protected pages. Never trust client-side visibility alone. | M |
| FE-002 | P1 — High | [BUG] | Forms | `src/component/forms/StudentForm.tsx:163-184` | Password fields only rendered in `create` mode; update mode shows no password fields but also no validation if password should be changed. | Conditionally render password fields based on mode and add schema validation for update scenarios. | M |
| FE-003 | P2 — Medium | [STANDARD] | Accessibility | `src/component/ThemeToggle.tsx:15-19` | Invisible focus state when theme is not yet mounted — focus is lost visually. Add `:focus-visible` styles when mounted. | Add mounted check and focus styles. | S |
| FE-004 | P1 — High | [RISK] | Security | `src/app/page.tsx:14` | Role validation uses `VALID_ROLES` constant but any unauthenticated user is redirected to `/login` — no distinct handling for forbidden (403) vs unauthenticated (401). | Distinguish between auth and authZ errors; return 403 for valid user with wrong role. | M |
| FE-005 | P3 — Low | [UX] | Responsiveness | `src/component/InputField.tsx:25` | `hidden` prop causes `w-full md:w-[calc(50%-0.5rem)]` to still affect layout via `hidden` CSS class — touch devices may trigger unexpected behavior. | Use `hidden` Tailwind class with `transform: translateX(-9999px)` or separate component variants. | S |
| FE-006 | P2 — Medium | [RISK] | Forms | `src/component/InputField.tsx:32-34` | Error state adds `border-red-300` but no `aria-invalid="true"` attribute — screen readers not notified of errors. | Add `aria-invalid` and `aria-describedby` to input when error exists. | S |
| FE-007 | P2 — Medium | [UX] | Performance | `src/app/dashboard/loading.tsx` | Loading skeleton uses `animate-pulse` which may be problematic for `prefers-reduced-motion` users. | Add `@media (prefers-reduced-motion: reduce) { ... }` to disable animation. | S |
| FE-008 | P1 — High | [SECURITY] | XSS | `src/component/Announcements.tsx` — user-controlled content rendered without sanitisation. | Sanitise all user-generated content before rendering. Use `sanitize-html` or escape HTML. | M |
| FE-009 | P3 — Low | [UX] | Design consistency | Multiple button variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) — six variants when three would cover all use cases. | Consolidate to: primary, destructive, outline. Remove secondary/ghost/link or merge. | S |
| FE-010 | P2 — Medium | [DATA] | State fetching | `src/app/dashboard/teacher/page.tsx:33-38` — Term fetch, day enum, and teacher data fetched sequentially without caching — potential waterfall on initial load. | Use `await Promise.all` where independent, or memoise term data. | M |

### The 10 Most Important Findings (with corrected code snippets)

#### FE-001: Client-side only authorisation is not access control (P0 — Critical)

**Evidence**: `src/component/Menu.tsx:107` — `if (!item.visible.includes(role)) return null;` hides menu items based on role, but any URL can be manually navigated to.

**Problem**: The menu hides admin links from teachers/parents/students, but there's no server-side guard. A user can manually visit `/dashboard/admin/list/teachers` and the page will load (or fail with an unhelpful error). **Hiding a button is not access control.**

**Fix**: Add a route middleware or server component that checks `session.user.role` before rendering protected pages. The menu `visible` prop should only affect UI display, not security.

**Corrected code concept** — route guard at the layout level:

```tsx
// src/app/dashboard/admin/list/teachers/page.tsx — add at top
import { auth } from "@/auth";

export async function dynamicServerPage({ searchParams }: { searchParams: Promise<any> }) {
  const session = await auth();
  if (!session?.user?.role || session.user.role !== "admin") {
    return <div role="alert">Access denied. Admins only.</div>;
  }
  // ... rest of page
}
```

**Effort**: M (multi-day — requires route-wide authZ middleware)

---

#### FE-008: XSS — user content rendered without sanitisation (P1 — High)

**Evidence**: `src/component/Announcements.tsx` — announces user-generated content rendered directly.

**Problem**: If an announcer enters `<script>alert('hack')</script>` as the title/description, it executes in any user's browser who views the announcement. No sanitisation is applied anywhere in the announcements flow.

**Fix**: Sanitise all HTML-bearing fields on the backend (Prisma/DB level) and/or on the frontend before rendering.

**Corrected code** — add sanitisation in the Announcements component:

```tsx
// src/component/Announcements.tsx — add at top
import DOMPurify from "dompurify";

// In the rendering section:
< h4 className="text-sm font-medium text-gray-900">{DOMPurify.sanitize(announcement.title)}</h4>
< p className="text-sm text-gray-500">{DOMPurify.sanitize(announcement.description)}</p>
```

**Effort**: S (15 min fix) — but must also validate on backend.

---

#### FE-004: Role validation distinction missing (P1 — High)

**Evidence**: `src/app/page.tsx:14` — `if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) { redirect("/login"); }`

**Problem**: If a user somehow gets a token with a role like "superadmin" that isn't in the VALID_ROLES list, they're redirected to login as if they're unauthenticated. But if a user has role "student" and tries to access admin routes, the page may render partially before redirecting or show an error. There's no 403 Forbidden handling.

**Fix**: Distinguish between "not logged in" (401) and "logged in but wrong role" (403).

**Corrected code**:

```tsx
// src/app/page.tsx — improved role check
const session = await auth();

if (!session?.user) {
  redirect("/login"); // 401 - not authenticated
}

// Later, on protected pages:
if (session.user.role !== "admin") {
  // Return 403 page instead of redirecting
  return <div role="alert" className="p-6 text-center">Access denied. Admins only.</div>;
}
```

**Effort**: S (5 min fix)

---

#### FE-002: Password fields only in create mode (P1 — High)

**Evidence**: `src/component/forms/StudentForm.tsx:163-184` — password fields wrapped in `{mode === "create" && (<>...</>)}`

**Problem**: When updating a student (`mode="update"`), the form shows no password fields. But the `studentUpdateSchema` in `formValidation.ts` does NOT include password fields at all. If someone later adds password change functionality without realising the form doesn't render them, the UI will be inconsistent.

**Fix**: Either always show password fields (optional) with validation that only applies when filled, or have separate "change password" flow.

**Corrected code** — always render, but make optional:

```tsx
// In StudentForm.tsx — change the password section
{/* Always render, but optional */}
<div className="flex flex-col gap-2">
  <InputField
    label="Password (leave blank to keep current)"
    name="password"
    type="password"
    register={register}
    error={"password" in errors ? errors.password : undefined}
    placeholder="Minimum 6 characters (optional)"
  />
  <InputField
    label="Confirm Password"
    name="confirmPassword"
    type="password"
    register={register}
    error={
      "confirmPassword" in errors ? errors.confirmPassword : undefined
    }
    placeholder="Repeat password (optional)"
  />
</div>
```

**Schema update** — make password optional in update schema:

```ts
// In formValidation.ts — studentUpdateSchema
export const studentUpdateSchema = studentBaseSchema.extend({
  id: z.string().optional(),
});

// Password refinement only applies when both fields are provided
```

**Effort**: S (20 min)

---

#### FE-006: Missing aria-invalid on error (P2 — Medium)

**Evidence**: `src/component/InputField.tsx:32-34` — error state styles input but no accessibility attribute.

**Problem**: Screen readers won't announce validation errors. A sighted user sees the red border, but a blind user has no feedback.

**Fix**: Add `aria-invalid` and `aria-describedby` pointing to the error message.

**Corrected code**:

```tsx
// src/component/InputField.tsx
<input
  type={type}
  aria-invalid={!!error}
  aria-describedby={error ? "error-message" : undefined}
  className={`h-10 px-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    error ? "border-red-300" : "border-gray-200"
  }`}
  ref={ref}
  {...props}
/>
{error && (
  <p id="error-message" className="text-xs text-red-500">{error.message}</p>
)}
```

**Effort**: S (2 min)

---

#### FE-007: prefers-reduced-motion not respected (P2 — Medium)

**Evidence**: `src/app/dashboard/loading.tsx:3` — `animate-pulse` class used without media query.

**Problem**: Users with `prefers-reduced-motion` set in their OS will see pulsing animations which can cause vestibular issues.

**Fix**: Add reduced-motion media query.

**Corrected code**:

```tsx
// src/app/dashboard/loading.tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="glass-card h-24 p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="space-y-2 flex-1">
          <div className="h-6 w-16 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  ))}
</div>

// Add CSS or inline style
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none !important;
  }
}
```

**Effort**: S (5 min)

---

#### FE-003: Invisible focus in ThemeToggle (P2 — Medium)

**Evidence**: `src/component/ThemeToggle.tsx:15-19` — button rendered before mounted with no focus styles.

**Problem**: When the theme toggle first mounts (before `useEffect` sets `mounted=true`), the button has `border-border/60 bg-card/50` but no `:focus-visible` outline. Keyboard users can't see focus.

**Fix**: Conditionally apply focus styles only when mounted, or always apply reduced-focus styles.

**Corrected code**:

```tsx
// src/component/ThemeToggle.tsx
{!mounted ? (
  <button
    type="button"
    className="p-2 rounded-lg border border-border/60 bg-card/50"
    aria-label="Toggle theme"
    // No focus style when not mounted — intentionally invisible until loaded
  />
) : (
  <button
    type="button"
    onClick={() => setTheme(isDark ? "light" : "dark")}
    className="p-2 rounded-lg border border-border/60 bg-card/50 hover:bg-accent transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2"
    aria-label="Toggle theme"
  >
    ...
  </button>
)}
```

**Effort**: S (5 min)

---

#### FE-005: Hidden input layout shift (P3 — Low)

**Evidence**: `src/component/InputField.tsx:25` — `hidden` prop with `w-full md:w-[calc(50%-0.5rem)]`.

**Problem**: The `hidden` CSS class sets `display: none`, but the `w-full md:w-[calc(50%-0.5rem)]` classes still compute, potentially causing layout shifts or the element taking up space differently across breakpoints.

**Fix**: Use `hidden` utility correctly or restructure the conditional layout.

**Corrected code**:

```tsx
// src/component/InputField.tsx
<div className={`flex flex-col gap-1 ${hidden ? "hidden" : `w-full md:w-[calc(50%-0.5rem)]`}`}>
```

Simpler: just conditionally apply the width class.

**Effort**: S (5 min)

---

#### FE-009: Button variant consolidation (P3 — Low)

**Evidence**: `src/component/ui/button.tsx:5` — six variants: `default | destructive | outline | secondary | ghost | link`.

**Problem**: Six button variants is excessive. In practice, most apps use 3: primary (default), destructive, and outline. The `secondary`, `ghost`, and `link` variants are rarely all needed and create inconsistency.

**Fix**: Consolidate to three core variants. Remove or merge the others.

**Corrected code** — simplified variants:

```tsx
// src/component/ui/button.tsx
const variants = {
  default: "bg-gray-900 text-gray-50 hover:bg-gray-900/90",
  destructive: "bg-red-500 text-gray-50 hover:bg-red-500/90",
  outline: "border border-gray-200 bg-white hover:bg-gray-100 hover:text-gray-900",
};

// Remove: secondary, ghost, link — or keep link as separate component
```

**Effort**: S (10 min)

---

## Summary of Frontend Audit

**Critical (P0/P1)**: 
- Client-side only authorisation is not real access control (FE-001)
- XSS risk in announcements (FE-008) 
- No 403 vs 401 distinction (FE-004)
- Password form inconsistency (FE-002)

**Medium (P2)**:
- Missing aria-invalid on form errors (FE-006)
- prefers-reduced-motion not respected (FE-007)
- Focus visibility in ThemeToggle (FE-003)
- Input field hidden layout (FE-005)

**Low (P3)**:
- Six button variants when three suffice (FE-009)

**Effort estimate**: ~3-4 days to fix all P1/P2 issues, +1 day for P0 authorisation middleware.

**Strengths**: Good Zod validation, attractive Tailwind design, accessible focus styles on most components, responsive grid layouts, soft-delete pattern already in place.