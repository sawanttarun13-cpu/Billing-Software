/* ============================================================
   GroceryBill Pro — Cloud Sync Engine v1
   ============================================================
   Strategy: Offline-First with Cloud Backup
   - localStorage is always the fast, local cache (instant reads)
   - All writes go to localStorage first (instant UX), then async to Supabase
   - On login, a full cloud pull overwrites local cache (source of truth = cloud)
   - Sync status is shown in the UI
   ============================================================ */

const Sync = (() => {
  let _supabase = null;
  let _userId = null;
  let _syncStatus = 'idle'; // 'idle' | 'syncing' | 'error' | 'offline'
  let _pendingQueue = []; // operations that failed and need retry
  let _statusCallback = null;

  /* ── Init ────────────────────────────────────────────────── */
  function init(supabaseClient, userId) {
    _supabase = supabaseClient;
    _userId = userId;
  }

  function onStatusChange(cb) {
    _statusCallback = cb;
  }

  function setStatus(status) {
    _syncStatus = status;
    if (_statusCallback) _statusCallback(status);
  }

  function isReady() {
    return !!(_supabase && _userId);
  }

  /* ── Field Mapping: camelCase ↔ snake_case ───────────────── */

  function productToRow(p) {
    return {
      id:         p.id && !p.id.startsWith('p_') && !p.id.startsWith('p') ? p.id : undefined,
      user_id:    _userId,
      name:       p.name,
      category:   p.category,
      emoji:      p.emoji || null,
      price:      p.price,
      cost_price: p.costPrice || 0,
      unit:       p.unit,
      stock:      p.stock,
      image_data: p.image || null,
    };
  }

  function rowToProduct(row) {
    return {
      id:        row.id,
      name:      row.name,
      category:  row.category,
      emoji:     row.emoji || '📦',
      price:     Number(row.price),
      costPrice: Number(row.cost_price),
      unit:      row.unit,
      stock:     Number(row.stock),
      image:     row.image_data || null,
      createdAt: row.created_at,
    };
  }

  function billToRow(b) {
    return {
      id:               b.id && b.id.length === 36 ? b.id : undefined, // only uuid
      user_id:          _userId,
      bill_no:          b.billNo,
      date:             b.date,
      customer_name:    b.customer || 'Walk-in Customer',
      customer_id:      b.customerId || null,
      items:            b.items,
      subtotal:         b.subtotal,
      discount:         b.discount || 0,
      discount_type:    b.discountType || 'flat',
      tax:              b.tax,
      tax_rate:         b.taxRate || 5,
      total:            b.total,
      payment_mode:     b.paymentMode || 'Cash',
      loyalty_discount: b.loyaltyDiscount || 0,
      redeemed_points:  b.redeemedPoints || 0,
      note:             b.note || null,
      settings:         b.settings || null,
    };
  }

  function rowToBill(row) {
    return {
      id:              row.id,
      billNo:          row.bill_no,
      date:            row.date,
      customer:        row.customer_name,
      customerId:      row.customer_id || null,
      items:           row.items,
      subtotal:        Number(row.subtotal),
      discount:        Number(row.discount),
      discountType:    row.discount_type,
      tax:             Number(row.tax),
      taxRate:         Number(row.tax_rate),
      total:           Number(row.total),
      paymentMode:     row.payment_mode,
      loyaltyDiscount: Number(row.loyalty_discount || 0),
      redeemedPoints:  Number(row.redeemed_points || 0),
      note:            row.note || null,
      settings:        row.settings || null,
      createdAt:       row.created_at,
    };
  }

  function customerToRow(c) {
    return {
      id:      c.id && c.id.length === 36 ? c.id : undefined,
      user_id: _userId,
      name:    c.name,
      phone:   c.phone || null,
      email:   c.email || null,
      address: c.address || null,
      points:  c.points || 0,
    };
  }

  function rowToCustomer(row) {
    return {
      id:        row.id,
      name:      row.name,
      phone:     row.phone || '',
      email:     row.email || '',
      address:   row.address || '',
      points:    Number(row.points || 0),
      createdAt: row.created_at,
    };
  }

  function settingsToRow(s) {
    return {
      user_id:            _userId,
      shop_name:          s.shopName,
      tagline:            s.tagline,
      address:            s.address,
      phone:              s.phone,
      gstin:              s.gstin,
      tax_rate:           s.taxRate,
      currency:           s.currency,
      thank_you:          s.thankYou,
      accent_color:       s.accentColor,
      low_stock_threshold:s.lowStockThreshold,
      invoice_prefix:     s.invoicePrefix || 'GB-',
      bill_counter:       s.billCounter || 1000,
    };
  }

  function rowToSettings(row) {
    return {
      shopName:          row.shop_name,
      tagline:           row.tagline,
      address:           row.address,
      phone:             row.phone,
      gstin:             row.gstin,
      taxRate:           Number(row.tax_rate),
      currency:          row.currency,
      thankYou:          row.thank_you,
      accentColor:       row.accent_color,
      lowStockThreshold: Number(row.low_stock_threshold),
      invoicePrefix:     row.invoice_prefix || 'GB-',
      billCounter:       Number(row.bill_counter || 1000),
    };
  }

  function stockLogToRow(log) {
    return {
      user_id:      _userId,
      product_id:   log.productId && log.productId.length === 36 ? log.productId : null,
      product_name: log.productName,
      delta:        log.delta,
      old_stock:    log.oldStock,
      new_stock:    log.newStock,
      reason:       log.reason || null,
      date:         log.date,
    };
  }

  /* ── Full Cloud Pull (on login) ──────────────────────────── */
  /**
   * Downloads all user data from Supabase and populates localStorage.
   * This is the "source of truth" sync — cloud wins.
   */
  async function pullAll(localDB) {
    if (!isReady()) return { success: false, error: 'Sync not initialized' };

    setStatus('syncing');
    try {
      // Parallel fetch all tables
      const [
        { data: products, error: pe },
        { data: bills,    error: be },
        { data: customers,error: ce },
        { data: settings, error: se },
      ] = await Promise.all([
        _supabase.from('products').select('*').eq('user_id', _userId).order('name'),
        _supabase.from('bills').select('*').eq('user_id', _userId).order('date', { ascending: false }),
        _supabase.from('customers').select('*').eq('user_id', _userId).order('name'),
        _supabase.from('settings').select('*').eq('user_id', _userId).single(),
      ]);

      const errors = [pe, be, ce, se].filter(e => e && e.code !== 'PGRST116'); // PGRST116 = no rows found
      if (errors.length > 0) {
        console.warn('[Sync] Pull errors:', errors);
        // Non-fatal — use local data if cloud fails
        setStatus('error');
        return { success: false, errors };
      }

      // Push cloud data to localStorage (cloud is source of truth)
      if (products && products.length > 0) {
        localDB._setProducts(products.map(rowToProduct));
      }
      if (bills && bills.length > 0) {
        localDB._setBills(bills.map(rowToBill));
      }
      if (customers && customers.length > 0) {
        localDB._setCustomers(customers.map(rowToCustomer));
      }
      if (settings && !se) {
        localDB._setSettings(rowToSettings(settings));
      }

      setStatus('idle');
      console.log(`[Sync] Pull complete: ${products?.length || 0} products, ${bills?.length || 0} bills, ${customers?.length || 0} customers`);
      return { success: true, counts: { products: products?.length || 0, bills: bills?.length || 0, customers: customers?.length || 0 } };
    } catch (err) {
      console.error('[Sync] pullAll error:', err);
      setStatus('error');
      return { success: false, error: err.message };
    }
  }

  /* ── Product Sync ────────────────────────────────────────── */
  async function upsertProduct(product) {
    if (!isReady()) return;
    try {
      const row = productToRow(product);
      // Use upsert with the cloud UUID (if it is a uuid) or insert
      if (product.id && product.id.length === 36) {
        // Existing cloud product — update
        const { error } = await _supabase
          .from('products')
          .upsert({ ...row, id: product.id }, { onConflict: 'id' });
        if (error) throw error;
      } else {
        // New product (local id like p_123) — insert and update local id with cloud uuid
        const { data, error } = await _supabase
          .from('products')
          .insert({ ...row })
          .select('id')
          .single();
        if (error) throw error;
        // Update the local record with the cloud UUID
        return data?.id; // caller should update local id
      }
    } catch (err) {
      console.error('[Sync] upsertProduct error:', err);
      setStatus('error');
    }
  }

  async function deleteProduct(id) {
    if (!isReady() || !id || id.length !== 36) return;
    try {
      const { error } = await _supabase.from('products').delete().eq('id', id).eq('user_id', _userId);
      if (error) throw error;
    } catch (err) {
      console.error('[Sync] deleteProduct error:', err);
    }
  }

  /* ── Bill Sync ───────────────────────────────────────────── */
  async function insertBill(bill) {
    if (!isReady()) return null;
    try {
      const row = billToRow(bill);
      const { data, error } = await _supabase
        .from('bills')
        .insert(row)
        .select('id')
        .single();
      if (error) throw error;
      return data?.id; // cloud UUID to replace local id
    } catch (err) {
      console.error('[Sync] insertBill error:', err);
      setStatus('error');
      return null;
    }
  }

  /* ── Customer Sync ───────────────────────────────────────── */
  async function upsertCustomer(customer) {
    if (!isReady()) return null;
    try {
      const row = customerToRow(customer);
      if (customer.id && customer.id.length === 36) {
        const { error } = await _supabase
          .from('customers')
          .upsert({ ...row, id: customer.id }, { onConflict: 'id' });
        if (error) throw error;
        return customer.id;
      } else {
        const { data, error } = await _supabase
          .from('customers')
          .insert(row)
          .select('id')
          .single();
        if (error) throw error;
        return data?.id;
      }
    } catch (err) {
      console.error('[Sync] upsertCustomer error:', err);
      setStatus('error');
      return null;
    }
  }

  async function deleteCustomer(id) {
    if (!isReady() || !id || id.length !== 36) return;
    try {
      const { error } = await _supabase.from('customers').delete().eq('id', id).eq('user_id', _userId);
      if (error) throw error;
    } catch (err) {
      console.error('[Sync] deleteCustomer error:', err);
    }
  }

  /* ── Settings Sync ───────────────────────────────────────── */
  async function upsertSettings(settings) {
    if (!isReady()) return;
    try {
      const row = settingsToRow(settings);
      const { error } = await _supabase
        .from('settings')
        .upsert(row, { onConflict: 'user_id' });
      if (error) throw error;
    } catch (err) {
      console.error('[Sync] upsertSettings error:', err);
      setStatus('error');
    }
  }

  /* ── Stock Log Sync ──────────────────────────────────────── */
  async function insertStockLog(logEntry) {
    if (!isReady()) return;
    try {
      const row = stockLogToRow(logEntry);
      const { error } = await _supabase.from('stock_log').insert(row);
      if (error) throw error;
    } catch (err) {
      console.error('[Sync] insertStockLog error:', err);
    }
  }

  /* ── Full Cloud Push (backup/migrate) ───────────────────── */
  async function pushAll(localDB) {
    if (!isReady()) return { success: false, error: 'Not ready' };
    setStatus('syncing');
    try {
      const products  = localDB.getProducts();
      const bills     = localDB.getBills();
      const customers = localDB.getCustomers();
      const settings  = localDB.getSettings();

      // Upsert settings first (needed for bill counter)
      await upsertSettings(settings);

      // Upsert products
      for (const p of products) {
        await upsertProduct(p);
      }

      // Upsert customers
      for (const c of customers) {
        await upsertCustomer(c);
      }

      // Insert bills (only new ones without UUID ids)
      for (const b of bills) {
        if (!b.id || b.id.length !== 36) {
          await insertBill(b);
        }
      }

      setStatus('idle');
      return { success: true };
    } catch (err) {
      console.error('[Sync] pushAll error:', err);
      setStatus('error');
      return { success: false, error: err.message };
    }
  }

  /* ── Connection Check ────────────────────────────────────── */
  async function checkConnection() {
    if (!_supabase) return false;
    try {
      const { error } = await _supabase.from('settings').select('user_id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  return {
    init,
    onStatusChange,
    isReady,
    pullAll,
    pushAll,
    upsertProduct,
    deleteProduct,
    insertBill,
    upsertCustomer,
    deleteCustomer,
    upsertSettings,
    insertStockLog,
    checkConnection,
  };
})();
