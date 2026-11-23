import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dpa")({
  head: () => ({
    meta: [
      { title: "Data processing agreement (DPA) — Lockcopy" },
      { name: "description", content: "How Lockcopy processes, on the agency's behalf, the personal data submitted by its clients." },
      { property: "og:title", content: "Data processing agreement (DPA) — Lockcopy" },
      { property: "og:description", content: "How Lockcopy processes, on the agency's behalf, the personal data submitted by its clients." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dpa,
});

const sections: [string, string[]][] = [
  [
    "Role of each party",
    [
      "The agency is the data controller for the personal data it collects through Lockcopy portals.",
      "Lockcopy is the processor: it processes that data only according to the agency's instructions and to provide the service.",
      "This agreement applies automatically to all active accounts, under Article 28 of the GDPR.",
    ],
  ],
  [
    "Subject and duration",
    [
      "Processing: hosting, organizing, transmitting and deleting texts and files submitted by the agency's clients.",
      "Duration: while the account is active; afterwards, data is deleted within the timeframes of the privacy policy.",
    ],
  ],
  [
    "Lockcopy's obligations",
    [
      "Process data only to provide the service, never for its own purposes.",
      "Maintain appropriate technical measures: encryption in transit, row-level access rules, revocable portal tokens and private storage.",
      "Ensure that people with access to the data are bound by confidentiality.",
      "Help the agency respond to data subject requests (access, rectification, erasure, portability).",
      "Notify the agency without undue delay in case of a personal data breach.",
    ],
  ],
  [
    "Sub-processors",
    [
      "Supabase (database and storage), Stripe (payments) and the transactional email provider.",
      "The agency is informed of any relevant change to this list and may object on legitimate grounds.",
    ],
  ],
  [
    "International transfers",
    [
      "Whenever data is transferred outside the EEA, an appropriate safeguard is ensured (standard contractual clauses or an adequacy decision).",
    ],
  ],
  [
    "Audit and deletion",
    [
      "Lockcopy provides the information reasonably necessary to demonstrate compliance with this agreement.",
      "At the end of the relationship, data is deleted or returned to the agency, at its choice, unless a legal retention obligation applies.",
    ],
  ],
];

function Dpa() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Legal document</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Data processing agreement</h1>
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
        See also: <Link to="/privacy" className="underline hover:text-foreground">Privacy policy</Link> · <Link to="/terms" className="underline hover:text-foreground">Terms of service</Link>
      </p>
    </div>
  );
}
