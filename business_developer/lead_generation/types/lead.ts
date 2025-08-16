export type LeadScore = 'High' | 'Medium' | 'Low';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  industry: string;
  budget: number;
  location: string;
  score: LeadScore;
  scoreConfidence: number; // 0-100
  addedAt: string; // ISO
  tags?: string[];
  notes?: string;
}

export interface LeadFilters {
  industry?: string;
  minBudget?: number;
  maxBudget?: number;
  location?: string;
  keywords?: string;
  score?: LeadScore;
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
}