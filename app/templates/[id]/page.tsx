'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus, Save, Trash2, ArrowLeft, X } from 'lucide-react';
import MobileHeader from '@/components/MobileHeader';
import { useToastContext } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionType } from '@/types/survey';
import QuestionEditor from '@/components/QuestionEditor';

function TemplateEditorContent() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  const isNew = templateId === 'new';

  const [templateData, setTemplateData] = useState({
    id: '',
    name: '',
    description: '',
    icon: '📋',
    survey: {
      title: '',
      description: '',
      questions: [] as Question[],
    },
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastContext();
  const modal = useModal();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser && !isNew) {
      loadTemplate();
    } else if (currentUser && isNew) {
      setLoading(false);
    }
  }, [currentUser, templateId, isNew]);

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
        router.push('/templates');
        return;
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const loadTemplate = async () => {
    try {
      const response = await fetch('/api/templates', {
        credentials: 'include',
      });
      if (response.ok) {
        const templates = await response.json();
        const template = templates.find((t: any) => t.id === templateId);
        if (template) {
          setTemplateData({
            id: template.id,
            name: template.name,
            description: template.description || '',
            icon: template.icon || '📋',
            survey: {
              title: template.survey.title || '',
              description: template.survey.description || '',
              questions: template.survey.questions || [],
            },
          });
        } else {
          toast.error('Template not found');
          router.push('/templates');
        }
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateData.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!templateData.survey.title.trim()) {
      toast.error('Survey title is required');
      return;
    }

    setSaving(true);
    try {
      const templateToSave = {
        id: isNew ? undefined : templateData.id,
        name: templateData.name,
        description: templateData.description,
        icon: templateData.icon,
        survey: {
          title: templateData.survey.title,
          description: templateData.survey.description || '',
          questions: templateData.survey.questions.map((q, index) => ({
            ...q,
            order: index,
          })),
        },
      };

      const url = isNew ? '/api/templates' : '/api/templates';
      const method = isNew ? 'POST' : 'PUT';

      const body: any = isNew
        ? { template: templateToSave }
        : { templateId: templateData.id, template: templateToSave };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to save template');
        return;
      }

      const result = await response.json();
      toast.success(isNew ? 'Template created successfully' : 'Template updated successfully');

      // Redirect to templates list
      setTimeout(() => {
        router.push('/templates');
      }, 1000);
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (isNew) {
      router.push('/templates');
      return;
    }

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
          const response = await fetch(`/api/templates?id=${templateData.id}`, {
            method: 'DELETE',
            credentials: 'include',
          });

          if (!response.ok) {
            const error = await response.json();
            toast.error(error.error || 'Failed to delete template');
            return;
          }

          toast.success('Template deleted successfully');
          router.push('/templates');
        } catch (error) {
          console.error('Error deleting template:', error);
          toast.error('Failed to delete template');
        }
      }
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      type: 'text',
      title: '',
      description: '',
      required: false,
      order: templateData.survey.questions.length,
    };

    setTemplateData({
      ...templateData,
      survey: {
        ...templateData.survey,
        questions: [...templateData.survey.questions, newQuestion],
      },
    });
  };

  const updateQuestion = (index: number, question: Question) => {
    const updatedQuestions = [...templateData.survey.questions];
    updatedQuestions[index] = question;
    setTemplateData({
      ...templateData,
      survey: {
        ...templateData.survey,
        questions: updatedQuestions,
      },
    });
  };

  const deleteQuestion = (index: number) => {
    modal.openModal(
      {
        title: 'Delete Question',
        message: 'Are you sure you want to delete this question?',
        type: 'danger',
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      () => {
        const updatedQuestions = templateData.survey.questions.filter((_, i) => i !== index);
        setTemplateData({
          ...templateData,
          survey: {
            ...templateData.survey,
            questions: updatedQuestions.map((q, i) => ({ ...q, order: i })),
          },
        });
        toast.success('Question deleted');
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
      <MobileHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        showBackButton
        backButtonLabel="Back to Templates"
        backButtonHref="/templates"
      />

      <div className="container mx-auto px-4 py-6 md:py-12 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {isNew ? 'Create New Template' : 'Edit Template'}
            </h1>

            {/* Template Info */}
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="e.g., Customer Feedback"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={templateData.icon}
                    onChange={(e) => setTemplateData({ ...templateData, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    placeholder="📋"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template ID
                  </label>
                  <input
                    type="text"
                    value={templateData.id || 'auto-generated'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateData.description}
                  onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Brief description of the template"
                />
              </div>
            </div>

            {/* Survey Info */}
            <div className="space-y-4 mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Survey Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Title *
                </label>
                <input
                  type="text"
                  value={templateData.survey.title}
                  onChange={(e) =>
                    setTemplateData({
                      ...templateData,
                      survey: { ...templateData.survey, title: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Survey Title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Survey Description
                </label>
                <textarea
                  value={templateData.survey.description}
                  onChange={(e) =>
                    setTemplateData({
                      ...templateData,
                      survey: { ...templateData.survey, description: e.target.value },
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Survey description"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
                <button
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              </div>

              {templateData.survey.questions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="mb-4">No questions yet. Click "Add Question" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templateData.survey.questions.map((question, index) => (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                        <button
                          onClick={() => deleteQuestion(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                          title="Delete Question"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <QuestionEditor
                        question={question}
                        onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                        onDelete={() => deleteQuestion(index)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleDelete}
                disabled={isNew}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                  isNew
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Trash2 size={18} />
                Delete Template
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/templates')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </div>
          </div>
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

export default function TemplateEditorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <TemplateEditorContent />
    </Suspense>
  );
}

