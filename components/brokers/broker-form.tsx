'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Broker } from '@/types';
import { FieldGroup, FieldLabel } from '@/components/ui/field';

interface BrokerFormProps {
  broker?: Broker;
  onSubmit: (data: Omit<Broker, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

export function BrokerForm({ broker, onSubmit, isLoading }: BrokerFormProps) {
  const [formData, setFormData] = useState({
    brokerId: broker?.brokerId || '',
    name: broker?.name || '',
    mobileNumber: broker?.mobileNumber || '',
    commissionPercentage: broker?.commissionPercentage || 0,
    notes: broker?.notes || '',
    createdAt: broker?.createdAt || new Date(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'commissionPercentage' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.brokerId || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.commissionPercentage < 0 || formData.commissionPercentage > 100) {
      toast.error('Commission percentage must be between 0 and 100');
      return;
    }
    
    if (formData.mobileNumber && !/^[\d\s\+\-\(\)]+$/.test(formData.mobileNumber)) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    
    try {
      await onSubmit(formData);
      toast.success(broker ? 'Broker updated successfully!' : 'Broker added successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save broker. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{broker ? 'Edit Broker' : 'Add New Broker'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Broker ID</FieldLabel>
              <Input
                name="brokerId"
                value={formData.brokerId}
                onChange={handleChange}
                placeholder="BROKER-001"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Name</FieldLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Broker name"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Mobile Number</FieldLabel>
              <Input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="+91 XXXXX XXXXX"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Commission Percentage (%)</FieldLabel>
              <Input
                name="commissionPercentage"
                type="number"
                step="0.01"
                value={formData.commissionPercentage}
                onChange={handleChange}
                placeholder="2.5"
                required
              />
            </FieldGroup>
          </div>
          <FieldGroup>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes"
              rows={3}
            />
          </FieldGroup>
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : broker ? 'Update Broker' : 'Add Broker'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
