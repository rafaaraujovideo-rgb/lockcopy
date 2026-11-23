import { SiteShell } from "@/components/site-chrome";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Lockcopy" },
      { name: "description", content: "How Lockcopy collects, uses and protects the data of agencies and their clients." },
      { property: "og:title", content: "Privacy policy — Lockcopy" },
      { property: "og:description", content: "How Lockcopy collects, uses and protects the data of agencies and their clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

const sections: [string, string[]][] = [
  [
    "Who is responsible for the data",
    [
      "Lockcopy is the data controller for the agency account data (name, email, billing details).",
      "For the content clients submit through the portals, the agency is the data controller and Lockcopy acts as a processor, under the data processing agreement (DPA).",
    ],
  ],
  [
    "What data we collect",
    [
      "Account: agency name, email and password (stored only as a hash by the authentication provider).",
      "Billing: handled by Stripe; Lockcopy never sees or stores card numbers.",
      "Request content: texts and files clients submit, plus the client's email for reminders.",
      "Technical data: access and error logs, used only to operate and protect the service.",
    ],
  ],
  [
    "What we use the data for",
    [
      "Providing the service: creating requests, showing portals, storing answers and files, exporting content.",
      "Sending operational emails: account confirmation, delivery reminders and approval notices.",
      "Charging the subscription and meeting tax obligations.",
      "We do not sell data, show advertising or use client content to train models.",
    ],
  ],
  [
    "Where the data lives and for how long",
    [
      "Data lives in a PostgreSQL database (Supabase) and files in private storage accessed through short-lived signed URLs.",
      "Client portals have an expiry date and can be switched off by the agency at any time.",
      "When a request is archived or the account is closed, content is deleted within a maximum of 90 days, unless a legal obligation requires otherwise.",
    ],
  ],
  [
    "People's rights",
    [
      "Anyone can request access, rectification, erasure, portability or object to the processing of their data.",
      "For content sent to an agency, the request must be made to the agency; Lockcopy helps the agency fulfil it.",
      "For Lockcopy account data, write to privacy@lockcopy.com.",
      "You also have the right to complain to your data protection authority.",
    ],
  ],
  [
    "Security",
    [
      "Encrypted connections (TLS), row-level access rules in the database (RLS), random and revocable portal tokens, and private file storage.",
      "Administrative access is limited to what is strictly necessary to operate the service.",
    ],
  ],
];

function Privacidade() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Legal document</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: 21 November 2026</p>
      <div className="mt-10 space-y-10">
        {sections.map(([title, paras]) => (
          <section key={title}>
            <h2 className="font-display text-xl font-semibold">{title}</h2>
            {paras.map((p) => <p key={p.slice(0, 40)} className="mt-3 text-sm leading-relaxed text-muted-foreground">{p}</p>)}
          </section>
        ))}
      </div>
      <p className="mt-12 text-sm text-muted-foreground">
        See also: <Link to="/terms" className="underline hover:text-foreground">Terms of service</Link> · <Link to="/dpa" className="underline hover:text-foreground">Data processing agreement</Link>
      </p>
    </div>
    </SiteShell>
  );
}
