import { useQuery } from "@tanstack/react-query";

import { getWorkspace } from "@/lib/api.functions";
import { useSession } from "@/lib/session";

export const workspaceKey = ["workspace"] as const;

/** Agency account (organization, plan and limits). Runs only in the browser with a session. */
export function useWorkspace() {
  const { ready, session } = useSession();
  return useQuery({
    queryKey: [...workspaceKey, session?.user.id ?? "anon"],
    queryFn: () => getWorkspace(),
    enabled: ready && !!session,
  });
}
