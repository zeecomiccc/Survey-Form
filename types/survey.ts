export type QuestionType = 
  | 'multiple-choice' 
  | 'single-choice' 
  | 'text' 
  | 'textarea' 
  | 'rating' 
  | 'yes-no'
  | 'date';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  minRating?: number;
  maxRating?: number;
  order: number;
}

export interface Survey {
  id: string;
  title: string;
  description?: string;
  internalName?: string; // Internal name for identifying survey purpose (not shown to public)
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  emailNotificationsEnabled?: boolean;
  published?: boolean;
  deletedAt?: string | null; // Timestamp when survey was deleted
  deletedBy?: string | null; // User ID who deleted the survey
  creatorName?: string; // Name of user who created the survey
  creatorEmail?: string; // Email of user who created the survey
  deleterName?: string; // Name of user who deleted the survey
  deleterEmail?: string; // Email of user who deleted the survey
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: Answer[];
  submittedAt: string;
  linkToken?: string;
}

export interface Answer {
  questionId: string;
  value: string | string[] | number;
}

