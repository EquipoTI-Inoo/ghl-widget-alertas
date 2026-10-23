# GoHighLevel Marketplace Developer Docs — Core, Auth & Platform Reference

Source: https://marketplace.gohighlevel.com/docs (fetched 2026-10-23)
This file covers authorization, OAuth 2.0, SDKs/CLI, rate limits, versioning, webhooks, and a few vertical APIs (Ad Manager / Facebook, Marketplace API). Other vertical APIs (Contacts, Conversations, Calendars, Opportunities, etc.) are not covered here — see the full sidebar list at the bottom.

---

## 1. Authorization Overview

HighLevel supports two authorization mechanisms:

### Private Integration Token (PIT) — internal use
Use when:
- Your integration hits API endpoints for internal purposes only.
- You don't need webhooks, custom design, or custom pages.
- You only need access to **one sub-account at a time**.
- Examples: internal data sync, custom reporting dashboards, automated internal tasks.

### OAuth 2.0 Flow — public-facing integrations
Use when:
- Building a full-scale integration meant for public distribution.
- You need webhooks or custom modules (workflow actions/triggers, custom pages, conversation providers).
- You need standardized, user-granted authorization across many accounts.
- Examples: third-party marketplace apps, custom conversation providers, custom workflow actions/triggers.

---

## 2. OAuth 2.0 Flow (Authorization Code Grant)

### Flow steps, in order
1. **Register an app** in the Marketplace (My Apps → Create App). Choose app type, target user (Sub-account recommended for most apps), who can install it, and listing type. Start as **Private** while testing.
2. **Configure the Auth pane** (Advanced Settings → Auth): select scopes, add a Redirect URL, generate a **Client ID** and **Client Secret**.
   - ⚠️ Copy the Client Secret immediately — it cannot be viewed/copied again from the UI afterward.
3. **Get the Installation URL** from the Auth pane's Install Link section (standard or white-label version).
4. **User installs the app**: opens the install URL, logs in, selects an account, grants access.
5. **Redirect with authorization code**: browser is redirected to your Redirect URL with `?code=...`.
6. **Exchange the code for tokens** (see below).
7. **Call APIs** with the access token; refresh when expired.

### Token exchange
```
POST https://services.leadconnectorhq.com/oauth/token
Headers: Accept: application/json, Content-Type: application/json (or x-www-form-urlencoded)
Body params:
  client_id
  client_secret
  grant_type = authorization_code
  code
  user_type      (e.g. "Company")
  redirect_uri
```

### Refresh token exchange
```
POST https://services.leadconnectorhq.com/oauth/token
Body params:
  client_id
  client_secret
  grant_type = refresh_token
  refresh_token
  user_type
  redirect_uri
```
- Refresh tokens are **single-use**: each refresh call returns a brand-new refresh token; the old one becomes invalid immediately. Always persist the new refresh token from every response.

### Agency → Location token exchange
```
POST https://services.leadconnectorhq.com/oauth/locationToken
Headers: Authorization: Bearer <agency access token>, Version: 2021-07-28
Body: { companyId, locationId }
```

### Token types
- **Agency token** (`userType: Company`) — for agency-level endpoints (e.g. creating sub-accounts).
- **Location token** (`userType: Location`) — for sub-account endpoints (e.g. creating contacts).

### Token expiry (confirmed via FAQ + OAuth page)
- **Access token:** ~24 hours (`expires_in` ≈ 86399–86400 seconds).
- **Refresh token:** valid 1 year if unused; using it issues a new refresh token also valid 1 year.
- **Recommended handling:** call API → if token expired, refresh via the API, persist both new tokens, retry original request. Wrap this in a shared helper used by all API calls.

### Scopes
- Space-delimited string in the `scope` response field.
- Dot/slash notation, e.g. `calendars.readonly`, `calendars/events.readonly`.
- Request the **minimum** scopes needed.
- Scopes can only be changed while the app is in **draft** state (per Webhook Integration Guide).
- Recent scope examples from the changelog (Projects module): `projects/workspace.readonly`, `projects/workspace.write`, `projects/tasks.readonly`, `projects/tasks.write`, `projects/tasks.comments.*`, `projects/tasks.recurring.*`.
- New security schemes seen in recent changelog: `Agency-Access`, `Agency-Access-Only`, `Location-Access`, `Location-Access-Only`.

### v3 OAuth endpoint pages (index only — need individual fetch for full param tables)
- Get Access Token — `/docs/ghl/oauth/get-access-token`
- Get Location Access Token from Agency Token — `/docs/ghl/oauth/get-location-access-token`
- Get Location where app is installed — `/docs/ghl/oauth/get-installed-location`
- v3 auth model: all v3 APIs are under the `/v3` route prefix with AIP-compliant responses, using HTTP Bearer auth (JWT). Accepted tokens: Sub-Account access token, Sub-Account PIT, Agency access token, Agency PIT.

---

## 3. Access Token Use Cases
- The type of token generated (Agency vs Sub-Account) depends on **who installs the app** and the app's distribution/target-user settings.
- Two scenarios: Agency-level token vs Sub-Account (Location)-level token — matches the OAuth flow's `userType` distinction above.
- (Page was thin; deeper usage examples live on two linked sub-pages not yet fetched: "Handling Access Tokens for Apps with Target User: Agency" and "...Sub-Account".)

---

## 4. Private Integration Tokens (PIT) — Detail

**What they are:** Static, OAuth2-style access tokens for custom connections between a HighLevel account (Agency or Sub-Account) and a third-party app/script. No refresh flow — they're rotated manually.

**Creating one:**
1. Agency Settings → Private Integrations (enable under Labs if not visible).
2. "Create new Integration" → name + description.
3. Select only the scopes needed.
4. Copy the token immediately — **cannot be viewed again** after creation.

**Access control:** By default agency admins can create/manage PITs; restrict per-user under Settings → Team → Roles & Permissions (separate toggles for agency-level vs sub-account-level).

**Comparison table:**

| Feature | Private Integrations | API Keys (legacy) | OAuth2 Access Tokens |
|---|---|---|---|
| Access control | Restricted by scope | Unrestricted | App-defined |
| API version | v2.0 | v1.0 (end-of-life) | v2.0 |
| Generation | UI | UI | Programmatic code exchange |
| Expiration | Static, no auto-refresh | — | Expires daily, must refresh |

**Required headers:**
```
Authorization: Bearer <PRIVATE INTEGRATION TOKEN>
Version: 2021-07-28
Accept: application/json           (GET)
Content-Type: application/json     (requests with a body)
```

**Example — GET a sub-account:**
```bash
curl --request GET \
  --url https://services.leadconnectorhq.com/locations/ve9EPM428h8vShlRW1KT \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <YOUR PRIVATE INTEGRATION TOKEN>' \
  --header 'Version: 2021-07-28'
```

**Example — POST create a contact:**
```bash
curl --request POST \
  --url https://services.leadconnectorhq.com/contacts/ \
  --header 'Authorization: Bearer <YOUR PRIVATE INTEGRATION TOKEN>' \
  --header 'Content-Type: application/json' \
  --header 'Version: 2021-07-28' \
  --data '{ "firstName": "John", "lastName": "Doe", "email": "john@example.com", "phone": "+1234567890", "locationId": "LOCATION_ID" }'
```

**Security/maintenance:**
- Rotate every 90 days (recommended). "Rotate and expire later" gives a 7-day overlap where both tokens work.
- If compromised: "Rotate and expire now", then update the client immediately.
- Delete unused integrations from the three-dot menu.

**Limitations vs OAuth:** static (no auto-refresh), created manually via UI (not a code exchange), scope changes require editing in the UI.

---

## 5. SDKs (official)

Official clients share the same core features — pick based on your stack.

| SDK | Package | Min runtime |
|---|---|---|
| Node.js | `@gohighlevel/api-client` | Node.js 18+ |
| Python | `gohighlevel-api-client` | Python 3.8+ |
| PHP | `gohighlevel/api-client` | PHP 7.4+ |

Install:
```bash
npm install @gohighlevel/api-client       # Node
pip install gohighlevel-api-client        # Python
composer require gohighlevel/api-client   # PHP
```

Shared core features:
- Automatic OAuth flows and PIT support
- Per-location token storage
- Automatic token refresh (once storage is configured)
- Webhook utilities: signature validation, handling of INSTALL/UNINSTALL events
- Bulk token generation: on webhook install events, SDK can mint + store a token per location automatically
- Typed service methods

Per-language guides exist at `/docs/sdk/node`, `/docs/sdk/python`, `/docs/sdk/php` (not yet fetched).

---

## 6. Marketplace CLI

**Install:** Requires Node.js 20.12+ and a HighLevel developer account.
```bash
npm install -g @gohighlevel/marketplace-cli
ghl --version
ghl update            # --dry-run, --package-manager, --json
```

**Auth:**
```bash
ghl login              # browser flow; --no-browser, --profile <name>
ghl account
ghl account switch [accountId]
ghl logout
```

**Scaffold a new app:**
```bash
ghl app create --name <n> --type public|private --target sub-account|agency --listing white-label|standard [--installer] [--directory] [--folder]
```
- `ghl app pull <appId>` — creates/refreshes a local workspace from an existing remote app.
- Generated workspace includes `ghl-app.json` (identity, listing, OAuth, billing, review settings), webhook config, workflow action/trigger JSON, billing manifests, JSON Schemas, TS declarations (`--with-types`).

**Local dev loop:**
```bash
ghl app validate                 # offline checks
ghl app types                    # regenerate TS declarations/schemas
tsc -p tsconfig.actions.json     # type-check workflow action code
ghl app actions test <action>    # run through portal test runner (can cause real side effects if API-backed)
```

**Sync & deploy:**
```bash
ghl app diff                     # compare last pull vs local vs portal
ghl app push [--dry-run]         # validate, merge, push changed sections only
ghl app validate --remote        # server-side publish-readiness checklist
ghl app publish --version <v> --agency-notes <notes> [--force]   # private = instant, public = goes to review
ghl app analyze                  # recommends next semver version
```
Versioning: first release `1.0.0`; later releases must be patch/minor/major increments.

**Config sub-commands:**
- Listing/profile: `ghl app basic-info`, `listing`, `profiles`, `support`, `review-details`
- Media: `ghl app media upload|delete` (logo/screenshot size rules apply)
- OAuth: `ghl app scopes`, `redirect`, `keys`, `sso-key`
- Webhooks: `ghl app webhook url|events|subscribe|unsubscribe`
- Workflows: `ghl app actions`, `ghl app triggers` (create/validate/diff/push/publish)
- Billing: `ghl app billing` (plans, meters, tiers); legacy `ghl app pricing`

**Automation tips:** pass all required flags, use `--json` on read commands and check exit codes, `--dry-run` before syncing, `--force` only for reviewed destructive ops. Workspace files hold no credentials — secrets live in a local ledger until first reveal. The **portal is the source of truth**.

---

## 7. MCP Server (LeadConnector)

Connects MCP-compatible AI assistants (Claude, ChatGPT/Codex, Muse) directly to a LeadConnector/GHL CRM account via OAuth, scoped per sub-account.

**Endpoints:**
| Client | URL |
|---|---|
| Claude | `https://services.leadconnectorhq.com/mcp/anthropic/v2` |
| ChatGPT/Codex/OpenAI-compatible | `https://services.leadconnectorhq.com/mcp/openai/v2/` |
| Muse | `https://services.leadconnectorhq.com/mcp/muse/v2/` |

**Tools exposed (4 unified tools, 550+ operations across 38 domains):**
- `list_locations` — list accessible sub-accounts
- `search_operations` — find operations by intent
- `describe_operation` — inputs, example payloads, required scopes, safety info
- `execute_operation` — run an operation (subject to scopes/permissions/safety checks)

**Connect — Claude Code:**
```bash
claude mcp add --transport http leadconnector https://services.leadconnectorhq.com/mcp/anthropic/v2
```
or add to `.mcp.json`:
```json
{ "mcpServers": { "leadconnector": { "type": "http", "url": "https://services.leadconnectorhq.com/mcp/anthropic/v2" } } }
```

Agencies can connect once and choose multiple sub-accounts (rolling out; requires app to enable the bulk option). Sensitive/irreversible operations require extra confirmation.

---

## 8. Rate Limits

| Limit | Value |
|---|---|
| Burst | 100 requests / 10 seconds |
| Daily | 200,000 requests / day |

Scope: **per Marketplace app (client) per resource** (a resource = one Location or one Company). Installing on more sub-accounts does **not** split the allowance — each install gets its own budget.

**Response headers (every API response):**
| Header | Meaning |
|---|---|
| `X-RateLimit-Limit-Daily` | daily limit |
| `X-RateLimit-Daily-Remaining` | daily requests left |
| `X-RateLimit-Interval-Milliseconds` | burst window length |
| `X-RateLimit-Max` | max requests in burst window |
| `X-RateLimit-Remaining` | burst requests left in current window |

No documented 429 retry/backoff guidance — track usage via the headers above proactively.

---

## 9. Versioning

API version is specified via the **`Version`** request header. Two formats exist:
- **Date-based** (older): e.g. `2021-07-28`
- **Named** (v3+): e.g. `v3`, `v4`

| Version | Released |
|---|---|
| v3 | 2026-06-11 |
| 2023-02-21 | 2023-02-21 |
| 2021-07-28 | 2021-07-28 |
| 2021-04-15 | 2021-04-15 |
| legacy | 2021-01-01 |

Deprecation: new version release → previous version enters a "maintenance window" (critical bug/security fixes only, no new features) → eventually retired (requests with a retired version header are rejected). Retirement dates not published (TBD) — migrate proactively.

---

## 10. Changelog Highlights (recent, newest first — v3 docs)

- **Projects (2026-09-29):** Scopes reorganized — many endpoints now require `projects/workspace.readonly/write`, `projects/tasks.readonly/write`, `projects/tasks.comments.*`, `projects/tasks.recurring.*` (replacing old `locations/tasks.*`, `recurring-tasks.*`). New security schemes: `Agency-Access`, `Agency-Access-Only`, `Location-Access`, `Location-Access-Only`. **Breaking:** `GET .../members` endpoints removed (folders/lists/spaces, no deprecation period); task list endpoints dropped `cursor`/`nextCursor` in favor of `searchAfter`; some date fields lost `date-time` format; recurring task RRULE min/max constraints removed.
- **Chat Widget (2026-08-25) — breaking:** many fields restricted to enums; `aTwoPCompliance`, `useEmailField`, `widgetId` removed from requests; some request item types changed string → object. *(Directly relevant if this project's "Widget pop up de alertas" integrates with GHL's Chat Widget API — check the current Chat Widget API schema before building against it.)*
- **Affiliate Manager (2026-09-07):** `status` filters on commissions/payouts restricted to enums; `limit` max is now 100; audit fields (e.g. `createdBy`) changed type. New endpoints for payout methods, customers, leads, tax forms, commissions, campaigns, media.
- **Conversation AI (2026-09-23):** new `customApi` action type; action schemas restructured.
- **Ad Publishing (2026-09-29):** `budget` schema on ad set updates changed; `bidAmount` and budget-sharing fields added to campaigns.
- **Blogs (2026-09-03):** `POST /blogs/posts` success now documented as 201 (was 200); `GET /blogs/authors` now requires `locationId`; `searchTerm` filter covers more fields; new `GET /blogs/posts/post/{postId}`.
- **Workflows (2026-10-19):** new endpoints — create/search/validate/delete workflows, manage definitions/status, list step types, read logs + aggregated logs.
- **Countdown Timer (2026-10-06):** new endpoints for listing/managing templates and timers.
- **Courses (2026-09-24):** large endpoint set — products, offers, lessons, quizzes, assignments, categories, enrollments, completions, progress, course import.
- **Marketplace (2026-09-10):** `GET /marketplace/app/{appId}/rebilling-config/location/{locationId}` deprecated.

*(Changelog page is very long — 500k+ chars; only the first ~100k chars were read. Entries before ~2023-02-21 are not included here.)*

---

## 11. Country List
- Used whenever a contact is created/updated with a country field: "Select country code whenever a contact will create or update with country field."
- Two-letter codes paired with country names — looks like ISO 3166-1 alpha-2 but with some non-standard entries (e.g. `XK` Kosovo, `AN` Netherlands Antilles legacy code, `GB` labeled "UK").
- Doesn't name which endpoints consume it (presumably Contacts API `country` field) — check the Contacts API docs directly.

---

## 12. OAuth/Marketplace FAQs

1. **Listening to webhook events:** register an app → set webhook URL in app settings → add required scopes → location/agency admin installs app from Marketplace → OAuth redirect with code → exchange for access token → webhook events for that location start arriving.
2. **Access token lifetime:** 1 day.
3. **Refresh token lifetime:** 1 year if unused; using it rotates in a new refresh token (also 1 year).
4. **Handling token expiry:** call API → if expired, refresh via API → persist both new tokens → retry. Recommended to centralize this in one helper used by all API calls.
5. **Current API 2.0 rate limits:** 100 req/10s burst, 200,000 req/day — counted per marketplace app per resource (Location or Company).

---

## 13. Getting Started / Developer Marketplace (high-level)

- The Developer Marketplace is HighLevel's platform for building and distributing custom apps for the HighLevel CRM. Scale claimed: 70,000+ agencies, 600,000+ businesses on the platform.
- Doc versions available: v3 (current), 2023-02-21, 2021-07-28, 2021-04-15.
- Deeper onboarding pages not yet fetched (sidebar only): **Key Concepts**, **Create a Marketplace App**, **App Testing Guide**, **App Review Guidelines**, **How to Update Your App**. Fetch these next if you need concrete app-type/review-process details.

---

## 14. OAuth 2.0 v3 / Ad Manager / Marketplace API — architecture notes

All v3 APIs share this shape:
- Routed under `/v3` prefix, AIP-compliant responses.
- Auth: HTTP Bearer (JWT). Accepted tokens: Sub-Account access token, Sub-Account PIT, Agency access token, Agency PIT.

### Ad Manager API (v3)
- Same `/v3` + Bearer auth model as above.
- Platform-specific sub-sections for **Facebook**, **Google**, **LinkedIn**, each split into Integration / Ads / Reporting.

### Facebook Integration (Ad Manager → Facebook)
Known endpoints (index-level, not full param tables):
- **Current user** — get authenticated Facebook user profile for a location.
- **Pages** — list pages for the connected account (no `limit` → array response; *"this array response will soon be deprecated"*).
- **Instagram accounts** — list IG accounts linked to a page.
- **Page lead forms** — list lead-gen forms for a page (newest first, optional field projection + pagination).
- **Create page lead form** — save draft or publish to Facebook. Publishing requires ≥1 question + complete thank-you page; drafts don't enforce either. Passing `draftFormId` on publish deletes the draft afterward (cleanup failures only logged).
- **Ad accounts** — list, get details, or remove an ad account connection.
- **Conversation forms** — list/create Messenger lead forms (created forms use `_id` + `__v`, not `id`).
- **Facebook integration** — create/get/delete the ad integration for a location.
- **Page connection** — set default page / remove connection (delete endpoint deprecated in favor of v4 route).
- **Lead form by ID** — get published form, or draft via `isDraft=true`.

### Developer Marketplace API (v3)
Sections (not yet fetched in detail): **App Management**, **Wallet Charges**, **App Billing Management**, **External Auth Migration**.

---

## 15. Webhooks

### Setup
1. Create a public HTTPS endpoint accepting POST (cloud function, hosted app, or test tool like webhook.site/ngrok).
2. Handler reads JSON body, checks `type`, returns 200.
3. Test the endpoint standalone first.
4. Create an OAuth app in the marketplace dashboard.
5. Set scopes under Advanced Settings → Auth (**scopes are only editable while app is in draft**).
6. Subscribe to events under the webhook section (changeable anytime, even after the app is live).

### Payload shape
```json
{
  "type": "ContactCreate",
  "timestamp": "2026-...",
  "webhookId": "unique-id-for-dedup",
  "data": { "...event specific..." }
}
```

### Event categories
Contact, Opportunity, Task, Appointment, Invoice, Product, Association, Location, User, and others (full payloads live in per-category webhook docs, not fetched here).

### Signature verification
- **`X-GHL-Signature`** (Ed25519) — current method.
- **`X-WH-Signature`** (RSA-SHA256) — legacy, **deprecated 2026-09-01**.
- Logic: prefer `X-GHL-Signature` if present; fall back to legacy RSA only if that's all that's sent; reject if verification fails.

### Retry policy
- Any non-2xx or no response = failure.
- Up to **12 retries**, exponential backoff + jitter, stops at first 2xx.
- Manual resend available from the Webhook Logs Dashboard, but only for the **latest attempt** of a webhook not yet delivered.

### Circuit breaker
- Checked ~every 3 days using the trailing 3-day window.
- Applies only if URL received >10,000 webhooks in that window.
- Success rate <90% → warning email + dashboard notice; flagged again on next check → delivery **paused** until you manually re-enable events in the dashboard.

### Best practices
Return 200 fast, process async; dedupe via `webhookId`; make processing idempotent; log inbound payloads + processing results.

### Webhook Logs Dashboard
- Path: App dashboard → select app → Insights → Logs → Webhooks tab (`/app-settings/{appId}/dashboard/logs`).
- **Stats (rolling 24h, independent of date filter):** Total Events (unique webhooks), Consumer Errors (non-2xx), Total Attempts (incl. retries).
- **Table columns:** event name, webhook ID, attempt time, status code, attempt number ("-" for manual resends).
- **Filters:** date range (last 30 days retained; default last hour), timezone display (stored UTC), search by webhook ID or payload key/value substring, event-name filter, status-code filter (2xx vs non-2xx quick toggle or specific codes), pagination (10/20/50).
- **Resend:** only on latest non-delivered attempt; success marks delivered + cancels pending auto-retry; failure is logged but doesn't restart the retry cycle.
- **Troubleshooting:** repeated 404 → wrong endpoint URL; 401 → auth issue; 500 → your server error.

---

## Full sidebar module list (not yet fetched — for future passes)

Auth/platform pages fetched are above. Remaining vertical API docs (each likely has an intro + multiple endpoint sub-pages, pattern `/docs/ghl/{module}/{module}-api[-v-3]`):

Affiliate Manager · AI Agent Studio · Associations · Blogs · Brand Boards · Business (Sub-Account) · Calendars · Campaigns · **Chat Widget** (⚠ had breaking changes 2026-08-25 — check before integrating) · ClientPortal AI · Companies · Contacts · Conversation AI · Conversations · **Countdown Timer** (relevant to "Widget pop up de alertas"?) · Courses · Custom Fields V2 · Custom Menus · Email ISV · Email · Files · Forms · Funnels · Invoices · Knowledge Base · Trigger Links · Sub-Account (Locations) · Media Storage · Objects (Custom Objects) · Opportunities · Payments · LC Phone · Products · Projects · Proposals (Documents & Contracts) · SaaS API · Snapshots · Social Planner · Store · Surveys · Users · Voice AI · Workflows

Base pattern: `https://marketplace.gohighlevel.com/docs/ghl/<slug>/<slug>-api[-v-3]`

If this project needs a specific module (e.g. Chat Widget, Custom Menus, or Countdown Timer, which seem most relevant to a "popup/alert widget" app), fetch that module's docs next — this file intentionally stops at core auth/platform to stay a manageable size.
