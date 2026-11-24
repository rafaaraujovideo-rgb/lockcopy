import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouterState } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Btn, inputClass } from "@/components/ui-bits";
import { sendFeedback } from "@/lib/feedback.functions";

type Kind = "problem" | "idea" | "question";
const KINDS: { id: Kind; label: string; hint: string }[] = [
  { id: "problem", label: "Something broke", hint: "What did you expect, and what happened instead?" },
  { id: "idea", label: "Idea", hint: "What would make your week easier?" },
  { id: "question", label: "Question", hint: "Ask anything. You'll get a reply by email." },
];

export function FeedbackDialog({ open, onOpenChange, orgId }: { open: boolean; onOpenChange: (o: boolean) => void; orgId?: string }) {
  const send = useServerFn(sendFeedback);
  const page = useRouterState({ select: (r) => r.location.pathname });
  const [kind, setKind] = useState<Kind>("problem");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const close = (o: boolean) => {
    onOpenChange(o);
    if (!o) setTimeout(() => { setSent(false); setMessage(""); setError(""); }, 200);
  };

  const submit = async () => {
    if (message.trim().length < 3) return setError("Add a few words first.");
    setBusy(true); setError("");
    try {
      await send({ data: { kind, message, page, ...(orgId ? { orgId } : {}) } });
      setSent(true);
    } catch {
      setError("That didn't go through. Try again in a moment.");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        {sent ? (
          <div className="py-4 text-center">
            <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-seal/15 text-seal"><Check className="h-4 w-4" /></span>
            <p className="mt-3 text-sm font-medium">Thanks, got it.</p>
            <p className="mt-1 text-sm text-muted-foreground">I read every message myself. If it needs an answer, I'll reply to your email.</p>
            <Btn variant="outline" className="mt-4" onClick={() => close(false)}>Close</Btn>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Talk to the founder</DialogTitle>
              <DialogDescription>Bugs, ideas, questions. It goes straight to my inbox.</DialogDescription>
            </DialogHeader>
            <div className="flex gap-1 rounded-md border border-border bg-muted/50 p-1" role="radiogroup" aria-label="Type">
              {KINDS.map((k) => (
                <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}
                  className={"flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors " + (kind === k.id ? "bg-card text-foreground shadow-card" : "text-muted-foreground hover:text-foreground")}>
                  {k.label}
                </button>
              ))}
            </div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={4000}
              placeholder={KINDS.find((k) => k.id === kind)?.hint} className={inputClass + " resize-none"} aria-label="Message" />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground">Sent with your account email and current page.</span>
              <Btn onClick={submit} disabled={busy}>{busy ? "Sending…" : "Send"}</Btn>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
