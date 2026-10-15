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
import BackupMigrationView from './components/BackupMigrationView';
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
  const [companyName, setCompanyName] = useState('JR MARBLES & GRANITES');

  // Master Data
  const [contacts, setContacts] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

  const refreshAll = () => {
    api.getSettings().then(s => {
      if (s) {
        setSettings(s);
        setCompanyName(s.company_name);
        setCurrencySymbol(s.currency_symbol || '₹');
      }
    }).catch(console.error);

    api.getContacts().then(setContacts).catch(console.error);
    api.getProducts().then(setProducts).catch(console.error);
    api.getPurchases().then(setPurchases).catch(console.error);
    api.getSales().then(setSales).catch(console.error);
    api.getBankAccounts().then(setBankAccounts).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
  };

  useEffect(() => {
    if (currentUser) {
      refreshAll();
    }
  }, [currentUser]);

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
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

  // If user is not logged in, show the dedicated stone shop login terminal
  if (!currentUser) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const suppliers = contacts.filter(c => c.type === 'Supplier' || c.type === 'Both');
  const customers = contacts.filter(c => c.type === 'Customer' || c.type === 'Both');

  return (
    <div className="app-layout">
      {/* Top Navbar with 8 Menus + User Profile & Logout */}
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

        {/* 2. Sales (Section 6) */}
        {activeTab === 'sales' && (
          <SalesView 
            sales={sales}
            customers={customers}
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 3. Purchase (Section 5) */}
        {activeTab === 'purchase' && (
          <PurchaseView 
            purchases={purchases}
            suppliers={suppliers}
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 4. Products (Section 4) */}
        {activeTab === 'products' && (
          <ProductsView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 5. Stock (Section 8) */}
        {activeTab === 'stock' && (
          <StockView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 6. Damage Entry (Section 7) */}
        {activeTab === 'damage' && (
          <DamageEntryView 
            products={products}
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 7. Contacts (Section 3) */}
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

                {/* Backup & Data Migration Module */}
        {activeTab === 'backup' && (
          <BackupMigrationView 
            currency={currencySymbol}
            onRefresh={refreshAll}
          />
        )}

        {/* 8. Others (Section 10) */}
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
