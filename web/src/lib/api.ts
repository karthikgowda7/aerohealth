import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Success response: { data } */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/** Error response: { error: { code, message, details? } } */
export function fail(status: number, code: string, message: string, details?: unknown) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

/** 400 response built from a Zod error. */
export function badRequest(err: ZodError) {
  return fail(400, "VALIDATION_ERROR", "Invalid input", err.flatten());
}
