"use client";

import { useAuthContext } from "@/app/contexts/AuthContext";

export function useUser() {
  return useAuthContext();
}
