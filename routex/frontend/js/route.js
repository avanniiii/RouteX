async function loadRoutePlanner() {
  //Set default date to today
  const dateInput = document.getElementById('route-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  //Load client list for checkboxes
  const res  = await fetch('/api/clients?active=true');
  const json = await res.json();

  const container = document.getElementById('client-checkboxes');
  if (!json.data?.length) {
    container.innerHTML = '<div style="color:var(--muted);">No active clients found</div>';
    return;
  }

  container.innerHTML = json.data.map(c => `
    <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;background:var(--surface2);border-radius:7px;border:1px solid var(--border);transition:border-color .15s;"
           onmouseover="this.style.borderColor='var(--accent2)'" onmouseout="this.style.borderColor='var(--border)'">
      <input type="checkbox" value="${c.clientId}" style="accent-color:var(--accent);width:15px;height:15px;cursor:pointer;"/>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.86rem;">${c.name}</div>
        <div style="font-size:0.75rem;color:var(--muted);">${c.location?.city}, ${c.location?.state}</div>
      </div>
      <span style="font-size:0.75rem;color:var(--muted);">${c.totalOrders} orders</span>
    </label>
  `).join('');

  //Load past optimized deliveries
  loadOptimizedHistory();
}

async function runOptimization() {
  const checked = [...document.querySelectorAll('#client-checkboxes input[type=checkbox]:checked')];
  if (checked.length < 2) {
    showToast('⚠ Select at least 2 clients');
    return;
  }

  const clientIds = checked.map(c => c.value);
  const date = document.getElementById('route-date').value;

  //Show loading
  document.getElementById('route-result').innerHTML = '<div class="loading"><span class="spinner"></span>Calculating optimal route...</div>';

  const res  = await fetch('/api/route/optimize', {
    method:'POST',
    headers: { 'Content-Type': 'application/json' },
    body:JSON.stringify({ clientIds, date })
  });
  const data = await res.json();

  if (data.error) {
    document.getElementById('route-result').innerHTML = `<div style="color:var(--red);">Error: ${data.error}</div>`;
    return;
  }

  //Show result summary cards
  document.getElementById('route-result').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1rem;">
      <div style="background:var(--surface2);border-radius:8px;padding:1rem;text-align:center;">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Optimized Distance</div>
        <div style="font-size:1.8rem;font-weight:800;color:var(--accent);">${data.totalKm} km</div>
      </div>
      <div style="background:var(--surface2);border-radius:8px;padding:1rem;text-align:center;">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Without Optimization</div>
        <div style="font-size:1.8rem;font-weight:800;color:var(--muted);">${data.naiveKm} km</div>
      </div>
      <div style="background:rgba(0,214,143,0.08);border:1px solid rgba(0,214,143,0.2);border-radius:8px;padding:1rem;text-align:center;">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Km Saved</div>
        <div style="font-size:1.8rem;font-weight:800;color:var(--accent);">-${data.kmSaved} km</div>
      </div>
      <div style="background:rgba(0,214,143,0.08);border:1px solid rgba(0,214,143,0.2);border-radius:8px;padding:1rem;text-align:center;">
        <div style="font-size:0.72rem;color:var(--muted);margin-bottom:4px;text-transform:uppercase;letter-spacing:.5px;">Efficiency Gain</div>
        <div style="font-size:1.8rem;font-weight:800;color:var(--accent);">${data.percentSaved}%</div>
      </div>
    </div>
    <div style="background:var(--surface2);border-radius:7px;padding:10px 14px;font-size:0.8rem;color:var(--muted);">
      Delivery ID: <span style="color:var(--accent2);font-weight:600;">${data.deliveryId}</span> saved to database
    </div>
  `;

  //Show visual route
  renderOptimizedRoute(data.optimizedRoute);
  loadOptimizedHistory();
  showToast(`✅ ${data.message}`);
}

function renderOptimizedRoute(route) {
  const section = document.getElementById('route-visual-section');
  const container = document.getElementById('route-visual');
  section.style.display = 'block';

  container.innerHTML = route.map((stop, i) => {
    const isLast    = i === route.length - 1;
    const isWarehouse = stop.isWarehouse;
    const dotColor  = isWarehouse ? 'var(--accent2)' : stop.status === 'done' ? 'var(--accent)' : 'var(--accent3)';

    return `
      <div style="display:flex;gap:16px;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
          <div style="width:28px;height:28px;border-radius:50%;background:${dotColor};display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:#000;flex-shrink:0;margin-top:2px;">${stop.stopNo}</div>
          ${!isLast ? `<div style="width:2px;flex:1;min-height:32px;background:var(--border);margin:4px 0;"></div>` : ''}
        </div>
        <div style="padding-bottom:${isLast?'0':'20px'};flex:1;">
          <div style="font-weight:700;font-size:0.9rem;${isWarehouse?'color:var(--accent2)':''}">${stop.location}</div>
          <div style="font-size:0.78rem;color:var(--muted);margin-top:2px;display:flex;gap:16px;">
            ${!isWarehouse ? `<span>📍 +${stop.distKm} km from prev</span>` : ''}
            <span>📏 ${stop.cumKm} km total</span>
            <span>🕐 ETA ${stop.eta}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadOptimizedHistory() {
  const res  = await fetch('/api/route/optimized');
  const json = await res.json();

  const tb = document.getElementById('optimized-table');
  if (!json.data?.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:1.5rem;">No optimized routes yet</td></tr>';
    return;
  }

  tb.innerHTML = json.data.map(d => `
    <tr>
      <td style="font-family:monospace;font-size:0.8rem;color:var(--accent2);">${d.deliveryId}</td>
      <td>${d.stopsCount - 1}</td>
      <td style="font-weight:600;color:var(--accent);">${d.totalKm} km</td>
      <td style="color:var(--muted);">${d.naiveKm} km</td>
      <td style="font-weight:600;color:var(--accent);">-${d.kmSaved} km</td>
      <td><span class="pill pill-green">${d.percentSaved}%</span></td>
      <td><span class="pill ${d.status==='delivered'?'pill-green':d.status==='in-transit'?'pill-purple':'pill-yellow'}">${d.status}</span></td>
    </tr>
  `).join('');
}