'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Customer } from '@/types';
import { CustomerForm } from '@/components/customers/customer-form';
import { getCustomerById, updateCustomer } from '@/lib/firestore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  const loadCustomer = async () => {
    try {
      const data = await getCustomerById(customerId);
      if (data) {
        setCustomer(data);
      } else {
        toast.error('Customer not found');
        router.push('/customers');
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCustomer = async (data: Omit<Customer, 'id'>) => {
    try {
      setIsSaving(true);
      await updateCustomer(customerId, data);
      toast.success('Customer updated');
      router.push('/customers');
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/customers">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
      </div>
      <CustomerForm
        customer={customer}
        onSubmit={handleUpdateCustomer}
        isLoading={isSaving}
      />
    </div>
  );
}
