import React from 'react';

export function SkeletonTable({ rows = 8 }: { rows?: number }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-elev)' }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <div style={{ width: 200, height: 16, background: 'var(--border)', borderRadius: 8 }} />
      </div>
      <div>
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.4fr 1fr 0.8fr 1fr 0.7fr 0.9fr 0.6fr', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            {Array.from({ length: 9 }).map((__, i) => (
              <div key={i} style={{ height: 14, background: 'linear-gradient(90deg, var(--border), #f1f5f9, var(--border))', backgroundSize: '200% 100%', animation: 'pulse 1.2s ease-in-out infinite', borderRadius: 6 }} />
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes pulse { 0% { background-position: 0% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  );
}

export default SkeletonTable;