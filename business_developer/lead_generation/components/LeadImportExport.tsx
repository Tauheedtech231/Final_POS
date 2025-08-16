import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { toast } from 'sonner';
import { Lead } from '../types/lead';
import { downloadCsv, leadsToCsv, parseCsvFile, getSampleCsv } from '../lib/csv';

export type LeadImportExportHandle = {
  openImport: () => void;
  exportCsv: () => void;
};

export const LeadImportExport = forwardRef<LeadImportExportHandle, { leads: Lead[]; onImported: (leads: Lead[]) => void }>(
  function LeadImportExport({ leads, onImported }, ref) {
    const fileRef = useRef<HTMLInputElement | null>(null);

    useImperativeHandle(ref, () => ({
      openImport: () => fileRef.current?.click(),
      exportCsv: handleExport,
    }));

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      const { leads: imported, errors } = await parseCsvFile(file);
      if (errors.length > 0) {
        toast.error(errors.join('\n'));
      }
      if (imported.length > 0) {
        onImported(imported);
      }
      e.target.value = '';
    }

    function handleExport() {
      const csv = leadsToCsv(leads);
      downloadCsv('leads.csv', csv);
      toast.success('Exported CSV');
    }

    return (
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input ref={fileRef} type="file" accept=".csv" onChange={onFileChange} style={{ display: 'none' }} />
        <button onClick={() => fileRef.current?.click()} style={primaryButtonStyle} aria-label="Import CSV">
          Import CSV
        </button>
        <button onClick={handleExport} style={secondaryButtonStyle} aria-label="Export CSV">
          Export CSV
        </button>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(getSampleCsv())}`}
          download="sample_leads.csv"
          style={{ ...secondaryButtonStyle, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
        >
          Sample CSV
        </a>
      </div>
    );
  }
);

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

export default LeadImportExport;