async function loadClients() {
  const city   = document.getElementById('client-city')?.value || '';
  const credit = document.getElementById('client-credit')?.value || '';
  const active = document.getElementById('client-active')?.value || '';
  const tag    = document.getElementById('client-tag')?.value || '';

  const params = new URLSearchParams();
  if (city) params.set('city', city);
  if (credit) params.set('minCredit', credit);
  if (active) params.set('active', active);
  if (tag) params.set('tag', tag);

  const res  = await fetch(`/api/clients?${params}`);
  const json = await res.json();

  document.getElementById('client-count').textContent = `(${json.count})`;
  renderClientsTable(json.data);
}

function renderClientsTable(clients) {
  const tb = document.getElementById('clients-table');
  if (!clients?.length) {
    tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">👥</div>No clients found</div></td></tr>`;
    return;
  }
  tb.innerHTML = clients.map(c => `
    <tr>
      <td style="font-family:monospace;font-size:0.8rem;color:var(--accent2);">${c.clientId}</td>
      <td style="font-weight:600;">${c.name}</td>
      <td>${c.location?.city}, ${c.location?.state}</td>
      <td>
        <span style="font-weight:700;color:${c.creditScore>=80?'var(--accent)':c.creditScore>=60?'var(--accent3)':'var(--red)'};">${c.creditScore}</span>
        <div style="margin-top:2px;height:3px;width:60px;background:var(--border);border-radius:2px;">
          <div style="height:100%;width:${c.creditScore}%;background:${c.creditScore>=80?'var(--accent)':c.creditScore>=60?'var(--accent3)':'var(--red)'};border-radius:2px;"></div>
        </div>
      </td>
      <td>${c.totalOrders}</td>
      <td>${(c.tags||[]).map(t => `<span class="pill pill-purple" style="margin:1px;">${t}</span>`).join('')}</td>
      <td><span class="pill ${c.isActive?'pill-green':'pill-red'}">${c.isActive?'Active':'Inactive'}</span></td>
    </tr>
  `).join('');
}

function clearClientFilter() {
  ['client-city','client-active','client-tag'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('client-credit').value = '';
  loadClients();
}