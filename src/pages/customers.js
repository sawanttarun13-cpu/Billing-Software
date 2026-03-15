/* ============================================================
   GroceryBill Pro — Customers Page
   ============================================================ */

let _custSearch = '';
let _editingCustomer = null;

function renderCustomers() {
  _custSearch = '';
  _editingCustomer = null;

  const html = `
    <div class="page-header-bar">
      <div class="search-input-wrap" style="flex:1;max-width:400px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" placeholder="Search by name or phone…" oninput="custSearch(this.value)" />
      </div>
      <button class="btn btn-primary" onclick="openCustomerModal(null)" id="add-customer-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Customer
      </button>
    </div>

    <div id="customers-stats" style="margin-bottom:20px"></div>

    <div class="card">
      <div class="table-wrap" id="customers-table"></div>
    </div>

    <!-- Customer Detail Panel -->
    <div id="customer-detail" style="display:none;margin-top:20px"></div>
  `;

  document.getElementById('page-content').innerHTML = html;
  renderCustomerStats();
  renderCustomersTable();
}

function custSearch(val) {
  _custSearch = val.toLowerCase();
  renderCustomersTable();
}

function renderCustomerStats() {
  const customers = DB.getCustomers();
  const bills = DB.getBills();
  const totalRevenue = bills.reduce((s, b) => s + b.total, 0);
  const s = DB.getSettings();

  document.getElementById('customers-stats').innerHTML = `
    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card blue">
        <span class="stat-icon">👥</span>
        <div class="stat-value">${customers.length}</div>
        <div class="stat-label">Total Customers</div>
      </div>
      <div class="stat-card green">
        <span class="stat-icon">🏆</span>
        <div class="stat-value">${customers.reduce((s, c) => s + (c.points || 0), 0)}</div>
        <div class="stat-label">Total Loyalty Points</div>
      </div>
      <div class="stat-card orange">
        <span class="stat-icon">💰</span>
        <div class="stat-value">${s.currency}${totalRevenue.toFixed(0)}</div>
        <div class="stat-label">Total Revenue</div>
      </div>
    </div>
  `;
}

function renderCustomersTable() {
  const customers = DB.getCustomers().filter(c =>
    !_custSearch || c.name.toLowerCase().includes(_custSearch) || (c.phone || '').includes(_custSearch)
  );
  const bills = DB.getBills();
  const s = DB.getSettings();

  const el = document.getElementById('customers-table');
  if (!el) return;

  if (customers.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">👥</div><div>No customers found. Add your first customer!</div></div>';
    return;
  }

  const getBillCount = (name) => bills.filter(b => b.customer === name).length;
  const getSpend = (name) => bills.filter(b => b.customer === name).reduce((s, b) => s + b.total, 0);

  el.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Customer</th>
          <th>Phone</th>
          <th>Loyalty Points</th>
          <th>Bills</th>
          <th>Total Spent</th>
          <th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${customers.map(c => {
          const count = getBillCount(c.name);
          const spend = getSpend(c.name);
          return `
            <tr class="row-link" onclick="viewCustomerDetail('${c.id}')">
              <td>
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;color:#000;flex-shrink:0">${c.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style="font-weight:600">${c.name}</div>
                    <div style="font-size:0.75rem;color:var(--text3)">${c.email || 'No email'}</div>
                  </div>
                </div>
              </td>
              <td>${c.phone || '—'}</td>
              <td>
                <span class="badge badge-accent">⭐ ${c.points || 0} pts</span>
              </td>
              <td>${count} bill${count !== 1 ? 's' : ''}</td>
              <td class="fw-700 text-accent">${s.currency}${spend.toFixed(2)}</td>
              <td style="text-align:right" onclick="event.stopPropagation()">
                <button class="btn btn-ghost btn-sm" onclick="openCustomerModal(${JSON.stringify(c).replace(/"/g,'&quot;')})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="confirmDeleteCustomer('${c.id}','${c.name.replace(/'/g,"\\'")}')">🗑️</button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function viewCustomerDetail(id) {
  const customer = DB.getCustomers().find(c => c.id === id);
  if (!customer) return;
  const bills = DB.getCustomerBills(id);
  const s = DB.getSettings();
  const totalSpent = bills.reduce((sum, b) => sum + b.total, 0);

  const detailEl = document.getElementById('customer-detail');
  detailEl.style.display = 'block';
  detailEl.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:14px">
          <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:800;font-size:1.3rem;color:#000">${customer.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-size:1.1rem;font-weight:700">${customer.name}</div>
            <div style="font-size:0.82rem;color:var(--text3)">${customer.phone || ''} ${customer.email ? '· ' + customer.email : ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <span class="badge badge-accent">⭐ ${customer.points || 0} pts</span>
          <button class="btn btn-primary btn-sm" onclick="navigate('billing')">🧾 New Bill</button>
          <button class="btn btn-ghost btn-sm" onclick="document.getElementById('customer-detail').style.display='none'">✕ Close</button>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px">
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:800;color:var(--accent)">${s.currency}${totalSpent.toFixed(2)}</div>
          <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase">Total Spent</div>
        </div>
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:800">${bills.length}</div>
          <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase">Total Bills</div>
        </div>
        <div style="background:var(--surface2);border-radius:var(--radius-sm);padding:14px;text-align:center">
          <div style="font-size:1.4rem;font-weight:800">${s.currency}${bills.length ? (totalSpent / bills.length).toFixed(2) : '0.00'}</div>
          <div style="font-size:0.75rem;color:var(--text3);text-transform:uppercase">Avg Bill</div>
        </div>
      </div>

      <div class="card-title" style="margin-bottom:12px">Purchase History</div>
      ${bills.length === 0
        ? '<div class="empty-state"><div>No bills yet for this customer</div></div>'
        : `<div class="table-wrap">
            <table>
              <thead><tr><th>Bill No.</th><th>Date</th><th>Items</th><th>Amount</th><th></th></tr></thead>
              <tbody>
                ${bills.slice(0, 10).map(b => `
                  <tr class="row-link" onclick="showInvoiceModal(${JSON.stringify(b).replace(/"/g,'&quot;')})">
                    <td><span class="badge badge-accent">${b.billNo}</span></td>
                    <td style="color:var(--text2);font-size:0.82rem">${DB.formatDate(b.date)}</td>
                    <td>${b.items.length} items</td>
                    <td class="fw-700 text-accent">${s.currency}${b.total.toFixed(2)}</td>
                    <td><button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();showInvoiceModal(${JSON.stringify(b).replace(/"/g,'&quot;')})">View</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
      }
    </div>
  `;

  detailEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openCustomerModal(customer) {
  _editingCustomer = customer;
  const isEdit = !!customer;
  document.getElementById('product-modal-title').textContent = isEdit ? 'Edit Customer' : 'Add Customer';
  document.getElementById('product-modal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Full Name *</label>
        <input class="form-input" id="cm-name" value="${customer ? customer.name : ''}" placeholder="Customer name" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" id="cm-phone" value="${customer ? (customer.phone || '') : ''}" placeholder="+91 98765 43210" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Email</label>
      <input class="form-input" id="cm-email" value="${customer ? (customer.email || '') : ''}" placeholder="email@example.com" />
    </div>
    <div class="form-group">
      <label class="form-label">Address</label>
      <textarea class="form-textarea" id="cm-address" rows="2">${customer ? (customer.address || '') : ''}</textarea>
    </div>
    ${isEdit ? `
      <div class="form-group">
        <label class="form-label">Loyalty Points</label>
        <input class="form-input" id="cm-points" type="number" min="0" value="${customer.points || 0}" />
      </div>
    ` : ''}
    <div class="action-row">
      <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveCustomerForm()">${isEdit ? '💾 Save' : '➕ Add Customer'}</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function saveCustomerForm() {
  const name = document.getElementById('cm-name').value.trim();
  if (!name) { showToast('Customer name is required', 'error'); return; }
  const isEdit = !!_editingCustomer;
  const customer = {
    id: isEdit ? _editingCustomer.id : null,
    name,
    phone: document.getElementById('cm-phone').value.trim(),
    email: document.getElementById('cm-email').value.trim(),
    address: document.getElementById('cm-address').value.trim(),
    points: isEdit ? (parseInt(document.getElementById('cm-points').value) || 0) : 0,
  };
  if (isEdit) customer.createdAt = _editingCustomer.createdAt;
  DB.saveCustomer(customer);
  closeProductModal();
  showToast(`Customer "${name}" ${isEdit ? 'updated' : 'added'} ✅`, 'success');
  renderCustomers();
}

function confirmDeleteCustomer(id, name) {
  document.getElementById('product-modal-title').textContent = 'Delete Customer';
  document.getElementById('product-modal-body').innerHTML = `
    <p class="confirm-text">Delete customer <strong>"${name}"</strong>? Their bill history will remain.</p>
    <div class="action-row">
      <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteCustomer('${id}','${name.replace(/'/g,"\\'")}')">🗑️ Delete</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function doDeleteCustomer(id, name) {
  DB.deleteCustomer(id);
  closeProductModal();
  showToast(`Customer "${name}" deleted`, 'info');
  renderCustomers();
}
