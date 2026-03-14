'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChallanForm } from '@/components/challans/challan-form';

export default function EditChallanPage() {
  const params = useParams();
  const challanId = params.id as string;
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/challans/${challanId}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Edit Challan</h1>
      </div>

      <ChallanForm challanId={challanId} />
    </div>
  );
}
