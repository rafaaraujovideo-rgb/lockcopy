import { SiteShell } from "@/components/site-chrome";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of service — Lockcopy" },
      { name: "description", content: "The rules for using Lockcopy: 14-day trial, billing, responsibilities and cancellation." },
      { property: "og:title", content: "Terms of service — Lockcopy" },
      { property: "og:description", content: "The rules for using Lockcopy: 14-day trial, billing, responsibilities and cancellation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://lockcopy.com/terms" }],
  }),
  component: Termos,
});

const sections: [string, string[]][] = [
  [
    "The service",
    [
      "Lockcopy is a tool for agencies and freelancers to collect texts and files from their clients through portals with a deadline, review and approve each piece of content, and export the result.",
      "By creating an account, the agency confirms it is authorized to request and process its clients' content.",
    ],
  ],
  [
    "Trial and billing",
    [
      "The 14-day trial starts without a payment method. Nothing is charged during the trial.",
      "If you add a card and do not cancel before the trial ends, the chosen subscription (monthly or yearly) is charged automatically. Without a card, the trial simply ends.",
      "You can cancel at any time in the billing portal; access remains until the end of the period already paid.",
      "Displayed prices do not include taxes, which are added according to applicable law.",
    ],
  ],
  [
    "Agency responsibilities",
    [
      "Keep your account and portal links confidential.",
      "Do not use the service to collect illegal, offensive content or content you have no right to use.",
      "Ensure you have a legal basis to process the personal data you request from clients.",
    ],
  ],
  [
    "Limits and availability",
    [
      "Each plan has limits on active requests, users and storage, described on the pricing page.",
      "We do our best to keep the service available, but we do not guarantee uninterrupted availability; maintenance is announced with reasonable notice.",
      "Lockcopy is not liable for indirect losses (lost profits, loss of clients) resulting from service failures.",
    ],
  ],
  [
    "Content and ownership",
    [
      "Content submitted by clients belongs to the agency and/or the client; Lockcopy acquires no rights over it.",
      "The Lockcopy brand, code and design belong to Lockcopy.",
    ],
  ],
  [
    "Termination and applicable law",
    [
      "Either party may terminate the account; data is deleted according to the privacy policy.",
      "The laws of Portugal apply; disputes are submitted to the Portuguese courts, unless a mandatory rule provides otherwise.",
    ],
  ],
];

function Termos() {
  return (
    <SiteShell>
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Lockcopy</Link> · Legal document</p>
      <h1 className="mt-3 font-display text-4xl font-bold">Terms of service</h1>
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
        See also: <Link to="/privacy" className="underline hover:text-foreground">Privacy policy</Link> · <Link to="/dpa" className="underline hover:text-foreground">Data processing agreement</Link>
      </p>
    </div>
    </SiteShell>
  );
}
