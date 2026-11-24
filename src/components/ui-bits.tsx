import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground shadow-btn hover:bg-ink-soft",
        variant === "outline" && "border border-border bg-card shadow-card hover:bg-muted",
        variant === "ghost" && "hover:bg-muted",
        className,
      )}
    />
  );
}

export const btnClass = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-btn hover:bg-ink-soft";
export const inputClass = "w-full rounded-md border border-input bg-card px-3 py-2 text-base outline-none transition-shadow focus:border-ring focus:ring-4 focus:ring-ring/15 sm:text-sm";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-border bg-card p-5 shadow-card [box-shadow:inset_0_1px_0_oklch(1_0_0/70%),var(--shadow-card)]", className)}>{children}</div>;
}

const tones: Record<string, string> = {
  empty: "bg-muted text-muted-foreground",
  sent: "bg-warn text-warn-foreground",
  approved: "bg-accent text-accent-foreground",
  adjust: "bg-destructive/15 text-destructive",
  active: "bg-accent text-accent-foreground",
  revoked: "bg-destructive/15 text-destructive",
  expired: "bg-muted text-muted-foreground",
};
const LABELS: Record<string, string> = {
  empty: "Empty",
  sent: "Sent",
  approved: "Approved",
  adjust: "Change requested",
  active: "Active",
  revoked: "Switched off",
  expired: "Expired",
};
export function Badge({ s }: { s: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium before:h-1.5 before:w-1.5 before:rounded-full before:bg-current before:opacity-70", tones[s] ?? tones["empty"])}>{LABELS[s] ?? s}</span>;
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export const DemoNote = () => (
  <p className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
    Demo mode: data stays in this window only and disappears on reload. Not connected to Supabase or Stripe yet.
  </p>
);
