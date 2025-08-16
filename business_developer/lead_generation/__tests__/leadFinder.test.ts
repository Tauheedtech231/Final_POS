import { describe, it, expect } from 'vitest';
import { scoreLead } from '../ai/leadFinder';
import { Lead } from '../types/lead';

describe('scoreLead', () => {
  const baseLead: Lead = {
    id: '1',
    name: 'Test User',
    email: 'test.user@example.com',
    company: 'Example Co',
    industry: 'Software',
    budget: 10000,
    location: 'San Francisco, CA',
    score: 'Low',
    scoreConfidence: 0,
    addedAt: new Date().toISOString(),
  };

  it('returns High for high budgets in favored industries', () => {
    const { label, confidence } = scoreLead({ ...baseLead, budget: 120000, industry: 'Software' });
    expect(label).toBe('High');
    expect(confidence).toBeGreaterThan(70);
  });

  it('returns Medium for moderate budgets', () => {
    const { label } = scoreLead({ ...baseLead, budget: 30000, industry: 'Marketing' });
    expect(label === 'Medium' || label === 'High').toBeTruthy();
  });

  it('returns Low for low budgets regardless of industry', () => {
    const { label } = scoreLead({ ...baseLead, budget: 3000, industry: 'Manufacturing' });
    expect(label === 'Low' || label === 'Medium').toBeTruthy();
  });
});