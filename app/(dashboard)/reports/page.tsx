'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Challan, Invoice } from '@/types';
import { getChallans, getInvoices, getDashboardSnapshot } from '@/lib/firestore';
import { generateReportExcel } from '@/lib/excel-generator';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [stats, setStats] = useState<{ invoiceCount: number; challanCount: number; totalSales: number; totalGST: number } | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const snap = await getDashboardSnapshot();
      setStats({
        invoiceCount: snap.counts.invoices,
        challanCount: snap.counts.challans,
        totalSales: snap.totals.sales,
        totalGST: snap.totals.gst,
      });
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const ensureDataLoaded = async () => {
    if (invoices.length && challans.length) return;
    try {
      setIsLoadingData(true);
      const [challanData, invoiceData] = await Promise.all([getChallans(), getInvoices()]);
      setChallans(challanData);
      setInvoices(invoiceData);
    } finally {
      setIsLoadingData(false);
    }
  };

  const getInvoiceTotal = (inv: any): number => {
    if (inv.grandTotal != null) return inv.grandTotal;
    if (inv.totalAmountBeforeTax != null) {
      return inv.totalAmountBeforeTax + (inv.cgstAmount ?? 0) + (inv.sgstAmount ?? 0) + (inv.igstAmount ?? 0);
    }
    if (inv.items?.length) {
      return inv.items.reduce((s: number, i: any) => s + (i.totalAmount || (i.quantity ?? 0) * (i.rate ?? 0)), 0);
    }
    return 0;
  };

  const getInvoiceGST = (inv: any): number => {
    const cg = inv.cgstAmount ?? 0;
    const sg = inv.sgstAmount ?? 0;
    const ig = inv.igstAmount ?? 0;
    if (cg + sg + ig > 0) return cg + sg + ig;
    if (inv.items?.length) {
      return inv.items.reduce((s: number, i: any) => s + ((i.totalAmount || (i.quantity ?? 0) * (i.rate ?? 0)) * ((i.gst ?? 0) / 100)), 0);
    }
    return 0;
  };

  const totalSales = stats?.totalSales ?? invoices.reduce((sum, inv) => sum + getInvoiceTotal(inv), 0);
  const totalGST = stats?.totalGST ?? invoices.reduce((sum, inv) => sum + getInvoiceGST(inv), 0);

  const statsArr = [
    { label: 'Total Invoices', value: stats?.invoiceCount ?? invoices.length },
    { label: 'Total Challans', value: stats?.challanCount ?? challans.length },
    { label: 'Total Sales', value: `₹${totalSales.toFixed(2)}` },
    { label: 'Total GST', value: `₹${totalGST.toFixed(2)}` },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">View business analytics and generate reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsArr.map((stat, index) => (
          <Card key={index} className="p-6">
            <p className="text-sm text-gray-600 mb-2">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Invoices Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export all invoices with GST details and breakdowns.
          </p>
          <Button 
            className="w-full"
            disabled={isLoadingStats || isLoadingData}
            onClick={async () => {
              await ensureDataLoaded();
              generateReportExcel([{
                name: 'Invoices',
                data: invoices.map((inv: any) => ({
                  'Invoice Number': inv.invoiceNumber || inv.number || 'N/A',
                  'Date': inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-GB') : 'N/A',
                  'Customer ID': inv.customerId,
                  'Taxable Amount': (inv.totalAmountBeforeTax ?? getInvoiceTotal(inv)).toFixed(2),
                  'CGST': (inv.cgstAmount ?? 0).toFixed(2),
                  'SGST': (inv.sgstAmount ?? 0).toFixed(2),
                  'IGST': (inv.igstAmount ?? 0).toFixed(2),
                  'Grand Total': getInvoiceTotal(inv).toFixed(2),
                  'Status': inv.status || 'draft',
                }))
              }]);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoadingData ? 'Loading…' : 'Export to Excel'}
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Challans Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            View and export all delivery challans.
          </p>
          <Button 
            className="w-full"
            disabled={isLoadingStats || isLoadingData}
            onClick={async () => {
              await ensureDataLoaded();
              generateReportExcel([{
                name: 'Challans',
                data: challans.map((ch: any) => ({
                  'Challan Number': ch.challanNumber || ch.number || 'N/A',
                  'Date': (ch.challanDate || ch.date) ? new Date(ch.challanDate || ch.date).toLocaleDateString('en-GB') : 'N/A',
                  'Customer ID': ch.customerId,
                  'Quality': ch.quality || ch.qualityName || 'N/A',
                  'Broker': ch.broker || ch.brokerName || 'N/A',
                  'Total Taka': ch.totalTaka ?? ch.rolls?.length ?? (ch.items?.length ?? 0),
                  'Total Meters': ch.totalMeters ?? ch.rolls?.reduce((s: number, r: any) => s + (r.meters || 0), 0) ?? 0,
                }))
              }]);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            {isLoadingData ? 'Loading…' : 'Export to Excel'}
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Combined Report</h3>
          <p className="text-sm text-gray-600 mb-4">
            Export comprehensive business report with all data.
          </p>
          <Button 
            className="w-full"
            onClick={() => {
              generateReportExcel([
                {
                  name: 'Summary',
                  data: [{
                    'Metric': 'Total Invoices',
                    'Value': stats?.invoiceCount ?? invoices.length
                  }, {
                    'Metric': 'Total Challans',
                    'Value': stats?.challanCount ?? challans.length
                  }, {
                    'Metric': 'Total Sales (₹)',
                    'Value': totalSales.toFixed(2)
                  }, {
                    'Metric': 'Total GST (₹)',
                    'Value': totalGST.toFixed(2)
                  }]
                }
              ]);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </Card>
      </div>
    </div>
  );
}
