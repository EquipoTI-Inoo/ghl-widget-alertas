# GoHighLevel Marketplace API — CRM & Communication Modules

Source: https://marketplace.gohighlevel.com/docs (v3 API reference). Compiled via automated fetch.

## How this API reference site is structured

Each module has:
- An **Introduction** page (`.../<module>-api` or `.../<module>-api-v-3`) — only description + auth info, no endpoints.
- A **section index** page (`.../<module>`) — lists endpoint cards (name + link + 1-line description), but NOT full HTTP method/params/schema (those are rendered client-side via JS on each individual endpoint page and are not reliably extractable via static fetch).
- Individual **endpoint pages** (`.../<module>/<action-slug>`) with full request/response schema — not fetched in bulk here due to volume (150+ pages across all modules). Open these directly in-browser or fetch one at a time when implementing a specific call.

## Authentication (applies to all modules below)

HTTP Bearer auth (JWT). Token types seen repeated across every module's auth section:
- Sub-Account access token (OAuth) **or** Sub-Account Private Integration Token
- Agency access token (OAuth) **or** Agency Private Integration Token

See `/docs/Authorization/authorization_doc`, `/docs/Authorization/OAuth2.0`, `/docs/Authorization/PrivateIntegrationsToken` for the two auth mechanisms. All v3 endpoints are under the `/v3` route prefix and return AIP-compliant responses.

No OAuth **scope strings** (e.g. `contacts.readonly`) were visible on any of the fetched intro pages — scopes are configured per-endpoint and shown on each individual endpoint page / in the Marketplace app's OAuth scope picker, not on these overview pages.

---

## Contacts

Base: `/docs/ghl/contacts/`

Endpoints found:
- Lookup Contact By Email Or Phone — `lookup-contact` — looks up contacts by exact email or phone, scoped to a location, OAuth-channel only, up to 20/page
- Create Contact — `create-contact`
- Get Contact — `get-contact`
- Update Contact — `update-contact`
- Upsert Contact — `upsert-contact`
- Delete Contact — `delete-contact`
- Get Contacts By BusinessId — `get-contacts-by-business-id`

Sub-sections (not individually fetched): Tasks, Appointments, Tags, Notes, Campaigns, Workflow, Bulk, Search, Followers.

## Conversations

Base: `/docs/ghl/conversations/`

- Create Conversation — `create-conversation`
- Get Conversation — `get-conversation`
- Update Conversation — `update-conversation`
- Delete Conversation — `delete-conversation`

Sub-sections (not fetched): Search, Email, Messages, Providers.

## Conversation AI (AI Employees)

Base: `/docs/ghl/conversation-ai/`

Sub-sections only (no endpoint cards found on intro page): Actions, Agents, Generations, Working Hours.

## Calendars

Base: `/docs/ghl/calendars/`

- Get Free Slots — `get-slots` — free slots for a calendar in a date range, optional timezone/user filter
- Create Calendar — `create-calendar`
- Get Calendars — `get-calendars` — all calendars in a location
- Get Calendar — `get-calendar` — by ID
- Update Calendar — `update-calendar` — by ID
- Delete Calendar — `delete-calendar` — by ID

Sub-sections (not fetched): Calendar Groups, Service Bookings, Services, Service Locations, Calendar Events, Appointment Notes, Calendar Resources (rooms/equipment), Calendar Notifications, Availability.

## Opportunities

Base: `/docs/ghl/opportunities/`

- Create Opportunity — `create-opportunity`
- Upsert Opportunity — `upsert-opportunity`
- Get Opportunity — `get-opportunity`
- Update Opportunity — `update-opportunity`
- Update Opportunity Status — `update-opportunity-status`
- Delete Opportunity — `delete-opportunity`

Sub-sections (not fetched): Search, Pipelines, Lost reason, Followers.

## Campaigns

`/docs/ghl/campaigns/campaigns-api-v-3` returned no usable content (page shell only; title came back as generic marketplace homepage title, suggesting this exact slug may be wrong/renamed). Re-check the live sidebar for the correct current slug.

## Chat Widget ⭐ (relevant to popup/alert widget work)

Base: `/docs/ghl/chat-widget/`

Endpoints:
- Create a new chat widget — `create-chat-widget` — creates a widget for a specific location
- List Chat Widgets — `list-chat-widgets` — retrieves chat widgets for a location
- Get Chat Widget by ID — `get-chat-widget-by-id` — full config for a location+widget ID
- Update Chat Widget — `update-chat-widget` — full replace
- Patch Chat Widget — `patch-chat-widget` — partial update
- Clone a Chat Widget — `clone-chat-widget`
- Delete a Chat Widget — `delete-chat-widget`

**Important gap:** none of the pages fetched exposed embed code (script tag / iframe snippet), styling/theming fields, event hooks/callbacks, or show/hide triggers — those details (if present) live inside the individual endpoint pages' request/response schema (e.g. the body of `update-chat-widget`/`patch-chat-widget` would show the configurable widget fields) and in GHL's own "Install chat widget" UI docs, which weren't located under this API section. If building a GHL popup/alert widget, this Chat Widget API manages GHL's own native chat widget (config CRUD via REST) — it is **not** a generic script-embed SDK for injecting custom third-party popups into a site. For a custom alert/popup widget to run inside GHL (e.g. in a funnel/website), the more relevant mechanisms are likely **Custom Menus** (adds a custom iframe'd page into the GHL app UI) or a **Custom Page/Funnel element**, not Chat Widget. Needs direct confirmation on the live `update-chat-widget`/`patch-chat-widget` pages to see the full config schema.

## Custom Menus ⭐ (relevant to popup/alert widget work)

Intro page (`/docs/ghl/custom-menus/custom-menus-api`) fetched: only generic auth boilerplate, no endpoint list. The section-index page (`/docs/ghl/custom-menus/custom-menus`) and a guessed slug (`custom-menu-link`) both 404'd / returned the generic marketplace homepage shell — the correct index slug wasn't found by guessing. **Action needed:** open `https://marketplace.gohighlevel.com/docs/ghl/custom-menus/custom-menus-api` in-browser and click through the sidebar to get real sub-page slugs; Custom Menus is GHL's mechanism for embedding a custom iframe'd page/link into the left nav of the GHL app for a sub-account, which is the most likely integration point for a custom alert/popup widget's admin UI.

## Companies

Base: `/docs/ghl/companies/`
- Get Company — `get-company` (only endpoint found)

## Associations

Intro only; sub-sections "Associations" and "Relations" not individually fetched (object-to-object linking API, e.g. linking custom objects to contacts/opportunities).

## Custom Fields V2

Intro page only had auth boilerplate. Section-index slug guesses (`custom-fields`, `custom-field`) both 404'd. Re-check sidebar for correct slug (likely under `/docs/ghl/custom-fields/`).

## Email / Email ISV

`/docs/ghl/emails/email-api-v-3` (intro) and guessed index slugs (`emails`, `email`) all returned only shells/404. Email ISV (`email-isv`) not fetched at all this pass. Both need direct sidebar navigation to find correct sub-page slugs — these cover transactional email sending and (for ISV) inbound email event/webhook handling for custom email service providers.

## Forms

Base: `/docs/ghl/forms/`
- Get Forms — `get-forms`
- Get Forms Submissions — `get-forms-submissions`
- Upload files to custom fields — `upload-to-custom-fields` — uploads files (as buffers) keyed by custom field ID + file ID, multiple files supported, 50MB limit, allowed types PDF through SVG, response returns updated contact object

## Funnels

Base: `/docs/ghl/funnels/`
- Fetch List of Funnels — `get-funnels`
- Fetch list of funnel pages — `get-pages-by-funnel-id`
- Fetch count of funnel pages — `get-pages-count-by-funnel-id`

(Read-only API — no create/update/delete funnel endpoints found, funnels are built in the GHL page builder UI, not via API.)

## Surveys

Not fetched this pass (intro page exists at `/docs/ghl/surveys/surveys-api`; index page slug not yet confirmed).

## Trigger Links

Base: `/docs/ghl/links/`
- Create Link — `create-link`
- Get Links — `get-links`
- Get Link by ID — `get-link-by-id`
- Update Link — `update-link`
- Delete Link — `delete-link`
- (separate) Trigger Links Search — `/docs/ghl/links/trigger-links-search`

## Knowledge Base

Base: `/docs/ghl/knowledge-base/`
- Create a new knowledge base — `create-knowledge-base` (max 15 per location)
- Get all knowledge bases for a location (paginated) — `list-all-knowledge-bases-paginated` — optional name search, cursor pagination
- Get knowledge base by ID — `get-knowledge-base-by-id`
- Update a knowledge base — `update-knowledge-base` — name/description only
- Delete a knowledge base — `delete-knowledge-base` — also deletes trained content

## Voice AI / LC Phone

Not fetched this pass. Intro pages exist at `/docs/ghl/voice-ai/voice-ai-api` and `/docs/ghl/phone-system/lc-phone-api-v-3`.

## ClientPortal AI

Lets you create ClientPortal apps within a sub-account, modify them, and track builds. Notable detail: an agent writes the code, and runs are started with `externalAgent: true`. Auth: sub-account access token (Marketplace app OAuth token or Private Integration Token). No endpoint list fetched (index sub-page not located this pass).

---

## Gaps / follow-ups

Several module index pages returned only the generic site shell ("App Marketplace | CRM Apps & Integrations") instead of real content — this happened for: Campaigns, Custom Menus (both slug guesses), Custom Fields V2 (both guesses), Emails (both guesses), Email ISV, Surveys, Voice AI, LC Phone, Associations sub-pages. This is either because (a) the guessed URL slug was wrong, or (b) WebFetch occasionally got a cached/redirected homepage instead of the real page. **To fill these in:** open the module's intro page in a real browser, click into the sidebar entry for the module name (not "Introduction"), and copy the resulting URL — then re-fetch that exact URL.

For any endpoint actually being implemented, always open its individual page directly (e.g. `/docs/ghl/chat-widget/update-chat-widget`) to get the real request body schema, query params, and response shape — the section-index pages never include that level of detail.
