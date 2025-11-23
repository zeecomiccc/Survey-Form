'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Plus, Save, Eye, GripVertical, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import MobileHeader from '@/components/MobileHeader';
import { v4 as uuidv4 } from 'uuid';
import { Question, Survey, QuestionType } from '@/types/survey';
import { storage } from '@/lib/storage';
import QuestionEditor from '@/components/QuestionEditor';
import { cleanQuestionTitle } from '@/lib/utils';
import { surveyTemplates as defaultTemplates } from '@/lib/surveyTemplates';
import { useToastContext } from '@/contexts/ToastContext';
import { useModal } from '@/hooks/useModal';
import Modal from '@/components/Modal';

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
        {/* Expand/Collapse button in top left corner - Just an arrow icon */}
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
              <h3 className="text-lg font-semibold text-gray-900">{cleanQuestionTitle(question.title) || 'Untitled Question'}</h3>
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

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get('id');
  const       showTemplates = searchParams.get('templates') === 'true';
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(showTemplates);
  const [availableTemplates, setAvailableTemplates] = useState(defaultTemplates);
  const toast = useToastContext();
  const modalHook = useModal();

  useEffect(() => {
    const loadData = async () => {
      // Check authentication
      try {
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setCurrentUser(authData.user);
          
          // Load templates from API (includes database templates)
          try {
            const templatesResponse = await fetch('/api/templates', {
              credentials: 'include',
            });
            if (templatesResponse.ok) {
              const templates = await templatesResponse.json();
              setAvailableTemplates(templates);
            }
          } catch (error) {
            console.error('Error loading templates:', error);
            // Fall back to default templates
          }
        }
      } catch (error) {
        console.error('Auth error:', error);
      }

      // Load survey if editing
      if (surveyId) {
        const survey = await storage.getSurvey(surveyId);
        if (survey) {
          setTitle(survey.title);
          setDescription(survey.description || '');
          // Clean all question titles when loading
          const cleanedQuestions = survey.questions.map(q => ({
            ...q,
            title: String(q.title || '').replace(/0+$/, '').trim(),
          }));
          setQuestions(cleanedQuestions);
        }
      }
    };
    loadData();
  }, [surveyId]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const loadTemplate = (templateId: string) => {
    const template = availableTemplates.find((t: any) => t.id === templateId);
    if (template) {
      setTitle(template.survey.title);
      setDescription(template.survey.description || '');
      
      // Regenerate IDs for questions and options
      const templateQuestions = template.survey.questions.map((q, idx) => ({
        ...q,
        id: uuidv4(),
        order: idx,
        options: q.options?.map(opt => ({
          ...opt,
          id: uuidv4(),
        })),
      }));
      
      setQuestions(templateQuestions);
      setShowTemplateSelector(false);
      toast.success(`Template "${template.name}" loaded successfully!`);
    }
  };

  // Template Selector Component
  const TemplateSelector = () => {
    const handleClose = () => {
      setShowTemplateSelector(false);
      if (!surveyId) {
        router.push('/'); // Redirect to home page when closing without selecting
      }
    };

    return (
      <div 
        className="fixed inset-0 z-[10001] bg-black bg-opacity-50 flex items-center justify-center p-4"
        onClick={(e) => {
          // Close when clicking on backdrop (not the modal content)
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside modal
        >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose a Survey Template</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTemplates.map((template: any) => (
            <button
              key={template.id}
              onClick={() => loadTemplate(template.id)}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-lg transition-all text-left"
            >
              <div className="text-4xl mb-3">{template.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="text-xs text-gray-500">
                {template.survey.questions.length} questions
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <button
            onClick={handleClose}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
    );
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      type: 'text',
      title: '',
      required: false,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
    
    // Collapse all other questions and expand the new one
    const newCollapsed = new Set<string>();
    // Add all existing question IDs to collapsed set (except the new one)
    questions.forEach(q => newCollapsed.add(q.id));
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
    // Clean title before updating
    const cleanedQuestion = {
      ...question,
      title: String(question.title || '').replace(/0+$/, '').trim(),
    };
    const updated = [...questions];
    updated[index] = cleanedQuestion;
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    if (confirm('Are you sure you want to delete this question? This action cannot be undone.')) {
      setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })));
    }
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
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((q, i) => ({ ...q, order: i }));
      });
    }
  };

  const saveSurvey = async () => {
    if (!title.trim()) {
      toast.error('Please enter a survey title');
      return;
    }

    // Check if there are any questions at all
    if (questions.length === 0) {
      toast.error('Please add at least one question before saving the survey');
      return;
    }

    // Filter out questions without titles and check if any valid questions remain
    const validQuestions = questions.filter(q => q.title.trim());
    if (validQuestions.length === 0) {
      toast.error('Please add at least one question with a title before saving the survey');
      return;
    }

    try {
      let createdAt = new Date().toISOString();
      if (surveyId) {
        const existingSurvey = await storage.getSurvey(surveyId);
        if (existingSurvey) {
          createdAt = existingSurvey.createdAt;
        }
      }

      const survey: Survey = {
        id: surveyId || uuidv4(),
        title: title.trim(),
        description: description.trim() || undefined,
        questions: validQuestions.map(q => ({
          ...q,
          // Clean title - remove trailing zeros and trim
          title: String(q.title || '').trim().replace(/0+$/, '').trim(),
        })),
        createdAt,
        updatedAt: new Date().toISOString(),
      };

      await storage.saveSurvey(survey);
      toast.success('Survey saved successfully!');
      router.push('/');
    } catch (error) {
      toast.error('Failed to save survey. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showTemplateSelector && <TemplateSelector />}
      <Modal
        isOpen={modalHook.isOpen}
        onClose={modalHook.closeModal}
        onConfirm={modalHook.confirm}
        title={modalHook.modalOptions.title}
        message={modalHook.modalOptions.message}
        confirmText={modalHook.modalOptions.confirmText}
        cancelText={modalHook.modalOptions.cancelText}
        type={modalHook.modalOptions.type}
        showCancel={modalHook.modalOptions.showCancel}
      />
      <MobileHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        showBackButton={true}
        backButtonLabel="Back to Surveys"
        backButtonHref="/"
      />
      
      {/* Save button - separate from header */}
      <div className="bg-white border-b shadow-sm sticky top-[73px] md:top-[73px] z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-end">
            <button
              onClick={saveSurvey}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
            >
              <Save size={16} className="md:w-5 md:h-5" />
              Save Survey
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-8 mb-6">
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter survey title"
              className="w-full px-4 py-2 md:py-3 text-base md:text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter survey description"
              rows={3}
              className="w-full px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm md:text-base"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Questions</h2>
            <button
              onClick={addQuestion}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
            >
              <Plus size={16} className="md:w-5 md:h-5" />
              Add Question
            </button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-gray-600 mb-4">No questions yet</p>
              <button
                onClick={addQuestion}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Add your first question
              </button>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                {questions.map((question, index) => (
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
      </div>
      
      {/* Sticky Floating Action Button - Outside container for better visibility */}
      <button
        onClick={addQuestion}
        className="fixed bottom-8 right-8 bg-primary-600 text-white rounded-full shadow-2xl hover:bg-primary-700 transition-all hover:scale-110 z-[100] flex items-center justify-center w-16 h-16"
        title="Add New Question"
        style={{ boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)' }}
      >
        <Plus size={32} strokeWidth={3} />
      </button>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

