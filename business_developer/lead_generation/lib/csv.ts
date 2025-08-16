import { Lead } from '../types/lead';

const REQUIRED_COLUMNS = ['name', 'email', 'company', 'industry', 'budget', 'location'] as const;

type RequiredColumn = typeof REQUIRED_COLUMNS[number];

function generateId(): string {
  // Use crypto if available (browser), else fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyGlobal: any = globalThis as any;
  if (anyGlobal?.crypto?.randomUUID) return anyGlobal.crypto.randomUUID();
  return `lead_${Math.random().toString(36).slice(2, 10)}`;
}

function safeNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function parseCsvString(csv: string): { leads: Lead[]; errors: string[] } {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { leads: [], errors: ['CSV is empty'] };

  const header = lines[0].split(',').map(normalizeHeader);
  const missing = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missing.length > 0) {
    return { leads: [], errors: [`Missing required columns: ${missing.join(', ')}`] };
  }

  const leads: Lead[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i];
    if (!row.trim()) continue;

    // naive CSV split (no quoted commas). For simplicity in MVP.
    const cols = row.split(',');
    if (cols.length < header.length) {
      errors.push(`Row ${i + 1}: Incorrect number of columns.`);
      continue;
    }

    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = (cols[idx] ?? '').trim();
    });

    const name = record['name'] || '';
    const email = record['email'] || '';
    const company = record['company'] || '';
    const industry = record['industry'] || '';
    const budget = safeNumber(record['budget'] || '0');
    const location = record['location'] || '';

    if (!name || !email || !company || !industry || !location) {
      errors.push(`Row ${i + 1}: Missing required field(s).`);
      continue;
    }

    const lead: Lead = {
      id: generateId(),
      name,
      email,
      company,
      industry,
      budget,
      location,
      score: 'Low',
      scoreConfidence: 0,
      addedAt: new Date().toISOString(),
      tags: [],
      notes: '',
    };

    leads.push(lead);
  }

  return { leads, errors };
}

export async function parseCsvFile(file: File): Promise<{ leads: Lead[]; errors: string[] }> {
  const text = await file.text();
  return parseCsvString(text);
}

export function leadsToCsv(leads: Lead[]): string {
  const headers = ['name', 'email', 'company', 'industry', 'budget', 'location', 'score', 'scoreConfidence', 'addedAt'];
  const rows = leads.map((l) => [
    escapeCsv(l.name),
    escapeCsv(l.email),
    escapeCsv(l.company),
    escapeCsv(l.industry),
    String(l.budget),
    escapeCsv(l.location),
    l.score,
    String(l.scoreConfidence),
    l.addedAt,
  ].join(','));
  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getSampleCsv(): string {
  return [
    'name,email,company,industry,budget,location',
    'Ava Johnson,ava.johnson@greenleaflabs.com,GreenLeaf Labs,Software,75000,San Francisco, CA',
    'Liam Smith,liam.smith@skyline.systems, Skyline Systems,Marketing,25000,New York, NY',
    'Olivia Brown,olivia.brown@novareachmarketing.com,NovaReach Marketing,E-commerce,42000,Austin, TX',
  ].join('\n');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}