import React, { useEffect, useMemo, useRef, useState } from 'react';
import debounce from 'lodash.debounce';
import { toast } from 'sonner';
import { Lead, LeadFilters } from '../types/lead';
import { findLeads, scoreLead } from '../ai/leadFinder';
import LeadScoring from './LeadScoring';
import { EmptyState } from './EmptyState';
import { SkeletonTable } from './SkeletonTable';
import LeadFiltersSidebar from './LeadFilters';
import LeadDetailsModal from './LeadDetailsModal';
import { LeadImportExport, LeadImportExportHandle } from './LeadImportExport';

export function LeadFinderDashboard() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<LeadFilters>({});
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<keyof Lead>('addedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const importExportRef = useRef<LeadImportExportHandle | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const industries = useMemo(() => [
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
  ], []);

  const debouncedSearch = useMemo(() => debounce(async (q: string, f: LeadFilters) => {
    try {
      setError(null);
      setLeads(null);
      const result = await findLeads(q, f);
      setLeads(result);
      setPage(1);
    } catch (e) {
      setError('Failed to fetch leads.');
      toast.error('Failed to fetch leads');
      setLeads([]);
    }
  }, 300), []);

  useEffect(() => {
    debouncedSearch(query, filters);
  }, [query, filters, debouncedSearch]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isTyping = tag === 'input' || tag === 'textarea';
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (!isTyping && e.key.toLowerCase() === 'i') {
        importExportRef.current?.openImport();
      } else if (!isTyping && e.key.toLowerCase() === 'e') {
        importExportRef.current?.exportCsv?.();
      } else if (!isTyping && e.key === 'Escape') {
        setFiltersOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function applySort(list: Lead[]): Lead[] {
    const sorted = [...list].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (sortBy === 'addedAt') {
        const aDate = new Date(String(aVal)).getTime();
        const bDate = new Date(String(bVal)).getTime();
        return sortDir === 'asc' ? aDate - bDate : bDate - aDate;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return String(aVal).localeCompare(String(bVal)) * (sortDir === 'asc' ? 1 : -1);
    });
    return sorted;
  }

  const paged = useMemo(() => {
    if (!leads) return [];
    const sorted = applySort(leads);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return sorted.slice(start, end);
  }, [leads, page, pageSize, sortBy, sortDir]);

  function onHeaderClick(key: keyof Lead) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

  function onSaveLead(next: Lead) {
    setLeads((prev) => (prev ? prev.map((l) => (l.id === next.id ? next : l)) : prev));
    setSelected(null);
    toast.success('Lead saved');
  }

  function onImported(imported: Lead[]) {
    const enriched = imported.map((l) => {
      const scored = scoreLead(l);
      return { ...l, score: scored.label, scoreConfidence: scored.confidence };
    });
    setLeads((prev) => (prev ? [...enriched, ...prev] : enriched));
    if (enriched.length > 0) toast.success(`Imported ${enriched.length} lead${enriched.length === 1 ? '' : 's'}`);
  }

  function openImport() {
    importExportRef.current?.openImport();
  }

  function runAiSearch() {
    debouncedSearch(query || '', filters);
  }

  const total = leads?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const filterChips = useMemo(() => {
    const chips: { key: keyof LeadFilters; label: string }[] = [];
    if (filters.industry) chips.push({ key: 'industry', label: `Industry: ${filters.industry}` });
    if (typeof filters.minBudget === 'number') chips.push({ key: 'minBudget', label: `Min Budget: $${filters.minBudget.toLocaleString()}` });
    if (typeof filters.maxBudget === 'number') chips.push({ key: 'maxBudget', label: `Max Budget: $${filters.maxBudget.toLocaleString()}` });
    if (filters.location) chips.push({ key: 'location', label: `Location: ${filters.location}` });
    if (filters.keywords) chips.push({ key: 'keywords', label: `Keywords: ${filters.keywords}` });
    if (filters.score) chips.push({ key: 'score', label: `Score: ${filters.score}` });
    if (filters.dateFrom) chips.push({ key: 'dateFrom', label: `From: ${new Date(filters.dateFrom).toLocaleDateString()}` });
    if (filters.dateTo) chips.push({ key: 'dateTo', label: `To: ${new Date(filters.dateTo).toLocaleDateString()}` });
    return chips;
  }, [filters]);

  return (
    <div className="lgGridContainer">
      <style>{`
        .lgGridContainer { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .sidebarDesktop { display: none; }
        .filtersBtn { display: inline-flex; }
        @media (min-width: 960px) {
          .lgGridContainer { grid-template-columns: 280px 1fr; }
          .sidebarDesktop { display: block; }
          .filtersBtn { display: none; }
        }
        .sheetBackdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.32); z-index: 60; }
        .sheetPanel { position: fixed; top: 0; left: 0; height: 100%; width: 86%; max-width: 360px; background: var(--bg-subtle); border-right: 1px solid var(--border); padding: 16px; box-shadow: 0 10px 40px rgba(2,6,23,0.2); transform: translateX(-100%); transition: transform 200ms ease-out; }
        .sheetPanel.open { transform: translateX(0); }
      `}</style>
      <div className="sidebarDesktop">
        <LeadFiltersSidebar
          filters={filters}
          onChange={setFilters}
          onClear={() => setFilters({})}
          industries={industries}
        />
      </div>

      <main>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <button className="filtersBtn" onClick={() => setFiltersOpen(true)} aria-label="Open filters" style={filterToggleBtnStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 5h18M6 12h12M10 19h4" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Filters
            </button>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads..."
                aria-label="Global search"
                style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elev)', color: 'var(--text)', outlineColor: 'var(--focus)' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', top: 10, left: 12 }}>
                <path d="M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="var(--text-muted)" strokeWidth="1.5" />
              </svg>
            </div>
            <LeadImportExport ref={importExportRef} leads={leads ?? []} onImported={onImported} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Rows per page" style={selectStyle}>
              {[10, 20, 30, 40, 50].map((n) => (
                <option key={n} value={n}>{n}/page</option>
              ))}
            </select>
          </div>
        </div>

        {filterChips.length > 0 && (
          <div aria-label="Active filters" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {filterChips.map((chip) => (
              <button key={chip.key as string} onClick={() => setFilters({ ...filters, [chip.key]: undefined } as LeadFilters)} aria-label={`Remove ${chip.label}`} style={chipStyle}>
                <span>{chip.label}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div role="alert" style={{ marginBottom: 10, padding: 10, borderRadius: 12, border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.06)', color: 'var(--danger)' }}>
            {error} <button onClick={() => debouncedSearch(query, filters)} style={linkButtonStyle}>Retry</button>
          </div>
        )}

        {leads === null ? (
          <SkeletonTable />
        ) : leads.length === 0 ? (
          <EmptyState onImport={openImport} onRunSearch={runAiSearch} />
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-elev)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.6fr', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)', fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>
              {['Name', 'Company', 'Email', 'Industry', 'Budget', 'Location', 'Score', 'Added', 'Actions'].map((h, idx) => (
                <button key={h} onClick={() => onHeaderClick(['name','company','email','industry','budget','location','score','addedAt','id'][idx] as keyof Lead)} aria-label={`Sort by ${h}`} style={headerCellStyle}>
                  <span>{h}</span>
                  {idx <= 7 && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M7 10l5-5 5 5M7 14l5 5 5-5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            {paged.map((lead) => (
              <button key={lead.id} onClick={() => setSelected(lead)} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.6fr', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer' }}>
                <CellPrimary title={lead.name} subtitle={lead.company} />
                <CellText value={lead.company} />
                <CellText value={lead.email} muted />
                <CellText value={lead.industry} />
                <CellText value={`$${lead.budget.toLocaleString()}`} />
                <CellText value={lead.location} />
                <div><LeadScoring score={lead.score} confidence={lead.scoreConfidence} /></div>
                <CellText value={new Date(lead.addedAt).toLocaleDateString()} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={(e) => { e.stopPropagation(); setSelected(lead); }} style={rowButtonStyle} aria-label="View lead">View</button>
                  <button onClick={async (e) => { e.stopPropagation(); await navigator.clipboard.writeText(lead.email); toast.success('Email copied'); }} style={rowButtonStyle} aria-label="Copy email">Copy</button>
                </div>
              </button>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPage(1)} disabled={page === 1} style={pagerButtonStyle} aria-label="First page">«</button>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={pagerButtonStyle} aria-label="Prev page">‹</button>
                <div style={{ fontSize: 12, padding: '0 6px', color: 'var(--text)' }}>Page {page} / {totalPages}</div>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={pagerButtonStyle} aria-label="Next page">›</button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} style={pagerButtonStyle} aria-label="Last page">»</button>
              </div>
            </div>
          </div>
        )}
      </main>

      {filtersOpen && (
        <div className="sheetBackdrop" onClick={() => setFiltersOpen(false)}>
          <div className={`sheetPanel ${filtersOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Filters">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)' }}>Filters</div>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" style={iconButtonStyle}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <LeadFiltersSidebar
              filters={filters}
              onChange={setFilters}
              onClear={() => setFilters({})}
              industries={industries}
            />
          </div>
        </div>
      )}

      <LeadDetailsModal open={!!selected} lead={selected} onClose={() => setSelected(null)} onSave={onSaveLead} />
    </div>
  );
}

function CellPrimary({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>}
    </div>
  );
}

function CellText({ value, muted = false }: { value: string; muted?: boolean }) {
  return <div style={{ fontSize: 13, color: muted ? 'var(--text-muted)' : 'var(--text)' }}>{value}</div>;
}

const selectStyle: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  borderRadius: 12,
  padding: '8px 10px',
  outlineColor: 'var(--focus)',
};

const filterToggleBtnStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '8px 10px',
  fontSize: 14,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  cursor: 'pointer',
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

const headerCellStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--text)',
};

const chipStyle: React.CSSProperties = {
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
};

const rowButtonStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '4px 6px',
  fontSize: 12,
  cursor: 'pointer',
};

const pagerButtonStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '4px 8px',
  fontSize: 12,
  cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 6,
  cursor: 'pointer',
};

export default LeadFinderDashboard;