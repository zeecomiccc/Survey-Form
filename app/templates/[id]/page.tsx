'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Save, Trash2, ArrowLeft, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import MobileHeader from '@/components/MobileHeader';
import { useToastContext } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionType } from '@/types/survey';
import QuestionEditor from '@/components/QuestionEditor';
import { cleanQuestionTitle } from '@/lib/utils';

function SortableQuestion({
  question,
  index,
  onUpdate,
  onDelete,
  isCollapsed,
  onToggleCollapse,
}: {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative" id={`question-${question.id}`}>
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-4 hover:border-primary-300 transition-colors relative">
        {/* Expand/Collapse button in top left corner */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleCollapse();
          }}
          className="absolute top-4 left-4 p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors z-10"
          title={isCollapsed ? 'Expand question' : 'Collapse question'}
        >
          {isCollapsed ? (
            <ChevronDown size={20} />
          ) : (
            <ChevronUp size={20} />
          )}
        </button>
        
        {/* Delete button in top right corner */}
        <button
          onClick={onDelete}
          className="absolute top-4 right-4 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors z-10"
          title="Delete question"
        >
          <Trash2 size={20} />
        </button>
        
        {isCollapsed ? (
          <div className="flex items-start gap-4 pr-20 pl-12">
            <div
              {...attributes}
              {...listeners}
              className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-100"
              title="Drag to reorder"
            >
              <GripVertical size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {cleanQuestionTitle(question.title) || 'Untitled Question'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Click arrow to expand and edit</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 mb-4 pr-20 pl-12">
            <div
              {...attributes}
              {...listeners}
              className="mt-2 text-gray-400 cursor-grab active:cursor-grabbing hover:text-primary-600 transition-colors p-1 rounded hover:bg-gray-100"
              title="Drag to reorder"
            >
              <GripVertical size={20} />
            </div>
            <div className="flex-1">
              <QuestionEditor
                question={question}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
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

    // Collapse all other questions and expand the new one
    const newCollapsed = new Set<string>();
    // Add all existing question IDs to collapsed set (except the new one)
    templateData.survey.questions.forEach(q => newCollapsed.add(q.id));
    setCollapsedQuestions(newCollapsed);

    // Scroll to the new question after a short delay to allow DOM update
    setTimeout(() => {
      const element = document.getElementById(`question-${newQuestion.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus on the question title input
        const titleInput = element.querySelector('input[placeholder="Enter your question"]') as HTMLInputElement;
        if (titleInput) {
          titleInput.focus();
        }
      }
    }, 100);
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTemplateData((prev) => {
        const questions = prev.survey.questions;
        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);
        const reordered = arrayMove(questions, oldIndex, newIndex);
        return {
          ...prev,
          survey: {
            ...prev.survey,
            questions: reordered.map((q, i) => ({ ...q, order: i })),
          },
        };
      });
    }
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={templateData.survey.questions.map((q) => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {templateData.survey.questions.map((question, index) => (
                      <SortableQuestion
                        key={question.id}
                        question={question}
                        index={index}
                        onUpdate={(q) => updateQuestion(index, q)}
                        onDelete={() => deleteQuestion(index)}
                        isCollapsed={collapsedQuestions.has(question.id)}
                        onToggleCollapse={() => {
                          const newCollapsed = new Set(collapsedQuestions);
                          if (newCollapsed.has(question.id)) {
                            newCollapsed.delete(question.id);
                          } else {
                            newCollapsed.add(question.id);
                          }
                          setCollapsedQuestions(newCollapsed);
                        }}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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

      {/* Sticky Floating Action Button - Outside container for better visibility */}
      {templateData.survey.questions.length > 0 && (
        <button
          onClick={addQuestion}
          className="fixed bottom-8 right-8 bg-primary-600 text-white rounded-full shadow-2xl hover:bg-primary-700 transition-all hover:scale-110 z-[100] flex items-center justify-center w-16 h-16"
          title="Add New Question"
          style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)' }}
        >
          <Plus size={32} strokeWidth={3} />
        </button>
      )}
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

