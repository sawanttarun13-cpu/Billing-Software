/* ============================================================
   GroceryBill Pro — Products Management Page v2
   ============================================================ */

let _editingProduct = null;
let _productSearch = '';
let _productCategory = 'All';

function renderProducts() {
  _productSearch = '';
  _productCategory = 'All';

  const html = `
    <div class="page-header-bar">
      <div class="search-input-wrap" style="flex:1;max-width:300px">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input class="form-input" placeholder="Search products…" oninput="productSearch(this.value)" />
      </div>
      <select class="form-input" style="width:160px" onchange="productCategory(this.value)" id="prod-cat-select"></select>
      <div style="flex:1"></div>
      <button class="btn btn-outline" onclick="exportCSV()">📥 Export CSV</button>
      <button class="btn btn-primary" onclick="openProductModal(null)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Add Product
      </button>
    </div>
    <div class="card">
      <div class="table-wrap" id="products-table"></div>
    </div>
  `;
  document.getElementById('page-content').innerHTML = html;
  updateCategoryDropdown();
  renderProductsTable();
}

function updateCategoryDropdown() {
  const cats = ['All', ...DB.getCategories()];
  const sel = document.getElementById('prod-cat-select');
  if (sel) sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

function productSearch(val) {
  _productSearch = val.toLowerCase();
  renderProductsTable();
}
function productCategory(val) {
  _productCategory = val;
  renderProductsTable();
}

function renderProductsTable() {
  const s = DB.getSettings();
  let list = DB.getProducts();
  if (_productCategory !== 'All') list = list.filter(p => p.category === _productCategory);
  if (_productSearch) {
    list = list.filter(p => p.name.toLowerCase().includes(_productSearch) || p.category.toLowerCase().includes(_productSearch));
  }

  const el = document.getElementById('products-table');
  if (!el) return;

  if (list.length === 0) {
    el.innerHTML = '<div class="empty-state"><div class="es-icon">📦</div><div>No products found</div></div>';
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th style="text-align:right">Price</th>
          <th style="text-align:right">Cost & Margin</th>
          <th style="text-align:right">Stock</th>
          <th style="text-align:right">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(p => {
          let stockClass = p.stock > (s.lowStockThreshold || 10) ? 'badge-green' : p.stock > 0 ? 'badge-orange' : 'badge-red';
          let stockLabel = p.stock > (s.lowStockThreshold || 10) ? p.stock : p.stock > 0 ? `Low: ${p.stock}` : 'Out of Stock';

          const cost = p.costPrice || 0;
          const profit = p.price - cost;
          const pct = p.price > 0 ? (profit / p.price * 100).toFixed(1) : 0;
          let marginClass = pct >= 20 ? 'text-success' : pct >= 10 ? 'text-warn' : 'text-danger';

          return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:1.4rem">${p.emoji || '📦'}</span>
                <span style="font-weight:500">${p.name}</span>
              </div>
            </td>
            <td><span class="badge badge-blue">${p.category}</span></td>
            <td style="text-align:right;font-weight:600;color:var(--text1)">${s.currency}${Number(p.price).toFixed(2)} <span style="font-size:0.75rem;color:var(--text3);font-weight:400">/${p.unit}</span></td>
            <td style="text-align:right;">
              <div style="font-size:0.85rem">${s.currency}${Number(cost).toFixed(2)}</div>
              <div style="font-size:0.7rem;font-weight:700" class="${marginClass}">${pct}%</div>
            </td>
            <td style="text-align:right"><span class="badge ${stockClass}">${stockLabel}</span></td>
            <td style="text-align:right">
              <button class="btn btn-ghost btn-sm" title="Adjust Stock" onclick="openStockAdjust('${p.id}', '${p.name.replace(/'/g,"\\'")}', ${p.stock})">🔧</button>
              <button class="btn btn-ghost btn-sm" onclick="openProductModal(${JSON.stringify(p).replace(/"/g,'&quot;')})">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="confirmDeleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">🗑️</button>
            </td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  `;
  el.innerHTML = html;
}

function openProductModal(product) {
  _editingProduct = product;
  const isEdit = !!product;
  document.getElementById('product-modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';

  document.getElementById('product-modal-body').innerHTML = `
    <div class="form-row">
      <div class="form-group" style="flex:3">
        <label class="form-label">Product Name *</label>
        <input class="form-input" id="pm-name" value="${product ? product.name : ''}" placeholder="e.g. Basmati Rice" />
      </div>
      <div class="form-group" style="flex:1">
        <label class="form-label">Emoji</label>
        <input class="form-input" id="pm-emoji" value="${product ? product.emoji : '📦'}" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Category *</label>
        <input class="form-input" id="pm-cat" value="${product ? product.category : ''}" placeholder="e.g. Grains" list="cat-suggestions" />
        <datalist id="cat-suggestions">
          ${DB.getCategories().map(c => `<option value="${c}">`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">Unit *</label>
        <input class="form-input" id="pm-unit" value="${product ? product.unit : 'kg'}" placeholder="kg, L, doz, pkt" />
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Selling Price *</label>
        <input class="form-input" id="pm-price" type="number" step="0.01" value="${product ? product.price : ''}" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Cost Price</label>
        <input class="form-input" id="pm-cost" type="number" step="0.01" value="${product ? (product.costPrice || 0) : ''}" placeholder="0.00" />
      </div>
      <div class="form-group">
        <label class="form-label">Stock Qty *</label>
        <input class="form-input" id="pm-stock" type="number" value="${product ? product.stock : 0}" />
      </div>
    </div>
    <div class="action-row">
      <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProductForm()">${isEdit ? '💾 Save Changes' : '➕ Add Product'}</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

function saveProductForm() {
  const name = document.getElementById('pm-name').value.trim();
  const cat = document.getElementById('pm-cat').value.trim();
  const price = parseFloat(document.getElementById('pm-price').value);
  const cost = parseFloat(document.getElementById('pm-cost').value) || 0;
  const unit = document.getElementById('pm-unit').value.trim();
  const stock = parseInt(document.getElementById('pm-stock').value, 10);
  const emoji = document.getElementById('pm-emoji').value.trim() || '📦';

  if (!name || !cat || isNaN(price) || !unit || isNaN(stock)) {
    showToast('Please fill all required fields correctly', 'error');
    return;
  }

  const p = {
    id: _editingProduct ? _editingProduct.id : null,
    name, category: cat, price, costPrice: cost, unit, stock, emoji
  };

  DB.saveProduct(p);
  closeProductModal();
  updateCategoryDropdown();
  renderProductsTable();
  if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
  showToast(`Product ${name} saved! ✅`, 'success');
}

function confirmDeleteProduct(id, name) {
  document.getElementById('product-modal-title').textContent = 'Confirm Delete';
  document.getElementById('product-modal-body').innerHTML = `
    <p class="confirm-text">Are you sure you want to delete <strong>${name}</strong>? This cannot be undone.</p>
    <div class="action-row">
      <button class="btn btn-ghost" onclick="closeProductModal()">Cancel</button>
      <button class="btn btn-danger" onclick="doDeleteProduct('${id}','${name.replace(/'/g,"\\'")}')">🗑️ Delete</button>
    </div>
  `;
  document.getElementById('product-modal').style.display = 'flex';
}

function doDeleteProduct(id, name) {
  DB.deleteProduct(id);
  closeProductModal();
  updateCategoryDropdown();
  renderProductsTable();
  if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
  showToast(`${name} deleted`, 'info');
}

function exportCSV() {
  const list = DB.getProducts();
  if (list.length === 0) { showToast('No products to export', 'error'); return; }
  let csv = 'ID,Name,Category,Price,CostPrice,Unit,Stock\\n';
  list.forEach(p => {
    csv += `${p.id},"${p.name}","${p.category}",${p.price},${p.costPrice||0},${p.unit},${p.stock}\\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'grocerybill_products.csv');
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Products exported successfully! 📥', 'success');
}
