/**
 * API configuration for Mantra Recitation app
 * Connects React frontend to FastAPI backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export interface Mantra {
  id: string;
  name: string;
  category: string;
  text: string;
  language: string;
}

export interface Recitation {
  id: string;
  user_id: string;
  mantra_name: string;
  count: number;
  duration_minutes: number;
  recitation_timestamp: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateRecitationData {
  mantra_name: string;
  count: number;
  duration_minutes: number;
  recitation_timestamp: string;  // ISO 8601 format
  notes?: string;
}

export const api = {
  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  },

  // Mantras endpoints
  getMantras: async (): Promise<{ message: string; data: Mantra[] }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/mantras`);
    if (!response.ok) throw new Error('Failed to fetch mantras');
    return response.json();
  },

  // Recitations endpoints
  getRecitations: async (): Promise<Recitation[]> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/recitations`);
    if (!response.ok) throw new Error('Failed to fetch recitations');
    return response.json();
  },

  createRecitation: async (data: CreateRecitationData): Promise<Recitation> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/recitations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create recitation: ${error}`);
    }
    return response.json();
  },
};

export default api;