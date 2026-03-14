'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TemplateDesigner } from '@/components/template-designer/template-designer';
import { Template } from '@/types';
import { createTemplate } from '@/lib/firestore';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function NewTemplatePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleSave = async (templateData: Template) => {
    try {
      const { id: _id, ...rest } = templateData as any;
      await createTemplate({ ...rest, userId: user?.uid || '' });
      toast.success('Template created successfully!');
      router.push('/templates');
    } catch (error: any) {
      console.error('Error creating template:', error);
      toast.error(error?.message || 'Failed to create template.');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Template</h1>
      </div>

      <TemplateDesigner onSave={handleSave} />
    </div>
  );
}
