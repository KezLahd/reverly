"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

export function AuthListener() {
  const router = useRouter();
  useEffect(() => {
    const supabase = getSupabase();
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        if (session.user.email) {
          await supabase
            .from("reverly_signups")
            .update({ has_confirmed_email: true })
            .eq("email", session.user.email);
        }
        router.push("/billing");
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);
  return null;
}
