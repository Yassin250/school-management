export class UnauthorizedError extends Error {
  status = 401;
  constructor() { super("Not authenticated"); }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(public permission: string) {
    super(`Permission denied: ${permission}`);
  }
}

export class ConflictError extends Error {
  status = 409;
  constructor(message: string) { super(message); }
}