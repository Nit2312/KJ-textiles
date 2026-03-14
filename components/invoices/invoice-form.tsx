'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Customer, FabricQuality } from '@/types';
import { createInvoice, updateInvoice, getInvoice, getCustomers, getFabricQualities } from '@/lib/firestore';
import { numberToWords } from '@/lib/calculations';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceItem {
  id: string;
  description: string;
  hsnCode: string;
  totalTaka: number;
  meters: number;
  basicRate: number;
  totalAmount: number;
}

const defaultItem = (): InvoiceItem => ({
  id: Date.now().toString(),
  description: '',
  hsnCode: '5407',
  totalTaka: 0,
  meters: 0,
  basicRate: 0,
  totalAmount: 0,
});

export function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [qualities, setQualities] = useState<FabricQuality[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [broker, setBroker] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [challanNumber, setChallanNumber] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([defaultItem()]);
  const [cgstPercent, setCgstPercent] = useState(2.5);
  const [sgstPercent, setSgstPercent] = useState(2.5);
  const [igstPercent, setIgstPercent] = useState(0);
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersData, qualitiesData] = await Promise.all([
          getCustomers(),
          getFabricQualities(),
        ]);
        setCustomers(customersData);
        setQualities(qualitiesData);

        if (invoiceId) {
          console.log('Loading invoice with ID:', invoiceId);
          const invoice = await getInvoice(invoiceId);
          console.log('Invoice loaded:', invoice);
          if (invoice) {
            setCustomerId(invoice.customerId);
            setBroker((invoice as any).broker || '');
            setInvoiceNumber((invoice as any).invoiceNumber || (invoice as any).number || '');
            setInvoiceDate(
              invoice.invoiceDate instanceof Date
                ? invoice.invoiceDate.toISOString().split('T')[0]
                : (invoice.invoiceDate as any) || new Date().toISOString().split('T')[0]
            );
            setChallanNumber((invoice as any).challanNumber || '');
            const cDate = (invoice as any).challanDate;
            setChallanDate(
              cDate instanceof Date
                ? cDate.toISOString().split('T')[0]
                : cDate || new Date().toISOString().split('T')[0]
            );
            setDueDate(
              invoice.dueDate instanceof Date
                ? invoice.dueDate.toISOString().split('T')[0]
                : (invoice.dueDate as any) || ''
            );

            // Map items — support both new and legacy formats
            if (invoice.items && invoice.items.length > 0) {
              setItems(invoice.items.map((item: any) => ({
                id: item.id || Date.now().toString(),
                description: item.description || '',
                hsnCode: item.hsnCode || '5407',
                totalTaka: item.totalTaka ?? item.quantity ?? 0,
                meters: item.meters ?? item.quantity ?? 0,
                basicRate: item.basicRate ?? item.rate ?? 0,
                totalAmount: item.totalAmount ?? ((item.meters ?? item.quantity ?? 0) * (item.basicRate ?? item.rate ?? 0)),
              })));
            }

            setCgstPercent((invoice as any).cgstPercent ?? 2.5);
            setSgstPercent((invoice as any).sgstPercent ?? 2.5);
            setIgstPercent((invoice as any).igstPercent ?? 0);
            setRemarks(invoice.remarks || '');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [invoiceId]);

  const addItem = () => setItems([...items, defaultItem()]);
  const removeItem = (id: string) => setItems(items.filter((i) => i.id !== id));
  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'meters' || field === 'basicRate') {
        updated.totalAmount = updated.meters * updated.basicRate;
      }
      return updated;
    }));
  };

  // Live tax calculations
  const totalBeforeTax = items.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const cgstAmount = totalBeforeTax * (cgstPercent / 100);
  const sgstAmount = totalBeforeTax * (sgstPercent / 100);
  const igstAmount = totalBeforeTax * (igstPercent / 100);
  const subTotal = totalBeforeTax + cgstAmount + sgstAmount + igstAmount;
  const roundOff = Math.round(subTotal) - subTotal;
  const grandTotal = Math.round(subTotal);
  const totalMeters = items.reduce((s, i) => s + (i.meters || 0), 0);
  const netRate = totalMeters > 0 ? grandTotal / totalMeters : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error('Please select a customer'); return; }
    setLoading(true);

    try {
      const invoiceData: any = {
        id: invoiceId || '',
        customerId,
        broker,
        invoiceNumber,
        invoiceDate,
        challanNumber,
        challanDate,
        dueDate,
        items,
        cgstPercent,
        sgstPercent,
        igstPercent,
        totalAmountBeforeTax: totalBeforeTax,
        cgstAmount,
        sgstAmount,
        igstAmount,
        subTotal,
        roundOff,
        grandTotal,
        netRate,
        amountInWords: numberToWords(grandTotal),
        remarks,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (invoiceId) {
        await updateInvoice(invoiceId, invoiceData);
      } else {
        await createInvoice(invoiceData);
      }

      toast.success(invoiceId ? 'Invoice updated successfully!' : 'Invoice created successfully!');
      router.push('/invoices');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error(error?.message || 'Failed to save invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Invoice Details */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Invoice Number</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                placeholder="70"
              />
            </div>
            <div>
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Challan No. (Reference)</Label>
              <Input
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                placeholder="70"
              />
            </div>
            <div>
              <Label>Challan Date</Label>
              <Input
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Broker</Label>
              <Input
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="TARACHANDJI"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label>Customer</Label>
              <Select value={customerId || undefined} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Line Items</h3>
            <Button type="button" onClick={addItem} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>HSN Code</TableHead>
                  <TableHead>Total Taka</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead>Basic Rate</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Select
                        value={item.description || undefined}
                        onValueChange={(v) => updateItem(item.id, 'description', v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualities.map((q) => (
                            <SelectItem key={q.id} value={q.name}>{q.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                        className="w-20"
                        placeholder="5407"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        value={item.totalTaka || ''}
                        onChange={(e) => updateItem(item.id, 'totalTaka', parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.meters || ''}
                        onChange={(e) => updateItem(item.id, 'meters', parseFloat(e.target.value) || 0)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        value={item.basicRate || ''}
                        onChange={(e) => updateItem(item.id, 'basicRate', parseFloat(e.target.value) || 0)}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{(item.totalAmount || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Tax & Summary */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Tax & Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <Label>CGST %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={cgstPercent}
                onChange={(e) => setCgstPercent(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>SGST %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={sgstPercent}
                onChange={(e) => setSgstPercent(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>IGST %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={igstPercent}
                onChange={(e) => setIgstPercent(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2 max-w-xs ml-auto text-sm">
            <div className="flex justify-between">
              <span>Total Amount Before Tax:</span>
              <span>₹{totalBeforeTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Add: CGST {cgstPercent}%:</span>
              <span>₹{cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Add: SGST {sgstPercent}%:</span>
              <span>₹{sgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Add: IGST {igstPercent}%:</span>
              <span>₹{igstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Sub Total:</span>
              <span>₹{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Round Off:</span>
              <span>{roundOff >= 0 ? '+' : ''}₹{Math.abs(roundOff).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2">
              <span>Total Amount:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Net Rate (per meter):</span>
              <span>₹{netRate.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Remarks */}
        <Card className="p-4 sm:p-6">
          <Label>Remarks</Label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional remarks..."
            rows={2}
            className="mt-2"
          />
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Saving...' : invoiceId ? 'Update Invoice' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
