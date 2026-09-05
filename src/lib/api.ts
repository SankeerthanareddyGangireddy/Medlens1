import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    if (error.name === "UNAUTHORIZED" || error.message === "UNAUTHORIZED") {
      return jsonError("Please sign in to continue.", 401);
    }
    if (error.name === "FORBIDDEN" || error.message === "FORBIDDEN") {
      return jsonError("You do not have access to this record.", 403);
    }
  }
  return jsonError("Something went wrong. Please try again.", 500);
}
