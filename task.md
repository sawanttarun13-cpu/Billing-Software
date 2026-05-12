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

# Phase 3 — Medium Priority

- [ ] **db.js** — Add `redeemCustomerPoints()` function
- [ ] **billing.js** — Add loyalty points redemption UI at checkout
- [ ] **billing.js** — Add Bill Notes / Remarks field
- [ ] **invoice.js** — Render `bill.note` on invoice if present
- [ ] **history.js** — Add CSV export button for bills
- [ ] **customers.js** — Add CSV export button for customers
