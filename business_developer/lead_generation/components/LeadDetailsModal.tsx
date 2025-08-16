import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Lead } from '../types/lead';

export function LeadDetailsModal({ open, lead, onClose, onSave }: { open: boolean; lead: Lead | null; onClose: () => void; onSave: (lead: Lead) => void }) {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Notes'>('Overview');
  const [editableLead, setEditableLead] = useState<Lead | null>(lead);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setEditableLead(lead);
  }, [lead]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setTimeout(() => dialogRef.current?.focus(), 0);
    }
  }, [open]);

  const content = useMemo(() => {
    if (!editableLead) return null;
    if (activeTab === 'Overview') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          <InfoRow label="Name" value={editableLead.name} />
          <InfoRow label="Email" value={editableLead.email} action={<a href={`mailto:${editableLead.email}`} style={linkStyle}>Open in Email</a>} />
          <InfoRow label="Company" value={editableLead.company} />
          <InfoRow label="Industry" value={editableLead.industry} />
          <InfoRow label="Budget" value={`$${editableLead.budget.toLocaleString()}`} />
          <InfoRow label="Location" value={editableLead.location} />
          <InfoRow label="Score" value={`${editableLead.score} (${editableLead.scoreConfidence}%)`} />
          <InfoRow label="Added" value={new Date(editableLead.addedAt).toLocaleDateString()} />
        </div>
      );
    }
    return (
      <div>
        <label htmlFor="notes" style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Notes</label>
        <textarea
          id="notes"
          value={editableLead?.notes ?? ''}
          onChange={(e) => setEditableLead((prev) => (prev ? { ...prev, notes: e.target.value } : prev))}
          style={{ width: '100%', minHeight: 140, padding: 10, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-elev)', color: 'var(--text)', outlineColor: 'var(--focus)' }}
          aria-label="Lead notes"
        />
      </div>
    );
  }, [activeTab, editableLead]);

  if (!open || !lead) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Lead details" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.32)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 60 }}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 720, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 16px 48px rgba(2,6,23,0.18)', overflow: 'hidden' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Lead Details</div>
          <button onClick={onClose} aria-label="Close dialog" style={iconButtonStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="var(--text)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }} role="tablist" aria-label="Lead details tabs">
            {(['Overview', 'Notes'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                  background: activeTab === tab ? 'var(--brand-muted)' : 'transparent',
                  color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          {content}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
            <button
              onClick={() => {
                if (editableLead) {
                  onSave(editableLead);
                  toast.success('Saved lead');
                }
              }}
              style={primaryButtonStyle}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, action }: { label: string; value: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
        <div style={{ fontSize: 14, color: 'var(--text)' }}>{value}</div>
      </div>
      {action}
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: 'var(--brand-strong)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--brand)',
  color: 'white',
  border: '1px solid var(--brand-strong)',
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'var(--bg-elev)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '8px 12px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const iconButtonStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: 6,
  cursor: 'pointer',
};

export default LeadDetailsModal;