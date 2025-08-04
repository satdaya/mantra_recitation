// Hybrid Mantra Service: Airtable + User Submissions
const AIRTABLE_BASE_ID = process.env.REACT_APP_AIRTABLE_BASE_ID;
const AIRTABLE_API_KEY = process.env.REACT_APP_AIRTABLE_API_KEY;

export interface Mantra {
  id: string;
  name: string;
  sanskrit?: string;
  gurmukhi?: string; // Added Gurmukhi script support
  translation?: string;
  category?: string;
  traditionalCount?: number;
  audioUrl?: string;
  source: 'core' | 'user' | 'pending'; // Track source
  submittedBy?: string;
  submittedAt?: Date;
}

class MantraService {
  private coreMantrasCacheKey = 'coreMantras';
  private userMantrasKey = 'userMantras';
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

  // Get all mantras (core + user submissions)
  async getAllMantras(): Promise<Mantra[]> {
    const [coreMantras, userMantras] = await Promise.all([
      this.getCoreMantras(),
      this.getUserMantras(),
    ]);

    return [
      ...coreMantras,
      ...userMantras,
      { id: 'custom', name: 'Custom', source: 'core' as const }, // Always keep custom option
    ];
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

  // Clear cache (for testing or manual refresh)
  clearCache(): void {
    localStorage.removeItem(this.coreMantrasCacheKey);
  }
}

export const mantraService = new MantraService();