import { z } from "zod";

export type ActionSuccess<T = void> = T extends void
  ? { success: true; data?: undefined }
  : { success: true; data: T };

export type ActionFailure = { success: false; error: string };

export type ActionResult<T = void> = ActionSuccess<T> | ActionFailure;

export function actionSuccess(): ActionResult<void>;
export function actionSuccess<T>(data: T): ActionResult<T>;
export function actionSuccess<T>(data?: T): ActionResult<T | void> {
  if (data === undefined) {
    return { success: true } as ActionSuccess<void>;
  }
  return { success: true, data } as ActionSuccess<T>;
}

export function actionFailure(error: string): ActionFailure {
  return { success: false, error };
}

export function handleActionError(
  error: unknown,
  fallback: string
): ActionFailure {
  if (error instanceof z.ZodError) {
    return actionFailure(error.issues[0]?.message ?? "Invalid form data");
  }
  console.error(fallback, error);
  return actionFailure(fallback);
}
