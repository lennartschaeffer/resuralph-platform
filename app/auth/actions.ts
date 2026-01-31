"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithDiscord(formData: FormData) {
  const next = formData.get("next") as string | null;
  const supabase = await createClient();

  const callbackUrl = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL!);
  if (next) {
    callbackUrl.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo: callbackUrl.toString(),
      scopes: "identify email",
    },
  });

  if (error) {
    redirect("/auth/error");
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
