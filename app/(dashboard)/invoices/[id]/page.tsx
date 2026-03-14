'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Invoice, Customer, Broker, FabricQuality, Template } from '@/types';
import { getInvoice, getCustomer, getBroker, getFabricQualities, deleteInvoice, getTemplates } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ChevronLeft, Download, Edit2, Trash2 } from 'lucide-react';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { generateInvoiceExcel } from '@/lib/excel-generator';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [broker, setBroker] = useState<Broker | null>(null);
  const [qualities, setQualities] = useState<FabricQuality[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [invoiceId]);

  const loadData = async () => {
    try {
      const [invoiceData, qualitiesData, templatesData] = await Promise.all([
        getInvoice(invoiceId),
        getFabricQualities(),
        getTemplates(),
      ]);
      if (invoiceData) {
        setInvoice(invoiceData);
        const customerData = await getCustomer(invoiceData.customerId);
        if (customerData) setCustomer(customerData);
        if ((invoiceData as any).brokerId) {
          const brokerData = await getBroker((invoiceData as any).brokerId);
          if (brokerData) setBroker(brokerData);
        }
        setQualities(qualitiesData);
      }
      setTemplates(templatesData.filter((t: any) => !t.type || t.type === 'invoice'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!invoice || !customer) { toast.error('Invoice or customer data not available'); return; }
    try {
      const tpl = selectedTemplateId !== 'default' ? templates.find(t => t.id === selectedTemplateId) ?? null : null;
      const pdfData = await generateInvoicePDF(invoice, customer, broker, qualities, tpl);
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const inv = invoice as any;
      const no = inv.invoiceNumber || inv.number || invoice.id;
      a.download = `Invoice-${no}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Invoice PDF generated successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExcel = async () => {
    if (!invoice || !customer) { toast.error('Invoice or customer data not available'); return; }
    try {
      generateInvoiceExcel(invoice, customer, qualities);
      toast.success('Invoice Excel generated successfully!');
    } catch (error) {
      toast.error('Failed to generate Excel: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice(invoiceId);
      toast.success('Invoice deleted successfully!');
      router.push('/invoices');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete invoice. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><p className="text-lg font-semibold">Loading...</p></div>;
  }
  if (!invoice || !customer) {
    return <div className="p-8"><p className="text-red-500">Invoice not found</p></div>;
  }

  const inv = invoice as any;
  const invoiceNo = inv.invoiceNumber || inv.number || '';
  const invoiceDate = inv.invoiceDate instanceof Date
    ? inv.invoiceDate.toLocaleDateString('en-GB')
    : inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-GB') : 'N/A';
  const challanNo = inv.challanNumber || '';
  const challanDate = inv.challanDate instanceof Date
    ? inv.challanDate.toLocaleDateString('en-GB')
    : inv.challanDate ? new Date(inv.challanDate).toLocaleDateString('en-GB') : '';
  const dueDate = inv.dueDate instanceof Date
    ? inv.dueDate.toLocaleDateString('en-GB')
    : inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-GB') : '';
  const brokerName = inv.broker || broker?.name || 'N/A';

  // New item structure
  const items: any[] = Array.isArray(inv.items) ? inv.items : [];
  const grandTotal: number = inv.grandTotal ?? items.reduce((s: number, i: any) => s + (i.totalAmount ?? 0), 0);
  const cgstPct: number = inv.cgstPercent ?? 2.5;
  const sgstPct: number = inv.sgstPercent ?? 2.5;
  const igstPct: number = inv.igstPercent ?? 0;
  const totalBeforeTax: number = inv.totalAmountBeforeTax ?? items.reduce((s: number, i: any) => s + (i.totalAmount ?? 0), 0);
  const cgstAmt: number = inv.cgstAmount ?? (totalBeforeTax * cgstPct / 100);
  const sgstAmt: number = inv.sgstAmount ?? (totalBeforeTax * sgstPct / 100);
  const igstAmt: number = inv.igstAmount ?? (totalBeforeTax * igstPct / 100);
  const subTotal: number = inv.subTotal ?? (totalBeforeTax + cgstAmt + sgstAmt + igstAmt);
  const roundOff: number = inv.roundOff ?? 0;
  const netRate: number = inv.netRate ?? 0;
  const amountInWords: string = inv.amountInWords ?? '';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Invoice {invoiceNo}</h1>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Built-in (Default)</SelectItem>
              {templates.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Link href={`/invoices/${invoiceId}/edit`}>
            <Button variant="outline" size="default">
              <Edit2 className="w-4 h-4 mr-2" />Edit
            </Button>
          </Link>
          <Button variant="default" size="default" onClick={handlePDF}>
            <Download className="w-4 h-4 mr-2" />Download PDF
          </Button>
          <Button variant="outline" size="default" onClick={handleExcel}>
            <Download className="w-4 h-4 mr-2" />Excel
          </Button>
          <Button variant="destructive" size="default" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />Delete
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500">Invoice No.</p>
          <p className="text-xl font-bold">{invoiceNo}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Invoice Date</p>
          <p className="text-xl font-bold">{invoiceDate}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Grand Total</p>
          <p className="text-xl font-bold text-green-600">₹{grandTotal.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-xl font-bold capitalize">{invoice.status || 'pending'}</p>
        </Card>
      </div>

      {/* BILLED TO + Invoice info */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Billed To</p>
            <p className="text-lg font-semibold">{customer.name}</p>
            <p className="text-sm text-gray-600 mt-1">{customer.address}</p>
            {(customer as any).state && <p className="text-sm text-gray-600">State: {(customer as any).state}</p>}
            <p className="text-sm text-gray-600">GSTIN: {customer.gstNumber || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Challan No.:</span>
            <span className="font-medium">{challanNo || 'N/A'}</span>
            <span className="text-gray-500">Challan Date:</span>
            <span className="font-medium">{challanDate || 'N/A'}</span>
            <span className="text-gray-500">Due Date:</span>
            <span className="font-medium">{dueDate || 'N/A'}</span>
            <span className="text-gray-500">Broker:</span>
            <span className="font-medium">{brokerName}</span>
          </div>
        </div>
      </Card>

      {/* Items table */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Items</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sr.</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>HSN Code</TableHead>
                <TableHead className="text-right">Total Taka</TableHead>
                <TableHead className="text-right">Meters</TableHead>
                <TableHead className="text-right">Basic Rate</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">No items found</TableCell>
                </TableRow>
              ) : (
                items.map((item: any, idx: number) => (
                  <TableRow key={item.id || idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{item.description || item.qualityId || 'N/A'}</TableCell>
                    <TableCell>{item.hsnCode || '5407'}</TableCell>
                    <TableCell className="text-right">{item.totalTaka ?? item.quantity ?? 0}</TableCell>
                    <TableCell className="text-right">{(item.meters ?? item.quantity ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(item.basicRate ?? item.rate ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{(item.totalAmount ?? ((item.meters ?? 0) * (item.basicRate ?? item.rate ?? 0))).toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Tax breakdown */}
        <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm border-t pt-4">
          <div className="flex justify-between">
            <span>Amount Before Tax:</span>
            <span>₹{totalBeforeTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST ({cgstPct}%):</span>
            <span>₹{cgstAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST ({sgstPct}%):</span>
            <span>₹{sgstAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IGST ({igstPct}%):</span>
            <span>₹{igstAmt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span>Sub Total:</span>
            <span>₹{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Round Off:</span>
            <span>₹{roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Grand Total:</span>
            <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
          </div>
          {netRate > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Net Rate:</span>
              <span>₹{netRate.toFixed(2)}</span>
            </div>
          )}
        </div>

        {amountInWords && (
          <p className="mt-4 text-sm text-gray-600 italic">In Words: {amountInWords}</p>
        )}
      </Card>

      {invoice.remarks && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Remarks</h3>
          <p className="text-gray-700">{invoice.remarks}</p>
        </Card>
      )}
    </div>
  );
}
