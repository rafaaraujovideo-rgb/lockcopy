<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Database is the user's external Supabase; schema lives in `db/*.sql` (run manually by the user), never Lovable Cloud — the user chose to own the backend.
- Agency pages under `/app` gate on the browser session and call server functions in `src/lib/*.functions.ts` with the bearer middleware — RLS then applies as the signed-in user.
- The client portal (`/c/$token`) uses only token-checked RPCs and a separate session-less anon client for uploads — so an agency session in the same browser never widens client access.
- The 14-day trial starts in the database when an agency is created (db/0009), with no Stripe; after that, subscription state changes only in the Stripe webhook — browser code can never write billing columns.

- Stripe: STRIPE_MODE=test makes billing read STRIPE_TEST_* secrets — lets checkout be tested without real cards; remove it to go live.
- Owner-only admin pages check the verified Auth user's email on the server (src/lib/admin.ts) before any privileged read — UI hiding is cosmetic.
- Everything users can see (pages, URLs, search params, sample data, errors, emails) is English; database error codes are translated in friendlyError — src/test/english-only.test.ts guards it.
- Browser code uses `getSupabase()` from `src/lib/supabase-browser.ts`, never the generated `src/integrations/supabase/client.ts` — the integration regenerates that file and would wipe custom exports.
