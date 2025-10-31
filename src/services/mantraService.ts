// Hybrid Mantra Service: FastAPI Backend + Airtable + Google Sheets + User Submissions
import { api } from '../lib/api';
import { googleSheetsService } from './googleSheetsService';

const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;
const GOOGLE_SHEET_ENABLED = process.env.REACT_APP_GOOGLE_CLIENT_ID &&
                              process.env.REACT_APP_GOOGLE_API_KEY &&
                              process.env.REACT_APP_GOOGLE_SHEET_ID;

export interface Mantra {
  id: string;
  name: string;
  sanskrit?: string;
  gurmukhi?: string; // Gurmukhi script
  translation?: string;
  category?: string;
  traditionalCount?: number;
  audioUrl?: string;
  source: 'core' | 'user' | 'pending'; // Track source
  submittedBy?: string;
  submittedAt?: Date;
  // New fields from Google Sheets
  optimalTime?: string; // Best time for recitation
  optionality?: string; // Required, Recommended, Optional
  targetRecitations?: number; // Target count for practice
  guruAuthorship?: string; // Which Guru authored this
  guruNumber?: number; // Guru number (1-10)
  significance?: string; // Meaning and significance
}

class MantraService {
  private coreMantrasCacheKey = 'coreMantras';
  private googleSheetsCacheKey = 'googleSheetsMantras';
  private userMantrasKey = 'userMantras';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Get all mantras (prioritize Google Sheets, fallback to backend + core)
  async getAllMantras(): Promise<Mantra[]> {
    const [backendMantras, coreMantras, googleSheetsMantras, userMantras] = await Promise.all([
      GOOGLE_SHEET_ENABLED ? Promise.resolve([]) : this.getBackendMantras(), // Skip backend if Google Sheets enabled
      GOOGLE_SHEET_ENABLED ? Promise.resolve([]) : this.getCoreMantras(),    // Skip Airtable if Google Sheets enabled
      this.getGoogleSheetsMantras(),
      this.getUserMantras(),
    ]);

    return [
      ...backendMantras,
      ...coreMantras,
      ...googleSheetsMantras,
      ...userMantras,
      { id: 'custom', name: 'Custom', source: 'core' as const }, // Always keep custom option
    ];
  }

  // Get mantras from FastAPI backend
  private async getBackendMantras(): Promise<Mantra[]> {
    try {
      const response = await api.getMantras();
      return response.data.map(mantra => ({
        id: mantra.id,
        name: mantra.name,
        gurmukhi: mantra.text, // Map backend 'text' to 'gurmukhi'
        category: mantra.category,
        source: 'core' as const,
        traditionalCount: this.getDefaultCount(mantra.category),
      }));
    } catch (error) {
      console.error('Error fetching backend mantras:', error);
      return [];
    }
  }

  // Get core mantras from Airtable (with caching)
  private async getCoreMantras(): Promise<Mantra[]> {
    const cached = this.getCachedCoreMantras();
    if (cached) return cached;

    try {
      if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
        return this.getDefaultCoreMantras();
      }

      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Mantras?filterByFormula={Status}='Active'`,
        {
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      const mantras: Mantra[] = data.records.map((record: any) => ({
        id: record.id,
        name: record.fields.Name,
        sanskrit: record.fields.Sanskrit,
        gurmukhi: record.fields.Gurmukhi,
        translation: record.fields.Translation,
        category: record.fields.Category,
        traditionalCount: record.fields['Traditional Count'] || this.getDefaultCount(record.fields.Category),
        audioUrl: record.fields['Audio URL'],
        source: 'core' as const,
      }));

      // Cache the results
      localStorage.setItem(this.coreMantrasCacheKey, JSON.stringify({
        data: mantras,
        timestamp: Date.now(),
      }));

      return mantras;
    } catch (error) {
      console.error('Error fetching core mantras:', error);
      return this.getDefaultCoreMantras();
    }
  }

  // Get mantras from Google Sheets (with caching)
  private async getGoogleSheetsMantras(): Promise<Mantra[]> {
    if (!GOOGLE_SHEET_ENABLED) return [];

    const cached = this.getCachedGoogleSheetsMantras();
    if (cached) return cached;

    try {
      const mantras = await googleSheetsService.getMantras();

      // Cache the results
      localStorage.setItem(this.googleSheetsCacheKey, JSON.stringify({
        data: mantras,
        timestamp: Date.now(),
      }));

      return mantras;
    } catch (error) {
      console.error('Error fetching Google Sheets mantras:', error);
      return [];
    }
  }

  // Get cached Google Sheets mantras if still valid
  private getCachedGoogleSheetsMantras(): Mantra[] | null {
    try {
      const cached = localStorage.getItem(this.googleSheetsCacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.googleSheetsCacheKey);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  // Get user-submitted mantras from local storage
  getUserMantras(): Mantra[] {
    try {
      const stored = localStorage.getItem(this.userMantrasKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading user mantras:', error);
      return [];
    }
  }

  // Add user-submitted mantra
  addUserMantra(mantra: Omit<Mantra, 'id' | 'source' | 'submittedAt'>): Mantra {
    const newMantra: Mantra = {
      ...mantra,
      id: `user-${Date.now()}`,
      source: 'user',
      submittedAt: new Date(),
    };

    const userMantras = this.getUserMantras();
    userMantras.push(newMantra);
    
    localStorage.setItem(this.userMantrasKey, JSON.stringify(userMantras));
    return newMantra;
  }

  // Submit user mantra to Airtable for review (optional)
  async submitForReview(mantra: Mantra): Promise<boolean> {
    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) return false;

    try {
      const response = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/User_Submissions`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: {
              Name: mantra.name,
              Sanskrit: mantra.sanskrit,
              Gurmukhi: mantra.gurmukhi,
              Translation: mantra.translation,
              Category: mantra.category,
              'Traditional Count': mantra.traditionalCount,
              'Submitted By': mantra.submittedBy || 'Anonymous',
              'Submitted At': new Date().toISOString(),
              Status: 'Pending Review',
            },
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error submitting mantra for review:', error);
      return false;
    }
  }

  // Delete user mantra
  deleteUserMantra(id: string): boolean {
    const userMantras = this.getUserMantras();
    const filtered = userMantras.filter(m => m.id !== id);
    
    if (filtered.length !== userMantras.length) {
      localStorage.setItem(this.userMantrasKey, JSON.stringify(filtered));
      return true;
    }
    return false;
  }

  // Get cached core mantras if still valid
  private getCachedCoreMantras(): Mantra[] | null {
    try {
      const cached = localStorage.getItem(this.coreMantrasCacheKey);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.cacheExpiry) {
        localStorage.removeItem(this.coreMantrasCacheKey);
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }

  // No default mantras - everything starts empty
  private getDefaultCoreMantras(): Mantra[] {
    return [];
  }

  // Get default count based on category (Sikh practices)
  private getDefaultCount(category?: string): number {
    if (!category) return 108;
    
    const sikthCounts: Record<string, number> = {
      'Daily Banis': 1, // Japji, Sukhmani, Rehras, Kirtan Sohila, Ardas all under this
      'Core Mantras': 125000, // Traditional for Waheguru simran
      'Paurees': 11, // Common practice for paurees
      'Simran': 125000, // Traditional count for simran
      // Universal defaults
      'Devotion': 108,
      'Wisdom': 108,
      'Compassion': 108,
      'Peace': 108,
      'Healing': 108,
      'Protection': 108,
      'Prosperity': 108,
      'Self-realization': 108,
      'Other': 108,
    };
    
    return sikthCounts[category] || 108;
  }

  // Save recitation to backend
  async saveRecitation(recitationData: {
    mantraId: string;
    count: number;
    duration: number;
    notes?: string;
  }): Promise<boolean> {
    try {
      await api.createRecitation({
        mantra_id: recitationData.mantraId,
        user_id: 'default-user', // You can enhance this with real user management
        count: recitationData.count,
        duration_minutes: recitationData.duration,
        notes: recitationData.notes,
      });
      return true;
    } catch (error) {
      console.error('Error saving recitation to backend:', error);
      return false;
    }
  }

  // Get recitations from backend
  async getRecitations() {
    try {
      const response = await api.getRecitations();
      return response.data;
    } catch (error) {
      console.error('Error fetching recitations:', error);
      return [];
    }
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      await api.healthCheck();
      return true;
    } catch (error) {
      console.error('Backend connection failed:', error);
      return false;
    }
  }

  // Clear cache (for testing or manual refresh)
  clearCache(): void {
    localStorage.removeItem(this.coreMantrasCacheKey);
    localStorage.removeItem(this.googleSheetsCacheKey);
  }

  // Google Sheets specific methods
  isGoogleSheetsEnabled(): boolean {
    return !!GOOGLE_SHEET_ENABLED;
  }

  async refreshGoogleSheets(): Promise<boolean> {
    try {
      localStorage.removeItem(this.googleSheetsCacheKey);
      await this.getGoogleSheetsMantras();
      return true;
    } catch (error) {
      console.error('Error refreshing Google Sheets:', error);
      return false;
    }
  }

  async testGoogleSheetsConnection(): Promise<{ success: boolean; message: string; sheetNames?: string[] }> {
    return await googleSheetsService.testConnection();
  }

  getGoogleSheetsService() {
    return googleSheetsService;
  }
}

export const mantraService = new MantraService();