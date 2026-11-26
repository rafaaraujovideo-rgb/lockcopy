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
  {
    slug: "real-estate-website-content-template",
    keyword: "Real estate website content template",
    title: "Real estate website content template for agents — Lockcopy",
    description: "Free content template for real estate agency websites: listings, agent bios, areas served and photos, with character limits that fit the design.",
    intro: "Use this when building a site for an estate agent or agency. Listings and agent profiles repeat, so each block maps to a CMS item and the client can add as many as they need.",
    fields: [
      { page: "Home", label: "Main headline", type: "Short text", limit: 60, note: "Area and type of property you sell or let." },
      { page: "Home", label: "Cover photo", type: "Files", note: "A local street or property exterior, landscape." },
      { page: "Listings", label: "Property title", type: "Short text", limit: 60, note: "For example: 3-bed house with garden, Riverside." },
      { page: "Listings", label: "Price and key facts", type: "Short text", limit: 120, note: "Price, bedrooms, bathrooms, size." },
      { page: "Listings", label: "Property description", type: "Long text", limit: 700, note: "Layout, condition, nearby amenities." },
      { page: "Listings", label: "Property photos", type: "Files", note: "Same orientation; living room first." },
      { page: "Agents", label: "Name and role", type: "Short text", limit: 60, note: "One block per agent." },
      { page: "Agents", label: "Short bio", type: "Long text", limit: 300, note: "Experience and areas covered." },
      { page: "Agents", label: "Portrait", type: "Files", note: "Same background for every agent." },
      { page: "Areas", label: "Areas served", type: "Long text", limit: 300, note: "Neighbourhoods or towns, one per line." },
    ],
    tips: [
      "Ask for two or three real listings only. Live listings usually come from a feed or are added later in the CMS.",
      "Agree photo orientation upfront; mixed portrait and landscape photos break listing grids.",
    ],
  },
  {
    slug: "dental-clinic-website-content-checklist",
    keyword: "Dental clinic website content checklist",
    title: "Dental clinic website content checklist — Lockcopy",
    description: "Free content checklist for dental and medical clinic websites: treatments, team, opening hours and booking details, with character limits.",
    intro: "Clinic sites revolve around treatments, the team and how to book. This checklist asks for each in short, fixed-length blocks so treatment cards stay even.",
    fields: [
      { page: "Home", label: "Main headline", type: "Short text", limit: 60, note: "Type of clinic and location." },
      { page: "Home", label: "Clinic photo", type: "Files", note: "Reception or treatment room, bright and tidy." },
      { page: "Treatments", label: "Treatment name", type: "Short text", limit: 40, note: "One block per treatment." },
      { page: "Treatments", label: "What it involves", type: "Long text", limit: 350, note: "Plain words a patient understands." },
      { page: "Treatments", label: "Price or price range", type: "Short text", limit: 40, note: "Optional. Leave empty if not published." },
      { page: "Team", label: "Name and title", type: "Short text", limit: 60, note: "Including professional registration if required." },
      { page: "Team", label: "Short bio", type: "Long text", limit: 300, note: "Training and focus areas." },
      { page: "Team", label: "Portrait", type: "Files", note: "Same framing for everyone." },
      { page: "Visit", label: "Opening hours", type: "Long text", limit: 200, note: "Day by day, exactly as shown." },
      { page: "Visit", label: "How to book", type: "Short text", limit: 140, note: "Phone, booking link or both." },
    ],
    tips: [
      "Ask the clinic to check treatment wording with whoever is responsible for health claims in their country.",
      "Collect team portraits in one session if possible; mismatched photos are the most visible flaw on clinic sites.",
    ],
  },
  {
    slug: "restaurant-website-content-template",
    keyword: "Restaurant website content template",
    title: "Restaurant website content template (free) — Lockcopy",
    description: "Free restaurant website content template: menu sections, dishes, opening hours, booking and photos, with character limits for menu cards.",
    intro: "Restaurant sites change often and menus are long. This template asks for the menu dish by dish, with tight limits so descriptions fit menu cards on mobile.",
    fields: [
      { page: "Home", label: "Main headline", type: "Short text", limit: 60, note: "Cuisine and neighbourhood." },
      { page: "Home", label: "Hero photo", type: "Files", note: "A signature dish or the dining room." },
      { page: "Menu", label: "Menu section", type: "Short text", limit: 30, note: "For example: Starters, Mains, Desserts." },
      { page: "Menu", label: "Dish name", type: "Short text", limit: 40, note: "One block per dish." },
      { page: "Menu", label: "Dish description", type: "Short text", limit: 120, note: "Main ingredients, allergens if relevant." },
      { page: "Menu", label: "Price", type: "Short text", limit: 12, note: "Number only." },
      { page: "Menu", label: "Dish photos", type: "Files", note: "Shot from the same angle if possible." },
      { page: "About", label: "Our story", type: "Long text", limit: 500, note: "Who runs it and what makes it different." },
      { page: "Visit", label: "Address and opening hours", type: "Long text", limit: 250, note: "Exactly as shown on the site." },
      { page: "Visit", label: "Booking link or phone", type: "Short text", limit: 120, note: "Where reservations happen." },
    ],
    tips: [
      "Ask for the current menu only. Seasonal changes are easier once the menu sits in the CMS.",
      "Short dish descriptions read better on phones, where most diners check the menu.",
    ],
  },
  {
    slug: "ecommerce-product-content-template",
    keyword: "E-commerce product content template",
    title: "E-commerce product content template for clients — Lockcopy",
    description: "Free product content template for online store builds: product names, descriptions, prices, variants and photos with character limits.",
    intro: "For store builds, the slow part is product content. This template asks for each product as one block, matching a typical product CMS collection.",
    fields: [
      { page: "Products", label: "Product name", type: "Short text", limit: 60, note: "One block per product." },
      { page: "Products", label: "Short description", type: "Short text", limit: 160, note: "Shown on product cards." },
      { page: "Products", label: "Full description", type: "Long text", limit: 1000, note: "Materials, sizes, care." },
      { page: "Products", label: "Price", type: "Short text", limit: 20, note: "Including currency." },
      { page: "Products", label: "Variants", type: "Short text", limit: 120, note: "Sizes or colours, separated by commas." },
      { page: "Products", label: "Product photos", type: "Files", note: "White or consistent background, square." },
      { page: "Store", label: "Shipping and returns", type: "Long text", limit: 600, note: "Delivery times, costs, return policy." },
      { page: "Store", label: "Category names", type: "Short text", limit: 120, note: "Separated by commas." },
    ],
    tips: [
      "Start with your top 10 products; the client can add more items later without waiting on you.",
      "Insist on one photo style across products. It matters more to the finished store than any layout choice.",
    ],
  },
];

export const findSeoTemplate = (slug: string) => SEO_TEMPLATES.find((t) => t.slug === slug);
