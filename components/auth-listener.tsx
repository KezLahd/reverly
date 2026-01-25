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
        // User signed in successfully, redirect to billing
        router.push("/billing");
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);
  return null;
}
