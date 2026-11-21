import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Btn({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "outline" }) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "outline" && "border border-border bg-card hover:bg-muted",
        variant === "ghost" && "hover:bg-muted",
        className,
      )}
    />
  );
}

export const btnClass = "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90";
export const inputClass = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-card p-5 shadow-card", className)}>{children}</div>;
}

const tones: Record<string, string> = {
  vazio: "bg-muted text-muted-foreground",
  enviado: "bg-warn text-warn-foreground",
  aprovado: "bg-accent text-accent-foreground",
  ajuste: "bg-destructive/15 text-destructive",
  ativo: "bg-accent text-accent-foreground",
  revogado: "bg-destructive/15 text-destructive",
  expirado: "bg-muted text-muted-foreground",
};
export function Badge({ s }: { s: string }) {
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", tones[s] ?? tones["vazio"])}>{s}</span>;
}

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export const DemoNote = () => (
  <p className="rounded-md border border-dashed border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
    Modo demonstração: os dados ficam só nesta janela e desaparecem ao recarregar. Ainda não há ligação ao Supabase nem ao Stripe.
  </p>
);
