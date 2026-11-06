'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  Plus,
  Minus,
  Search,
  Printer,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  ShoppingCart,
  Tag,
  Percent,
  User,
  Phone
} from 'lucide-react';

// POS cart item type
type CartItem = { id: string; name: string; price: number; qty: number };
// Catalogue section type
type CatalogueSection = { section: string; items: { id: string; name: string; price: number }[] };

export default function DukeDuchessBillingApp() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'customers'
    | 'products'
    | 'invoices'
    | 'payments'
    | 'reports'
    | 'settings'
  >('dashboard');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice filter & receipt modal state
  const [invFilterFrom,   setInvFilterFrom]   = useState('');
  const [invFilterTo,     setInvFilterTo]     = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [invSearch,       setInvSearch]       = useState('');
  const [receiptInvoice,  setReceiptInvoice]  = useState<null | typeof invoices[0]>(null);

  // Live Data for Billing Modules
  const [stats, setStats] = useState({
    revenue: '₹ 1,48,500',
    pending: '₹ 12,400',
    totalInvoices: 124,
    customersCount: 86
  });

  const [invoices, setInvoices] = useState([
    { id: 'INV-00104', customer: 'Ananya Sharma',    phone: '+91 98765 43210', service: 'Hair Coloring & Spa',              date: '2026-11-03', amount: 4500,  gst: 18, discount: 0,   status: 'PAID',   mode: 'UPI'  },
    { id: 'INV-00103', customer: 'Vikramaditya Roy', phone: '+91 98123 45678', service: 'Royal Grooming Package',           date: '2026-11-03', amount: 2800,  gst: 18, discount: 10,  status: 'PAID',   mode: 'CARD' },
    { id: 'INV-00102', customer: 'Priya Sundaram',   phone: '+91 97654 32109', service: 'Keratin Hair Treatment',           date: '2026-11-02', amount: 6500,  gst: 18, discount: 0,   status: 'UNPAID', mode: 'PENDING' },
    { id: 'INV-00101', customer: 'Rajesh Kumar',     phone: '+91 91234 56789', service: 'Haircut & Beard Styling',          date: '2026-11-02', amount: 1200,  gst: 0,  discount: 0,   status: 'PAID',   mode: 'CASH' },
    { id: 'INV-00100', customer: 'Meena Pillai',     phone: '+91 99887 76655', service: 'Bridal Package',                   date: '2026-11-01', amount: 25100, gst: 18, discount: 5,   status: 'PAID',   mode: 'UPI'  },
    { id: 'INV-00099', customer: 'Suresh Nair',      phone: '+91 90000 11223', service: 'Advance Haircut (Hair bomb)',       date: '2026-11-01', amount: 1499,  gst: 18, discount: 0,   status: 'PAID',   mode: 'CASH' },
    { id: 'INV-00098', customer: 'Deepa Menon',      phone: '+91 81234 09876', service: 'Advance Hydra Facial',             date: '2026-10-31', amount: 5299,  gst: 18, discount: 0,   status: 'PAID',   mode: 'CARD' },
    { id: 'INV-00097', customer: 'Arun Krishnan',    phone: '+91 87654 32100', service: 'Tanino Hair Treatment',            date: '2026-10-31', amount: 2999,  gst: 18, discount: 0,   status: 'PAID',   mode: 'UPI'  },
    { id: 'INV-00096', customer: 'Fathima Banu',     phone: '+91 95678 12340', service: 'Nail Art (Both Hands)',             date: '2026-10-30', amount: 1499,  gst: 18, discount: 0,   status: 'UNPAID', mode: 'PENDING' },
    { id: 'INV-00095', customer: 'George Thomas',    phone: '+91 94321 56780', service: 'Thai Massage',                     date: '2026-10-30', amount: 1888,  gst: 18, discount: 0,   status: 'PAID',   mode: 'CASH' },
    { id: 'INV-00094', customer: 'Lakshmi Devi',     phone: '+91 98001 23456', service: 'Gel Nails + Advance Spa',          date: '2026-10-29', amount: 4499,  gst: 18, discount: 10,  status: 'PAID',   mode: 'UPI'  },
    { id: 'INV-00093', customer: 'Ravi Shankar',     phone: '+91 91111 22333', service: 'Advance Facial Therapy L1',        date: '2026-10-29', amount: 6999,  gst: 18, discount: 0,   status: 'PAID',   mode: 'CARD' },
    { id: 'INV-00092', customer: 'Nisha Babu',       phone: '+91 90909 08070', service: 'Rebonding + Colour',               date: '2026-10-28', amount: 11999, gst: 18, discount: 15,  status: 'PAID',   mode: 'UPI'  },
    { id: 'INV-00091', customer: 'Ajith Kumar',      phone: '+91 88877 66554', service: 'Signature Haircut + Beard Combo',  date: '2026-10-28', amount: 999,   gst: 0,  discount: 0,   status: 'PAID',   mode: 'CASH' },
    { id: 'INV-00090', customer: 'Saritha Nambiar',  phone: '+91 97700 55443', service: 'Master Pro Glow Facial',           date: '2026-10-27', amount: 5999,  gst: 18, discount: 0,   status: 'UNPAID', mode: 'PENDING' },
  ]);

  const [customers, setCustomers] = useState([
    { id: 'CUST-001', name: 'Ananya Sharma', phone: '+91 98765 43210', email: 'ananya@example.com', visits: 14, balance: 0, tag: 'VIP Member' },
    { id: 'CUST-002', name: 'Vikramaditya Roy', phone: '+91 98123 45678', email: 'vikram@example.com', visits: 8, balance: 0, tag: 'Regular' },
    { id: 'CUST-003', name: 'Priya Sundaram', phone: '+91 97654 32109', email: 'priya@example.com', visits: 5, balance: 6500, tag: 'Premium' },
  ]);

  // ── Add Customer Modal state ───────────────────────────────────────────────
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName,     setNewCustName]     = useState('');
  const [newCustPhone,    setNewCustPhone]    = useState('');
  const [newCustEmail,    setNewCustEmail]    = useState('');
  const [newCustTag,      setNewCustTag]      = useState('Regular');
  const [customerSearch,  setCustomerSearch]  = useState('');

  // ── POS phone lookup state ─────────────────────────────────────────────────
  const [phoneLookupStatus, setPhoneLookupStatus] = useState<'idle' | 'found' | 'new'>('idle');
  const [phoneLookupMsg,    setPhoneLookupMsg]    = useState('');

  // Catalogue sub-tab state
  const [catalogueTab, setCatalogueTab] = useState<'men' | 'women' | 'products'>('men');

  // ── Management modal state ────────────────────────────────────────────────
  const [showAddService,  setShowAddService]  = useState(false);
  const [showEditService, setShowEditService] = useState(false);
  const [showAddProduct,  setShowAddProduct]  = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);

  // Add-Service form
  const [svcGender,  setSvcGender]  = useState<'MEN' | 'WOMEN'>('MEN');
  const [svcSection, setSvcSection] = useState('');
  const [svcName,    setSvcName]    = useState('');
  const [svcPrice,   setSvcPrice]   = useState('');

  // Add-Product form
  const [prdName,  setPrdName]  = useState('');
  const [prdPrice, setPrdPrice] = useState('');

  // Inline edit state for services & products
  const [editSvcKey,   setEditSvcKey]   = useState<string | null>(null); // "sectionName||itemId"
  const [editSvcName,  setEditSvcName]  = useState('');
  const [editSvcPrice, setEditSvcPrice] = useState('');
  const [editPrdId,    setEditPrdId]    = useState<string | null>(null);
  const [editPrdName,  setEditPrdName]  = useState('');
  const [editPrdPrice, setEditPrdPrice] = useState('');

  // ── MEN'S MENU ──────────────────────────────────────────────────────────────
  const [menSections, setMenSections] = useState<{ section: string; items: { id: string; name: string; price: number }[] }[]>([
    {
      section: 'MEN HAIRCUT',
      items: [
        { id: 'MHC-001', name: 'Advance Haircut (Hair bomb Included)', price: 1499 },
        { id: 'MHC-002', name: 'Hair Cut', price: 599 },
        { id: 'MHC-003', name: 'Basic Blow House', price: 149 },
        { id: 'MHC-004', name: 'Signature Hair Cut + Beard Combo', price: 999 },
      ]
    },
    {
      section: 'MEN HAIR COLORING',
      items: [
        { id: 'MHCol-001', name: 'Advance Hair Colour', price: 1999 },
        { id: 'MHCol-002', name: 'Basic Hair Colour', price: 999 },
      ]
    },
    {
      section: 'MEN HAIR TREATMENT',
      items: [
        { id: 'MHT-001', name: 'Tanino', price: 2999 },
        { id: 'MHT-002', name: 'Botox', price: 2999 },
        { id: 'MHT-003', name: 'Straightening (Depends on Hair length)', price: 2999 },
        { id: 'MHT-004', name: 'Hair Piercing', price: 6999 },
      ]
    },
    {
      section: 'MEN HAIR SPA',
      items: [
        { id: 'MHS-001', name: 'Advance Hair Spa', price: 1499 },
        { id: 'MHS-002', name: 'Basic Hair Spa', price: 599 },
        { id: 'MHS-003', name: 'Anti Dandruff Spa', price: 1499 },
      ]
    },
    {
      section: 'MEN SKIN CARE & CLEAN-UP',
      items: [
        { id: 'MSC-001', name: 'Chocolate Anticabmin', price: 1699 },
        { id: 'MSC-002', name: 'Clean Up (NMB)', price: 799 },
        { id: 'MSC-003', name: 'D-Tan (advance)', price: 649 },
        { id: 'MSC-004', name: 'D-Tan (Basic)', price: 1699 },
      ]
    },
    {
      section: 'MEN FACIAL RITUALS',
      items: [
        { id: 'MFR-001', name: 'Advance Facial Therapy L1', price: 6999 },
        { id: 'MFR-002', name: 'Advance Facial Therapy', price: 2899 },
        { id: 'MFR-003', name: 'Anti Wrinkle L1', price: 2999 },
        { id: 'MFR-004', name: 'Roma Facial', price: 2999 },
        { id: 'MFR-005', name: 'Basic Facial Care', price: 1699 },
        { id: 'MFR-006', name: 'Deep Cleansing Facial', price: 1999 },
      ]
    },
    {
      section: 'MEN FACIAL RITUALS – Kanpeki',
      items: [
        { id: 'MFRK-001', name: 'Basic Facial – Kanpeki', price: 2199 },
        { id: 'MFRK-002', name: 'Advance Facial – Kanpeki', price: 3999 },
        { id: 'MFRK-003', name: 'Powerful Brightening SR', price: 4999 },
        { id: 'MFRK-004', name: 'Master Pro Glow', price: 5999 },
        { id: 'MFRK-005', name: 'Chinu', price: 5999 },
        { id: 'MFRK-006', name: 'Olive', price: 1888 },
        { id: 'MFRK-007', name: '4 Step D-Tan', price: 2999 },
      ]
    },
    {
      section: 'MEN FACIAL RITUALS – Aroma Magic',
      items: [
        { id: 'MFRA-001', name: 'Facial – Phlox', price: 799 },
        { id: 'MFRA-002', name: 'Facial – Aloe Vera', price: 1399 },
        { id: 'MFRA-003', name: 'Facial – Olive', price: 1799 },
      ]
    },
    {
      section: 'MEN HYDRA FACIAL COLLECTIONS',
      items: [
        { id: 'MHF-001', name: 'Advance Hydra Facial', price: 5299 },
        { id: 'MHF-002', name: 'Basic Hydra Refresh', price: 2999 },
      ]
    },
    {
      section: 'MEN HEAD & BODY RELAXATION',
      items: [
        { id: 'MHB-001', name: 'Head Massage', price: 599 },
        { id: 'MHB-002', name: 'Thai Massage', price: 1888 },
      ]
    },
    {
      section: 'MEN PEDICURE & MANICURE',
      items: [
        { id: 'MPM-001', name: 'Basic', price: 599 },
        { id: 'MPM-002', name: 'File', price: 2499 },
        { id: 'MPM-003', name: 'Polished', price: 1299 },
        { id: 'MPM-004', name: 'Swedish', price: 2888 },
        { id: 'MPM-005', name: 'Ferodi', price: 2599 },
        { id: 'MPM-006', name: 'Jaccuzi', price: 2888 },
        { id: 'MPM-007', name: 'OPI Shellac/Gel/Algae', price: 2075 },
        { id: 'MPM-008', name: 'PSDF Nails', price: 2599 },
      ]
    },
    {
      section: 'MEN WAXING & HAIR REMOVAL',
      items: [
        { id: 'MWX-001', name: 'Fancy Waxing', price: 1799 },
        { id: 'MWX-002', name: 'Chest / Full Waxing', price: 1399 },
        { id: 'MWX-003', name: 'Stomach Wax / Waxing', price: 1899 },
        { id: 'MWX-004', name: 'Full Arms Waxing', price: 799 },
        { id: 'MWX-005', name: 'Half Legs Waxing', price: 799 },
        { id: 'MWX-006', name: 'Back Full Waxing', price: 1899 },
        { id: 'MWX-007', name: 'REFA Area Waxing', price: 599 },
        { id: 'MWX-008', name: 'Neck / Ear Removal', price: 1399 },
        { id: 'MWX-009', name: 'Under Arms Waxing', price: 799 },
        { id: 'MWX-010', name: 'Full Legs Waxing', price: 199 },
        { id: 'MWX-011', name: 'Ear / Nose Waxing', price: 149 },
        { id: 'MWX-012', name: 'Half Face Waxing', price: 149 },
        { id: 'MWX-013', name: 'Eyebrow Waxing', price: 775 },
      ]
    },
    {
      section: 'MEN COMBOS',
      items: [
        { id: 'MCB-001', name: 'Combo 1 (Hair Care+Bleach+ hair Color/offer)', price: 1699 },
        { id: 'MCB-002', name: 'Combo 2 (Full hair Blondi + Hair Polish)', price: 2199 },
        { id: 'MCB-003', name: 'Combo 3 (Hair Dye+Hair Relaxer+Demi Reparador-X)', price: 2999 },
      ]
    },
  ]);

  // ── WOMEN'S MENU ─────────────────────────────────────────────────────────────
  const [womenSections, setWomenSections] = useState<{ section: string; items: { id: string; name: string; price: number }[] }[]>([
    {
      section: 'WOMENS HAIR CUT',
      items: [
        { id: 'WHC-001', name: 'Advance Haircut', price: 1499 },
        { id: 'WHC-002', name: 'Hair Cut', price: 999 },
        { id: 'WHC-003', name: 'Trim / Cut', price: 599 },
        { id: 'WHC-004', name: 'Fringe Top', price: 399 },
        { id: 'WHC-005', name: 'Global Hair Cut', price: 1499 },
        { id: 'WHC-006', name: 'U-Cut', price: 599 },
        { id: 'WHC-007', name: 'V-Cut', price: 599 },
      ]
    },
    {
      section: 'WOMENS HAIR COLOURING',
      items: [
        { id: 'WCol-001', name: 'Advance Hair Colour', price: 10999 },
        { id: 'WCol-002', name: 'Basic Foot Rub', price: 999 },
        { id: 'WCol-003', name: 'Touch Up Colouring', price: 1999 },
        { id: 'WCol-004', name: 'Color Per Foil', price: 2999 },
        { id: 'WCol-005', name: 'Free Party', price: 3999 },
        { id: 'WCol-006', name: 'Global Colouring', price: 70999 },
      ]
    },
    {
      section: 'WOMENS HAIR SPA',
      items: [
        { id: 'WHS-001', name: 'Mini Spa', price: 1899 },
        { id: 'WHS-002', name: 'Advance Spa', price: 1999 },
        { id: 'WHS-003', name: 'Anti Dandruff + Advance Spa+ Full Rub', price: 2999 },
        { id: 'WHS-004', name: 'Thermo+Plex Advance', price: 2999 },
        { id: 'WHS-005', name: 'Advance T', price: 2999 },
      ]
    },
    {
      section: 'WOMENS HAIR TREATMENT',
      items: [
        { id: 'WHT-001', name: 'Tanino', price: 10999 },
        { id: 'WHT-002', name: 'Botox', price: 10999 },
        { id: 'WHT-003', name: 'Rebonding', price: 10999 },
        { id: 'WHT-004', name: 'Smoothening', price: 2999 },
        { id: 'WHT-005', name: 'Straightening', price: 10999 },
      ]
    },
    {
      section: 'WOMENS SKIN CARE & CLEANUP',
      items: [
        { id: 'WSC-001', name: 'Chocolate Anticabmin', price: 1699 },
        { id: 'WSC-002', name: 'Clean Up (NMB)', price: 799 },
        { id: 'WSC-003', name: 'D-Tan (Advance)', price: 999 },
        { id: 'WSC-004', name: 'D-Tan (Basic)', price: 599 },
      ]
    },
    {
      section: 'WOMENS FACIAL RITUALS',
      items: [
        { id: 'WFR-001', name: 'Advance Facial Therapy L1', price: 6999 },
        { id: 'WFR-002', name: 'Advance Facial Therapy', price: 5999 },
        { id: 'WFR-003', name: 'Anti Wrinkle L1', price: 4999 },
        { id: 'WFR-004', name: 'Basic Facial Care', price: 1699 },
        { id: 'WFR-005', name: 'Deep Body Facial Care', price: 2499 },
      ]
    },
    {
      section: 'WOMENS FACIAL RITUALS – Kanpeki',
      items: [
        { id: 'WFRK-001', name: 'Natural Facial – Kanpeki', price: 2199 },
        { id: 'WFRK-002', name: 'Advance Facial – Kanpeki', price: 3999 },
        { id: 'WFRK-003', name: 'Powerful Brightening SR', price: 4999 },
        { id: 'WFRK-004', name: 'Master Pro Glow', price: 5999 },
        { id: 'WFRK-005', name: '4 Step D-Tan', price: 2999 },
      ]
    },
    {
      section: 'WOMENS FACIAL RITUALS – Aroma Magic',
      items: [
        { id: 'WFRA-001', name: 'Facial – Phlox', price: 799 },
        { id: 'WFRA-002', name: 'Facial – Aloe Vera', price: 1399 },
        { id: 'WFRA-003', name: 'Facial – Olive', price: 1799 },
      ]
    },
    {
      section: 'WOMENS HYDRA FACIAL COLLECTIONS',
      items: [
        { id: 'WHF-001', name: 'Advance Hydra Facial', price: 5299 },
        { id: 'WHF-002', name: 'Mini Hydra Facial', price: 3799 },
        { id: 'WHF-003', name: 'Basic Hydra Refresh', price: 2999 },
      ]
    },
    {
      section: 'WOMENS HEAD & BODY SPA + WAXING',
      items: [
        { id: 'WHB-001', name: 'Head Massage', price: 599 },
        { id: 'WHB-002', name: 'Thai Massage', price: 1888 },
        { id: 'WHB-003', name: 'Head Massage Extra', price: 999 },
      ]
    },
    {
      section: 'WOMENS PED CURE & MANECURE',
      items: [
        { id: 'WPM-001', name: 'Basic', price: 999 },
        { id: 'WPM-002', name: 'File', price: 2499 },
        { id: 'WPM-003', name: 'Polished', price: 1299 },
        { id: 'WPM-004', name: 'Swedish', price: 2888 },
        { id: 'WPM-005', name: 'Ferodi', price: 2599 },
        { id: 'WPM-006', name: 'Jaccuzi', price: 2888 },
        { id: 'WPM-007', name: 'OPI Shellac/Gel/Algae', price: 2075 },
        { id: 'WPM-008', name: 'PSDF Nails', price: 2599 },
        { id: 'WPM-009', name: 'Full Legs Nails Management', price: 2599 },
      ]
    },
    {
      section: 'WOMENS WAXING & HAIR REMOVAL',
      items: [
        { id: 'WWX-001', name: 'Fancy Waxing', price: 10499 },
        { id: 'WWX-002', name: 'Rico Waxing (Underarms)', price: 299 },
        { id: 'WWX-003', name: 'Hot Wax (Underarms)', price: 199 },
        { id: 'WWX-004', name: 'Legs Waxing', price: 799 },
        { id: 'WWX-005', name: 'Shoulder Waxing', price: 499 },
        { id: 'WWX-006', name: 'Half Arms Waxing', price: 399 },
        { id: 'WWX-007', name: 'Bikini Line Waxing', price: 799 },
        { id: 'WWX-008', name: 'Full Arms Waxing', price: 599 },
        { id: 'WWX-009', name: 'Full Body Waxing', price: 2499 },
        { id: 'WWX-010', name: 'Value Full Wax Strip', price: 349 },
        { id: 'WWX-011', name: 'Extra Wax Strip', price: 199 },
        { id: 'WWX-012', name: 'Full Face Waxing', price: 199 },
        { id: 'WWX-013', name: 'Ear Wax Strip', price: 199 },
        { id: 'WWX-014', name: 'Co-Wax Strip', price: 299 },
      ]
    },
    {
      section: 'WOMENS BRIDAL & OCCASION SERVICES',
      items: [
        { id: 'WBO-001', name: 'Bridal Package', price: 25100 },
      ]
    },
    {
      section: 'WOMENS THREADING',
      items: [
        { id: 'WTH-001', name: 'Eye Brow', price: 50 },
        { id: 'WTH-002', name: 'Upper Lip', price: 30 },
        { id: 'WTH-003', name: 'Full Face', price: 200 },
        { id: 'WTH-004', name: 'Full Face Threading', price: 150 },
        { id: 'WTH-005', name: 'Neck Threading', price: 50 },
      ]
    },
    {
      section: 'WOMENS NAIL ART',
      items: [
        { id: 'WNA-001', name: 'Nail Art (Both Hands)', price: 1499 },
        { id: 'WNA-002', name: 'Gel Nails', price: 2999 },
        { id: 'WNA-003', name: 'Full Set Nails', price: 2499 },
        { id: 'WNA-004', name: 'Full Nails', price: 999 },
        { id: 'WNA-005', name: 'Gel Polish', price: 2499 },
        { id: 'WNA-006', name: 'Acrylic Nails', price: 2499 },
        { id: 'WNA-007', name: 'Gel Nails (French)', price: 2999 },
        { id: 'WNA-008', name: 'Nail Art (Per Nail)', price: 100 },
        { id: 'WNA-009', name: 'Nail Art Polish', price: 50 },
        { id: 'WNA-010', name: 'Nail Art All (Both Hands Dup)', price: 2499 },
        { id: 'WNA-011', name: 'Nail Extensions + Gel (Both Hands)', price: 3499 },
        { id: 'WNA-012', name: 'Nail Art Per Nail (Design)', price: 100 },
        { id: 'WNA-013', name: 'Nail Art Per Finger Premium', price: 150 },
        { id: 'WNA-014', name: 'Fill in Nails', price: 750 },
      ]
    },
    {
      section: 'WOMENS COMBOS',
      items: [
        { id: 'WCB-001', name: 'Combo 1 (Advance Hair Colour + Keratin/Spa Finishing)', price: 2199 },
        { id: 'WCB-002', name: 'Combo 2 (Rebonding + Colour + Blow Dry – All Finishing)', price: 11999 },
      ]
    },
  ]);

  // ── PRODUCTS MENU ────────────────────────────────────────────────────────────
  const [productItems, setProductItems] = useState<{ id: string; name: string; price: number }[]>([
    { id: 'SER-159', name: 'SHEA Butter', price: 3499 },
    { id: 'SER-160', name: '3TenX', price: 2999 },
    { id: 'SER-161', name: 'Sarah K', price: 2499 },
    { id: 'SER-162', name: 'Bambini', price: 2499 },
    { id: 'SER-163', name: 'Matrix Mega Smooth', price: 1699 },
    { id: 'SER-164', name: 'Pediple', price: 1499 },
    { id: 'SER-165', name: 'Dorofe Professional', price: 1499 },
    { id: 'SER-166', name: 'Bio Keratin', price: 1199 },
    { id: 'SER-167', name: 'O3+', price: 799 },
    { id: 'SER-168', name: 'Dreamron', price: 799 },
    { id: 'SER-169', name: 'Streax Professional', price: 799 },
    { id: 'SER-170', name: 'Kanpeki Products', price: 699 },
    { id: 'SER-171', name: 'Raaga Skin Care', price: 599 },
  ]);

  // ── Catalogue CRUD helpers ────────────────────────────────────────────────
  const handleAddService = () => {
    if (!svcName.trim() || !svcPrice.trim()) return;
    const targetSections = svcGender === 'MEN' ? menSections : womenSections;
    const setter = svcGender === 'MEN' ? setMenSections : setWomenSections;
    const sectionName = svcSection.trim() || (svcGender === 'MEN' ? 'MEN GENERAL' : 'WOMEN GENERAL');
    const existing = targetSections.find(s => s.section.toUpperCase() === sectionName.toUpperCase());
    const prefix = svcGender === 'MEN' ? 'M' : 'W';
    const allItems = targetSections.flatMap(s => s.items);
    const newId = `${prefix}NEW-${String(allItems.length + 1).padStart(3, '0')}`;
    const newItem = { id: newId, name: svcName.trim(), price: parseFloat(svcPrice) || 0 };
    if (existing) {
      setter(prev => prev.map(s => s.section.toUpperCase() === sectionName.toUpperCase()
        ? { ...s, items: [...s.items, newItem] } : s));
    } else {
      setter(prev => [...prev, { section: sectionName.toUpperCase(), items: [newItem] }]);
    }
    setSvcName(''); setSvcPrice(''); setSvcSection('');
    setShowAddService(false);
    alert(`✅ Service "${newItem.name}" added under ${svcGender} › ${sectionName.toUpperCase()}`);
  };

  const handleDeleteService = (gender: 'MEN' | 'WOMEN', sectionName: string, itemId: string) => {
    if (!confirm('Delete this service?')) return;
    const setter = gender === 'MEN' ? setMenSections : setWomenSections;
    setter(prev => prev.map(s => s.section === sectionName
      ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
    ).filter(s => s.items.length > 0));
  };

  const handleSaveEditService = (gender: 'MEN' | 'WOMEN', sectionName: string, itemId: string) => {
    const setter = gender === 'MEN' ? setMenSections : setWomenSections;
    setter(prev => prev.map(s => s.section === sectionName
      ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, name: editSvcName, price: parseFloat(editSvcPrice) || i.price } : i) }
      : s));
    setEditSvcKey(null);
  };

  const handleAddProduct = () => {
    if (!prdName.trim() || !prdPrice.trim()) return;
    const newId = `SER-${172 + productItems.length}`;
    setProductItems(prev => [...prev, { id: newId, name: prdName.trim(), price: parseFloat(prdPrice) || 0 }]);
    setPrdName(''); setPrdPrice('');
    setShowAddProduct(false);
    alert(`✅ Product "${prdName.trim()}" added with ID ${newId}`);
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm('Delete this product?')) return;
    setProductItems(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveEditProduct = (id: string) => {
    setProductItems(prev => prev.map(p => p.id === id ? { ...p, name: editPrdName, price: parseFloat(editPrdPrice) || p.price } : p));
    setEditPrdId(null);
  };

  // ── Add Customer handler ──────────────────────────────────────────────────
  const handleAddCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
    const newCust = {
      id: newId,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim(),
      visits: 0,
      balance: 0,
      tag: newCustTag
    };
    setCustomers(prev => [newCust, ...prev]);
    setNewCustName(''); setNewCustPhone(''); setNewCustEmail(''); setNewCustTag('Regular');
    setShowAddCustomer(false);
  };

  // ── Phone lookup for POS billing ──────────────────────────────────────────
  const lookupCustomerByPhone = (phone: string) => {
    if (!phone.trim()) { setPhoneLookupStatus('idle'); setPhoneLookupMsg(''); return; }
    const normalized = phone.replace(/\s+/g, '');
    const found = customers.find(c => c.phone.replace(/\s+/g, '').includes(normalized));
    if (found) {
      setPosCustomer(found.name);
      setPhoneLookupStatus('found');
      setPhoneLookupMsg(`✅ Existing customer: ${found.name} (${found.visits} visits, ${found.tag})`);
    } else {
      setPhoneLookupStatus('new');
      setPhoneLookupMsg(`🆕 New customer — will be added on bill generation`);
    }
  };

  // ── Quick Modal State
  const [newInvoiceModal, setNewInvoiceModal] = useState(false);
  const [invCustomer, setInvCustomer] = useState('');
  const [invService, setInvService] = useState('Advance Haircut (Hair bomb Included)');
  const [invAmount, setInvAmount] = useState('1499');
  const [invPayMode, setInvPayMode] = useState('UPI');

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const newInv = {
      id: `INV-00${invoices.length + 105}`,
      customer: invCustomer || 'Walk-in Client',
      phone: '',
      service: invService,
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(invAmount) || 0,
      gst: 0,
      discount: 0,
      status: 'PAID',
      mode: invPayMode
    };
    setInvoices([newInv, ...invoices]);
    setNewInvoiceModal(false);
    setInvCustomer('');
    alert(`✅ Invoice ${newInv.id} successfully created and marked as PAID!`);
  };

  // ── POS Cart State ────────────────────────────────────────────────────────
  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [posCustomer,   setPosCustomer]   = useState('');
  const [posPhone,      setPosPhone]      = useState('');
  const [discountType,  setDiscountType]  = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [gstRate,       setGstRate]       = useState<0 | 5 | 12 | 18>(18);
  const [posPayMode,    setPosPayMode]    = useState('UPI');
  const [posServiceTab, setPosServiceTab] = useState<'men' | 'women' | 'products'>('men');
  const [posSearch,     setPosSearch]     = useState('');
  const [billSuccess,   setBillSuccess]   = useState(false);

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeFromCart = (id: string) => setCartItems(prev => prev.filter(c => c.id !== id));

  const cartSubtotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt  = discountValue
    ? discountType === 'percent'
      ? (cartSubtotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue)
    : 0;
  const afterDiscount = Math.max(0, cartSubtotal - discountAmt);
  const gstAmt        = (afterDiscount * gstRate) / 100;
  const grandTotal    = afterDiscount + gstAmt;

  const handleGenerateBill = () => {
    if (cartItems.length === 0) { alert('⚠️ Cart is empty. Please add services first.'); return; }
    const serviceNames = cartItems.map(c => `${c.name} x${c.qty}`).join(', ');
    const customerName = posCustomer || 'Walk-in Client';

    // Auto-add new customer if phone was searched and no existing match found
    if (phoneLookupStatus === 'new' && posPhone.trim() && customerName !== 'Walk-in Client') {
      const newId = `CUST-${String(customers.length + 1).padStart(3, '0')}`;
      setCustomers(prev => [...prev, {
        id: newId, name: customerName, phone: posPhone.trim(),
        email: '', visits: 1, balance: 0, tag: 'Regular'
      }]);
    } else if (phoneLookupStatus === 'found' && posPhone.trim()) {
      // Increment visit count for existing customer
      setCustomers(prev => prev.map(c =>
        c.phone.replace(/\s+/g, '').includes(posPhone.replace(/\s+/g, ''))
          ? { ...c, visits: c.visits + 1 } : c
      ));
    }

    const newInv = {
      id: `INV-00${invoices.length + 105}`,
      customer: customerName,
      phone: posPhone,
      service: serviceNames,
      date: new Date().toISOString().split('T')[0],
      amount: Math.round(grandTotal),
      gst: gstRate,
      discount: discountType === 'percent' ? parseFloat(discountValue) || 0 : 0,
      status: 'PAID',
      mode: posPayMode
    };
    setInvoices(prev => [newInv, ...prev]);
    setBillSuccess(true);
    setTimeout(() => {
      setBillSuccess(false);
      setCartItems([]);
      setPosCustomer(''); setPosPhone('');
      setDiscountValue(''); setGstRate(18);
      setPhoneLookupStatus('idle'); setPhoneLookupMsg('');
    }, 2500);
  };

  // ── Client-only mount guard (prevents hydration mismatch) ──────────────
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar Navigation */}
      <aside style={{
        width: '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: 10
      }}>
        {/* Header Branding */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <img src="/logo.png" alt="Duke & Duchess" style={{ width: '44px', height: '44px', objectFit: 'contain', borderRadius: '8px', background: '#fff', padding: '2px', flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '0.4px', lineHeight: 1.2 }}>NEW DUKE & DUCHESS</h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 600 }}>BILLING PORTAL</span>
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
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin Footer Badge */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img src="/logo.png" alt="logo" style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: '#fff', padding: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Salon Administrator</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--status-success)' }}>● Billing Active</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '2rem', minHeight: '100vh' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
              {activeTab.replace('-', ' ')}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Manage your financial operations, invoicing, and salon billing with precision.
            </p>
          </div>



        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
              {[
                { title: 'Total Sales Revenue', value: stats.revenue, change: '+18.4% vs last month', icon: TrendingUp, color: '#10b981' },
                { title: 'Pending Receivables', value: stats.pending, change: '3 unpaid bills', icon: Clock, color: '#f59e0b' },
                { title: 'Invoices Generated', value: stats.totalInvoices, change: '+12 today', icon: Receipt, color: '#3b82f6' },
                { title: 'Active Salon Clients', value: stats.customersCount, change: '14 VIP members', icon: Users, color: '#d4af37' },
              ].map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{kpi.title}</span>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                        <Icon size={18} color={kpi.color} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{kpi.value}</div>
                    <div style={{ fontSize: '0.75rem', color: kpi.color, fontWeight: 500 }}>{kpi.change}</div>
                  </div>
                );
              })}
            </div>

            {/* Recent Invoices Table */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Recent Salon Invoices</h3>
                <button onClick={() => setActiveTab('invoices')} style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>
                  View All Invoices →
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
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
                    <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-gold)' }}>{inv.id}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-main)' }}>{inv.customer}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inv.service}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{inv.date}</td>
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>₹ {inv.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '1rem' }}><span style={{ backgroundColor: 'var(--bg-hover)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{inv.mode}</span></td>
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
          <div>
            {/* Header Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Customer Directory</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>{customers.length} registered clients</p>
              </div>
              <button
                onClick={() => setShowAddCustomer(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 1.2rem', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #d4af37, #c5a028)',
                  color: '#000', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(212,175,55,0.35)', transition: 'all 0.2s'
                }}
              >
                <Plus size={16} /> Add Customer
              </button>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Total Clients', value: customers.length, color: '#d4af37' },
                { label: 'VIP Members', value: customers.filter(c => c.tag === 'VIP Member').length, color: '#10b981' },
                { label: 'Total Visits', value: customers.reduce((s, c) => s + c.visits, 0), color: '#3b82f6' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Search Bar */}
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                placeholder="Search by name, phone, email or membership..."
                style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
              />
              {customerSearch && (
                <button onClick={() => setCustomerSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1a1a1a', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Client ID</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Email</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Total Visits</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Membership</th>
                  </tr>
                </thead>
                <tbody>
                  {customers
                    .filter(c => {
                      const q = customerSearch.toLowerCase();
                      return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q);
                    })
                    .map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--accent-gold)' }}>{c.id}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.15)', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                              {c.name[0]}
                            </div>
                            <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.phone}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-main)', fontWeight: 600 }}>{c.visits} Visits</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            backgroundColor: c.tag === 'VIP Member' ? 'rgba(16,185,129,0.15)' : c.tag === 'Premium' ? 'rgba(59,130,246,0.15)' : 'rgba(212,175,55,0.15)',
                            color: c.tag === 'VIP Member' ? '#10b981' : c.tag === 'Premium' ? '#3b82f6' : 'var(--accent-gold)',
                            padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600
                          }}>
                            {c.tag}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {customers.filter(c => {
                const q = customerSearch.toLowerCase();
                return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q) || c.tag.toLowerCase().includes(q);
              }).length === 0 && (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No customers found</div>
                  <div style={{ fontSize: '0.8rem' }}>Try a different search or add a new customer.</div>
                </div>
              )}
            </div>

            {/* ── Add Customer Modal ── */}
            {showAddCustomer && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                  {/* Modal Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="var(--accent-gold)" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Add New Customer</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Register a new salon client</div>
                      </div>
                    </div>
                    <button onClick={() => setShowAddCustomer(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}>
                      <X size={20} />
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem' }}>Full Name *</label>
                      <div style={{ position: 'relative' }}>
                        <User size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="e.g. Priya Sharma" style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem' }}>Phone Number *</label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                        <input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="e.g. +91 98765 43210" style={{ width: '100%', padding: '0.6rem 0.75rem 0.6rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem' }}>Email Address</label>
                      <input value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} placeholder="e.g. priya@example.com" type="email" style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '0.4rem' }}>Membership Tag</label>
                      <select value={newCustTag} onChange={e => setNewCustTag(e.target.value)} style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none' }}>
                        <option value="Regular">Regular</option>
                        <option value="Premium">Premium</option>
                        <option value="VIP Member">VIP Member</option>
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                    <button onClick={() => setShowAddCustomer(false)} style={{ flex: 1, padding: '0.7rem', borderRadius: '9px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCustomer}
                      disabled={!newCustName.trim() || !newCustPhone.trim()}
                      style={{ flex: 2, padding: '0.7rem', borderRadius: '9px', border: 'none', background: !newCustName.trim() || !newCustPhone.trim() ? '#444' : 'linear-gradient(135deg, #d4af37, #c5a028)', color: !newCustName.trim() || !newCustPhone.trim() ? '#888' : '#000', fontWeight: 700, fontSize: '0.875rem', cursor: !newCustName.trim() || !newCustPhone.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                    >
                      ✓ Save Customer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Products & Services Catalogue – 3-Tab View */}
        {activeTab === 'products' && (
          <div>

            {/* ── Management Action Toolbar ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1.25rem', padding: '1rem 1.25rem', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginRight: '0.5rem' }}>Manage Catalogue:</span>
              {[
                { label: '＋ Add Service',   action: () => setShowAddService(true),  color: '#10b981' },
                { label: '✏ Edit Services',  action: () => { setShowEditService(v => !v); setShowEditProduct(false); }, color: '#3b82f6' },
                { label: '＋ Add Product',   action: () => setShowAddProduct(true),  color: '#d4af37' },
                { label: '✏ Edit Products',  action: () => { setShowEditProduct(v => !v); setShowEditService(false); }, color: '#a855f7' },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} style={{
                  padding: '0.45rem 1rem', borderRadius: '8px', border: `1.5px solid ${btn.color}`,
                  backgroundColor: 'transparent', color: btn.color, fontWeight: 600,
                  fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.3px',
                }}>{btn.label}</button>
              ))}
            </div>

            {/* Section Tab Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {(['men', 'women', 'products'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCatalogueTab(tab)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    border: catalogueTab === tab ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    backgroundColor: catalogueTab === tab ? 'rgba(212,175,55,0.15)' : 'var(--bg-secondary)',
                    color: catalogueTab === tab ? 'var(--accent-gold)' : 'var(--text-muted)',
                    fontWeight: catalogueTab === tab ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab === 'men' ? '♂ MEN' : tab === 'women' ? '♀ WOMEN' : '📦 Products'}
                </button>
              ))}
            </div>

            {/* ── MEN ── */}
            {catalogueTab === 'men' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {menSections.map((sec) => (
                  <div key={sec.section} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>{sec.section}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <tbody>
                        {sec.items.map((item, i) => {
                          const eKey = `${sec.section}||${item.id}`;
                          const isEditing = showEditService && editSvcKey === eKey;
                          return (
                            <tr key={item.id} style={{ borderBottom: i < sec.items.length - 1 ? '1px solid var(--border-color)' : 'none', backgroundColor: isEditing ? 'rgba(59,130,246,0.07)' : 'transparent' }}>
                              <td style={{ padding: '0.75rem 1.25rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.75rem', width: '110px', whiteSpace: 'nowrap' }}>{item.id}</td>
                              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                {isEditing ? <input value={editSvcName} onChange={e => setEditSvcName(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '100%' }} /> : item.name}
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {isEditing ? <input type="number" value={editSvcPrice} onChange={e => setEditSvcPrice(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '90px', textAlign: 'right' }} /> : `₹${item.price.toLocaleString('en-IN')}`}
                              </td>
                              {showEditService && (
                                <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => handleSaveEditService('MEN', sec.section, item.id)} style={{ marginRight: 6, padding: '0.3rem 0.7rem', borderRadius: 6, border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Save</button>
                                      <button onClick={() => setEditSvcKey(null)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => { setEditSvcKey(eKey); setEditSvcName(item.name); setEditSvcPrice(String(item.price)); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: 6 }}><Pencil size={15} /></button>
                                      <button onClick={() => handleDeleteService('MEN', sec.section, item.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* ── WOMEN ── */}
            {catalogueTab === 'women' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {womenSections.map((sec) => (
                  <div key={sec.section} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '0.65rem 1.25rem' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>{sec.section}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                      <tbody>
                        {sec.items.map((item, i) => {
                          const eKey = `${sec.section}||${item.id}`;
                          const isEditing = showEditService && editSvcKey === eKey;
                          return (
                            <tr key={item.id} style={{ borderBottom: i < sec.items.length - 1 ? '1px solid var(--border-color)' : 'none', backgroundColor: isEditing ? 'rgba(59,130,246,0.07)' : 'transparent' }}>
                              <td style={{ padding: '0.75rem 1.25rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.75rem', width: '110px', whiteSpace: 'nowrap' }}>{item.id}</td>
                              <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                                {isEditing ? <input value={editSvcName} onChange={e => setEditSvcName(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '100%' }} /> : item.name}
                              </td>
                              <td style={{ padding: '0.75rem 0.75rem', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                {isEditing ? <input type="number" value={editSvcPrice} onChange={e => setEditSvcPrice(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '90px', textAlign: 'right' }} /> : `₹${item.price.toLocaleString('en-IN')}`}
                              </td>
                              {showEditService && (
                                <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                                  {isEditing ? (
                                    <>
                                      <button onClick={() => handleSaveEditService('WOMEN', sec.section, item.id)} style={{ marginRight: 6, padding: '0.3rem 0.7rem', borderRadius: 6, border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Save</button>
                                      <button onClick={() => setEditSvcKey(null)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => { setEditSvcKey(eKey); setEditSvcName(item.name); setEditSvcPrice(String(item.price)); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', marginRight: 6 }}><Pencil size={15} /></button>
                                      <button onClick={() => handleDeleteService('WOMEN', sec.section, item.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                                    </>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* ── PRODUCTS ── */}
            {catalogueTab === 'products' && (
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#1a1a1a', padding: '0.65rem 1.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>SERVICES</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <tbody>
                    {productItems.map((item, i) => {
                      const isEditing = showEditProduct && editPrdId === item.id;
                      return (
                        <tr key={item.id} style={{ borderBottom: i < productItems.length - 1 ? '1px solid var(--border-color)' : 'none', backgroundColor: isEditing ? 'rgba(168,85,247,0.07)' : 'transparent' }}>
                          <td style={{ padding: '0.85rem 1.25rem', color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.75rem', width: '110px', whiteSpace: 'nowrap' }}>{item.id}</td>
                          <td style={{ padding: '0.85rem 0.5rem', color: 'var(--text-main)', fontWeight: 500 }}>
                            {isEditing ? <input value={editPrdName} onChange={e => setEditPrdName(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '100%' }} /> : item.name}
                          </td>
                          <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-main)', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {isEditing ? <input type="number" value={editPrdPrice} onChange={e => setEditPrdPrice(e.target.value)} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: 5, padding: '0.3rem 0.5rem', width: '90px', textAlign: 'right' }} /> : `₹${item.price.toLocaleString('en-IN')}`}
                          </td>
                          {showEditProduct && (
                            <td style={{ padding: '0.5rem 0.75rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                              {isEditing ? (
                                <>
                                  <button onClick={() => handleSaveEditProduct(item.id)} style={{ marginRight: 6, padding: '0.3rem 0.7rem', borderRadius: 6, border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem' }}>Save</button>
                                  <button onClick={() => setEditPrdId(null)} style={{ padding: '0.3rem 0.7rem', borderRadius: 6, border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>Cancel</button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { setEditPrdId(item.id); setEditPrdName(item.name); setEditPrdPrice(String(item.price)); }} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a855f7', marginRight: 6 }}><Pencil size={15} /></button>
                                  <button onClick={() => handleDeleteProduct(item.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={15} /></button>
                                </>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── POS BILLING PAGE – Payments & Receipts ── */}
        {activeTab === 'payments' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.25rem', alignItems: 'start' }}>

            {/* ── LEFT: Service Browser ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Search + Tab bar */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={posSearch}
                    onChange={e => setPosSearch(e.target.value)}
                    placeholder="Search service or product..."
                    style={{ width: '100%', padding: '0.5rem 0.75rem 0.5rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(['men', 'women', 'products'] as const).map(t => (
                    <button key={t} onClick={() => setPosServiceTab(t)} style={{
                      flex: 1, padding: '0.5rem', borderRadius: '8px', border: posServiceTab === t ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      backgroundColor: posServiceTab === t ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: posServiceTab === t ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontWeight: posServiceTab === t ? 700 : 500, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {t === 'men' ? '♂ MEN' : t === 'women' ? '♀ WOMEN' : '📦 Products'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Cards */}
              <div style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', paddingRight: '2px' }}>
              {(() => {
                const rawSections: CatalogueSection[] =
                  posServiceTab === 'men' ? menSections
                  : posServiceTab === 'women' ? womenSections
                  : [{ section: 'PRODUCTS', items: productItems }];

                const visibleSections = rawSections
                  .map(sec => ({
                    ...sec,
                    items: posSearch.trim()
                      ? sec.items.filter(i => i.name.toLowerCase().includes(posSearch.toLowerCase()))
                      : sec.items
                  }))
                  .filter(sec => sec.items.length > 0);

                if (visibleSections.length === 0) {
                  return (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No services found{posSearch ? ` for "${posSearch}"` : ''}.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {visibleSections.map(sec => (
                      <div key={sec.section} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '0.55rem 1rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>{sec.section}</span>
                        </div>
                        <div>
                          {sec.items.map((item, i) => (
                            <div
                              key={item.id}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.65rem 1rem', gap: '0.5rem',
                                borderBottom: i < sec.items.length - 1 ? '1px solid var(--border-color)' : 'none'
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.id}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                                <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                                  ₹{item.price.toLocaleString('en-IN')}
                                </span>
                                <button
                                  onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })}
                                  style={{
                                    width: 32, height: 32, borderRadius: '8px', border: 'none',
                                    backgroundColor: 'var(--accent-gold)', color: '#000',
                                    fontWeight: 700, cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                  }}
                                  title={`Add ${item.name} to cart`}
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              </div>
            </div>

            {/* ── RIGHT: Cart & Billing ── */}
            <div style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

              {/* Bill Success Flash */}
              {billSuccess && (
                <div style={{ background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', boxShadow: '0 0 24px rgba(16,185,129,0.4)', animation: 'fadeIn 0.3s ease' }}>
                  <CheckCircle size={24} color="#fff" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Bill Generated!</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)' }}>Invoice saved • Cart cleared</div>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={13} /> Customer Info
                </div>

                {/* Phone lookup row */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Phone size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      value={posPhone}
                      onChange={e => { setPosPhone(e.target.value); setPhoneLookupStatus('idle'); setPhoneLookupMsg(''); }}
                      onKeyDown={e => e.key === 'Enter' && lookupCustomerByPhone(posPhone)}
                      placeholder="Phone number (search customer)"
                      style={{ width: '100%', padding: '0.45rem 0.6rem 0.45rem 1.75rem', borderRadius: '7px', border: `1px solid ${phoneLookupStatus === 'found' ? '#10b981' : phoneLookupStatus === 'new' ? '#f59e0b' : 'var(--border-color)'}`, backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                    />
                  </div>
                  <button
                    onClick={() => lookupCustomerByPhone(posPhone)}
                    title="Search customer by phone"
                    style={{ padding: '0.45rem 0.75rem', borderRadius: '7px', border: 'none', backgroundColor: 'var(--accent-gold)', color: '#000', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}
                  >
                    <Search size={13} /> Find
                  </button>
                </div>

                {/* Lookup status banner */}
                {phoneLookupMsg && (
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.4rem 0.65rem', borderRadius: '6px', marginBottom: '0.5rem', backgroundColor: phoneLookupStatus === 'found' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', color: phoneLookupStatus === 'found' ? '#10b981' : '#f59e0b', border: `1px solid ${phoneLookupStatus === 'found' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}` }}>
                    {phoneLookupMsg}
                  </div>
                )}

                {/* Customer name field */}
                <div style={{ position: 'relative' }}>
                  <User size={13} color="var(--text-muted)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    value={posCustomer}
                    onChange={e => setPosCustomer(e.target.value)}
                    placeholder={phoneLookupStatus === 'found' ? 'Auto-filled from records' : 'Customer name (or Walk-in)'}
                    style={{ width: '100%', padding: '0.45rem 0.6rem 0.45rem 1.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: phoneLookupStatus === 'found' ? 'rgba(16,185,129,0.06)' : 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Cart Items */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1.25rem', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCart size={16} color="var(--accent-gold)" />
                    <span style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.82rem', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Cart</span>
                    {cartItems.length > 0 && <span style={{ backgroundColor: 'var(--accent-gold)', color: '#000', borderRadius: '50%', width: 18, height: 18, fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartItems.reduce((s, c) => s + c.qty, 0)}</span>}
                  </div>
                  {cartItems.length > 0 && <button onClick={() => setCartItems([])} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Clear All</button>}
                </div>
                {cartItems.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <ShoppingCart size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                    <div>No items yet</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click ➕ on any service to add</div>
                  </div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                    {cartItems.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>₹{item.price.toLocaleString('en-IN')} each</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                          <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                          <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                        </div>
                        <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.82rem', flexShrink: 0 }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</div>
                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Tag size={13} /> Discount
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select value={discountType} onChange={e => setDiscountType(e.target.value as 'percent' | 'flat')} style={{ padding: '0.4rem 0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none', flexShrink: 0 }}>
                    <option value="percent">% Off</option>
                    <option value="flat">₹ Flat</option>
                  </select>
                  <input
                    type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percent' ? 'e.g. 10' : 'e.g. 200'}
                    style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none' }}
                  />
                  {discountValue && <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.78rem', color: '#10b981', fontWeight: 600, whiteSpace: 'nowrap' }}>− ₹{Math.min(discountAmt, cartSubtotal).toLocaleString('en-IN')}</div>}
                </div>
              </div>

              {/* GST */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Percent size={13} /> GST Rate
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {([0, 5, 12, 18] as const).map(rate => (
                    <button key={rate} onClick={() => setGstRate(rate)} style={{
                      flex: 1, padding: '0.4rem 0', borderRadius: '7px',
                      border: gstRate === rate ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      backgroundColor: gstRate === rate ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: gstRate === rate ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontWeight: gstRate === rate ? 700 : 500, fontSize: '0.78rem', cursor: 'pointer'
                    }}>{rate}%</button>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.65rem' }}>Bill Summary</div>
                {[
                  { label: 'Subtotal', value: cartSubtotal },
                  { label: `Discount${discountValue ? ` (${discountType === 'percent' ? discountValue + '%' : '₹' + discountValue})` : ''}`, value: -Math.min(discountAmt, cartSubtotal), color: '#10b981' },
                  { label: `GST (${gstRate}%)`, value: gstAmt, color: '#3b82f6' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ color: (row as any).color || 'var(--text-main)', fontWeight: 600 }}>
                      {row.value < 0 ? '− ' : ''}₹{Math.abs(row.value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>Grand Total</span>
                  <span style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '1.15rem' }}>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.65rem' }}>Payment Mode</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {['UPI', 'Cash', 'Card', 'Net Banking', 'Cheque', 'Split'].map(mode => (
                    <button key={mode} onClick={() => setPosPayMode(mode)} style={{
                      padding: '0.45rem 0', borderRadius: '8px', fontSize: '0.78rem', fontWeight: posPayMode === mode ? 700 : 500,
                      border: posPayMode === mode ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      backgroundColor: posPayMode === mode ? 'rgba(212,175,55,0.15)' : 'transparent',
                      color: posPayMode === mode ? 'var(--accent-gold)' : 'var(--text-muted)', cursor: 'pointer'
                    }}>{mode}</button>
                  ))}
                </div>
              </div>

              {/* Generate Bill Button */}
              <button
                onClick={handleGenerateBill}
                style={{
                  width: '100%', padding: '0.9rem', borderRadius: '12px', border: 'none',
                  background: cartItems.length ? 'linear-gradient(135deg,#d4af37,#f3cf55)' : 'var(--border-color)',
                  color: cartItems.length ? '#000' : 'var(--text-muted)',
                  fontWeight: 800, fontSize: '1rem', cursor: cartItems.length ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: cartItems.length ? '0 4px 20px rgba(212,175,55,0.35)' : 'none',
                  transition: 'all 0.2s ease', letterSpacing: '0.3px'
                }}
              >
                <Receipt size={20} />
                Generate Bill • ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </button>
            </div>
          </div>
        )}

        {/* ── INVOICES & BILLING PAGE ── */}
        {activeTab === 'invoices' && (() => {
          const filtered = invoices.filter(inv => {
            const matchSearch = invSearch.trim() === '' ||
              inv.id.toLowerCase().includes(invSearch.toLowerCase()) ||
              inv.customer.toLowerCase().includes(invSearch.toLowerCase()) ||
              inv.service.toLowerCase().includes(invSearch.toLowerCase());
            const matchStatus = invFilterStatus === 'ALL' || inv.status === invFilterStatus;
            const matchFrom   = !invFilterFrom || inv.date >= invFilterFrom;
            const matchTo     = !invFilterTo   || inv.date <= invFilterTo;
            return matchSearch && matchStatus && matchFrom && matchTo;
          });
          const totalAmt  = filtered.reduce((s, i) => s + i.amount, 0);
          const paidAmt   = filtered.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
          const unpaidAmt = filtered.filter(i => i.status === 'UNPAID').reduce((s, i) => s + i.amount, 0);

          return (
            <div>
              {/* Summary strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Total Bills',       value: `${filtered.length}`,                        sub: 'in current filter', color: '#3b82f6' },
                  { label: 'Collected (PAID)',   value: `₹${paidAmt.toLocaleString('en-IN')}`,       sub: `${filtered.filter(i=>i.status==='PAID').length} invoices`, color: '#10b981' },
                  { label: 'Outstanding',        value: `₹${unpaidAmt.toLocaleString('en-IN')}`,     sub: `${filtered.filter(i=>i.status==='UNPAID').length} invoices`, color: '#f59e0b' },
                ].map(c => (
                  <div key={c.label} style={{ backgroundColor: 'var(--bg-secondary)', border: `1px solid ${c.color}33`, borderRadius: '12px', padding: '1rem 1.25rem', borderLeft: `4px solid ${c.color}` }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>{c.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: c.color }}>{c.value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Filter bar */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 180px' }}>
                  <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                  <input value={invSearch} onChange={e => setInvSearch(e.target.value)} placeholder="Search name, ID, service..." style={{ width: '100%', padding: '0.45rem 0.75rem 0.45rem 2rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                {/* Date from */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 140px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From</span>
                  <input type="date" value={invFilterFrom} onChange={e => setInvFilterFrom(e.target.value)} style={{ flex: 1, padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                {/* Date to */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: '1 1 140px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To</span>
                  <input type="date" value={invFilterTo} onChange={e => setInvFilterTo(e.target.value)} style={{ flex: 1, padding: '0.45rem 0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.82rem', outline: 'none' }} />
                </div>
                {/* Status filter */}
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {(['ALL', 'PAID', 'UNPAID'] as const).map(s => (
                    <button key={s} onClick={() => setInvFilterStatus(s)} style={{
                      padding: '0.4rem 0.9rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: invFilterStatus === s ? 700 : 500, cursor: 'pointer',
                      border: invFilterStatus === s ? `2px solid ${s === 'PAID' ? '#10b981' : s === 'UNPAID' ? '#f59e0b' : 'var(--accent-gold)'}` : '1px solid var(--border-color)',
                      backgroundColor: invFilterStatus === s ? (s === 'PAID' ? 'rgba(16,185,129,0.12)' : s === 'UNPAID' ? 'rgba(245,158,11,0.12)' : 'rgba(212,175,55,0.12)') : 'transparent',
                      color: invFilterStatus === s ? (s === 'PAID' ? '#10b981' : s === 'UNPAID' ? '#f59e0b' : 'var(--accent-gold)') : 'var(--text-muted)'
                    }}>{s}</button>
                  ))}
                </div>
                {/* Clear */}
                {(invSearch || invFilterFrom || invFilterTo || invFilterStatus !== 'ALL') && (
                  <button onClick={() => { setInvSearch(''); setInvFilterFrom(''); setInvFilterTo(''); setInvFilterStatus('ALL'); }} style={{ padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}>✕ Clear</button>
                )}
              </div>

              {/* Invoice list */}
              {filtered.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <Receipt size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                  <div style={{ fontWeight: 600 }}>No invoices match your filters</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Try adjusting the date range or status filter</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {filtered.map(inv => (
                    <div key={inv.id} style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem' }}>

                        {/* Customer + ID */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#d4af37,#f3cf55)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '1rem', flexShrink: 0 }}>
                            {inv.customer.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{inv.customer}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, marginTop: 1 }}>{inv.id}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 1 }}>{inv.phone}</div>
                          </div>
                        </div>

                        {/* Service + Date */}
                        <div>
                          <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', fontWeight: 500, marginBottom: 2 }}>{inv.service}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        </div>

                        {/* Amount + Mode + Status */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent-gold)' }}>₹{inv.amount.toLocaleString('en-IN')}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', backgroundColor: inv.mode === 'PENDING' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.12)', color: inv.mode === 'PENDING' ? '#f59e0b' : '#10b981', borderRadius: '5px', padding: '0.15rem 0.5rem', fontWeight: 600 }}>{inv.mode}</span>
                            <span style={{ fontSize: '0.72rem', backgroundColor: inv.status === 'PAID' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: inv.status === 'PAID' ? '#10b981' : '#ef4444', borderRadius: '5px', padding: '0.15rem 0.5rem', fontWeight: 700 }}>{inv.status}</span>
                            {inv.gst > 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '5px', padding: '0.12rem 0.4rem' }}>GST {inv.gst}%</span>}
                            {inv.discount > 0 && <span style={{ fontSize: '0.68rem', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', borderRadius: '5px', padding: '0.12rem 0.4rem' }}>{inv.discount}% off</span>}
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button
                            onClick={() => setReceiptInvoice(inv)}
                            style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1.5px solid var(--accent-gold)', backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <Receipt size={14} /> Receipt
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Placeholder for remaining tabs */}
        {['reports', 'settings'].includes(activeTab) && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '3rem', textAlign: 'center' }}>
            <Sparkles size={48} color="var(--accent-gold)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize', marginBottom: '0.5rem' }}>
              {activeTab.replace('-', ' ')} Module Active
            </h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 1.5rem auto', fontSize: '0.875rem' }}>
              Live data connection to Duke & Duchess MongoDB Billing Backend for {activeTab}.
            </p>
            <button onClick={() => setActiveTab('dashboard')} style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--accent-gold)', border: '1px solid var(--accent-gold)', padding: '0.5rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}>
              ← Back to Dashboard
            </button>
          </div>
        )}
      </main>

      {/* ── RECEIPT MODAL ── */}
      {receiptInvoice && (() => {
        const inv = receiptInvoice;
        const baseAmt     = inv.amount;
        const discountAmt = inv.discount > 0 ? Math.round((baseAmt * inv.discount) / 100) : 0;
        const afterDisc   = baseAmt - discountAmt;
        const gstAmt      = inv.gst > 0 ? Math.round((afterDisc * inv.gst) / 100) : 0;
        const grandTotal  = afterDisc + gstAmt;
        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }} onClick={() => setReceiptInvoice(null)}>
            <div style={{ backgroundColor: '#fff', borderRadius: '16px', width: '420px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
              {/* Receipt Header */}
              <div style={{ background: 'linear-gradient(135deg,#1a1a1a,#2d2d2d)', padding: '1.5rem', borderRadius: '16px 16px 0 0', textAlign: 'center', position: 'relative' }}>
                <button onClick={() => setReceiptInvoice(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: '1.2rem' }}>✕</button>
                <img src="/logo.png" alt="Duke & Duchess" style={{ width: 86, height: 86, objectFit: 'contain', background: '#fff', borderRadius: '14px', padding: '4px', margin: '0 auto 0.75rem', display: 'block', boxShadow: '0 4px 16px rgba(212,175,55,0.4)' }} />
                <div style={{ fontWeight: 800, color: '#fff', fontSize: '1.1rem', letterSpacing: '0.5px' }}>NEW DUKE & DUCHESS</div>
                <div style={{ color: '#d4af37', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '1px', marginTop: 2 }}>OFFICIAL RECEIPT</div>
              </div>

              {/* Receipt Body */}
              <div style={{ padding: '1.5rem', color: '#1a1a1a' }}>
                {/* Invoice meta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '2px dashed #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice No.</div>
                    <div style={{ fontWeight: 800, color: '#d4af37', fontSize: '1rem', marginTop: 2 }}>{inv.id}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</div>
                    <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '0.9rem', marginTop: 2 }}>
                      {new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Customer info */}
                <div style={{ backgroundColor: '#f9fafb', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.4rem' }}>Bill To</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>{inv.customer}</div>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 2 }}>{inv.phone}</div>
                </div>

                {/* Service row */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ textAlign: 'left', fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', paddingBottom: '0.4rem' }}>Service / Product</th>
                      <th style={{ textAlign: 'right', fontSize: '0.68rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', paddingBottom: '0.4rem' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.75rem 0', fontSize: '0.9rem', color: '#111827', fontWeight: 500 }}>{inv.service}</td>
                      <td style={{ padding: '0.75rem 0', textAlign: 'right', fontWeight: 700, color: '#111827' }}>₹{baseAmt.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Calculations */}
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                  {inv.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#10b981', marginBottom: '0.4rem' }}>
                      <span>Discount ({inv.discount}%)</span>
                      <span>− ₹{discountAmt.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {inv.gst > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', color: '#3b82f6', marginBottom: '0.4rem' }}>
                      <span>GST ({inv.gst}%)</span>
                      <span>+ ₹{gstAmt.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '2px solid #111827' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: '#111827' }}>GRAND TOTAL</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d4af37' }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Payment info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', backgroundColor: inv.status === 'PAID' ? '#ecfdf5' : '#fff7ed', borderRadius: '8px', padding: '0.65rem 1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Mode</div>
                    <div style={{ fontWeight: 700, color: '#111827', marginTop: 2 }}>{inv.mode}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
                    <div style={{ fontWeight: 800, marginTop: 2, color: inv.status === 'PAID' ? '#10b981' : '#f59e0b', fontSize: '0.9rem' }}>
                      {inv.status === 'PAID' ? '✓ PAID' : '⏳ PENDING'}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed #e5e7eb' }}>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Thank you for visiting <strong>New Duke & Duchess</strong></div>
                  <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: 4 }}>This is a computer-generated receipt</div>
                </div>

                {/* Print button */}
                <button
                  onClick={() => { if (typeof window !== 'undefined') window.print(); }}
                  style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#d4af37,#f3cf55)', color: '#000', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Printer size={18} /> Print Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Add Service Modal ── */}
      {showAddService && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '2rem', width: '480px', position: 'relative' }}>
            <button onClick={() => setShowAddService(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>➕ Add New Service</h3>
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Gender Section</label>
              <select value={svcGender} onChange={e => setSvcGender(e.target.value as 'MEN' | 'WOMEN')} style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                <option value="MEN">♂ MEN</option>
                <option value="WOMEN">♀ WOMEN</option>
              </select>
            </div>
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Category / Section Name</label>
              <input list="section-suggestions" value={svcSection} onChange={e => setSvcSection(e.target.value)} placeholder="e.g. MEN HAIR SPA (or type new)" style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              <datalist id="section-suggestions">
                {(svcGender === 'MEN' ? menSections : womenSections).map(s => <option key={s.section} value={s.section} />)}
              </datalist>
            </div>
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Service Name</label>
              <input value={svcName} onChange={e => setSvcName(e.target.value)} placeholder="e.g. Deep Conditioning Spa" style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Price (₹)</label>
              <input type="number" value={svcPrice} onChange={e => setSvcPrice(e.target.value)} placeholder="e.g. 1499" style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddService(false)} style={{ padding: '0.5rem 1rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddService} style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Add Service</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Product Modal ── */}
      {showAddProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '2rem', width: '420px', position: 'relative' }}>
            <button onClick={() => setShowAddProduct(false)} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1.25rem' }}>📦 Add New Product</h3>
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Product Name</label>
              <input value={prdName} onChange={e => setPrdName(e.target.value)} placeholder="e.g. Wella Professionals" style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }} />
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Price (₹)</label>
              <input type="number" value={prdPrice} onChange={e => setPrdPrice(e.target.value)} placeholder="e.g. 999" style={{ width: '100%', padding: '0.5rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>ID will be auto-assigned as SER-{172 + productItems.length}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddProduct(false)} style={{ padding: '0.5rem 1rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddProduct} style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', border: 'none', backgroundColor: 'var(--accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>Add Product</button>
            </div>
          </div>
        </div>
      )}

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
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '2rem', width: '450px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>Create Quick Invoice</h3>
            <form onSubmit={handleCreateInvoice}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ananya Sharma"
                  value={invCustomer}
                  onChange={(e) => setInvCustomer(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Service / Product</label>
                <select
                  value={invService}
                  onChange={(e) => {
                    setInvService(e.target.value);
                    // Auto-fill price from catalogue
                    const allItems = [
                      ...menSections.flatMap(s => s.items),
                      ...womenSections.flatMap(s => s.items),
                      ...productItems,
                    ];
                    const found = allItems.find(x => x.name === e.target.value);
                    if (found) setInvAmount(String(found.price));
                  }}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                >
                  <optgroup label="── MEN ──">
                    {menSections.flatMap(s => s.items).map(item => (
                      <option key={item.id} value={item.name}>{item.name} – ₹{item.price.toLocaleString('en-IN')}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── WOMEN ──">
                    {womenSections.flatMap(s => s.items).map(item => (
                      <option key={item.id} value={item.name}>{item.name} – ₹{item.price.toLocaleString('en-IN')}</option>
                    ))}
                  </optgroup>
                  <optgroup label="── PRODUCTS ──">
                    {productItems.map(item => (
                      <option key={item.id} value={item.name}>{item.name} – ₹{item.price.toLocaleString('en-IN')}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Amount (₹)</label>
                <input
                  type="number"
                  value={invAmount}
                  onChange={(e) => setInvAmount(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Payment Method</label>
                <select
                  value={invPayMode}
                  onChange={(e) => setInvPayMode(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
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
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--accent-gold)', color: '#000', fontWeight: 600, cursor: 'pointer' }}
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
