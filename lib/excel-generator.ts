import * as XLSX from 'xlsx';
import { Challan, Invoice, Customer, FabricQuality } from '@/types';

export function generateChallanExcel(
  challan: Challan,
  customer: Customer,
  _qualities: FabricQuality[]
) {
  const any = challan as any;
  const challanNo = any.challanNumber || any.number || '';
  const challanDate = any.challanDate instanceof Date
    ? any.challanDate.toLocaleDateString('en-GB')
    : any.challanDate || '';
  const quality = any.quality || any.qualityName || '';
  const broker = any.broker || any.brokerName || '';
  const rolls: { meters: number }[] = Array.isArray(any.rolls)
    ? any.rolls
    : Array.isArray(any.items)
      ? any.items.map((i: any) => ({ meters: i.quantity || i.meters || 0 }))
      : [];
  const totalMeters = rolls.reduce((s, r) => s + r.meters, 0);

  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: any[][] = [
    ['DELIVERY CHALLAN'],
    [],
    ['Challan Number', challanNo],
    ['Date', challanDate],
    ['Customer', customer.name],
    ['Address', customer.address],
    ['GSTIN', customer.gstNumber || ''],
    ['Quality', quality],
    ['Broker', broker],
    ['Total Taka', rolls.length],
    ['Total Meters', totalMeters],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Rolls sheet
  const rollsData: any[][] = [
    ['Sr #', 'Meters'],
    ...rolls.map((r, i) => [i + 1, r.meters]),
    [],
    ['Total Taka', rolls.length],
    ['Total Meters', totalMeters],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rollsData), 'Rolls');

  XLSX.writeFile(workbook, `Challan-${challanNo || 'export'}.xlsx`);
}

export function generateInvoiceExcel(
  invoice: Invoice,
  customer: Customer,
  _qualities: FabricQuality[]
) {
  const any = invoice as any;
  const invoiceNo = any.invoiceNumber || any.number || '';
  const invoiceDate = any.invoiceDate instanceof Date
    ? any.invoiceDate.toLocaleDateString('en-GB')
    : any.invoiceDate || '';
  const dueDate = any.dueDate instanceof Date
    ? any.dueDate.toLocaleDateString('en-GB')
    : any.dueDate || '';
  const broker = any.broker || '';
  const items: any[] = Array.isArray(any.items) ? any.items : [];

  const workbook = XLSX.utils.book_new();

  // Summary sheet
  const summaryData: any[][] = [
    ['TAX INVOICE'],
    [],
    ['Invoice Number', invoiceNo],
    ['Invoice Date', invoiceDate],
    ['Challan No.', any.challanNumber || ''],
    ['Due Date', dueDate],
    ['Customer', customer.name],
    ['Address', customer.address],
    ['GSTIN', customer.gstNumber || ''],
    ['Broker', broker],
    [],
    ['Total Amount Before Tax', any.totalAmountBeforeTax ?? ''],
    [`CGST ${any.cgstPercent ?? 2.5}%`, any.cgstAmount ?? ''],
    [`SGST ${any.sgstPercent ?? 2.5}%`, any.sgstAmount ?? ''],
    [`IGST ${any.igstPercent ?? 0}%`, any.igstAmount ?? ''],
    ['Sub Total', any.subTotal ?? ''],
    ['Round Off', any.roundOff ?? ''],
    ['Total Amount', any.grandTotal ?? ''],
    ['Net Rate', any.netRate ?? ''],
    ['Amount in Words', any.amountInWords ?? ''],
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

  // Items sheet
  const itemsData: any[][] = [
    ['Sr.', 'Description', 'HSN Code', 'Total Taka', 'Meters', 'Basic Rate', 'Total Amount'],
    ...items.map((item: any, i: number) => [
      i + 1,
      item.description || '',
      item.hsnCode || '5407',
      item.totalTaka ?? 0,
      item.meters ?? 0,
      item.basicRate ?? 0,
      item.totalAmount ?? 0,
    ]),
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(itemsData), 'Items');

  XLSX.writeFile(workbook, `Invoice-${invoiceNo || 'export'}.xlsx`);
}

export function generateReportExcel(
  reportData: {
    name: string;
    data: Record<string, any>[];
  }[]
) {
  const workbook = XLSX.utils.book_new();
  reportData.forEach(({ name, data }) => {
    if (data.length > 0) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data), name);
    }
  });
  XLSX.writeFile(workbook, `Report-${new Date().toISOString().split('T')[0]}.xlsx`);
}

