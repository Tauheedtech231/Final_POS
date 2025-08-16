import { Lead, LeadFilters, LeadScore } from '../types/lead';

export type LeadScoreResult = { label: LeadScore; confidence: number };

const industries = [
  'Software',
  'Marketing',
  'Healthcare',
  'Finance',
  'E-commerce',
  'Education',
  'Manufacturing',
  'Real Estate',
  'Logistics',
  'Consulting',
];

const locations = [
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'Seattle, WA',
  'Boston, MA',
  'Chicago, IL',
  'Denver, CO',
  'Atlanta, GA',
  'Miami, FL',
  'Los Angeles, CA',
];

const companies = [
  'GreenLeaf Labs',
  'Skyline Systems',
  'NovaReach Marketing',
  'Summit Health Co',
  'Copper Bank',
  'BrightCart',
  'LearnSphere',
  'ForgeWorks',
  'Harbor Realty',
  'RouteRunner',
  'Northstar Consulting',
  'Blue Ocean Analytics',
  'Aurora Soft',
  'Pinnacle Finance',
  'Cloudbridge',
  'Sunrise Retail',
  'Peak Education',
  'Silverline Manufacturing',
  'UrbanNest Real Estate',
  'SwiftShip Logistics',
];

const firstNames = [
  'Ava',
  'Liam',
  'Olivia',
  'Noah',
  'Emma',
  'Ethan',
  'Mia',
  'Lucas',
  'Sophia',
  'Mason',
  'Isabella',
  'James',
  'Charlotte',
  'Henry',
  'Amelia',
  'Leo',
  'Evelyn',
  'Benjamin',
  'Harper',
  'Elijah',
];

const lastNames = [
  'Johnson',
  'Smith',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
}

function pick<T>(list: T[], indexSeed: number): T {
  return list[indexSeed % list.length];
}

function daysAgoToIso(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

function generateMockLeads(count: number): Lead[] {
  const leads: Lead[] = [];
  for (let i = 0; i < count; i += 1) {
    const firstName = pick(firstNames, i + 3);
    const lastName = pick(lastNames, i + 5);
    const name = `${firstName} ${lastName}`;
    const company = pick(companies, i + 7);
    const industry = pick(industries, i + 11);
    const location = pick(locations, i + 13);

    // Budget distribution: mix of low/medium/high
    const budgetTiers = [8000, 15000, 24000, 36000, 52000, 78000, 120000];
    const tier = pick(budgetTiers, i + 17);
    const budgetNoise = ((i * 137) % 5000) - 2500; // +- 2500
    const budget = Math.max(3000, tier + budgetNoise);

    const email = `${slugify(firstName)}.${slugify(lastName)}@${slugify(company)}.com`;

    const addedAt = daysAgoToIso((i * 3) % 180);

    const baseLead: Lead = {
      id: `lead_${(i + 1).toString().padStart(4, '0')}`,
      name,
      email,
      company,
      industry,
      budget,
      location,
      score: 'Medium', // placeholder, will be set via scoring
      scoreConfidence: 0,
      addedAt,
      tags: i % 3 === 0 ? ['inbound'] : i % 3 === 1 ? ['outbound'] : ['partner'],
      notes: '',
    };

    const scored = scoreLead(baseLead);

    leads.push({ ...baseLead, score: scored.label, scoreConfidence: scored.confidence });
  }
  return leads;
}

const MOCK_LEADS: Lead[] = generateMockLeads(36);

export function scoreLead(lead: Lead): LeadScoreResult {
  // Heuristic scoring based on budget, industry fit, and company domain "maturity"
  const budgetScore = clamp(lead.budget / 1500, 0, 60); // up to 60 pts by budget

  const industryWeights: Record<string, number> = {
    Software: 25,
    'E-commerce': 18,
    Finance: 20,
    'Real Estate': 10,
    Logistics: 12,
    Manufacturing: 8,
    Marketing: 15,
    Healthcare: 14,
    Education: 10,
    Consulting: 16,
  };
  const industryScore = industryWeights[lead.industry] ?? 8;

  const domainMaturity = lead.email.includes('.io') || lead.email.includes('.ai') ? 6 : 10;
  const total = clamp(budgetScore + industryScore + domainMaturity, 5, 96);

  let label: LeadScore = 'Low';
  if (total >= 70) label = 'High';
  else if (total >= 40) label = 'Medium';

  const confidence = Math.round(total);
  return { label, confidence };
}

function matchesQuery(lead: Lead, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    lead.name.toLowerCase().includes(q) ||
    lead.email.toLowerCase().includes(q) ||
    lead.company.toLowerCase().includes(q) ||
    lead.industry.toLowerCase().includes(q) ||
    lead.location.toLowerCase().includes(q)
  );
}

function matchesFilters(lead: Lead, filters?: LeadFilters): boolean {
  if (!filters) return true;
  if (filters.industry && lead.industry !== filters.industry) return false;
  if (filters.score && lead.score !== filters.score) return false;
  if (typeof filters.minBudget === 'number' && lead.budget < filters.minBudget) return false;
  if (typeof filters.maxBudget === 'number' && lead.budget > filters.maxBudget) return false;
  if (filters.location && !lead.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  if (filters.keywords) {
    const kw = filters.keywords.toLowerCase();
    const text = `${lead.name} ${lead.company} ${lead.email} ${lead.industry} ${lead.location}`.toLowerCase();
    if (!text.includes(kw)) return false;
  }
  if (filters.dateFrom && new Date(lead.addedAt) < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && new Date(lead.addedAt) > new Date(filters.dateTo)) return false;
  return true;
}

function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function findLeads(query: string, filters?: LeadFilters): Promise<Lead[]> {
  // Simulate latency
  await simulateDelay(400);

  const result = MOCK_LEADS.filter((lead) => matchesQuery(lead, query) && matchesFilters(lead, filters)).map((l) => ({ ...l }));
  return result;
}