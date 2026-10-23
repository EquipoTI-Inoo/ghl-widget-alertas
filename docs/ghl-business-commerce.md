# GoHighLevel Marketplace API — Business / Commerce / Content Modules

Source: https://marketplace.gohighlevel.com/docs (v3 API reference). Fetched 2026-10-23.

## How this doc site is structured (important for future crawling)

This is a ReadMe.io-style reference. Every module has three layers of pages:
1. **Introduction page** (e.g. `.../countdown-timer/countdown-timer-api-v-3`) — only covers auth scheme and the `/v3` route prefix. No endpoints.
2. **Index/category page** (e.g. `.../countdown-timer/countdown-timers`) — lists endpoint titles + 1-line summaries + links, but **no HTTP method, no full path, no schema**.
3. **Per-endpoint page** (e.g. `.../countdown-timer/create-countdown-timer`) — has the actual method, path, params, and request/response schema. These were NOT individually fetched in this pass (would be 150+ extra pages across just these 22 modules); only Countdown Timer, Files, Payments-Integrations, Products, Invoices, Snapshots, Workflows, Users, Businesses, and Media were drilled one level past the index.

## Universal authentication pattern (same across every module)

All v3 endpoints use **HTTP Bearer auth, JWT format**. Token sources, repeated verbatim across modules:
- "Use the Access Token generated with user type as Sub-Account (OR) Private Integration Token of Sub-Account."
- "Use the Access Token generated with user type as Agency (OR) Private Integration Token of Agency."

Route convention: "All APIs available via `/v3` route prefix with AIP-compliant responses."

Projects API additionally documents (likely true platform-wide, just stated explicitly there):
- Must send header `Version: v3` on every request.
- App callers must pass `locationId` as a **query parameter**, never in path/body/headers.
- Create operations return HTTP 200 (not 201) with the created resource.
- Responses use `id`, not `_id`.
- HTTP 429 = back off and retry.
- Pagination styles vary by resource: `limit`+base64 `cursor` (folders/lists), `limit`+base64url `searchAfter` (tasks), or `skip`+`limit` where skip must be a multiple of limit (comments/users).

---

## Countdown Timer API ⭐ (closest GHL analog to a popup/alert widget)

Intro: `/docs/ghl/countdown-timer/countdown-timer-api-v-3`
Index: `/docs/ghl/countdown-timer/countdown-timers`

Endpoints (titles only — method/path not resolved from index page):
- List Countdown Timers — paginated list of timers for the token's location
- Create Countdown Timer — creates a timer for the token's location
- List Timer Templates — available templates with default design configuration
- Get Countdown Timer — retrieve one by ID
- Update Countdown Timer
- Delete Countdown Timer (soft delete)

**Not found on the pages fetched**: no embed `<script>`/HTML snippet, no funnel/website element-binding mechanism, no JSON schema for the timer object (start/end/evergreen/redirect), no customId. GHL's countdown timer is almost certainly rendered as a **native page-builder element** (inserted via the funnel/website drag-and-drop editor, referencing a `timerId`) rather than via a public embeddable `<script>` tag — i.e. it is *not* a general-purpose external widget-injection mechanism. This means it is **not a reusable pattern for embedding a custom popup/alert widget into a GHL page** the way, e.g., Intercom/Crisp-style chat widgets work. If a true external embeddable widget pattern exists in GHL, it's more likely under **Chat Widget** or **Custom Menus** (not covered in this document — see other modules).

To get the real embed mechanism, fetch the per-endpoint pages (especially "Create Countdown Timer" and "Update Countdown Timer" for the request schema) plus check whether GHL funnels support a generic "Custom JS/HTML" element outside the Countdown Timer API.

---

## Affiliate Manager API
Intro: `/docs/ghl/affiliate-manager/affiliate-manager-api-v-3`
Sub-sections (sidebar, not individually fetched): Campaigns, Affiliates, Customers, Payouts, Affiliate Media, Commissions, Payout Methods.

## AI Agent Studio API
Intro: `/docs/ghl/agent-studio/agent-studio-apis`
Sub-sections: Flow Agents (`/docs/ghl/agent-studio/agents`), Managed Agents (`/docs/ghl/agent-studio/managed-agents`).

## Blogs API
Intro: `/docs/ghl/blogs/blogs-api`
Sub-sections: Blogs, Blog Posts, Blog Categories, Blog Authors.

## Brand Boards API
Intro: `/docs/ghl/brand-boards/brand-boards-api-v-3`
Sub-sections: Brand Voices, Design Kits.

## Business API
Intro: `/docs/ghl/businesses/business-api`
Endpoints (from index `/docs/ghl/businesses/businesses`):
- `Update Business` — `/docs/ghl/businesses/update-business`
- `Delete Business` — `/docs/ghl/businesses/delete-business`
- `Get Business` — `/docs/ghl/businesses/get-business`
- `Get Businesses by Location` — `/docs/ghl/businesses/get-businesses-by-location`
- `Create Business` — `/docs/ghl/businesses/create-business`

## Courses API
Intro: `/docs/ghl/courses/courses-api-v-3`
Sub-sections: Course Import, Progress, Products, Quiz, Assessment, Assignment, Category, Lesson, Offer, Enrollment.

## Files API
Intro: `/docs/ghl/files/files-api`
Index (`/docs/ghl/files/files`) has exactly **one** endpoint:
- `Get File` (by slug) — `/docs/ghl/files/get-file-by-slug`

## Invoice API
Intro: `/docs/ghl/invoices/invoice-api`
Endpoints (from index `/docs/ghl/invoices/invoice`):
- Generate Invoice Number — next invoice number for a location
- Get Invoice Settings — settings for a location
- Get Invoice (by ID)
- Update Invoice (by ID)
- Delete Invoice (by ID)
- Update Invoice Late Fees Configuration (by ID)
- Void Invoice (by ID)
- Send Invoice (by ID)
- Record a Manual Payment for an Invoice (by ID)
- Update Invoice Last Visited At (by ID)
- Create Invoice
- List Invoices

Sidebar also has separate sub-sections not drilled: Template, Schedule, Text2Pay, Estimate.

## Sub-Account (formerly Location) API
Intro: `/docs/ghl/locations/sub-account-formerly-location-api`
Sidebar sub-sections: Custom Field, Custom Value, Template, Recurring Tasks, Conversation Channel, Search, Sub-Account (Formerly Location), Tags, Permissions, Tasks Search, Timezone.
Note: doc header shows both v3 and a legacy "1.0" version for this module specifically.

## Media Storage API
Intro: `/docs/ghl/medias/media-storage-api`
Endpoints (from index `/docs/ghl/medias/media-files-folders`):
- Get List of Files/Folders — `/docs/ghl/medias/fetch-media-content`
- Upload File into Media Storage — `/docs/ghl/medias/upload-media-content` — **25 MB cap (500 MB for video)**; if `hosted=true` then `fileUrl` is required, otherwise `file` is required
- Delete File or Folder — `/docs/ghl/medias/delete-media-content`
- Update File/Folder — `/docs/ghl/medias/update-media-object`
- Create Folder — `/docs/ghl/medias/create-media-folder`
- Bulk Update Files/Folders — `/docs/ghl/medias/bulk-update-media-objects`
- Bulk Delete/Trash Files/Folders — `/docs/ghl/medias/bulk-delete-media-objects`

## Objects (Custom Objects) API
Intro: `/docs/ghl/objects/custom-objects-api`
Sidebar sub-sections: Object Schema, Records, Search Object Records, Notes.

## Payments API
Intro: `/docs/ghl/payments/payments-api`
Sub-sections (sidebar): Integrations, Orders, Order Fulfillments, Order Notes, Transactions, Subscriptions, Coupons, Custom Provider.
Integrations page (`/docs/ghl/payments/integrations`) endpoints:
- **Create White-label Integration Provider** — `/docs/ghl/payments/create-integration-provider` — adds a payment provider integration built on **Authorize.net or NMI**; callable only with a marketplace-app token.
- **List White-label Integration Providers** — `/docs/ghl/payments/list-integration-providers` — paginated, filterable by provider name.

## Products API
Intro: `/docs/ghl/products/products-api`
Endpoints (from index `/docs/ghl/products/products`):
- Bulk Update Products — `/docs/ghl/products/bulk-update` — price/availability/collections/deletion in bulk
- Bulk Edit Products and Prices — `/docs/ghl/products/bulk-edit` — max 30 entities per call
- Get Product by ID — `/docs/ghl/products/get-product-by-id`
- Delete Product by ID — `/docs/ghl/products/delete-product-by-id`
- Update Product by ID — `/docs/ghl/products/update-product-by-id`
- Create Product — `/docs/ghl/products/create-product`
- List Products — `/docs/ghl/products/list-invoices` *(note: slug says "list-invoices" — looks like a copy/paste artifact in GHL's own docs, not a typo on our part)*

Sidebar also covers: Prices, Store, Collections, Reviews (not drilled).

## Projects API
Intro: `/docs/ghl/projects/projects-api`
Path prefix: `/projects/*`. Scopes found:
- `projects/workspace.*`
- `projects/tasks.*`
- `projects/tasks.recurring.*`
- `projects/tasks.comments.*`

Sub-sections: Spaces, Folders, Lists, Statuses, Tasks, Additional Lists, Comments, Recurring Tasks.

## Proposals (Documents and Contracts) API
Intro: `/docs/ghl/proposals/documents-and-contracts-api`
Sub-sections: Documents, Templates.

## SaaS API
Intro: `/docs/ghl/saas-api/saas-api`
Next page in nav: `/docs/ghl/saas-api/saa-s` (the actual "SaaS" endpoint index — not drilled).

## Snapshots API
Intro: `/docs/ghl/snapshots/snapshots-api`
Endpoints (from index `/docs/ghl/snapshots/snapshots`):
- Get Snapshots — `/docs/ghl/snapshots/get-custom-snapshots` — all snapshots, own + imported
- Create Snapshot Share Link — `/docs/ghl/snapshots/create-snapshot-share-link`
- Get Snapshot Push Between Dates — `/docs/ghl/snapshots/get-snapshot-push` — sub-accounts that received a push in a time window
- Get Last Snapshot Push — `/docs/ghl/snapshots/get-latest-snapshot-push` — latest push status for a locationId

## Social Planner API
Intro: `/docs/ghl/social-planner/social-planner-api-v-3`
Sub-sections: Post, Account, CSV, Statistics, OAuth | Generic, Comments, Category, Tag, Watermarks, OAuth | Community, Category Queue.

## Store API
Intro: `/docs/ghl/store/store-api`
Sub-sections: Shipping Zone, Shipping Zone Rates, Shipping Carrier, Store Setting.

## Users API
Intro: `/docs/ghl/users/users-api-v-3`
Endpoints (from index `/docs/ghl/users/users`):
- Get User — `/docs/ghl/users/get-user`
- Update User — `/docs/ghl/users/update-user`
- Delete User — `/docs/ghl/users/delete-user`
- Create User — `/docs/ghl/users/create-user`
- Search — `/docs/ghl/users/search` (listed in sidebar, not in the index card list)

## Workflows API
Intro: `/docs/ghl/workflows/workflows-api-v-3`
**Limited availability**: only enabled for selected sub-accounts; others get HTTP 403 with error code `WORKFLOW_API_NOT_ENABLED_FOR_LOCATION`.
Endpoints (from index `/docs/ghl/workflows/workflows`):
- Get Step Types — `/docs/ghl/workflows/get-workflow-step-types`
- Validate Workflow Definition — `/docs/ghl/workflows/validate-workflow-definition`
- Create Workflow — `/docs/ghl/workflows/create-workflow`
- Get Workflow Definition — `/docs/ghl/workflows/get-workflow-definition`
- Update Workflow Definition — `/docs/ghl/workflows/update-workflow-definition`
- Update Workflow Status — `/docs/ghl/workflows/update-workflow-status`
- Search Workflows — `/docs/ghl/workflows/search-workflows`
- Delete Workflow — `/docs/ghl/workflows/delete-workflow`
- Get Workflow Logs — `/docs/ghl/workflows/get-workflow-logs`
- Get Workflow Log Statistics — `/docs/ghl/workflows/get-workflow-log-statistics`
- Get Workflow (**deprecated**) — `/docs/ghl/workflows/get-workflow`

---

## Gaps / what to fetch next if deeper detail is needed
No OAuth **scope strings** (the `products.readonly`-style identifiers needed when registering a Marketplace app) were found on any of these 22 intro pages except Projects. Scope strings are likely listed on the main OAuth 2.0 page (`/docs/ghl/oauth/oauth-2-0-v-3`) as a master table, not per-module — check that page directly.
