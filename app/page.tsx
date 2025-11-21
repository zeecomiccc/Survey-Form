'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, FileText, Edit, Trash2, Copy, Users, LogOut, Mail } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Survey } from '@/types/survey';
import CompanyLogo from '@/components/CompanyLogo';

function ResponseCount({ surveyId }: { surveyId: string }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    const loadCount = async () => {
      const responses = await storage.getResponses(surveyId);
      setCount(responses.length);
    };
    loadCount();
  }, [surveyId]);
  
  return <span>{count} responses</span>;
}

export default function Home() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setCurrentUser(data.user);
      loadSurveys();
    } catch (error) {
      router.push('/login');
    }
  };

  const loadSurveys = async () => {
    try {
      const data = await storage.getSurveys();
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSurveys = async () => {
    const data = await storage.getSurveys();
    setSurveys(data);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
      try {
        await storage.deleteSurvey(id);
        await refreshSurveys();
      } catch (error) {
        alert('Failed to delete survey. Please try again.');
      }
    }
  };

  const handleDuplicate = async (survey: Survey) => {
    try {
      await storage.duplicateSurvey(survey);
      await refreshSurveys();
      alert('Survey duplicated successfully!');
    } catch (error) {
      alert('Failed to duplicate survey. Please try again.');
      console.error(error);
    }
  };

  const handleToggleEmailNotifications = async (surveyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/surveys/${surveyId}/notifications`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to update email notifications');
      }

      await refreshSurveys();
    } catch (error) {
      alert('Failed to update email notifications. Please try again.');
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <CompanyLogo />
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {currentUser?.name}</span>
              {currentUser?.role === 'admin' && (
                <Link
                  href="/users"
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <Users size={18} />
                  Manage Users
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-xl text-gray-600 mb-8">
            Create, share, and analyze surveys with ease
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
          >
            <Plus size={20} />
            Create New Survey
          </Link>
        </div>

        {surveys.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <FileText size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">No surveys yet</p>
            <p className="text-gray-500 mt-2">Create your first survey to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-5"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="text-gray-600 mb-3 text-sm line-clamp-2">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{survey.questions.length} questions</span>
                  <ResponseCount surveyId={survey.id} />
                </div>
                <div className="flex gap-1.5 mb-2.5">
                  <Link
                    href={`/survey/${survey.id}`}
                    className="flex-1 text-center bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    View
                  </Link>
                  <Link
                    href={`/analytics/${survey.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-sm"
                  >
                    <BarChart3 size={14} />
                    Analytics
                  </Link>
                </div>
                <div className="flex gap-1.5 pt-2.5 border-t border-gray-200">
                  <Link
                    href={`/builder?id=${survey.id}`}
                    className="flex-1 text-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <Edit size={12} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(survey)}
                    className="flex-1 text-center bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 text-xs"
                    title="Duplicate survey"
                  >
                    <Copy size={12} />
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="flex-1 text-center bg-red-50 text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-200 space-y-2.5">
                  <button
                    onClick={async () => {
                      try {
                        const linkData = await storage.createSurveyLink(survey.id);
                        navigator.clipboard.writeText(linkData.url);
                        alert(`Survey link copied to clipboard!\n\nThis link will expire in 7 days.`);
                      } catch (error) {
                        alert('Failed to create survey link. Please try again.');
                      }
                    }}
                    className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Copy Survey Link
                  </button>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700 hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={survey.emailNotificationsEnabled || false}
                      onChange={(e) => handleToggleEmailNotifications(survey.id, e.target.checked)}
                      className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <Mail size={12} className="text-gray-600" />
                    <span>Email notifications</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
