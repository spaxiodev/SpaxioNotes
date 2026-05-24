import { NextResponse } from "next/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { headers: NO_STORE_HEADERS, status });
}

export function jsonOk<T>(body: T, status = 200) {
  return NextResponse.json(body, { headers: NO_STORE_HEADERS, status });
}
