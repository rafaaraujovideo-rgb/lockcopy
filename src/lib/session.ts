import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabase, hasSupabase } from "@/lib/supabase-browser";

/**
 * Agency session in the browser. Stays `ready: false` on the server and first
 * render, so SSR and hydration never differ.
 */
export function useSession() {
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: false, session: null });

  useEffect(() => {
    if (!hasSupabase) {
      setState({ ready: true, session: null });
      return;
    }
    const supabase = getSupabase();
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (alive) setState({ ready: true, session: data.session });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setState({ ready: true, session });
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signOut() {
  if (hasSupabase) await getSupabase().auth.signOut();
}
