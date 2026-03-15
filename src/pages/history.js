/* ============================================================
   GroceryBill Pro — Bill History Page
   ============================================================ */

let _historySearch = '';
let _historyDateFrom = '';
let _historyDateTo = '';
let _historyPage = 1;
const HISTORY_PER_PAGE = 15;

function renderHistory() {
  _historySearch = '';
  _historyDateFrom = '';
  _historyDateTo = '';
  _historyPage = 1;

  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const html = `
    <div class="history-filters">
      <div class="form-group">
        <label class="form-label">From Date</label>
        <input class="form-input" type="date" id="hist-from" value="${monthAgo}" onchange="histFilter()" />
      </div>
      <div class="form-group">
        <label class="form-label">To Date</label>
        <input class="form-input" type="date" id="hist-to" value="${today}" onchange="histFilter()" />
      </div>
      <div class="search-input-wrap" style="flex:1;min-width:200px;align-self:flex-end">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" placeholder="Search by bill no. or customer…" oninput="histSearch(this.value)" />
      </div>
      <div style="align-self:flex-end">
        <button class="btn btn-ghost btn-sm" onclick="histClearFilter()">Clear Filters</button>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="card-title" id="hist-count-title">All Bills</div>
        <div id="hist-stats" style="font-size:0.85rem;color:var(--text3)"></div>
      </div>
      <div class="table-wrap" id="history-table-wrap"></div>
      <div id="history-pagination" style="display:flex;justify-content:center;gap:8px;padding:16px"></div>
    </div>
  `;

  document.getElementById('page-content').innerHTML = html;
  histFilter();
}

function histSearch(val) {
  _historySearch = val.toLowerCase();
  _historyPage = 1;
  renderHistoryTable();
}

function histFilter() {
  _historyDateFrom = document.getElementById('hist-from').value;
  _historyDateTo = document.getElementById('hist-to').value;
  _historyPage = 1;
  renderHistoryTable();
}

function histClearFilter() {
  _historySearch = '';
  _historyDateFrom = '';
  _historyDateTo = '';
  const fi = document.getElementById('hist-from');
  const ti = document.getElementById('hist-to');
  if (fi) fi.value = '';
  if (ti) ti.value = '';
  _historyPage = 1;
  renderHistoryTable();
}

function getFilteredBills() {
  return DB.getBills().filter(b => {
    const bDate = new Date(b.date);
    if (_historyDateFrom) {
      const from = new Date(_historyDateFrom); from.setHours(0, 0, 0, 0);
      if (bDate < from) return false;
    }
    if (_historyDateTo) {
      const to = new Date(_historyDateTo); to.setHours(23, 59, 59, 999);
      if (bDate > to) return false;
    }
    if (_historySearch) {
      const match = b.billNo.toLowerCase().includes(_historySearch) ||
        (b.customer || '').toLowerCase().includes(_historySearch);
      if (!match) return false;
    }
    return true;
  });
}

function renderHistoryTable() {
  const bills = getFilteredBills();
  const s = DB.getSettings();
  const curr = s.currency;
  const total = bills.reduce((sum, b) => sum + b.total, 0);

  const countTitle = document.getElementById('hist-count-title');
  if (countTitle) countTitle.textContent = `${bills.length} Bill${bills.length !== 1 ? 's' : ''} Found`;

  const statsEl = document.getElementById('hist-stats');
  if (statsEl) statsEl.textContent = `Total: ${curr}${total.toFixed(2)}`;

  const wrap = document.getElementById('history-table-wrap');
  if (!wrap) return;

  if (bills.length === 0) {
    wrap.innerHTML = '<div class="empty-state"><div class="es-icon">🧾</div><div>No bills matched your filters</div></div>';
    document.getElementById('history-pagination').innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(bills.length / HISTORY_PER_PAGE);
  const pageBills = bills.slice((_historyPage - 1) * HISTORY_PER_PAGE, _historyPage * HISTORY_PER_PAGE);

  wrap.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Bill No.</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Date & Time</th>
          <th>Mode</th>
          <th>Total</th>
          <th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${pageBills.map(b => `
          <tr class="row-link" onclick="viewHistoryBill('${b.id}')">
            <td><span class="badge badge-accent">${b.billNo}</span></td>
            <td style="font-weight:600">${b.customer || 'Walk-in Customer'}</td>
            <td><span class="text-muted">${b.items.length} item${b.items.length !== 1 ? 's' : ''}</span></td>
            <td style="color:var(--text2);font-size:0.82rem">${DB.formatDate(b.date)}</td>
            <td><span class="badge ${b.paymentMode === 'Cash' ? 'badge-green' : 'badge-blue'}">${b.paymentMode || 'Cash'}</span></td>
            <td class="fw-700 text-accent">${curr}${Number(b.total).toFixed(2)}</td>
            <td style="text-align:right" onclick="event.stopPropagation()">
              <button class="btn btn-ghost btn-sm" onclick="viewHistoryBill('${b.id}')">👁️ View</button>
              <button class="btn btn-outline btn-sm" onclick="reprintBill('${b.id}')">🖨️</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  // Pagination
  const pageEl = document.getElementById('history-pagination');
  if (totalPages <= 1) { pageEl.innerHTML = ''; return; }
  let pgHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pgHTML += `<button class="btn ${i === _historyPage ? 'btn-primary' : 'btn-ghost'} btn-sm" onclick="histGoPage(${i})">${i}</button>`;
  }
  pageEl.innerHTML = pgHTML;
}

function histGoPage(p) {
  _historyPage = p;
  renderHistoryTable();
}

function viewHistoryBill(id) {
  const bill = DB.getBills().find(b => b.id === id);
  if (bill) showInvoiceModal(bill);
}

function reprintBill(id) {
  const bill = DB.getBills().find(b => b.id === id);
  if (bill) {
    _currentPrintBill = bill;
    printInvoice();
  }
}
