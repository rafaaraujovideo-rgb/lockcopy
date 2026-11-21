import { useQuery } from "@tanstack/react-query";

import { getWorkspace } from "@/lib/api.functions";
import { useSession } from "@/lib/session";

export const workspaceKey = ["workspace"] as const;

/** Conta da agência (organização, plano e limites). Só corre no browser com sessão. */
export function useWorkspace() {
  const { ready, session } = useSession();
  return useQuery({
    queryKey: [...workspaceKey, session?.user.id ?? "anon"],
    queryFn: () => getWorkspace(),
    enabled: ready && !!session,
  });
}
