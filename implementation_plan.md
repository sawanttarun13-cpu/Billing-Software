# GroceryBill Pro — Bug Fixes & Production Readiness Plan

Full audit of all source files completed. Every issue below is mapped to the exact file and lines confirmed during review.

---

## Open Questions

> [!IMPORTANT]
> **Before proceeding, please clarify:**
>
> 1. **Scope for this session** — The full list is large. Should we implement *all four phases* in one go, or would you prefer to approve and execute one phase at a time?
> 2. **Bill number counter** — For the persisted sequential counter fix (Bug #3), should the counter survive a "Clear All Bills" reset (i.e., keep counting from where it left off), or should it reset to 1001 when bills are cleared?
> 3. **Category stored on bill items** — For Bug #7 (deleted products fall into "Other"), storing the category on each new bill item going forward is safe. Do you also want a one-time migration that patches *existing* bill items using the current product list, or is "going forward only" acceptable?
> 4. **Loyalty redemption** — For the loyalty points redemption feature, what is the conversion rate? (e.g., 100 pts = ₹10 discount?)

---

## Proposed Changes by Phase

---

### 🔴 Phase 1 — Fix Now (Critical + CSS)

#### [MODIFY] [db.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/db.js)

**Bug #3 — Fragile bill number counter**
- Add a `billCounter` key to `BASE_KEYS` and `DEFAULT_SETTINGS`
- Replace `list.length + 1` logic in `saveBill()` with a persisted, auto-incrementing counter stored in settings:
  ```js
  // Before (line 200):
  bill.billNo = 'GB-' + String(1000 + list.length + 1).padStart(4, '0');
  // After:
  const s = getSettings();
  const next = (s.billCounter || 1000) + 1;
  bill.billNo = (s.invoicePrefix || 'GB-') + String(next).padStart(4, '0');
  saveSettings({ ...s, billCounter: next });
  ```

**Bug #7 — Category lost on deleted products**
- In `getCategoryRevenue()`: change to accept optional `from/to` date params
- Store category on each bill item at save time in `saveBill()`:
  ```js
  // In saveBill, enrich items with category snapshot
  bill.items = bill.items.map(it => {
    if (!it.category) {
      const prod = getProducts().find(p => p.id === it.id);
      it.category = prod ? prod.category : 'Other';
    }
    return it;
  });
  ```
- Update `getCategoryRevenue(from, to)` to use `it.category` from the bill item directly (with fallback to product lookup), and filter by date range

#### [MODIFY] [settings.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/pages/settings.js)

**Bug #1 — `lowStockThreshold` dropped on save**
- Add `lowStockThreshold` input field to the Billing Settings card (between Tax Rate and Currency)
- Add `invoicePrefix` input field (replacing the disabled hardcoded one)
- In `saveSettingsForm()`, include both in the saved object:
  ```js
  lowStockThreshold: parseInt(document.getElementById('s-lowStock').value) || 10,
  invoicePrefix: document.getElementById('s-invoicePrefix').value.trim() || 'GB-',
  ```

#### [MODIFY] [billing.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/pages/billing.js)

**Bug #4 — `clearCart()` doesn't reset `_discountType`**
- Add `_discountType = 'pct';` and reset the `<select>` DOM element:
  ```js
  function clearCart() {
    _cart = [];
    _discountVal = 0;
    _discountType = 'pct';   // ← ADD THIS
    _customer = '';
    _customerId = null;
    const di = document.getElementById('discount-input');
    if (di) di.value = '';
    const dt = document.getElementById('discount-type');
    if (dt) dt.value = 'pct'; // ← AND THIS
    const cn = document.getElementById('customer-name');
    if (cn) cn.value = '';
    updateCartDisplay();
  }
  ```

**Bug #5 — `resumeHold()` double-render hack**
- Remove the `renderBilling(true)` call + the `setTimeout` block
- Set all state variables first, then call `renderBilling(true)` exactly once, then re-apply DOM values in a single pass after render:
  ```js
  function resumeHold(holdId) {
    const held = DB.resumeHoldBill(holdId);
    if (!held) return;
    // 1. Set state
    _cart = held.cart || [];
    _customer = held.customer || '';
    _customerId = held.customerId || null;
    _discountVal = held.discountVal || 0;
    _discountType = held.discountType || 'pct';
    _paymentMode = held.paymentMode || 'Cash';
    document.getElementById('hold-picker-modal').style.display = 'none';
    // 2. Render once
    renderBilling(true);
    // 3. Apply DOM inputs (DOM now exists)
    const di = document.getElementById('discount-input');
    if (di && _discountVal) di.value = _discountVal;
    const cn = document.getElementById('customer-name');
    if (cn && _customer) cn.value = _customer;
    setPaymentMode(_paymentMode);
    showToast(`Bill for "${_customer || 'Walk-in'}" resumed ✅`, 'success');
  }
  ```

#### [MODIFY] [reports.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/pages/reports.js)

**Bug #2 — Category Report date filter ignored**
- Update `buildCategoryReport(from, to)` to pass `from/to` to `DB.getCategoryRevenue(from, to)` (after db.js is updated to accept those params)

#### [MODIFY] [style.css](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/style.css)

**Bug #8 — `.stat-trend` class missing**
- The dashboard uses `class="stat-trend up/down/neutral"` but only `.stat-change.up/.down` is defined
- Add `.stat-trend` rules mirroring `.stat-change`:
  ```css
  .stat-trend { font-size: 0.78rem; margin-top: 8px; font-weight: 600; }
  .stat-trend.up      { color: var(--success); }
  .stat-trend.down    { color: var(--danger); }
  .stat-trend.neutral { color: var(--text3); }
  ```

**Bug #9 — `.mt-6` utility class missing**
- Add `.mt-6 { margin-top: 1.5rem; }` alongside existing `.mt-8` and `.mt-16`

---

### 🟠 Phase 2 — High Priority

#### [MODIFY] [billing.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/pages/billing.js)

**Bug #6 — XSS in `custAutofill()` `onclick` attributes**
- Replace `innerHTML` suggestion list with `document.createElement` + `addEventListener`:
  ```js
  function custAutofill(val) {
    // ...
    sug.innerHTML = '';  // clear safely
    matches.forEach(c => {
      const div = document.createElement('div');
      div.style.cssText = '...';
      div.innerHTML = `<div style="font-weight:600">${safeText(c.name)}</div>
                       <div style="...">${safeText(c.phone||'')} · ⭐ ${c.points||0} pts</div>`;
      div.addEventListener('click', () => selectCustomer(c.id, c.name));
      sug.appendChild(div);
    });
    sug.style.display = 'block';
  }
  ```

#### [NEW] `src/utils.js` — `safeText()` XSS helper

Add a global utility file included before all page scripts:
```js
window.safeText = function(str) {
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
};
```
Also add to `index.html` as `<script src="src/utils.js"></script>` before other scripts.

#### [MODIFY] [dashboard.js](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/src/pages/dashboard.js)

**Bug #10 — Canvas chart doesn't reflow on window resize**
- Add a debounced `resize` listener that calls `drawRevenueChart()` if the user is on the dashboard:
  ```js
  let _resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if (document.getElementById('revChart')) drawRevenueChart();
    }, 150);
  });
  ```

#### [MODIFY] [index.html](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/index.html)

**Bug #13 — No favicon**
- Add a favicon using a data URI emoji favicon (no extra file needed):
  ```html
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛒</text></svg>" />
  ```

**Minor — Dev artifacts in repo**
- `BILL.pdf`, `walkthrough.md`, `walkthrough 2` should be added to `.gitignore`

#### [MODIFY] [.gitignore](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/.gitignore)

- Add `BILL.pdf`, `walkthrough.md`, `walkthrough 2`, `*.pdf` to `.gitignore`

---

### 🟡 Phase 3 — Medium Priority

#### Loyalty Points Redemption

**[MODIFY] billing.js**
- Add a "Redeem Points" button next to the customer name field (visible only when `_customerId` is set and customer has points ≥ 100)
- On click: show available points, offer redemption at configurable rate (e.g., 100 pts = ₹10)
- Deduct from customer points on checkout via `DB.redeemCustomerPoints(customerId, points)`

**[MODIFY] db.js**
- Add `redeemCustomerPoints(customerId, pointsToRedeem)` function

#### Bill Notes / Remarks Field

**[MODIFY] billing.js**
- Add a small textarea in the cart footer (below discount row): "Bill Note / Remarks (optional)"
- Include `note` field in the bill object passed to `DB.saveBill()`

**[MODIFY] invoice.js**
- Render the `bill.note` field on the invoice if present

#### Bills & Customers CSV Export

**[MODIFY] pages/history.js**
- Add "Export CSV" button that exports visible filtered bills to CSV (with BOM prefix like products.js already does)

**[MODIFY] pages/customers.js**
- Add "Export CSV" button mirroring the products page pattern

#### Invoice Prefix Setting (already partially in Phase 1)
- The `invoicePrefix` field added in settings Phase 1 feeds into the `saveBill()` counter fix — these two are coupled

---

### 🟢 Phase 4 — Nice to Have

#### PWA Manifest + Service Worker

**[NEW] `manifest.json`** (project root)
```json
{
  "name": "GroceryBill Pro",
  "short_name": "GBPro",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F8FAFC",
  "theme_color": "#22C55E",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192", "type": "image/png" }]
}
```

**[NEW] `sw.js`** — App-shell caching service worker

**[MODIFY] index.html** — Add `<link rel="manifest">` and SW registration script

#### Keyboard Shortcut Help Modal (`?` key)

**[MODIFY] main.js**
- Add `?` key listener that opens a modal listing all shortcuts:
  - `Ctrl+B` → New Bill
  - `Esc` → Close modal
  - Future additions

#### Payment Mode Breakdown Chart (Reports)

**[MODIFY] reports.js**
- Add a new "Payment" tab in Reports
- Draw a simple canvas donut/bar chart showing Cash vs UPI vs Card vs Credit split from filtered bills

---

## Verification Plan

### Automated / Self-Test
- After Phase 1: Open Settings, change `lowStockThreshold` to `5`, save — reload and verify it persists
- After Phase 1: Add 3 bills, clear all bills, add 1 new bill — verify bill number is `GB-1001` (not restarted from length)
- After Phase 1: Select `₹` discount type, add items, click Clear — verify discount type resets to `%`
- After Phase 1: Hold a bill with customer + discount, resume it — verify no flash and inputs fill correctly in one render
- After Phase 1: Navigate to Reports → By Category, change date range — verify results change

### Visual Checks
- Dashboard stat cards show trend arrows with correct color (green up, red down)
- `Recent Bills` card has visible top margin (`.mt-6` working)
- Resize browser window on Dashboard → chart redraws correctly
- Browser tab shows 🛒 favicon

### Build Check
```bash
# Serve locally and smoke-test
python -m http.server 8080
# or Live Server in VS Code
```
