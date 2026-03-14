'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Template } from '@/types';
import { getTemplates, deleteTemplate } from '@/lib/firestore';
import { toast } from 'sonner';
import Link from 'next/link';
import { Plus, Trash2, Edit2, FileText, Eye } from 'lucide-react';

// ─── Built-in system templates ────────────────────────────────────────────────
const SYSTEM_TEMPLATES = [
  {
    id: 'system-challan',
    name: 'Delivery Challan',
    type: 'challan',
    description: 'Standard K. J. Textile delivery challan with 4-column rolls table, customer details, broker, quality, and totals.',
    usedIn: '/challans/[id]',
    fields: ['Challan No.', 'Date', 'Customer Name & Address', 'GSTIN', 'Quality', 'Broker', 'Roll-wise Meters (4-col grid)', 'Total Taka', 'Total Meters'],
    previewRows: [
      { label: 'Company Header', hint: 'K. J. TEXTILE · Address · GSTIN' },
      { label: 'Customer + Challan Info', hint: 'M/s. [Name] · Challan No / Date / Quality / Broker' },
      { label: 'Rolls Table', hint: 'Sr# | Meter  ×  4 columns  (dynamic rows)' },
      { label: 'Totals', hint: 'Total Taka · Total Meters' },
      { label: 'Footer', hint: 'NO DYEING GUARANTEE · Signatures' },
    ],
  },
  {
    id: 'system-invoice',
    name: 'Tax Invoice',
    type: 'invoice',
    description: 'GST-compliant Tax Invoice with CGST/SGST/IGST breakdown, bank details, amount in words, and terms of sale.',
    usedIn: '/invoices/[id]',
    fields: ['Invoice No. & Date', 'Challan Ref.', 'Due Date', 'Customer Billing Details', 'Broker', 'Items (Desc / HSN / Taka / Meters / Rate / Amount)', 'CGST / SGST / IGST', 'Grand Total', 'Amount in Words', 'Bank Details', 'Terms of Sale'],
    previewRows: [
      { label: 'Shree Ganesh Header', hint: ':: SHREE GANESHAY NAMAH :: · TAX INVOICE' },
      { label: 'Company Header', hint: 'K. J. TEXTILE · Address · GSTIN box' },
      { label: 'Billed To + Invoice Ref', hint: 'Customer address/GSTIN  |  Invoice No / Date / Challan / Due Date' },
      { label: 'Items Table', hint: 'Sr | Description | HSN | Taka | Meters | Basic Rate | Total Amount' },
      { label: 'Bank Details + Tax', hint: 'Bank A/c  |  CGST + SGST + IGST → Grand Total' },
      { label: 'Amount in Words + Signatures', hint: '₹ [words] · Terms of Sale · Proprietor sign' },
    ],
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await getTemplates();
      setTemplates(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load templates. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplate(id);
      setTemplates(templates.filter((t) => t.id !== id));
      toast.success('Template deleted successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete template. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">Manage document templates for challans and invoices</p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </Link>
      </div>

      {/* ── System / Built-in Templates ──────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Built-in Templates
        </h2>
        <p className="text-sm text-gray-500">
          These are the default PDF templates used when generating challans and invoices. They cannot be edited or deleted.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {SYSTEM_TEMPLATES.map((tpl) => (
            <Card key={tpl.id} className="overflow-hidden border-2 border-blue-100">
              {/* Card header */}
              <div className="px-5 py-4 bg-blue-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{tpl.name}</span>
                      <Badge variant="secondary" className="text-xs">Built-in</Badge>
                      <Badge className="text-xs capitalize bg-blue-600">{tpl.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{tpl.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {expanded === tpl.id ? 'Hide' : 'Preview'}
                </Button>
              </div>

              {/* Expanded preview */}
              {expanded === tpl.id && (
                <div className="px-5 py-4 space-y-4 bg-white">
                  {/* Mini A4-style layout mockup */}
                  <div className="border rounded-lg overflow-hidden bg-white shadow-sm max-w-sm mx-auto">
                    <div className="bg-gray-700 text-white text-center text-xs py-1 font-medium tracking-wide">
                      {tpl.name.toUpperCase()} — PDF LAYOUT
                    </div>
                    <div className="divide-y divide-dashed divide-gray-200">
                      {tpl.previewRows.map((row, i) => (
                        <div key={i} className="px-3 py-2">
                          <span className="text-xs font-semibold text-gray-700">{row.label}</span>
                          <p className="text-xs text-gray-400 mt-0.5">{row.hint}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fields list */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2">Included fields</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tpl.fields.map((f) => (
                        <span key={f} className="text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5 border border-gray-200">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-400">
                    Used in: <code className="bg-gray-100 px-1 rounded">{tpl.usedIn}</code>
                    {' '}→ &quot;Download PDF&quot; button
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* ── Custom Templates ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-purple-500" />
          Custom Templates
        </h2>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-400">Loading…</TableCell>
                </TableRow>
              ) : templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No custom templates yet.{' '}
                    <Link href="/templates/new" className="text-blue-600 hover:underline">
                      Create one
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="capitalize">{(template as any).type || '—'}</TableCell>
                    <TableCell>{new Date(template.createdAt).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell>{new Date(template.updatedAt).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={`/templates/${template.id}`}>
                          <Button variant="ghost" size="sm">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
