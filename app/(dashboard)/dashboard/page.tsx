'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getDashboardSnapshot, DashboardSnapshot } from '@/lib/firestore';
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
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const s = await getDashboardSnapshot();
        setSnapshot(s);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const now = new Date();
  const counts = snapshot?.counts ?? { customers: 0, challans: 0, invoices: 0 };
  const totals = snapshot?.totals ?? { sales: 0, gst: 0, meters: 0 };
  const monthly = snapshot?.monthly ?? { sales: 0, gst: 0 };

  const statCards = [
    { label: 'Total Customers',    value: counts.customers,                 sub: 'registered',       icon: Users,        color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/customers' },
    { label: 'Total Challans',     value: counts.challans,                  sub: 'dispatched',       icon: Package,      color: 'text-orange-600', bg: 'bg-orange-50', href: '/challans' },
    { label: 'Total Invoices',     value: counts.invoices,                  sub: 'generated',        icon: Receipt,      color: 'text-purple-600', bg: 'bg-purple-50', href: '/invoices' },
    { label: 'Total Meters',       value: totals.meters.toFixed(1) + ' m',  sub: 'dispatched',       icon: FileText,     color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/challans' },
    { label: 'Total Sales',        value: fmtCurrency(totals.sales),        sub: 'all time',         icon: IndianRupee,  color: 'text-green-600',  bg: 'bg-green-50',  href: '/invoices' },
    { label: 'Total GST Collected',value: fmtCurrency(totals.gst),          sub: 'all time',         icon: TrendingUp,   color: 'text-red-600',    bg: 'bg-red-50',    href: '/reports' },
    { label: 'This Month Sales',   value: fmtCurrency(monthly.sales),       sub: now.toLocaleString('default', { month: 'long' }), icon: IndianRupee, color: 'text-green-700', bg: 'bg-green-50', href: '/invoices' },
    { label: 'This Month GST',     value: fmtCurrency(monthly.gst),         sub: now.toLocaleString('default', { month: 'long' }), icon: TrendingUp,  color: 'text-red-700',   bg: 'bg-red-50',   href: '/reports' },
  ];

  // Recent records (last 5 by date)
  const recentInvoices = snapshot?.recentInvoices ?? [];
  const recentChallans = snapshot?.recentChallans ?? [];

  const getCustomerName = (id: string) => {
    const c = snapshot?.customersById?.[id];
    return c?.name || (c as any)?.businessName || id;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-400">Loading data…</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-4 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500">Unable to load dashboard data. Please refresh.</p>
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
