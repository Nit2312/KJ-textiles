'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Invoice, Customer } from '@/types';
import { Plus } from 'lucide-react';
import { getInvoices, deleteInvoice, getCustomers } from '@/lib/firestore';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Trash2, Eye, Edit } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const [invoiceData, customerData] = await Promise.all([
        getInvoices(),
        getCustomers()
      ]);
      setInvoices(invoiceData);
      setCustomers(customerData);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load invoices. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || customer?.businessName || 'Unknown Customer';
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await deleteInvoice(id);
      setInvoices(invoices.filter((i) => i.id !== id));
      toast.success('Invoice deleted successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete invoice. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">Manage GST invoices</p>
        </div>
        <Link href="/invoices/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Invoices ({invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => {
                    const inv = invoice as any;
                    // Use pre-calculated totals stored on the invoice (new format)
                    const subtotal = inv.totalAmountBeforeTax
                      ?? (invoice.items ? invoice.items.reduce((s: number, i: any) => s + (i.totalAmount || (i.quantity ?? 0) * (i.rate ?? 0)), 0) : 0);
                    const gstTotal = (inv.cgstAmount ?? 0) + (inv.sgstAmount ?? 0) + (inv.igstAmount ?? 0);
                    const total = inv.grandTotal ?? (subtotal + gstTotal);
                    const invoiceDate = inv.invoiceDate || invoice.date;
                    const invoiceNumber = inv.invoiceNumber || invoice.number;
                    
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoiceNumber || 'N/A'}</TableCell>
                        <TableCell>{invoiceDate instanceof Date ? invoiceDate.toLocaleDateString('en-GB') : new Date(invoiceDate).toLocaleDateString('en-GB')}</TableCell>
                        <TableCell>{getCustomerName(invoice.customerId)}</TableCell>
                        <TableCell>₹{subtotal.toFixed(2)}</TableCell>
                        <TableCell>₹{gstTotal.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">₹{total.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/invoices/${invoice.id}`}>
                              <Button variant="ghost" size="sm" title="View Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/invoices/${invoice.id}/edit`}>
                              <Button variant="ghost" size="sm" title="Edit Invoice">
                                <Edit className="w-4 h-4 text-blue-500" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(invoice.id)}
                              title="Delete Invoice"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
