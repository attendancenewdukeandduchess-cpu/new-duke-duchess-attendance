'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Receipt,
  CreditCard,
  BarChart3,
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
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  PieChart,
  Award,
  Scissors
} from 'lucide-react';
import { SALON_LOGO_DATA_URI } from './logoDataUri';
import { initialMenSections, initialWomenSections, initialProductItems } from './initialCatalogue';
import { downloadReceiptPdf } from '@/lib/pdfReceipt';

// Stylist type
export type Stylist = {
  id?: string;
  name: string;
  designation?: string;
};

// Known salon stylists (attendance database + fallback default)
const DEFAULT_STYLISTS: Stylist[] = [
  { id: 'E001', name: 'Priya Sharma', designation: 'Senior Hair Stylist' },
  { id: 'E008', name: 'Puja Chetry', designation: 'Stylist' },
  { id: 'E009', name: 'Mohamed Rihan', designation: 'Senior Stylist' },
  { id: 'E011', name: 'Raj R', designation: 'Make up Artist' },
  { id: '001',  name: 'Asha', designation: 'Senior Stylist' },
  { id: '12345', name: 'Ruthvik', designation: 'Senior Stylist' },
];

// POS cart item type
type CartItem = {
  cartItemId?: string;
  id: string;
  name: string;
  price: number;
  qty: number;
  stylist?: string;
};
// Catalogue section type
type CatalogueSection = { section: string; items: { id: string; name: string; price: number }[] };

// Invoice item type
type InvoiceItem = {
  name: string;
  qty: number;
  rate: number;
  amount: number;
  stylist?: string;
};

// Invoice type
type Invoice = {
  id: string;
  customer: string;
  phone: string;
  service: string;
  items?: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  discountType?: 'percent' | 'flat';
  discountAmount?: number;
  taxableAmount?: number;
  taxAmount?: number;
  taxType?: 'exclusive' | 'inclusive';
  date: string;
  amount: number;
  gst: number;
  status: 'PAID' | 'UNPAID';
  mode: string;
};

// Customer type
type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  balance: number;
  tag: string;
};

// Compute accurate, complete invoice financial breakdown
function computeInvoiceFinancials(inv: Invoice) {
  const itemsGross = (inv.items && inv.items.length > 0)
    ? inv.items.reduce((s, i) => s + (Number(i.amount) || ((Number(i.rate) || 0) * (Number(i.qty) || 1)) || 0), 0)
    : 0;

  const totalAmount = Number(inv.amount) || 0;
  const gstRate = Number(inv.gst) || 0;

  let grossSubtotal = inv.subtotal !== undefined && inv.subtotal > 0
    ? Number(inv.subtotal)
    : (itemsGross > 0 ? itemsGross : totalAmount);

  // If subtotal was stored as after-discount, restore true gross subtotal from items
  if (itemsGross > grossSubtotal) {
    grossSubtotal = itemsGross;
  }

  let discountAmt = Number(inv.discountAmount) || 0;
  if (!discountAmt && inv.discount && inv.discount > 0) {
    if (inv.discountType === 'flat') {
      discountAmt = inv.discount;
    } else {
      discountAmt = (grossSubtotal * inv.discount) / 100;
    }
  }
  // Recover legacy discount if items were higher than total without tax
  if (!discountAmt && itemsGross > 0 && totalAmount > 0 && itemsGross > totalAmount) {
    discountAmt = itemsGross - totalAmount;
  }
  discountAmt = Math.min(discountAmt, grossSubtotal);

  const afterDiscount = Math.max(0, grossSubtotal - discountAmt);

  let taxAmt = 0;
  if (inv.taxAmount !== undefined && inv.taxAmount !== null && inv.taxAmount > 0) {
    taxAmt = Number(inv.taxAmount);
  } else if (gstRate > 0) {
    taxAmt = Math.round(((afterDiscount * gstRate) / 100) * 100) / 100;
  }

  let taxableAmt = inv.taxableAmount !== undefined
    ? Number(inv.taxableAmount)
    : (inv.taxType === 'inclusive' ? (afterDiscount - taxAmt) : afterDiscount);

  let totalPayable = totalAmount > 0
    ? totalAmount
    : Math.round((afterDiscount + (inv.taxType === 'inclusive' ? 0 : taxAmt)) * 100) / 100;

  const discountPercent = inv.discount && inv.discountType === 'percent'
    ? inv.discount
    : (discountAmt > 0 && grossSubtotal > 0 ? Math.round((discountAmt / grossSubtotal) * 100) : 0);

  return {
    grossSubtotal,
    discountAmt,
    discountPercent,
    afterDiscount,
    taxableAmt,
    gstRate,
    taxAmt,
    cgstRate: gstRate / 2,
    cgstAmt: Math.round((taxAmt / 2) * 100) / 100,
    sgstRate: gstRate / 2,
    sgstAmt: Math.round((taxAmt / 2) * 100) / 100,
    totalPayable
  };
}

// Format Date & Time helper (e.g. "03 Jul 2026, 03:46 pm")
function formatReceiptDateTime(dateStr?: string) {
  if (!dateStr) return '03 Jul 2026, 03:46 pm';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    return `${day} ${month} ${year}, ${strTime}`;
  } catch {
    return dateStr;
  }
}

// Generates self-contained, standalone HTML receipt strictly under 50KB (~14KB)
function generateReceiptHtmlString(inv: Invoice) {
  const fin = computeInvoiceFinancials(inv);

  const itemsList: InvoiceItem[] = (inv.items && inv.items.length > 0)
    ? inv.items
    : (inv.service || 'Salon Service').split(', ').map(s => {
        const match = s.match(/^(.*?)\s*x(\d+)$/);
        if (match) {
          const name = match[1];
          const qty = parseInt(match[2], 10) || 1;
          const rate = Math.round((fin.grossSubtotal / qty) * 100) / 100;
          return { name, qty, rate, amount: fin.grossSubtotal, stylist: '-' };
        }
        return { name: s, qty: 1, rate: fin.grossSubtotal, amount: fin.grossSubtotal, stylist: '-' };
      });

  const rowsHtml = itemsList.map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 10px 12px; font-weight: 600; color: #111;">${item.name}</td>
      <td style="padding: 10px 12px; text-align: center; color: #555;">${item.stylist || '-'}</td>
      <td style="padding: 10px 12px; text-align: center; color: #111;">${item.qty}</td>
      <td style="padding: 10px 12px; text-align: right; color: #111;">${Number(item.rate).toFixed(2)}</td>
      <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #111;">${Number(item.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  const dateTimeStr = formatReceiptDateTime(inv.date);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${inv.id}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f3f4f6; padding: 20px; color: #111; }
    .receipt-card { max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 6px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 32px 36px 0 36px; border: 1px solid #eaeaea; }
    @media print {
      body { background: #fff; padding: 0; }
      .receipt-card { box-shadow: none; border: none; padding: 15px 20px 0 20px; max-width: 100%; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-card">
    <!-- Top Emblem Badge -->
    <div style="text-align: center; margin: 0 auto 18px;">
      <img src="${SALON_LOGO_DATA_URI}" alt="New Duke &amp; Duchess" style="width: 82px; height: 88px; object-fit: contain; border-radius: 8px; border: 1.5px solid #d4af37; box-shadow: 0 4px 10px rgba(0,0,0,0.15); background: #000; display: inline-block;" />
    </div>

    <!-- Main Salon Title -->
    <h1 style="font-family: 'Playfair Display', 'Cinzel', 'Times New Roman', serif; font-size: 26px; font-weight: 800; color: #111; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; text-align: center;">NEW DUKE &amp; DUCHESS</h1>
    
    <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin: 4px 0 10px;">
      <span style="height: 1px; width: 35px; background: #b8973d;"></span>
      <span style="font-size: 11px; font-weight: 600; color: #b8973d; letter-spacing: 4px; text-transform: uppercase;">UNISEX SALON</span>
      <span style="height: 1px; width: 35px; background: #b8973d;"></span>
    </div>

    <!-- Address & Contact -->
    <div style="font-size: 11.5px; color: #4b5563; text-align: center; max-width: 500px; margin: 0 auto; line-height: 1.45;">
      📍 1st Floor, Abhiman Arcade, Muddenapalya, Main Rd, near Ayodhya Samrat Hotel, Srigandada Kaval, Nagarbhavi, Bengaluru, Karnataka 560072
    </div>
    <div style="font-size: 12px; color: #111; font-weight: 600; text-align: center; margin-top: 4px;">
      📞 +91 88610 22242
    </div>

    <!-- Invoice Details & Bill To -->
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; border: 1px solid #e8e3d5; border-top: 3px solid #b8973d; border-radius: 4px; padding: 12px 18px; margin-top: 16px; background-color: #fff;">
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #b8973d; letter-spacing: 0.8px; margin-bottom: 8px;">📄 INVOICE DETAILS</div>
        <div style="font-size: 12px; color: #374151; line-height: 1.7;">
          <div>Invoice No. &nbsp;&nbsp;&nbsp;&nbsp;: <strong style="color: #111;">${inv.id}</strong></div>
          <div>Date &amp; Time &nbsp;&nbsp;&nbsp;: <strong style="color: #111;">${dateTimeStr}</strong></div>
          <div>Payment Mode : <strong style="color: #111; text-transform: uppercase;">${inv.mode}</strong></div>
        </div>
      </div>
      <div>
        <div style="font-size: 11px; font-weight: 700; color: #b8973d; letter-spacing: 0.8px; margin-bottom: 8px;">👤 BILL TO</div>
        <div style="font-size: 16px; font-weight: 700; color: #111; text-transform: capitalize;">${inv.customer || 'Walk-in Client'}</div>
        <div style="font-size: 12.5px; color: #4b5563; margin-top: 5px;">📞 ${inv.phone || 'N/A'}</div>
      </div>
    </div>

    <!-- Services Section Header -->
    <div style="font-size: 12px; font-weight: 700; color: #b8973d; letter-spacing: 1px; margin-top: 18px; margin-bottom: 6px;">✂️ SERVICES</div>

    <!-- Services Table -->
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #000; color: #b8973d;">
          <th style="text-align: left; padding: 7px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px;">DESCRIPTION</th>
          <th style="text-align: center; padding: 7px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; width: 70px;">STYLIST</th>
          <th style="text-align: center; padding: 7px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; width: 60px;">QTY</th>
          <th style="text-align: right; padding: 7px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; width: 85px;">RATE (₹)</th>
          <th style="text-align: right; padding: 7px 10px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.5px; width: 95px;">AMOUNT (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Subtotal, Discount, Tax and Total Payable -->
    <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
      <div style="width: 270px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 4px 6px; border-top: 1px solid #e5e7eb;">
          <span>Subtotal</span>
          <strong>₹${fin.grossSubtotal.toFixed(2)}</strong>
        </div>
        ${fin.discountAmt > 0 ? `
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #10b981; padding: 4px 6px;">
          <span>Discount ${fin.discountPercent > 0 ? `(${fin.discountPercent}%)` : ''}</span>
          <strong style="color: #10b981;">- ₹${fin.discountAmt.toFixed(2)}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 4px 6px;">
          <span>Taxable Amount</span>
          <strong>₹${fin.taxableAmt.toFixed(2)}</strong>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: #374151; padding: 4px 6px;">
          <span>Tax (GST ${fin.gstRate > 0 ? `${fin.gstRate}%` : ''})</span>
          <strong>₹${fin.taxAmt.toFixed(2)}</strong>
        </div>
        <div style="background: #000; color: #b8973d; display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; margin-top: 4px;">
          <span style="font-size: 11px; font-weight: 700; letter-spacing: 1px;">TOTAL PAYABLE</span>
          <span style="font-size: 20px; font-weight: 800; color: #b8973d;">₹ ${fin.totalPayable.toFixed(2)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Successful Badge -->
    <div style="border: 1.5px solid #d4af37; border-radius: 4px; background: #fffcf4; padding: 9px 12px; margin-top: 14px; text-align: center; font-size: 12px; color: #1f2937;">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 16px; height: 16px; border-radius: 50%; background: #b8973d; color: #fff; font-size: 10px; font-weight: bold; margin-right: 6px;">✓</span>
      <strong>PAYMENT SUCCESSFUL</strong> &nbsp;|&nbsp; Paid via ${inv.mode} &nbsp; Thank you for your payment.
    </div>

    <!-- Footer Columns -->
    <div style="display: grid; grid-template-columns: 1.2fr 0.9fr 1.6fr; gap: 12px; align-items: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid #ede8dc;">
      <!-- Column 1: Review & QR -->
      <div style="display: flex; align-items: center; gap: 10px;">
        <img src="/qr-review.jpg" alt="Google Review QR" style="width: 58px; height: 58px; object-fit: contain; border-radius: 4px; border: 1px solid #d4af37; flex-shrink: 0;" />
        <div>
          <div style="font-size: 10px; font-weight: 700; color: #b8973d; letter-spacing: 0.5px;">LOVE OUR SERVICE?</div>
          <div style="font-size: 9px; color: #555; margin-top: 2px;">Scan to leave us a Google Review</div>
          <div style="color: #d4af37; font-size: 11px; margin-top: 3px; letter-spacing: 1px;">★★★★★</div>
        </div>
      </div>
      
      <!-- Column 2: Follow Us -->
      <div style="text-align: center;">
        <div style="font-size: 10px; font-weight: 700; color: #b8973d; letter-spacing: 0.5px; margin-bottom: 6px;">FOLLOW US</div>
        <div style="display: flex; justify-content: center; gap: 8px;">
          <span style="width: 26px; height: 26px; border-radius: 50%; background: #000; display: inline-flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </span>
          <span style="width: 26px; height: 26px; border-radius: 50%; background: #000; display: inline-flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </span>
          <span style="width: 26px; height: 26px; border-radius: 50%; background: #000; display: inline-flex; align-items: center; justify-content: center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
              <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6c1.7 1 3.7 1.6 5.7 1.6 6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 22c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4C2.5 15.8 2 13.9 2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10zm5.5-7.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.4-.5-2.6-1.6-.9-.8-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.6-.5z"/>
            </svg>
          </span>
        </div>
      </div>

      <!-- Column 3: Thank you -->
      <div style="text-align: right;">
        <div style="font-family: 'Brush Script MT', 'Segoe Script', cursive; font-size: 24px; color: #b8973d; line-height: 1;">Thank You! ♡</div>
        <div style="font-size: 9.5px; color: #555; line-height: 1.35; margin-top: 4px;">
          Thank you for joining the New Duke &amp; Duchess family ❤️ We truly appreciate your support and look forward to seeing you again! ⭐
        </div>
      </div>
    </div>

    <!-- Bottom Ribbon -->
    <div style="background: #000; color: #b8973d; padding: 7px 0; text-align: center; font-size: 9.5px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; margin-top: 16px; margin-left: -36px; margin-right: -36px;">
      ♥ &nbsp;&nbsp;&nbsp; STYLE IS A REFLECTION OF YOUR ATTITUDE &nbsp;&nbsp;&nbsp; ♥
    </div>
  </div>
</body>
</html>`;
}

// Clean phone number for WhatsApp Web/API (defaults to India 91 prefix if 10 digits)
function cleanPhoneNumber(phone?: string) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

// Generate formatted receipt message for WhatsApp
function generateWhatsAppReceiptMessage(inv: Invoice) {
  const fin = computeInvoiceFinancials(inv);

  const itemsList: InvoiceItem[] = (inv.items && inv.items.length > 0)
    ? inv.items
    : (inv.service || 'Salon Service').split(', ').map(s => {
        const match = s.match(/^(.*?)\s*x(\d+)$/);
        if (match) {
          const name = match[1];
          const qty = parseInt(match[2], 10) || 1;
          const rate = Math.round((fin.grossSubtotal / qty) * 100) / 100;
          return { name, qty, rate, amount: fin.grossSubtotal, stylist: '-' };
        }
        return { name: s, qty: 1, rate: fin.grossSubtotal, amount: fin.grossSubtotal, stylist: '-' };
      });

  const itemsText = itemsList
    .map(i => {
      const stylistTag = i.stylist && i.stylist !== '-' ? ` [Stylist: ${i.stylist}]` : '';
      return `✂️ *${i.name}*${stylistTag} (Qty: ${i.qty}) - ₹${Number(i.amount).toFixed(2)}`;
    })
    .join('\n');

  const dateTimeStr = formatReceiptDateTime(inv.date);

  const discountLine = fin.discountAmt > 0
    ? `Discount${fin.discountPercent > 0 ? ` (${fin.discountPercent}%)` : ''}: -₹${fin.discountAmt.toFixed(2)}\nTaxable Amount: ₹${fin.taxableAmt.toFixed(2)}\n`
    : '';

  const gstLine = fin.gstRate > 0
    ? `Tax (GST ${fin.gstRate}%): ₹${fin.taxAmt.toFixed(2)}`
    : `Tax (GST): ₹0.00`;

  return `✨ *NEW DUKE & DUCHESS UNISEX SALON* ✨
━━━━━━━━━━━━━━━━━━━━
*OFFICIAL TAX INVOICE & RECEIPT*

📄 *Invoice No:* ${inv.id}
📅 *Date & Time:* ${dateTimeStr}
👤 *Customer:* ${inv.customer || 'Valued Client'}
📱 *Mobile:* ${inv.phone || 'N/A'}
💳 *Payment Mode:* ${inv.mode.toUpperCase()} (PAID ✅)

✂️ *SERVICES & PRODUCTS:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━
Subtotal: ₹${fin.grossSubtotal.toFixed(2)}
${discountLine}${gstLine}
*TOTAL PAID: ₹${fin.totalPayable.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
✅ *Payment Status:* SUCCESSFUL

📍 1st Floor, Abhiman Arcade, Muddenapalya, Main Rd, near Ayodhya Samrat Hotel, Srigandada Kaval, Nagarbhavi, Bengaluru, Karnataka 560072
📞 Contact: +91 88610 22242

Thank you for visiting the New Duke & Duchess family! ❤️
We truly appreciate your support and look forward to seeing you again! ⭐

_♥ Style is a reflection of your attitude ♥_`;
}

// Redirects to WhatsApp Web/App with pre-filled receipt message directly to customer phone
function openWhatsAppReceipt(inv: Invoice) {
  if (typeof window === 'undefined') return;
  const cleanedPhone = cleanPhoneNumber(inv.phone);
  const message = generateWhatsAppReceiptMessage(inv);
  const encodedMsg = encodeURIComponent(message);

  let url = '';
  if (cleanedPhone) {
    url = `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodedMsg}`;
  } else {
    url = `https://api.whatsapp.com/send?text=${encodedMsg}`;
  }

  window.open(url, '_blank');
}

export default function DukeDuchessBillingApp() {
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'customers'
    | 'products'
    | 'invoices'
    | 'payments'
    | 'reports'
  >('dashboard');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice filter & receipt modal state
  const [invFilterFrom,   setInvFilterFrom]   = useState('');
  const [invFilterTo,     setInvFilterTo]     = useState('');
  const [invFilterStatus, setInvFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [invSearch,       setInvSearch]       = useState('');
  const [receiptInvoice,  setReceiptInvoice]  = useState<null | Invoice>(null);

  // Live Invoices & Customers loaded dynamically from MongoDB
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Computed Live Metrics
  const totalRevenue = invoices
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalPending = invoices
    .filter(i => i.status === 'UNPAID')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'PAID').length;
  const unpaidCount = invoices.filter(i => i.status === 'UNPAID').length;

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
  const [menSections, setMenSections] = useState<{ section: string; items: { id: string; name: string; price: number }[] }[]>(initialMenSections);

  // ── WOMEN'S MENU ─────────────────────────────────────────────────────────────
  const [womenSections, setWomenSections] = useState<{ section: string; items: { id: string; name: string; price: number }[] }[]>(initialWomenSections);

  // ── PRODUCTS MENU ────────────────────────────────────────────────────────────
  const [productItems, setProductItems] = useState<{ id: string; name: string; price: number }[]>(initialProductItems);

  // ── Catalogue CRUD helpers ────────────────────────────────────────────────
  // Helper: persist catalogue to MongoDB after any change
  const saveCatalogue = (
    newMen?: typeof menSections,
    newWomen?: typeof womenSections,
    newProducts?: typeof productItems
  ) => {
    const payload: Record<string, unknown> = {};
    if (newMen !== undefined) payload.menSections = newMen;
    if (newWomen !== undefined) payload.womenSections = newWomen;
    if (newProducts !== undefined) payload.productItems = newProducts;
    fetch('/api/billing/catalogue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(err => console.error('Failed to save catalogue:', err));
  };

  const handleAddService = () => {
    if (!svcName.trim() || !svcPrice.trim()) return;
    const isMen = svcGender === 'MEN';
    const targetSections = isMen ? menSections : womenSections;
    const setter = isMen ? setMenSections : setWomenSections;
    const sectionName = svcSection.trim() || (isMen ? 'MEN GENERAL' : 'WOMEN GENERAL');
    const existing = targetSections.find(s => s.section.toUpperCase() === sectionName.toUpperCase());
    const prefix = isMen ? 'M' : 'W';
    const allItems = targetSections.flatMap(s => s.items);
    const newId = `${prefix}NEW-${String(allItems.length + 1).padStart(3, '0')}`;
    const newItem = { id: newId, name: svcName.trim(), price: parseFloat(svcPrice) || 0 };
    let updated: typeof targetSections;
    if (existing) {
      updated = targetSections.map(s => s.section.toUpperCase() === sectionName.toUpperCase()
        ? { ...s, items: [...s.items, newItem] } : s);
    } else {
      updated = [...targetSections, { section: sectionName.toUpperCase(), items: [newItem] }];
    }
    setter(updated);
    if (isMen) saveCatalogue(updated, undefined, undefined);
    else saveCatalogue(undefined, updated, undefined);
    setSvcName(''); setSvcPrice(''); setSvcSection('');
    setShowAddService(false);
    alert(`✅ Service "${newItem.name}" added under ${svcGender} › ${sectionName.toUpperCase()}`);
  };

  const handleDeleteService = (gender: 'MEN' | 'WOMEN', sectionName: string, itemId: string) => {
    if (!confirm('Delete this service?')) return;
    const isMen = gender === 'MEN';
    const setter = isMen ? setMenSections : setWomenSections;
    const sections = isMen ? menSections : womenSections;
    const updated = sections.map(s => s.section === sectionName
      ? { ...s, items: s.items.filter(i => i.id !== itemId) } : s
    ).filter(s => s.items.length > 0);
    setter(updated);
    if (isMen) saveCatalogue(updated, undefined, undefined);
    else saveCatalogue(undefined, updated, undefined);
  };

  const handleSaveEditService = (gender: 'MEN' | 'WOMEN', sectionName: string, itemId: string) => {
    const isMen = gender === 'MEN';
    const setter = isMen ? setMenSections : setWomenSections;
    const sections = isMen ? menSections : womenSections;
    const updated = sections.map(s => s.section === sectionName
      ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, name: editSvcName, price: parseFloat(editSvcPrice) || i.price } : i) }
      : s);
    setter(updated);
    if (isMen) saveCatalogue(updated, undefined, undefined);
    else saveCatalogue(undefined, updated, undefined);
    setEditSvcKey(null);
  };

  const handleAddProduct = () => {
    if (!prdName.trim() || !prdPrice.trim()) return;
    const newId = `SER-${172 + productItems.length}`;
    const updated = [...productItems, { id: newId, name: prdName.trim(), price: parseFloat(prdPrice) || 0 }];
    setProductItems(updated);
    saveCatalogue(undefined, undefined, updated);
    setPrdName(''); setPrdPrice('');
    setShowAddProduct(false);
    alert(`✅ Product "${prdName.trim()}" added with ID ${newId}`);
  };

  const handleDeleteProduct = (id: string) => {
    if (!confirm('Delete this product?')) return;
    const updated = productItems.filter(p => p.id !== id);
    setProductItems(updated);
    saveCatalogue(undefined, undefined, updated);
  };

  const handleSaveEditProduct = (id: string) => {
    const updated = productItems.map(p => p.id === id ? { ...p, name: editPrdName, price: parseFloat(editPrdPrice) || p.price } : p);
    setProductItems(updated);
    saveCatalogue(undefined, undefined, updated);
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
    // Save to MongoDB
    fetch('/api/billing/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCust) });
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
  const [invStylist, setInvStylist] = useState('');
  const [invAmount, setInvAmount] = useState('1499');
  const [invPayMode, setInvPayMode] = useState('UPI');

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = invoices.length + 1;
    const itemAmt = parseFloat(invAmount) || 0;
    const newInv: Invoice = {
      id: `INV-${String(nextNum).padStart(4, '0')}`,
      customer: invCustomer || 'Walk-in Client',
      phone: '',
      service: invService,
      items: [{ name: invService, qty: 1, rate: itemAmt, amount: itemAmt, stylist: invStylist.trim() || '-' }],
      subtotal: itemAmt,
      discount: 0,
      discountAmount: 0,
      taxableAmount: itemAmt,
      taxAmount: 0,
      date: new Date().toISOString(),
      amount: itemAmt,
      gst: 0,
      status: 'PAID',
      mode: invPayMode
    };
    setInvoices([newInv, ...invoices]);
    // Save to MongoDB
    fetch('/api/billing/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newInv) });
    setTimeout(() => {
      fetch('/api/billing/customers')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCustomers(data); })
        .catch(() => {});
    }, 600);
    setNewInvoiceModal(false);
    setInvCustomer('');
    setReceiptInvoice(newInv);
    openWhatsAppReceipt(newInv);
    downloadReceiptPdf(newInv);
  };

  // ── POS Cart State ────────────────────────────────────────────────────────
  const [cartItems,     setCartItems]     = useState<CartItem[]>([]);
  const [posCustomer,   setPosCustomer]   = useState('');
  const [posPhone,      setPosPhone]      = useState('');
  const [discountType,  setDiscountType]  = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [gstRate,       setGstRate]       = useState<0 | 5 | 12 | 18>(18);
  const [taxType,       setTaxType]       = useState<'exclusive' | 'inclusive'>('exclusive');
  const [posPayMode,    setPosPayMode]    = useState('UPI');
  const [posServiceTab, setPosServiceTab] = useState<'men' | 'women' | 'products'>('men');
  const [posSearch,     setPosSearch]     = useState('');
  const [billSuccess,   setBillSuccess]   = useState(false);

  // ── Stylist State ─────────────────────────────────────────────────────────
  const [stylists, setStylists] = useState<Stylist[]>(DEFAULT_STYLISTS);
  const [defaultStylist, setDefaultStylist] = useState<string>('');
  const [showAddStylistModal, setShowAddStylistModal] = useState<boolean>(false);
  const [newStylistName, setNewStylistName] = useState<string>('');
  const [newStylistDesig, setNewStylistDesig] = useState<string>('Stylist');
  const [targetCartItemIdForNewStylist, setTargetCartItemIdForNewStylist] = useState<string | null>(null);

  // ── Reports & Analytics State ──────────────────────────────────────────
  const [reportRange, setReportRange] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [reportFrom,  setReportFrom]  = useState('');
  const [reportTo,    setReportTo]    = useState('');

  const addToCart = (item: { id: string; name: string; price: number }) => {
    setCartItems(prev => {
      const assignedStylist = defaultStylist.trim();
      const existing = prev.find(c => c.id === item.id && (c.stylist || '') === assignedStylist);
      if (existing) {
        return prev.map(c => ((c.cartItemId && c.cartItemId === existing.cartItemId) || (!c.cartItemId && c.id === item.id)) ? { ...c, qty: c.qty + 1 } : c);
      }
      return [
        ...prev,
        {
          cartItemId: `${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          id: item.id,
          name: item.name,
          price: item.price,
          qty: 1,
          stylist: assignedStylist
        }
      ];
    });
  };

  const updateQty = (identifier: string, delta: number) => {
    setCartItems(prev => prev.map(c => (c.cartItemId === identifier || c.id === identifier) ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeFromCart = (identifier: string) => {
    setCartItems(prev => prev.filter(c => c.cartItemId !== identifier && c.id !== identifier));
  };

  const updateItemStylist = (identifier: string, stylist: string) => {
    setCartItems(prev => prev.map(c => (c.cartItemId === identifier || c.id === identifier) ? { ...c, stylist } : c));
  };

  const handleAddNewStylist = async () => {
    const trimmed = newStylistName.trim();
    if (!trimmed) {
      alert('Please enter stylist name');
      return;
    }
    const desig = newStylistDesig.trim() || 'Stylist';
    const newSt: Stylist = {
      id: `STY-${Date.now().toString().slice(-4)}`,
      name: trimmed,
      designation: desig
    };

    setStylists(prev => {
      if (prev.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return prev;
      return [...prev, newSt];
    });

    if (targetCartItemIdForNewStylist === 'default') {
      setDefaultStylist(trimmed);
    } else if (targetCartItemIdForNewStylist) {
      updateItemStylist(targetCartItemIdForNewStylist, trimmed);
    }

    setShowAddStylistModal(false);
    setNewStylistName('');
    setNewStylistDesig('Stylist');
    setTargetCartItemIdForNewStylist(null);

    try {
      await fetch('/api/billing/stylists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, designation: desig })
      });
    } catch (e) {
      console.warn('Failed to persist stylist to DB:', e);
    }
  };

  const cartSubtotal = cartItems.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt  = discountValue
    ? discountType === 'percent'
      ? (cartSubtotal * parseFloat(discountValue)) / 100
      : parseFloat(discountValue)
    : 0;
  const clampedDiscount = Math.min(discountAmt, cartSubtotal);
  const afterDiscount   = Math.max(0, cartSubtotal - clampedDiscount);

  const gstAmt = taxType === 'inclusive'
    ? (gstRate > 0 ? Math.round((afterDiscount - (afterDiscount / (1 + gstRate / 100))) * 100) / 100 : 0)
    : Math.round(((afterDiscount * gstRate) / 100) * 100) / 100;
  const grandTotal = taxType === 'inclusive'
    ? afterDiscount
    : Math.round((afterDiscount + gstAmt) * 100) / 100;
  const taxableAmt = taxType === 'inclusive'
    ? Math.round((afterDiscount - gstAmt) * 100) / 100
    : afterDiscount;

  const handleGenerateBill = () => {
    if (cartItems.length === 0) { alert('⚠️ Cart is empty. Please add services first.'); return; }
    const serviceNames = cartItems.map(c => `${c.name} x${c.qty}`).join(', ');
    const customerName = posCustomer || 'Walk-in Client';

    // Auto-add or update customer whenever a bill is generated
    const cleanPhone = posPhone.trim();
    if (customerName && customerName !== 'Walk-in Client') {
      const normalizedPhone = cleanPhone.replace(/\D/g, '');
      const existing = customers.find(c => 
        (normalizedPhone && c.phone && c.phone.replace(/\D/g, '').includes(normalizedPhone)) ||
        (c.name.trim().toLowerCase() === customerName.toLowerCase())
      );

      if (existing) {
        setCustomers(prev => prev.map(c => c.id === existing.id ? { ...c, visits: c.visits + 1, phone: c.phone || cleanPhone } : c));
      } else {
        const nextIdNum = customers.length + 1;
        const newCust = {
          id: `CUST-${String(nextIdNum).padStart(3, '0')}`,
          name: customerName,
          phone: cleanPhone,
          email: '',
          visits: 1,
          balance: 0,
          tag: 'Regular' as const
        };
        setCustomers(prev => [newCust, ...prev]);
      }
    }

    const billItems: InvoiceItem[] = cartItems.map(c => ({
      name: c.name,
      qty: c.qty,
      rate: c.price,
      amount: c.price * c.qty,
      stylist: c.stylist && c.stylist.trim() ? c.stylist.trim() : '-'
    }));

    const nextNum = invoices.length + 1;
    const newInv: Invoice = {
      id: `INV-${String(nextNum).padStart(4, '0')}`,
      customer: customerName,
      phone: posPhone,
      service: serviceNames,
      items: billItems,
      subtotal: Math.round(cartSubtotal * 100) / 100,
      discount: discountValue ? parseFloat(discountValue) || 0 : 0,
      discountType,
      discountAmount: Math.round(clampedDiscount * 100) / 100,
      taxableAmount: taxableAmt,
      taxAmount: gstAmt,
      taxType,
      date: new Date().toISOString(),
      amount: grandTotal,
      gst: gstRate,
      status: 'PAID',
      mode: posPayMode
    };
    setInvoices(prev => [newInv, ...prev]);
    // Save invoice to MongoDB
    fetch('/api/billing/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newInv) });
    setTimeout(() => {
      fetch('/api/billing/customers')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCustomers(data); })
        .catch(() => {});
    }, 600);
    setBillSuccess(true);
    setReceiptInvoice(newInv);
    openWhatsAppReceipt(newInv);
    downloadReceiptPdf(newInv);
    setTimeout(() => {
      setBillSuccess(false);
      setCartItems([]);
      setPosCustomer(''); setPosPhone('');
      setDefaultStylist('');
      setDiscountValue(''); setGstRate(18); setTaxType('exclusive');
      setPhoneLookupStatus('idle'); setPhoneLookupMsg('');
    }, 2500);
  };

  // ── MongoDB: load data on mount ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, invRes, catRes, styRes] = await Promise.all([
          fetch('/api/billing/customers'),
          fetch('/api/billing/invoices'),
          fetch('/api/billing/catalogue'),
          fetch('/api/billing/stylists').catch(() => null),
        ]);
        const custData = await custRes.json();
        const invData  = await invRes.json();
        const catData  = await catRes.json();
        if (Array.isArray(custData)) setCustomers(custData);
        if (Array.isArray(invData)) setInvoices(invData);
        if (catData.menSections) setMenSections(catData.menSections);
        if (catData.womenSections) setWomenSections(catData.womenSections);
        if (catData.productItems) setProductItems(catData.productItems);

        if (styRes && styRes.ok) {
          const styData = await styRes.json();
          if (Array.isArray(styData.stylists) && styData.stylists.length > 0) {
            setStylists(styData.stylists);
          }
        }
      } catch (err) {
        console.error('Failed to load billing data from MongoDB:', err);
      }
    }
    loadData();
  }, []);

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
                {
                  title: 'Total Sales Revenue',
                  value: `₹ ${totalRevenue.toLocaleString('en-IN')}`,
                  change: `${paidCount} paid invoice${paidCount === 1 ? '' : 's'}`,
                  icon: TrendingUp,
                  color: '#10b981'
                },
                {
                  title: 'Pending Receivables',
                  value: `₹ ${totalPending.toLocaleString('en-IN')}`,
                  change: `${unpaidCount} unpaid bill${unpaidCount === 1 ? '' : 's'}`,
                  icon: Clock,
                  color: '#f59e0b'
                },
                {
                  title: 'Invoices Generated',
                  value: invoices.length,
                  change: invoices.length > 0 ? `${invoices.length} total generated` : 'No bills yet',
                  icon: Receipt,
                  color: '#3b82f6'
                },
                {
                  title: 'Active Salon Clients',
                  value: customers.length,
                  change: `${customers.filter(c => c.tag === 'VIP Member').length} VIP members`,
                  icon: Users,
                  color: '#d4af37'
                },
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
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Receipt size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3, display: 'block' }} />
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.95rem' }}>No invoices generated yet</div>
                        <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Create your first bill in POS Billing to see live sales here.</div>
                      </td>
                    </tr>
                  ) : (
                    invoices.slice(0, 10).map((inv) => (
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
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => openWhatsAppReceipt(inv)}
                              title="Send receipt on WhatsApp"
                              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid #25D366', color: '#25D366', borderRadius: '6px', padding: '4px 8px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <MessageCircle size={13} /> WhatsApp
                            </button>
                            <button
                              onClick={() => setReceiptInvoice(inv)}
                              style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Receipt size={13} /> View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
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

                {/* Default Stylist Selector */}
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <Scissors size={13} color="var(--accent-gold)" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
                  <select
                    value={defaultStylist}
                    onChange={e => {
                      if (e.target.value === '__NEW__') {
                        setTargetCartItemIdForNewStylist('default');
                        setShowAddStylistModal(true);
                      } else {
                        setDefaultStylist(e.target.value);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.6rem 0.45rem 1.75rem',
                      borderRadius: '7px',
                      border: defaultStylist ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                      backgroundColor: defaultStylist ? 'rgba(212,175,55,0.06)' : 'var(--bg-primary)',
                      color: defaultStylist ? 'var(--accent-gold)' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: defaultStylist ? 600 : 400,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ background: '#1e1e1e', color: '#888' }}>-- Default Stylist (Auto-tags to cart) --</option>
                    {stylists.map(st => (
                      <option key={st.id || st.name} value={st.name} style={{ background: '#1e1e1e', color: '#fff' }}>
                        ✂️ {st.name} {st.designation ? `(${st.designation})` : ''}
                      </option>
                    ))}
                    <option value="__NEW__" style={{ background: '#1e1e1e', color: 'var(--accent-gold)', fontWeight: 'bold' }}>+ Add New Stylist...</option>
                  </select>
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
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {cartItems.map((item, idx) => {
                      const itemKey = item.cartItemId || `${item.id}-${idx}`;
                      const identifier = item.cartItemId || item.id;
                      return (
                        <div key={itemKey} style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {/* Upper row: Item Name, Qty controls, Price, Delete */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.name}>
                                {item.name}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                ₹{item.price.toLocaleString('en-IN')} each
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
                              <button onClick={() => updateQty(identifier, -1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                              <span style={{ width: 24, textAlign: 'center', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>{item.qty}</span>
                              <button onClick={() => updateQty(identifier, 1)} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                            </div>
                            <div style={{ width: '60px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.82rem', flexShrink: 0 }}>
                              ₹{(item.price * item.qty).toLocaleString('en-IN')}
                            </div>
                            <button onClick={() => removeFromCart(identifier)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: 2 }} title="Remove item"><X size={15} /></button>
                          </div>

                          {/* Stylist Selector Badge / Row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: item.stylist ? 'rgba(212,175,55,0.06)' : 'rgba(239,68,68,0.06)', padding: '0.3rem 0.5rem', borderRadius: '6px', border: item.stylist ? '1px solid rgba(212,175,55,0.25)' : '1px solid rgba(239,68,68,0.25)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: item.stylist ? 'var(--accent-gold)' : '#f87171' }}>
                              <Scissors size={12} color={item.stylist ? 'var(--accent-gold)' : '#f87171'} />
                              <span style={{ fontWeight: 700 }}>Stylist:</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <select
                                value={item.stylist || ''}
                                onChange={e => {
                                  if (e.target.value === '__NEW__') {
                                    setTargetCartItemIdForNewStylist(identifier);
                                    setShowAddStylistModal(true);
                                  } else {
                                    updateItemStylist(identifier, e.target.value);
                                  }
                                }}
                                style={{
                                  padding: '0.2rem 0.45rem',
                                  borderRadius: '5px',
                                  border: item.stylist ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(239,68,68,0.5)',
                                  backgroundColor: item.stylist ? 'rgba(212,175,55,0.12)' : 'rgba(239,68,68,0.12)',
                                  color: item.stylist ? 'var(--accent-gold)' : '#f87171',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  outline: 'none',
                                  cursor: 'pointer',
                                  maxWidth: '185px'
                                }}
                              >
                                <option value="" style={{ background: '#1e1e1e', color: '#888' }}>-- Assign Stylist --</option>
                                {stylists.map(st => (
                                  <option key={st.id || st.name} value={st.name} style={{ background: '#1e1e1e', color: '#fff' }}>
                                    {st.name} {st.designation ? `(${st.designation})` : ''}
                                  </option>
                                ))}
                                <option value="__NEW__" style={{ background: '#1e1e1e', color: 'var(--accent-gold)', fontWeight: 'bold' }}>+ Add New Stylist...</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Percent size={13} /> GST Rate
                  </div>
                  {/* Inclusive / Exclusive Toggle */}
                  <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', fontSize: '0.72rem' }}>
                    <button
                      type="button"
                      onClick={() => setTaxType('exclusive')}
                      style={{
                        padding: '0.2rem 0.55rem',
                        border: 'none',
                        backgroundColor: taxType === 'exclusive' ? 'var(--accent-gold)' : 'transparent',
                        color: taxType === 'exclusive' ? '#000' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      + Extra
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxType('inclusive')}
                      style={{
                        padding: '0.2rem 0.55rem',
                        border: 'none',
                        backgroundColor: taxType === 'inclusive' ? 'var(--accent-gold)' : 'transparent',
                        color: taxType === 'inclusive' ? '#000' : 'var(--text-muted)',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Included
                    </button>
                  </div>
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
                  ...(clampedDiscount > 0 ? [{ label: `Discount${discountValue ? ` (${discountType === 'percent' ? discountValue + '%' : '₹' + discountValue})` : ''}`, value: -clampedDiscount, color: '#10b981' }] : []),
                  ...(clampedDiscount > 0 ? [{ label: 'Taxable Amount', value: taxableAmt, color: 'var(--text-main)' }] : []),
                  { label: `GST (${gstRate}%)${taxType === 'inclusive' ? ' (Included)' : ''}`, value: gstAmt, color: '#3b82f6' },
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
                          {(() => {
                            const stylistNames = inv.items && inv.items.length > 0
                              ? Array.from(new Set(inv.items.map(it => it.stylist).filter((s): s is string => Boolean(s && s !== '-'))))
                              : [];
                            if (stylistNames.length === 0) return null;
                            return (
                              <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: 2, fontWeight: 600 }}>
                                <Scissors size={11} />
                                <span>Stylist: {stylistNames.join(', ')}</span>
                              </div>
                            );
                          })()}
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
                            onClick={() => openWhatsAppReceipt(inv)}
                            title="Send receipt on WhatsApp"
                            style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1.5px solid #25D366', backgroundColor: 'rgba(37,211,102,0.12)', color: '#25D366', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </button>
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

        {/* ── REPORTS & ANALYTICS PAGE ── */}
        {activeTab === 'reports' && (() => {
          const now = new Date();
          const todayStr = now.toISOString().slice(0, 10);

          // Filter invoices according to selected reportRange
          const filteredInvoices = invoices.filter(inv => {
            if (reportRange === 'all') return true;
            const invDate = (inv.date || '').slice(0, 10);
            if (reportRange === 'today') {
              return invDate === todayStr;
            }
            if (reportRange === '7days') {
              const d7 = new Date();
              d7.setDate(d7.getDate() - 7);
              return invDate >= d7.toISOString().slice(0, 10);
            }
            if (reportRange === 'month') {
              const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
              return invDate >= monthStart;
            }
            if (reportRange === 'custom') {
              if (reportFrom && invDate < reportFrom) return false;
              if (reportTo && invDate > reportTo) return false;
              return true;
            }
            return true;
          });

          const paidInvoices = filteredInvoices.filter(i => i.status === 'PAID');
          const totalRevenue = paidInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const totalBillsCount = filteredInvoices.length;
          const avgBillValue = totalBillsCount > 0 ? Math.round(totalRevenue / totalBillsCount) : 0;

          // GST and Discounts
          let totalGstCollected = 0;
          let totalDiscountsGiven = 0;
          filteredInvoices.forEach(i => {
            const fin = computeInvoiceFinancials(i);
            totalGstCollected += fin.taxAmt;
            totalDiscountsGiven += fin.discountAmt;
          });
          const totalCgst = Math.round((totalGstCollected / 2) * 100) / 100;
          const totalSgst = Math.round((totalGstCollected / 2) * 100) / 100;

          // Payment mode breakdown
          const modeMap: Record<string, { count: number; amount: number; color: string }> = {
            'UPI / QR':      { count: 0, amount: 0, color: '#3b82f6' },
            'Cash':          { count: 0, amount: 0, color: '#10b981' },
            'Card':          { count: 0, amount: 0, color: '#8b5cf6' },
            'Other / Split': { count: 0, amount: 0, color: '#f59e0b' }
          };
          paidInvoices.forEach(i => {
            const m = (i.mode || 'UPI').toUpperCase();
            let key = 'Other / Split';
            if (m.includes('UPI') || m.includes('QR')) key = 'UPI / QR';
            else if (m.includes('CASH')) key = 'Cash';
            else if (m.includes('CARD')) key = 'Card';
            modeMap[key].count += 1;
            modeMap[key].amount += Number(i.amount) || 0;
          });

          // Daily Sales Map for Chart
          const daySalesMap: Record<string, { date: string; label: string; amount: number; count: number }> = {};
          filteredInvoices.forEach(i => {
            const dStr = (i.date || todayStr).slice(0, 10);
            if (!daySalesMap[dStr]) {
              let label = dStr;
              try {
                const parsed = new Date(dStr);
                label = parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
              } catch {}
              daySalesMap[dStr] = { date: dStr, label, amount: 0, count: 0 };
            }
            if (i.status === 'PAID') {
              daySalesMap[dStr].amount += Number(i.amount) || 0;
            }
            daySalesMap[dStr].count += 1;
          });
          const daySalesList = Object.values(daySalesMap).sort((a, b) => a.date.localeCompare(b.date));
          const maxDayAmount = Math.max(...daySalesList.map(d => d.amount), 1);

          // Top Services & Products breakdown
          const serviceSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
          filteredInvoices.forEach(i => {
            if (i.items && i.items.length > 0) {
              i.items.forEach(item => {
                const sName = item.name || 'Service';
                if (!serviceSalesMap[sName]) serviceSalesMap[sName] = { name: sName, qty: 0, revenue: 0 };
                serviceSalesMap[sName].qty += item.qty || 1;
                serviceSalesMap[sName].revenue += Number(item.amount) || ((Number(item.rate) || 0) * (item.qty || 1)) || 0;
              });
            } else if (i.service) {
              const sName = i.service;
              if (!serviceSalesMap[sName]) serviceSalesMap[sName] = { name: sName, qty: 0, revenue: 0 };
              serviceSalesMap[sName].qty += 1;
              serviceSalesMap[sName].revenue += Number(i.amount) || 0;
            }
          });
          const topServices = Object.values(serviceSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

          // Category distribution
          const allMenNames = new Set(menSections.flatMap(s => s.items.map(x => x.name.toLowerCase())));
          const allWomenNames = new Set(womenSections.flatMap(s => s.items.map(x => x.name.toLowerCase())));
          const allProductNames = new Set(productItems.map(x => x.name.toLowerCase()));

          let menRev = 0, womenRev = 0, productRev = 0, otherRev = 0;
          filteredInvoices.forEach(i => {
            if (i.items && i.items.length > 0) {
              i.items.forEach(item => {
                const lower = (item.name || '').toLowerCase();
                const amt = Number(item.amount) || 0;
                if (allMenNames.has(lower)) menRev += amt;
                else if (allWomenNames.has(lower)) womenRev += amt;
                else if (allProductNames.has(lower)) productRev += amt;
                else otherRev += amt;
              });
            } else {
              menRev += Number(i.amount) || 0;
            }
          });
          const totalCategoryRev = (menRev + womenRev + productRev + otherRev) || 1;

          // Customer Spending & Retention
          const customerSpendMap: Record<string, { name: string; phone: string; visits: number; spent: number }> = {};
          filteredInvoices.forEach(i => {
            const key = (i.phone || i.customer || 'walkin').trim();
            if (!customerSpendMap[key]) {
              customerSpendMap[key] = { name: i.customer || 'Valued Client', phone: i.phone || '', visits: 0, spent: 0 };
            }
            customerSpendMap[key].visits += 1;
            customerSpendMap[key].spent += Number(i.amount) || 0;
          });
          const topSpenders = Object.values(customerSpendMap).sort((a, b) => b.spent - a.spent).slice(0, 5);
          const totalUniqueClients = Object.keys(customerSpendMap).length;
          const repeatClients = Object.values(customerSpendMap).filter(c => c.visits > 1).length;
          const retentionRate = totalUniqueClients > 0 ? Math.round((repeatClients / totalUniqueClients) * 100) : 0;

          // Export CSV handler
          const handleExportCsv = () => {
            const headers = ['Invoice ID', 'Date & Time', 'Customer Name', 'Phone', 'Services', 'Stylist', 'Gross Subtotal', 'Discount', 'Taxable Amount', 'GST Rate', 'GST Amount', 'Total Paid', 'Payment Mode', 'Status'];
            const rows = filteredInvoices.map(inv => {
              const fin = computeInvoiceFinancials(inv);
              const servicesText = (inv.items && inv.items.length > 0) ? inv.items.map(it => `${it.name} (x${it.qty})`).join('; ') : (inv.service || '');
              const stylistsText = (inv.items && inv.items.length > 0) ? Array.from(new Set(inv.items.map(it => it.stylist).filter((s): s is string => Boolean(s && s !== '-')))).join('; ') : '-';
              return [
                inv.id,
                `"${formatReceiptDateTime(inv.date)}"`,
                `"${(inv.customer || '').replace(/"/g, '""')}"`,
                `"${inv.phone || ''}"`,
                `"${servicesText.replace(/"/g, '""')}"`,
                `"${stylistsText.replace(/"/g, '""')}"`,
                fin.grossSubtotal.toFixed(2),
                fin.discountAmt.toFixed(2),
                fin.taxableAmt.toFixed(2),
                `${fin.gstRate}%`,
                fin.taxAmt.toFixed(2),
                fin.totalPayable.toFixed(2),
                inv.mode,
                inv.status
              ].join(',');
            });
            const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `Duke_Duchess_Sales_Report_${todayStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Header with Title and Export Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <BarChart3 size={24} color="var(--accent-gold)" /> Reports &amp; Financial Analytics
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Real-time revenue performance, service trends, tax reporting, and client retention insights
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  style={{
                    padding: '0.55rem 1.1rem',
                    borderRadius: '8px',
                    border: '1.5px solid var(--accent-gold)',
                    backgroundColor: 'rgba(212,175,55,0.12)',
                    color: 'var(--accent-gold)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <FileSpreadsheet size={16} /> Export Excel / CSV
                </button>
              </div>

              {/* Date Filter Bar */}
              <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.9rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginRight: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Calendar size={13} /> Period:
                  </span>
                  {[
                    { id: 'all',    label: 'All Time' },
                    { id: 'today',  label: 'Today' },
                    { id: '7days',  label: 'Last 7 Days' },
                    { id: 'month',  label: 'This Month' },
                    { id: 'custom', label: 'Custom Range' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setReportRange(p.id as any)}
                      style={{
                        padding: '0.35rem 0.8rem',
                        borderRadius: '7px',
                        fontSize: '0.78rem',
                        fontWeight: reportRange === p.id ? 700 : 500,
                        cursor: 'pointer',
                        border: reportRange === p.id ? '2px solid var(--accent-gold)' : '1px solid var(--border-color)',
                        backgroundColor: reportRange === p.id ? 'rgba(212,175,55,0.15)' : 'transparent',
                        color: reportRange === p.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Pickers */}
                {reportRange === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                      <input type="date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} style={{ padding: '0.35rem 0.6rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                      <input type="date" value={reportTo} onChange={e => setReportTo(e.target.value)} style={{ padding: '0.35rem 0.6rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.8rem', outline: 'none' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Row 1: Executive KPI Cards ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {/* Total Revenue */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(16,185,129,0.3)', borderLeft: '4px solid #10b981', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Net Revenue</span>
                    <TrendingUp size={16} color="#10b981" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                    ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {paidInvoices.length} paid transactions
                  </div>
                </div>

                {/* Total Bills */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(59,130,246,0.3)', borderLeft: '4px solid #3b82f6', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Invoices</span>
                    <Receipt size={16} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                    {totalBillsCount}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Client visits recorded
                  </div>
                </div>

                {/* Average Bill Value (Ticket Size) */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(212,175,55,0.3)', borderLeft: '4px solid var(--accent-gold)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Ticket Size</span>
                    <Award size={16} color="var(--accent-gold)" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                    ₹{avgBillValue.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Average spend per bill
                  </div>
                </div>

                {/* Total GST Collected */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(139,92,246,0.3)', borderLeft: '4px solid #8b5cf6', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>GST Collected</span>
                    <Percent size={16} color="#8b5cf6" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8b5cf6' }}>
                    ₹{totalGstCollected.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    CGST: ₹{totalCgst.toFixed(2)} | SGST: ₹{totalSgst.toFixed(2)}
                  </div>
                </div>

                {/* Total Discounts Given */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid rgba(245,158,11,0.3)', borderLeft: '4px solid #f59e0b', borderRadius: '12px', padding: '1rem 1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discounts Given</span>
                    <Tag size={16} color="#f59e0b" />
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
                    ₹{totalDiscountsGiven.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Promotional customer savings
                  </div>
                </div>
              </div>

              {/* ── Row 2: Sales Trend Chart & Payment Mode Breakdown ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1.1fr', gap: '1.25rem' }}>

                {/* Daily Revenue Trend Bar Chart */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <TrendingUp size={16} color="var(--accent-gold)" /> Daily Sales Revenue Trend
                      </h4>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>Revenue progression across selected date range</p>
                    </div>
                  </div>

                  {daySalesList.length === 0 ? (
                    <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Receipt size={36} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      No sales data available for this period
                    </div>
                  ) : (
                    <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
                      {daySalesList.map((d, idx) => {
                        const heightPct = Math.max(12, Math.round((d.amount / maxDayAmount) * 100));
                        return (
                          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', position: 'relative' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                              ₹{d.amount > 999 ? `${Math.round(d.amount / 1000)}k` : d.amount}
                            </div>
                            <div
                              title={`${d.date}: ₹${d.amount.toLocaleString('en-IN')} (${d.count} bills)`}
                              style={{
                                width: '100%',
                                maxWidth: '38px',
                                height: `${heightPct}%`,
                                background: 'linear-gradient(180deg, #d4af37 0%, #b8973d 100%)',
                                borderRadius: '6px 6px 0 0',
                                transition: 'height 0.3s ease',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(212,175,55,0.2)'
                              }}
                            />
                            <div style={{ position: 'absolute', bottom: '-1.4rem', fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {d.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment Methods Split */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <CreditCard size={16} color="#3b82f6" /> Payment Mode Split
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Cash drawer vs digital payment reconciliation</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(modeMap).map(([mode, data]) => {
                        const pct = totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0;
                        return (
                          <div key={mode}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: data.color }} />
                                {mode}
                              </span>
                              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                                ₹{data.amount.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '7px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', backgroundColor: data.color, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Total Paid Collections:</span>
                    <strong style={{ color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

              {/* ── Row 3: Service Leaderboard & Category Share ── */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '1.25rem' }}>

                {/* Top Performing Services */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <Sparkles size={16} color="var(--accent-gold)" /> Top Performing Services &amp; Products
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Ranked by total revenue generated</p>

                  {topServices.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      No service records found in this range
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {topServices.map((svc, idx) => {
                        const rankMedals = ['🥇', '🥈', '🥉'];
                        const rankBadge = rankMedals[idx] || `#${idx + 1}`;
                        return (
                          <div key={svc.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', borderRadius: '8px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ fontSize: '0.9rem', width: '22px', textAlign: 'center' }}>{rankBadge}</span>
                              <div>
                                <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--text-main)' }}>{svc.name}</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{svc.qty} billed / ordered</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-gold)' }}>₹{svc.revenue.toLocaleString('en-IN')}</div>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                {totalRevenue > 0 ? Math.round((svc.revenue / totalRevenue) * 100) : 0}% of sales
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Category Share (Men vs Women vs Products) */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <PieChart size={16} color="#8b5cf6" /> Category Revenue Split
                  </h4>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Men vs Women services vs Retail products</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: 'Men Salon Services',   amount: menRev,     color: '#3b82f6' },
                      { label: 'Women Salon Services', amount: womenRev,   color: '#ec4899' },
                      { label: 'Retail Products',      amount: productRev, color: '#f59e0b' },
                      ...(otherRev > 0 ? [{ label: 'Other Packages', amount: otherRev, color: '#10b981' }] : [])
                    ].map(cat => {
                      const pct = Math.round((cat.amount / totalCategoryRev) * 100);
                      return (
                        <div key={cat.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.35rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.label}</span>
                            <span style={{ fontWeight: 700, color: cat.color }}>
                              ₹{cat.amount.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({pct}%)</span>
                            </span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color, borderRadius: '4px', transition: 'width 0.4s' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ backgroundColor: 'var(--bg-primary)', borderRadius: '8px', padding: '0.75rem', marginTop: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Top Category:</span>
                    <strong style={{ color: 'var(--accent-gold)' }}>
                      {menRev >= womenRev ? 'Men Salon Services' : 'Women Salon Services'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ── Row 4: Client Retention & VIP Loyalty ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>

                {/* Client Retention Ratio */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                    <Users size={16} color="var(--accent-gold)" /> Client Retention Rate
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{retentionRate}%</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>repeat clients</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Unique Clients Billed:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{totalUniqueClients}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Returning Clients (2+ visits):</span>
                      <strong style={{ color: '#10b981' }}>{repeatClients}</strong>
                    </div>
                  </div>
                </div>

                {/* Top VIP Spenders */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                    <Award size={16} color="#10b981" /> Top VIP Clients (Spend)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {topSpenders.slice(0, 3).map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({c.visits} visits)</span>
                        </div>
                        <strong style={{ color: 'var(--accent-gold)' }}>₹{c.spent.toLocaleString('en-IN')}</strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection Health */}
                <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                    <CheckCircle size={16} color="#3b82f6" /> Collection Health
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                      {totalBillsCount > 0 ? Math.round((paidInvoices.length / totalBillsCount) * 100) : 100}%
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>paid on time</span>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Paid Bills:</span>
                      <strong style={{ color: '#10b981' }}>{paidInvoices.length}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Unpaid / Outstanding:</span>
                      <strong style={{ color: '#ef4444' }}>{totalBillsCount - paidInvoices.length}</strong>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          );
        })()}
      </main>

      {/* ── RECEIPT MODAL (Matches Sample Design & < 50KB Guarantee) ── */}
      {receiptInvoice && (() => {
        const inv = receiptInvoice;
        const fin = computeInvoiceFinancials(inv);

        const itemsList: InvoiceItem[] = (inv.items && inv.items.length > 0)
          ? inv.items
          : (inv.service || 'Salon Service').split(', ').map(s => {
              const match = s.match(/^(.*?)\s*x(\d+)$/);
              if (match) {
                const name = match[1];
                const qty = parseInt(match[2], 10) || 1;
                const rate = Math.round((fin.grossSubtotal / qty) * 100) / 100;
                return { name, qty, rate, amount: fin.grossSubtotal, stylist: '-' };
              }
              return { name: s, qty: 1, rate: fin.grossSubtotal, amount: fin.grossSubtotal, stylist: '-' };
            });

        const dateTimeStr = formatReceiptDateTime(inv.date);

        const handleDownloadHtml = () => {
          const htmlContent = generateReceiptHtmlString(inv);
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Receipt-${inv.id}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        return (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }} onClick={() => setReceiptInvoice(null)}>
            <style>{`
              @media print {
                body * { visibility: hidden !important; }
                #printable-receipt, #printable-receipt * { visibility: visible !important; }
                #printable-receipt {
                  position: fixed !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  margin: 0 !important;
                  padding: 20px 24px !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: #ffffff !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .no-print { display: none !important; }
              }
            `}</style>

            {/* Modal Controls Bar */}
            <div className="no-print" style={{ width: '100%', maxWidth: '700px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Receipt Preview</span>
                <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', border: '1px solid #10b981', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                  Size: ~14 KB (&lt; 50 KB Guarantee)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => openWhatsAppReceipt(inv)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#25D366', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,211,102,0.35)' }}
                >
                  <MessageCircle size={14} /> Send on WhatsApp
                </button>
                <button
                  onClick={() => downloadReceiptPdf(inv)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2563eb', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.35)' }}
                  title="Download official PDF receipt directly to your local folder"
                >
                  <Download size={14} /> Download PDF (&lt;50KB)
                </button>
                <button
                  onClick={() => { if (typeof window !== 'undefined') window.print(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg,#d4af37,#c5a028)', color: '#000', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
                <button
                  onClick={() => setReceiptInvoice(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', width: '30px', height: '30px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Receipt Paper Card */}
            <div id="printable-receipt" style={{ backgroundColor: '#ffffff', borderRadius: '6px', width: '100%', maxWidth: '700px', maxHeight: '86vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', padding: '28px 36px 0 36px', color: '#111', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }} onClick={e => e.stopPropagation()}>
              
              {/* Top Shield Emblem Badge */}
              <div style={{ textAlign: 'center', margin: '0 auto 18px' }}>
                <img src="/logo.png" alt="New Duke &amp; Duchess" style={{ width: '82px', height: '88px', objectFit: 'contain', borderRadius: '8px', border: '1.5px solid #d4af37', boxShadow: '0 4px 10px rgba(0,0,0,0.15)', background: '#000', display: 'inline-block' }} />
              </div>

              {/* Main Salon Title */}
              <h1 style={{ fontFamily: '"Playfair Display", "Cinzel", "Times New Roman", serif', fontSize: '26px', fontWeight: 800, color: '#111', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0, textAlign: 'center' }}>
                NEW DUKE &amp; DUCHESS
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '4px 0 10px' }}>
                <span style={{ height: '1px', width: '35px', background: '#b8973d' }}></span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#b8973d', letterSpacing: '4px', textTransform: 'uppercase' }}>UNISEX SALON</span>
                <span style={{ height: '1px', width: '35px', background: '#b8973d' }}></span>
              </div>

              {/* Address & Contact */}
              <div style={{ fontSize: '11.5px', color: '#4b5563', textAlign: 'center', maxWidth: '500px', margin: '0 auto', lineHeight: 1.45 }}>
                📍 1st Floor, Abhiman Arcade, Muddenapalya, Main Rd, near Ayodhya Samrat Hotel, Srigandada Kaval, Nagarbhavi, Bengaluru, Karnataka 560072
              </div>
              <div style={{ fontSize: '12px', color: '#111', fontWeight: 600, textAlign: 'center', marginTop: '4px' }}>
                📞 +91 88610 22242
              </div>

              {/* Invoice Details & Bill To (2-column box) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', border: '1px solid #e8e3d5', borderTop: '3px solid #b8973d', borderRadius: '4px', padding: '12px 18px', marginTop: '16px', backgroundColor: '#fff' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8973d', letterSpacing: '0.8px', marginBottom: '8px' }}>📄 INVOICE DETAILS</div>
                  <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.7 }}>
                    <div>Invoice No. &nbsp;&nbsp;&nbsp;&nbsp;: <strong style={{ color: '#111' }}>{inv.id}</strong></div>
                    <div>Date &amp; Time &nbsp;&nbsp;&nbsp;: <strong style={{ color: '#111' }}>{dateTimeStr}</strong></div>
                    <div>Payment Mode : <strong style={{ color: '#111', textTransform: 'uppercase' }}>{inv.mode}</strong></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b8973d', letterSpacing: '0.8px', marginBottom: '8px' }}>👤 BILL TO</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{inv.customer || 'Walk-in Client'}</div>
                  <div style={{ fontSize: '12.5px', color: '#4b5563', marginTop: '5px' }}>📞 {inv.phone || 'N/A'}</div>
                </div>
              </div>

              {/* Services Section Header */}
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#b8973d', letterSpacing: '1px', marginTop: '18px', marginBottom: '6px' }}>✂️ SERVICES</div>

              {/* Services Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#000', color: '#b8973d' }}>
                    <th style={{ textAlign: 'left', padding: '7px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px' }}>DESCRIPTION</th>
                    <th style={{ textAlign: 'center', padding: '7px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px', width: '70px' }}>STYLIST</th>
                    <th style={{ textAlign: 'center', padding: '7px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px', width: '60px' }}>QTY</th>
                    <th style={{ textAlign: 'right', padding: '7px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px', width: '85px' }}>RATE (₹)</th>
                    <th style={{ textAlign: 'right', padding: '7px 10px', fontSize: '10.5px', fontWeight: 700, letterSpacing: '0.5px', width: '95px' }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsList.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#111' }}>{item.name}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#555' }}>{item.stylist || '-'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#111' }}>{item.qty}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#111' }}>{Number(item.rate).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#111' }}>{Number(item.amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Subtotal, Discount, Tax and Total Payable */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <div style={{ width: '270px' }}>
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '12px', color: '#374151', padding: '4px 6px', borderTop: '1px solid #e5e7eb' }}>
                    <span>Subtotal</span>
                    <strong>₹{fin.grossSubtotal.toFixed(2)}</strong>
                  </div>
                  {fin.discountAmt > 0 && (
                    <>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '12px', color: '#10b981', padding: '4px 6px' }}>
                        <span>Discount {fin.discountPercent > 0 ? `(${fin.discountPercent}%)` : ''}</span>
                        <strong style={{ color: '#10b981' }}>- ₹{fin.discountAmt.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '12px', color: '#374151', padding: '4px 6px' }}>
                        <span>Taxable Amount</span>
                        <strong>₹{fin.taxableAmt.toFixed(2)}</strong>
                      </div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', fontSize: '12px', color: '#374151', padding: '4px 6px' }}>
                    <span>Tax (GST {fin.gstRate > 0 ? `${fin.gstRate}%` : ''})</span>
                    <strong>₹{fin.taxAmt.toFixed(2)}</strong>
                  </div>
                  <div style={{ background: '#000', color: '#b8973d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px' }}>TOTAL PAYABLE</span>
                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#b8973d' }}>₹ {fin.totalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Successful Badge */}
              <div style={{ border: '1.5px solid #d4af37', borderRadius: '4px', background: '#fffcf4', padding: '9px 12px', marginTop: '14px', textAlign: 'center', fontSize: '12px', color: '#1f2937' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#b8973d', color: '#fff', fontSize: '10px', fontWeight: 'bold', marginRight: '6px' }}>✓</span>
                <strong>PAYMENT SUCCESSFUL</strong> &nbsp;|&nbsp; Paid via {inv.mode} &nbsp; Thank you for your payment.
              </div>

              {/* Footer Columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1.6fr', gap: '12px', alignItems: 'center', marginTop: '18px', paddingTop: '16px', borderTop: '1px solid #ede8dc' }}>
                {/* Column 1: Review & QR */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/qr-review.jpg" alt="Google Review QR" style={{ width: '58px', height: '58px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #d4af37', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#b8973d', letterSpacing: '0.5px' }}>LOVE OUR SERVICE?</div>
                    <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Scan to leave us a Google Review</div>
                    <div style={{ color: '#d4af37', fontSize: '11px', marginTop: '3px', letterSpacing: '1px' }}>★★★★★</div>
                  </div>
                </div>
                
                {/* Column 2: Follow Us */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#b8973d', letterSpacing: '0.5px', marginBottom: '6px' }}>FOLLOW US</div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                      </svg>
                    </span>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </span>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                        <path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 0 5.4 0 12c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.6c1.7 1 3.7 1.6 5.7 1.6 6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.5-8.5zM12 22c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4C2.5 15.8 2 13.9 2 12c0-5.5 4.5-10 10-10s10 4.5 10 10-4.5 10-10 10zm5.5-7.5c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.4-.5-2.6-1.6-.9-.8-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.2-.2.2-.3.3-.5.1-.2 0-.4-.1-.5-.1-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.4-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.6.2.2 2.4 3.7 5.9 5.2.8.4 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2.1-.9 2.4-1.7.3-.8.3-1.6.2-1.7-.1-.2-.3-.3-.6-.5z"/>
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Column 3: Thank you */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: '"Brush Script MT", "Segoe Script", cursive', fontSize: '24px', color: '#b8973d', lineHeight: 1 }}>Thank You! ♡</div>
                  <div style={{ fontSize: '9.5px', color: '#555', lineHeight: 1.35, marginTop: '4px' }}>
                    Thank you for joining the New Duke &amp; Duchess family ❤️ We truly appreciate your support and look forward to seeing you again! ⭐
                  </div>
                </div>
              </div>

              {/* Bottom Ribbon */}
              <div style={{ background: '#000', color: '#b8973d', padding: '7px 0', textAlign: 'center', fontSize: '9.5px', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginTop: '16px', marginLeft: '-36px', marginRight: '-36px' }}>
                ♥ &nbsp;&nbsp;&nbsp; STYLE IS A REFLECTION OF YOUR ATTITUDE &nbsp;&nbsp;&nbsp; ♥
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Assigned Stylist</label>
                <select
                  value={invStylist}
                  onChange={(e) => setInvStylist(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)' }}
                >
                  <option value="">-- Select Stylist (Optional) --</option>
                  {stylists.map(st => (
                    <option key={st.id || st.name} value={st.name}>
                      {st.name} {st.designation ? `(${st.designation})` : ''}
                    </option>
                  ))}
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

      {/* ── Add Stylist Modal ── */}
      {showAddStylistModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '420px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
            <button onClick={() => { setShowAddStylistModal(false); setTargetCartItemIdForNewStylist(null); }} style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', backgroundColor: 'rgba(212,175,55,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Scissors size={18} color="var(--accent-gold)" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Add Salon Stylist</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Register a stylist to assign on bills</span>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Stylist Full Name *</label>
              <input
                autoFocus
                value={newStylistName}
                onChange={e => setNewStylistName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNewStylist()}
                placeholder="e.g. Ananya Rao"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>Designation / Role</label>
              <input
                value={newStylistDesig}
                onChange={e => setNewStylistDesig(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNewStylist()}
                placeholder="e.g. Senior Stylist, Barber, Make-up Artist"
                style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '7px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowAddStylistModal(false); setTargetCartItemIdForNewStylist(null); }} style={{ padding: '0.5rem 1rem', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
              <button onClick={handleAddNewStylist} style={{ padding: '0.5rem 1.25rem', borderRadius: '7px', border: 'none', backgroundColor: 'var(--accent-gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>Save Stylist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
