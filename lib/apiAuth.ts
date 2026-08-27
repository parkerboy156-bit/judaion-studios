import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Verifies the caller's Supabase session from the Authorization header.
// The anon key is enough — `getUser(token)` validates the JWT against the
// project; no service-role key is involved, so nothing privileged ships here.
export async function requireUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}
