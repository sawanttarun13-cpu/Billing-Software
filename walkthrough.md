# Grocery Billing Software — Walkthrough

## What Was Built

A **fully self-contained grocery shop billing app** built with Vanilla HTML + CSS + JavaScript. No build tools, no backend, no installation required — just open [index.html](file:///c:/Users/Tarun/OneDrive/Desktop/Antigravity/index.html) in any browser.

### 🔒 Multi-User Data Separation
The application now supports multiple registered users via Supabase Authentication. When a user logs in:
- A unique identifier (`session.user.id`) is retrieved.
- All browser storage keys (products, bills, customers, settings, etc.) are dynamically prefixed with the user's ID (e.g., `UID_gb_products`).
- This ensures that **each user gets their own isolated workspace** — User A's bills, products, and shop settings will remain completely separate from User B's, effectively making it a scalable multi-tenant billing software.

## Project Structure

```
Antigravity/
├── index.html              ← App shell: sidebar, topbar, modals
└── src/
    ├── style.css           ← Full design system (dark theme, glassmorphism)
    ├── db.js               ← localStorage data layer + 24 seed products
    ├── invoice.js          ← Invoice HTML builder + print popup
    ├── main.js             ← SPA router, sidebar toggle, clock, toasts
    └── pages/
        ├── dashboard.js    ← Stats, SVG revenue chart, top products
        ├── billing.js      ← POS: product grid, cart, discount, checkout
        ├── products.js     ← CRUD table, add/edit modal, CSV export
        ├── history.js      ← Paginated bill history, date filter, reprint
        └── settings.js     ← Shop info, tax, currency, accent color
```

## Features

| Page | Features |
|---|---|
| **Dashboard** | 4 stat cards (today revenue, bills, products, total), 7-day revenue canvas chart, top 5 products by revenue, recent bills table |
| **New Bill (POS)** | Product search, category tabs, emoji product cards, cart with qty controls, discount (% or flat), auto tax, customer name, PDF-quality invoice |
| **Products** | Sortable table, category badge, stock level indicator, add/edit modal, delete confirm, CSV export |
| **Bill History** | Paginated table (15/page), date-range filter, live search, click-to-view invoice, reprint button |
| **Settings** | Shop name/address/GSTIN/phone, tax rate, currency, accent color picker with 6 presets, danger zone (clear bills, reset products) |

## How to Open

```
# Option 1: Double-click index.html (opens in browser)
# Option 2: Via local server (already running):
http://localhost:8765

# Start server manually:
cd c:\Users\Tarun\OneDrive\Desktop\Antigravity
python -m http.server 8765
```

## Keyboard Shortcut
- `Ctrl+B` → Jump to New Bill (POS)
- `Escape` → Close any open modal

## Data Persistence
All data (products, bills, settings) is stored in **browser localStorage** — survives page refreshes. No internet connection required after the first load (Google Fonts may not load offline, but the app works).
