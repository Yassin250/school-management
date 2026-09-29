// ============================================================
// Application Error Classes
// ============================================================
// Every domain error carries an HTTP status code and a stable
// machine-readable code. Server actions / route handlers catch
// these and convert them into safe responses.
// ============================================================

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED"
  | "INTERNAL";

// ------------------------------------------------------------
// Base class
// ------------------------------------------------------------

export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: ErrorCode;

  /**
   * Safe for the client. Never includes stack traces or SQL.
   */
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * JSON-safe shape for API responses.
   */
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

// ------------------------------------------------------------
// 401 — Not authenticated
// ------------------------------------------------------------

export class UnauthenticatedError extends AppError {
  readonly status = 401;
  readonly code = "UNAUTHENTICATED" as const;

  constructor(message = "You must be signed in to perform this action.") {
    super(message);
  }
}

// ------------------------------------------------------------
// 403 — Authenticated but not permitted
// ------------------------------------------------------------

export class ForbiddenError extends AppError {
  readonly status = 403;
  readonly code = "FORBIDDEN" as const;

  constructor(
    public readonly permission: string,
    message = "You do not have permission to perform this action.",
  ) {
    super(message, { permission });
  }
}

// ------------------------------------------------------------
// 404 — Resource does not exist
// ------------------------------------------------------------

export class NotFoundError extends AppError {
  readonly status = 404;
  readonly code = "NOT_FOUND" as const;

  constructor(
    public readonly resource: string,
    identifier?: string,
  ) {
    super(
      `${resource} not found${identifier ? `: ${identifier}` : ""}`,
      { resource, ...(identifier ? { identifier } : {}) },
    );
  }
}

// ------------------------------------------------------------
// 409 — Valid request, illegal state
// ------------------------------------------------------------

export class ConflictError extends AppError {
  readonly status = 409;
  readonly code = "CONFLICT" as const;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

// ------------------------------------------------------------
// 422 — Validation / business rule failure
// ------------------------------------------------------------

export class ValidationError extends AppError {
  readonly status = 422;
  readonly code = "VALIDATION_FAILED" as const;

  constructor(
    message = "The submitted data is invalid.",
    public readonly issues?: Array<{ path: string; message: string }>,
  ) {
    super(message, issues ? { issues } : undefined);
  }
}

// ------------------------------------------------------------
// 429 — Rate limited
// ------------------------------------------------------------

export class RateLimitedError extends AppError {
  readonly status = 429;
  readonly code = "RATE_LIMITED" as const;

  constructor(
    message = "Too many attempts. Please try again later.",
    public readonly retryAfterSeconds?: number,
  ) {
    super(message, retryAfterSeconds ? { retryAfterSeconds } : undefined);
  }
}

// ------------------------------------------------------------
// 500 — Unexpected error
// ------------------------------------------------------------

export class InternalError extends AppError {
  readonly status = 500;
  readonly code = "INTERNAL" as const;

  constructor(message = "An unexpected error occurred.") {
    super(message);
  }
}

// ------------------------------------------------------------
// Type guard
// ------------------------------------------------------------

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

// ------------------------------------------------------------
// Convert unknown errors into a safe API response
// ------------------------------------------------------------

export function toErrorResponse(error: unknown) {
  if (isAppError(error)) {
    return {
      status: error.status,
      body: error.toResponse(),
    };
  }

  // Unknown error — log separately, never leak details.
  console.error("[Unhandled error]", error);
  return {
    status: 500,
    body: {
      error: {
        code: "INTERNAL",
        message: "An unexpected error occurred.",
      },
    },
  };
}