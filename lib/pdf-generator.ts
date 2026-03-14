import jsPDF from 'jspdf';
import { Challan, Invoice, Customer, Broker, FabricQuality, Template } from '@/types';
import { numberToWords } from './calculations';

function fmt(value: unknown): string {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

// Extract config from a custom template (or fall back to KJ defaults)
function resolveTemplateConfig(template?: Template | null) {
  const h = (template?.headerLayout || {}) as any;
  const cs = (template?.customerSectionLayout || {}) as any;
  const f = (template?.footerLayout || {}) as any;
  return {
    companyName:           h.companyName           ?? 'K. J. TEXTILE',
    companyAddress:        h.companyAddress         ?? 'PLOT NO-33, GIDC, OLPAD, OPP. HINDUSTAN CHEMICAL COMPANY, ASNABAD GAM, OLPAD SURAT',
    companyPhone:          h.companyPhone           ?? '',
    companyMobile:         h.companyMobile          ?? '9913555599',
    companyStateCode:      h.companyStateCode       ?? '24',
    gstin:                 h.gstin                  ?? '24ANHPP2082P1ZJ',
    upiId:                 h.upiId                  ?? '',
    jurisdiction:          h.jurisdiction           ?? 'Subject To Surat Jurisdiction',
    accentColor:           h.accentColor,
    showGaneshHeader:      h.showGaneshHeader       !== false,
    showOriginalDuplicate: h.showOriginalDuplicate  !== false,
    showBroker:            cs.showBrokerField        !== false,
    showQuality:           cs.showQualityField       !== false,
    showGstin:             cs.showGstinField         !== false,
    noDyeingGuarantee:     f.showNoDyeingGuarantee  !== false,
    bankName:              f.bankName               ?? 'THE SURAT DIST CO-OP BANK',
    accountNo:             f.accountNo              ?? '808005230586',
    ifscCode:              f.ifscCode               ?? 'SDCB0000005',
    defaultHsnCode:        f.defaultHsnCode         ?? '5407',
    defaultCgstPercent:    Number(f.defaultCgstPercent ?? 7),
    defaultSgstPercent:    Number(f.defaultSgstPercent ?? 0),
    defaultIgstPercent:    Number(f.defaultIgstPercent ?? 0),
    showNetRate:           f.showNetRate             !== false,
    showAmountInWords:     f.showAmountInWords       !== false,
    showReceivedBox:       f.showReceivedBox         !== false,
    showTerms:             f.showTermsOfSale         !== false,
    customTerms:           f.customTerms             as string | undefined,
    footerNote:            f.footerNote              as string | undefined,
    signatureLabel:        f.signatureLabel          ?? 'Proprietor/Authorized',
    logoUrl:               template?.logoUrl         ?? '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Logo helper – fetches a remote/data URL and draws it at top-left
// ─────────────────────────────────────────────────────────────────────────────
async function addLogoToPDF(
  doc: jsPDF,
  logoUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number
) {
  if (!logoUrl) return;
  try {
    const resp = await fetch(logoUrl);
    if (!resp.ok) return;
    const blob = await resp.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const imgType = blob.type.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
    doc.addImage(dataUrl, imgType, x, y, maxW, maxH);
  } catch {
    // skip logo silently if it can't be fetched
  }
}

const DEFAULT_TERMS = [
  "Payment to be made by A/c. payee's cheque/draft only.",
  'Any complaint for the goods should be made within 2 days after that no complaint will be entertained.',
  'Interest @ 24% per annum will be charged after due date of the bill.',
  'We are not responsible for any loss or damage during transit.',
  'We reserve the right of recovery at any time before due date.',
  'Goods once sold will not be taken back.',
  'Do not mix types of lots.',
  'Subject to SURAT Jurisdiction.',
];
// ─────────────────────────────────────────────────────────────────────────────
// CHALLAN PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function generateChallanPDF(
  challan: Challan,
  customer: Customer,
  _qualities: FabricQuality[],
  template?: Template | null
) {
  const cfg = resolveTemplateConfig(template);
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();  // 210
  const L = 8, R = W - 8;
  let y = 8;

  // ── Logo (top-left) ──────────────────────────────────────────────────────
  if (cfg.logoUrl) await addLogoToPDF(doc, cfg.logoUrl, L, 6, 28, 14);

  const any = challan as any;
  const challanNo = String(any.challanNumber || any.number || '');
  const challanDate = fmt(any.challanDate || any.date);
  const quality = String(any.quality || any.qualityName || '');
  const broker = String(any.broker || any.brokerName || '');
  const rolls: { meters: number }[] = Array.isArray(any.rolls) ? any.rolls :
    Array.isArray(any.items)
      ? any.items.map((i: any) => ({ meters: i.quantity || i.meters || 0 }))
      : [];

  // ── Row 1: Jurisdiction & type ──────────────────────────────────────────
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(cfg.jurisdiction, W / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('DELIVERY CHALLAN', R, y, { align: 'right' });
  y += 4;
  if (cfg.showOriginalDuplicate) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('ORIGINAL', R, y, { align: 'right' });
    y += 4;
  }

  // ── Company name ─────────────────────────────────────────────────────────
  doc.setFontSize(18); doc.setFont('helvetica', 'bold');
  doc.text(cfg.companyName, W / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(cfg.companyAddress, W / 2, y, { align: 'center' });
  y += 4;
  const phoneLine = [
    cfg.companyPhone   ? `Phone (O): ${cfg.companyPhone}` : 'Phone (O): ',
    cfg.companyMobile  ? `(M): ${cfg.companyMobile}` : '',
    cfg.gstin          ? `GSTIN : ${cfg.gstin}` : '',
  ].filter(Boolean).join('\u00a0\u00a0\u00a0 ');
  doc.text(phoneLine, W / 2, y, { align: 'center' });
  y += 3;

  // ── Separator ─────────────────────────────────────────────────────────────
  doc.setLineWidth(0.4); doc.line(L, y, R, y); y += 4;

  // ── Customer + Challan info (two columns divided by vertical line) ────────
  const divX = L + 125;
  const infoY = y;

  // Left: Customer
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('M/s. ' + (customer.name || ''), L + 2, y);
  y += 5;

  doc.setFontSize(8.5); doc.setFont('helvetica', 'normal');
  const addrLines = doc.splitTextToSize(customer.address || '', divX - L - 4);
  doc.text(addrLines, L + 2, y);
  y += addrLines.length * 4 + 2;

  if (cfg.showGstin) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text('GSTIN : ', L + 2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(customer.gstNumber || 'N/A', L + 2 + 16, y);
  }

  // Right: Challan Info box
  let ry = infoY;
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('Challan No', divX + 2, ry + 2); doc.setFont('helvetica', 'normal');
  doc.text(': ' + challanNo, divX + 28, ry + 2);
  ry += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Date', divX + 2, ry); doc.setFont('helvetica', 'normal');
  doc.text(': ' + challanDate, divX + 28, ry);
  ry += 7;
  if (cfg.showQuality) {
    doc.setFont('helvetica', 'bold');
    doc.text('Quality', divX + 2, ry); doc.setFont('helvetica', 'normal');
    doc.text(': ' + quality, divX + 28, ry);
    ry += 7;
  }
  if (cfg.showBroker) {
    doc.setFont('helvetica', 'bold');
    doc.text('Broker', divX + 2, ry); doc.setFont('helvetica', 'normal');
    doc.text(': ' + broker, divX + 28, ry);
  }

  y = Math.max(y, ry) + 6;

  // ── Separator ─────────────────────────────────────────────────────────────
  doc.setLineWidth(0.3); doc.line(L, y, R, y); y += 4;

  // ── 4-column Rolls table ──────────────────────────────────────────────────
  const rows = Math.ceil(rolls.length / 4) || 12;   // dynamic rows based on roll count
  const srW = 12, mW = 35;                           // Sr# col, Meter col widths (per group)
  const groupW = srW + mW;
  const tableW = groupW * 4;
  const tableL = (W - tableW) / 2;   // centre the table
  const rowH = 5.5;

  // Header row
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  for (let g = 0; g < 4; g++) {
    const gx = tableL + g * groupW;
    doc.setFillColor(235, 235, 235);
    doc.rect(gx, y, srW, 6, 'FD');
    doc.rect(gx + srW, y, mW, 6, 'FD');
    doc.text('Sr #', gx + srW / 2, y + 4, { align: 'center' });
    doc.text('Meter', gx + srW + mW / 2, y + 4, { align: 'center' });
  }
  y += 6;

  // Data rows
  doc.setFont('helvetica', 'normal');
  const colSubtotals = [0, 0, 0, 0];
  for (let r = 0; r < rows; r++) {
    let x = tableL;
    for (let g = 0; g < 4; g++) {
      const rollIdx = g * rows + r;
      const roll = rolls[rollIdx];
      doc.rect(x, y, srW, rowH);
      doc.rect(x + srW, y, mW, rowH);
      if (roll) {
        doc.text(String(rollIdx + 1), x + srW / 2, y + 3.8, { align: 'center' });
        doc.text(roll.meters.toFixed(2), x + srW + mW / 2, y + 3.8, { align: 'center' });
        colSubtotals[g] += roll.meters;
      }
      x += groupW;
    }
    y += rowH;
  }

  // Subtotal row
  doc.setFont('helvetica', 'bold');
  doc.setLineWidth(0.4);
  let x = tableL;
  for (let g = 0; g < 4; g++) {
    doc.rect(x, y, srW, 5);
    doc.rect(x + srW, y, mW, 5);
    doc.text(colSubtotals[g].toFixed(2), x + srW + mW / 2, y + 3.6, { align: 'center' });
    x += groupW;
  }
  y += 8;

  // ── Totals line ───────────────────────────────────────────────────────────
  const totalMeters = rolls.reduce((s, r) => s + r.meters, 0);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold');
  doc.text('Total Taka  : ' + rolls.length, L + 2, y);
  y += 5;
  doc.text('Total Meters : ' + totalMeters.toFixed(2), L + 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text('FOR ' + cfg.companyName.toUpperCase(), R - 2, y, { align: 'right' });
  y += 8;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setLineWidth(0.3); doc.line(L, y, R, y); y += 5;
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  if (cfg.noDyeingGuarantee) doc.text('NO DYEING GUARANTEE', L + 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature of the goods receiver', W / 2, y, { align: 'center' });
  doc.text(cfg.signatureLabel, R - 2, y, { align: 'right' });
  y += 6;
  // Signature dashed lines
  (doc as any).setLineDash([1, 1], 0);
  doc.line(L + 2, y, L + 62, y);
  doc.line(W / 2 - 30, y, W / 2 + 30, y);
  doc.line(R - 62, y, R - 2, y);
  (doc as any).setLineDash([], 0);

  return doc.output('arraybuffer');
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE PDF
// ─────────────────────────────────────────────────────────────────────────────
export async function generateInvoicePDF(
  invoice: Invoice,
  customer: Customer,
  broker: Broker | null,
  _qualities: FabricQuality[],
  template?: Template | null
) {
  const cfg = resolveTemplateConfig(template);
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const L = 8, R = W - 8;
  let y = 8;

  // ── Outer page border ──────────────────────────────────────────────────────
  doc.setLineWidth(0.6);
  doc.rect(5, 5, W - 10, H - 10);
  doc.setLineWidth(0.3);

  // ── Logo (top-left) ────────────────────────────────────────────────────────
  if (cfg.logoUrl) await addLogoToPDF(doc, cfg.logoUrl, L + 1, y, 30, 15);

  const inv = invoice as any;
  const invoiceNo   = String(inv.invoiceNumber || inv.number || '');
  const challanNo   = String(inv.challanNumber || '');
  const invoiceDate = fmt(inv.invoiceDate || inv.date);
  const challanDate = fmt(inv.challanDate);
  const dueDate     = fmt(inv.dueDate);
  const brokerName  = String(inv.broker || broker?.name || 'N/A');
  const items: any[]= Array.isArray(inv.items) ? inv.items : [];

  // ── Ganesh + Original/Duplicate ────────────────────────────────────────────
  if (cfg.showGaneshHeader) {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    doc.text(':: SHREE GANESHAY NAMAH ::', W / 2, y, { align: 'center' });
  }
  if (cfg.showOriginalDuplicate) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text('Original  - For Buyer', R - 1, y, { align: 'right' });
    y += 4;
    doc.text('Duplicate - For Assessee', R - 1, y, { align: 'right' });
  }
  y += 5;

  // ── TAX INVOICE heading ────────────────────────────────────────────────────
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', W / 2, y, { align: 'center' }); y += 7;

  // ── Company name ───────────────────────────────────────────────────────────
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text(cfg.companyName, W / 2, y, { align: 'center' }); y += 7;

  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  const addrParts = doc.splitTextToSize(cfg.companyAddress, R - L - 20);
  for (const part of addrParts) { doc.text(part, W / 2, y, { align: 'center' }); y += 4; }

  const phoneParts = [
    cfg.companyPhone  ? `Phone (O): ${cfg.companyPhone}` : '',
    cfg.companyMobile ? `Mobile: ${cfg.companyMobile}` : '',
  ].filter(Boolean).join('      ');
  if (phoneParts) { doc.text(phoneParts, W / 2, y, { align: 'center' }); y += 5; }

  // ── GSTIN box (centered, fixed width) ─────────────────────────────────────
  const gstinBoxW = 110;
  const gstinBoxX = (W - gstinBoxW) / 2;
  doc.setLineWidth(0.5);
  doc.rect(gstinBoxX, y, gstinBoxW, 7);
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold');
  doc.text('GSTIN : ' + cfg.gstin, W / 2, y + 5, { align: 'center' });
  y += 10;

  // ── Separator ─────────────────────────────────────────────────────────────
  doc.setLineWidth(0.5); doc.line(L, y, R, y); y += 3;

  // ── Billed-To + Invoice info boxes ────────────────────────────────────────
  const divX = L + 112;
  const boxH = 44;
  doc.setLineWidth(0.4);
  doc.rect(L, y, divX - L, boxH);
  doc.rect(divX, y, R - divX, boxH);

  // Left box header bar
  doc.setFillColor(240, 240, 240);
  doc.rect(L, y, divX - L, 7, 'FD');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('DETAILS OF RECEIVER — BILLED TO', L + 3, y + 5);

  let ly = y + 12;
  const lRow = (label: string, val: string, valBold = false) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text(label, L + 3, ly);
    doc.setFont('helvetica', valBold ? 'bold' : 'normal'); doc.setFontSize(8);
    doc.text(val, L + 22, ly);
    ly += 5;
  };
  lRow('Name   :', customer.name || '', true);
  const addrLines2 = doc.splitTextToSize(customer.address || '', divX - L - 26);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.text('Address:', L + 3, ly);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(addrLines2[0] || '', L + 22, ly); ly += 4;
  if (addrLines2[1]) { doc.text(addrLines2[1], L + 22, ly); ly += 4; }
  lRow('State  :', (customer.state || 'Gujarat') + '   State Code : ' + cfg.companyStateCode);
  lRow('GSTIN  :', customer.gstNumber || 'N/A', true);
  lRow('Broker :', brokerName);

  // Right box header bar
  doc.setFillColor(240, 240, 240);
  doc.rect(divX, y, R - divX, 7, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('INVOICE DETAILS', divX + (R - divX) / 2, y + 5, { align: 'center' });

  let ry2 = y + 12;
  const col1 = divX + 3, col2 = divX + 32;
  const rRow = (label: string, val: string) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text(label, col1, ry2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(val, col2, ry2);
    ry2 += 6;
  };
  rRow('Invoice No.', invoiceNo);
  rRow('Invoice Date', invoiceDate);
  rRow('Challan No.', challanNo);
  rRow('Challan Date', challanDate);
  rRow('Due Date', dueDate);
  y += boxH + 2;

  // ── Items table ────────────────────────────────────────────────────────────
  const cols = { sr: 9, desc: 55, hsn: 14, taka: 15, mtr: 22, rate: 21, amt: 26 };
  const tW   = Object.values(cols).reduce((a, b) => a + b, 0);
  const tL   = L + (R - L - tW) / 2;
  const rowH = 6.5;

  const drawRow = (vals: string[], bold: boolean, rH: number, header = false) => {
    doc.setLineWidth(0.25);
    // For header rows: paint one full-width background rect, then stroke each cell individually
    if (header) {
      doc.setFillColor(210, 210, 210);
      doc.rect(tL, y, tW, rH, 'F');  // filled background, no stroke
    }
    let x = tL;
    Object.values(cols).forEach((w, i) => {
      doc.rect(x, y, w, rH, 'S');  // stroke border only (no fill, works for both header and data)
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      const v = vals[i] ?? '';
      const rightAlign = i >= 4;  // Meters, Rate, Amount columns
      if (rightAlign) doc.text(v, x + w - 1.5, y + rH - 2, { align: 'right' });
      else doc.text(v, x + 1.5, y + rH - 2);
      x += w;
    });
    y += rH;
  };

  drawRow(['Sr.', 'Description', 'HSN', 'Total Taka', 'Metres', 'Basic Rate', 'Amount'], true, rowH, true);

  items.forEach((item: any, idx: number) => {
    const desc   = String(item.description || '');
    const hsn    = String(item.hsnCode || cfg.defaultHsnCode);
    const taka   = String(item.totalTaka ?? item.quantity ?? '');
    const meters = Number(item.meters ?? item.quantity ?? 0).toFixed(2);
    const rate   = Number(item.basicRate ?? item.rate ?? 0).toFixed(3);
    const amt    = Number(item.totalAmount ?? 0).toFixed(2);
    drawRow([String(idx + 1), desc, hsn, taka, meters, rate, amt], false, rowH);
  });

  const filler = Math.max(0, 4 - items.length);
  for (let i = 0; i < filler; i++) drawRow(['', '', '', '', '', '', ''], false, rowH);
  y += 2;

  // ── Bank Details + Tax summary (side by side) ──────────────────────────────
  const sectionY = y;
  const bankW = 76, taxW = R - L - bankW - 2;
  const bankX = L, taxX = L + bankW + 2;
  const taxSectionH = 42;

  const totalBeforeTax = Number(inv.totalAmountBeforeTax ?? items.reduce((s: number, i: any) => s + Number(i.totalAmount || 0), 0));
  const cgstPct  = Number(inv.cgstPercent  ?? cfg.defaultCgstPercent);
  const sgstPct  = Number(inv.sgstPercent  ?? cfg.defaultSgstPercent);
  const igstPct  = Number(inv.igstPercent  ?? cfg.defaultIgstPercent);
  const cgstAmt  = Number(inv.cgstAmount   ?? totalBeforeTax * cgstPct / 100);
  const sgstAmt  = Number(inv.sgstAmount   ?? totalBeforeTax * sgstPct / 100);
  const igstAmt  = Number(inv.igstAmount   ?? totalBeforeTax * igstPct / 100);
  const gstTotal = cgstAmt + sgstAmt + igstAmt;
  const subTotal = Number(inv.subTotal ?? totalBeforeTax + gstTotal);
  const roundOff = Number(inv.roundOff ?? (Math.round(subTotal) - subTotal));
  const grandTotal = Number(inv.grandTotal ?? Math.round(subTotal));
  const totalMeters2 = items.reduce((s: number, i: any) => s + Number(i.meters ?? i.quantity ?? 0), 0);
  const netRate = totalMeters2 > 0 ? grandTotal / totalMeters2 : Number(inv.netRate ?? 0);

  // Bank box
  doc.setLineWidth(0.3);
  doc.rect(bankX, sectionY, bankW, taxSectionH);
  doc.setFillColor(240, 240, 240);
  doc.rect(bankX, sectionY, bankW, 7, 'FD');
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
  doc.text('-: BANK DETAILS :-', bankX + bankW / 2, sectionY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text('Bank  :  ' + cfg.bankName,  bankX + 3, sectionY + 15);
  doc.text('A/c No.:  ' + cfg.accountNo, bankX + 3, sectionY + 23);
  doc.text('IFSC  :  ' + cfg.ifscCode,  bankX + 3, sectionY + 31);
  if (cfg.upiId) {
    doc.setFontSize(7.5);
    doc.text('UPI   :  ' + cfg.upiId, bankX + 3, sectionY + 39);
  }

  // Tax box
  doc.rect(taxX, sectionY, taxW, taxSectionH);
  doc.setFillColor(240, 240, 240);
  doc.rect(taxX, sectionY, taxW, 7, 'FD');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('TAX SUMMARY', taxX + taxW / 2, sectionY + 5, { align: 'center' });

  let ty = sectionY + 12;
  const taxRight = taxX + taxW - 2;
  const taxRow = (label: string, val: string, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(7.5);
    doc.text(label, taxX + 2, ty);
    doc.text(val, taxRight, ty, { align: 'right' });
    ty += 5;
  };
  taxRow('Total Amount Before Tax', totalBeforeTax.toFixed(2));
  taxRow(`Add: CGST @ ${cgstPct.toFixed(2)} %`, cgstAmt.toFixed(2));
  taxRow(`Add: SGST @ ${sgstPct.toFixed(2)} %`, sgstAmt.toFixed(2));
  taxRow(`Add: IGST @ ${igstPct.toFixed(2)} %`, igstAmt.toFixed(2));
  doc.setLineWidth(0.2); doc.line(taxX + 1, ty, taxX + taxW - 1, ty);
  ty += 4;
  taxRow('Total GST', gstTotal.toFixed(2), true);

  y = sectionY + taxSectionH + 1;

  // Sub Total / Round Off rows (tax column only)
  doc.setLineWidth(0.3);
  doc.rect(taxX, y, taxW, 5); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text('Sub Total', taxX + 2, y + 3.6);
  doc.text(subTotal.toFixed(2), taxRight, y + 3.6, { align: 'right' }); y += 5;
  doc.rect(taxX, y, taxW, 5);
  doc.text('Round Off ' + (roundOff >= 0 ? '+' : '−'), taxX + 2, y + 3.6);
  doc.text(Math.abs(roundOff).toFixed(2), taxRight, y + 3.6, { align: 'right' }); y += 5;

  // Grand Total full-width highlighted row
  doc.setFillColor(220, 220, 220);
  doc.rect(L, y, R - L, 8, 'FD');
  doc.setLineWidth(0.5); doc.rect(L, y, R - L, 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Total Amount', L + 3, y + 5.5);
  doc.text('Rs. ' + grandTotal.toFixed(2), R - 2, y + 5.5, { align: 'right' });
  y += 11;

  // ── Net Rate + Amount in Words ─────────────────────────────────────────────
  if (cfg.showNetRate) {
    doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
    doc.text('NET RATE : ' + netRate.toFixed(2), L + 2, y); y += 5;
  }
  if (cfg.showAmountInWords) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const words = inv.amountInWords || (numberToWords(grandTotal).toUpperCase() + ' ONLY');
    doc.text('* ' + words, L + 2, y); y += 9;
  } else {
    y += 4;
  }

  // ── Received/Paid + Signature ──────────────────────────────────────────────
  doc.setLineWidth(0.3);
  if (cfg.showReceivedBox) {
    const pdBox = y;
    doc.rect(L, pdBox, 88, 32);
    doc.rect(L + 90, pdBox, R - L - 90, 32);

    // Received header
    doc.setFillColor(240, 240, 240);
    doc.rect(L, pdBox, 88, 7, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Received / Paid Details', L + 3, pdBox + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    ['Bill No.', 'Amount', 'Ch. No.', 'Bank', 'Date'].forEach((f, i) => {
      const fy = pdBox + 12 + i * 4;
      doc.text(f, L + 3, fy);
      doc.line(L + 20, fy + 0.5, L + 86, fy + 0.5);
    });

    // Signature header
    const sigX = L + 90, sigW = R - L - 90;
    doc.setFillColor(240, 240, 240);
    doc.rect(sigX, pdBox, sigW, 7, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('FOR  ' + cfg.companyName.toUpperCase(), sigX + sigW / 2, pdBox + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(cfg.signatureLabel, sigX + sigW / 2, pdBox + 28, { align: 'center' });
    y = pdBox + 35;
  } else {
    // Signature box only
    const sigX = L, sigW = R - L;
    doc.rect(sigX, y, sigW, 20);
    doc.setFillColor(240, 240, 240);
    doc.rect(sigX, y, sigW, 7, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('FOR  ' + cfg.companyName.toUpperCase(), sigX + sigW / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.text(cfg.signatureLabel, sigX + sigW / 2, y + 17, { align: 'center' });
    y += 23;
  }

  // ── Terms of Sale ──────────────────────────────────────────────────────────
  if (cfg.showTerms) {
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text('TERMS OF SALE :', L + 2, y); y += 3.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
    const termLines: string[] = cfg.customTerms
      ? cfg.customTerms.split('\n').filter(Boolean)
      : DEFAULT_TERMS;
    termLines.forEach((t, i) => {
      doc.text(`${i + 1}) ${t.replace(/^\d+[.)]\s*/, '')}`, L + 2, y);
      y += 3.2;
    });
    y += 1;
  }

  if (cfg.noDyeingGuarantee) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('NO DYEING GUARANTEE', R - 2, y, { align: 'right' });
  }

  if (cfg.footerNote) {
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(cfg.footerNote, L + 2, y);
  }

  return doc.output('arraybuffer');
}
