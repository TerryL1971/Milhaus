// src/app/auth/sign-out/route.ts
// POST-only sign-out, invoked from a plain <form> in SiteHeader (no client
// JS needed for the common case).

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${requestOrigin(request)}/`);
}
