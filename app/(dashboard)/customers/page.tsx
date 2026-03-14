'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Customer } from '@/types';
import { CustomerTable } from '@/components/customers/customer-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CustomerForm } from '@/components/customers/customer-form';
import { Plus } from 'lucide-react';
import { addCustomer, getCustomers, deleteCustomer } from '@/lib/firestore';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load customers. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomer = async (data: Omit<Customer, 'id'>) => {
    try {
      await addCustomer(data);
      setIsOpen(false);
      await loadCustomers();
    } catch (error) {
      // Re-throw to be handled by the form component
      throw error;
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }
    
    try {
      await deleteCustomer(id);
      setCustomers(customers.filter((c) => c.id !== id));
      toast.success('Customer deleted successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete customer. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage all your customers</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <CustomerForm onSubmit={handleAddCustomer} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({customers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerTable customers={customers} onDelete={handleDeleteCustomer} />
        </CardContent>
      </Card>
    </div>
  );
}
