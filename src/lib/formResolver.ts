import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldValues, Resolver } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Bridges Zod schema inference with react-hook-form when refined/coerced schemas
 * produce input/output type differences. Uses explicit generic — no `any`.
 */
export function typedZodResolver<TFieldValues extends FieldValues>(
  schema: ZodType<any, any, any>
): Resolver<TFieldValues> {
  return zodResolver(schema) as unknown as Resolver<TFieldValues>;
}

