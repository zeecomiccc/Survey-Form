'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

function ShortLinkRedirect() {
  const params = useParams();
  const shortCode = params.code as string;
  const [error, setError] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      try {
        const response = await fetch(`/api/short-link/${shortCode}`);
        
        if (!response.ok) {
          setError(true);
          return;
        }

        const data = await response.json();
        
        if (data.url) {
          // Redirect to the full survey link
          window.location.href = data.url;
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Error redirecting:', error);
        setError(true);
      }
    };

    if (shortCode) {
      redirect();
    }
  }, [shortCode]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h2>
          <p className="text-gray-600 mb-6">
            This short link doesn't exist, may have expired, or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h2>
        <p className="text-gray-600 text-sm">Please wait while we redirect you to the survey.</p>
      </div>
    </div>
  );
}

export default function ShortLinkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <ShortLinkRedirect />
    </Suspense>
  );
}
