// Stub for next-auth. Tests don't exercise auth flows.

import { vi } from "vitest";

export const auth = vi.fn(async () => null);
export const signIn = vi.fn(async () => undefined);
export const signOut = vi.fn(async () => undefined);
export const handlers = {
  GET: vi.fn(),
  POST: vi.fn(),
};

const NextAuth = vi.fn(() => ({ auth, signIn, signOut, handlers }));
export default NextAuth;

export type DefaultSession = {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};