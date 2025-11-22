'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, FileText, Edit, Trash2, Copy, Mail, Search, Filter } from 'lucide-react';
import { storage } from '@/lib/storage';
import { Survey } from '@/types/survey';
import MobileHeader from '@/components/MobileHeader';
import { useToastContext } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';

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
  const [allSurveys, setAllSurveys] = useState<Survey[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSort, setFilterSort] = useState<'date' | 'title' | 'responses'>('date');
  const [filterOrder, setFilterOrder] = useState<'asc' | 'desc'>('desc');
  const toast = useToastContext();
  const modal = useModal();

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
      setAllSurveys(data);
      setSurveys(data);
    } catch (error) {
      console.error('Error loading surveys:', error);
      toast.error('Failed to load surveys. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const refreshSurveys = async () => {
    try {
      const data = await storage.getSurveys();
      setAllSurveys(data);
      applyFilters(data);
    } catch (error) {
      toast.error('Failed to refresh surveys.');
    }
  };

  // Filter and sort surveys
  const applyFilters = (surveyList: Survey[] = allSurveys) => {
    let filtered = [...surveyList];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (survey) =>
          survey.title.toLowerCase().includes(query) ||
          survey.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (filterSort === 'date') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (filterSort === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (filterSort === 'responses') {
        // We'll need to get response counts - for now just sort by date
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      return filterOrder === 'asc' ? comparison : -comparison;
    });

    setSurveys(filtered);
  };

  // Update filters when search or sort changes
  useEffect(() => {
    if (allSurveys.length > 0) {
      applyFilters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterSort, filterOrder, allSurveys.length]);

  const handleDelete = async (id: string) => {
    modal.openModal(
      {
        title: 'Delete Survey',
        message: 'Are you sure you want to delete this survey? This action cannot be undone.',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      async () => {
        try {
          await storage.deleteSurvey(id);
          await refreshSurveys();
          toast.success('Survey deleted successfully');
        } catch (error) {
          toast.error('Failed to delete survey. Please try again.');
          console.error(error);
        }
      }
    );
  };

  const handleDuplicate = async (survey: Survey) => {
    try {
      await storage.duplicateSurvey(survey);
      await refreshSurveys();
      toast.success('Survey duplicated successfully!');
    } catch (error) {
      toast.error('Failed to duplicate survey. Please try again.');
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
      toast.success(`Email notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update email notifications. Please try again.');
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
      <MobileHeader currentUser={currentUser} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="text-center mb-6 md:mb-8">
          <p className="text-lg md:text-xl text-gray-600 mb-4 md:mb-6 px-2">
            Create, share, and analyze surveys with ease
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg text-sm md:text-base"
            >
              <Plus size={18} className="md:w-5 md:h-5" />
              Create New Survey
            </Link>
            <Link
              href="/builder?templates=true"
              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-lg text-sm md:text-base"
            >
              📋 Use Template
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        {allSurveys.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search surveys by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <select
                  value={filterSort}
                  onChange={(e) => setFilterSort(e.target.value as 'date' | 'title' | 'responses')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                  <option value="responses">Sort by Responses</option>
                </select>
                <button
                  onClick={() => setFilterOrder(filterOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={filterOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  <Filter size={18} className={filterOrder === 'asc' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
            
            {searchQuery && (
              <div className="mt-3 text-sm text-gray-600">
                Found {surveys.length} survey{surveys.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <Modal
          isOpen={modal.isOpen}
          onClose={modal.closeModal}
          onConfirm={modal.confirm}
          title={modal.modalOptions.title}
          message={modal.modalOptions.message}
          confirmText={modal.modalOptions.confirmText}
          cancelText={modal.modalOptions.cancelText}
          type={modal.modalOptions.type}
          showCancel={modal.modalOptions.showCancel}
        />

        {surveys.length === 0 ? (
          <div className="text-center py-12 md:py-16 bg-white rounded-xl shadow-md px-4">
            <FileText size={48} className="md:w-16 md:h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-base md:text-lg">
              {allSurveys.length === 0 
                ? 'No surveys yet' 
                : searchQuery 
                ? 'No surveys found matching your search'
                : 'No surveys yet'}
            </p>
            <p className="text-gray-500 mt-2 text-sm md:text-base">
              {allSurveys.length === 0
                ? 'Create your first survey to get started!'
                : searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first survey to get started!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {surveys.map((survey) => (
              <div
                key={survey.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow p-4 md:p-5"
              >
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5 line-clamp-2">
                  {survey.title}
                </h3>
                {survey.description && (
                  <p className="text-gray-600 mb-3 text-xs md:text-sm line-clamp-2">
                    {survey.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span>{survey.questions.length} questions</span>
                  <ResponseCount surveyId={survey.id} />
                </div>
                <div className="flex flex-col sm:flex-row gap-1.5 mb-2.5">
                  <Link
                    href={`/survey/${survey.id}`}
                    className="flex-1 text-center bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 transition-colors text-xs md:text-sm"
                  >
                    View
                  </Link>
                  <Link
                    href={`/analytics/${survey.id}`}
                    className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 text-xs md:text-sm"
                  >
                    <BarChart3 size={12} className="md:w-3.5 md:h-3.5" />
                    Analytics
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-gray-200">
                  <Link
                    href={`/builder?id=${survey.id}`}
                    className="text-center bg-blue-50 text-blue-700 px-2 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <Edit size={10} className="md:w-3 md:h-3" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                  <button
                    onClick={() => handleDuplicate(survey)}
                    className="text-center bg-purple-50 text-purple-700 px-2 py-1.5 rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1 text-xs"
                    title="Duplicate survey"
                  >
                    <Copy size={10} className="md:w-3 md:h-3" />
                    <span className="hidden sm:inline">Copy</span>
                  </button>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="text-center bg-red-50 text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1 text-xs"
                  >
                    <Trash2 size={10} className="md:w-3 md:h-3" />
                    <span className="hidden sm:inline">Del</span>
                  </button>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-gray-200 space-y-2">
                  <button
                    onClick={async () => {
                      try {
                        const linkData = await storage.createSurveyLink(survey.id);
                        navigator.clipboard.writeText(linkData.url);
                        toast.success('Survey link copied to clipboard! This link will expire in 7 days.');
                      } catch (error) {
                        toast.error('Failed to create survey link. Please try again.');
                      }
                    }}
                    className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium text-center"
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
                    <Mail size={12} className="text-gray-600 flex-shrink-0" />
                    <span className="truncate">Email notifications</span>
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
