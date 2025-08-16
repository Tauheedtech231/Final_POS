'use client';

/**
 * LeadGenerationModule
 *
 * Usage (Next.js App Router):
 * - Place this folder under `business_developer/lead_generation`.
 * - Import and use in a page or route:
 *   `import { LeadGenerationModule } from 'business_developer/lead_generation/LeadGenerationModule';`
 *   Then render: `<LeadGenerationModule />`
 *
 * Mock AI Search:
 * - Uses local mocked leads via `findLeads(query, filters)` from `ai/leadFinder`.
 * - Debounced by 300ms with client-side filtering/sorting/pagination.
 *
 * CSV Import/Export:
 * - Import CSV with columns: name, email, company, industry, budget, location.
 * - Export current filtered results via the Export button.
 * - A sample CSV link is provided in the toolbar.
 */

import React from 'react';
import TopNav from './components/TopNav';
import { LeadFinderDashboard } from './components/LeadFinderDashboard';
import { Toaster } from 'sonner';

export function LeadGenerationModule() {
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
      <ThemeVariables />
      <TopNav />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <LeadFinderDashboard />
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}

function ThemeVariables() {
  // Inline CSS variables to ensure independence of the module.
  // These complement globals.css but do not require modifications outside this folder.
  return (
    <style>{`
      :root {
        --brand: #34D399;
        --brand-strong: #10B981;
        --brand-muted: #A7F3D0;
        --bg: #F7FAF9;
        --bg-elev: #FFFFFF;
        --bg-subtle: #ECFDF5;
        --border: #E5E7EB;
        --text: #0F172A;
        --text-muted: #475569;
        --success: #10B981;
        --warn: #F59E0B;
        --danger: #EF4444;
        --focus: #34D399;
      }

      ::selection { background: var(--brand-muted); }

      button:focus, input:focus, select:focus, textarea:focus, a:focus { outline: 2px solid var(--focus); outline-offset: 1px; }
    `}</style>
  );
}

export default LeadGenerationModule;