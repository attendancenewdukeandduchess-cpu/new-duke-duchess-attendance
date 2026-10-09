'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  FileText,
  Receipt,
  CreditCard,
  Repeat,
  DollarSign,
  BarChart3,
  Settings,
  Plus,
  Search,
  Crown,
  Sparkles,
  Scissors
} from 'lucide-react';

export default function ZohoBillingView() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'customers'
    | 'products'
    | 'quotations'
    | 'invoices'
    | 'payments'
    | 'recurring'
    | 'expenses'
    | 'reports'
    | 'settings'
  >('dashboard');

  const [searchTerm, setSearchTerm] = useState('');

  const [stats] = useState({
    revenue: '₹ 1,48,500',
    pending: '₹ 12,400',
    totalInvoices: 124,
    customersCount: 86
  });

  const [invoices, setInvoices] = useState([
    { id: 'INV-00104', customer: 'Ananya Sharma', service: 'Hair Coloring & Spa', date: '2026-10-09', amount: 4500, status: 'PAID', mode: 'UPI' },
    { id: 'INV-00103', customer: 'Vikramaditya Roy', service: 'Royal Grooming Package', date: '2026-10-09', amount: 2800, status: 'PAID', mode: 'CARD' },
    { id: 'INV-00102', customer: 'Priya Sundaram', service: 'Keratin Hair Treatment', date: '2026-10-08', amount: 6500, status: 'UNPAID', mode: 'PENDING' },
    { id: 'INV-00101', customer: 'Rajesh Kumar', service: 'Haircut & Beard Styling', date: '2026-10-08', amount: 1200, status: 'PAID', mode: 'CASH' },
  ]);

  const [customers] = useState([
    { id: 'CUST-001', name: 'Ananya Sharma', phone: '+91 98765 43210', email: 'ananya@example.com', visits: 14, balance: 0, tag: 'VIP Member' },
    { id: 'CUST-002', name: 'Vikramaditya Roy', phone: '+91 98123 45678', email: 'vikram@example.com', visits: 8, balance: 0, tag: 'Regular' },
    { id: 'CUST-003', name: 'Priya Sundaram', phone: '+91 97654 32109', email: 'priya@example.com', visits: 5, balance: 6500, tag: 'Premium' },
  ]);

  const [products] = useState([
    { id: 'PRD-01', name: 'Signature Royal Haircut', category: 'Styling', price: 800, tax: '18%' },
    { id: 'PRD-02', name: 'Keratin Smooth Treatment', category: 'Hair Spa', price: 5500, tax: '18%' },
    { id: 'PRD-03', name: 'Argan Oil Serum 100ml', category: 'Product', price: 1450, tax: '18%' },
    { id: 'PRD-04', name: 'Beard Trimming & Shaping', category: 'Grooming', price: 400, tax: '18%' },
  ]);

  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [invCustomer, setInvCustomer] = useState('');
  const [invService, setInvService] = useState('Signature Royal Haircut');
  const [invAmount, setInvAmount] = useState('800');
  const [invPayMode, setInvPayMode] = useState('UPI');

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv = {
      id: `INV-00${invoices.length + 105}`,
      customer: invCustomer || 'Walk-in Client',
      service: invService,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(invAmount) || 0,
      status: 'PAID',
      mode: invPayMode
    };
    setInvoices([newInv, ...invoices]);
    setNewInvoiceModal(false);
    setInvCustomer('');
    alert(`✅ Invoice ${newInv.id} successfully created and marked as PAID!`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-dark, #0a0b10)', color: '#f8fafc' }}>
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
            <span style={{ fontSize: '0.75rem', color: '#d4af37', fontWeight: 600 }}>ZOHO BILLING PORTAL</span>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'products', label: 'Products & Services', icon: ShoppingBag },
            { id: 'quotations', label: 'Quotations', icon: FileText },
            { id: 'invoices', label: 'Invoices & Billing', icon: Receipt },
            { id: 'payments', label: 'Payments & Receipts', icon: CreditCard },
            { id: 'recurring', label: 'Recurring Billing', icon: Repeat },
            { id: 'expenses', label: 'Expenses', icon: DollarSign },
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
              Manage your financial operations, invoicing, and salon billing with Zoho precision.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search invoices, clients..."
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
                  width: '240px'
                }}
              />
            </div>

            <button
              onClick={() => setNewInvoiceModal(true)}
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
              <Plus size={18} />
              <span>New Bill / Invoice</span>
            </button>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              {[
                { title: 'Total Sales Revenue', value: stats.revenue, change: '+18.4% vs last month', icon: DollarSign, color: '#10b981' },
                { title: 'Pending Receivables', value: stats.pending, change: '3 unpaid bills', icon: Receipt, color: '#f59e0b' },
                { title: 'Invoices Generated', value: stats.totalInvoices, change: '+12 today', icon: Receipt, color: '#3b82f6' },
                { title: 'Active Salon Clients', value: stats.customersCount, change: '14 VIP members', icon: Users, color: '#d4af37' },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{kpi.title}</span>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <Icon size={18} color={kpi.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{kpi.value}</div>
                    <div style={{ fontSize: '0.75rem', color: kpi.color, fontWeight: 500 }}>{kpi.change}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Invoices Table */}
            <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>Recent Salon Invoices</h3>
                <button onClick={() => setActiveTab('invoices')} style={{ background: 'none', border: 'none', color: '#d4af37', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                  View All Invoices →
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Invoice ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Customer Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Service / Product</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Payment Mode</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #2e344a' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{inv.id}</td>
                      <td style={{ padding: '1rem', color: '#fff' }}>{inv.customer}</td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.service}</td>
                      <td style={{ padding: '1rem', color: '#94a3b8' }}>{inv.date}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: '#fff' }}>₹ {inv.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#1e2230', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{inv.mode}</span></td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          backgroundColor: inv.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: inv.status === 'PAID' ? '#10b981' : '#f59e0b'
                        }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customers View */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1.25rem' }}>Customer Directory</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Client ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Total Visits</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Membership</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #2e344a' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{c.id}</td>
                    <td style={{ padding: '1rem', color: '#fff' }}>{c.name}</td>
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

        {/* Products & Services View */}
        {activeTab === 'products' && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1.25rem' }}>Salon Services & Product Catalog</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e344a', color: '#94a3b8' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Item ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Service / Product Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Price (Excl. Tax)</th>
                  <th style={{ padding: '0.75rem 1rem' }}>GST Rate</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #2e344a' }}>
                    <td style={{ padding: '1rem', fontWeight: 600, color: '#d4af37' }}>{p.id}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 500 }}>{p.name}</td>
                    <td style={{ padding: '1rem', color: '#94a3b8' }}>{p.category}</td>
                    <td style={{ padding: '1rem', color: '#fff', fontWeight: 600 }}>₹ {p.price}</td>
                    <td style={{ padding: '1rem', color: '#10b981' }}>{p.tax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Placeholder View for remaining tabs */}
        {['quotations', 'invoices', 'payments', 'recurring', 'expenses', 'reports', 'settings'].includes(activeTab) && (
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <Sparkles size={48} color="#d4af37" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
              Zoho {activeTab} Module Active
            </h3>
            <p style={{ color: '#94a3b8', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
              Manage {activeTab} with full Duke & Duchess salon financial controls.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              style={{ backgroundColor: '#1e2230', color: '#d4af37', border: '1px solid #d4af37', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
            >
              ← Back to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* New Invoice Modal */}
      {newInvoiceModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{ backgroundColor: '#12141d', border: '1px solid #2e344a', borderRadius: '12px', padding: '2rem', width: '450px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>Create Quick Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Sharma"
                  value={invCustomer}
                  onChange={(e) => setInvCustomer(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Service / Product</label>
                <select
                  value={invService}
                  onChange={(e) => setInvService(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                >
                  <option>Signature Royal Haircut</option>
                  <option>Keratin Smooth Treatment</option>
                  <option>Argan Oil Serum 100ml</option>
                  <option>Royal Grooming Package</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Payment Method</label>
                <select
                  value={invPayMode}
                  onChange={(e) => setInvPayMode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: '#0a0b10', color: '#fff' }}
                >
                  <option>UPI / QR Code</option>
                  <option>Credit / Debit Card</option>
                  <option>Cash</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setNewInvoiceModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #2e344a', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: '#d4af37', color: '#000', fontWeight: 600, cursor: 'pointer' }}
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
