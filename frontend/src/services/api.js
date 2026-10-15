const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE_URL = API_BASE ? `${API_BASE.replace(/\/+$/, '')}/api` : '/api';


async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errDetail = 'Request failed';
      try {
        const errorData = await res.json();
        if (typeof errorData.detail === 'string') {
          errDetail = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          errDetail = errorData.detail.map(d => `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg}`).join(', ');
        } else if (errorData.detail && typeof errorData.detail === 'object') {
          errDetail = JSON.stringify(errorData.detail);
        } else {
          errDetail = errorData.message || errDetail;
        }
      } catch (e) {
        errDetail = res.statusText || errDetail;
      }
      throw new Error(errDetail);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${url}]:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  getHealth: () => request('/health'),

  // 1. Contacts
  getContacts: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.type) sp.append('type', params.type);
    if (params.status) sp.append('status', params.status);
    if (params.search) sp.append('search', params.search);
    const qs = sp.toString();
    return request(`/contacts${qs ? `?${qs}` : ''}`);
  },
  getContact: (id) => request(`/contacts/${id}`),
  getContactLedger: (id) => request(`/contacts/${id}/ledger`),
  createContact: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id, data) => request(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: 'DELETE' }),

  // 2. Products & Stone Catalog
  getProducts: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.category_id) sp.append('category_id', params.category_id);
    if (params.status) sp.append('status', params.status);
    if (params.search) sp.append('search', params.search);
    const qs = sp.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  getCategories: (type = 'product') => request(`/products/categories?type=${type}`),
  createCategory: (data) => request('/products/categories', { method: 'POST', body: JSON.stringify(data) }),

  // 3. Purchases (Stock Inward)
  getPurchases: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.supplier_id) sp.append('supplier_id', params.supplier_id);
    if (params.status) sp.append('status', params.status);
    if (params.search) sp.append('search', params.search);
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    const qs = sp.toString();
    return request(`/purchases${qs ? `?${qs}` : ''}`);
  },
  getPurchase: (id) => request(`/purchases/${id}`),
  createPurchase: (data) => request('/purchases', { method: 'POST', body: JSON.stringify(data) }),
  addPurchasePayment: (id, data) => request(`/purchases/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  deletePurchase: (id) => request(`/purchases/${id}`, { method: 'DELETE' }),

  // 4. Sales (Stock Outward & Billing)
  getSales: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.customer_id) sp.append('customer_id', params.customer_id);
    if (params.status) sp.append('status', params.status);
    if (params.search) sp.append('search', params.search);
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    const qs = sp.toString();
    return request(`/sales${qs ? `?${qs}` : ''}`);
  },
  getSale: (id) => request(`/sales/${id}`),
  getNextBillNo: () => request('/sales/next-bill-no'),
  createSale: (data) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
  addSaleReceipt: (id, data) => request(`/sales/${id}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id) => request(`/sales/${id}`, { method: 'DELETE' }),

  // 5. Damage Entry
  getDamages: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.product_id) sp.append('product_id', params.product_id);
    if (params.reason) sp.append('reason', params.reason);
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    const qs = sp.toString();
    return request(`/damages${qs ? `?${qs}` : ''}`);
  },
  createDamage: (data) => request('/damages', { method: 'POST', body: JSON.stringify(data) }),
  deleteDamage: (id) => request(`/damages/${id}`, { method: 'DELETE' }),

  // 6. Stock
  getStockSummary: () => request('/stock/summary'),
  getLowStockReport: () => request('/stock/low-stock'),
  getStockLedger: (productId) => request(`/stock/ledger/${productId}`),
  addStockAdjustment: (data) => request('/stock/adjustment', { method: 'POST', body: JSON.stringify(data) }),

  // 7. Daybook
  getDaybookSummary: (date) => request(`/daybook/summary-bar${date ? `?date_filter=${date}` : ''}`),
  getDaybook: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.date_filter) sp.append('date_filter', params.date_filter);
    if (params.type) sp.append('type', params.type);
    if (params.method) sp.append('method', params.method);
    if (params.search) sp.append('search', params.search);
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    const qs = sp.toString();
    return request(`/daybook${qs ? `?${qs}` : ''}`);
  },
  createDaybookEntry: (data) => request('/daybook', { method: 'POST', body: JSON.stringify(data) }),
  clearCheque: (id) => request(`/daybook/${id}/clear-cheque`, { method: 'POST' }),
  deleteDaybookEntry: (id) => request(`/daybook/${id}`, { method: 'DELETE' }),

  // 8. Others, Bank, Settings & Reports
  getBankAccounts: () => request('/others/bank-accounts'),
  createBankAccount: (data) => request('/others/bank-accounts', { method: 'POST', body: JSON.stringify(data) }),
  transferFunds: (data) => request('/others/bank-transfer', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => request('/others/users'),
  createUser: (data) => request('/others/users', { method: 'POST', body: JSON.stringify(data) }),
  getSettings: () => request('/others/settings'),
  updateSettings: (data) => request('/others/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getProfitAndLoss: (params = {}) => {
    const sp = new URLSearchParams();
    if (params.start_date) sp.append('start_date', params.start_date);
    if (params.end_date) sp.append('end_date', params.end_date);
    const qs = sp.toString();
    return request(`/others/reports/profit-loss${qs ? `?${qs}` : ''}`);
  },
  getDuesReport: () => request('/others/reports/dues'),
  getGstSummary: () => request('/others/reports/gst'),

  // 9. Authentication
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: (userId) => request(`/auth/me${userId ? `?user_id=${userId}` : ''}`),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  getDemoUsers: () => request('/auth/demo-users'),

  // 10. Backup, Data Migration (XML, Excel, SQL), Cron & PDF Documentation
  getBackupSettings: () => request('/backup/settings'),
  updateBackupSettings: (data) => request('/backup/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getBackupLogs: () => request('/backup/logs'),
  runDailyBackup: () => request('/backup/run-daily-backup', { method: 'POST' }),
  importPreview: async (formData) => {
    const res = await fetch(`${BASE_URL}/backup/import-preview`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to preview import file');
    }
    return res.json();
  },
  importData: async (formData) => {
    const res = await fetch(`${BASE_URL}/backup/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Import failed');
    }
    return res.json();
  },
};
