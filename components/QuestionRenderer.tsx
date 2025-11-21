'use client';

import { Question, Answer } from '@/types/survey';
import { useState } from 'react';
import { cleanQuestionTitle } from '@/lib/utils';

interface QuestionRendererProps {
  question: Question;
  value?: string | string[] | number;
  onChange: (value: string | string[] | number) => void;
}

export default function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your answer"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your answer"
          />
        );

      case 'single-choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={value === option.id}
                  onChange={() => onChange(option.id)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'multiple-choice':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.id}
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.id]);
                    } else {
                      onChange(selectedValues.filter(id => id !== option.id));
                    }
                  }}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                />
                <span className="ml-3 text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'yes-no':
        return (
          <div className="flex gap-4">
            {['yes', 'no'].map((option) => (
              <label
                key={option}
                className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex-1"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={() => onChange(option)}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-3 text-gray-700 capitalize">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        const min = Math.max(1, question.minRating || 1); // Ensure min is at least 1
        const max = Math.max(min, question.maxRating || 5); // Ensure max is at least min
        return (
          <div className="flex gap-2">
            {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onChange(num)}
                className={`w-12 h-12 rounded-lg border-2 font-semibold transition-colors ${
                  value === num
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        );

      default:
        return null;
    }
  };

  // Clean the title to remove any trailing zeros
  // CRITICAL FIX: The "0" appears when question.required is false
  // This suggests the title might be getting concatenated with required value somewhere
  // We need to be very aggressive about cleaning
  let cleanTitle = cleanQuestionTitle(question.title);
  // Clean again just in case
  cleanTitle = cleanQuestionTitle(cleanTitle);
  
  // CRITICAL: If required is false and title ends with 0, it's likely the issue
  // Remove the trailing 0 if required is false
  if (!question.required && cleanTitle.endsWith('0') && cleanTitle.length > 1) {
    cleanTitle = cleanTitle.slice(0, -1).trim();
    console.warn('QuestionRenderer: Removed trailing 0 from non-required question!', {
      original: question.title,
      cleaned: cleanTitle,
      required: question.required,
    });
  }
  
  // Final safety check - if it still ends with 0, force remove it
  if (cleanTitle.endsWith('0') && cleanTitle.length > 1) {
    cleanTitle = cleanTitle.slice(0, -1).trim();
    console.error('QuestionRenderer: Force removed trailing 0!', cleanTitle);
  }
  
  return (
    <div className="mb-8">
      <div className="block text-lg font-semibold text-gray-900 mb-2">
        {cleanTitle}
        {/* Only show asterisk if required is true - explicitly check for true to avoid false rendering as 0 */}
        {question.required === true ? <span className="text-red-500 ml-1">*</span> : null}
      </div>
      {question.description && (
        <p className="text-gray-600 mb-4">{question.description}</p>
      )}
      {renderQuestion()}
    </div>
  );
}

