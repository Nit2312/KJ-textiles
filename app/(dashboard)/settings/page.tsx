'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FabricQuality } from '@/types';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2 } from 'lucide-react';
import { addFabricQuality, getFabricQualities, deleteFabricQuality } from '@/lib/firestore';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [qualities, setQualities] = useState<FabricQuality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    qualityId: '',
    name: '',
    gsm: '',
    description: '',
  });

  useEffect(() => {
    loadQualities();
  }, []);

  const loadQualities = async () => {
    try {
      setIsLoading(true);
      const data = await getFabricQualities();
      setQualities(data);
    } catch (error) {
      console.error('Error loading qualities:', error);
      toast.error('Failed to load qualities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQuality = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addFabricQuality({
        qualityId: formData.qualityId,
        name: formData.name,
        gsm: parseInt(formData.gsm) || 0,
        description: formData.description,
        createdAt: new Date(),
      });
      setIsOpen(false);
      setFormData({
        qualityId: '',
        name: '',
        gsm: '',
        description: '',
      });
      loadQualities();
      toast.success('Quality added');
    } catch (error) {
      console.error('Error adding quality:', error);
      toast.error('Failed to add quality');
    }
  };

  const handleDeleteQuality = async (id: string) => {
    try {
      await deleteFabricQuality(id);
      setQualities(qualities.filter((q) => q.id !== id));
      toast.success('Quality deleted');
    } catch (error) {
      console.error('Error deleting quality:', error);
      toast.error('Failed to delete quality');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Configure your ERP system</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fabric Qualities</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Quality
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fabric Quality</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddQuality} className="space-y-4">
                <FieldGroup>
                  <FieldLabel>Quality ID</FieldLabel>
                  <Input
                    value={formData.qualityId}
                    onChange={(e) =>
                      setFormData({ ...formData, qualityId: e.target.value })
                    }
                    placeholder="QUAL-001"
                    required
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Quality name"
                    required
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>GSM (Grams per Square Meter)</FieldLabel>
                  <Input
                    type="number"
                    value={formData.gsm}
                    onChange={(e) =>
                      setFormData({ ...formData, gsm: e.target.value })
                    }
                    placeholder="150"
                    required
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Description</FieldLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Description"
                    rows={3}
                  />
                </FieldGroup>
                <Button type="submit" className="w-full">
                  Add Quality
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quality ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>GSM</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qualities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No qualities found
                    </TableCell>
                  </TableRow>
                ) : (
                  qualities.map((quality) => (
                    <TableRow key={quality.id}>
                      <TableCell className="font-medium">{quality.qualityId}</TableCell>
                      <TableCell>{quality.name}</TableCell>
                      <TableCell>{quality.gsm}</TableCell>
                      <TableCell>{quality.description}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuality(quality.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
