/* ============================================================
   GroceryBill Pro — Data Layer (localStorage) v2
   ============================================================ */

const DB = (() => {
  const BASE_KEYS = {
    products:  'gb_products',
    bills:     'gb_bills',
    settings:  'gb_settings',
    customers: 'gb_customers',
    holdBills: 'gb_hold_bills',
    stockLog:  'gb_stock_log',
  };

  function getKey(k) {
    const uid = window.authUserId || 'anon';
    return `${uid}_${BASE_KEYS[k]}`;
  }

  const KEYS = {
    get products()  { return getKey('products'); },
    get bills()     { return getKey('bills'); },
    get settings()  { return getKey('settings'); },
    get customers() { return getKey('customers'); },
    get holdBills() { return getKey('holdBills'); },
    get stockLog()  { return getKey('stockLog'); }
  };

  /* ── Default Settings ─────────────────────────────────── */
  const DEFAULT_SETTINGS = {
    shopName: 'GroceryBill Pro',
    tagline: 'Your Neighbourhood Grocery Store',
    address: '123, Market Road, City - 560001',
    phone: '+91 98765 43210',
    gstin: '29AABCU9603R1ZM',
    taxRate: 5,
    currency: '₹',
    thankYou: 'Thank you for shopping with us!',
    accentColor: '#00d4aa',
    lowStockThreshold: 10,
  };

  /* ── Seed Products ────────────────────────────────────── */
  const SEED_PRODUCTS = [
    { id: 'p1',  name: 'Basmati Rice',      category: 'Grains',     emoji: '🌾', price: 65,  costPrice: 52,  unit: 'kg',   stock: 150 },
    { id: 'p2',  name: 'Whole Wheat Atta',  category: 'Grains',     emoji: '🌾', price: 45,  costPrice: 36,  unit: 'kg',   stock: 100 },
    { id: 'p3',  name: 'Toor Dal',          category: 'Pulses',     emoji: '🫘', price: 120, costPrice: 95,  unit: 'kg',   stock: 80  },
    { id: 'p4',  name: 'Moong Dal',         category: 'Pulses',     emoji: '🫘', price: 110, costPrice: 88,  unit: 'kg',   stock: 60  },
    { id: 'p5',  name: 'Sunflower Oil',     category: 'Oils',       emoji: '🫙', price: 145, costPrice: 118, unit: 'L',    stock: 50  },
    { id: 'p6',  name: 'Mustard Oil',       category: 'Oils',       emoji: '🫙', price: 130, costPrice: 105, unit: 'L',    stock: 40  },
    { id: 'p7',  name: 'Full Cream Milk',   category: 'Dairy',      emoji: '🥛', price: 58,  costPrice: 48,  unit: 'L',    stock: 8   },
    { id: 'p8',  name: 'Paneer',            category: 'Dairy',      emoji: '🧀', price: 80,  costPrice: 62,  unit: '200g', stock: 5   },
    { id: 'p9',  name: 'Amul Butter',       category: 'Dairy',      emoji: '🧈', price: 55,  costPrice: 44,  unit: '100g', stock: 35  },
    { id: 'p10', name: 'Tomatoes',          category: 'Vegetables', emoji: '🍅', price: 30,  costPrice: 20,  unit: 'kg',   stock: 20  },
    { id: 'p11', name: 'Onions',            category: 'Vegetables', emoji: '🧅', price: 25,  costPrice: 16,  unit: 'kg',   stock: 40  },
    { id: 'p12', name: 'Potatoes',          category: 'Vegetables', emoji: '🥔', price: 22,  costPrice: 14,  unit: 'kg',   stock: 50  },
    { id: 'p13', name: 'Bananas',           category: 'Fruits',     emoji: '🍌', price: 40,  costPrice: 28,  unit: 'doz',  stock: 7   },
    { id: 'p14', name: 'Apples',            category: 'Fruits',     emoji: '🍎', price: 120, costPrice: 90,  unit: 'kg',   stock: 12  },
    { id: 'p15', name: 'Aashirvaad Salt',   category: 'Spices',     emoji: '🧂', price: 20,  costPrice: 14,  unit: 'kg',   stock: 60  },
    { id: 'p16', name: 'Turmeric Powder',   category: 'Spices',     emoji: '🌶️', price: 35,  costPrice: 25,  unit: '200g', stock: 45  },
    { id: 'p17', name: 'Red Chilli Powder', category: 'Spices',     emoji: '🌶️', price: 40,  costPrice: 28,  unit: '200g', stock: 40  },
    { id: 'p18', name: 'Sugar',             category: 'Staples',    emoji: '🍬', price: 42,  costPrice: 34,  unit: 'kg',   stock: 90  },
    { id: 'p19', name: 'Biscuits (Parle-G)',category: 'Snacks',     emoji: '🍪', price: 10,  costPrice: 7,   unit: 'pkt',  stock: 100 },
    { id: 'p20', name: 'Maggi Noodles',     category: 'Snacks',     emoji: '🍜', price: 14,  costPrice: 10,  unit: 'pkt',  stock: 80  },
    { id: 'p21', name: 'Tata Tea Gold',     category: 'Beverages',  emoji: '🍵', price: 85,  costPrice: 66,  unit: '250g', stock: 30  },
    { id: 'p22', name: 'Bru Coffee',        category: 'Beverages',  emoji: '☕', price: 75,  costPrice: 58,  unit: '100g', stock: 25  },
    { id: 'p23', name: 'Surf Excel',        category: 'Household',  emoji: '🧴', price: 90,  costPrice: 70,  unit: 'kg',   stock: 3   },
    { id: 'p24', name: 'Vim Dishwash Bar',  category: 'Household',  emoji: '🧹', price: 22,  costPrice: 15,  unit: 'bar',  stock: 50  },
  ];

  /* ── Seed Demo Customers ──────────────────────────────── */
  const SEED_CUSTOMERS = [
    { id: 'c1', name: 'Ramesh Kumar',  phone: '9876543210', email: 'ramesh@email.com', address: 'Block A, Sector 5', points: 120 },
    { id: 'c2', name: 'Sunita Devi',   phone: '9812345678', email: '',                 address: 'MG Road, Apt 3B',   points: 85  },
    { id: 'c3', name: 'Amit Sharma',   phone: '9765432109', email: 'amit@email.com',   address: '',                  points: 200 },
    { id: 'c4', name: 'Priya Singh',   phone: '9654321098', email: '',                 address: 'Near Bus Stand',    points: 50  },
  ];

  /* ── Seeding ──────────────────────────────────────────── */
  function seed() {
    if (!localStorage.getItem(KEYS.products)) {
      localStorage.setItem(KEYS.products, JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem(KEYS.settings)) {
      localStorage.setItem(KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem(KEYS.bills)) {
      localStorage.setItem(KEYS.bills, JSON.stringify(generateDemoBills()));
    }
    if (!localStorage.getItem(KEYS.customers)) {
      localStorage.setItem(KEYS.customers, JSON.stringify(SEED_CUSTOMERS));
    }
    if (!localStorage.getItem(KEYS.holdBills)) {
      localStorage.setItem(KEYS.holdBills, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.stockLog)) {
      localStorage.setItem(KEYS.stockLog, JSON.stringify([]));
    }
  }

  function generateDemoBills() {
    const today = new Date();
    const bills = [];
    const names = ['Ramesh Kumar', 'Sunita Devi', 'Amit Sharma', 'Priya Singh', 'Walk-in Customer'];
    const prods = SEED_PRODUCTS.slice(0, 12);
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const items = [];
      const picks = [...prods].sort(() => 0.5 - Math.random()).slice(0, 3 + (i % 3));
      picks.forEach(p => {
        const qty = 1 + Math.floor(Math.random() * 3);
        items.push({ id: p.id, name: p.name, price: p.price, costPrice: p.costPrice || 0, qty, unit: p.unit, total: +(p.price * qty).toFixed(2) });
      });
      const subtotal = items.reduce((s, it) => s + it.total, 0);
      const discount = i % 2 === 0 ? +(subtotal * 0.05).toFixed(2) : 0;
      const taxable = subtotal - discount;
      const tax = +(taxable * 0.05).toFixed(2);
      const total = +(taxable + tax).toFixed(2);
      bills.push({
        id: 'bill_demo_' + i,
        billNo: 'GB-' + String(1000 + i).padStart(4, '0'),
        date: date.toISOString(),
        customer: names[i],
        items,
        subtotal: +subtotal.toFixed(2),
        discount,
        discountType: 'flat',
        tax,
        taxRate: 5,
        total,
        paymentMode: i % 2 === 0 ? 'Cash' : 'UPI',
        settings: DEFAULT_SETTINGS,
      });
    }
    return bills;
  }

  /* ── Products ─────────────────────────────────────────── */
  function getProducts() {
    return JSON.parse(localStorage.getItem(KEYS.products) || '[]');
  }
  function saveProduct(product) {
    const list = getProducts();
    if (product.id) {
      const idx = list.findIndex(p => p.id === product.id);
      if (idx > -1) list[idx] = product; else list.push(product);
    } else {
      product.id = 'p_' + Date.now();
      list.push(product);
    }
    localStorage.setItem(KEYS.products, JSON.stringify(list));
    return product;
  }
  function deleteProduct(id) {
    const list = getProducts().filter(p => p.id !== id);
    localStorage.setItem(KEYS.products, JSON.stringify(list));
  }
  function clearProducts() {
    localStorage.removeItem(KEYS.products);
  }
  function getCategories() {
    return [...new Set(getProducts().map(p => p.category))].sort();
  }
  function getLowStockProducts(threshold) {
    const t = threshold ?? (getSettings().lowStockThreshold || 10);
    return getProducts().filter(p => p.stock <= t && p.stock > 0);
  }
  function getOutOfStockProducts() {
    return getProducts().filter(p => p.stock <= 0);
  }
  function adjustStock(productId, delta, reason) {
    const list = getProducts();
    const idx = list.findIndex(p => p.id === productId);
    if (idx === -1) return;
    const oldStock = list[idx].stock;
    list[idx].stock = Math.max(0, oldStock + delta);
    localStorage.setItem(KEYS.products, JSON.stringify(list));
    // Log movement
    const log = getStockLog();
    log.unshift({ id: 'sl_' + Date.now(), productId, productName: list[idx].name, delta, oldStock, newStock: list[idx].stock, reason: reason || 'Manual Adjustment', date: new Date().toISOString() });
    localStorage.setItem(KEYS.stockLog, JSON.stringify(log.slice(0, 500))); // keep last 500
    return list[idx];
  }

  /* ── Stock Log ────────────────────────────────────────── */
  function getStockLog() {
    return JSON.parse(localStorage.getItem(KEYS.stockLog) || '[]');
  }

  /* ── Bills ────────────────────────────────────────────── */
  function getBills() {
    return JSON.parse(localStorage.getItem(KEYS.bills) || '[]');
  }
  function saveBill(bill) {
    const list = getBills();
    if (!bill.id) {
      bill.id = 'bill_' + Date.now();
      const allBills = list.length + 1;
      bill.billNo = 'GB-' + String(1000 + allBills).padStart(4, '0');
      bill.date = new Date().toISOString();
      bill.settings = getSettings();
    }
    list.unshift(bill);
    localStorage.setItem(KEYS.bills, JSON.stringify(list));
    return bill;
  }
  function clearBills() {
    localStorage.removeItem(KEYS.bills);
  }
  function getTodayStats() {
    const bills = getBills();
    const today = new Date().toDateString();
    const todayBills = bills.filter(b => new Date(b.date).toDateString() === today);
    const total = todayBills.reduce((s, b) => s + b.total, 0);
    const profit = todayBills.reduce((s, b) => {
      const bp = b.items.reduce((sp, it) => sp + ((it.costPrice || 0) * it.qty), 0);
      return s + (b.total - bp);
    }, 0);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toDateString();
    const yBills = bills.filter(b => new Date(b.date).toDateString() === yStr);
    const yTotal = yBills.reduce((s, b) => s + b.total, 0);
    return { count: todayBills.length, total, profit, yesterdayTotal: yTotal, yesterdayCount: yBills.length, totalBills: bills.length };
  }
  function getTopProducts(limit = 5) {
    const bills = getBills();
    const map = {};
    bills.forEach(b => {
      b.items.forEach(it => {
        if (!map[it.name]) map[it.name] = { name: it.name, qty: 0, revenue: 0 };
        map[it.name].qty += it.qty;
        map[it.name].revenue += it.total;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
  }
  function getWeekRevenue() {
    const bills = getBills();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dateStr = d.toDateString();
      const dayBills = bills.filter(b => new Date(b.date).toDateString() === dateStr);
      const rev = dayBills.reduce((s, b) => s + b.total, 0);
      const profit = dayBills.reduce((s, b) => {
        const cost = b.items.reduce((sp, it) => sp + ((it.costPrice || 0) * it.qty), 0);
        return s + (b.total - cost);
      }, 0);
      days.push({ label, rev, profit });
    }
    return days;
  }
  function getGSTReport(from, to) {
    let bills = getBills();
    if (from) { const f = new Date(from); f.setHours(0,0,0,0); bills = bills.filter(b => new Date(b.date) >= f); }
    if (to)   { const t = new Date(to);   t.setHours(23,59,59,999); bills = bills.filter(b => new Date(b.date) <= t); }
    const taxableTotal = bills.reduce((s, b) => s + (b.subtotal - b.discount), 0);
    const taxTotal = bills.reduce((s, b) => s + b.tax, 0);
    const grandTotal = bills.reduce((s, b) => s + b.total, 0);
    const byRate = {};
    bills.forEach(b => {
      const rate = b.taxRate || 5;
      if (!byRate[rate]) byRate[rate] = { rate, taxable: 0, tax: 0, total: 0, count: 0 };
      byRate[rate].taxable += (b.subtotal - b.discount);
      byRate[rate].tax += b.tax;
      byRate[rate].total += b.total;
      byRate[rate].count++;
    });
    return { taxableTotal, taxTotal, grandTotal, bills, byRate, count: bills.length };
  }
  function getCategoryRevenue() {
    const bills = getBills();
    const map = {};
    bills.forEach(b => {
      b.items.forEach(it => {
        const prod = getProducts().find(p => p.id === it.id);
        const cat = prod ? prod.category : 'Other';
        if (!map[cat]) map[cat] = { category: cat, revenue: 0, qty: 0 };
        map[cat].revenue += it.total;
        map[cat].qty += it.qty;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }
  function getMonthlyRevenue() {
    const bills = getBills();
    const map = {};
    bills.forEach(b => {
      const d = new Date(b.date);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!map[key]) map[key] = { key, label, revenue: 0, count: 0 };
      map[key].revenue += b.total;
      map[key].count++;
    });
    return Object.values(map).sort((a, b) => a.key.localeCompare(b.key)).slice(-12);
  }

  /* ── Customers ────────────────────────────────────────── */
  function getCustomers() {
    return JSON.parse(localStorage.getItem(KEYS.customers) || '[]');
  }
  function saveCustomer(customer) {
    const list = getCustomers();
    if (customer.id) {
      const idx = list.findIndex(c => c.id === customer.id);
      if (idx > -1) list[idx] = customer; else list.push(customer);
    } else {
      customer.id = 'c_' + Date.now();
      customer.points = customer.points || 0;
      customer.createdAt = new Date().toISOString();
      list.push(customer);
    }
    localStorage.setItem(KEYS.customers, JSON.stringify(list));
    return customer;
  }
  function deleteCustomer(id) {
    const list = getCustomers().filter(c => c.id !== id);
    localStorage.setItem(KEYS.customers, JSON.stringify(list));
  }
  function getCustomerBills(customerId) {
    const customer = getCustomers().find(c => c.id === customerId);
    if (!customer) return [];
    return getBills().filter(b => b.customer === customer.name || b.customerId === customerId);
  }
  function addCustomerPoints(customerId, points) {
    const list = getCustomers();
    const idx = list.findIndex(c => c.id === customerId);
    if (idx > -1) { list[idx].points = (list[idx].points || 0) + points; }
    localStorage.setItem(KEYS.customers, JSON.stringify(list));
  }

  /* ── Hold Bills ───────────────────────────────────────── */
  function getHoldBills() {
    return JSON.parse(localStorage.getItem(KEYS.holdBills) || '[]');
  }
  function holdBill(bill) {
    const list = getHoldBills();
    const held = { ...bill, heldAt: new Date().toISOString(), holdId: 'hold_' + Date.now() };
    list.push(held);
    localStorage.setItem(KEYS.holdBills, JSON.stringify(list));
    return held.holdId;
  }
  function resumeHoldBill(holdId) {
    const list = getHoldBills();
    const bill = list.find(h => h.holdId === holdId);
    const remaining = list.filter(h => h.holdId !== holdId);
    localStorage.setItem(KEYS.holdBills, JSON.stringify(remaining));
    return bill;
  }
  function deleteHoldBill(holdId) {
    const list = getHoldBills().filter(h => h.holdId !== holdId);
    localStorage.setItem(KEYS.holdBills, JSON.stringify(list));
  }

  /* ── Settings ─────────────────────────────────────────── */
  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(KEYS.settings) || '{}') };
  }
  function saveSettings(s) {
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  }

  /* ── Backup / Restore ─────────────────────────────────── */
  function exportBackup() {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      products: getProducts(),
      bills: getBills(),
      customers: getCustomers(),
      settings: getSettings(),
      stockLog: getStockLog(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocerybill_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function importBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.version || !data.products) throw new Error('Invalid backup file');
      if (data.products)  localStorage.setItem(KEYS.products, JSON.stringify(data.products));
      if (data.bills)     localStorage.setItem(KEYS.bills, JSON.stringify(data.bills));
      if (data.customers) localStorage.setItem(KEYS.customers, JSON.stringify(data.customers));
      if (data.settings)  localStorage.setItem(KEYS.settings, JSON.stringify(data.settings));
      if (data.stockLog)  localStorage.setItem(KEYS.stockLog, JSON.stringify(data.stockLog));
      return { success: true, message: `Restored ${data.products.length} products, ${data.bills.length} bills, ${(data.customers||[]).length} customers.` };
    } catch (e) {
      return { success: false, message: 'Invalid backup file: ' + e.message };
    }
  }

  /* ── Helpers ─────────────────────────────────────────── */
  function formatCurrency(amount, settings) {
    const s = settings || getSettings();
    return `${s.currency}${Number(amount).toFixed(2)}`;
  }
  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  function formatDateShort(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function init(userId) {
    window.authUserId = userId;
    seed();
  }

  return {
    getProducts, saveProduct, deleteProduct, clearProducts, getCategories,
    getLowStockProducts, getOutOfStockProducts, adjustStock, getStockLog,
    getBills, saveBill, clearBills, getTodayStats, getTopProducts, getWeekRevenue,
    getGSTReport, getCategoryRevenue, getMonthlyRevenue,
    getCustomers, saveCustomer, deleteCustomer, getCustomerBills, addCustomerPoints,
    getHoldBills, holdBill, resumeHoldBill, deleteHoldBill,
    getSettings, saveSettings,
    exportBackup, importBackup,
    formatCurrency, formatDate, formatDateShort,
    init,
  };
})();
