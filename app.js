'use strict';

// Constants & Utilities

const STORAGE_KEYS = {
  bookings:  'mechbook_bookings',
  mechanics: 'mechbook_mechanics',
  customers: 'mechbook_customers',
};

function sanitize(str) {
  if (typeof str !== 'string') return String(str ?? '');
  const div = document.createElement('div');
  div.textContent = str;
  // Additionally remove any residual angle brackets that may slip through
  return div.innerHTML
    .replace(/&lt;/g, '<')  // revert safe HTML entities back
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}



function genId(prefix = 'ID') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(amount) {
  const n = parseFloat(amount) || 0;
  return '₹' + n.toLocaleString('en-IN');
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function simulateAsync(minMs = 400, maxMs = 900) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

function analyticsEvent(action, meta = {}) {
  const payload = { action, timestamp: new Date().toISOString(), ...meta };
  console.log('[Analytics] User interacted with Feature Complete CRUD', payload);
}

// Data Store (Localstorage-Backed In-Memory Store)

const Store = (() => {
  const _load = (key) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const _save = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[Store] Failed to persist data:', e.message);
      Toast.show('warning', 'Storage Warning', 'Could not save to local storage. Data may not persist after refresh.');
    }
  };

  let bookings  = _load(STORAGE_KEYS.bookings);
  let mechanics = _load(STORAGE_KEYS.mechanics);
  let customers = _load(STORAGE_KEYS.customers);

  return {
    /* ── BOOKINGS ── */
    getBookings: () => [...bookings],
    getBooking: (id) => bookings.find(b => b.id === id) || null,
    addBooking: (data) => {
      const record = { id: genId('BK'), createdAt: new Date().toISOString(), ...data };
      bookings.unshift(record);
      _save(STORAGE_KEYS.bookings, bookings);
      return record;
    },
    updateBooking: (id, data) => {
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return null;
      bookings[idx] = { ...bookings[idx], ...data, updatedAt: new Date().toISOString() };
      _save(STORAGE_KEYS.bookings, bookings);
      return bookings[idx];
    },
    deleteBooking: (id) => {
      const idx = bookings.findIndex(b => b.id === id);
      if (idx === -1) return false;
      bookings.splice(idx, 1);
      _save(STORAGE_KEYS.bookings, bookings);
      return true;
    },

    /* ── MECHANICS ── */
    getMechanics: () => [...mechanics],
    getMechanic: (id) => mechanics.find(m => m.id === id) || null,
    addMechanic: (data) => {
      const record = { id: genId('MC'), createdAt: new Date().toISOString(), ...data };
      mechanics.unshift(record);
      _save(STORAGE_KEYS.mechanics, mechanics);
      return record;
    },
    updateMechanic: (id, data) => {
      const idx = mechanics.findIndex(m => m.id === id);
      if (idx === -1) return null;
      mechanics[idx] = { ...mechanics[idx], ...data, updatedAt: new Date().toISOString() };
      _save(STORAGE_KEYS.mechanics, mechanics);
      return mechanics[idx];
    },
    deleteMechanic: (id) => {
      const idx = mechanics.findIndex(m => m.id === id);
      if (idx === -1) return false;
      mechanics.splice(idx, 1);
      _save(STORAGE_KEYS.mechanics, mechanics);
      return true;
    },

    /* ── CUSTOMERS ── */
    getCustomers: () => [...customers],
    getCustomer: (id) => customers.find(c => c.id === id) || null,
    addCustomer: (data) => {
      const record = { id: genId('CU'), createdAt: new Date().toISOString(), ...data };
      customers.unshift(record);
      _save(STORAGE_KEYS.customers, customers);
      return record;
    },
    updateCustomer: (id, data) => {
      const idx = customers.findIndex(c => c.id === id);
      if (idx === -1) return null;
      customers[idx] = { ...customers[idx], ...data, updatedAt: new Date().toISOString() };
      _save(STORAGE_KEYS.customers, customers);
      return customers[idx];
    },
    deleteCustomer: (id) => {
      const idx = customers.findIndex(c => c.id === id);
      if (idx === -1) return false;
      customers.splice(idx, 1);
      _save(STORAGE_KEYS.customers, customers);
      return true;
    },
  };
})();

// Toast Notification System

const Toast = (() => {
  const container = document.getElementById('toast-container');
  const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  };

  return {
    show(type = 'info', title = '', message = '', duration = 4000, safeHtml = false) {
      const el = document.createElement('div');
      el.className = `toast toast-${type} anim-in`;
      el.setAttribute('role', 'status');
      const msgContent = safeHtml ? message : sanitize(message);
      el.innerHTML = `
        <span class="toast-icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
          <div class="toast-title">${sanitize(title)}</div>
          ${message ? `<div class="toast-msg">${msgContent}</div>` : ''}
        </div>
      `;
      container.appendChild(el);

      setTimeout(() => {
        el.classList.add('leaving');
        el.addEventListener('animationend', () => el.remove(), { once: true });
      }, duration);
    },
  };
})();

// Navigation

const VIEW_ACTIONS = {
  dashboard: () => openCreateModal(),
  bookings:  () => openCreateModal(),
  mechanics: () => openMechanicModal(),
  customers: () => openCustomerModal(),
};

const VIEWS = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your workshop operations',
    btn: 'New Booking',
  },
  bookings: {
    title: 'Bookings',
    subtitle: 'Create, manage, and track all service bookings',
    btn: 'New Booking',
  },
  mechanics: {
    title: 'Mechanics',
    subtitle: 'Manage your workshop floor staff',
    btn: 'Add Mechanic',
  },
  customers: {
    title: 'Customers',
    subtitle: 'Manage customer profiles and vehicles',
    btn: 'Add Customer',
  },
};

let currentView = 'dashboard';

function navigateTo(view) {
  if (!VIEWS[view]) return;
  currentView = view;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    el.removeAttribute('aria-current');
  });
  const navEl = document.getElementById(`nav-${view}`);
  if (navEl) {
    navEl.classList.add('active');
    navEl.setAttribute('aria-current', 'page');
  }

  // Update header — safe function dispatch, no eval()
  const cfg = VIEWS[view];
  document.getElementById('page-heading').textContent = cfg.title;
  document.getElementById('page-subtitle').textContent = cfg.subtitle;
  const hBtn = document.getElementById('header-create-btn');
  hBtn.textContent = '';
  hBtn.insertAdjacentHTML('beforeend', `<svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/></svg>${cfg.btn}`);
  hBtn.onclick = () => VIEW_ACTIONS[view]?.();

  // Show/hide views
  document.querySelectorAll('.view').forEach(el => {
    el.hidden = true;
    el.classList.remove('active');
  });
  const viewEl = document.getElementById(`view-${view}`);
  if (viewEl) {
    viewEl.hidden = false;
    viewEl.classList.add('active');
  }

  // Refresh the view
  const refreshFns = {
    dashboard: renderDashboard,
    bookings:  renderBookings,
    mechanics: renderMechanics,
    customers: renderCustomers,
  };
  if (refreshFns[view]) refreshFns[view]();

  // Focus main content for accessibility without causing page scroll jump
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.focus({ preventScroll: true });
  }
}

// Connectivity Status

function updateConnectivityStatus() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  const online = navigator.onLine;
  dot.className  = `status-dot${online ? '' : ' offline'}`;
  text.textContent = online ? 'System Online' : 'Offline Mode';
}

window.addEventListener('online',  updateConnectivityStatus);
window.addEventListener('offline', updateConnectivityStatus);

// Sort State

const sortState = {
  bookings:  { col: 'createdAt', dir: 'desc' },
  mechanics: { col: 'name',      dir: 'asc' },
  customers: { col: 'name',      dir: 'asc' },
};

function sortTable(entity, col) {
  if (sortState[entity].col === col) {
    sortState[entity].dir = sortState[entity].dir === 'asc' ? 'desc' : 'asc';
  } else {
    sortState[entity].col = col;
    sortState[entity].dir = 'asc';
  }
  const refreshFns = { bookings: renderBookings, mechanics: renderMechanics, customers: renderCustomers };
  if (refreshFns[entity]) refreshFns[entity]();
}

function applySortAndFilter(items, entity, searchStr = '') {
  const { col, dir } = sortState[entity];
  let filtered = items;

  if (searchStr.trim()) {
    const q = searchStr.trim().toLowerCase();
    filtered = items.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  }

  return filtered.sort((a, b) => {
    let va = a[col] ?? '';
    let vb = b[col] ?? '';
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return dir === 'asc' ? -1 : 1;
    if (va > vb) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// Status Badge Helper

function statusBadge(status) {
  const map = {
    'Pending':     'badge-pending',
    'In Progress': 'badge-progress',
    'Completed':   'badge-completed',
    'Cancelled':   'badge-cancelled',
    'Available':   'badge-available',
    'Busy':        'badge-busy',
    'On Leave':    'badge-leave',
  };
  const cls = map[status] || 'badge-cancelled';
  return `<span class="badge ${cls}" aria-label="Status: ${sanitize(status)}">${sanitize(status)}</span>`;
}

function statusSelect(id, status) {
  const map = {
    'Pending':     'badge-pending',
    'In Progress': 'badge-progress',
    'Completed':   'badge-completed',
    'Cancelled':   'badge-cancelled',
  };
  const cls = map[status] || 'badge-cancelled';
  // Use styling to make the select look like a badge, but clickable
  return `
    <select class="badge ${cls}" style="appearance:none; border:none; cursor:pointer; padding-right:16px; font-family:inherit;" onchange="updateBookingStatus('${id}', this.value)" aria-label="Update status for ${id}">
      <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
      <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
      <option value="Completed" ${status === 'Completed' ? 'selected' : ''}>Completed</option>
      <option value="Cancelled" ${status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
    </select>
  `;
}

function updateBookingStatus(id, status) {
  Store.updateBooking(id, { status });
  analyticsEvent('booking_status_inline', { id, status });
  Toast.show('success', 'Status Updated', `Booking ${id} is now ${status}.`);
  updateBadges();
  renderBookings();
  if (currentView === 'dashboard') renderDashboard();
}

// Dashboard Render

function renderDashboard() {
  const bookings  = Store.getBookings();
  const mechanics = Store.getMechanics();

  // Stats
  document.getElementById('stat-total-bookings').textContent = bookings.length;
  document.getElementById('stat-pending').textContent        = bookings.filter(b => b.status === 'Pending').length;
  document.getElementById('stat-in-progress').textContent    = bookings.filter(b => b.status === 'In Progress').length;
  document.getElementById('stat-mechanics').textContent      = mechanics.length;

  // Recent bookings table (last 10)
  const recent = bookings.slice(0, 10);
  const tbody  = document.getElementById('dashboard-recent-tbody');
  const empty  = document.getElementById('dashboard-empty-state');

  if (recent.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const customers = Store.getCustomers();
  const custMap   = Object.fromEntries(customers.map(c => [c.id, c]));
  const mechMap   = Object.fromEntries(mechanics.map(m => [m.id, m]));

  tbody.innerHTML = recent.map(b => `
    <tr class="anim-in">
      <td><span class="cell-id">${sanitize(b.id)}</span></td>
      <td class="cell-name">${sanitize(custMap[b.customerId]?.name || '—')}</td>
      <td>${sanitize(b.vehicleMake)} ${sanitize(b.vehicleModel)}</td>
      <td>${sanitize(b.serviceType)}</td>
      <td>${sanitize(mechMap[b.mechanicId]?.name || '—')}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${formatDate(b.date)}</td>
    </tr>
  `).join('');
}

// Bookings Crud

function renderBookings(items = null) {
  const search = document.getElementById('booking-search')?.value || '';
  const filter = document.getElementById('status-filter')?.value  || '';

  let bookings = items || Store.getBookings();
  if (filter) bookings = bookings.filter(b => b.status === filter);
  bookings = applySortAndFilter(bookings, 'bookings', search);

  const tbody = document.getElementById('bookings-tbody');
  const empty = document.getElementById('bookings-empty-state');
  const customers = Store.getCustomers();
  const mechanics = Store.getMechanics();
  const custMap   = Object.fromEntries(customers.map(c => [c.id, c]));
  const mechMap   = Object.fromEntries(mechanics.map(m => [m.id, m]));

  if (bookings.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  // Column order matches HTML <thead>: ID | Customer | Vehicle | Service | Mechanic | Estimate | Status | Date | Actions
  tbody.innerHTML = bookings.map(b => `
    <tr class="anim-in">
      <td><span class="cell-id">${sanitize(b.id)}</span></td>
      <td class="cell-name">${sanitize(custMap[b.customerId]?.name || '—')}</td>
      <td>${sanitize(b.vehicleMake)} ${sanitize(b.vehicleModel)}<br><small style="color:var(--c-text-muted);font-family:var(--font-mono);font-size:0.72rem;">${sanitize(b.plate)}</small></td>
      <td>${sanitize(b.serviceType)}</td>
      <td>${sanitize(mechMap[b.mechanicId]?.name || '—')}</td>
      <td><span style="font-family:var(--font-mono);font-size:0.82rem;color:var(--c-success);">${formatCurrency(b.estimate)}</span></td>
      <td>${statusSelect(b.id, b.status)}</td>
      <td>${formatDate(b.date)}</td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-icon" onclick="editBooking('${b.id}')" aria-label="Edit booking ${sanitize(b.id)}" title="Edit">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="btn btn-icon" onclick="confirmDelete('booking','${b.id}')" aria-label="Delete booking ${sanitize(b.id)}" title="Delete" style="color:var(--c-danger)">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterBookings() {
  renderBookings();
}

const debouncedBookingSearch = debounce(() => renderBookings(), 250);
document.getElementById('booking-search')?.addEventListener('input', debouncedBookingSearch);

function exportBookingsToCSV() {
  const search = document.getElementById('booking-search')?.value || '';
  const filter = document.getElementById('status-filter')?.value  || '';
  
  let bookings = Store.getBookings();
  if (filter) bookings = bookings.filter(b => b.status === filter);
  bookings = applySortAndFilter(bookings, 'bookings', search);
  
  if (bookings.length === 0) {
    Toast.show('warning', 'Export Failed', 'No bookings to export.');
    return;
  }
  
  const customers = Store.getCustomers();
  const mechanics = Store.getMechanics();
  const custMap   = Object.fromEntries(customers.map(c => [c.id, c.name]));
  const mechMap   = Object.fromEntries(mechanics.map(m => [m.id, m.name]));
  
  const headers = ['ID', 'Customer', 'Vehicle Make', 'Vehicle Model', 'Plate', 'Service Type', 'Mechanic', 'Estimate', 'Status', 'Date', 'Notes'];
  const rows = bookings.map(b => [
    b.id,
    custMap[b.customerId] || '',
    b.vehicleMake || '',
    b.vehicleModel || '',
    b.plate || '',
    b.serviceType || '',
    mechMap[b.mechanicId] || '',
    b.estimate || 0,
    b.status || '',
    b.date || '',
    b.notes || ''
  ]);
  
  let csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n"
    + rows.map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
    
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `mechbook_bookings_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  
  analyticsEvent('bookings_exported_csv', { count: bookings.length });
  Toast.show('success', 'Export Complete', `Successfully exported ${bookings.length} bookings to CSV.`);
}

/* ── Booking Modal ── */

function openCreateModal() {
  resetBookingForm();
  populateBookingSelects();
  document.getElementById('booking-modal-title').textContent = 'New Booking';
  document.getElementById('booking-submit-btn').querySelector('.btn-label').textContent = 'Save Booking';
  document.getElementById('b-edit-id').value = '';
  // Set default date to today
  document.getElementById('b-date').value = new Date().toISOString().split('T')[0];
  openModal('booking-modal');
}

function editBooking(id) {
  const booking = Store.getBooking(id);
  if (!booking) return;

  populateBookingSelects();
  document.getElementById('booking-modal-title').textContent = 'Edit Booking';
  document.getElementById('booking-submit-btn').querySelector('.btn-label').textContent = 'Update Booking';
  document.getElementById('b-edit-id').value = id;

  document.getElementById('b-customer').value    = booking.customerId  || '';
  document.getElementById('b-mechanic').value    = booking.mechanicId  || '';
  document.getElementById('b-vehicle-make').value = booking.vehicleMake || '';
  document.getElementById('b-vehicle-model').value = booking.vehicleModel || '';
  document.getElementById('b-plate').value       = booking.plate       || '';
  document.getElementById('b-service-type').value = booking.serviceType || '';
  document.getElementById('b-date').value        = booking.date        || '';
  document.getElementById('b-status').value      = booking.status      || 'Pending';
  document.getElementById('b-notes').value       = booking.notes || '';
  document.getElementById('b-estimate').value    = booking.estimate    || '';

  openModal('booking-modal');
}

function populateBookingSelects() {
  const custSel = document.getElementById('b-customer');
  const mechSel = document.getElementById('b-mechanic');

  const customers = Store.getCustomers();
  const mechanics = Store.getMechanics();

  custSel.innerHTML = '<option value="">— Select Customer —</option>' +
    customers.map(c => `<option value="${c.id}">${sanitize(c.name)}</option>`).join('');

  mechSel.innerHTML = '<option value="">— Select Mechanic —</option>' +
    mechanics.map(m => `<option value="${m.id}">${sanitize(m.name)} (${sanitize(m.specialty)})</option>`).join('');
}

function resetBookingForm() {
  const form = document.getElementById('booking-form');
  form.reset();
  form.querySelectorAll('.field-error').forEach(el => { el.hidden = true; el.textContent = ''; });
  form.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

async function handleBookingSubmit(e) {
  e.preventDefault();

  if (!validateBookingForm()) return;

  const btn = document.getElementById('booking-submit-btn');
  const spinner = btn.querySelector('.btn-spinner');
  const label   = btn.querySelector('.btn-label');
  btn.disabled  = true;
  spinner.hidden = false;
  label.style.opacity = '0.5';

  // Simulate async / network latency (3G resilience)
  await simulateAsync();

  const editId = document.getElementById('b-edit-id').value;

  const data = {
    customerId:   document.getElementById('b-customer').value,
    mechanicId:   document.getElementById('b-mechanic').value,
    vehicleMake:  document.getElementById('b-vehicle-make').value.trim(),
    vehicleModel: document.getElementById('b-vehicle-model').value.trim(),
    plate:        document.getElementById('b-plate').value.trim().toUpperCase(),
    serviceType:  document.getElementById('b-service-type').value,
    date:         document.getElementById('b-date').value,
    status:       document.getElementById('b-status').value,
    notes:        document.getElementById('b-notes').value.trim(),
    estimate:     parseFloat(document.getElementById('b-estimate').value) || 0,
  };

  if (editId) {
    Store.updateBooking(editId, data);
    analyticsEvent('booking_updated', { id: editId, serviceType: data.serviceType });
    Toast.show('success', 'Booking Updated', `Booking ${editId} has been updated successfully.`);
  } else {
    const record = Store.addBooking(data);
    analyticsEvent('booking_created', { id: record.id, serviceType: data.serviceType });
    Toast.show('success', 'Booking Created', `New booking ${record.id} has been created.`);
  }

  btn.disabled  = false;
  spinner.hidden = true;
  label.style.opacity = '1';

  closeModal('booking-modal');
  updateBadges();

  if (currentView === 'dashboard') renderDashboard();
  else renderBookings();
}

function validateBookingForm() {
  let valid = true;
  const rules = [
    { id: 'b-customer',     errId: 'b-customer-err',     msg: 'Please select a customer.' },
    { id: 'b-mechanic',     errId: 'b-mechanic-err',     msg: 'Please assign a mechanic.' },
    { id: 'b-vehicle-make', errId: 'b-vehicle-make-err', msg: 'Vehicle make is required.' },
    { id: 'b-vehicle-model',errId: 'b-vehicle-model-err',msg: 'Vehicle model is required.' },
    { id: 'b-plate',        errId: 'b-plate-err',        msg: 'License plate is required.' },
    { id: 'b-service-type', errId: 'b-service-type-err', msg: 'Please select a service type.' },
    { id: 'b-date',         errId: 'b-date-err',         msg: 'Please select a booking date.' },
    { id: 'b-estimate',     errId: 'b-estimate-err',     msg: 'Please enter a cost estimate.' },
  ];

  rules.forEach(({ id, errId, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    const val = el.value.trim();

    if (!val) {
      el.classList.add('error');
      err.textContent = msg;
      err.hidden = false;
      valid = false;
    } else {
      el.classList.remove('error');
      err.textContent = '';
      err.hidden = true;
    }
  });

  // Extra: validate estimate is a positive number
  const estimateEl  = document.getElementById('b-estimate');
  const estimateErr = document.getElementById('b-estimate-err');
  const estVal = parseFloat(estimateEl.value);
  if (estimateEl.value.trim() && (isNaN(estVal) || estVal < 0)) {
    estimateEl.classList.add('error');
    estimateErr.textContent = 'Estimate must be a positive number.';
    estimateErr.hidden = false;
    valid = false;
  }

  // Announce first error to screen readers
  if (!valid) {
    const firstErr = document.querySelector('.field-error:not([hidden])');
    if (firstErr) firstErr.setAttribute('tabindex', '-1'), firstErr.focus();
  }

  return valid;
}

// Mechanics Crud

function renderMechanics() {
  const search = document.getElementById('mechanic-search')?.value || '';
  let mechanics = Store.getMechanics();
  mechanics = applySortAndFilter(mechanics, 'mechanics', search);

  const grid  = document.getElementById('mechanics-grid');
  const empty = document.getElementById('mechanics-empty-state');

  if (mechanics.length === 0) {
    grid.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const bookings = Store.getBookings();
  const activeBookingCount = (mechId) => bookings.filter(b => b.mechanicId === mechId && b.status !== 'Completed' && b.status !== 'Cancelled').length;

  grid.innerHTML = mechanics.map(m => {
    const initials = m.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const bookingCount = activeBookingCount(m.id);
    return `
      <article class="mechanic-card anim-in" role="listitem" aria-label="Mechanic: ${sanitize(m.name)}">
        <div class="mc-header">
          <div class="mc-avatar" aria-hidden="true">${initials}</div>
          <div class="mc-info">
            <div class="mc-name">${sanitize(m.name)}</div>
            <div class="mc-id">${sanitize(m.id)}</div>
          </div>
        </div>
        <div class="mc-details">
          <div class="mc-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>
            <span>${sanitize(m.specialty)}</span>
          </div>
          <div class="mc-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>
            <span>${sanitize(m.phone)}</span>
          </div>
          <div class="mc-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
            <span>${sanitize(m.experience)} yrs experience</span>
          </div>
          <div class="mc-detail">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>
            <span>${bookingCount} active booking${bookingCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="mc-footer">
          ${statusBadge(m.availability)}
          <div class="mc-actions">
            <button class="btn btn-icon" onclick="editMechanic('${m.id}')" aria-label="Edit mechanic ${sanitize(m.name)}" title="Edit">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
            </button>
            <button class="btn btn-icon" onclick="confirmDelete('mechanic','${m.id}')" aria-label="Delete mechanic ${sanitize(m.name)}" title="Delete" style="color:var(--c-danger)">
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function filterMechanics() { renderMechanics(); }

/* ── Mechanic Modal ── */

function openMechanicModal() {
  resetMechanicForm();
  document.getElementById('mechanic-modal-title').textContent = 'Add Mechanic';
  document.getElementById('mechanic-submit-btn').textContent = 'Save Mechanic';
  document.getElementById('m-edit-id').value = '';
  openModal('mechanic-modal');
}

function editMechanic(id) {
  const mechanic = Store.getMechanic(id);
  if (!mechanic) return;

  document.getElementById('mechanic-modal-title').textContent = 'Edit Mechanic';
  document.getElementById('mechanic-submit-btn').textContent = 'Update Mechanic';
  document.getElementById('m-edit-id').value = id;

  document.getElementById('m-name').value         = mechanic.name || '';
  document.getElementById('m-phone').value        = mechanic.phone || '';
  document.getElementById('m-specialty').value    = mechanic.specialty    || '';
  document.getElementById('m-experience').value   = mechanic.experience   || '';
  document.getElementById('m-availability').value = mechanic.availability || 'Available';

  openModal('mechanic-modal');
}

function resetMechanicForm() {
  const form = document.getElementById('mechanic-form');
  form.reset();
  form.querySelectorAll('.field-error').forEach(el => { el.hidden = true; el.textContent = ''; });
  form.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

async function handleMechanicSubmit(e) {
  e.preventDefault();
  if (!validateMechanicForm()) return;

  const btn = document.getElementById('mechanic-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  await simulateAsync(300, 600);

  const editId = document.getElementById('m-edit-id').value;

  const data = {
    name:         document.getElementById('m-name').value.trim(),
    phone:        document.getElementById('m-phone').value.trim(),
    specialty:    document.getElementById('m-specialty').value,
    experience:   parseInt(document.getElementById('m-experience').value, 10) || 0,
    availability: document.getElementById('m-availability').value,
  };

  if (editId) {
    Store.updateMechanic(editId, data);
    analyticsEvent('mechanic_updated', { id: editId, name: data.name });
    Toast.show('success', 'Mechanic Updated', `${data.name}'s profile has been updated.`);
  } else {
    const record = Store.addMechanic(data);
    analyticsEvent('mechanic_created', { id: record.id, name: data.name });
    Toast.show('success', 'Mechanic Added', `${data.name} has been added to the roster.`);
  }

  btn.disabled = false;
  btn.textContent = editId ? 'Update Mechanic' : 'Save Mechanic';
  closeModal('mechanic-modal');
  updateBadges();
  renderMechanics();
}

function validateMechanicForm() {
  let valid = true;
  const rules = [
    { id: 'm-name',       errId: 'm-name-err',       msg: 'Full name is required.' },
    { id: 'm-phone',      errId: 'm-phone-err',      msg: 'Phone number is required.' },
    { id: 'm-specialty',  errId: 'm-specialty-err',  msg: 'Please select a specialty.' },
    { id: 'm-experience', errId: 'm-experience-err', msg: 'Please enter years of experience.' },
  ];

  rules.forEach(({ id, errId, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el.value.trim()) {
      el.classList.add('error');
      err.textContent = msg;
      err.hidden = false;
      valid = false;
    } else {
      el.classList.remove('error');
      err.hidden = true;
    }
  });

  // Phone validation: must be numeric, 7–15 chars
  const phoneEl  = document.getElementById('m-phone');
  const phoneErr = document.getElementById('m-phone-err');
  const phoneVal = phoneEl.value.trim();
  if (phoneVal && !/^\+?[\d\s\-]{7,15}$/.test(phoneVal)) {
    phoneEl.classList.add('error');
    phoneErr.textContent = 'Enter a valid phone number (7–15 digits).';
    phoneErr.hidden = false;
    valid = false;
  }

  return valid;
}

// Customers Crud

function renderCustomers() {
  const search = document.getElementById('customer-search')?.value || '';
  let customers = Store.getCustomers();
  customers = applySortAndFilter(customers, 'customers', search);

  const tbody = document.getElementById('customers-tbody');
  const empty = document.getElementById('customers-empty-state');

  if (customers.length === 0) {
    tbody.innerHTML = '';
    empty.hidden = false;
    return;
  }
  empty.hidden = true;

  const bookings = Store.getBookings();
  const bookingCountFor = (custId) => bookings.filter(b => b.customerId === custId).length;

  tbody.innerHTML = customers.map(c => `
    <tr class="anim-in">
      <td><span class="cell-id">${sanitize(c.id)}</span></td>
      <td class="cell-name">${sanitize(c.name)}</td>
      <td>${sanitize(c.phone)}</td>
      <td>${c.email ? sanitize(c.email) : '<span style="color:var(--c-text-muted)">—</span>'}</td>
      <td><span style="font-size:0.8rem;color:var(--c-text-secondary)">${sanitize(c.vehicles)}</span></td>
      <td><span style="font-family:var(--font-mono);font-size:0.82rem;">${bookingCountFor(c.id)}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-icon" onclick="editCustomer('${c.id}')" aria-label="Edit customer ${sanitize(c.name)}" title="Edit">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
          </button>
          <button class="btn btn-icon" onclick="confirmDelete('customer','${c.id}')" aria-label="Delete customer ${sanitize(c.name)}" title="Delete" style="color:var(--c-danger)">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterCustomers() { renderCustomers(); }

/* ── Customer Modal ── */

function openCustomerModal() {
  resetCustomerForm();
  document.getElementById('customer-modal-title').textContent = 'Add Customer';
  document.getElementById('customer-submit-btn').textContent = 'Save Customer';
  document.getElementById('c-edit-id').value = '';
  openModal('customer-modal');
}

function editCustomer(id) {
  const customer = Store.getCustomer(id);
  if (!customer) return;

  document.getElementById('customer-modal-title').textContent = 'Edit Customer';
  document.getElementById('customer-submit-btn').textContent = 'Update Customer';
  document.getElementById('c-edit-id').value = id;

  document.getElementById('c-name').value     = customer.name     || '';
  document.getElementById('c-phone').value    = customer.phone    || '';
  document.getElementById('c-email').value    = customer.email    || '';
  document.getElementById('c-vehicles').value = customer.vehicles || '';

  openModal('customer-modal');
}

function resetCustomerForm() {
  const form = document.getElementById('customer-form');
  form.reset();
  form.querySelectorAll('.field-error').forEach(el => { el.hidden = true; el.textContent = ''; });
  form.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

async function handleCustomerSubmit(e) {
  e.preventDefault();
  if (!validateCustomerForm()) return;

  const btn = document.getElementById('customer-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  await simulateAsync(300, 600);

  const editId = document.getElementById('c-edit-id').value;

  const data = {
    name:     document.getElementById('c-name').value.trim(),
    phone:    document.getElementById('c-phone').value.trim(),
    email:    document.getElementById('c-email').value.trim(),
    vehicles: document.getElementById('c-vehicles').value.trim(),
  };

  if (editId) {
    Store.updateCustomer(editId, data);
    analyticsEvent('customer_updated', { id: editId, name: data.name });
    Toast.show('success', 'Customer Updated', `${data.name}'s profile has been updated.`);
  } else {
    const record = Store.addCustomer(data);
    analyticsEvent('customer_created', { id: record.id, name: data.name });
    Toast.show('success', 'Customer Added', `${data.name} has been added to the system.`);
  }

  btn.disabled = false;
  btn.textContent = editId ? 'Update Customer' : 'Save Customer';
  closeModal('customer-modal');
  updateBadges();
  renderCustomers();
}

function validateCustomerForm() {
  let valid = true;
  const rules = [
    { id: 'c-name',     errId: 'c-name-err',     msg: 'Customer name is required.' },
    { id: 'c-phone',    errId: 'c-phone-err',    msg: 'Phone number is required.' },
    { id: 'c-vehicles', errId: 'c-vehicles-err', msg: 'Please enter at least one vehicle.' },
  ];

  rules.forEach(({ id, errId, msg }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el.value.trim()) {
      el.classList.add('error');
      err.textContent = msg;
      err.hidden = false;
      valid = false;
    } else {
      el.classList.remove('error');
      err.hidden = true;
    }
  });

  // Email validation (optional but must be valid if provided)
  const emailEl  = document.getElementById('c-email');
  const emailErr = document.getElementById('c-email-err');
  const emailVal = emailEl.value.trim();
  if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
    emailEl.classList.add('error');
    emailErr.textContent = 'Please enter a valid email address.';
    emailErr.hidden = false;
    valid = false;
  } else {
    emailEl.classList.remove('error');
    emailErr.hidden = true;
  }

  // Phone validation
  const phoneEl  = document.getElementById('c-phone');
  const phoneErr = document.getElementById('c-phone-err');
  const phoneVal = phoneEl.value.trim();
  if (phoneVal && !/^\+?[\d\s\-]{7,15}$/.test(phoneVal)) {
    phoneEl.classList.add('error');
    phoneErr.textContent = 'Enter a valid phone number (7–15 digits).';
    phoneErr.hidden = false;
    valid = false;
  }

  return valid;
}

// Modal Management (Focus Trap + Keyboard)

let _previousFocus = null;

function openModal(id) {
  _previousFocus = document.activeElement;
  const backdrop = document.getElementById(id);
  backdrop.hidden = false;

  // Focus first focusable element after render
  requestAnimationFrame(() => {
    const focusable = backdrop.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();
  });

  // Trap focus inside modal
  backdrop._trapHandler = (e) => trapFocus(e, backdrop);
  backdrop.addEventListener('keydown', backdrop._trapHandler);

  // Close on Escape
  backdrop._escHandler = (e) => { if (e.key === 'Escape') closeModal(id); };
  document.addEventListener('keydown', backdrop._escHandler);

  // Close on backdrop click
  backdrop._clickHandler = (e) => { if (e.target === backdrop) closeModal(id); };
  backdrop.addEventListener('click', backdrop._clickHandler);
}

function closeModal(id) {
  const backdrop = document.getElementById(id);
  backdrop.hidden = true;

  if (backdrop._trapHandler)  backdrop.removeEventListener('keydown', backdrop._trapHandler);
  if (backdrop._escHandler)   document.removeEventListener('keydown', backdrop._escHandler);
  if (backdrop._clickHandler) backdrop.removeEventListener('click', backdrop._clickHandler);

  // Return focus to the element that opened the modal
  if (_previousFocus && typeof _previousFocus.focus === 'function') {
    _previousFocus.focus();
  }
}

function trapFocus(e, container) {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.hidden && el.offsetParent !== null);

  if (focusable.length === 0) return;
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { last.focus(); e.preventDefault(); }
  } else {
    if (document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
}

// Confirm Delete Dialog

let _pendingDelete = { entity: null, id: null };

function confirmDelete(entity, id) {
  _pendingDelete = { entity, id };
  const messages = {
    booking:  'Are you sure you want to delete this booking? This action cannot be undone.',
    mechanic: 'Are you sure you want to delete this mechanic? Any bookings assigned to them will lose mechanic assignment.',
    customer: 'Are you sure you want to delete this customer? This action cannot be undone.',
  };
  document.getElementById('confirm-desc').textContent = messages[entity] || messages.booking;
  openModal('confirm-dialog');
}

let _undoStack = {};

function undoDelete(entity, id) {
  const record = _undoStack[id];
  if (!record) return;

  if (entity === 'booking') Store.addBooking(record);
  else if (entity === 'mechanic') Store.addMechanic(record);
  else if (entity === 'customer') Store.addCustomer(record);

  delete _undoStack[id];
  Toast.show('success', 'Restored', 'The record has been restored successfully.');
  
  updateBadges();
  const refreshFns = { booking: renderBookings, mechanic: renderMechanics, customer: renderCustomers };
  if (currentView === 'dashboard') renderDashboard();
  else refreshFns[entity]?.();
}

document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  const { entity, id } = _pendingDelete;
  if (!entity || !id) return;

  const btn = document.getElementById('confirm-delete-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';

  await simulateAsync(300, 500);
  
  // Backup record for undo capability
  const getMap = {
    booking:  () => Store.getBooking(id),
    mechanic: () => Store.getMechanic(id),
    customer: () => Store.getCustomer(id),
  };
  const recordToBackup = getMap[entity]?.();
  if (recordToBackup) {
    // Deep clone to ensure no reference issues
    _undoStack[id] = JSON.parse(JSON.stringify(recordToBackup));
  }

  const deleteMap = {
    booking:  () => Store.deleteBooking(id),
    mechanic: () => Store.deleteMechanic(id),
    customer: () => Store.deleteCustomer(id),
  };

  const success = deleteMap[entity]?.();

  btn.disabled = false;
  btn.textContent = 'Delete';
  closeModal('confirm-dialog');

  if (success) {
    analyticsEvent(`${entity}_deleted`, { id });
    const labels = { booking: 'Booking', mechanic: 'Mechanic', customer: 'Customer' };
    
    // Toast with Undo button (persists a bit longer to allow clicking)
    const undoHtml = `<button onclick="undoDelete('${entity}', '${id}')" style="background:var(--c-accent-dim);border:1px solid var(--c-accent);border-radius:4px;color:var(--c-accent);font-size:0.75rem;padding:2px 8px;cursor:pointer;margin-top:6px;font-weight:600;transition:all 0.2s;">Undo Delete</button>`;
    Toast.show('info', `${labels[entity]} Deleted`, `The record has been removed.<br>${undoHtml}`, 6000, true);

    updateBadges();
    const refreshFns = { booking: renderBookings, mechanic: renderMechanics, customer: renderCustomers };
    if (currentView === 'dashboard') renderDashboard();
    else refreshFns[entity]?.();
  }
});

// Global Search

const debouncedGlobalSearch = debounce((query) => {
  if (!query.trim()) return;
  analyticsEvent('global_search', { query });

  const q = query.toLowerCase().trim();
  const results = {
    bookings:  Store.getBookings().filter(b => Object.values(b).some(v => String(v).toLowerCase().includes(q))),
    mechanics: Store.getMechanics().filter(m => Object.values(m).some(v => String(v).toLowerCase().includes(q))),
    customers: Store.getCustomers().filter(c => Object.values(c).some(v => String(v).toLowerCase().includes(q))),
  };

  const total = results.bookings.length + results.mechanics.length + results.customers.length;
  if (total === 0) {
    Toast.show('info', 'No Results', `No records matched "${query}".`);
    return;
  }

  // Navigate to the entity with most results
  const best = Object.entries(results).sort((a, b) => b[1].length - a[1].length)[0][0];
  navigateTo(best);

  // Populate the view's search field with the query
  const viewSearchIds = { bookings: 'booking-search', mechanics: 'mechanic-search', customers: 'customer-search' };
  const inputEl = document.getElementById(viewSearchIds[best]);
  if (inputEl) { inputEl.value = query; inputEl.dispatchEvent(new Event('input')); }
}, 400);

document.getElementById('global-search').addEventListener('input', (e) => {
  debouncedGlobalSearch(e.target.value);
});

// Nav Badge Counts

function updateBadges() {
  document.getElementById('nav-badge-bookings').textContent  = Store.getBookings().length;
  document.getElementById('nav-badge-mechanics').textContent = Store.getMechanics().length;
  document.getElementById('nav-badge-customers').textContent = Store.getCustomers().length;
}

// Seed Data (Demo State For First Launch)

function seedDemoData() {
  // Only seed if store is empty
  if (Store.getMechanics().length > 0 || Store.getCustomers().length > 0) return;

  // Seed mechanics
  const m1 = Store.addMechanic({ name: 'Rajesh Kumar',   phone: '9876543210', specialty: 'Engine & Transmission', experience: 12, availability: 'Available' });
  const m2 = Store.addMechanic({ name: 'Anil Verma',     phone: '9823456701', specialty: 'Electrical Systems',    experience: 8,  availability: 'Busy' });
  const m3 = Store.addMechanic({ name: 'Suresh Nair',    phone: '9845678923', specialty: 'Brakes & Suspension',   experience: 6,  availability: 'Available' });
  const m4 = Store.addMechanic({ name: 'Deepak Chauhan', phone: '9812345678', specialty: 'AC & Cooling',          experience: 4,  availability: 'On Leave' });

  // Seed customers
  const c1 = Store.addCustomer({ name: 'Priya Sharma',   phone: '9711234560', email: 'priya@example.com',  vehicles: 'Toyota Camry 2021' });
  const c2 = Store.addCustomer({ name: 'Amit Joshi',     phone: '9988776655', email: 'amit@workmail.in',   vehicles: 'Honda City 2019, Maruti Swift' });
  const c3 = Store.addCustomer({ name: 'Neha Gupta',     phone: '9934567812', email: '',                   vehicles: 'Hyundai Creta 2022' });
  const c4 = Store.addCustomer({ name: 'Rohit Singh',    phone: '9870011223', email: 'rohit@outlook.com',  vehicles: 'Tata Nexon EV' });

  // Seed bookings
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  Store.addBooking({ customerId: c1.id, mechanicId: m1.id, vehicleMake: 'Toyota', vehicleModel: 'Camry 2021', plate: 'MH12AB1234', serviceType: 'Full Service',        date: today,      status: 'In Progress', notes: 'Customer requested synthetic oil.', estimate: 4500 });
  Store.addBooking({ customerId: c2.id, mechanicId: m2.id, vehicleMake: 'Honda',  vehicleModel: 'City 2019',  plate: 'DL9C5678',   serviceType: 'Engine Diagnostic',   date: today,      status: 'Pending',     notes: 'Check engine light on.',            estimate: 1500 });
  Store.addBooking({ customerId: c3.id, mechanicId: m3.id, vehicleMake: 'Hyundai',vehicleModel: 'Creta 2022', plate: 'KA01MN9999', serviceType: 'Brake Inspection',    date: yesterday,  status: 'Completed',   notes: 'Replaced front brake pads.',        estimate: 2800 });
  Store.addBooking({ customerId: c4.id, mechanicId: m1.id, vehicleMake: 'Tata',   vehicleModel: 'Nexon EV',   plate: 'GJ05AB3456', serviceType: 'AC Service',          date: yesterday,  status: 'Pending',     notes: '',                                  estimate: 3200 });
  Store.addBooking({ customerId: c2.id, mechanicId: m4.id, vehicleMake: 'Maruti', vehicleModel: 'Swift 2020', plate: 'RJ14CD7890', serviceType: 'Oil Change',          date: today,      status: 'Completed',   notes: '5W-30 synthetic oil used.',         estimate: 800 });
  Store.addBooking({ customerId: c1.id, mechanicId: m3.id, vehicleMake: 'Toyota', vehicleModel: 'Camry 2021', plate: 'MH12AB1234', serviceType: 'Wheel Alignment',     date: today,      status: 'Cancelled',   notes: 'Customer rescheduled.',             estimate: 1200 });
}

// Initialization

function init() {
  updateConnectivityStatus();
  seedDemoData();
  updateBadges();
  navigateTo('dashboard');

  // Live-clear errors on user typing
  document.querySelectorAll('.form-input').forEach(el => {
    el.addEventListener('input', () => {
      if (el.classList.contains('error')) {
        el.classList.remove('error');
        const errEl = document.getElementById(el.id + '-err');
        if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
      }
    });
  });

  console.log('%c[MechBook Pro] System initialized. ENG-159184 — Mechanic Booking System CRUD.', 'color:#a78bfa;font-weight:bold;');
  analyticsEvent('app_initialized', { version: '1.0.0', timestamp: new Date().toISOString() });
}

// Kick off on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
