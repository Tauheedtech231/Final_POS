import React from 'react';

export function EmptyState({ onImport, onRunSearch }: { onImport: () => void; onRunSearch: () => void }) {
  return (
    <div
      role="region"
      aria-label="No results"
      style={{
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <div aria-hidden style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--brand-muted)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M21 15V5a2 2 0 0 0-2-2H7" stroke="var(--brand-strong)" strokeWidth="1.5" />
            <path d="M3 7v12a2 2 0 0 0 2 2h12" stroke="var(--brand-strong)" strokeWidth="1.5" />
            <path d="M3 7l4-4" stroke="var(--brand-strong)" strokeWidth="1.5" />
          </svg>
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>No leads yet</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
          Import a CSV to get started or run an AI search to generate a curated list of mock leads.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onImport} style={primaryButtonStyle} aria-label="Import CSV">
            Import CSV
          </button>
          <button onClick={onRunSearch} style={secondaryButtonStyle} aria-label="Run AI Search">
            Run AI Search
          </button>
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--brand)',
  color: 'white',
  border: '1px solid var(--brand-strong)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

export default EmptyState;