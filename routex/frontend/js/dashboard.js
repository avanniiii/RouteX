async function loadDashboard() {
  try {
    const [dashRes, topRes, revenueRes, cityRes] = await Promise.all([
      fetch('/api/analytics/dashboard'),
      fetch('/api/analytics/top-clients'),
      fetch('/api/analytics/revenue-by-material'),
      fetch('/api/analytics/clients-by-city')
    ]);

    const dash = await dashRes.json();
    const top = await topRes.json();
    const revenue = await revenueRes.json();
    const city = await cityRes.json();

    renderStatCards(dash);
    renderTopClients(top.data);
    renderRevenueChart(revenue.data);
    renderCityChart(city.data);
  } catch (err) {
    document.getElementById('dashboard-stats').innerHTML =
      `<div style="color:var(--red);padding:1rem;">⚠ Could not connect to server. Make sure backend is running on port 3000.</div>`;
  }
}

function renderStatCards(d) {
  document.getElementById('dashboard-stats').innerHTML = `
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">Total Clients</div>
        <div class="stat-icon bg-purple"><span>👥</span></div>
      </div>
      <div class="stat-value c-purple">${d.totalClients}</div>
      <div class="stat-sub">${d.activeClients} active · ${d.totalClients - d.activeClients} inactive</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">Total Orders</div>
        <div class="stat-icon bg-green"><span>📋</span></div>
      </div>
      <div class="stat-value c-green">${d.totalOrders}</div>
      <div class="stat-sub">${d.pendingOrders} pending</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">Deliveries</div>
        <div class="stat-icon bg-blue"><span>🚛</span></div>
      </div>
      <div class="stat-value c-blue">${d.totalDeliveries}</div>
      <div class="stat-sub">${d.activeDeliveries} active routes</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-icon bg-yellow"><span>💰</span></div>
      </div>
      <div class="stat-value c-yellow">₹${(d.totalRevenue/1000).toFixed(1)}k</div>
      <div class="stat-sub">From all delivered orders</div>
    </div>
    <div class="stat-card">
      <div class="stat-card-top">
        <div class="stat-label">Low Stock Alert</div>
        <div class="stat-icon bg-red"><span>⚠️</span></div>
      </div>
      <div class="stat-value c-red">${d.lowStock}</div>
      <div class="stat-sub">Materials below 100 units</div>
    </div>
  `;
}

function renderTopClients(clients) {
  if (!clients?.length) { document.getElementById('top-clients-list').innerHTML = '<div class="empty-state"><div class="icon">👥</div>No data</div>'; return; }
  document.getElementById('top-clients-list').innerHTML = clients.map((c, i) => `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">
      <div style="width:28px;height:28px;border-radius:50%;background:var(--surface2);display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:700;color:var(--accent2);">${i+1}</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.88rem;">${c.name}</div>
        <div style="font-size:0.75rem;color:var(--muted);">${c.city} · ${c.totalOrders} orders</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.82rem;font-weight:700;color:${c.creditScore>=80?'var(--accent)':'var(--accent3)'};">${c.creditScore}</div>
        <div style="font-size:0.68rem;color:var(--muted);">credit</div>
      </div>
    </div>
  `).join('');
}

function renderRevenueChart(items) {
  if (!items?.length) return;
  const max = Math.max(...items.map(i => i.totalRevenue));
  const colors = ['var(--accent)','var(--accent2)','var(--accent3)','var(--blue)','var(--red)'];
  document.getElementById('revenue-chart').innerHTML = items.map((item, i) => `
    <div class="chart-row">
      <div class="chart-label">${item.material}</div>
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="width:${(item.totalRevenue/max*100).toFixed(1)}%;background:${colors[i%colors.length]};"></div>
      </div>
      <div class="chart-value" style="color:${colors[i%colors.length]};">₹${(item.totalRevenue/1000).toFixed(1)}k</div>
    </div>
  `).join('');
}

function renderCityChart(cities) {
  if (!cities?.length) return;
  const max = Math.max(...cities.map(c => c.totalOrders));
  document.getElementById('city-chart').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;">
      ${cities.map(c => `
        <div style="background:var(--surface2);border-radius:8px;padding:1rem;">
          <div style="font-weight:700;margin-bottom:6px;">${c.city}</div>
          <div class="chart-bar-wrap" style="margin-bottom:6px;height:6px;">
            <div class="chart-bar" style="width:${(c.totalOrders/max*100).toFixed(0)}%;background:var(--accent2);"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:var(--muted);">
            <span>${c.clientCount} clients</span>
            <span>${c.totalOrders} orders</span>
            <span>avg credit: ${c.avgCreditScore}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

async function loadForecast() {
  const res = await fetch('/api/analytics/supply-forecast');
  const json = await res.json();
  const grid = document.getElementById('forecast-grid');
  if (!json.data?.length) { grid.innerHTML = '<div class="empty-state"><div class="icon">🔮</div>No forecast data</div>'; return; }

  grid.innerHTML = json.data.map(f => {
    const months = ['Apr','May','Jun'];
    const base = f.avgMonthly || 0;
    const trendColor = f.trend === 'high' ? 'var(--accent)' : f.trend === 'medium' ? 'var(--accent3)' : 'var(--muted)';
    return `
      <div class="forecast-card">
        <div class="forecast-name">${f.clientName}</div>
        <div class="forecast-meta">
          ${f.city} · Avg: ${f.avgMonthly}/mo ·
          <span style="color:${trendColor};font-weight:600;">${f.trend?.toUpperCase()}</span>
        </div>
        <div class="forecast-months">
          ${months.map((m, i) => `
            <div class="forecast-month">
              <div class="month-label">${m}</div>
              <div class="month-qty">${Math.round(base * (1.15 + i * 0.05))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function loadAnalytics() {
  const [joinedRes, revenueRes] = await Promise.all([
    fetch('/api/analytics/orders-with-clients'),
    fetch('/api/analytics/revenue-by-material')
  ]);
  const joined  = await joinedRes.json();
  const revenue = await revenueRes.json();

  //Joined orders table
  document.getElementById('joined-orders-table').innerHTML = joined.data?.map(o => `
    <tr>
      <td>${o.orderId}</td>
      <td>${o.clientName}</td>
      <td>${o.clientCity}</td>
      <td>₹${o.totalAmount?.toLocaleString()}</td>
      <td><span class="pill ${o.status==='pending'?'pill-yellow':'pill-purple'}">${o.status}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="5">No data</td></tr>';

  //Revenue bars
  const max = Math.max(...(revenue.data||[]).map(r => r.totalRevenue));
  document.getElementById('analytics-revenue').innerHTML = (revenue.data||[]).map(r => `
    <div class="chart-row">
      <div class="chart-label">${r.material}</div>
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="width:${(r.totalRevenue/max*100).toFixed(0)}%;background:var(--accent);"></div>
      </div>
      <div class="chart-value c-green">₹${(r.totalRevenue/1000).toFixed(1)}k</div>
    </div>
  `).join('');
}