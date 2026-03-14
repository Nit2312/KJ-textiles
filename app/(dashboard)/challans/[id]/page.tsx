'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Challan, Customer, FabricQuality, Template } from '@/types';
import { getChallan, getCustomer, getFabricQualities, deleteChallan, getTemplates } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { ChevronLeft, Download, Edit2, Trash2 } from 'lucide-react';
import { generateChallanPDF } from '@/lib/pdf-generator';
import { generateChallanExcel } from '@/lib/excel-generator';
import { toast } from 'sonner';

export default function ChallanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const challanId = params.id as string;
  const [challan, setChallan] = useState<Challan | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [qualities, setQualities] = useState<FabricQuality[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, [challanId]);

  const loadData = async () => {
    try {
      const [challanData, qualitiesData, templatesData] = await Promise.all([
        getChallan(challanId),
        getFabricQualities(),
        getTemplates(),
      ]);
      if (challanData) {
        setChallan(challanData);
        const customerData = await getCustomer(challanData.customerId);
        if (customerData) setCustomer(customerData);
        setQualities(qualitiesData);
      }
      setTemplates(templatesData.filter((t: any) => !t.type || t.type === 'challan'));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePDF = async () => {
    if (!challan || !customer) { toast.error('Challan or customer data not available'); return; }
    try {
      const tpl = selectedTemplateId !== 'default' ? templates.find(t => t.id === selectedTemplateId) ?? null : null;
      const pdfData = await generateChallanPDF(challan, customer, qualities, tpl);
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const no = (challan as any).challanNumber || (challan as any).number || challan.id;
      a.download = `Challan-${no}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Challan PDF generated successfully!');
    } catch (error) {
      toast.error('Failed to generate PDF: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleExcel = async () => {
    if (!challan || !customer) { toast.error('Challan or customer data not available'); return; }
    try {
      generateChallanExcel(challan, customer, qualities);
      toast.success('Challan Excel generated successfully!');
    } catch (error) {
      toast.error('Failed to generate Excel: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this challan?')) return;
    try {
      await deleteChallan(challanId);
      toast.success('Challan deleted successfully!');
      router.push('/challans');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete challan. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center min-h-screen"><p className="text-lg font-semibold">Loading...</p></div>;
  }
  if (!challan || !customer) {
    return <div className="p-8"><p className="text-red-500">Challan not found</p></div>;
  }

  const any = challan as any;
  const challanNo = any.challanNumber || any.number || '';
  const challanDate = any.challanDate instanceof Date
    ? any.challanDate.toLocaleDateString('en-GB')
    : any.challanDate ? new Date(any.challanDate).toLocaleDateString('en-GB') : 'N/A';
  const quality = any.quality || any.qualityName || 'N/A';
  const broker = any.broker || any.brokerName || 'N/A';
  const rolls: { meters: number }[] = Array.isArray(any.rolls)
    ? any.rolls
    : Array.isArray(any.items)
      ? any.items.map((i: any) => ({ meters: i.quantity || i.meters || 0 }))
      : [];
  const totalMeters = rolls.reduce((s, r) => s + r.meters, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/challans">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Challan {challanNo}</h1>
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
          <Link href={`/challans/${challanId}/edit`}>
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
          <p className="text-xs text-gray-500">Challan No.</p>
          <p className="text-xl font-bold">{challanNo}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Date</p>
          <p className="text-xl font-bold">{challanDate}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Taka</p>
          <p className="text-xl font-bold">{rolls.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500">Total Meters</p>
          <p className="text-xl font-bold">{totalMeters.toFixed(2)}</p>
        </Card>
      </div>

      {/* Customer + Challan info */}
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Customer (M/s.)</p>
            <p className="text-lg font-semibold">{customer.name}</p>
            <p className="text-sm text-gray-600 mt-1">{customer.address}</p>
            <p className="text-sm text-gray-600 mt-1">GSTIN: {customer.gstNumber || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-gray-500">Quality:</span>
            <span className="font-medium">{quality}</span>
            <span className="text-gray-500">Broker:</span>
            <span className="font-medium">{broker}</span>
            {challan.remarks && (
              <>
                <span className="text-gray-500">Remarks:</span>
                <span>{challan.remarks}</span>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Rolls table */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Rolls (Taka)</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Sr #</TableHead>
                <TableHead>Meters</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rolls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8 text-gray-500">No rolls found</TableCell>
                </TableRow>
              ) : (
                rolls.map((roll, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{roll.meters.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 pt-4 border-t flex justify-between font-semibold">
          <span>Total Taka: {rolls.length}</span>
          <span>Total Meters: {totalMeters.toFixed(2)}</span>
        </div>
      </Card>
    </div>
  );
}
