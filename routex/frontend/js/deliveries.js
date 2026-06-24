async function loadDeliveries() {
  const status = document.getElementById('del-status')?.value || '';
  const driver = document.getElementById('del-driver')?.value || '';

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (driver) params.set('driverName', driver);

  const res  = await fetch(`/api/deliveries?${params}`);
  const json = await res.json();

  const container = document.getElementById('deliveries-list');
  if (!json.data?.length) {
    container.innerHTML = `<div class="empty-state"><div class="icon">🚛</div>No deliveries found</div>`;
    return;
  }

  container.innerHTML = json.data.map(d => {
    const stsColor = d.status === 'delivered' ? 'pill-green' : d.status === 'in-transit' ? 'pill-blue' : 'pill-yellow';
    const date = new Date(d.scheduledDate).toLocaleDateString('en-IN');

    const stops = (d.route || []).map((stop, i) => `
      <div class="route-stop">
        <div class="stop-line">
          <div class="stop-dot ${stop.status === 'done' ? 'done' : 'pending'}"></div>
          ${i < d.route.length - 1 ? '<div class="stop-connector"></div>' : ''}
        </div>
        <div class="stop-info">
          <div class="stop-name">${stop.location}</div>
          <div class="stop-meta">Stop ${stop.stopNo} · ${stop.distKm} km · ETA ${stop.eta}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="section" style="margin-bottom:1rem;">
        <div class="section-header">
          <div class="section-title">
            🚛 ${d.deliveryId}
            <span class="pill ${stsColor}" style="margin-left:8px;">${d.status}</span>
          </div>
          <div style="font-size:0.8rem;color:var(--muted);">
            📅 ${date} &nbsp;·&nbsp; 🛣 ${d.totalKm} km &nbsp;·&nbsp; 👤 ${d.driver?.name}
          </div>
        </div>
        <div class="section-body">
          <div class="route-stops">${stops}</div>
        </div>
      </div>
    `;
  }).join('');
}

function clearDelFilter() {
  document.getElementById('del-status').value = '';
  document.getElementById('del-driver').value = '';
  loadDeliveries();
}