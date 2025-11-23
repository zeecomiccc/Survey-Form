'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, BarChart3, FileText, Edit, Trash2, Copy, Mail, Search, Filter, Eye, Grid, Table as TableIcon, ArrowUpDown, ArrowUp, ArrowDown, Users } from 'lucide-react';
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
  
  return <span>{count}</span>;
}

export default function TableViewDemo() {
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

  const handleSort = (column: 'date' | 'title' | 'responses') => {
    if (filterSort === column) {
      setFilterOrder(filterOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setFilterSort(column);
      setFilterOrder('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Survey Management</h1>
              <p className="text-gray-600 text-sm md:text-base">Modern table view demo</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Grid size={18} />
                <span className="hidden sm:inline">Card View</span>
              </Link>
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg text-sm md:text-base"
              >
                <Plus size={18} className="md:w-5 md:h-5" />
                <span className="hidden sm:inline">Create New Survey</span>
                <span className="sm:hidden">New</span>
              </Link>
            </div>
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
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('title')}>
                      <div className="flex items-center gap-2">
                        <span>Title</span>
                        {filterSort === 'title' && (
                          filterOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                        {filterSort !== 'title' && <ArrowUpDown size={14} className="text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('responses')}>
                      <div className="flex items-center gap-2">
                        <span>Responses</span>
                        {filterSort === 'responses' && (
                          filterOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                        {filterSort !== 'responses' && <ArrowUpDown size={14} className="text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-2">
                        <span>Created</span>
                        {filterSort === 'date' && (
                          filterOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                        )}
                        {filterSort !== 'date' && <ArrowUpDown size={14} className="text-gray-400" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {surveys.map((survey, index) => (
                    <tr key={survey.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                            <FileText className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{survey.title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {survey.description || <span className="text-gray-400 italic">No description</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {survey.questions.length} {survey.questions.length === 1 ? 'question' : 'questions'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            <ResponseCount surveyId={survey.id} />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(survey.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Quick Actions */}
                          <Link
                            href={`/survey/${survey.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Survey"
                          >
                            <Eye size={18} />
                          </Link>
                          <Link
                            href={`/analytics/${survey.id}`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Analytics"
                          >
                            <BarChart3 size={18} />
                          </Link>
                          <Link
                            href={`/builder?id=${survey.id}`}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Edit Survey"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(survey)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Duplicate Survey"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(survey.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Survey"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        
                        {/* Additional Actions */}
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const linkData = await storage.createSurveyLink(survey.id);
                                const linkToCopy = linkData.shortUrl || linkData.url;
                                const { copyToClipboard } = await import('@/lib/clipboard');
                                const success = await copyToClipboard(linkToCopy);
                                if (success) {
                                  toast.success(linkData.shortUrl ? 'Short link copied!' : 'Link copied!');
                                } else {
                                  toast.info('Please select and copy the link manually');
                                }
                              } catch (error) {
                                toast.error('Failed to create survey link. Please try again.');
                              }
                            }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                            title="Copy Survey Link"
                          >
                            <Mail size={14} />
                            Copy Link
                          </button>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={survey.emailNotificationsEnabled || false}
                              onChange={(e) => handleToggleEmailNotifications(survey.id, e.target.checked)}
                              className="w-3.5 h-3.5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              title="Email Notifications"
                            />
                            <Mail size={14} className="text-gray-600" />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (for small screens) */}
            <div className="md:hidden divide-y divide-gray-200">
              {surveys.map((survey) => (
                <div key={survey.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{survey.title}</h3>
                        {survey.description && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{survey.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-xs text-gray-600">
                    <span>{survey.questions.length} questions</span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      <ResponseCount surveyId={survey.id} /> responses
                    </span>
                    <span>{formatDate(survey.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/survey/${survey.id}`}
                      className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      View
                    </Link>
                    <Link
                      href={`/analytics/${survey.id}`}
                      className="px-3 py-1.5 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-1"
                    >
                      <BarChart3 size={12} />
                      Analytics
                    </Link>
                    <Link
                      href={`/builder?id=${survey.id}`}
                      className="px-3 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(survey)}
                      className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleDelete(survey.id)}
                      className="px-3 py-1.5 text-xs bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  Showing <span className="font-medium">{surveys.length}</span> of <span className="font-medium">{allSurveys.length}</span> surveys
                </div>
                <div className="flex items-center gap-2">
                  <TableIcon size={16} className="text-gray-400" />
                  <span>Table View</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

