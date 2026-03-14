'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Challan } from '@/types';
import { Plus } from 'lucide-react';
import { getChallans, deleteChallan } from '@/lib/firestore';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Trash2, Edit, Eye } from 'lucide-react';

export default function ChallansPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadChallans();
  }, []);

  const loadChallans = async () => {
    try {
      setIsLoading(true);
      const data = await getChallans();
      setChallans(data);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to load challans. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this challan?')) return;
    
    try {
      await deleteChallan(id);
      setChallans(challans.filter((c) => c.id !== id));
      toast.success('Challan deleted successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete challan. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Challans</h1>
          <p className="text-gray-600 mt-2">Manage delivery challans</p>
        </div>
        <Link href="/challans/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Challan
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Challans ({challans.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quality</TableHead>
                  <TableHead>Meters</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {challans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No challans found
                    </TableCell>
                  </TableRow>
                ) : (
                  challans.map((challan) => (
                    <TableRow key={challan.id}>
                      <TableCell className="font-medium">{(challan as any).challanNumber || challan.number}</TableCell>
                      <TableCell>{((challan as any).challanDate || challan.date) instanceof Date ? ((challan as any).challanDate || challan.date).toLocaleDateString('en-GB') : new Date((challan as any).challanDate || challan.date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell>{challan.customerId}</TableCell>
                      <TableCell>{(challan as any).quality || challan.qualityName || 'N/A'}</TableCell>
                      <TableCell>{challan.totalMeters || 0}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          challan.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          challan.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {challan.status || 'draft'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/challans/${challan.id}`}>
                            <Button variant="ghost" size="sm" title="View Details">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/challans/${challan.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit Challan">
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(challan.id)}
                            title="Delete Challan"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
