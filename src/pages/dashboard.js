/* ============================================================
   GroceryBill Pro — Dashboard Page v2
   ============================================================ */

function renderDashboard() {
  const stats = DB.getTodayStats();
  const settings = DB.getSettings();
  const lowStock = DB.getLowStockProducts();

  const pctTotal = stats.yesterdayTotal ? ((stats.total - stats.yesterdayTotal) / stats.yesterdayTotal * 100).toFixed(1) : 0;
  const pctCount = stats.yesterdayCount ? ((stats.count - stats.yesterdayCount) / stats.yesterdayCount * 100).toFixed(1) : 0;

  const html = `
    <!-- Top Stats -->
    <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="stat-card green">
        <span class="stat-icon">💰</span>
        <div class="stat-value">${settings.currency}${stats.total.toFixed(2)}</div>
        <div class="stat-label">Today's Revenue</div>
        ${pctTotal !== 0 ? `<div class="stat-trend ${pctTotal > 0 ? 'up' : 'down'}">${pctTotal > 0 ? '↑' : '↓'} ${Math.abs(pctTotal)}% vs yesterday</div>` : ''}
      </div>
      <div class="stat-card orange">
        <span class="stat-icon">📈</span>
        <div class="stat-value">${settings.currency}${stats.profit.toFixed(2)}</div>
        <div class="stat-label">Today's Est. Profit</div>
        <div class="stat-trend neutral">Margin: ${stats.total > 0 ? (stats.profit/stats.total*100).toFixed(1) : '0'}%</div>
      </div>
      <div class="stat-card blue">
        <span class="stat-icon">🧾</span>
        <div class="stat-value">${stats.count}</div>
        <div class="stat-label">Bills Today</div>
        ${pctCount !== 0 ? `<div class="stat-trend ${pctCount > 0 ? 'up' : 'down'}">${pctCount > 0 ? '↑' : '↓'} ${Math.abs(pctCount)}% vs yesterday</div>` : ''}
      </div>
      <div class="stat-card">
        <span class="stat-icon">👥</span>
        <div class="stat-value">${DB.getCustomers().length}</div>
        <div class="stat-label">Registered Customers</div>
      </div>
    </div>

    <!-- Alert Banner for Low Stock -->
    ${lowStock.length > 0 ? `
      <div style="background:rgba(245,166,35,0.1);border:1px solid rgba(245,166,35,0.3);border-radius:var(--radius-md);padding:14px 20px;margin-bottom:24px;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:1.5rem">⚠️</span>
          <div>
            <div style="font-weight:600;color:var(--text1)">Low Stock Alert</div>
            <div style="font-size:0.85rem;color:var(--text2)">You have ${lowStock.length} items running low on stock.</div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="navigate('reports');setTimeout(()=>switchReport('stock', document.querySelectorAll('#report-tabs .cat-tab')[3]),100)">View Stock Report</button>
      </div>
    ` : ''}

    <div class="dashboard-grid">
      <!-- Chart -->
      <div class="card" style="grid-column: span 2;">
        <div class="card-header">
          <span class="card-title">Revenue (Last 7 Days)</span>
          <button class="btn btn-ghost btn-sm" onclick="navigate('reports')">Full Report →</button>
        </div>
        <div style="padding:0 20px 20px;height:240px;position:relative">
          <canvas id="revChart" style="width:100%;height:100%"></canvas>
        </div>
      </div>

      <!-- Top Products -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Top Selling Items</span>
        </div>
        <div class="table-wrap">
          <table class="compact">
            <thead>
              <tr><th>Item</th><th style="text-align:right">Sales</th></tr>
            </thead>
            <tbody id="top-products-body"></tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="card mt-6">
      <div class="card-header">
        <span class="card-title">Recent Bills</span>
        <button class="btn btn-ghost btn-sm" onclick="navigate('history')">View All</button>
      </div>
      <div class="table-wrap">
        <table class="compact">
          <thead>
            <tr>
              <th>Bill No</th>
              <th>Time</th>
              <th>Customer</th>
              <th>Mode</th>
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody id="dash-recent-bills"></tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('page-content').innerHTML = html;

  renderDashTopProducts();
  renderDashRecentBills();
  drawRevenueChart();
}

function renderDashTopProducts() {
  const top = DB.getTopProducts(5);
  const s = DB.getSettings();
  const html = top.map(p => `
    <tr>
      <td>${p.name} <span style="font-size:0.75rem;color:var(--text3)">(${p.qty})</span></td>
      <td style="text-align:right;font-weight:600;color:var(--accent)">${s.currency}${p.revenue.toFixed(2)}</td>
    </tr>
  `).join('') || `<tr><td colspan="2" style="text-align:center;padding:16px;color:var(--text3)">No sales yet</td></tr>`;
  document.getElementById('top-products-body').innerHTML = html;
}

function renderDashRecentBills() {
  const bills = DB.getBills().slice(0, 5);
  const s = DB.getSettings();
  const html = bills.map(b => `
    <tr class="row-link" onclick="showInvoiceModal(${JSON.stringify(b).replace(/"/g,'&quot;')})">
      <td><span class="badge badge-accent">${b.billNo}</span></td>
      <td style="color:var(--text3);font-size:0.85rem">${new Date(b.date).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</td>
      <td>${b.customer || 'Walk-in'}</td>
      <td><span class="badge ${b.paymentMode === 'Cash' ? 'badge-green' : 'badge-blue'}">${b.paymentMode || 'Cash'}</span></td>
      <td style="text-align:right;font-weight:700">${s.currency}${b.total.toFixed(2)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text3)">No bills today</td></tr>`;
  document.getElementById('dash-recent-bills').innerHTML = html;
}

function drawRevenueChart() {
  const canvas = document.getElementById('revChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const s = DB.getSettings();

  // Handle high-DPI displays
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padBottom = 30;
  const padLeft = 60;
  const padTop = 20;

  const data = DB.getWeekRevenue();
  const maxRev = Math.max(...data.map(d => d.rev), 1);
  const chartH = height - padBottom - padTop;
  const chartW = width - padLeft;

  ctx.clearRect(0,0, width, height);
  ctx.font = '12px Inter, sans-serif';

  // Grid / Y-axis
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.fillStyle = '#6b7280';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'right';
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const y = padTop + chartH - (i/steps)*chartH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    const labelVal = Math.round((i/steps)*maxRev);
    ctx.fillText(`${s.currency}${labelVal}`, padLeft - 10, y);
  }

  // Draw Line
  if (data.length > 0) {
    ctx.beginPath();
    const xStep = chartW / (data.length - 1 || 1);
    data.forEach((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + chartH - (d.rev / maxRev * chartH);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.accentColor;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Fill gradient
    const grad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    grad.addColorStop(0, s.accentColor + '55'); // 55 hex = ~33% alpha
    grad.addColorStop(1, s.accentColor + '00');

    ctx.lineTo(padLeft + chartW, padTop + chartH);
    ctx.lineTo(padLeft, padTop + chartH);
    ctx.fillStyle = grad;
    ctx.fill();

    // Points & X-axis
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    data.forEach((d, i) => {
      const x = padLeft + i * xStep;
      const y = padTop + chartH - (d.rev / maxRev * chartH);
      // dot
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI*2);
      ctx.fillStyle = '#0d0f14';
      ctx.fill();
      ctx.strokeStyle = s.accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      // x label
      ctx.fillStyle = '#aaa';
      ctx.fillText(d.label, x, height - padBottom + 10);
    });
  }
}
