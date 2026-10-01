"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export interface LoginInput {
  email: string;
  password: string;
  from?: string;
}

export interface LoginResult {
  error?: string;
}

export async function loginAction(
  input: LoginInput,
): Promise<LoginResult> {
  const { email, password, from } = input;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirectTo: from && from.startsWith("/") ? from : "/dashboard",
    });
  } catch (error) {
    // signIn with redirectTo throws a NEXT_REDIRECT - let it propagate
    if (
      error instanceof Error &&
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // signIn redirected - this line never runs on success
  return {};
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}