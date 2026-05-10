/* ============================================================
   GroceryBill Pro — Products Management Page v3
   ============================================================ */

let _editingProduct = null;
let _productSearch = '';
let _productCategory = 'All';
let _pendingImageData = null; // base64 string of the image being uploaded

// ── Helpers ──────────────────────────────────────────────── //

/** Returns an <img> or a colored initial-avatar for the product card */
function productThumb(p, size = 36) {
  if (p.image) {
    return `<img src="${p.image}" alt="${p.name}"
      style="width:${size}px;height:${size}px;object-fit:cover;
             border-radius:8px;border:1px solid var(--border);flex-shrink:0;">`;
  }
  // Colored initial avatar
  const colors = ['#22C55E','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899'];
  const color = colors[(p.name.charCodeAt(0) || 0) % colors.length];
  const initial = (p.name || '?')[0].toUpperCase();
  if (p.emoji && p.emoji !== '📦') {
    return `<span style="font-size:${size * 0.7}px;width:${size}px;height:${size}px;
      display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${p.emoji}</span>`;
  }
  return `<span style="width:${size}px;height:${size}px;border-radius:8px;
    background:${color}22;color:${color};font-weight:700;font-size:${size * 0.45}px;
    display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;
    border:1px solid ${color}44;">${initial}</span>`;
}

// ── Page Render ──────────────────────────────────────────── //

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
              <div style="display:flex;align-items:center;gap:10px">
                ${productThumb(p, 38)}
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

// ── Product Modal ────────────────────────────────────────── //

function openProductModal(product) {
  _editingProduct = product;
  _pendingImageData = product ? (product.image || null) : null;
  const isEdit = !!product;
  document.getElementById('product-modal-title').textContent = isEdit ? 'Edit Product' : 'Add Product';

  const currentImage = product && product.image ? product.image : null;
  const hasImage = !!currentImage;

  document.getElementById('product-modal-body').innerHTML = `
    <div style="display:flex;gap:20px;margin-bottom:18px;align-items:flex-start">
      <!-- Image Upload Widget -->
      <div style="flex-shrink:0">
        <label class="form-label" style="margin-bottom:8px;display:block">Product Image</label>
        <div id="img-upload-zone" class="img-upload-zone ${hasImage ? 'has-image' : ''}"
             onclick="document.getElementById('pm-image-file').click()"
             ondragover="event.preventDefault();this.classList.add('drag-over')"
             ondragleave="this.classList.remove('drag-over')"
             ondrop="handleImageDrop(event)">
          <input type="file" id="pm-image-file" accept="image/*" style="display:none"
                 onchange="handleImageFile(this.files[0])">
          <div id="img-preview-wrap">
            ${hasImage
              ? `<img id="img-preview" src="${currentImage}" alt="Preview">`
              : `<div class="img-upload-placeholder">
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                     <rect x="3" y="3" width="18" height="18" rx="3"/>
                     <circle cx="8.5" cy="8.5" r="1.5"/>
                     <polyline points="21,15 16,10 5,21"/>
                   </svg>
                   <span>Click or drag image here</span>
                   <span class="img-upload-hint">JPG, PNG, WEBP · Max 2MB</span>
                 </div>`
            }
          </div>
          ${hasImage ? `<div class="img-upload-overlay">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>Change</span>
          </div>` : ''}
        </div>
        ${hasImage ? `<button type="button" class="btn btn-ghost btn-sm" style="width:100%;margin-top:6px;font-size:0.75rem;color:var(--danger)" onclick="clearProductImage()">✕ Remove Image</button>` : ''}
        <div id="img-error" style="color:var(--danger);font-size:0.75rem;margin-top:4px;min-height:16px"></div>
      </div>

      <!-- Name / Category / Unit fields -->
      <div style="flex:1;display:flex;flex-direction:column;gap:0">
        <div class="form-group">
          <label class="form-label">Product Name *</label>
          <input class="form-input" id="pm-name" value="${product ? product.name : ''}" placeholder="e.g. Basmati Rice" />
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
      </div>
    </div>

    <!-- Price / Cost / Stock row -->
    <div class="form-row" style="grid-template-columns:1fr 1fr 1fr">
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

function handleImageFile(file) {
  if (!file) return;
  const errEl = document.getElementById('img-error');
  if (!file.type.startsWith('image/')) {
    errEl.textContent = 'Please select a valid image file.';
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    errEl.textContent = 'Image must be under 2MB.';
    return;
  }
  errEl.textContent = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    // Compress/resize to max 400px for storage efficiency
    const img = new Image();
    img.onload = () => {
      const MAX = 400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      _pendingImageData = dataUrl;
      applyImagePreview(dataUrl);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleImageDrop(event) {
  event.preventDefault();
  const zone = document.getElementById('img-upload-zone');
  zone.classList.remove('drag-over');
  const file = event.dataTransfer.files[0];
  if (file) handleImageFile(file);
}

function applyImagePreview(dataUrl) {
  const zone = document.getElementById('img-upload-zone');
  const wrap = document.getElementById('img-preview-wrap');
  if (!zone || !wrap) return;
  zone.classList.add('has-image');
  wrap.innerHTML = `<img id="img-preview" src="${dataUrl}" alt="Preview">`;

  // Ensure overlay exists
  if (!zone.querySelector('.img-upload-overlay')) {
    const ov = document.createElement('div');
    ov.className = 'img-upload-overlay';
    ov.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg><span>Change</span>`;
    zone.appendChild(ov);
  }

  // Show remove button
  let removeBtn = zone.parentElement.querySelector('.remove-img-btn');
  if (!removeBtn) {
    removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-ghost btn-sm remove-img-btn';
    removeBtn.style.cssText = 'width:100%;margin-top:6px;font-size:0.75rem;color:var(--danger)';
    removeBtn.textContent = '✕ Remove Image';
    removeBtn.onclick = clearProductImage;
    zone.parentElement.insertBefore(removeBtn, document.getElementById('img-error'));
  }
}

function clearProductImage() {
  _pendingImageData = null;
  const zone = document.getElementById('img-upload-zone');
  const wrap = document.getElementById('img-preview-wrap');
  if (!zone || !wrap) return;
  zone.classList.remove('has-image');
  wrap.innerHTML = `
    <div class="img-upload-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
      <span>Click or drag image here</span>
      <span class="img-upload-hint">JPG, PNG, WEBP · Max 2MB</span>
    </div>`;
  const ov = zone.querySelector('.img-upload-overlay');
  if (ov) ov.remove();
  const removeBtn = zone.parentElement.querySelector('.remove-img-btn');
  if (removeBtn) removeBtn.remove();
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
  _pendingImageData = null;
}

function saveProductForm() {
  const name  = document.getElementById('pm-name').value.trim();
  const cat   = document.getElementById('pm-cat').value.trim();
  const price = parseFloat(document.getElementById('pm-price').value);
  const cost  = parseFloat(document.getElementById('pm-cost').value) || 0;
  const unit  = document.getElementById('pm-unit').value.trim();
  const stock = parseInt(document.getElementById('pm-stock').value, 10);

  if (!name || !cat || isNaN(price) || !unit || isNaN(stock)) {
    showToast('Please fill all required fields correctly', 'error');
    return;
  }

  const p = {
    id:        _editingProduct ? _editingProduct.id : null,
    name, category: cat, price, costPrice: cost, unit, stock,
    emoji:     _editingProduct ? (_editingProduct.emoji || '📦') : '📦',
    image:     _pendingImageData || null,
  };

  DB.saveProduct(p);
  closeProductModal();
  updateCategoryDropdown();
  renderProductsTable();
  if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
  showToast(`Product "${name}" saved! ✅`, 'success');
}

// ── Delete / Stock Adjust ────────────────────────────────── //

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

// ── CSV Export ───────────────────────────────────────────── //

function exportCSV() {
  const list = DB.getProducts();
  if (list.length === 0) { showToast('No products to export', 'error'); return; }
  const BOM = '\uFEFF';
  let csv = BOM + 'ID,Name,Category,Price,CostPrice,Unit,Stock\n';
  list.forEach(p => {
    csv += `${p.id},"${p.name}","${p.category}",${p.price},${p.costPrice||0},${p.unit},${p.stock}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'grocerybill_products.csv');
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('Products exported successfully! 📥', 'success');
}
