/* ============================================================
   GroceryBill Pro — Settings Page
   ============================================================ */

function renderSettings() {
  const s = DB.getSettings();

  const html = `
    <div style="max-width:900px">
      <div class="settings-grid">

        <!-- Shop Info -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🏪 Shop Information</div>
          </div>
          <div class="form-group">
            <label class="form-label">Shop Name *</label>
            <input class="form-input" id="s-shopName" value="${s.shopName}" placeholder="Your Shop Name" />
          </div>
          <div class="form-group">
            <label class="form-label">Tagline</label>
            <input class="form-input" id="s-tagline" value="${s.tagline || ''}" placeholder="Your tagline…" />
          </div>
          <div class="form-group">
            <label class="form-label">Address</label>
            <textarea class="form-textarea" id="s-address" rows="3" placeholder="Shop address…">${s.address || ''}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Phone</label>
              <input class="form-input" id="s-phone" value="${s.phone || ''}" placeholder="+91 98765 43210" />
            </div>
            <div class="form-group">
              <label class="form-label">GSTIN</label>
              <input class="form-input" id="s-gstin" value="${s.gstin || ''}" placeholder="GSTIN number" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Thank You Message</label>
            <input class="form-input" id="s-thankYou" value="${s.thankYou || ''}" placeholder="Message printed on invoice footer" />
          </div>
        </div>

        <!-- Billing Settings -->
        <div>
          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div class="card-title">💰 Billing Settings</div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Default Tax Rate (%)</label>
                <input class="form-input" id="s-taxRate" type="number" min="0" max="100" step="0.1" value="${s.taxRate}" placeholder="5" />
              </div>
              <div class="form-group">
                <label class="form-label">Currency Symbol</label>
                <input class="form-input" id="s-currency" value="${s.currency}" placeholder="₹" maxlength="4" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Invoice Prefix</label>
              <input class="form-input" value="GB-" disabled style="opacity:0.5" />
              <small style="color:var(--text3);font-size:0.75rem;margin-top:4px;display:block">Bill numbers are auto-generated as GB-XXXX</small>
            </div>
          </div>

          <div class="card" style="margin-bottom:16px">
            <div class="card-header">
              <div class="card-title">🎨 Appearance</div>
            </div>
            <div class="form-group">
              <label class="form-label">Accent Colour</label>
              <div style="display:flex;gap:12px;align-items:center">
                <input type="color" id="s-accentColor" value="${s.accentColor || '#00d4aa'}" style="width:48px;height:40px;border:none;background:none;cursor:pointer;border-radius:8px" onchange="previewAccent(this.value)" />
                <input class="form-input" id="s-accentHex" value="${s.accentColor || '#00d4aa'}" style="flex:1" oninput="syncAccentColor(this.value)" placeholder="#00d4aa" />
                <div id="accent-preview" style="width:40px;height:40px;border-radius:8px;background:${s.accentColor || '#00d4aa'}"></div>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px" id="color-presets">
              ${['#00d4aa','#4f9cf9','#a855f7','#f04f5e','#f5a623','#3ecf70'].map(c =>
                `<div onclick="setAccentPreset('${c}')" style="width:32px;height:32px;border-radius:8px;background:${c};cursor:pointer;transition:transform 0.2s" onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'"></div>`
              ).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">💾 Backup & Restore</div>
            </div>
            <p style="font-size:0.85rem;color:var(--text2);margin-bottom:14px">Export your data to a JSON file or restore from a previous backup.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
              <button class="btn btn-outline" onclick="DB.exportBackup()">📥 Export Backup</button>
              <button class="btn btn-outline" onclick="document.getElementById('import-file').click()">📤 Restore Backup</button>
              <input type="file" id="import-file" accept=".json" style="display:none" onchange="handleImportBackup(event)" />
            </div>
          </div>

          <div class="card mt-6">
            <div class="card-header">
              <div class="card-title">⚠️ Danger Zone</div>
            </div>
            <p style="font-size:0.85rem;color:var(--text2);margin-bottom:14px">These actions are irreversible. Proceed with caution.</p>
            <div style="display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn btn-danger btn-sm" onclick="confirmClearBills()">🗑️ Clear All Bills</button>
              <button class="btn btn-danger btn-sm" onclick="confirmResetProducts()">🗑️ Reset Products</button>
            </div>
          </div>
        </div>

      </div>

      <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-ghost" onclick="renderSettings()">↩️ Reset</button>
        <button class="btn btn-primary btn-lg" onclick="saveSettingsForm()">💾 Save Settings</button>
      </div>
    </div>
  `;

  document.getElementById('page-content').innerHTML = html;
}

function handleImportBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const res = DB.importBackup(evt.target.result);
    if (res.success) {
      showToast(res.message + ' Reloading app...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      showToast(res.message, 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // clear input
}

function previewAccent(val) {
  document.getElementById('s-accentHex').value = val;
  document.getElementById('accent-preview').style.background = val;
}

function syncAccentColor(val) {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) {
    document.getElementById('s-accentColor').value = val;
    document.getElementById('accent-preview').style.background = val;
  }
}

function setAccentPreset(color) {
  document.getElementById('s-accentColor').value = color;
  document.getElementById('s-accentHex').value = color;
  document.getElementById('accent-preview').style.background = color;
}

function saveSettingsForm() {
  const shopName = document.getElementById('s-shopName').value.trim();
  if (!shopName) { showToast('Shop name is required', 'error'); return; }

  const s = {
    shopName,
    tagline: document.getElementById('s-tagline').value.trim(),
    address: document.getElementById('s-address').value.trim(),
    phone: document.getElementById('s-phone').value.trim(),
    gstin: document.getElementById('s-gstin').value.trim(),
    thankYou: document.getElementById('s-thankYou').value.trim(),
    taxRate: parseFloat(document.getElementById('s-taxRate').value) || 5,
    currency: document.getElementById('s-currency').value.trim() || '₹',
    accentColor: document.getElementById('s-accentColor').value || '#00d4aa',
  };

  DB.saveSettings(s);

  // Apply accent color live
  document.documentElement.style.setProperty('--accent', s.accentColor);
  document.documentElement.style.setProperty('--accent2',
    s.accentColor === '#00d4aa' ? '#00a884' : s.accentColor);

  // Update sidebar shop name
  const sn = document.getElementById('sidebar-shop-name');
  if (sn) sn.textContent = s.shopName;

  showToast('Settings saved ✅', 'success');
}

function confirmClearBills() {
  if (confirm('⚠️ This will permanently delete ALL bill records. Are you sure?')) {
    DB.clearBills();
    showToast('All bills cleared', 'info');
  }
}

function confirmResetProducts() {
  if (confirm('⚠️ This will delete ALL custom products and restore default seed products. Are you sure?')) {
    DB.clearProducts();
    DB.init(window.authUserId); // Re-seed
    showToast('Products reset to defaults', 'info');
  }
}
