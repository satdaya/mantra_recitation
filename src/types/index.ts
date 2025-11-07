export interface MantraRecitation {
  id: string;
  mantraName: string;
  count: number;
  duration?: number; // in minutes (optional)
  timestamp?: Date; // optional
  notes?: string;
}

export interface MantraStats {
  totalRecitations: number;
  totalCount: number;
  totalDuration: number;
  averageCount: number;
  averageDuration: number;
  mostRecitedMantra: string;
}

export interface DailyStats {
  date: string;
  count: number;
  duration: number;
  recitations: number;
}