'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BarChart3, Users, CheckCircle, Download, Settings2, Palette } from 'lucide-react';
import Link from 'next/link';
import MobileHeader from '@/components/MobileHeader';
import { Survey, SurveyResponse, Question } from '@/types/survey';
import { storage } from '@/lib/storage';
import { cleanQuestionTitle } from '@/lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line,
  RadialBarChart, RadialBar
} from 'recharts';
import * as XLSX from 'xlsx';

type ChartType = 'pie' | 'doughnut' | 'column' | 'bar' | 'area' | 'line' | 'gauge';
type ColorPalette = 'default' | 'vibrant' | 'pastel' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'rainbow';

const COLOR_PALETTES: Record<ColorPalette, string[]> = {
  default: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
  vibrant: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'],
  pastel: ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#FFDFBA', '#E0BBE4', '#FEC8C1'],
  dark: ['#2C3E50', '#34495E', '#7F8C8D', '#95A5A6', '#BDC3C7', '#E74C3C', '#3498DB'],
  ocean: ['#0077BE', '#00A8E8', '#0096D6', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4'],
  sunset: ['#FF6B35', '#F7931E', '#FFD23F', '#FFA07A', '#FF8C69', '#FF7F50', '#FF6347'],
  forest: ['#2D5016', '#3E7B27', '#4A9B2F', '#5BB43A', '#6BC547', '#7DD056', '#8FE065'],
  rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
};

interface ChartSettings {
  type: ChartType;
  palette: ColorPalette;
  show3D: boolean;
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string;
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartSettings, setChartSettings] = useState<Record<string, ChartSettings>>({});
  const [openSettings, setOpenSettings] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Check authentication
        const authResponse = await fetch('/api/auth/me');
        if (authResponse.ok) {
          const authData = await authResponse.json();
          setCurrentUser(authData.user);
        }

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

    const wb = XLSX.utils.book_new();
    const totalResponses = responses.length;

    // ============================================
    // Sheet 1: Raw Data
    // ============================================
    const rawData: any[] = [];
    const headers = ['Response ID', 'Submitted At', ...survey.questions.map(q => cleanQuestionTitle(q.title))];
    rawData.push(headers);

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
            const optionLabels = answer.value.map(optionId => {
              const option = question.options?.find(o => o.id === optionId);
              return option?.label || optionId;
            });
            answerText = optionLabels.join(', ');
          } else if (typeof answer.value === 'number') {
            answerText = answer.value.toString();
          } else {
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

      rawData.push(row);
    });

    const wsRaw = XLSX.utils.aoa_to_sheet(rawData);

    // Auto-size columns for raw data
    const colWidths = headers.map((header, idx) => {
      const maxLength = Math.max(
        header.length,
        ...rawData.slice(1).map(row => String(row[idx] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) };
    });
    wsRaw['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsRaw, 'Raw Data');

    // ============================================
    // Sheet 2: Statistics with Calculations
    // ============================================
    const statsData: any[] = [];
    
    // Summary header
    statsData.push(['Survey Statistics']);
    statsData.push(['Survey Title:', survey.title]);
    statsData.push(['Total Responses:', totalResponses]);
    statsData.push(['Generated At:', new Date().toLocaleString()]);
    statsData.push([]); // Empty row

    // Process each question
    survey.questions.forEach((question) => {
      statsData.push([]); // Empty row between questions
      statsData.push(['Question:', cleanQuestionTitle(question.title)]);
      
      const stats = getQuestionStats(question);
      
      if (stats && Array.isArray(stats) && stats.length > 0) {
        // Header row for statistics
        statsData.push(['Option/Value', 'Count', 'Percentage', 'Percentage Formula']);
        
        // Data rows with calculations
        stats.forEach((stat) => {
          const count = stat.count;
          const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
          const percentageFormula = totalResponses > 0 ? `=${count}/${totalResponses}*100` : '0';
          
          statsData.push([
            stat.name,
            count,
            { t: 'n', v: percentage, z: '0.00' }, // Number format with 2 decimals
            { t: 'n', f: percentageFormula, z: '0.00' } // Formula for percentage
          ]);
        });

        // Total row
        statsData.push(['Total', totalResponses, '100.00%', '']);
      } else if (question.type === 'text' || question.type === 'textarea' || question.type === 'date') {
        // For text questions, show response count
        const textAnswers = responses
          .map(r => getAnswerForQuestion(r, question.id))
          .filter((v): v is string => typeof v === 'string' && !Array.isArray(v) && v !== null && v !== undefined);
        
        statsData.push(['Total Text Responses:', textAnswers.length]);
        statsData.push(['Response Rate:', totalResponses > 0 ? `${((textAnswers.length / totalResponses) * 100).toFixed(2)}%` : '0%']);
      } else if (question.type === 'rating') {
        // For rating questions, show statistics
        const ratings = responses
          .map(r => getAnswerForQuestion(r, question.id))
          .filter((v): v is number => typeof v === 'number');
        
        if (ratings.length > 0) {
          const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          const minRating = Math.min(...ratings);
          const maxRating = Math.max(...ratings);
          
          statsData.push(['Average Rating:', { t: 'n', v: avgRating, z: '0.00' }]);
          statsData.push(['Min Rating:', minRating]);
          statsData.push(['Max Rating:', maxRating]);
          statsData.push(['Total Responses:', ratings.length]);
          
          // Rating distribution
          statsData.push([]);
          statsData.push(['Rating', 'Count', 'Percentage', 'Percentage Formula']);
          
          const ratingStats = getQuestionStats(question);
          if (ratingStats) {
            ratingStats.forEach((stat) => {
              const count = stat.count;
              const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;
              const percentageFormula = totalResponses > 0 ? `=${count}/${totalResponses}*100` : '0';
              
              statsData.push([
                stat.name,
                count,
                { t: 'n', v: percentage, z: '0.00' },
                { t: 'n', f: percentageFormula, z: '0.00' }
              ]);
            });
          }
        }
      }
    });

    // Create statistics worksheet
    const wsStats = XLSX.utils.aoa_to_sheet(statsData);
    
    // Format statistics sheet columns
    const statsColWidths = [
      { wch: 30 }, // Question/Option column
      { wch: 12 }, // Count column
      { wch: 15 }, // Percentage column
      { wch: 25 }, // Formula column
    ];
    wsStats['!cols'] = statsColWidths;

    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistics');

    // ============================================
    // Sheet 3: Response Summary
    // ============================================
    const summaryData: any[] = [];
    summaryData.push(['Survey Summary']);
    summaryData.push(['Survey Title:', survey.title]);
    summaryData.push(['Total Questions:', survey.questions.length]);
    summaryData.push(['Total Responses:', totalResponses]);
    summaryData.push(['First Response:', responses.length > 0 ? new Date(Math.min(...responses.map(r => new Date(r.submittedAt).getTime()))).toLocaleString() : 'N/A']);
    summaryData.push(['Last Response:', responses.length > 0 ? new Date(Math.max(...responses.map(r => new Date(r.submittedAt).getTime()))).toLocaleString() : 'N/A']);
    summaryData.push([]);
    
    // Question-wise summary
    summaryData.push(['Question Summary']);
    summaryData.push(['Question', 'Type', 'Response Count', 'Response Rate']);
    
    survey.questions.forEach((question) => {
      const stats = getQuestionStats(question);
      let responseCount = 0;
      
      if (stats && Array.isArray(stats)) {
        responseCount = stats.reduce((sum, s) => sum + s.count, 0);
      } else if (question.type === 'text' || question.type === 'textarea' || question.type === 'date') {
        const textAnswers = responses
          .map(r => getAnswerForQuestion(r, question.id))
          .filter((v): v is string => typeof v === 'string' && !Array.isArray(v) && v !== null && v !== undefined);
        responseCount = textAnswers.length;
      }
      
      const responseRate = totalResponses > 0 ? `${((responseCount / totalResponses) * 100).toFixed(2)}%` : '0%';
      
      summaryData.push([
        cleanQuestionTitle(question.title),
        question.type,
        responseCount,
        responseRate
      ]);
    });

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    const summaryColWidths = [
      { wch: 40 }, // Question
      { wch: 20 }, // Type
      { wch: 15 }, // Response Count
      { wch: 15 }, // Response Rate
    ];
    wsSummary['!cols'] = summaryColWidths;

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Export file
    const fileName = `${survey.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Get or initialize chart settings for a question
  const getChartSettings = (questionId: string, questionType: string): ChartSettings => {
    if (!chartSettings[questionId]) {
      // Default settings based on question type
      const defaultType: ChartType = questionType === 'rating' ? 'column' : 'pie';
      return {
        type: defaultType,
        palette: 'default',
        show3D: false
      };
    }
    return chartSettings[questionId];
  };

  const updateChartSettings = (questionId: string, settings: Partial<ChartSettings>) => {
    setChartSettings(prev => ({
      ...prev,
      [questionId]: {
        ...getChartSettings(questionId, ''),
        ...settings
      }
    }));
  };

  // Generate gradient color for 3D effect
  const getGradientColor = (color: string, questionId: string, index: number, is3D: boolean) => {
    if (!is3D) return color;
    const hex = color.replace('#', '');
    return `url(#gradient-${questionId}-${hex}-${index})`;
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

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        showBackButton={true}
        backButtonLabel="Back to Surveys"
        backButtonHref="/"
      />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 mb-4 text-sm md:text-base break-words">{survey.description}</p>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users size={16} className="md:w-5 md:h-5" />
                <span>{responses.length} Responses</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="md:w-5 md:h-5" />
                <span>{survey.questions.length} Questions</span>
              </div>
            </div>
            {responses.length > 0 && (
              <button
                onClick={exportToExcel}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm md:text-base"
              >
                <Download size={16} className="md:w-5 md:h-5" />
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
                <div key={question.id} className="bg-white rounded-xl shadow-md p-4 md:p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 break-words">{cleanQuestionTitle(question.title)}</h3>
                      {question.description && (
                        <p className="text-gray-600 mb-4 text-xs md:text-sm break-words">{question.description}</p>
                      )}
                    </div>
                  </div>

                  {hasStats ? (
                    <div className="mt-4">
                      {(() => {
                        const settings = getChartSettings(question.id, question.type);
                        const colors = COLOR_PALETTES[settings.palette];
                        const isRating = question.type === 'rating';
                        
                        // Determine available chart types based on question type
                        const availableTypes: ChartType[] = isRating 
                          ? ['column', 'bar', 'area', 'line', 'gauge']
                          : ['pie', 'doughnut', 'column', 'bar', 'area', 'line'];

                        return (
                          <>
                            {/* Chart Settings Panel */}
                            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => setOpenSettings(openSettings === question.id ? null : question.id)}
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                                >
                                  <Settings2 size={16} />
                                  Chart Options
                                </button>
                                {openSettings === question.id && (
                                  <div className="flex items-center gap-3 flex-wrap p-2 bg-gray-50 rounded-lg border border-gray-200">
                                    {/* Chart Type Selector */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-600">Type:</span>
                                      <select
                                        value={settings.type}
                                        onChange={(e) => updateChartSettings(question.id, { type: e.target.value as ChartType })}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                      >
                                        {availableTypes.map(type => (
                                          <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {/* Color Palette Selector */}
                                    <div className="flex items-center gap-2">
                                      <Palette size={14} className="text-gray-600" />
                                      <select
                                        value={settings.palette}
                                        onChange={(e) => updateChartSettings(question.id, { palette: e.target.value as ColorPalette })}
                                        className="px-2 py-1 text-xs border border-gray-300 rounded bg-white"
                                      >
                                        {Object.keys(COLOR_PALETTES).map(palette => (
                                          <option key={palette} value={palette}>
                                            {palette.charAt(0).toUpperCase() + palette.slice(1)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    
                                    {/* 3D Toggle */}
                                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={settings.show3D}
                                        onChange={(e) => updateChartSettings(question.id, { show3D: e.target.checked })}
                                        className="rounded"
                                      />
                                      <span>3D Effect</span>
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Chart Rendering */}
                            <div className="relative">
                              {/* SVG Gradients for 3D Effect */}
                              {settings.show3D && (
                                <svg width="0" height="0" style={{ position: 'absolute' }}>
                                  <defs>
                                    {stats.map((entry, index) => {
                                      const color = colors[index % colors.length];
                                      const hex = color.replace('#', '');
                                      const r = parseInt(hex.substring(0, 2), 16);
                                      const g = parseInt(hex.substring(2, 4), 16);
                                      const b = parseInt(hex.substring(4, 6), 16);
                                      const lightR = Math.min(255, r + 40);
                                      const lightG = Math.min(255, g + 40);
                                      const lightB = Math.min(255, b + 40);
                                      const lightColor = `rgb(${lightR}, ${lightG}, ${lightB})`;
                                      const gradientId = `gradient-${question.id}-${hex}-${index}`;
                                      
                                      return (
                                        <linearGradient key={index} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="0%" stopColor={lightColor} />
                                          <stop offset="100%" stopColor={color} />
                                        </linearGradient>
                                      );
                                    })}
                                  </defs>
                                </svg>
                              )}

                              {/* Pie Chart */}
                              {(settings.type === 'pie' || settings.type === 'doughnut') && (
                          <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                              <Pie
                                data={stats}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                      label={settings.type === 'pie' ? ({ percent }) => `${(percent * 100).toFixed(0)}%` : false}
                                      outerRadius={settings.type === 'doughnut' ? 120 : 130}
                                      innerRadius={settings.type === 'doughnut' ? 60 : 0}
                                fill="#8884d8"
                                dataKey="count"
                                      paddingAngle={settings.show3D ? 3 : 0}
                                    >
                                      {stats.map((entry, index) => {
                                        const color = colors[index % colors.length];
                                        return (
                                          <Cell 
                                            key={`cell-${index}`} 
                                            fill={settings.show3D ? getGradientColor(color, question.id, index, true) : color}
                                            stroke={settings.show3D ? '#fff' : 'none'}
                                            strokeWidth={settings.show3D ? 2 : 0}
                                          />
                                        );
                                      })}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value: any) => [
                                        `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                        'Count'
                                      ]}
                                      labelFormatter={(label) => label || ''}
                                    />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              )}

                              {/* Column/Bar Chart */}
                              {(settings.type === 'column' || settings.type === 'bar') && (
                                <ResponsiveContainer width="100%" height={350}>
                                  <BarChart data={stats} layout={settings.type === 'bar' ? 'vertical' : undefined}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    {settings.type === 'column' ? (
                                      <>
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                      </>
                                    ) : (
                                      <>
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                      </>
                                    )}
                                    <Tooltip 
                                      formatter={(value: any) => [
                                        `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                        'Count'
                                      ]}
                                    />
                                    <Bar 
                                      dataKey="count" 
                                      radius={settings.show3D ? [8, 8, 0, 0] : [4, 4, 0, 0]}
                                    >
                                      {stats.map((entry, index) => {
                                        const color = colors[index % colors.length];
                                        return (
                                          <Cell 
                                            key={`cell-${index}`}
                                            fill={settings.show3D ? getGradientColor(color, question.id, index, true) : color}
                                          />
                                        );
                                      })}
                                    </Bar>
                                  </BarChart>
                                </ResponsiveContainer>
                              )}

                              {/* Area Chart */}
                              {settings.type === 'area' && (
                                <ResponsiveContainer width="100%" height={350}>
                                  <AreaChart data={stats}>
                                    <defs>
                                      {colors.map((color, idx) => (
                                        <linearGradient key={idx} id={`area-${idx}`} x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                                          <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                                        </linearGradient>
                                      ))}
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip 
                                      formatter={(value: any) => [
                                        `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                        'Count'
                                      ]}
                                    />
                                    <Area
                                      type="monotone"
                                      dataKey="count"
                                      stroke={colors[0]}
                                      fill={settings.show3D ? `url(#area-0)` : colors[0]}
                                      strokeWidth={2}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              )}

                              {/* Line Chart */}
                              {settings.type === 'line' && (
                                <ResponsiveContainer width="100%" height={350}>
                                  <LineChart data={stats}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip 
                                      formatter={(value: any) => [
                                        `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                        'Count'
                                      ]}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="count"
                                      stroke={colors[0]}
                                      strokeWidth={3}
                                      dot={{ fill: colors[0], r: settings.show3D ? 6 : 4 }}
                                      activeDot={{ r: 8 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              )}

                              {/* Gauge Chart (Radial Bar) */}
                              {settings.type === 'gauge' && stats.length > 0 && (
                                <ResponsiveContainer width="100%" height={350}>
                                  <RadialBarChart
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="20%"
                                    outerRadius="80%"
                                    data={stats.map((entry, index) => ({
                                      name: entry.name,
                                      value: entry.count,
                                      fill: colors[index % colors.length]
                                    }))}
                                    startAngle={90}
                                    endAngle={-270}
                                  >
                                    <RadialBar
                                      label={{ position: 'insideStart', fill: '#fff' }}
                                      background
                                      dataKey="value"
                                    />
                                    <Legend />
                                    <Tooltip 
                                      formatter={(value: any, name: any, props: any) => [
                                        `${value} (${((value / responses.length) * 100).toFixed(1)}%)`,
                                        props.payload.name
                                      ]}
                                    />
                                  </RadialBarChart>
                                </ResponsiveContainer>
                              )}
                            </div>

                            {/* Legend for non-pie charts */}
                            {(settings.type !== 'pie' && settings.type !== 'doughnut' && settings.type !== 'gauge') && (
                              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {stats.map((entry, index) => (
                                  <div 
                                    key={index} 
                                    className="flex items-center gap-2 p-2 rounded"
                                    style={{ backgroundColor: `${colors[index % colors.length]}15` }}
                                  >
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: colors[index % colors.length] }}
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
                            )}

                            {/* Legend for pie/doughnut charts */}
                            {(settings.type === 'pie' || settings.type === 'doughnut') && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {stats.map((entry, index) => (
                              <div 
                                key={index} 
                                className="flex items-center gap-2 p-2 rounded"
                                    style={{ backgroundColor: `${colors[index % colors.length]}15` }}
                              >
                                <div 
                                  className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: colors[index % colors.length] }}
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
                      )}
                          </>
                        );
                      })()}
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

