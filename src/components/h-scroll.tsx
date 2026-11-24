import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps a block that can be wider than the screen (comparison tables, client
 * page tabs) and softens the edge that is cut off, so it reads as "there is
 * more to the side" instead of a hard clip. Fades only appear while there is
 * content in that direction.
 */
export function HScroll({ children, className, hint, fade = "from-background", left = true }: { children: ReactNode; className?: string; hint?: string; fade?: string; left?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState({ start: true, end: true });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setAt({
      start: el.scrollLeft < 2,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    });
    check();
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      el.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [children]);

  const edge = "pointer-events-none absolute inset-y-0 w-8 bg-gradient-to-l to-transparent transition-opacity duration-300";

  return (
    <div>
      <div className="relative">
        <div ref={ref} className={cn("overflow-x-auto", className)}>
          {children}
        </div>
        <div aria-hidden className={cn(edge, fade, "right-0 rounded-r-lg", at.end ? "opacity-0" : "opacity-100")} />
        {left && <div aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-0 w-8 rounded-l-lg bg-gradient-to-r to-transparent transition-opacity duration-300", fade, at.start ? "opacity-0" : "opacity-100")} />}
      </div>
      {hint && <p className="mt-3 font-mono text-[11px] text-muted-foreground sm:hidden">{hint}</p>}
    </div>
  );
}
