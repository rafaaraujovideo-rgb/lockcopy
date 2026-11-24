import { useEffect, useRef, useState } from "react";
import type React from "react";

/** Fades and lifts its content into view once, when it scrolls into the viewport. */
export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: "0px 0px -10% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} data-shown={shown} style={{ transitionDelay: `${delay}ms` }} className={"reveal " + className}>{children}</div>;
}

/** Reminder timeline shown on the landing page; mirrors REMINDER_OFFSETS (3 days before, due day, 2 days after). */
export function ReminderTimeline() {
  const steps = [
    { d: "Mar 11", t: "Due in 3 days", s: "Sent" },
    { d: "Mar 14", t: "Due today", s: "Sent" },
    { d: "Mar 16", t: "Still waiting · 2 days late", s: "Scheduled" },
  ];
  return (
    <ol className="space-y-1.5 font-mono text-[11px]">
      {steps.map((x) => (
        <li key={x.d} className="flex items-center gap-3 rounded-md border border-border bg-background px-2.5 py-1.5">
          <span className="w-12 text-muted-foreground">{x.d}</span>
          <span className="flex-1">{x.t}</span>
          <span className={x.s === "Sent" ? "text-seal" : "text-muted-foreground"}>{x.s === "Sent" ? "● Sent" : "○ Scheduled"}</span>
        </li>
      ))}
    </ol>
  );
}
