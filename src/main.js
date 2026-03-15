/* ============================================================
   GroceryBill Pro — Main Router & App Shell
   ============================================================ */
import { auth } from './auth.js';

// ── Page Registry ─────────────────────────────────────────── //
const PAGES = {
  dashboard: { title: 'Dashboard',    render: renderDashboard },
  billing:   { title: 'New Bill',     render: renderBilling   },
  products:  { title: 'Products',     render: renderProducts  },
  customers: { title: 'Customers',    render: renderCustomers },
  reports:   { title: 'Reports',      render: renderReports   },
  history:   { title: 'Bill History', render: renderHistory   },
  settings:  { title: 'Settings',     render: renderSettings  },
};

let _currentPage = 'dashboard';

// ── Navigation ─────────────────────────────────────────────── //
function navigate(page) {
  if (!PAGES[page]) page = 'dashboard';
  _currentPage = page;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });

  // Update page title
  document.getElementById('page-title').textContent = PAGES[page].title;

  // Render page
  PAGES[page].render();

  // Update hash without triggering reload
  history.replaceState(null, '', '#' + page);
}

// ── Sidebar Toggle ─────────────────────────────────────────── //
function initSidebar() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const main = document.querySelector('.main-wrapper');
  let collapsed = false;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebar.classList.toggle('collapsed', collapsed);
    main.classList.toggle('full', collapsed);
  });
}

// ── Nav Clicks ─────────────────────────────────────────────── //
function initNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(el.dataset.page);
    });
  });
}

// ── Clock ──────────────────────────────────────────────────── //
function startClock() {
  function tick() {
    const now = new Date();
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  tick();
  setInterval(tick, 1000);
}

// ── Toast ──────────────────────────────────────────────────── //
function showToast(message, type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// ── Keyboard Shortcut ──────────────────────────────────────── //
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+B → New Bill
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      navigate('billing');
    }
    // Escape → close modals
    if (e.key === 'Escape') {
      closeInvoiceModal();
      closeProductModal();
    }
  });
}

// ── Apply Settings ─────────────────────────────────────────── //
function applySettingsToUI() {
  const s = DB.getSettings();
  // Shop name in sidebar
  const sn = document.getElementById('sidebar-shop-name');
  if (sn) sn.textContent = s.shopName;
  // Accent color
  if (s.accentColor) {
    document.documentElement.style.setProperty('--accent', s.accentColor);
  }
}

// ── Authentication ─────────────────────────────────────────── //
let currentSession = null;

function initAuth() {
  auth.init((session) => {
    currentSession = session;
    const appEl = document.getElementById('app');
    const authEl = document.getElementById('auth-overlay');

    if (session) {
      // Logged in
      DB.init(session.user.id);
      
      authEl.style.display = 'none';
      appEl.style.display = 'flex';
      
      // Call boot if not already booted
      if (!window.__appBooted) {
        boot();
      } else {
        applySettingsToUI();
        navigate(_currentPage || 'dashboard');
      }
    } else {
      // Logged out
      authEl.style.display = 'flex';
      appEl.style.display = 'none';
    }
  });

  // Wire up logout
  const logoutBtn = document.getElementById('topbar-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await auth.signOut();
      showToast('Logged out successfully', 'info');
    });
  }
}

// Attach auth handlers to window for HTML inline access
window.switchAuthTab = function(tab) {
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  const btn = document.getElementById('auth-submit-btn');
  window.__authMode = tab;

  if (tab === 'login') {
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    btn.textContent = 'Sign In';
  } else {
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    btn.textContent = 'Sign Up';
  }
};

window.handleAuthSubmit = async function(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  const btn = document.getElementById('auth-submit-btn');
  
  errEl.textContent = '';
  const originalText = btn.textContent;
  btn.textContent = 'Loading...';
  btn.disabled = true;

  const mode = window.__authMode || 'login';
  
  let result;
  if (mode === 'login') {
    result = await auth.signIn(email, password);
  } else {
    result = await auth.signUp(email, password);
    if (result.success && !result.data?.session) {
      errEl.textContent = 'Check your email for the confirmation link.';
      errEl.style.color = 'var(--success)';
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }
  }

  if (!result.success) {
    errEl.textContent = result.error.message || 'An error occurred';
    errEl.style.color = 'var(--danger)';
  } else if (mode === 'login') {
    showToast('Logged in successfully', 'success');
  } else {
    showToast('Account created & logged in', 'success');
  }

  btn.textContent = originalText;
  btn.disabled = false;
};

// ── Boot ───────────────────────────────────────────────────── //
function boot() {
  if (window.__appBooted) return; // prevent double boot
  
  applySettingsToUI();
  initSidebar();
  initNav();
  startClock();
  initKeyboardShortcuts();

  // Route based on URL hash
  const hash = location.hash.replace('#', '');
  navigate(PAGES[hash] ? hash : 'dashboard');
  
  window.__appBooted = true;
}

document.addEventListener('DOMContentLoaded', () => {
  // We initialize Auth first. It will call boot() if user is already logged in,
  // or show the login screen.
  initAuth();
});
