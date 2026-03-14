'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Broker } from '@/types';
import { BrokerTable } from '@/components/brokers/broker-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BrokerForm } from '@/components/brokers/broker-form';
import { Plus } from 'lucide-react';
import { addBroker, getBrokers, deleteBroker } from '@/lib/firestore';
import { toast } from 'sonner';

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadBrokers();
  }, []);

  const loadBrokers = async () => {
    try {
      setIsLoading(true);
      const data = await getBrokers();
      setBrokers(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load brokers. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBroker = async (data: Omit<Broker, 'id'>) => {
    try {
      await addBroker(data);
      setIsOpen(false);
      await loadBrokers();
    } catch (error) {
      // Re- throw to be handled by the form component
      throw error;
    }
  };

  const handleDeleteBroker = async (id: string) => {
    if (!confirm('Are you sure you want to delete this broker?')) {
      return;
    }
    
    try {
      await deleteBroker(id);
      setBrokers(brokers.filter((b) => b.id !== id));
      toast.success('Broker deleted successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete broker. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brokers</h1>
          <p className="text-gray-600 mt-2">Manage all your brokers</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Broker
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Broker</DialogTitle>
            </DialogHeader>
            <BrokerForm onSubmit={handleAddBroker} isLoading={isLoading} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Brokers ({brokers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <BrokerTable brokers={brokers} onDelete={handleDeleteBroker} />
        </CardContent>
      </Card>
    </div>
  );
}
