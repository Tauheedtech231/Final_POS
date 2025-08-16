import React, { useMemo } from 'react';
import { LeadFilters, LeadScore } from '../types/lead';

export function LeadFiltersSidebar({
  filters,
  onChange,
  onClear,
  industries,
}: {
  filters: LeadFilters;
  onChange: (next: LeadFilters) => void;
  onClear: () => void;
  industries: string[];
}) {
  const chips = useMemo(() => {
    const list: { key: keyof LeadFilters; label: string }[] = [];
    if (filters.industry) list.push({ key: 'industry', label: `Industry: ${filters.industry}` });
    if (typeof filters.minBudget === 'number') list.push({ key: 'minBudget', label: `Min Budget: $${filters.minBudget.toLocaleString()}` });
    if (typeof filters.maxBudget === 'number') list.push({ key: 'maxBudget', label: `Max Budget: $${filters.maxBudget.toLocaleString()}` });
    if (filters.location) list.push({ key: 'location', label: `Location: ${filters.location}` });
    if (filters.keywords) list.push({ key: 'keywords', label: `Keywords: ${filters.keywords}` });
    if (filters.score) list.push({ key: 'score', label: `Score: ${filters.score}` });
    if (filters.dateFrom) list.push({ key: 'dateFrom', label: `From: ${new Date(filters.dateFrom).toLocaleDateString()}` });
    if (filters.dateTo) list.push({ key: 'dateTo', label: `To: ${new Date(filters.dateTo).toLocaleDateString()}` });
    return list;
  }, [filters]);

  function update<K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside aria-label="Lead filters" style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, position: 'sticky', top: 76 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Filters</div>
        <button onClick={onClear} style={linkButtonStyle} aria-label="Clear filters">Clear</button>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={labelStyle}>
          <span>Industry</span>
          <select value={filters.industry ?? ''} onChange={(e) => update('industry', e.target.value || undefined)} style={inputStyle} aria-label="Industry">
            <option value="">Any</option>
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={labelStyle}>
            <span>Min Budget</span>
            <input type="number" value={filters.minBudget ?? ''} onChange={(e) => update('minBudget', e.target.value ? Number(e.target.value) : undefined)} style={inputStyle} aria-label="Minimum budget" />
          </label>
          <label style={labelStyle}>
            <span>Max Budget</span>
            <input type="number" value={filters.maxBudget ?? ''} onChange={(e) => update('maxBudget', e.target.value ? Number(e.target.value) : undefined)} style={inputStyle} aria-label="Maximum budget" />
          </label>
        </div>

        <label style={labelStyle}>
          <span>Location</span>
          <input type="text" value={filters.location ?? ''} onChange={(e) => update('location', e.target.value || undefined)} style={inputStyle} aria-label="Location" />
        </label>

        <label style={labelStyle}>
          <span>Keywords</span>
          <input type="text" value={filters.keywords ?? ''} onChange={(e) => update('keywords', e.target.value || undefined)} style={inputStyle} aria-label="Keywords" />
        </label>

        <label style={labelStyle}>
          <span>Score</span>
          <select value={filters.score ?? ''} onChange={(e) => update('score', (e.target.value || undefined) as LeadScore | undefined)} style={inputStyle} aria-label="Score">
            <option value="">Any</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <label style={labelStyle}>
            <span>Date from</span>
            <input type="date" value={filters.dateFrom ?? ''} onChange={(e) => update('dateFrom', e.target.value || undefined)} style={inputStyle} aria-label="Date from" />
          </label>
          <label style={labelStyle}>
            <span>Date to</span>
            <input type="date" value={filters.dateTo ?? ''} onChange={(e) => update('dateTo', e.target.value || undefined)} style={inputStyle} aria-label="Date to" />
          </label>
        </div>
      </div>

      {chips.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Active filters</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {chips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => update(chip.key, undefined as never)}
                aria-label={`Remove ${chip.label}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: 'var(--bg-elev)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                <span>{chip.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 12,
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  borderRadius: 12,
  padding: '8px 10px',
  outlineColor: 'var(--focus)',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--brand-strong)',
  border: 'none',
  cursor: 'pointer',
  fontSize: 12,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

export default LeadFiltersSidebar;