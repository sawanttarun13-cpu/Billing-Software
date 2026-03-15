/* ============================================================
   GroceryBill Pro — Invoice Component & Print
   ============================================================ */

function buildInvoiceHTML(bill) {
  const s = bill.settings || DB.getSettings();
  const curr = s.currency || '₹';

  const itemRows = bill.items.map((it, i) => `
    <tr>
      <td style="width: 40px">${i + 1}</td>
      <td>
        <div style="font-weight: 600; color: var(--text)">${it.name}</div>
        ${it.unit ? `<div style="font-size: 0.72rem; color: var(--text3)">per ${it.unit}</div>` : ''}
      </td>
      <td style="text-align:center">${it.qty}</td>
      <td style="text-align:right">${curr}${Number(it.price).toFixed(2)}</td>
      <td style="text-align:right; font-weight: 700; color: var(--text)">${curr}${Number(it.total).toFixed(2)}</td>
    </tr>
  `).join('');

  const discountRow = bill.discount > 0 ? `
    <div class="row"><span>Discount</span><span style="color:var(--danger)">- ${curr}${Number(bill.discount).toFixed(2)}</span></div>
  ` : '';

  return `
    <div class="invoice-container">
      <div class="inv-top-bar" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
        <div>
          <h1 style="font-size: 2.2rem; font-weight: 800; letter-spacing: -1px; margin: 0; color: var(--accent); opacity: 0.9;">INVOICE</h1>
          <div style="font-size: 0.85rem; color: var(--text3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;"># ${bill.billNo}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--text);">${s.shopName}</div>
          <div style="font-size: 0.82rem; color: var(--text2);">${s.tagline || ''}</div>
        </div>
      </div>

      <div class="inv-info-grid" style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 30px;">
        <div class="inv-info-col">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text3); text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px;">Bill From</div>
          <div style="font-size: 0.85rem; color: var(--text2); line-height: 1.6;">
            <strong>${s.shopName}</strong><br>
            ${s.address}<br>
            Phone: ${s.phone}<br>
            ${s.gstin ? 'GSTIN: ' + s.gstin : ''}
          </div>
        </div>
        <div class="inv-info-col">
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--text3); text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid var(--border); padding-bottom: 4px;">Bill To</div>
          <div style="font-size: 0.85rem; color: var(--text2); line-height: 1.6;">
            <strong style="font-size: 1rem; color: var(--text)">${bill.customer || 'Walk-in Customer'}</strong><br>
            Date: ${DB.formatDate(bill.date)}<br>
            Payment: <span class="badge badge-accent" style="font-size: 0.7rem; padding: 1px 6px;">${bill.paymentMode || 'Cash'}</span>
          </div>
        </div>
      </div>

      <table class="inv-table" style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
        <thead>
          <tr style="border-bottom: 2px solid var(--border);">
            <th style="text-align: left; padding: 12px 8px; font-size: 0.72rem; color: var(--text3);">#</th>
            <th style="text-align: left; padding: 12px 0; font-size: 0.72rem; color: var(--text3);">Description</th>
            <th style="text-align: center; padding: 12px 8px; font-size: 0.72rem; color: var(--text3);">Qty</th>
            <th style="text-align: right; padding: 12px 8px; font-size: 0.72rem; color: var(--text3);">Unit Price</th>
            <th style="text-align: right; padding: 12px 8px; font-size: 0.72rem; color: var(--text3);">Amount</th>
          </tr>
        </thead>
        <tbody style="border-bottom: 1px solid var(--border);">
          ${itemRows}
        </tbody>
      </table>

      <div style="display: flex; justify-content: flex-end;">
        <div class="inv-totals" style="width: 280px;">
          <div class="row" style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem; color: var(--text2);">
            <span>Subtotal</span>
            <span>${curr}${Number(bill.subtotal).toFixed(2)}</span>
          </div>
          ${discountRow}
          <div class="row" style="display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.85rem; color: var(--text2);">
            <span>Tax (${bill.taxRate || s.taxRate}%)</span>
            <span>+ ${curr}${Number(bill.tax).toFixed(2)}</span>
          </div>
          <div class="row grand" style="display: flex; justify-content: space-between; padding: 12px 0; margin-top: 10px; border-top: 2px solid var(--accent); font-size: 1.25rem; font-weight: 800; color: var(--text);">
            <span>Amount Due</span>
            <span style="color: var(--accent)">${curr}${Number(bill.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div class="inv-footer" style="margin-top: 50px; padding-top: 20px; border-top: 1px solid var(--border); text-align: center;">
        <div style="font-size: 0.9rem; font-weight: 600; color: var(--text2); margin-bottom: 4px;">${s.thankYou || 'Thank you for shopping with us!'}</div>
        <div style="font-size: 0.7rem; color: var(--text3); font-style: italic;">Please keep this invoice for your records.</div>
      </div>
    </div>
  `;
}

let _currentPrintBill = null;

function showInvoiceModal(bill) {
  try {
    _currentPrintBill = bill;
    const body = document.getElementById('invoice-body');
    if (!body) throw new Error('Invoice container not found');
    body.innerHTML = buildInvoiceHTML(bill);
    document.getElementById('invoice-modal').style.display = 'flex';
  } catch (err) {
    console.error('Invoice Modal Error:', err);
    showToast('Failed to show invoice: ' + err.message, 'error');
  }
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
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Inter', system-ui, -apple-system, sans-serif; 
          font-size: 12px; 
          color: #1a1a1a; 
          background: #fff; 
          padding: 40px; 
          line-height: 1.5;
        }
        :root { 
          --accent: ${s.accentColor || '#00d4aa'}; 
          --danger: #f04f5e; 
          --border: #e2e8f0; 
          --text: #1a1a1a; 
          --text2: #4a5568; 
          --text3: #a0aec0; 
        }
        
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          background: #edf2f7;
          color: #4a5568;
          text-transform: uppercase;
        }
        .badge-accent { background: ${s.accentColor || '#00d4aa'}22; color: ${s.accentColor || '#00a884'}; }

        table { width: 100%; border-collapse: collapse; }
        th { text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; border-bottom: 2px solid #edf2f7; }
        td { border-bottom: 1px solid #edf2f7; padding: 12px 8px; }
        
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          @page { margin: 2cm; }
        }

        .invoice-container { max-width: 800px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        ${buildInvoiceHTML(_currentPrintBill)
          .replace(/var\(--accent\)/g, s.accentColor || '#00d4aa')
          .replace(/var\(--border\)/g, '#e2e8f0')
          .replace(/var\(--text\)/g, '#1a1a1a')
          .replace(/var\(--text2\)/g, '#4a5568')
          .replace(/var\(--text3\)/g, '#a0aec0')
          .replace(/var\(--danger\)/g, '#f04f5e')
        }
      </div>
      <script>
        window.onload = () => { 
          setTimeout(() => { 
            window.focus(); 
            window.print(); 
          }, 500); 
        };
      </script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank', 'width=850,height=900');
  if (!win) {
    if (window.showToast) window.showToast('Please allow pop-ups to print the invoice', 'error');
    else alert('Please allow pop-ups to print the invoice');
    return;
  }
  win.document.write(printContent);
  win.document.close();
}

/**
 * Downloads the current invoice as a PDF using html2pdf.js
 */
function downloadPDF() {
  if (!_currentPrintBill) return;
  
  const element = document.getElementById('invoice-body');
  const opt = {
    margin:       10,
    filename:     `Invoice_${_currentPrintBill.billNo}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Show a loading toast if possible
  if (window.showToast) window.showToast('Generating PDF...', 'info');

  html2pdf().set(opt).from(element).save()
    .then(() => {
      if (window.showToast) window.showToast('PDF downloaded successfully! ✅', 'success');
    })
    .catch(err => {
      console.error('PDF Error:', err);
      if (window.showToast) window.showToast('Failed to generate PDF', 'error');
    });
}
