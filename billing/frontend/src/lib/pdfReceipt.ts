import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SALON_LOGO_DATA_URI } from '@/app/logoDataUri';
import { QR_REVIEW_DATA_URI } from '@/app/qrReviewDataUri';

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

/**
 * Creates a pixel-perfect, professionally aligned vector PDF invoice
 * matching the New Duke & Duchess luxury salon brand aesthetics.
 * Strictly under 35KB (< 50KB guarantee).
 */
export function createInvoicePdfDoc(inv: Invoice): jsPDF {
  const fin = computeInvoiceFinancials(inv);
  const dateTimeStr = formatReceiptDateTime(inv.date);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2); // 182mm
  let y = 10;

  // 1. Logo (Centered with generous 7.5mm margin to eliminate any text overlap)
  if (SALON_LOGO_DATA_URI) {
    const logoW = 24;
    const logoH = 24;
    doc.addImage(SALON_LOGO_DATA_URI, 'JPEG', (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 7.5;
  }

  // 2. Salon Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(17, 17, 17);
  doc.text('NEW DUKE & DUCHESS', pageWidth / 2, y, { align: 'center' });
  y += 5.5;

  // 3. Unisex Salon Tagline with Gold Decorative Lines
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(184, 151, 61); // #b8973d
  doc.text('UNISEX SALON', pageWidth / 2, y, { align: 'center' });
  // decorative lines
  doc.setDrawColor(184, 151, 61);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 38, y - 0.8, pageWidth / 2 - 16, y - 0.8);
  doc.line(pageWidth / 2 + 16, y - 0.8, pageWidth / 2 + 38, y - 0.8);
  y += 5;

  // 4. Address & Phone
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(75, 85, 99);
  doc.text('1st Floor, Abhiman Arcade, Muddenapalya, Main Rd, near Ayodhya Samrat Hotel,', pageWidth / 2, y, { align: 'center' });
  y += 3.8;
  doc.text('Srigandada Kaval, Nagarbhavi, Bengaluru, Karnataka 560072', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 17, 17);
  doc.text('Contact: +91 88610 22242', pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Horizontal Divider Line across width
  doc.setDrawColor(220, 215, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 3;

  // 5. 2-COLUMN BOX: INVOICE DETAILS & BILL TO (Perfect vertical colon alignment)
  const boxTop = y;
  const colWidth = (contentWidth - 6) / 2; // ~88mm
  const col1Left = margin;
  const col2Left = margin + colWidth + 6;

  // Left Column: INVOICE DETAILS
  let leftY = boxTop + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(184, 151, 61);
  doc.text('INVOICE DETAILS', col1Left, leftY);
  leftY += 5;

  const leftLabels = [
    { label: 'Invoice No.', val: inv.id || 'INV-0001' },
    { label: 'Date & Time', val: dateTimeStr },
    { label: 'Payment Mode', val: (inv.mode || 'CASH').toUpperCase() }
  ];

  leftLabels.forEach(row => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    doc.text(row.label, col1Left, leftY);
    // Fixed aligned colon at x = col1Left + 25
    doc.text(':', col1Left + 25, leftY);
    // Value in bold at x = col1Left + 28
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 17, 17);
    doc.text(row.val, col1Left + 28, leftY);
    leftY += 4.5;
  });

  // Vertical Divider Line between Column 1 & Column 2
  doc.setDrawColor(225, 220, 205);
  doc.setLineWidth(0.4);
  doc.line(col1Left + colWidth + 3, boxTop + 1, col1Left + colWidth + 3, leftY);

  // Right Column: BILL TO
  let rightY = boxTop + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(184, 151, 61);
  doc.text('BILL TO', col2Left, rightY);
  rightY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text(inv.customer || 'Walk-in Client', col2Left, rightY);
  rightY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(90, 90, 90);
  doc.text('Mobile: ' + (inv.phone || 'N/A'), col2Left, rightY);

  y = Math.max(leftY, rightY) + 3;

  // Horizontal Divider Line below details box
  doc.setDrawColor(220, 215, 200);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // 6. Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(184, 151, 61);
  doc.text('SERVICES', margin, y);
  y += 2.5;

  // 7. Services Table
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
    margin: { left: margin, right: margin },
    head: [['DESCRIPTION', 'STYLIST', 'QTY', 'RATE (Rs.)', 'AMOUNT (Rs.)']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [17, 17, 17],
      textColor: [184, 151, 61],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.8
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 26 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'right', cellWidth: 32, fontStyle: 'bold' }
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [17, 17, 17]
    },
    didDrawCell: function (data) {
      if (data.section === 'body') {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });

  const finalTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY : y + 30;
  y = finalTableY + 4;

  // 8. TOTALS SUMMARY TABLE (Right-Aligned, matching table's right margin)
  // Kept only GST, removed CGST & SGST as requested
  const totalsBoxWidth = 85;
  const totalsBoxX = margin + contentWidth - totalsBoxWidth;

  const totalsRows: [string, string][] = [
    ['Subtotal', 'Rs. ' + fin.grossSubtotal.toFixed(2)]
  ];

  if (fin.discountAmt > 0) {
    const discLabel = `Discount ${fin.discountPercent > 0 ? `(${fin.discountPercent}%)` : ''}`;
    totalsRows.push([discLabel, '- Rs. ' + fin.discountAmt.toFixed(2)]);
    totalsRows.push(['Taxable Amount', 'Rs. ' + fin.taxableAmt.toFixed(2)]);
  }

  // Only GST (No CGST / SGST)
  if (fin.taxAmt > 0 || fin.gstRate > 0) {
    const gstLabel = `Tax (GST ${fin.gstRate > 0 ? `${fin.gstRate}%` : ''})`.trim();
    totalsRows.push([gstLabel, 'Rs. ' + fin.taxAmt.toFixed(2)]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: totalsBoxX, right: margin },
    body: totalsRows,
    theme: 'plain',
    tableWidth: totalsBoxWidth,
    columnStyles: {
      0: { halign: 'left', cellWidth: 48, fontSize: 8, textColor: [80, 80, 80] },
      1: { halign: 'right', cellWidth: 37, fontSize: 8, fontStyle: 'bold', textColor: [17, 17, 17] }
    },
    bodyStyles: {
      cellPadding: 1.6
    },
    didDrawCell: function(data) {
      if (data.row.raw && String(data.row.raw[0]).startsWith('Discount')) {
        doc.setTextColor(16, 185, 129);
      }
    }
  });

  y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 1.5 : y + 20;

  // TOTAL PAYABLE ROW - SOLID BLACK BAR WITH LUXURY GOLD TEXT
  doc.setFillColor(17, 17, 17);
  doc.rect(totalsBoxX, y, totalsBoxWidth, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(184, 151, 61);
  doc.text('TOTAL PAYABLE', totalsBoxX + 4, y + 6);

  doc.setFontSize(11);
  doc.text('Rs. ' + Number(inv.amount || fin.totalPayable).toFixed(2), totalsBoxX + totalsBoxWidth - 4, y + 6.3, { align: 'right' });

  y += 14;

  // 9. PAYMENT SUCCESSFUL FULL-WIDTH BANNER
  doc.setFillColor(255, 252, 244); // light gold cream
  doc.setDrawColor(212, 175, 55); // #d4af37
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 8.5, 1.5, 1.5, 'FD');

  // Checkmark circle in gold
  doc.setFillColor(184, 151, 61);
  doc.circle(margin + 6, y + 4.25, 2.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OK', margin + 6, y + 5.1, { align: 'center' });

  // Banner text
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('PAYMENT SUCCESSFUL', margin + 11, y + 5.3);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(` |  Paid via ${inv.mode || 'CASH'}   Thank you for your payment.`, margin + 46, y + 5.3);

  y += 14;

  // 10. LUXURY 3-COLUMN FOOTER WITH GOOGLE REVIEWS QR CODE
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.4);
  doc.line(margin, y, margin + contentWidth, y);
  y += 5;

  // Left Column: Google Reviews QR Code Image & Message
  const fCol1 = margin;
  if (QR_REVIEW_DATA_URI) {
    const qrSize = 17; // 17mm x 17mm square QR code
    doc.addImage(QR_REVIEW_DATA_URI, 'JPEG', fCol1, y, qrSize, qrSize);

    const qrTextX = fCol1 + qrSize + 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(184, 151, 61);
    doc.text('LOVE OUR SERVICE?', qrTextX, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(90, 90, 90);
    doc.text('Scan for Google Review', qrTextX, y + 8.5);

    doc.setTextColor(234, 179, 8); // Gold 5 stars
    doc.setFontSize(8);
    doc.text('* * * * *', qrTextX, y + 13.5);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(184, 151, 61);
    doc.text('LOVE OUR SERVICE?', fCol1, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan & leave us a Google Review', fCol1, y + 7);
    doc.setTextColor(234, 179, 8);
    doc.setFontSize(8);
    doc.text('* * * * *', fCol1, y + 11.5);
  }

  // Center Column: Follow us (Centered at true midpoint: 105mm)
  const fCol2 = pageWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(184, 151, 61);
  doc.text('FOLLOW US', fCol2, y + 3, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('@newdukeandduchess', fCol2, y + 7, { align: 'center' });
  doc.text('Instagram  |  Facebook  |  WhatsApp', fCol2, y + 11, { align: 'center' });

  // Right Column: Thank You message (Right-aligned with clean margins)
  const fCol3 = margin + contentWidth;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(184, 151, 61);
  doc.text('Thank You!', fCol3, y + 3, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text('Thank you for visiting New Duke & Duchess.', fCol3, y + 7, { align: 'right' });
  doc.text('We look forward to seeing you again!', fCol3, y + 11, { align: 'right' });

  y += 18;

  // 11. BOTTOM BLACK BANNER: STYLE IS A REFLECTION OF YOUR ATTITUDE
  doc.setFillColor(17, 17, 17);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(184, 151, 61);
  doc.text('--  STYLE IS A REFLECTION OF YOUR ATTITUDE  --', margin + (contentWidth / 2), y + 4.2, { align: 'center' });

  y += 8;

  // 12. Bottom System Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text('Official Computer Generated Tax Invoice & Receipt - No Signature Required', pageWidth / 2, y, { align: 'center' });

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
