'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Broker } from '@/types';
import { getBroker, updateBroker, deleteBroker } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { ChevronLeft, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function BrokerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const brokerId = params.id as string;
  const [broker, setBroker] = useState<Broker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form fields
  const [brokerIdField, setBrokerIdField] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadBroker();
  }, [brokerId]);

  const loadBroker = async () => {
    try {
      setIsLoading(true);
      const brokerData = await getBroker(brokerId);
      if (brokerData) {
        setBroker(brokerData);
        setBrokerIdField(brokerData.brokerId);
        setName(brokerData.name);
        setMobileNumber(brokerData.mobileNumber);
        setCommissionPercentage(brokerData.commissionPercentage);
        setNotes(brokerData.notes || '');
      }
    } catch (error) {
      console.error('Error loading broker:', error);
      toast.error('Failed to load broker details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !mobileNumber.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      await updateBroker(brokerId, {
        brokerId: brokerIdField,
        name,
        mobileNumber,
        commissionPercentage,
        notes,
      } as Partial<Broker>);
      toast.success('Broker updated successfully!');
      router.push('/brokers');
    } catch (error: any) {
      console.error('Error updating broker:', error);
      const errorMessage = error?.message || 'Failed to update broker. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this broker?')) return;
    try {
      await deleteBroker(brokerId);
      toast.success('Broker deleted successfully!');
      router.push('/brokers');
    } catch (error: any) {
      console.error('Error deleting broker:', error);
      const errorMessage = error?.message || 'Failed to delete broker. Please try again.';
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p className="text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  if (!broker) {
    return (
      <div className="p-8">
        <p className="text-red-500">Broker not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/brokers">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Edit Broker</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="default" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brokerId">Broker ID</Label>
              <Input
                id="brokerId"
                value={brokerIdField}
                onChange={(e) => setBrokerIdField(e.target.value)}
                placeholder="BRK-001"
              />
            </div>
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Broker name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input
                id="mobile"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                placeholder="+91 1234567890"
              />
            </div>
            <div>
              <Label htmlFor="commission">Commission Percentage *</Label>
              <Input
                id="commission"
                type="number"
                step="0.01"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(parseFloat(e.target.value) || 0)}
                required
                placeholder="2.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the broker..."
              rows={4}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
