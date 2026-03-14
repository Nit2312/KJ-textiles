'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCustomers, getChallans, getInvoices } from '@/lib/firestore';
import { Customer, Challan, Invoice } from '@/types';
import Link from 'next/link';
import { Users, FileText, Receipt, TrendingUp, Package, IndianRupee } from 'lucide-react';

function getInvoiceTotal(inv: any): number {
  if (inv.grandTotal != null) return Number(inv.grandTotal);
  if (inv.totalAmountBeforeTax != null)
    return Number(inv.totalAmountBeforeTax) + Number(inv.cgstAmount ?? 0) + Number(inv.sgstAmount ?? 0) + Number(inv.igstAmount ?? 0);
  if (inv.items?.length)
    return inv.items.reduce((s: number, i: any) => s + (Number(i.totalAmount) || Number(i.quantity ?? 0) * Number(i.rate ?? 0)), 0);
  return 0;
}

function getInvoiceGST(inv: any): number {
  const sum = Number(inv.cgstAmount ?? 0) + Number(inv.sgstAmount ?? 0) + Number(inv.igstAmount ?? 0);
  if (sum > 0) return sum;
  if (inv.items?.length)
    return inv.items.reduce((s: number, i: any) => s + ((Number(i.totalAmount) || 0) * (Number(i.gst ?? 0) / 100)), 0);
  return 0;
}

function parseDate(val: any): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val?.toDate) return val.toDate();
  return new Date(val);
}

function fmtDate(val: any): string {
  const d = parseDate(val);
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' });
}

function fmtCurrency(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [c, ch, inv] = await Promise.all([getCustomers(), getChallans(), getInvoices()]);
        setCustomers(c);
        setChallans(ch);
        setInvoices(inv);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyInvoices = invoices.filter((inv) => {
    const d = parseDate((inv as any).invoiceDate || (inv as any).date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalSalesAllTime = invoices.reduce((s, inv) => s + getInvoiceTotal(inv), 0);
  const totalGSTAllTime   = invoices.reduce((s, inv) => s + getInvoiceGST(inv), 0);
  const monthlySales      = monthlyInvoices.reduce((s, inv) => s + getInvoiceTotal(inv), 0);
  const monthlyGST        = monthlyInvoices.reduce((s, inv) => s + getInvoiceGST(inv), 0);

  // Total meters dispatched across all challans
  const totalMeters = challans.reduce((s, ch: any) => {
    if (ch.totalMeters != null) return s + Number(ch.totalMeters);
    if (Array.isArray(ch.rolls)) return s + ch.rolls.reduce((rs: number, r: any) => rs + Number(r.meters || 0), 0);
    return s;
  }, 0);

  const statCards = [
    { label: 'Total Customers',    value: customers.length,              sub: 'registered',       icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/customers' },
    { label: 'Total Challans',     value: challans.length,               sub: 'dispatched',        icon: Package,      color: 'text-orange-600', bg: 'bg-orange-50', href: '/challans' },
    { label: 'Total Invoices',     value: invoices.length,               sub: 'generated',         icon: Receipt,      color: 'text-purple-600', bg: 'bg-purple-50', href: '/invoices' },
    { label: 'Total Meters',       value: totalMeters.toFixed(1) + ' m', sub: 'dispatched',        icon: FileText,     color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/challans' },
    { label: 'Total Sales',        value: fmtCurrency(totalSalesAllTime),sub: 'all time',          icon: IndianRupee,  color: 'text-green-600',  bg: 'bg-green-50',  href: '/invoices' },
    { label: 'Total GST Collected',value: fmtCurrency(totalGSTAllTime),  sub: 'all time',          icon: TrendingUp,   color: 'text-red-600',    bg: 'bg-red-50',    href: '/reports' },
    { label: 'This Month Sales',   value: fmtCurrency(monthlySales),     sub: now.toLocaleString('default', { month: 'long' }), icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50', href: '/invoices' },
    { label: 'This Month GST',     value: fmtCurrency(monthlyGST),       sub: now.toLocaleString('default', { month: 'long' }), icon: TrendingUp,  color: 'text-red-700',   bg: 'bg-red-50',   href: '/reports' },
  ];

  // Recent records (last 5 by date)
  const recentInvoices = [...invoices]
    .sort((a, b) => parseDate((b as any).invoiceDate || (b as any).date).getTime() - parseDate((a as any).invoiceDate || (a as any).date).getTime())
    .slice(0, 5);

  const recentChallans = [...challans]
    .sort((a, b) => parseDate((b as any).challanDate || (b as any).date).getTime() - parseDate((a as any).challanDate || (a as any).date).getTime())
    .slice(0, 5);

  const getCustomerName = (id: string) => customers.find((c) => c.id === id)?.name || customers.find((c) => c.id === id)?.businessName || id;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-400">Loading data…</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-gray-500 leading-tight">{s.label}</CardTitle>
                    <div className={`w-8 h-8 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl font-bold text-gray-900 truncate">{s.value}</div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Invoices</CardTitle>
            <Link href="/invoices" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-4">No invoices yet.</p>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((inv: any) => (
                  <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        #{inv.invoiceNumber || inv.number || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{getCustomerName(inv.customerId)}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-gray-900">{fmtCurrency(getInvoiceTotal(inv))}</p>
                      <p className="text-xs text-gray-400">{fmtDate(inv.invoiceDate || inv.date)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Challans */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Challans</CardTitle>
            <Link href="/challans" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </CardHeader>
          <CardContent className="p-0">
            {recentChallans.length === 0 ? (
              <p className="text-sm text-gray-400 px-6 py-4">No challans yet.</p>
            ) : (
              <div className="divide-y">
                {recentChallans.map((ch: any) => {
                  const taka = ch.totalTaka ?? ch.rolls?.length ?? 0;
                  const meters = ch.totalMeters ?? ch.rolls?.reduce((s: number, r: any) => s + Number(r.meters || 0), 0) ?? 0;
                  return (
                    <Link key={ch.id} href={`/challans/${ch.id}`} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          #{ch.challanNumber || ch.number || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{getCustomerName(ch.customerId)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-semibold text-gray-900">{taka} taka · {Number(meters).toFixed(1)} m</p>
                        <p className="text-xs text-gray-400">{fmtDate(ch.challanDate || ch.date)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

