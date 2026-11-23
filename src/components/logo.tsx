import { cn } from "@/lib/utils";

/** Lockcopy mark: a lock whose body is a page of copy, with an approved (sage) line. */
export function LogoMark({ className }: { className?: string | undefined }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("h-7 w-7 shrink-0", className)}>
      <rect width="32" height="32" rx="7.5" className="fill-primary" />
      <path d="M11 14.5V11.5a5 5 0 0 1 10 0v3" fill="none" strokeWidth="2.4" strokeLinecap="round" className="stroke-primary-foreground" />
      <rect x="7.5" y="14.5" width="17" height="11" rx="2.5" className="fill-primary-foreground" />
      <rect x="10.5" y="18" width="7.5" height="1.8" rx=".9" className="fill-primary" />
      <rect x="10.5" y="21.2" width="5" height="1.8" rx=".9" className="fill-primary" opacity=".45" />
      <circle cx="20.6" cy="21.2" r="1.9" className="fill-seal" />
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
