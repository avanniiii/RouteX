async function loadOrders() {
  const priority = document.getElementById('order-priority')?.value || '';
  const status   = document.getElementById('order-status')?.value || '';
  const minAmt   = document.getElementById('order-min')?.value || '';

  const params = new URLSearchParams();
  if (priority) params.set('priority', priority);
  if (status) params.set('status', status);
  if (minAmt) params.set('minAmount', minAmt);

  const res = await fetch(`/api/orders?${params}`);
  const json = await res.json();

  document.getElementById('order-count').textContent = `(${json.count})`;

  const tb = document.getElementById('orders-table');
  if (!json.data?.length) {
    tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div>No orders found</div></td></tr>`;
    return;
  }

  tb.innerHTML = json.data.map(o => {
    const priColor = o.priority === 'high' ? 'pill-red' : o.priority === 'medium' ? 'pill-yellow' : 'pill-purple';
    const stsColor = o.status === 'delivered' ? 'pill-green' : o.status === 'processing' ? 'pill-blue' : 'pill-yellow';
    const date = new Date(o.orderDate).toLocaleDateString('en-IN');
    const items = (o.items||[]).map(i => `${i.material}×${i.qty}`).join(', ');
    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem;color:var(--accent2);">${o.orderId}</td>
        <td>${o.clientId}</td>
        <td style="color:var(--muted);font-size:0.8rem;">${items}</td>
        <td style="font-weight:700;color:var(--accent);">₹${o.totalAmount?.toLocaleString()}</td>
        <td><span class="pill ${priColor}">${o.priority}</span></td>
        <td><span class="pill ${stsColor}">${o.status}</span></td>
        <td style="color:var(--muted);">${date}</td>
      </tr>
    `;
  }).join('');
}

function clearOrderFilter() {
  ['order-priority','order-status'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('order-min').value = '';
  loadOrders();
}