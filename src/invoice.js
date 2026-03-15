/* ============================================================
   GroceryBill Pro — Invoice Component & Print
   ============================================================ */

function buildInvoiceHTML(bill) {
  const s = bill.settings || DB.getSettings();
  const curr = s.currency || '₹';

  const itemRows = bill.items.map((it, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${it.name}</td>
      <td style="text-align:center">${it.qty} ${it.unit || ''}</td>
      <td style="text-align:right">${curr}${Number(it.price).toFixed(2)}</td>
      <td style="text-align:right"><strong>${curr}${Number(it.total).toFixed(2)}</strong></td>
    </tr>
  `).join('');

  const discountRow = bill.discount > 0 ? `
    <div class="row"><span>Discount</span><span style="color:var(--danger)">- ${curr}${Number(bill.discount).toFixed(2)}</span></div>
  ` : '';

  return `
    <div class="inv-header">
      <div class="inv-shop-name">${s.shopName}</div>
      <div class="inv-shop-sub">
        ${s.tagline ? s.tagline + '<br>' : ''}
        ${s.address}<br>
        📞 ${s.phone}${s.gstin ? ' &nbsp;|&nbsp; GSTIN: ' + s.gstin : ''}
      </div>
    </div>
    <hr class="inv-divider" />
    <div class="inv-meta">
      <div class="inv-meta-item"><strong>Bill No:</strong> ${bill.billNo}</div>
      <div class="inv-meta-item" style="text-align:right"><strong>Date:</strong> ${DB.formatDate(bill.date)}</div>
      <div class="inv-meta-item"><strong>Customer:</strong> ${bill.customer || 'Walk-in Customer'}</div>
      <div class="inv-meta-item" style="text-align:right"><strong>Tax Rate:</strong> ${bill.taxRate || s.taxRate}%</div>
    </div>
    <hr class="inv-divider" />
    <table class="inv-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Item</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr class="inv-divider" />
    <div class="inv-totals">
      <div class="row"><span>Subtotal</span><span>${curr}${Number(bill.subtotal).toFixed(2)}</span></div>
      ${discountRow}
      <div class="row"><span>Tax (${bill.taxRate || s.taxRate}%)</span><span>+ ${curr}${Number(bill.tax).toFixed(2)}</span></div>
      <div class="row grand"><span>TOTAL</span><span style="color:var(--accent)">${curr}${Number(bill.total).toFixed(2)}</span></div>
    </div>
    <div class="inv-footer">
      ${s.thankYou || 'Thank you for shopping with us!'}
      <br><span style="font-size:0.7rem;opacity:0.6">Powered by GroceryBill Pro</span>
    </div>
  `;
}

let _currentPrintBill = null;

function showInvoiceModal(bill) {
  _currentPrintBill = bill;
  document.getElementById('invoice-body').innerHTML = buildInvoiceHTML(bill);
  document.getElementById('invoice-modal').style.display = 'flex';
}

function closeInvoiceModal() {
  document.getElementById('invoice-modal').style.display = 'none';
  _currentPrintBill = null;
}

function printInvoice() {
  if (!_currentPrintBill) return;
  const s = _currentPrintBill.settings || DB.getSettings();
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${_currentPrintBill.billNo}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 20px; }
        :root { --accent: ${s.accentColor || '#00d4aa'}; --danger: #f04f5e; --border: #ddd; --surface2: #f5f5f5; --text: #111; --text2: #555; --text3: #999; }
        .inv-header { text-align: center; margin-bottom: 16px; }
        .inv-shop-name { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
        .inv-shop-sub { font-size: 12px; color: #555; line-height: 1.7; }
        .inv-divider { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
        .inv-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; margin-bottom: 14px; font-size: 12px; }
        .inv-meta-item { color: #555; }
        .inv-meta-item strong { color: #111; }
        .inv-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px; }
        .inv-table th { text-align: left; padding: 6px 8px; background: #f0f0f0; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #666; }
        .inv-table td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .inv-totals { text-align: right; font-size: 13px; }
        .inv-totals .row { display: flex; justify-content: space-between; padding: 3px 0; color: #555; }
        .inv-totals .grand { font-size: 15px; font-weight: 800; color: #111; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 6px; }
        .inv-totals .grand span:last-child { color: ${s.accentColor || '#00a884'}; }
        .inv-footer { text-align: center; margin-top: 18px; font-size: 11px; color: #888; padding-top: 12px; border-top: 1px dashed #ccc; }
      </style>
    </head>
    <body>
      ${buildInvoiceHTML(_currentPrintBill)
        .replace('var(--accent)', s.accentColor || '#00d4aa')
        .replace('var(--danger)', '#f04f5e')}
    </body>
    </html>
  `;
  const win = window.open('', '_blank', 'width=600,height=700');
  win.document.write(printContent);
  win.document.close();
  win.onload = () => { win.focus(); win.print(); };
}
