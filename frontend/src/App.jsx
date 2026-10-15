import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './components/LoginView';
import DaybookView from './components/DaybookView';
import SalesView from './components/SalesView';
import PurchaseView from './components/PurchaseView';
import ProductsView from './components/ProductsView';
import StockView from './components/StockView';
import DamageEntryView from './components/DamageEntryView';
import CustomersView from './components/CustomersView';
import OthersView from './components/OthersView';
import AdminPanelView from './components/AdminPanelView';
import Loader from './components/Loader';
import { api } from './services/api';

export default function App() {
  // Session Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('billing_user') || sessionStorage.getItem('billing_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState('daybook');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [companyName, setCompanyName] = useState('BILLORA MARBLES & GRANITES');
  const [globalLoading, setGlobalLoading] = useState(false);

  // Master Data
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

  const refreshAll = async () => {
    setGlobalLoading(true);
    try {
      const [s, c, p, pur, sl, b, cat] = await Promise.all([
        api.getSettings().catch(() => null),
        api.getContacts().catch(() => []),
        api.getProducts().catch(() => []),
        api.getPurchases().catch(() => []),
        api.getSales().catch(() => []),
        api.getBankAccounts().catch(() => []),
        api.getCategories().catch(() => [])
      ]);

      if (s) {
        setSettings(s);
        setCompanyName(s.company_name || 'BILLORA MARBLES & GRANITES');
        setCurrencySymbol(s.currency_symbol || '₹');
      }
      setContacts(c || []);
      setProducts(p || []);
      setPurchases(pur || []);
      setSales(sl || []);
      setBankAccounts(b || []);
      setCategories(cat || []);
    } catch (err) {
      console.error('Error refreshing master data:', err);
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      refreshAll();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    const r = (user?.role || '').toLowerCase();
    if (r === 'sudo') setActiveTab('admin');
    else if (r === 'sales') setActiveTab('sales');
    else if (r === 'store') setActiveTab('stock');
    else if (r === 'accountant') setActiveTab('daybook');
    else setActiveTab('daybook');
    refreshAll();
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout API warning:', e);
    }
    localStorage.removeItem('billing_user');
    localStorage.removeItem('billing_token');
    sessionStorage.removeItem('billing_user');
    sessionStorage.removeItem('billing_token');
    setCurrentUser(null);
  };

  // If user is not logged in, show the production Billora login terminal
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const suppliers = contacts.filter(c => c.type === 'Supplier' || c.type === 'Both');
  const customers = contacts.filter(c => c.type === 'Customer' || c.type === 'Both');
  const role = (currentUser?.role || '').toLowerCase();
  const isSudo = role === 'sudo';
  const isAdmin = isSudo || role.includes('admin');

  return (
    <div className="app-layout">
      {/* Top Navbar with Base Menus + Admin Panel (Admin Only) & User Profile */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onQuickSale={() => setActiveTab('sales')}
        onQuickPurchase={() => setActiveTab('purchase')}
        companyName={companyName}
        settings={settings}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <main className="main-viewport">
        {/* 1. Daybook (Default daily cash/bank overview) */}
        {activeTab === 'daybook' && (
          <DaybookView 
            bankAccounts={bankAccounts}
            categories={categories}
            currency={currencySymbol}
            onDataChanged={refreshAll}
          />
        )}

        {/* 2. Sales */}
        {activeTab === 'sales' && (
          <SalesView 
            sales={sales}
            customers={customers}
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 3. Purchase */}
        {activeTab === 'purchase' && (
          <PurchaseView 
            purchases={purchases}
            suppliers={suppliers}
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 4. Products */}
        {activeTab === 'products' && (
          <ProductsView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 5. Stock */}
        {activeTab === 'stock' && (
          <StockView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 6. Damage Entry */}
        {activeTab === 'damage' && (
          <DamageEntryView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 7. Contacts */}
        {activeTab === 'contacts' && (
          <CustomersView 
            customers={contacts}
            currency={currencySymbol}
            onRefresh={refreshAll}
            onSelectCustomerInvoices={(id) => {
              setActiveTab('sales');
            }}
          />
        )}

        {/* Admin Panel (Admin Only: Dynamic Client Fields, Stock Manual & Backup) */}
        {activeTab === 'admin' && (isAdmin || isSudo) && (
          <AdminPanelView 
            currentUser={currentUser}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 8. Others */}
        {activeTab === 'others' && (
          <OthersView 
            settings={settings}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}
      </main>
    </div>
  );
}
