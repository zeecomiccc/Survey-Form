import { Survey, SurveyResponse, Question } from '@/types/survey';
import { v4 as uuidv4 } from 'uuid';

// Updated storage to use MySQL via API routes
export const storage = {
  async getSurveys(): Promise<Survey[]> {
    try {
      const response = await fetch('/api/surveys');
      if (!response.ok) throw new Error('Failed to fetch surveys');
      return await response.json();
    } catch (error) {
      console.error('Error fetching surveys:', error);
      return [];
    }
  },

  async saveSurvey(survey: Survey): Promise<void> {
    try {
      const existingSurveys = await this.getSurveys();
      const exists = existingSurveys.some(s => s.id === survey.id);
      
      const url = '/api/surveys';
      const method = exists ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(survey),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save survey');
      }
    } catch (error) {
      console.error('Error saving survey:', error);
      throw error;
    }
  },

  async getSurvey(id: string): Promise<Survey | null> {
    try {
      const response = await fetch(`/api/surveys/${id}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Failed to fetch survey');
      return await response.json();
    } catch (error) {
      console.error('Error fetching survey:', error);
      return null;
    }
  },

  async deleteSurvey(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/surveys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete survey');
      }
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  },

  async getResponses(surveyId: string): Promise<SurveyResponse[]> {
    try {
      const response = await fetch(`/api/responses?surveyId=${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch responses');
      return await response.json();
    } catch (error) {
      console.error('Error fetching responses:', error);
      return [];
    }
  },

  async saveResponse(response: SurveyResponse): Promise<void> {
    try {
      const apiResponse = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });

      if (!apiResponse.ok) {
        const error = await apiResponse.json();
        throw new Error(error.error || 'Failed to save response');
      }
    } catch (error) {
      console.error('Error saving response:', error);
      throw error;
    }
  },

  async duplicateSurvey(originalSurvey: Survey): Promise<void> {
    try {
      // Create a new survey with new IDs
      const duplicatedSurvey: Survey = {
        id: uuidv4(),
        title: `Copy of ${originalSurvey.title}`,
        description: originalSurvey.description,
        questions: originalSurvey.questions.map((question, index) => {
          const newQuestion: Question = {
            id: uuidv4(),
            type: question.type,
            title: question.title,
            description: question.description,
            required: question.required,
            minRating: question.minRating,
            maxRating: question.maxRating,
            order: index,
            options: question.options?.map(option => ({
              id: uuidv4(),
              label: option.label,
            })),
          };
          return newQuestion;
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await this.saveSurvey(duplicatedSurvey);
    } catch (error) {
      console.error('Error duplicating survey:', error);
      throw error;
    }
  },

  async createSurveyLink(surveyId: string): Promise<{ token: string; url: string; expiresAt: string }> {
    try {
      const response = await fetch('/api/survey-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create survey link');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating survey link:', error);
      throw error;
    }
  },

  async getSurveyLinks(surveyId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/survey-links?surveyId=${surveyId}`);
      if (!response.ok) throw new Error('Failed to fetch survey links');
      return await response.json();
    } catch (error) {
      console.error('Error fetching survey links:', error);
      return [];
    }
  },
};
