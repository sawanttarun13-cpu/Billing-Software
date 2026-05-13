# Phase 1 — Fix Now ✅

- [x] **db.js** — Add `invoicePrefix`/`billCounter` to DEFAULT_SETTINGS
- [x] **db.js** — Fix `saveBill()`: persisted counter + category snapshot on items
- [x] **db.js** — Fix `getCategoryRevenue()`: accept `from/to` + use `it.category`
- [x] **settings.js** — Add `lowStockThreshold` + editable `invoicePrefix` fields
- [x] **settings.js** — Fix `saveSettingsForm()` to persist new fields (spread existing)
- [x] **billing.js** — Fix `clearCart()`: reset `_discountType` + DOM select
- [x] **billing.js** — Fix `resumeHold()`: remove double-render hack
- [x] **reports.js** — Fix `buildCategoryReport()`: pass `from/to` to DB
- [x] **style.css** — Add `.stat-trend` + `.mt-6` CSS classes

---

# Phase 2 — High Priority ✅

- [x] **utils.js** — Create `safeText()` XSS helper (new file)
- [x] **index.html** — Add favicon + load `utils.js` before page scripts
- [x] **billing.js** — Fix `custAutofill()`: DOM nodes instead of innerHTML onclick
- [x] **dashboard.js** — Add debounced `resize` listener to reflow canvas chart
- [x] **.gitignore** — Add dev artifacts (BILL.pdf, walkthrough files)

---

# Phase 3 — Medium Priority ✅

- [x] **db.js** — Add `redeemCustomerPoints()` function
- [x] **billing.js** — Add loyalty points redemption UI at checkout
- [x] **billing.js** — Add Bill Notes / Remarks field
- [x] **invoice.js** — Render `bill.note` on invoice if present
- [x] **history.js** — Add CSV export button for bills
- [x] **customers.js** — Add CSV export button for customers

---

# Phase 5 — Cloud Synchronization ✅

- [x] **supabase DB** — Schema already had all 5 tables (`products`, `bills`, `customers`, `settings`, `stock_log`) with RLS enabled
- [x] **supabase DB** — Migration: added `invoice_prefix`, `bill_counter` to `settings`; `loyalty_discount`, `redeemed_points`, `note` to `bills`; `image_data` to `products`
- [x] **supabase RLS** — Re-created all 5 policies with `WITH CHECK (auth.uid() = user_id)` for INSERT security hardening
- [x] **src/sync.js** — NEW: Offline-First Cloud Sync Engine (field mapping, pullAll, pushAll, per-entity upsert/delete/insert)
- [x] **src/db.js** — All writes go to localStorage first (instant UX), then fire async cloud sync via `Sync.*`
- [x] **src/db.js** — `init()` now accepts supabase client, triggers `Sync.pullAll()` (cloud = source of truth on login)
- [x] **src/db.js** — `_setProducts/Bills/Customers/Settings` internal setters exposed for Sync engine
- [x] **src/db.js** — `saveSettings` debounced 800ms to avoid spamming cloud on bill counter increments
- [x] **src/main.js** — `initAuth` async: imports supabase client, passes to `DB.init()`, re-renders after cloud pull
- [x] **index.html** — `sync.js` loaded before `db.js`
- [x] **UI** — Floating sync badge (bottom-right): ☁️ Syncing… → ✅ Synced → ⚠️ Error / 📴 Offline
