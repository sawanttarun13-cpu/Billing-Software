/* ============================================================
   GroceryBill Pro — Reports Page
   ============================================================ */

function renderReports() {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const html = `
    <!-- Report Tabs -->
    <div class="category-tabs" style="margin-bottom:20px" id="report-tabs">
      <div class="cat-tab active" onclick="switchReport('gst', this)">📄 GST Report</div>
      <div class="cat-tab" onclick="switchReport('revenue', this)">📈 Revenue</div>
      <div class="cat-tab" onclick="switchReport('category', this)">📦 By Category</div>
      <div class="cat-tab" onclick="switchReport('stock', this)">⚠️ Stock Status</div>
      <div class="cat-tab" onclick="switchReport('profit', this)">💰 Profit</div>
    </div>

    <!-- Date Range (shared) -->
    <div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:24px;flex-wrap:wrap" id="report-filter">
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">From</label>
        <input class="form-input" type="date" id="rep-from" value="${monthStart}" onchange="renderActiveReport()" />
      </div>
      <div class="form-group" style="margin-bottom:0">
        <label class="form-label">To</label>
        <input class="form-input" type="date" id="rep-to" value="${today}" onchange="renderActiveReport()" />
      </div>
      <button class="btn btn-ghost btn-sm" onclick="setDatePreset('today')">Today</button>
      <button class="btn btn-ghost btn-sm" onclick="setDatePreset('week')">This Week</button>
      <button class="btn btn-ghost btn-sm" onclick="setDatePreset('month')">This Month</button>
      <button class="btn btn-ghost btn-sm" onclick="setDatePreset('year')">This Year</button>
    </div>

    <div id="report-content"></div>
  `;

  document.getElementById('page-content').innerHTML = html;
  window._activeReport = 'gst';
  renderActiveReport();
}

function setDatePreset(preset) {
  const today = new Date();
  let from, to = today.toISOString().split('T')[0];
  if (preset === 'today') {
    from = to;
  } else if (preset === 'week') {
    const d = new Date(today); d.setDate(today.getDate() - today.getDay());
    from = d.toISOString().split('T')[0];
  } else if (preset === 'month') {
    from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  } else if (preset === 'year') {
    from = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  }
  document.getElementById('rep-from').value = from;
  document.getElementById('rep-to').value = to;
  renderActiveReport();
}

function switchReport(name, el) {
  document.querySelectorAll('#report-tabs .cat-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  window._activeReport = name;
  renderActiveReport();
}

function renderActiveReport() {
  const from = document.getElementById('rep-from')?.value;
  const to = document.getElementById('rep-to')?.value;
  const report = window._activeReport || 'gst';
  const el = document.getElementById('report-content');
  if (!el) return;

  if (report === 'gst')      el.innerHTML = buildGSTReport(from, to);
  else if (report === 'revenue') el.innerHTML = buildRevenueReport();
  else if (report === 'category') el.innerHTML = buildCategoryReport(from, to);
  else if (report === 'stock')  el.innerHTML = buildStockReport();
  else if (report === 'profit') el.innerHTML = buildProfitReport(from, to);
}

/* ── GST Report ───────────────────────────────────────────── */
function buildGSTReport(from, to) {
  const data = DB.getGSTReport(from, to);
  const s = DB.getSettings();
  const curr = s.currency;

  const byRateRows = Object.values(data.byRate).map(r => `
    <tr>
      <td><span class="badge badge-blue">${r.rate}%</span></td>
      <td>${r.count} bills</td>
      <td>${curr}${r.taxable.toFixed(2)}</td>
      <td class="fw-700 text-accent">${curr}${r.tax.toFixed(2)}</td>
      <td>${curr}${r.total.toFixed(2)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">No bills in selected range</td></tr>`;

  const billRows = data.bills.slice(0, 20).map(b => `
    <tr onclick="showInvoiceModal(${JSON.stringify(b).replace(/"/g,'&quot;')})" class="row-link">
      <td><span class="badge badge-accent">${b.billNo}</span></td>
      <td style="font-size:0.82rem;color:var(--text2)">${DB.formatDate(b.date)}</td>
      <td>${curr}${(b.subtotal - b.discount).toFixed(2)}</td>
      <td>${b.taxRate || s.taxRate}%</td>
      <td class="fw-700">${curr}${b.tax.toFixed(2)}</td>
      <td class="fw-700 text-accent">${curr}${b.total.toFixed(2)}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">No bills in selected range</td></tr>`;

  return `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card green">
        <span class="stat-icon">🧾</span>
        <div class="stat-value">${data.count}</div>
        <div class="stat-label">Total Bills</div>
      </div>
      <div class="stat-card blue">
        <span class="stat-icon">📋</span>
        <div class="stat-value">${curr}${data.taxableTotal.toFixed(2)}</div>
        <div class="stat-label">Taxable Amount</div>
      </div>
      <div class="stat-card orange">
        <span class="stat-icon">🏛️</span>
        <div class="stat-value">${curr}${data.taxTotal.toFixed(2)}</div>
        <div class="stat-label">Total GST Collected</div>
      </div>
      <div class="stat-card red">
        <span class="stat-icon">💰</span>
        <div class="stat-value">${curr}${data.grandTotal.toFixed(2)}</div>
        <div class="stat-label">Grand Total</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1.6fr;gap:20px">
      <div class="card">
        <div class="card-header"><div class="card-title">GST by Tax Rate</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Rate</th><th>Bills</th><th>Taxable</th><th>GST</th><th>Total</th></tr></thead>
            <tbody>${byRateRows}</tbody>
          </table>
        </div>
        <div style="margin-top:16px;padding:14px;background:var(--surface2);border-radius:var(--radius-sm);border:1px solid var(--border)">
          <div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;font-weight:700;margin-bottom:8px">GSTIN: ${s.gstin || 'Not Set'}</div>
          <div style="font-size:0.8rem;color:var(--text2)">CGST: ${curr}${(data.taxTotal / 2).toFixed(2)}</div>
          <div style="font-size:0.8rem;color:var(--text2)">SGST: ${curr}${(data.taxTotal / 2).toFixed(2)}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">Bill Wise GST</div><span class="badge badge-blue">Showing latest 20</span></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Bill No.</th><th>Date</th><th>Taxable</th><th>Rate</th><th>GST</th><th>Total</th></tr></thead>
            <tbody>${billRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ── Revenue Report ───────────────────────────────────────── */
function buildRevenueReport() {
  const data = DB.getMonthlyRevenue();
  const s = DB.getSettings();
  const curr = s.currency;
  const weekData = DB.getWeekRevenue();
  const maxRev = Math.max(...data.map(d => d.revenue), 1);

  const monthRows = [...data].reverse().map(m => `
    <tr>
      <td style="font-weight:600">${m.label}</td>
      <td>${m.count} bills</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;height:6px;background:var(--surface2);border-radius:10px;overflow:hidden">
            <div style="width:${(m.revenue/maxRev*100).toFixed(1)}%;height:100%;background:var(--accent);border-radius:10px"></div>
          </div>
          <span class="fw-700 text-accent">${curr}${m.revenue.toFixed(2)}</span>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="3" style="text-align:center;color:var(--text3);padding:20px">No data yet</td></tr>`;

  return `
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><div class="card-title">📈 Monthly Revenue (Last 12 Months)</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Month</th><th>Bills</th><th>Revenue</th></tr></thead>
          <tbody>${monthRows}</tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">📊 Last 7 Days</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Day</th><th>Revenue</th><th>Est. Profit</th></tr></thead>
          <tbody>
            ${weekData.map(d => `
              <tr>
                <td style="font-weight:600">${d.label}</td>
                <td class="text-accent fw-700">${curr}${d.rev.toFixed(2)}</td>
                <td class="text-success">${curr}${d.profit.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Category Report ──────────────────────────────────────── */
function buildCategoryReport(from, to) {
  const data = DB.getCategoryRevenue();
  const s = DB.getSettings();
  const curr = s.currency;
  const maxRev = Math.max(...data.map(d => d.revenue), 1);
  const total = data.reduce((s, d) => s + d.revenue, 0);

  const rows = data.map((d, i) => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:#000">${i+1}</div>
          <span style="font-weight:600">${d.category}</span>
        </div>
      </td>
      <td>${d.qty} units</td>
      <td>${(d.revenue / total * 100).toFixed(1)}%</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="flex:1;height:6px;background:var(--surface2);border-radius:10px;overflow:hidden">
            <div style="width:${(d.revenue/maxRev*100).toFixed(1)}%;height:100%;background:var(--accent);border-radius:10px"></div>
          </div>
          <span class="fw-700 text-accent">${curr}${d.revenue.toFixed(2)}</span>
        </div>
      </td>
    </tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--text3);padding:20px">No sales data yet</td></tr>`;

  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">📦 Revenue by Category</div>
        <span class="badge badge-accent">Total: ${curr}${total.toFixed(2)}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Category</th><th>Qty Sold</th><th>Share</th><th>Revenue</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Stock Status Report ──────────────────────────────────── */
function buildStockReport() {
  const products = DB.getProducts();
  const lowStock = DB.getLowStockProducts();
  const outOfStock = DB.getOutOfStockProducts();
  const stockLog = DB.getStockLog().slice(0, 20);
  const s = DB.getSettings();

  const lowRows = lowStock.map(p => `
    <tr>
      <td>${p.emoji || '📦'} ${p.name}</td>
      <td><span class="badge badge-blue">${p.category}</span></td>
      <td>${p.unit}</td>
      <td><span class="badge badge-orange">⚠️ ${p.stock}</span></td>
      <td><button class="btn btn-ghost btn-sm" onclick="openStockAdjust('${p.id}','${p.name.replace(/'/g,"\\'")}',${p.stock})">+ Adjust</button></td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--success);padding:20px">✅ All products are well stocked</td></tr>`;

  const outRows = outOfStock.map(p => `
    <tr>
      <td>${p.emoji || '📦'} ${p.name}</td>
      <td><span class="badge badge-blue">${p.category}</span></td>
      <td><span class="badge badge-red">Out of Stock</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="openStockAdjust('${p.id}','${p.name.replace(/'/g,"\\'")}',0)">Restock</button></td>
    </tr>
  `).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--success);padding:20px">✅ No items out of stock</td></tr>`;

  const logRows = stockLog.map(l => `
    <tr>
      <td style="font-weight:600">${l.productName}</td>
      <td><span class="badge ${l.delta >= 0 ? 'badge-green' : 'badge-red'}">${l.delta >= 0 ? '+' : ''}${l.delta}</span></td>
      <td>${l.oldStock} → ${l.newStock}</td>
      <td style="color:var(--text3)">${l.reason}</td>
      <td style="font-size:0.78rem;color:var(--text3)">${DB.formatDate(l.date)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">No stock movements yet</td></tr>`;

  return `
    <div class="stats-grid" style="margin-bottom:20px;grid-template-columns:repeat(3,1fr)">
      <div class="stat-card green"><span class="stat-icon">📦</span><div class="stat-value">${products.length}</div><div class="stat-label">Total Products</div></div>
      <div class="stat-card orange"><span class="stat-icon">⚠️</span><div class="stat-value">${lowStock.length}</div><div class="stat-label">Low Stock Items</div></div>
      <div class="stat-card red"><span class="stat-icon">🚫</span><div class="stat-value">${outOfStock.length}</div><div class="stat-label">Out of Stock</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div class="card">
        <div class="card-header"><div class="card-title">⚠️ Low Stock</div></div>
        <div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Unit</th><th>Stock</th><th></th></tr></thead><tbody>${lowRows}</tbody></table></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title">🚫 Out of Stock</div></div>
        <div class="table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Status</th><th></th></tr></thead><tbody>${outRows}</tbody></table></div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">📜 Stock Movement Log</div><span class="badge badge-blue">Last 20</span></div>
      <div class="table-wrap"><table><thead><tr><th>Product</th><th>Change</th><th>Stock</th><th>Reason</th><th>Date</th></tr></thead><tbody>${logRows}</tbody></table></div>
    </div>
  `;
}

/* ── Profit Report ────────────────────────────────────────── */
function buildProfitReport(from, to) {
  const gstData = DB.getGSTReport(from, to);
  const s = DB.getSettings();
  const curr = s.currency;
  let bills = gstData.bills;

  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const totalCost = bills.reduce((s, b) => s + b.items.reduce((sp, it) => sp + ((it.costPrice || 0) * it.qty), 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitPct = totalRevenue > 0 ? (totalProfit / totalRevenue * 100).toFixed(1) : '0.0';

  const prodMap = {};
  bills.forEach(b => b.items.forEach(it => {
    if (!prodMap[it.name]) prodMap[it.name] = { name: it.name, revenue: 0, cost: 0, qty: 0 };
    prodMap[it.name].revenue += it.total;
    prodMap[it.name].cost += ((it.costPrice || 0) * it.qty);
    prodMap[it.name].qty += it.qty;
  }));
  const prodRows = Object.values(prodMap)
    .map(p => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue * 100).toFixed(1) : '0.0' }))
    .sort((a, b) => b.profit - a.profit)
    .map(p => `
      <tr>
        <td style="font-weight:600">${p.name}</td>
        <td>${p.qty} units</td>
        <td>${curr}${p.revenue.toFixed(2)}</td>
        <td>${curr}${p.cost.toFixed(2)}</td>
        <td class="fw-700 text-success">${curr}${p.profit.toFixed(2)}</td>
        <td><span class="badge ${p.margin >= 20 ? 'badge-green' : p.margin >= 10 ? 'badge-orange' : 'badge-red'}">${p.margin}%</span></td>
      </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">No data in selected range</td></tr>`;

  return `
    <div class="stats-grid" style="margin-bottom:20px">
      <div class="stat-card green"><span class="stat-icon">💰</span><div class="stat-value">${curr}${totalRevenue.toFixed(2)}</div><div class="stat-label">Total Revenue</div></div>
      <div class="stat-card blue"><span class="stat-icon">🏭</span><div class="stat-value">${curr}${totalCost.toFixed(2)}</div><div class="stat-label">Total Cost</div></div>
      <div class="stat-card orange"><span class="stat-icon">📈</span><div class="stat-value">${curr}${totalProfit.toFixed(2)}</div><div class="stat-label">Gross Profit</div></div>
      <div class="stat-card red"><span class="stat-icon">%</span><div class="stat-value">${profitPct}%</div><div class="stat-label">Profit Margin</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">💰 Profit by Product</div></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Qty</th><th>Revenue</th><th>Cost</th><th>Profit</th><th>Margin</th></tr></thead>
          <tbody>${prodRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

/* ── Stock Adjust (used from Reports & Products) ──────────── */
function openStockAdjust(productId, productName, currentStock) {
  document.getElementById('product-modal-title').textContent = 'Adjust Stock';
  document.getElementById('product-modal-body').innerHTML = `
    <div style="text-align:center;padding:10px 0 20px">
      <div style="font-size:2rem">📦</div>
      <div style="font-weight:700;font-size:1rem;margin-top:6px">${productName}</div>
      <div style="color:var(--text3);font-size:0.85rem">Current Stock: <strong>${currentStock}</strong></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Adjustment Type</label>
        <select class="form-select" id="adj-type">
          <option value="add">➕ Add Stock (Restock)</option>
          <option value="sub">➖ Remove Stock (Damage/Loss)</option>
          <option value="set">🔄 Set Exact Stock</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Quantity</label>
        <input class="form-input" id="adj-qty" type="number" min="0" placeholder="0" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Reason</label>
      <input class="form-input" id="adj-reason" placeholder="e.g. Restock from supplier, Damaged goods…" />
    </div>
    <div class="action-row">
      <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
      <button class="btn btn-primary" onclick="doStockAdjust('${productId}', ${currentStock})">✅ Apply</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function doStockAdjust(productId, currentStock) {
  const type = document.getElementById('adj-type').value;
  const qty = parseInt(document.getElementById('adj-qty').value, 10);
  const reason = document.getElementById('adj-reason').value.trim() || 'Manual Adjustment';
  if (isNaN(qty) || qty < 0) { showToast('Enter a valid quantity', 'error'); return; }
  let delta;
  if (type === 'add') delta = qty;
  else if (type === 'sub') delta = -qty;
  else delta = qty - currentStock; // set exact
  DB.adjustStock(productId, delta, reason);
  closeProductModal();
  showToast('Stock updated ✅', 'success');
  // Refresh current page
  if (window._activeReport) renderActiveReport();
  else renderProducts();
}
