export type SeoField = { page: string; label: string; type: "Short text" | "Long text" | "Files"; limit?: number; note: string };
export type SeoTemplate = {
  slug: string;
  keyword: string;
  title: string;
  description: string;
  intro: string;
  fields: SeoField[];
  tips: string[];
};

export const SEO_TEMPLATES: SeoTemplate[] = [
  {
    slug: "website-content-questionnaire",
    keyword: "Website content questionnaire template",
    title: "Website content questionnaire template (free) — Lockcopy",
    description: "A free website content questionnaire for web designers: every page, field and character limit to ask your client for, ready to send.",
    intro: "Use this questionnaire when a new business website is approved and you need the client's copy and photos before you can build. Each field has a suggested character limit so the text fits the design.",
    fields: [
      { page: "Home", label: "Main headline", type: "Short text", limit: 60, note: "One line about what the business does." },
      { page: "Home", label: "Supporting sentence", type: "Short text", limit: 160, note: "Who it is for and the main benefit." },
      { page: "Home", label: "Cover photo", type: "Files", note: "Landscape, at least 2000px wide." },
      { page: "About", label: "Your story", type: "Long text", limit: 600, note: "How it started and what makes you different." },
      { page: "About", label: "Team photos", type: "Files", note: "Same background and framing if possible." },
      { page: "Services", label: "Service name", type: "Short text", limit: 40, note: "Repeat for each service." },
      { page: "Services", label: "Service description", type: "Long text", limit: 280, note: "What is included and who it is for." },
      { page: "Contact", label: "Address, phone and email", type: "Long text", limit: 200, note: "Exactly as it should appear." },
      { page: "Contact", label: "Logo", type: "Files", note: "SVG or transparent PNG." },
    ],
    tips: [
      "Send it once the sitemap is approved, so the client fills only pages that exist.",
      "Give a deadline. Content without a date is the most common reason projects stall.",
      "Ask for one service per block instead of a single long list. It maps straight to a CMS collection.",
    ],
  },
  {
    slug: "web-design-intake-form",
    keyword: "Web design client intake form",
    title: "Web design client intake form template — Lockcopy",
    description: "Free web design intake form: brand assets, references, goals and content owners to collect from a new client before the project starts.",
    intro: "An intake form for the first week of a web design project. It collects what you need to start designing: brand assets, references and who will supply the content.",
    fields: [
      { page: "Business", label: "Business name", type: "Short text", limit: 60, note: "As it should appear on the site." },
      { page: "Business", label: "What you do, in one sentence", type: "Short text", limit: 140, note: "Plain words, no slogans." },
      { page: "Goals", label: "Main goal of the new site", type: "Long text", limit: 400, note: "For example: more bookings, fewer phone questions." },
      { page: "Brand", label: "Current logos", type: "Files", note: "Every version you have." },
      { page: "Brand", label: "Colours and fonts", type: "Short text", limit: 120, note: "Hex codes or names, if known." },
      { page: "References", label: "Sites you like", type: "Long text", limit: 400, note: "Links and what you like about each." },
      { page: "References", label: "Brand imagery", type: "Files", note: "Photos you already own and can use." },
      { page: "Content", label: "Who writes the texts", type: "Short text", limit: 80, note: "Name and email of the person responsible." },
    ],
    tips: [
      "Keep intake separate from content collection: intake starts the design, content finishes the build.",
      "Ask who owns the content early, so reminders go to the right person.",
    ],
  },
  {
    slug: "webflow-cms-content-checklist",
    keyword: "Webflow CMS content checklist",
    title: "Webflow CMS content checklist for client projects — Lockcopy",
    description: "Checklist of the content a client must supply for a Webflow CMS site, field by field, matched to collection fields and character limits.",
    intro: "Webflow CMS items have fixed fields. This checklist mirrors a typical Services and Team collection, so what the client sends maps one-to-one to your fields.",
    fields: [
      { page: "Services collection", label: "Name", type: "Short text", limit: 40, note: "Becomes the item name and slug." },
      { page: "Services collection", label: "Summary", type: "Short text", limit: 140, note: "Used on cards." },
      { page: "Services collection", label: "Body", type: "Long text", limit: 800, note: "Rich text field." },
      { page: "Services collection", label: "Image", type: "Files", note: "Converted to WebP before upload." },
      { page: "Team collection", label: "Name and role", type: "Short text", limit: 60, note: "One item per person." },
      { page: "Team collection", label: "Short bio", type: "Long text", limit: 300, note: "Third person, two or three sentences." },
      { page: "Team collection", label: "Portrait", type: "Files", note: "Square crop works best." },
    ],
    tips: [
      "Set limits from your design, not from Webflow. Webflow accepts long text that then breaks your cards.",
      "Let the client add another item for each service or person instead of guessing the count upfront.",
    ],
  },
  {
    slug: "landing-page-content-template",
    keyword: "Landing page content template",
    title: "Landing page content template for clients — Lockcopy",
    description: "Free landing page content template: headline, offer, proof and call to action with character limits, to send to a client in one link.",
    intro: "A short template for campaign pages. Landing pages break fastest when the headline is too long, so every text field has a tight limit.",
    fields: [
      { page: "Offer", label: "Headline", type: "Short text", limit: 60, note: "The promise, in one line." },
      { page: "Offer", label: "Subheadline", type: "Short text", limit: 140, note: "How it works or who it is for." },
      { page: "Offer", label: "Offer description", type: "Long text", limit: 500, note: "What the visitor gets." },
      { page: "Offer", label: "Button text", type: "Short text", limit: 24, note: "A verb: Book, Get, Start." },
      { page: "Proof", label: "Testimonial", type: "Long text", limit: 220, note: "Repeat for each testimonial, with name." },
      { page: "Proof", label: "Client logos", type: "Files", note: "SVG or PNG." },
    ],
    tips: [
      "Ask for real testimonials with a name. Anonymous quotes convert worse and are hard to verify.",
      "Agree the button text with the client; it usually changes late otherwise.",
    ],
  },
];

export const findSeoTemplate = (slug: string) => SEO_TEMPLATES.find((t) => t.slug === slug);
