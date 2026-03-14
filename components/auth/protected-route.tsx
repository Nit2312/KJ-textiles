'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Initial loading phase
    if (loading) {
      setIsChecking(true);
      return;
    }

    // Once loading is complete, check auth status
    if (!user) {
      // User is not authenticated, redirect to login
      router.push(`/login?redirect=${pathname}`);
    } else {
      // User is authenticated, allow access
      setIsChecking(false);
    }
  }, [user, loading, router, pathname]);

  if (loading || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-8 h-8 text-blue-600" />
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
