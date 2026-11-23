import { cn } from "@/lib/utils";

/** Lockcopy mark: an L that closes into a lock, with the sage approval dot. */
export function LogoMark({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M10 7v18h12" fill="none" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
      <path d="M15 15v-2.5a3.5 3.5 0 0 1 7 0V15" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-primary-foreground" />
      <circle cx="18.5" cy="19.5" r="2" className="fill-seal" />
    </svg>
  );
}

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("flex items-center gap-2 font-bold tracking-[-0.03em]", className)}>
      <LogoMark className={markClassName} />
      Lockcopy
    </span>
  );
}
