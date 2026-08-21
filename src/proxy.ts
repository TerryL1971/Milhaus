// src/proxy.ts
// Runs the Supabase session refresh on every request (excluding static
// assets). This keeps auth cookies current for Server Components.
// (Named "proxy" per Next.js 16's renamed middleware convention.)

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
