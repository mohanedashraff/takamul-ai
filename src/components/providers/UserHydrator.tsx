"use client";

// Hydrates the user store whenever a session exists.
// Mount once at the dashboard layout root.

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/useUserStore";

export function UserHydrator() {
  const { status } = useSession();
  const fetchUser = useUserStore((s) => s.fetchUser);
  const clear     = useUserStore((s) => s.clear);

  useEffect(() => {
    if (status === "authenticated") fetchUser();
    else if (status === "unauthenticated") clear();
  }, [status, fetchUser, clear]);

  return null;
}
