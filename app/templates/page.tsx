'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, FileText, Trash2, Plus } from 'lucide-react';
import MobileHeader from '@/components/MobileHeader';
import { useToastContext } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';
import { SurveyTemplate } from '@/lib/surveyTemplates';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToastContext();
  const modal = useModal();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      if (!response.ok) {
        router.push('/login');
        return;
      }
      const data = await response.json();
      setCurrentUser(data.user);
      
      if (data.user.role !== 'admin') {
        router.push('/');
        return;
      }
      
      loadTemplates();
    } catch (error) {
      router.push('/login');
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (template: SurveyTemplate) => {
    modal.openModal(
      {
        title: 'Delete Template',
        message: 'Are you sure you want to delete this template? This action cannot be undone.',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      async () => {
        try {
          const response = await fetch(`/api/templates?id=${template.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            toast.error(error.error || 'Failed to delete template');
            return;
          }

          toast.success('Template deleted successfully');
          loadTemplates();
        } catch (error) {
          console.error('Error deleting template:', error);
          toast.error('Failed to delete template');
        }
      }
    );
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <MobileHeader currentUser={currentUser} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-6 md:py-12">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Survey Templates</h1>
          <p className="text-gray-600 text-sm md:text-base">
            Manage survey templates available to all users
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-600">
                Create and manage survey templates. Templates are saved to the database and will persist across deployments.
              </p>
            </div>
            <Link
              href="/templates/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Plus size={18} />
              Create New Template
            </Link>
          </div>

          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="text-4xl flex-shrink-0">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FileText size={14} />
                          {template.survey.questions.length} questions
                        </span>
                        <span>ID: {template.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/templates/${template.id}`}
                      className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium flex-shrink-0"
                      title="Edit Template"
                    >
                      <Edit size={18} />
                      <span className="hidden sm:inline">Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(template)}
                      className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium flex-shrink-0"
                      title="Delete Template"
                    >
                      <Trash2 size={18} />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {templates.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No templates found</p>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}

