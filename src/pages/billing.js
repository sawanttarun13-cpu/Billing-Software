/* ============================================================
   GroceryBill Pro — Billing / POS Page v2
   ============================================================ */

let _cart = [];
let _activeCategory = 'All';
let _searchTerm = '';
let _discountVal = 0;
let _discountType = 'pct';
let _customer = '';
let _customerId = null;
let _paymentMode = 'Cash';

function renderBilling() {
  _cart = [];
  _activeCategory = 'All';
  _searchTerm = '';
  _discountVal = 0;
  _customer = '';
  _customerId = null;
  _paymentMode = 'Cash';

  const holdBills = DB.getHoldBills();

  const html = `
    <div class="billing-layout">
      <!-- Left: Products -->
      <div class="billing-left">
        <div class="search-bar" style="margin-bottom:10px;gap:8px">
          <div class="search-input-wrap" style="flex:1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input class="form-input" id="product-search" placeholder="Search products… (type to filter)" oninput="billingSearch(this.value)" />
          </div>
          ${holdBills.length > 0 ? `
            <button class="btn btn-outline btn-sm" onclick="showHoldBillPicker()" id="hold-resume-btn">
              📋 On Hold (${holdBills.length})
            </button>
          ` : ''}
        </div>
        <div class="category-tabs" id="cat-tabs"></div>
        <div class="product-grid" id="product-grid"></div>
      </div>

      <!-- Right: Cart -->
      <div class="billing-right">
        <div class="cart-header">
          <span>🛒 Cart</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="holdCurrentBill()" id="hold-btn" title="Hold this bill">⏸ Hold</button>
            <button class="btn btn-ghost btn-sm" onclick="clearCart()" id="clear-cart-btn">✕ Clear</button>
          </div>
        </div>
        <div id="cart-body" class="cart-items">
          <div class="empty-cart">
            <div class="empty-cart-icon">🛒</div>
            <p>Click on a product to add it to the cart</p>
          </div>
        </div>
        <div class="cart-footer" id="cart-footer" style="display:none">
          <!-- Customer picker -->
          <div style="margin-bottom:10px;position:relative">
            <input class="form-input" id="customer-name" placeholder="Customer name (type to search DB)" oninput="custAutofill(this.value)" autocomplete="off" style="font-size:0.82rem;padding:8px 12px" />
            <div id="cust-suggestions" style="position:absolute;top:100%;left:0;right:0;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);z-index:50;display:none;max-height:150px;overflow-y:auto"></div>
          </div>

          <!-- Payment Mode -->
          <div style="display:flex;gap:6px;margin-bottom:10px" id="payment-mode-row">
            ${['Cash','UPI','Card','Credit'].map(m => `
              <button class="btn btn-sm ${m === 'Cash' ? 'btn-primary' : 'btn-ghost'}" id="pm-${m}" onclick="setPaymentMode('${m}')">${m}</button>
            `).join('')}
          </div>

          <!-- Discount -->
          <div class="discount-row">
            <input type="number" class="form-input" id="discount-input" placeholder="Discount" min="0" style="flex:1" oninput="applyDiscount(this.value)" />
            <select class="form-input" id="discount-type" style="width:80px" onchange="changeDiscountType(this.value)">
              <option value="pct">%</option>
              <option value="flat">₹</option>
            </select>
            <button class="btn btn-ghost btn-sm" onclick="openCashCalculator()" title="Cash & Change Calculator">🧮</button>
          </div>

          <div class="cart-row"><span>Subtotal</span><span id="subtotal-val">₹0.00</span></div>
          <div class="cart-row" id="discount-row-display" style="display:none"><span>Discount</span><span id="discount-disp" style="color:var(--danger)">-₹0.00</span></div>
          <div class="cart-row"><span>Tax (<span id="tax-rate-label">5</span>%)</span><span id="tax-val">₹0.00</span></div>
          <div class="cart-row total"><span>TOTAL</span><span id="grand-total-val">₹0.00</span></div>
          <button class="btn btn-primary btn-block btn-lg mt-8" onclick="checkoutBilling()" id="checkout-btn">
            🧾 Generate Bill
          </button>
        </div>
      </div>
    </div>

    <!-- Cash Calculator Modal (inline) -->
    <div id="cash-calc-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:2000;align-items:center;justify-content:center">
      <div class="modal" style="max-width:360px">
        <div class="modal-header">
          <h3>🧮 Cash Calculator</h3>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('cash-calc-modal').style.display='none'">✕</button>
        </div>
        <div style="padding:20px">
          <div class="form-group">
            <label class="form-label">Bill Total</label>
            <input class="form-input" id="cc-total" readonly style="font-size:1.1rem;font-weight:700;color:var(--accent)" />
          </div>
          <div class="form-group">
            <label class="form-label">Cash Received</label>
            <input class="form-input" id="cc-received" type="number" min="0" placeholder="0.00" oninput="calcChange()" style="font-size:1.1rem" autofocus />
          </div>
          <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:16px;text-align:center;margin-top:4px">
            <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:6px">Change to Return</div>
            <div id="cc-change" style="font-size:2rem;font-weight:800;color:var(--success)">₹0.00</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px" id="cc-quick">
          </div>
        </div>
      </div>
    </div>

    <!-- Hold Bill Picker Modal -->
    <div id="hold-picker-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);z-index:2000;align-items:center;justify-content:center">
      <div class="modal" style="max-width:500px">
        <div class="modal-header">
          <h3>📋 On-Hold Bills</h3>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('hold-picker-modal').style.display='none'">✕</button>
        </div>
        <div style="padding:20px" id="hold-picker-body"></div>
      </div>
    </div>
  `;

  document.getElementById('page-content').innerHTML = html;
  renderCategoryTabs();
  renderProductGrid();
  updateCartDisplay();
}

/* ── Customer Autofill ─────────────────────────────────────── */
function custAutofill(val) {
  _customer = val;
  _customerId = null;
  const sug = document.getElementById('cust-suggestions');
  if (!val.trim()) { sug.style.display = 'none'; return; }
  const matches = DB.getCustomers().filter(c =>
    c.name.toLowerCase().includes(val.toLowerCase()) || (c.phone || '').includes(val)
  ).slice(0, 5);
  if (matches.length === 0) { sug.style.display = 'none'; return; }
  sug.style.display = 'block';
  sug.innerHTML = matches.map(c => `
    <div style="padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border);font-size:0.85rem;transition:background 0.15s"
         onmouseenter="this.style.background='var(--surface3)'" onmouseleave="this.style.background=''"
         onclick="selectCustomer('${c.id}','${c.name.replace(/'/g,"\\'")}')">
      <div style="font-weight:600">${c.name}</div>
      <div style="color:var(--text3);font-size:0.75rem">${c.phone || ''} · ⭐ ${c.points || 0} pts</div>
    </div>
  `).join('');
}

function selectCustomer(id, name) {
  _customerId = id;
  _customer = name;
  const input = document.getElementById('customer-name');
  if (input) input.value = name;
  const sug = document.getElementById('cust-suggestions');
  if (sug) sug.style.display = 'none';
  showToast(`Customer: ${name} selected ✅`, 'info');
}

/* ── Payment Mode ─────────────────────────────────────────── */
function setPaymentMode(mode) {
  _paymentMode = mode;
  ['Cash','UPI','Card','Credit'].forEach(m => {
    const btn = document.getElementById('pm-' + m);
    if (btn) {
      btn.className = `btn btn-sm ${m === mode ? 'btn-primary' : 'btn-ghost'}`;
    }
  });
}

/* ── Category / Search ───────────────────────────────────── */
function renderCategoryTabs() {
  const cats = ['All', ...DB.getCategories()];
  const html = cats.map(c => `
    <div class="cat-tab ${c === _activeCategory ? 'active' : ''}" onclick="filterCategory('${c}')">${c}</div>
  `).join('');
  const el = document.getElementById('cat-tabs');
  if (el) el.innerHTML = html;
}

function filterCategory(cat) {
  _activeCategory = cat;
  renderCategoryTabs();
  renderProductGrid();
}

function billingSearch(term) {
  _searchTerm = term.toLowerCase();
  renderProductGrid();
}

function renderProductGrid() {
  const products = DB.getProducts().filter(p => {
    const matchCat = _activeCategory === 'All' || p.category === _activeCategory;
    const matchSearch = !_searchTerm || p.name.toLowerCase().includes(_searchTerm) || p.category.toLowerCase().includes(_searchTerm);
    return matchCat && matchSearch;
  });

  const el = document.getElementById('product-grid');
  if (!el) return;

  if (products.length === 0) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="es-icon">📦</div><div>No products found</div></div>';
    return;
  }

  const s = DB.getSettings();
  el.innerHTML = products.map(p => `
    <div class="product-card ${p.stock <= 0 ? 'out-of-stock' : ''}" onclick="addToCart('${p.id}')" title="${p.name} — ${s.currency}${p.price}/${p.unit}">
      <span class="pc-emoji">${p.emoji || '🛒'}</span>
      <div class="pc-name">${p.name}</div>
      <div class="pc-price">${s.currency}${Number(p.price).toFixed(2)}</div>
      <div class="pc-unit">per ${p.unit}</div>
      ${p.stock <= (s.lowStockThreshold || 10) && p.stock > 0
        ? `<div style="position:absolute;top:6px;right:6px;font-size:0.6rem;background:rgba(245,166,35,0.2);color:var(--warn);padding:2px 5px;border-radius:4px;font-weight:700">Low:${p.stock}</div>`
        : ''
      }
    </div>
  `).join('');
}

/* ── Cart ─────────────────────────────────────────────────── */
function addToCart(productId) {
  const product = DB.getProducts().find(p => p.id === productId);
  if (!product) return;
  const existing = _cart.find(c => c.id === productId);
  if (existing) {
    existing.qty++;
    existing.total = +(existing.qty * existing.price).toFixed(2);
  } else {
    _cart.push({ id: product.id, name: product.name, price: product.price, costPrice: product.costPrice || 0, qty: 1, unit: product.unit, total: product.price });
  }
  updateCartDisplay();
  showToast(`${product.name} added`, 'info');
}

function changeQty(id, delta) {
  const item = _cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) _cart = _cart.filter(c => c.id !== id);
  else item.total = +(item.qty * item.price).toFixed(2);
  updateCartDisplay();
}

function removeFromCart(id) {
  _cart = _cart.filter(c => c.id !== id);
  updateCartDisplay();
}

function clearCart() {
  _cart = [];
  _discountVal = 0;
  _customer = '';
  _customerId = null;
  const di = document.getElementById('discount-input');
  if (di) di.value = '';
  const cn = document.getElementById('customer-name');
  if (cn) cn.value = '';
  updateCartDisplay();
}

function applyDiscount(val) {
  _discountVal = parseFloat(val) || 0;
  updateCartTotals();
}

function changeDiscountType(type) {
  _discountType = type;
  updateCartTotals();
}

function updateCartDisplay() {
  const cartBody = document.getElementById('cart-body');
  const cartFooter = document.getElementById('cart-footer');
  if (!cartBody) return;

  if (_cart.length === 0) {
    cartBody.innerHTML = `<div class="empty-cart"><div class="empty-cart-icon">🛒</div><p>Click on a product to add it to the cart</p></div>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  if (cartFooter) cartFooter.style.display = 'block';
  const s = DB.getSettings();

  cartBody.innerHTML = _cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${s.currency}${Number(item.price).toFixed(2)} / ${item.unit}</div>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty('${item.id}', -1)">−</button>
        <span class="qty-val">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <div class="cart-item-total">${s.currency}${item.total.toFixed(2)}</div>
      <button class="cart-remove" onclick="removeFromCart('${item.id}')" title="Remove">✕</button>
    </div>
  `).join('');

  updateCartTotals();
}

function updateCartTotals() {
  const s = DB.getSettings();
  const curr = s.currency;
  const taxRate = s.taxRate / 100;
  const subtotal = _cart.reduce((sum, i) => sum + i.total, 0);
  let discount = _discountType === 'pct'
    ? +(subtotal * (_discountVal / 100)).toFixed(2)
    : Math.min(_discountVal, subtotal);
  const taxable = subtotal - discount;
  const tax = +(taxable * taxRate).toFixed(2);
  const grand = +(taxable + tax).toFixed(2);

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('subtotal-val', `${curr}${subtotal.toFixed(2)}`);
  set('tax-val', `${curr}${tax.toFixed(2)}`);
  set('grand-total-val', `${curr}${grand.toFixed(2)}`);
  set('tax-rate-label', s.taxRate);

  const discRow = document.getElementById('discount-row-display');
  if (discRow) discRow.style.display = discount > 0 ? 'flex' : 'none';
  set('discount-disp', `-${curr}${discount.toFixed(2)}`);
}

/* ── Hold Bills ───────────────────────────────────────────── */
function holdCurrentBill() {
  if (_cart.length === 0) { showToast('Cart is empty — nothing to hold', 'error'); return; }
  const holdData = { cart: _cart, customer: _customer, customerId: _customerId, discountVal: _discountVal, discountType: _discountType, paymentMode: _paymentMode };
  const holdId = DB.holdBill(holdData);
  showToast('Bill put on hold ⏸', 'info');
  clearCart();
  renderBilling(); // refresh to show hold count
}

function showHoldBillPicker() {
  const holds = DB.getHoldBills();
  const s = DB.getSettings();
  const modal = document.getElementById('hold-picker-modal');
  const body = document.getElementById('hold-picker-body');
  if (!modal || !body) return;

  body.innerHTML = holds.length === 0
    ? '<div class="empty-state"><div>No bills on hold</div></div>'
    : holds.map(h => {
        const subtotal = (h.cart || []).reduce((s, i) => s + i.total, 0);
        return `
          <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);margin-bottom:8px;border:1px solid var(--border)">
            <div style="flex:1">
              <div style="font-weight:600">${h.customer || 'Walk-in'}</div>
              <div style="font-size:0.78rem;color:var(--text3)">${(h.cart||[]).length} items · ${s.currency}${subtotal.toFixed(2)} · ${DB.formatDate(h.heldAt)}</div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="resumeHold('${h.holdId}')">▶ Resume</button>
            <button class="btn btn-danger btn-sm" onclick="discardHold('${h.holdId}')">🗑</button>
          </div>
        `;
      }).join('');

  modal.style.display = 'flex';
}

function resumeHold(holdId) {
  const held = DB.resumeHoldBill(holdId);
  if (!held) return;
  _cart = held.cart || [];
  _customer = held.customer || '';
  _customerId = held.customerId || null;
  _discountVal = held.discountVal || 0;
  _discountType = held.discountType || 'pct';
  _paymentMode = held.paymentMode || 'Cash';
  document.getElementById('hold-picker-modal').style.display = 'none';
  updateCartDisplay();
  const di = document.getElementById('discount-input');
  if (di && _discountVal) di.value = _discountVal;
  const cn = document.getElementById('customer-name');
  if (cn && _customer) cn.value = _customer;
  setPaymentMode(_paymentMode);
  showToast(`Bill for "${_customer || 'Walk-in'}" resumed ✅`, 'success');
  renderBilling();
  // Re-apply state after re-render
  setTimeout(() => {
    _cart = held.cart || [];
    _customer = held.customer || '';
    _customerId = held.customerId || null;
    _discountVal = held.discountVal || 0;
    _discountType = held.discountType || 'pct';
    _paymentMode = held.paymentMode || 'Cash';
    updateCartDisplay();
    const di2 = document.getElementById('discount-input');
    if (di2 && _discountVal) di2.value = _discountVal;
    const cn2 = document.getElementById('customer-name');
    if (cn2 && _customer) cn2.value = _customer;
    setPaymentMode(_paymentMode);
  }, 50);
}

function discardHold(holdId) {
  DB.deleteHoldBill(holdId);
  showHoldBillPicker();
  renderBilling();
  showToast('Hold bill discarded', 'info');
}

/* ── Cash Calculator ──────────────────────────────────────── */
function openCashCalculator() {
  const s = DB.getSettings();
  const taxRate = s.taxRate / 100;
  const subtotal = _cart.reduce((sum, i) => sum + i.total, 0);
  let discount = _discountType === 'pct' ? +(subtotal * (_discountVal / 100)).toFixed(2) : Math.min(_discountVal, subtotal);
  const taxable = subtotal - discount;
  const grand = +(taxable + taxable * taxRate).toFixed(2);

  const modal = document.getElementById('cash-calc-modal');
  const totalInput = document.getElementById('cc-total');
  const quickDiv = document.getElementById('cc-quick');
  if (totalInput) totalInput.value = `${s.currency}${grand.toFixed(2)}`;

  // Quick amount buttons
  const rounds = [50, 100, 200, 500, 1000, 2000].filter(v => v >= grand);
  if (quickDiv) quickDiv.innerHTML = rounds.slice(0, 6).map(v => `
    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('cc-received').value=${v};calcChange()">${s.currency}${v}</button>
  `).join('');

  if (modal) modal.style.display = 'flex';
  setTimeout(() => { const r = document.getElementById('cc-received'); if (r) { r.value = ''; r.focus(); } }, 50);
  window._calcTotal = grand;
  window._calcCurr = s.currency;
}

function calcChange() {
  const received = parseFloat(document.getElementById('cc-received')?.value) || 0;
  const total = window._calcTotal || 0;
  const change = received - total;
  const curr = window._calcCurr || '₹';
  const el = document.getElementById('cc-change');
  if (el) {
    el.textContent = `${curr}${Math.max(0, change).toFixed(2)}`;
    el.style.color = change < 0 ? 'var(--danger)' : 'var(--success)';
    if (change < 0) el.textContent = `Need ${curr}${Math.abs(change).toFixed(2)} more`;
  }
}

/* ── Checkout ─────────────────────────────────────────────── */
function checkoutBilling() {
  if (_cart.length === 0) { showToast('Cart is empty!', 'error'); return; }
  const s = DB.getSettings();
  const taxRate = s.taxRate / 100;
  const subtotal = +_cart.reduce((sum, i) => sum + i.total, 0).toFixed(2);
  let discount = _discountType === 'pct'
    ? +(subtotal * (_discountVal / 100)).toFixed(2)
    : Math.min(+(_discountVal).toFixed(2), subtotal);
  const taxable = subtotal - discount;
  const tax = +(taxable * taxRate).toFixed(2);
  const total = +(taxable + tax).toFixed(2);

  const custName = (document.getElementById('customer-name')?.value || _customer || 'Walk-in Customer').trim();

  const bill = DB.saveBill({
    customer: custName,
    customerId: _customerId,
    items: _cart.map(i => ({ ...i })),
    subtotal, discount,
    discountType: _discountType,
    tax, taxRate: s.taxRate,
    total,
    paymentMode: _paymentMode,
  });

  // Award loyalty points (1 point per ₹10 spent)
  if (_customerId) {
    DB.addCustomerPoints(_customerId, Math.floor(total / 10));
  }

  showToast(`Bill ${bill.billNo} generated! ✅`, 'success');
  showInvoiceModal(bill);
  _cart = [];
  _discountVal = 0;
  _customer = '';
  _customerId = null;
  updateCartDisplay();
}
