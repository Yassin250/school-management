import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in - School Management System",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-neutral-900">
            School Management System
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in to your account
          </p>
        </div>

        <Suspense fallback={<div className="h-40" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}