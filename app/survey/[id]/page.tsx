'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { Survey, Answer } from '@/types/survey';
import { storage } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid';
import { cleanQuestionTitle } from '@/lib/utils';
import QuestionRenderer from '@/components/QuestionRenderer';
import { useToastContext } from '@/contexts/ToastContext';

function SurveyPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = params.id as string;
  const linkToken = searchParams.get('token');
  const toast = useToastContext();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSurvey = async () => {
      setLoading(true);
      try {
        const foundSurvey = await storage.getSurvey(surveyId);
        
        // Check if survey is published (if accessed via link)
        if (linkToken && foundSurvey && !foundSurvey.published) {
          toast.error('This survey is not currently published.');
          router.push('/');
          return;
        }
        if (!foundSurvey) {
          // Don't redirect to home, just show error
          setLoading(false);
          return;
        }
        // Clean all question titles when loading survey - remove trailing zeros
        // This is critical - the "0" appears in survey form view
        console.log('Loading survey, cleaning titles...');
        const cleanedSurvey = {
          ...foundSurvey,
          questions: foundSurvey.questions.map(q => {
            const originalTitle = q.title;
            const cleanedTitle = cleanQuestionTitle(q.title);
            if (originalTitle !== cleanedTitle) {
              console.log('Cleaned question title:', originalTitle, '->', cleanedTitle);
            }
            return {
              ...q,
              title: cleanedTitle,
            };
          }),
        };
        console.log('Survey loaded with cleaned titles');
        setSurvey(cleanedSurvey);
        setLoading(false);

        // Check if link token has already been used
        if (linkToken) {
          // Check localStorage first (client-side check)
          const submittedTokens = JSON.parse(localStorage.getItem('submitted_tokens') || '[]');
          if (submittedTokens.includes(linkToken)) {
            setAlreadySubmitted(true);
            return;
          }

          // Check server-side
          try {
            const response = await fetch(`/api/responses/check-link?token=${linkToken}`);
            if (response.ok) {
              const data = await response.json();
              if (data.hasSubmitted) {
                setAlreadySubmitted(true);
                // Store in localStorage
                submittedTokens.push(linkToken);
                localStorage.setItem('submitted_tokens', JSON.stringify(submittedTokens));
              }
            }
          } catch (error) {
            console.error('Error checking link submission:', error);
          }
        }
      } catch (error) {
        console.error('Error loading survey:', error);
        setLoading(false);
      }
    };
    loadSurvey();
  }, [surveyId, router, linkToken]);

  // Monitor and clean question titles in real-time (defensive)
  useEffect(() => {
    if (survey && survey.questions) {
      const needsCleaning = survey.questions.some(q => {
        const title = String(q.title || '').trim();
        return title.endsWith('0');
      });
      
      if (needsCleaning) {
        const cleanedSurvey = {
          ...survey,
          questions: survey.questions.map(q => ({
            ...q,
            title: cleanQuestionTitle(q.title),
          })),
        };
        setSurvey(cleanedSurvey);
      }
    }
  }, [survey]);

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setAnswers({ ...answers, [questionId]: value });
    if (errors[questionId]) {
      setErrors({ ...errors, [questionId]: false });
    }
  };

  const validateCurrentQuestion = (): boolean => {
    if (!survey) return false;
    const currentQuestion = survey.questions[currentQuestionIndex];
    if (!currentQuestion) return true;

    if (currentQuestion.required) {
      const answer = answers[currentQuestion.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
        setErrors({ ...errors, [currentQuestion.id]: true });
        return false;
      }
    }

    // Clear error for current question if it's valid
    if (errors[currentQuestion.id]) {
      setErrors({ ...errors, [currentQuestion.id]: false });
    }

    return true;
  };

  const validateAllAnswers = (): boolean => {
    if (!survey) return false;
    const newErrors: Record<string, boolean> = {};
    
    survey.questions.forEach((question) => {
      if (question.required) {
        const answer = answers[question.id];
        if (!answer || (Array.isArray(answer) && answer.length === 0) || answer === '') {
          newErrors[question.id] = true;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!survey) return;
    
    if (validateCurrentQuestion()) {
      if (currentQuestionIndex < survey.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!survey || !validateAllAnswers()) {
      // If validation fails, go to first question with error
      if (!survey) return;
      const firstErrorIndex = survey.questions.findIndex(q => {
        if (!q.required) return false;
        const answer = answers[q.id];
        return !answer || 
               (Array.isArray(answer) && answer.length === 0) || 
               (typeof answer === 'string' && answer === '') ||
               answer === null ||
               answer === undefined;
      });
      if (firstErrorIndex >= 0) {
        setCurrentQuestionIndex(firstErrorIndex);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    try {
      const response = {
        id: uuidv4(),
        surveyId: survey.id,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId,
          value,
        })) as Answer[],
        submittedAt: new Date().toISOString(),
        linkToken: linkToken || undefined,
      };

      await storage.saveResponse(response);
      
      // Store token in localStorage to prevent duplicate submissions
      if (linkToken) {
        const submittedTokens = JSON.parse(localStorage.getItem('submitted_tokens') || '[]');
        if (!submittedTokens.includes(linkToken)) {
          submittedTokens.push(linkToken);
          localStorage.setItem('submitted_tokens', JSON.stringify(submittedTokens));
        }
      }
      
      setSubmitted(true);
      toast.success('Thank you! Your response has been submitted successfully.');
    } catch (error: any) {
      if (error.message && error.message.includes('already been used')) {
        setAlreadySubmitted(true);
        toast.error('This link has already been used to submit a response. Please request a new link.');
      } else {
        toast.error('Failed to submit response. Please try again.');
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Survey...</h2>
          <p className="text-gray-600 text-sm">Please wait while we fetch the survey.</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Found</h2>
          <p className="text-gray-600 mb-6">The survey you're looking for doesn't exist or may have been removed.</p>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg w-full">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-4">
              <AlertCircle size={64} className="text-yellow-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Already Submitted</h1>
          <p className="text-lg text-gray-600 mb-2">
            You have already submitted a response using this link.
          </p>
          <p className="text-gray-500 mb-8">
            Each survey link can only be used once. If you need to submit again, please request a new link.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg w-full animate-fade-in">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
              <CheckCircle size={64} className="text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-2">Your response has been submitted successfully.</p>
          <p className="text-gray-500">
            We appreciate you taking the time to complete this survey.
          </p>
        </div>
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / survey.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{survey.title}</h1>
          {survey.description && (
            <p className="text-gray-600 mb-4">{survey.description}</p>
          )}
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {survey.questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {currentQuestion && (
            <>
              <QuestionRenderer
                question={currentQuestion}
                value={answers[currentQuestion.id]}
                onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              />
              {errors[currentQuestion.id] && (
                <p className="text-red-500 text-sm mt-1 mb-4">This question is required</p>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex gap-4">
                {!isFirstQuestion && (
                  <button
                    onClick={handlePrevious}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                )}
                
                <div className="flex-1"></div>
                
                {!isLastQuestion ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
                  >
                    Submit Survey
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SurveyPageContent />
    </Suspense>
  );
}

