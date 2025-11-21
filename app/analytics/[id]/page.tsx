'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Users, CheckCircle, Download } from 'lucide-react';
import Link from 'next/link';
import { Survey, SurveyResponse, Question } from '@/types/survey';
import { storage } from '@/lib/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const foundSurvey = await storage.getSurvey(surveyId);
        if (!foundSurvey) {
          router.push('/');
          return;
        }
        setSurvey(foundSurvey);
        const surveyResponses = await storage.getResponses(surveyId);
        setResponses(surveyResponses);
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [surveyId, router]);

  const getAnswerForQuestion = (response: SurveyResponse, questionId: string) => {
    return response.answers.find(a => a.questionId === questionId)?.value;
  };

  const exportToExcel = () => {
    if (!survey || responses.length === 0) return;

    // Prepare data for export
    const exportData: any[] = [];

    // Add header row
    const headers = ['Response ID', 'Submitted At', ...survey.questions.map(q => cleanQuestionTitle(q.title))];
    exportData.push(headers);

    // Add response data
    responses.forEach((response) => {
      const row: any[] = [
        response.id,
        new Date(response.submittedAt).toLocaleString(),
      ];

      survey.questions.forEach((question) => {
        const answer = response.answers.find(a => a.questionId === question.id);
        let answerText = '';

        if (answer) {
          if (Array.isArray(answer.value)) {
            // Multiple choice - get option labels
            const optionLabels = answer.value.map(optionId => {
              const option = question.options?.find(o => o.id === optionId);
              return option?.label || optionId;
            });
            answerText = optionLabels.join(', ');
          } else if (typeof answer.value === 'number') {
            answerText = answer.value.toString();
          } else {
            // Single choice or text
            if (question.options) {
              const option = question.options.find(o => o.id === answer.value);
              answerText = option?.label || answer.value.toString();
            } else {
              answerText = answer.value.toString();
            }
          }
        }

        row.push(answerText || '(No answer)');
      });

      exportData.push(row);
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Survey Responses');

    // Auto-size columns
    const colWidths = headers.map((header, idx) => {
      const maxLength = Math.max(
        header.length,
        ...exportData.slice(1).map(row => String(row[idx] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    ws['!cols'] = colWidths;

    // Export file
    const fileName = `${survey.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getQuestionStats = (question: Question) => {
    if (question.type === 'text' || question.type === 'textarea' || question.type === 'date') {
      return null; // Text questions don't have chart stats
    }

    if (question.type === 'rating') {
      const ratings = responses
        .map(r => getAnswerForQuestion(r, question.id))
        .filter((v): v is number => typeof v === 'number');
      
      const min = question.minRating || 1;
      const max = question.maxRating || 5;
      const data = Array.from({ length: max - min + 1 }, (_, i) => {
        const value = i + min;
        return {
          name: value.toString(),
          count: ratings.filter(r => r === value).length,
        };
      });
      return data;
    }

    if (question.type === 'single-choice' || question.type === 'yes-no') {
      const answers = responses
        .map(r => getAnswerForQuestion(r, question.id))
        .filter((v): v is string => typeof v === 'string');
      
      const optionMap: Record<string, number> = {};
      answers.forEach(answer => {
        optionMap[answer] = (optionMap[answer] || 0) + 1;
      });

      return Object.entries(optionMap).map(([optionId, count]) => {
        // For yes-no questions, use the answer directly
        if (question.type === 'yes-no') {
          return { name: optionId.charAt(0).toUpperCase() + optionId.slice(1), count };
        }
        // For single-choice, look up the option label
        const option = question.options?.find(o => o.id === optionId);
        return { name: option?.label || optionId, count };
      });
    }

    if (question.type === 'multiple-choice') {
      const allAnswers = responses
        .map(r => getAnswerForQuestion(r, question.id))
        .filter((v): v is string[] => Array.isArray(v))
        .flat();
      
      const optionMap: Record<string, number> = {};
      allAnswers.forEach(answer => {
        optionMap[answer] = (optionMap[answer] || 0) + 1;
      });

      return Object.entries(optionMap).map(([name, count]) => {
        const option = question.options?.find(o => o.id === name);
        return { name: option?.label || name, count };
      });
    }

    return null;
  };

  if (loading || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading analytics...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              Back to Surveys
            </Link>
            <div className="flex items-center gap-2 text-gray-600">
              <BarChart3 size={20} />
              <span className="font-semibold">Analytics</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 mb-4">{survey.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users size={18} />
                <span>{responses.length} Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={18} />
                <span>{survey.questions.length} Questions</span>
              </div>
            </div>
            {responses.length > 0 && (
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download size={18} />
                Export to Excel
              </button>
            )}
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <BarChart3 size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg mb-2">No responses yet</p>
            <p className="text-gray-500">Share your survey to start collecting responses!</p>
            <Link
              href={`/survey/${survey.id}`}
              className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              View Survey →
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {survey.questions.map((question) => {
              const stats = getQuestionStats(question);
              const textAnswers = responses
                .map(r => getAnswerForQuestion(r, question.id))
                .filter((v): v is string => typeof v === 'string' && !Array.isArray(v));

              // Check if question has many options (more than 5) or many text answers (more than 10)
              const hasManyOptions = (stats && stats.length > 5) || (textAnswers.length > 10);
              const hasStats = stats && Array.isArray(stats) && stats.length > 0;
              const hasTextAnswers = Array.isArray(textAnswers) && textAnswers.length > 0;
              const hasData = hasStats || hasTextAnswers;

              return (
                <div key={question.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{cleanQuestionTitle(question.title)}</h3>
                      {question.description && (
                        <p className="text-gray-600 mb-4 text-sm">{question.description}</p>
                      )}
                    </div>
                  </div>

                  {hasStats ? (
                    <div className="mt-4">
                      {question.type === 'rating' ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={stats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any, name: any) => [
                                `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                name
                              ]}
                            />
                            <Bar dataKey="count" fill="#0ea5e9" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div>
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie
                                data={stats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="count"
                              >
                                {stats.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: any, name: any) => [
                                  `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                  name
                                ]}
                                labelFormatter={(label) => cleanQuestionTitle(question.title)}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stats.map((entry, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-2 p-2 rounded"
                                style={{ backgroundColor: `${COLORS[index % COLORS.length]}15` }}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                ></div>
                                <div className="flex-1">
                                  <span className="text-sm font-medium text-gray-700 break-words">
                                    {entry.name}
                                  </span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    ({((entry.count / responses.length) * 100).toFixed(0)}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        {textAnswers.length} response{textAnswers.length !== 1 ? 's' : ''}
                      </p>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {textAnswers.length > 0 ? (
                          textAnswers.map((answer, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                              {answer || '(No answer)'}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No text responses yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

