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
import { createChallan, updateChallan, getChallan, getCustomers, getFabricQualities } from '@/lib/firestore';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Roll {
  meters: number;
}

export function ChallanForm({ challanId }: { challanId?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [qualities, setQualities] = useState<FabricQuality[]>([]);

  const [customerId, setCustomerId] = useState('');
  const [challanNumber, setChallanNumber] = useState('');
  const [challanDate, setChallanDate] = useState(new Date().toISOString().split('T')[0]);
  const [quality, setQuality] = useState('');
  const [broker, setBroker] = useState('');
  const [rolls, setRolls] = useState<Roll[]>([{ meters: 0 }]);
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

        if (challanId) {
          const challan = await getChallan(challanId);
          if (challan) {
            setCustomerId(challan.customerId);
            setChallanNumber((challan as any).challanNumber || (challan as any).number || '');
            setChallanDate(
              challan.challanDate instanceof Date
                ? challan.challanDate.toISOString().split('T')[0]
                : (challan.challanDate as any) || new Date().toISOString().split('T')[0]
            );
            setQuality((challan as any).quality || (challan as any).qualityName || '');
            setBroker((challan as any).broker || (challan as any).brokerName || '');

            // Load rolls — fall back to converting legacy items
            if ((challan as any).rolls && (challan as any).rolls.length > 0) {
              setRolls((challan as any).rolls);
            } else if (challan.items && challan.items.length > 0) {
              setRolls(challan.items.map((item) => ({ meters: item.quantity || item.meters || 0 })));
            }

            setRemarks(challan.remarks || '');
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [challanId]);

  const addRoll = () => setRolls([...rolls, { meters: 0 }]);
  const removeRoll = (i: number) => setRolls(rolls.filter((_, idx) => idx !== i));
  const updateRoll = (i: number, meters: number) =>
    setRolls(rolls.map((r, idx) => (idx === i ? { meters } : r)));

  const totalMeters = rolls.reduce((sum, r) => sum + (r.meters || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) { toast.error('Please select a customer'); return; }
    if (!quality) { toast.error('Please select a quality'); return; }
    setLoading(true);

    try {
      const challanData: any = {
        id: challanId || '',
        customerId,
        challanNumber,
        challanDate,
        quality,
        broker,
        rolls,
        totalTaka: rolls.length,
        totalMeters,
        remarks,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (challanId) {
        await updateChallan(challanId, challanData);
      } else {
        await createChallan(challanData);
      }

      toast.success(challanId ? 'Challan updated successfully!' : 'Challan created successfully!');
      router.push('/challans');
    } catch (error: any) {
      console.error('Error saving challan:', error);
      toast.error(error?.message || 'Failed to save challan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Challan Details */}
        <Card className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4">Challan Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="challan-number">Challan Number</Label>
              <Input
                id="challan-number"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
                required
                placeholder="79"
              />
            </div>
            <div>
              <Label htmlFor="challan-date">Date</Label>
              <Input
                id="challan-date"
                type="date"
                value={challanDate}
                onChange={(e) => setChallanDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Select value={quality || undefined} onValueChange={setQuality}>
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {qualities.map((q) => (
                    <SelectItem key={q.id} value={q.name}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="broker">Broker</Label>
              <Input
                id="broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="TARACHANDJI"
              />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <Label htmlFor="customer">Customer (M/s.)</Label>
              <Select value={customerId || undefined} onValueChange={setCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Rolls / Taka */}
        <Card className="p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Rolls (Taka)</h3>
            <Button type="button" onClick={addRoll} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Roll
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Sr #</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolls.map((roll, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-gray-600">{idx + 1}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={roll.meters || ''}
                        onChange={(e) => updateRoll(idx, parseFloat(e.target.value) || 0)}
                        className="w-36"
                        placeholder="0.00"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRoll(idx)}
                        disabled={rolls.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 pt-4 border-t flex justify-between font-semibold text-sm">
            <span>Total Taka: {rolls.length}</span>
            <span>Total Meters: {totalMeters.toFixed(2)}</span>
          </div>
        </Card>

        {/* Remarks */}
        <Card className="p-4 sm:p-6">
          <Label htmlFor="remarks">Remarks</Label>
          <Textarea
            id="remarks"
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
            {loading ? 'Saving...' : challanId ? 'Update Challan' : 'Create Challan'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
