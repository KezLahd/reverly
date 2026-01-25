"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function AuthListener() {
  const router = useRouter();
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        if (session.user.email) {
          await supabase
            .from("signups")
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