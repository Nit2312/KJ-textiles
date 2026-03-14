'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TemplateDesigner } from '@/components/template-designer/template-designer';
import { Template } from '@/types';
import { getTemplate, updateTemplate } from '@/lib/firestore';
import { toast } from 'sonner';

export default function TemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      const data = await getTemplate(id);
      setTemplate(data);
    } catch (error: any) {
      console.error('Error loading template:', error);
      toast.error(error?.message || 'Failed to load template.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedTemplate: Template) => {
    try {
      const { id: _id, ...rest } = updatedTemplate as any;
      await updateTemplate(id, rest);
      toast.success('Template updated successfully!');
      router.push('/templates');
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error?.message || 'Failed to update template.');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="p-8">
        <p className="text-red-500">Template not found</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/templates">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
      </div>

      <TemplateDesigner template={template} onSave={handleSave} />
    </div>
  );
}
