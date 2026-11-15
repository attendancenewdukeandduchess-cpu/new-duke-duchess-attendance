import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SALON_LOGO_DATA_URI } from '@/app/logoDataUri';

export type InvoiceItem = {
  name: string;
  qty: number;
  rate: number;
  amount: number;
  stylist?: string;
};

export type Invoice = {
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

export function computeInvoiceFinancials(inv: Invoice) {
  const itemsGross = (inv.items && inv.items.length > 0)
    ? inv.items.reduce((s, i) => s + (Number(i.amount) || ((Number(i.rate) || 0) * (Number(i.qty) || 1)) || 0), 0)
    : 0;

  const totalAmount = Number(inv.amount) || 0;
  const gstRate = Number(inv.gst) || 0;

  let grossSubtotal = inv.subtotal !== undefined && inv.subtotal > 0
    ? Number(inv.subtotal)
    : (itemsGross > 0 ? itemsGross : totalAmount);

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

export function formatReceiptDateTime(dateStr?: string) {
  if (!dateStr) return '15 Nov 2026, 05:30 pm';
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

export function createInvoicePdfDoc(inv: Invoice): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const fin = computeInvoiceFinancials(inv);
  const dateTimeStr = formatReceiptDateTime(inv.date);
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 10;

  // 1. Logo
  if (SALON_LOGO_DATA_URI) {
    const logoW = 24;
    const logoH = 26;
    doc.addImage(SALON_LOGO_DATA_URI, 'JPEG', (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 4;
  }

  // 2. Salon Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  doc.text('NEW DUKE & DUCHESS', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // 3. Unisex Salon Tagline
  doc.setFontSize(8.5);
  doc.setTextColor(184, 151, 61); // #b8973d
  doc.text('—  UNISEX SALON  —', pageWidth / 2, y, { align: 'center' });
  y += 5;

  // 4. Address & Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99); // #4b5563
  doc.text('1st Floor, Abhiman Arcade, Muddenapalya, Main Rd, near Ayodhya Samrat Hotel,', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Srigandada Kaval, Nagarbhavi, Bengaluru, Karnataka 560072', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text('Contact: +91 88610 22242', pageWidth / 2, y, { align: 'center' });
  y += 7;

  // 5. 2-Column Box: Invoice Details & Bill To
  const boxX = 14;
  const boxW = pageWidth - 28;
  const boxH = 24;

  // Background & Borders
  doc.setFillColor(252, 252, 251);
  doc.setDrawColor(232, 227, 213);
  doc.rect(boxX, y, boxW, boxH, 'FD');

  // Gold accent top bar
  doc.setFillColor(184, 151, 61);
  doc.rect(boxX, y, boxW, 1.2, 'F');

  // Left Column: Invoice Details
  const col1X = boxX + 5;
  let colY = y + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(184, 151, 61);
  doc.text('INVOICE DETAILS', col1X, colY);
  colY += 4.2;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Invoice No.     :', col1X, colY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text(inv.id || 'INV-0001', col1X + 24, colY);
  colY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Date & Time   :', col1X, colY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text(dateTimeStr, col1X + 24, colY);
  colY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Payment Mode :', col1X, colY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text((inv.mode || 'CASH').toUpperCase() + ' (PAID)', col1X + 24, colY);

  // Right Column: Bill To
  const col2X = boxX + (boxW / 2) + 5;
  colY = y + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(184, 151, 61);
  doc.text('BILL TO', col2X, colY);
  colY += 4.5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text(inv.customer || 'Walk-in Client', col2X, colY);
  colY += 4.5;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text('Mobile: ' + (inv.phone || 'N/A'), col2X, colY);

  y += boxH + 6;

  // 6. Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(184, 151, 61);
  doc.text('SERVICES & PRODUCTS', 14, y);
  y += 2.5;

  // 7. Table of Items
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

  const tableData = itemsList.map(item => [
    item.name,
    item.stylist || '-',
    String(item.qty || 1),
    Number(item.rate || 0).toFixed(2),
    Number(item.amount || 0).toFixed(2)
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['DESCRIPTION', 'STYLIST', 'QTY', 'RATE (₹)', 'AMOUNT (₹)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [184, 151, 61],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 32, fontStyle: 'bold' }
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [17, 17, 17]
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });

  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : y + 30;
  y = finalTableY + 4;

  // 8. Totals Breakdown (Right-Aligned)
  const totalBoxW = 75;
  const totalBoxX = pageWidth - 14 - totalBoxW;

  const drawRow = (label: string, val: string, isBold = false, color = [17, 17, 17]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(label, totalBoxX, y);
    doc.text(val, totalBoxX + totalBoxW, y, { align: 'right' });
    y += 4.2;
  };

  drawRow('Subtotal:', '₹' + fin.grossSubtotal.toFixed(2));

  if (fin.discountAmt > 0) {
    const discLabel = `Discount ${fin.discountPercent > 0 ? `(${fin.discountPercent}%)` : ''}:`;
    drawRow(discLabel, '- ₹' + fin.discountAmt.toFixed(2), false, [16, 185, 129]);
    drawRow('Taxable Amount:', '₹' + fin.taxableAmt.toFixed(2));
  }

  if (fin.gstRate > 0 && fin.taxAmt > 0) {
    drawRow(`CGST (${fin.cgstRate}%):`, '₹' + fin.cgstAmt.toFixed(2));
    drawRow(`SGST (${fin.sgstRate}%):`, '₹' + fin.sgstAmt.toFixed(2));
  } else if (fin.taxAmt > 0) {
    drawRow('Tax (GST):', '₹' + fin.taxAmt.toFixed(2));
  }

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(totalBoxX, y, totalBoxX + totalBoxW, y);
  y += 4.5;

  // Total Paid
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(17, 17, 17);
  doc.text('TOTAL PAID:', totalBoxX, y);
  doc.setTextColor(184, 151, 61);
  doc.text('₹' + Number(inv.amount || fin.totalPayable).toFixed(2), totalBoxX + totalBoxW, y, { align: 'right' });
  y += 5.5;

  // Payment Status Pill
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(totalBoxX + totalBoxW - 35, y - 3.5, 35, 5, 1, 1, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('PAID SUCCESSFUL', totalBoxX + totalBoxW - 17.5, y, { align: 'center' });

  y += 12;

  // 9. Footer
  doc.setDrawColor(230, 230, 230);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Thank you for visiting the New Duke & Duchess family! ❤️', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('We truly appreciate your support and look forward to seeing you again! ⭐', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(184, 151, 61);
  doc.text('♥ Style is a reflection of your attitude ♥', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text('Official Computer Generated Tax Invoice & Receipt • No Signature Required', pageWidth / 2, y, { align: 'center' });

  return doc;
}

/**
 * Generates and triggers direct browser download of the PDF invoice receipt.
 * The file is saved directly to the user's local downloads folder.
 */
export function downloadReceiptPdf(inv: Invoice) {
  try {
    const doc = createInvoicePdfDoc(inv);
    doc.save(`Receipt-${inv.id}.pdf`);
  } catch (err) {
    console.error('Error generating or downloading PDF receipt:', err);
  }
}
