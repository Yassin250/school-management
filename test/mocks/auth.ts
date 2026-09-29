// Stub for @/auth. Tests bypass session resolution.

import { vi } from "vitest";

export const auth = vi.fn(async () => null);
export const signIn = vi.fn(async () => undefined);
export const signOut = vi.fn(async () => undefined);
export const handlers = {
  GET: vi.fn(),
  POST: vi.fn(),
};