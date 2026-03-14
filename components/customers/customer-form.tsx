'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Customer } from '@/types';
import { FieldGroup, FieldLabel } from '@/components/ui/field';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Omit<Customer, 'id'>) => Promise<void>;
  isLoading?: boolean;
}

export function CustomerForm({ customer, onSubmit, isLoading }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    customerId: customer?.customerId || '',
    name: customer?.name || '',
    businessName: customer?.businessName || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    gstNumber: customer?.gstNumber || '',
    mobileNumber: customer?.mobileNumber || '',
    brokerName: customer?.brokerName || '',
    notes: customer?.notes || '',
    createdAt: customer?.createdAt || new Date(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.customerId || !formData.name || !formData.businessName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (formData.mobileNumber && !/^[\d\s\+\-\(\)]+$/.test(formData.mobileNumber)) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    
    try {
      await onSubmit(formData);
      toast.success(customer ? 'Customer updated successfully!' : 'Customer added successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save customer. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FieldGroup>
              <FieldLabel>Customer ID</FieldLabel>
              <Input
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                placeholder="AUTO-001"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Name</FieldLabel>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer name"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Business Name</FieldLabel>
              <Input
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder="Business name"
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
              <FieldLabel>GST Number</FieldLabel>
              <Input
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                placeholder="27XXXXX0000A1Z5"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>Broker Name</FieldLabel>
              <Input
                name="brokerName"
                value={formData.brokerName}
                onChange={handleChange}
                placeholder="Broker name"
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>City</FieldLabel>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                required
              />
            </FieldGroup>
            <FieldGroup>
              <FieldLabel>State</FieldLabel>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                required
              />
            </FieldGroup>
          </div>
          <FieldGroup>
            <FieldLabel>Address</FieldLabel>
            <Textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Complete address"
              rows={3}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes"
              rows={2}
            />
          </FieldGroup>
          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : customer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
