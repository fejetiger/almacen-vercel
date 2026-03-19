const app = document.getElementById('app');

const catalogos = {
  conceptos: {
    titulo: 'Catálogo de Conceptos',
    endpoint: '/api/conceptos',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'descripcion', label: 'Descripción' }
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'descripcion', label: 'Descripción', type: 'textarea', required: false }
    ]
  },
  destinos: {
    titulo: 'Catálogo de Destinos',
    endpoint: '/api/destinos',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'ubicacion', label: 'Ubicación' },
      { key: 'responsable', label: 'Responsable' }
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'ubicacion', label: 'Ubicación', type: 'text', required: false },
      { name: 'responsable', label: 'Responsable', type: 'text', required: false }
    ]
  },
  unidades: {
    titulo: 'Catálogo de Unidades de Medida',
    endpoint: '/api/unidades-medida',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'clave', label: 'Clave' },
      { key: 'nombre', label: 'Nombre' }
    ],
    fields: [
      { name: 'clave', label: 'Clave', type: 'text', required: true },
      { name: 'nombre', label: 'Nombre', type: 'text', required: true }
    ]
  },
  productos: {
    titulo: 'Catálogo de Productos',
    endpoint: '/api/productos',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'nombre', label: 'Nombre' },
      { key: 'sku', label: 'SKU' },
      { key: 'precio', label: 'Precio' },
      { key: 'unidad', label: 'Unidad' }
    ],
    fields: [
      { name: 'nombre', label: 'Nombre', type: 'text', required: true },
      { name: 'sku', label: 'SKU', type: 'text', required: true },
      { name: 'precio', label: 'Precio', type: 'number', step: '0.01', required: true },
      { name: 'unidad_medida_id', label: 'Unidad de Medida', type: 'select', required: true, options: [] }
    ]
  }
};

function setActive(moduleName) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.module === moduleName);
  });
}

function buildField(field) {
  if (field.type === 'textarea') {
    return `
      <label class="field">
        <span>${field.label}</span>
        <textarea name="${field.name}" ${field.required ? 'required' : ''}></textarea>
      </label>
    `;
  }

  if (field.type === 'select') {
    const options = field.options.length
      ? field.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')
      : `<option value="">Primero registra una unidad</option>`;

    return `
      <label class="field">
        <span>${field.label}</span>
        <select name="${field.name}" ${field.required ? 'required' : ''}>
          <option value="">Selecciona una opción</option>
          ${options}
        </select>
      </label>
    `;
  }

  return `
    <label class="field">
      <span>${field.label}</span>
      <input
        type="${field.type}"
        name="${field.name}"
        ${field.step ? `step="${field.step}"` : ''}
        ${field.required ? 'required' : ''}
      />
    </label>
  `;
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ocurrió un error');
  }

  return data;
}

function renderRows(columns, rows) {
  if (!rows.length) {
    return `<tr><td colspan="${columns.length}">Sin registros</td></tr>`;
  }

  return rows.map(row => `
    <tr>
      ${columns.map(col => {
        let value = row[col.key] ?? '';
        if (col.key === 'precio' && value !== '') value = Number(value).toFixed(2);
        return `<td>${value}</td>`;
      }).join('')}
    </tr>
  `).join('');
}

async function loadTable(moduleName) {
  const cfg = catalogos[moduleName];
  const rows = await fetchJSON(cfg.endpoint);
  document.getElementById('table-body').innerHTML = renderRows(cfg.columns, rows);
}

async function saveCatalog(moduleName, event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (moduleName === 'productos') {
    payload.precio = Number(payload.precio);
  }

  try {
    await fetchJSON(catalogos[moduleName].endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    document.getElementById('message').innerHTML =
      `<div class="success">Registro guardado correctamente.</div>`;

    form.reset();
    await loadTable(moduleName);
  } catch (error) {
    document.getElementById('message').innerHTML =
      `<div class="error">${error.message}</div>`;
  }
}

async function renderCatalog(moduleName) {
  const cfg = JSON.parse(JSON.stringify(catalogos[moduleName]));

  if (moduleName === 'productos') {
    const unidades = await fetchJSON('/api/unidades-medida');
    cfg.fields = cfg.fields.map(field => {
      if (field.name === 'unidad_medida_id') {
        field.options = unidades.map(u => ({
          value: u.id,
          label: `${u.clave} - ${u.nombre}`
        }));
      }
      return field;
    });
  }

  app.innerHTML = `
    <section class="card">
      <h2>${cfg.titulo}</h2>
      <div id="message"></div>

      <form id="catalog-form" class="form-grid">
        ${cfg.fields.map(buildField).join('')}
        <button class="btn" type="submit">Guardar</button>
      </form>
    </section>

    <section class="card">
      <h3>Listado</h3>
      <table>
        <thead>
          <tr>
            ${cfg.columns.map(col => `<th>${col.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </section>
  `;

  document.getElementById('catalog-form')
    .addEventListener('submit', (event) => saveCatalog(moduleName, event));

  await loadTable(moduleName);
}

function renderDocument(moduleName) {
  const title = moduleName === 'entradas' ? 'Entradas' : 'Salidas';

  app.innerHTML = `
    <section class="card">
      <h2>${title}</h2>
      <p>Esta sección es solo interfaz por ahora.</p>

      <form class="form-grid">
        <label class="field">
          <span>Folio</span>
          <input type="text" placeholder="Ej. ENT-001" />
        </label>

        <label class="field">
          <span>Fecha</span>
          <input type="date" />
        </label>

        <label class="field">
          <span>Responsable</span>
          <input type="text" />
        </label>

        <label class="field">
          <span>Observaciones</span>
          <textarea></textarea>
        </label>

        <button class="btn" type="button">Guardar (demo)</button>
      </form>
    </section>
  `;
}

async function router() {
  const moduleName = location.hash.replace('#', '') || 'conceptos';
  setActive(moduleName);

  if (catalogos[moduleName]) {
    await renderCatalog(moduleName);
  } else {
    renderDocument(moduleName);
  }
}

window.addEventListener('hashchange', router);
router();