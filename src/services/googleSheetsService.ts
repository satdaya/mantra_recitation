import { Mantra } from './mantraService';

// Google API Configuration
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const SHEET_ID = process.env.REACT_APP_GOOGLE_SHEET_ID;

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

interface GoogleSheetsRow {
  [key: string]: any;
}

class GoogleSheetsService {
  private tokenClient: any;
  private gapiInited = false;
  private gisInited = false;
  private accessToken: string | null = null;

  /**
   * Initialize the Google API client
   */
  async initializeGapi(): Promise<void> {
    if (this.gapiInited) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).gapi.load('client', async () => {
          try {
            await (window as any).gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: [DISCOVERY_DOC],
            });
            this.gapiInited = true;
            resolve();
          } catch (error) {
            console.error('Error initializing GAPI client:', error);
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize Google Identity Services
   */
  async initializeGis(): Promise<void> {
    if (this.gisInited) return;

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // defined at request time
        });
        this.gisInited = true;
        resolve();
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Initialize both GAPI and GIS
   */
  async initialize(): Promise<void> {
    if (!CLIENT_ID || !API_KEY || !SHEET_ID) {
      throw new Error('Google Sheets configuration is missing. Please check your .env file.');
    }

    await Promise.all([
      this.initializeGapi(),
      this.initializeGis(),
    ]);
  }

  /**
   * Check if user is currently signed in
   */
  isSignedIn(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Sign in the user
   */
  async signIn(): Promise<void> {
    await this.initialize();

    return new Promise((resolve, reject) => {
      try {
        // Set the callback for when the token is received
        this.tokenClient.callback = (response: any) => {
          if (response.error !== undefined) {
            reject(response);
            return;
          }
          this.accessToken = response.access_token;
          resolve();
        };

        // Request a token
        if ((window as any).gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent
          this.tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
          // Skip display of account chooser and consent dialog
          this.tokenClient.requestAccessToken({ prompt: '' });
        }
      } catch (error) {
        console.error('Error during sign in:', error);
        reject(error);
      }
    });
  }

  /**
   * Sign out the user
   */
  signOut(): void {
    const token = (window as any).gapi.client.getToken();
    if (token !== null) {
      (window as any).google.accounts.oauth2.revoke(token.access_token);
      (window as any).gapi.client.setToken(null);
      this.accessToken = null;
    }
  }

  /**
   * Fetch mantras from a single sheet
   */
  private async getMantrasFromSheet(sheetName: string): Promise<Mantra[]> {
    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A:Z`, // Read all columns
      });

      const rows = response.result.values;
      if (!rows || rows.length === 0) {
        console.log(`No data found in sheet: ${sheetName}`);
        return [];
      }

      // First row is headers
      const headers = rows[0].map((h: string) => h.toLowerCase().trim().replace(/\s+/g, ''));
      const mantras: Mantra[] = [];

      // Process each row (skip header row)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const mantraData: GoogleSheetsRow = {};

        // Map row values to headers
        headers.forEach((header: string, index: number) => {
          mantraData[header] = row[index] || '';
        });

        // Map to Mantra interface with new column names
        const mantra: Mantra = {
          id: mantraData.id || `gsheet-${sheetName}-${i}`,
          name: mantraData.mantra || mantraData.name || '',
          gurmukhi: mantraData.gurmukhi || '',
          category: mantraData.category || 'Other',
          source: 'core',
          // New fields
          optimalTime: mantraData.optimaltime || '',
          optionality: mantraData.optionality || '',
          targetRecitations: mantraData.targetrecitations
            ? parseInt(mantraData.targetrecitations)
            : undefined,
          guruAuthorship: mantraData.guruauthorship || '',
          guruNumber: mantraData.gurunumber
            ? parseInt(mantraData.gurunumber)
            : undefined,
          significance: mantraData.significance || '',
          // Legacy fields for backwards compatibility
          traditionalCount: mantraData.targetrecitations
            ? parseInt(mantraData.targetrecitations)
            : mantraData.traditionalcount
            ? parseInt(mantraData.traditionalcount)
            : undefined,
          translation: mantraData.significance || mantraData.translation || '',
        };

        // Only add if name is present
        if (mantra.name) {
          mantras.push(mantra);
        }
      }

      return mantras;
    } catch (error) {
      console.error(`Error fetching mantras from sheet ${sheetName}:`, error);
      return [];
    }
  }

  /**
   * Fetch mantras from multiple sheets or all sheets
   */
  async getMantras(sheetNames?: string[]): Promise<Mantra[]> {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    try {
      // If no sheet names provided, get all sheets
      if (!sheetNames || sheetNames.length === 0) {
        const allSheetNames = await this.getSheetNames();
        sheetNames = allSheetNames;
      }

      // Fetch mantras from all specified sheets in parallel
      const mantraArrays = await Promise.all(
        sheetNames.map(sheetName => this.getMantrasFromSheet(sheetName))
      );

      // Flatten the array of arrays
      const allMantras = mantraArrays.flat();

      console.log(`Fetched ${allMantras.length} mantras from ${sheetNames.length} sheet(s)`);
      return allMantras;
    } catch (error) {
      console.error('Error fetching mantras from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get available sheet names from the spreadsheet
   */
  async getSheetNames(): Promise<string[]> {
    if (!this.isSignedIn()) {
      await this.signIn();
    }

    try {
      const response = await (window as any).gapi.client.sheets.spreadsheets.get({
        spreadsheetId: SHEET_ID,
      });

      const sheets = response.result.sheets;
      return sheets.map((sheet: any) => sheet.properties.title);
    } catch (error) {
      console.error('Error fetching sheet names:', error);
      throw error;
    }
  }

  /**
   * Test the connection to Google Sheets
   */
  async testConnection(): Promise<{ success: boolean; message: string; sheetNames?: string[] }> {
    try {
      await this.initialize();
      await this.signIn();
      const sheetNames = await this.getSheetNames();
      return {
        success: true,
        message: `Successfully connected! Found ${sheetNames.length} sheet(s).`,
        sheetNames,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to connect to Google Sheets',
      };
    }
  }
}

// Export singleton instance
export const googleSheetsService = new GoogleSheetsService();
