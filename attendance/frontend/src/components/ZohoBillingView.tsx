'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Search,
  Crown,
  Sparkles,
  Scissors,
  ShoppingCart,
  Trash2,
  CheckCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function ZohoBillingView() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'customers'
    | 'products'
    | 'invoices'
    | 'payments'
    | 'reports'
    | 'settings'
  >('dashboard');

  const [searchTerm, setSearchTerm] = useState('');

  // 1. Customers State
  const [customers, setCustomers] = useState([
    { id: 'CUST-001', name: 'Ananya Sharma', phone: '+91 98765 43210', email: 'ananya@example.com', visits: 14, balance: 0, tag: 'VIP Member' },
    { id: 'CUST-002', name: 'Vikramaditya Roy', phone: '+91 98123 45678', email: 'vikram@example.com', visits: 8, balance: 0, tag: 'Regular' },
    { id: 'CUST-003', name: 'Priya Sundaram', phone: '+91 97654 32109', email: 'priya@example.com', visits: 5, balance: 6500, tag: 'Premium' },
  ]);

  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custTag, setCustTag] = useState('Regular');

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust = {
      id: `CUST-00${customers.length + 1}`,
      name: custName,
      phone: custPhone || '—',
      email: custEmail || '—',
      visits: 1,
      balance: 0,
      tag: custTag
    };
    setCustomers([newCust, ...customers]);
    setAddCustomerModal(false);
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    alert(`✅ Customer ${newCust.name} added successfully!`);
  };

  // 2. Products & Services State
  const [products, setProducts] = useState([
    { id: 'PRD-01', name: 'Signature Royal Haircut', category: 'Styling', price: 800, tax: 18 },
    { id: 'PRD-02', name: 'Keratin Smooth Treatment', category: 'Hair Spa', price: 5500, tax: 18 },
    { id: 'PRD-03', name: 'Argan Oil Serum 100ml', category: 'Product', price: 1450, tax: 18 },
    { id: 'PRD-04', name: 'Beard Trimming & Shaping', category: 'Grooming', price: 400, tax: 18 },
    { id: 'PRD-05', name: 'Hydrating Facial Spa', category: 'Skincare', price: 2200, tax: 18 },
  ]);

  const [addProductModal, setAddProductModal] = useState(false);
  const [prdName, setPrdName] = useState('');
  const [prdCategory, setPrdCategory] = useState('Styling');
  const [prdPrice, setPrdPrice] = useState('');
  const [prdTax, setPrdTax] = useState('18');

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrd = {
      id: `PRD-0${products.length + 1}`,
      name: prdName,
      category: prdCategory,
      price: parseFloat(prdPrice) || 0,
      tax: parseFloat(prdTax) || 18
    };
    setProducts([...products, newPrd]);
    setAddProductModal(false);
    setPrdName('');
    setPrdPrice('');
    alert(`✅ ${newPrd.name} added to catalog!`);
  };

  // 3. Billing & Cart State (Under Invoices & Billing)
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('Ananya Sharma');
  const [billingPayMode, setBillingPayMode] = useState('UPI');

  const addToCart = (prd: typeof products[0]) => {
    const existing = cart.find(item => item.id === prd.id);
    if (existing) {
      setCart(cart.map(item => item.id === prd.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { id: prd.id, name: prd.name, price: prd.price, qty: 1 }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartTax = Math.round(cartSubtotal * 0.18);
  const cartTotal = cartSubtotal + cartTax;

  // 4. Invoices & Billing History (Reflected in Payments & Receipts)
  const [invoices, setInvoices] = useState([
    { id: 'INV-00104', customer: 'Ananya Sharma', items: 'Hair Coloring & Spa', date: '2026-10-09', subtotal: 3813, tax: 687, total: 4500, status: 'PAID', mode: 'UPI' },
    { id: 'INV-00103', customer: 'Vikramaditya Roy', items: 'Royal Grooming Package', date: '2026-10-09', subtotal: 2372, tax: 428, total: 2800, status: 'PAID', mode: 'CARD' },
    { id: 'INV-00102', customer: 'Priya Sundaram', items: 'Keratin Hair Treatment', date: '2026-10-08', subtotal: 5508, tax: 992, total: 6500, status: 'PAID', mode: 'CASH' },
    { id: 'INV-00101', customer: 'Rajesh Kumar', items: 'Haircut & Beard Styling', date: '2026-10-08', subtotal: 1016, tax: 184, total: 1200, status: 'PAID', mode: 'UPI' },
  ]);

  const handleCheckoutCart = () => {
    if (cart.length === 0) {
      alert('Please add products or services to the bill cart first!');
      return;
    }
    const itemSummary = cart.map(c => `${c.name} (x${c.qty})`).join(', ');
    const newInv = {
      id: `INV-00${invoices.length + 105}`,
      customer: selectedCustomer,
      items: itemSummary,
      date: new Date().toISOString().split('T')[0],
      subtotal: cartSubtotal,
      tax: cartTax,
      total: cartTotal,
      status: 'PAID',
      mode: billingPayMode
    };

    setInvoices([newInv, ...invoices]);
    setCart([]);
    alert(`🎉 Invoice ${newInv.id} created successfully!\nTotal Paid: ₹ ${cartTotal.toLocaleString('en-IN')} via ${billingPayMode}`);
    setActiveTab('payments'); // Auto jump to history
  };

  // 5. Genuine Analytics Metrics
  const totalRevenue = invoices.reduce((acc, curr) => acc + curr.total, 0);
  const totalTaxesCollected = invoices.reduce((acc, curr) => acc + curr.tax, 0);
  const averageBillValue = Math.round(totalRevenue / (invoices.length || 1));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0b10', color: '#f8fafc' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: '#12141d',
        borderRight: '1px solid #2e344a',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10
      }}>
        {/* Header Branding */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #2e344a', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #d4af37, #f3cf55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            fontWeight: 'bold'
          }}>
            <Crown size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>NEW DUKE & DUCHESS</h1>
            <span style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 600 }}>BILLING PORTAL</span>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'products', label: 'Products & Services', icon: ShoppingBag },
            { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
            { id: 'payments', label: 'Payments & Receipts', icon: CreditCard },
            { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
            { id: 'settings', label: 'Settings & Users', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  color: isActive ? '#d4af37' : '#94a3b8',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid #d4af37' : '3px solid transparent'
                }}
              >
                <Icon size={18} color={isActive ? '#d4af37' : '#94a3b8'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin Footer Badge */}
        <div style={{ padding: '1rem', borderTop: '1px solid #2e344a', backgroundColor: '#0a0b10' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#2e344a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scissors size={18} color="#d4af37" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Salon Administrator</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981' }}>● Billing Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem', minHeight: '100vh' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
              Financial operations, invoicing, and billing for New Duke & Duchess.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  backgroundColor: '#12141d',
                  border: '1px solid #2e344a',
                  borderRadius: '8px',
                  padding: '0.5rem 1rem 0.5rem 2.25rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  width: '220px'
                }}
              />
            </div>

            <button
              onClick={() => setActiveTab('invoices')}
              style={{
                backgroundColor: '#d4af37',
                color: '#000',
                fontWeight: 600,
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <ShoppingCart size={18} />
              <span>Create Bill ({cart.length})</span>
            </button>
          </div>
        </header>

        {/* 1. DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Sales Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>₹ {totalRevenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>Live billing records</div>
              </div>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Invoices Generated</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>{invoices.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.25rem' }}>Total completed bills</div>
              </div>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Registered Customers</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d4af37' }}>{customers.length}</div>
                <div style={{ fontSize: '0.75rem', color: '#d4af37', marginTop: '0.25rem' }}>Active salon clients</div>
              </div>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Avg. Invoice Value</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>₹ {averageBillValue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>Per customer transaction</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Recent Billing Activity</h3>
                <button onClick={() => setActiveTab('payments')} style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.875rem' }}>
                  View All Payment History →
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Customer</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Items / Service</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 4).map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #2e344a' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{inv.id}</td>
                      <td style={{ padding: '1rem', color: '#fff' }}>{inv.customer}</td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.items}</td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.date}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>₹ {inv.total.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '1rem' }}><span style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>PAID ({inv.mode})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. CUSTOMERS TAB (WITH ADD CUSTOMER BUTTON) */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Customer Directory ({customers.length})</h3>
              <button
                onClick={() => setAddCustomerModal(true)}
                style={{ backgroundColor: '#d4af37', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <Plus size={16} />
                <span>Add New Customer</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Client ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Visits</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Membership</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #2e344a' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{c.id}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{c.phone}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{c.email}</td>
                    <td style={{ padding: '1rem', color: '#fff' }}>{c.visits} Visits</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {c.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. PRODUCTS & SERVICES TAB (WITH ADD PRODUCT BUTTON & ADD TO CART) */}
        {activeTab === 'products' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Products & Services Catalog ({products.length})</h3>
              <button
                onClick={() => setAddProductModal(true)}
                style={{ backgroundColor: '#d4af37', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <Plus size={16} />
                <span>Add Service / Product</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Item ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Price (Excl. Tax)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>GST Rate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #2e344a' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{p.id}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.category}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>₹ {p.price}</td>
                    <td style={{ padding: '1rem', color: '#10b981' }}>{p.tax}%</td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => {
                          addToCart(p);
                          alert(`Added "${p.name}" to Billing Cart!`);
                        }}
                        style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#d4af37', border: '1px solid #d4af37', borderRadius: '6px', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        + Add to Bill Cart
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. INVOICES & BILLING TAB (DYNAMIC CART & CATALOG PICKER) */}
        {activeTab === 'invoices' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
            {/* Catalog Selector */}
            <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Select Items to Add to Bill</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                {products.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => addToCart(p)}
                    style={{
                      backgroundColor: '#0a0b10',
                      border: '1px solid #2e344a',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{p.category}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: '#d4af37' }}>₹ {p.price}</span>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>+ Add</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Cart & Checkout */}
            <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="#d4af37" />
                <span>Billing Cart ({cart.length})</span>
              </h3>

              {/* Customer Selector */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Select Customer</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                >
                  {customers.map(c => <option key={c.id} value={c.name}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              {/* Cart Items List */}
              <div style={{ flex: 1, minHeight: '180px', overflowY: 'auto', marginBottom: '1rem' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 0', fontSize: '0.85rem' }}>
                    Cart is empty.<br />Click products on the left to add.
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #2e344a' }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>₹ {item.price} x {item.qty}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600, color: '#d4af37' }}>₹ {item.price * item.qty}</span>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals & Payment Method */}
              <div style={{ borderTop: '1px solid #2e344a', paddingTop: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  <span>Subtotal:</span>
                  <span>₹ {cartSubtotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                  <span>GST Tax (18%):</span>
                  <span>₹ {cartTax}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '0.5rem' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: '#d4af37' }}>₹ {cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Payment Method</label>
                <select
                  value={billingPayMode}
                  onChange={(e) => setBillingPayMode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <button
                onClick={handleCheckoutCart}
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#d4af37', color: '#000', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Complete & Issue Bill
              </button>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS & RECEIPTS TAB (COMPLETE BILLING HISTORY) */}
        {activeTab === 'payments' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1.25rem' }}>Billing & Payment History ({invoices.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Invoice ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Items Billed</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Subtotal</th>
                  <th style={{ padding: '0.75rem 1rem' }}>GST (18%)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Paid</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Mode</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #2e344a' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{inv.id}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 500 }}>{inv.customer}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.items}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.date}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>₹ {inv.subtotal}</td>
                    <td style={{ padding: '1rem', color: '#10b981' }}>₹ {inv.tax}</td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#fff' }}>₹ {inv.total.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#1e2230', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{inv.mode}</span></td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => alert(`Receipt #${inv.id}\nCustomer: ${inv.customer}\nTotal Billed: ₹${inv.total}\nPayment Status: SUCCESS`)}
                        style={{ backgroundColor: 'transparent', border: '1px solid #d4af37', color: '#d4af37', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}
                      >
                        Print Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. REPORTS & ANALYTICS TAB (GENUINE SALON FINANCIAL METRICS) */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Total Business Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>₹ {totalRevenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Calculated from {invoices.length} completed salon bills</div>
              </div>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Total GST Tax Collected</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>₹ {totalTaxesCollected.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>18% GST output tax liability</div>
              </div>
              <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Average Spend Per Client</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#d4af37' }}>₹ {averageBillValue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>Based on client purchase history</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Payment Mode Breakdown</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {['UPI', 'CARD', 'CASH'].map(mode => {
                  const modeInvoices = invoices.filter(i => i.mode === mode);
                  const modeTotal = modeInvoices.reduce((acc, curr) => acc + curr.total, 0);
                  return (
                    <div key={mode} style={{ backgroundColor: '#0a0b10', padding: '1rem', borderRadius: '8px', border: '1px solid #2e344a' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#d4af37' }}>{mode} Transactions</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginTop: '0.25rem' }}>₹ {modeTotal.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>{modeInvoices.length} bills processed</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 7. SETTINGS & USERS TAB */}
        {activeTab === 'settings' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '2rem', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Salon Billing Settings</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Salon Name</label>
              <input type="text" value="New Duke & Duchess Salon & Spa" readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Default GST Tax Rate (%)</label>
              <input type="text" value="18%" readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Receipt Currency</label>
              <input type="text" value="INR (₹)" readOnly style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
            </div>
          </div>
        )}
      </main>

      {/* ADD CUSTOMER MODAL */}
      {addCustomerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '2rem', width: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Add New Customer</h3>
            <form onSubmit={handleAddCustomer}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Full Name</label>
                <input type="text" required value={custName} onChange={(e) => setCustName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Mobile Number</label>
                <input type="text" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Email</label>
                <input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Membership Level</label>
                <select value={custTag} onChange={(e) => setCustTag(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}>
                  <option value="Regular">Regular</option>
                  <option value="VIP Member">VIP Member</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddCustomerModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: '#d4af37', color: '#000', fontWeight: 600, cursor: 'pointer' }}>Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {addProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '2rem', width: '400px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Add Service / Product</h3>
            <form onSubmit={handleAddProduct}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Name</label>
                <input type="text" required value={prdName} onChange={(e) => setPrdName(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Category</label>
                <select value={prdCategory} onChange={(e) => setPrdCategory(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}>
                  <option value="Styling">Styling</option>
                  <option value="Hair Spa">Hair Spa</option>
                  <option value="Grooming">Grooming</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Product">Physical Product</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Price (₹)</label>
                <input type="number" required value={prdPrice} onChange={(e) => setPrdPrice(e.target.value)} style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddProductModal(false)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: '#d4af37', color: '#000', fontWeight: 600, cursor: 'pointer' }}>Add to Catalog</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
