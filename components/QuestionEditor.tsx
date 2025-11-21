'use client';

import { useState, useEffect } from 'react';
import { Question, QuestionType, QuestionOption } from '@/types/survey';
import { X, Plus, GripVertical, Trash2 } from 'lucide-react';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export default function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const [localQuestion, setLocalQuestion] = useState<Question>({
    ...question,
    title: String(question.title || '').replace(/0+$/, '').trim(),
  });

  // Watch for title changes and clean any trailing zeros
  useEffect(() => {
    if (localQuestion.title && localQuestion.title.toString().endsWith('0')) {
      const cleaned = String(localQuestion.title).replace(/0+$/, '').trim();
      if (cleaned !== localQuestion.title) {
        setLocalQuestion(prev => ({ ...prev, title: cleaned }));
        onUpdate({ ...localQuestion, title: cleaned });
      }
    }
  }, [localQuestion.title]);

  // Update local question when prop changes
  useEffect(() => {
    const cleanedTitle = String(question.title || '').replace(/0+$/, '').trim();
    if (cleanedTitle !== localQuestion.title) {
      setLocalQuestion(prev => ({ ...prev, title: cleanedTitle }));
    }
  }, [question.title]);

  const updateQuestion = (updates: Partial<Question>) => {
    // Clean title if it's being updated - ensure no trailing zeros
    if (updates.title !== undefined) {
      updates.title = String(updates.title).replace(/0+$/, '').trim();
    }
    const updated = { ...localQuestion, ...updates };
    
    // Ensure title is always clean
    if (updated.title) {
      updated.title = String(updated.title).replace(/0+$/, '').trim();
    }
    
    // If changing to a choice type and options don't exist, initialize with default options
    if (['multiple-choice', 'single-choice'].includes(updates.type || localQuestion.type)) {
      if (!updated.options || updated.options.length === 0) {
        updated.options = [
          { id: Date.now().toString(), label: '' },
          { id: (Date.now() + 1).toString(), label: '' },
        ];
      }
    }
    
    // If changing away from choice types, remove options
    if (updates.type && !['multiple-choice', 'single-choice'].includes(updates.type)) {
      updated.options = undefined;
    }
    
    // CRITICAL: Always clean title one more time before setting state
    if (updated.title) {
      updated.title = String(updated.title).replace(/0+$/, '').trim();
    }
    
    setLocalQuestion(updated);
    onUpdate(updated);
  };

  const addOption = () => {
    if (!localQuestion.options) return;
    const newOption: QuestionOption = {
      id: Date.now().toString(),
      label: '',
    };
    updateQuestion({
      options: [...localQuestion.options, newOption],
    });
  };

  const updateOption = (optionId: string, label: string) => {
    if (!localQuestion.options) return;
    updateQuestion({
      options: localQuestion.options.map(opt =>
        opt.id === optionId ? { ...opt, label } : opt
      ),
    });
  };

  const deleteOption = (optionId: string) => {
    if (!localQuestion.options) return;
    updateQuestion({
      options: localQuestion.options.filter(opt => opt.id !== optionId),
    });
  };

  const needsOptions = ['multiple-choice', 'single-choice'].includes(localQuestion.type);

  return (
    <div className="w-full">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Type
        </label>
        <select
          value={localQuestion.type}
          onChange={(e) => {
            const newType = e.target.value as QuestionType;
            const needsOptions = ['multiple-choice', 'single-choice'].includes(newType);
            
            if (needsOptions && (!localQuestion.options || localQuestion.options.length === 0)) {
              // Initialize with 2 default empty options
              updateQuestion({
                type: newType,
                options: [
                  { id: Date.now().toString(), label: '' },
                  { id: (Date.now() + 1).toString(), label: '' },
                ],
              });
            } else {
              updateQuestion({ type: newType });
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="text">Short Text</option>
          <option value="textarea">Long Text</option>
          <option value="single-choice">Single Choice</option>
          <option value="multiple-choice">Multiple Choice</option>
          <option value="yes-no">Yes/No</option>
          <option value="rating">Rating Scale</option>
          <option value="date">Date</option>
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question Title *
        </label>
        <input
          type="text"
          value={String(localQuestion.title || '').replace(/0+$/, '')}
          onChange={(e) => {
            // Get the value and immediately remove any trailing zeros
            let value = e.target.value;
            // Remove trailing zeros that might have been added - be very aggressive
            value = value.replace(/0+$/, '').trim();
            // Only update if the value actually changed (to prevent infinite loops)
            const currentTitle = String(localQuestion.title || '').replace(/0+$/, '').trim();
            if (value !== currentTitle) {
              updateQuestion({ title: value });
            }
          }}
          onBlur={(e) => {
            // Trim whitespace and remove trailing zeros when user leaves the field
            const trimmed = e.target.value.trim().replace(/0+$/, '').trim();
            if (trimmed !== localQuestion.title) {
              updateQuestion({ title: trimmed });
            }
          }}
          placeholder="Enter your question"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={localQuestion.description || ''}
          onChange={(e) => updateQuestion({ description: e.target.value })}
          placeholder="Add a description"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {localQuestion.type === 'rating' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Rating
            </label>
            <input
              type="number"
              min="1"
              value={localQuestion.minRating ?? 1}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 1 : parseInt(value, 10);
                if (!isNaN(numValue) && numValue >= 1) {
                  updateQuestion({ minRating: numValue });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Rating
            </label>
            <input
              type="number"
              value={localQuestion.maxRating ?? 5}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = value === '' ? 5 : parseInt(value, 10);
                if (!isNaN(numValue)) {
                  updateQuestion({ maxRating: numValue });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {needsOptions && localQuestion.options && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          {localQuestion.options.map((option) => (
            <div key={option.id} className="flex gap-2 mb-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder="Option text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => deleteOption(option.id)}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mt-2"
          >
            <Plus size={16} />
            Add Option
          </button>
        </div>
      )}

      <div className="flex items-center">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localQuestion.required}
            onChange={(e) => updateQuestion({ required: e.target.checked })}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Required</span>
        </label>
      </div>
    </div>
  );
}

