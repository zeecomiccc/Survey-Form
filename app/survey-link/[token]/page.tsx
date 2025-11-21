'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function SurveyLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyId, setSurveyId] = useState<string | null>(null);

  useEffect(() => {
    const validateLink = async () => {
      try {
        const response = await fetch(`/api/survey-links/${token}`);
        
        if (response.status === 404) {
          setError('Invalid survey link');
          setLoading(false);
          return;
        }

        if (response.status === 410) {
          setError('This survey link has expired. Please request a new link.');
          setLoading(false);
          return;
        }

        if (!response.ok) {
          setError('Failed to validate link');
          setLoading(false);
          return;
        }

        const data = await response.json();
        setSurveyId(data.surveyId);
        // Redirect to the survey page with token as query parameter
        router.push(`/survey/${data.surveyId}?token=${token}`);
      } catch (error) {
        console.error('Error validating link:', error);
        setError('Failed to validate link');
        setLoading(false);
      }
    };

    validateLink();
  }, [token, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Validating link...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}

