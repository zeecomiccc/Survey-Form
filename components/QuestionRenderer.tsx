'use client';

import { Question, Answer } from '@/types/survey';
import { useState } from 'react';

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
        const min = question.minRating || 1;
        const max = question.maxRating || 5;
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

  return (
    <div className="mb-8">
      <label className="block text-lg font-semibold text-gray-900 mb-2">
        {question.title}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-gray-600 mb-4">{question.description}</p>
      )}
      {renderQuestion()}
    </div>
  );
}

