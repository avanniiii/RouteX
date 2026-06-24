async function loadMaterials() {
  const cat = document.getElementById('mat-cat')?.value || '';
  const maxPrice = document.getElementById('mat-price')?.value || '';

  const params = new URLSearchParams();
  if (cat) params.set('category', cat);
  if (maxPrice) params.set('maxPrice', maxPrice);

  const res = await fetch(`/api/materials?${params}`);
  const json = await res.json();

  const tb = document.getElementById('materials-table');
  if (!json.data?.length) {
    tb.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">🏭</div>No materials found</div></td></tr>`;
    return;
  }

  tb.innerHTML = json.data.map(m => {
    const stockColor = m.stock?.qty < 100 ? 'var(--red)' : m.stock?.qty < 200 ? 'var(--accent3)' : 'var(--accent)';
    const topSupplier = m.suppliers?.[0];
    return `
      <tr>
        <td style="font-family:monospace;font-size:0.8rem;color:var(--accent2);">${m.materialId}</td>
        <td style="font-weight:600;">${m.name}</td>
        <td><span class="pill pill-purple">${m.category}</span></td>
        <td>
          <span style="font-weight:700;color:${stockColor};">${m.stock?.qty} ${m.stock?.unit}</span>
          ${m.stock?.qty < 100 ? '<span class="pill pill-red" style="margin-left:4px;">Low</span>' : ''}
        </td>
        <td style="font-weight:600;">₹${m.pricePerUnit?.toFixed(2)}</td>
        <td style="color:var(--muted);">${m.stock?.warehouse || '-'}</td>
        <td style="font-size:0.8rem;">${topSupplier ? `${topSupplier.name} ⭐${topSupplier.rating}` : '-'}</td>
      </tr>
    `;
  }).join('');
}

function clearMatFilter() {
  document.getElementById('mat-cat').value = '';
  document.getElementById('mat-price').value = '';
  loadMaterials();
}