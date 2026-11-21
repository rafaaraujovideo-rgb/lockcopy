/**
 * Modelos gratuitos de checklist de conteúdos, para download direto (CSV).
 * São os mesmos formatos que a exportação Webflow usa: página, campo, tipo, obrigatório, limite.
 */

export type FreeTemplate = {
  slug: string;
  name: string;
  description: string;
  rows: [page: string, label: string, type: string, required: boolean, charLimit: number | ""][];
};

export const FREE_TEMPLATES: FreeTemplate[] = [
  {
    slug: "business-website",
    name: "Business website (5 pages)",
    description: "Home, About, Services, Portfolio and Contact — the essential texts and images for each page.",
    rows: [
      ["Home", "Main headline (hero)", "text", true, 90],
      ["Home", "Supporting subtitle", "text", true, 160],
      ["Home", "Hero image", "image", true, ""],
      ["Home", "Three short benefits", "long text", true, 400],
      ["About", "Company story", "long text", true, 1200],
      ["About", "Team photos", "image", false, ""],
      ["Services", "List of services with description", "long text", true, 2000],
      ["Services", "Pricing table (if any)", "long text", false, 800],
      ["Portfolio", "Projects with caption", "long text", true, 1500],
      ["Portfolio", "Project images", "image", true, ""],
      ["Contact", "Address, email and phone", "text", true, 200],
      ["Contact", "Opening hours", "text", false, 120],
    ],
  },
  {
    slug: "online-store",
    name: "Online store",
    description: "Categories, products, policies and support pages for a store ready to receive a catalogue.",
    rows: [
      ["Home", "Headline and value proposition", "text", true, 140],
      ["Home", "Promotional banner", "image", false, ""],
      ["Catalogue", "List of categories", "long text", true, 600],
      ["Product", "Name, description and price per product", "long text", true, 4000],
      ["Product", "Product photos", "image", true, ""],
      ["Policies", "Shipping and delivery times", "long text", true, 800],
      ["Policies", "Exchanges and returns", "long text", true, 800],
      ["Policies", "Accepted payment methods", "text", true, 200],
      ["Support", "Frequently asked questions", "long text", false, 2000],
      ["Contact", "Support email and phone", "text", true, 200],
    ],
  },
  {
    slug: "landing-page",
    name: "Campaign landing page",
    description: "A single conversion-focused page: hero, social proof, offer and call to action.",
    rows: [
      ["Hero", "Campaign headline", "text", true, 80],
      ["Hero", "Subtitle with the offer", "text", true, 160],
      ["Hero", "Main image or video", "image", true, ""],
      ["Social proof", "Three testimonials with name and role", "long text", true, 900],
      ["Social proof", "Client logos", "image", false, ""],
      ["Offer", "What is included", "long text", true, 800],
      ["Offer", "Price and conditions", "text", true, 200],
      ["FAQ", "Five frequently asked questions", "long text", false, 1200],
      ["Final CTA", "Button text and guarantee", "text", true, 120],
    ],
  },
];

function csvEscape(value: string | number | boolean): string {
  const s = String(value);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function templateCsv(t: FreeTemplate): string {
  const header = "page;field;type;required;char_limit";
  const lines = t.rows.map((r) => r.map((c) => csvEscape(c === "" ? "" : c)).join(";"));
  return [header, ...lines].join("\n");
}

export function downloadTemplate(t: FreeTemplate) {
  const blob = new Blob(["﻿" + templateCsv(t)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lockcopy-template-${t.slug}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
