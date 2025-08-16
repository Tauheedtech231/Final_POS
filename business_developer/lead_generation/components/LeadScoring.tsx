import React from 'react';
import { LeadScore } from '../types/lead';

export function LeadScoring({ score, confidence }: { score: LeadScore; confidence?: number }) {
  const color = score === 'High' ? 'var(--success)' : score === 'Medium' ? 'var(--warn)' : 'var(--danger)';
  const bgColor = score === 'High' ? 'rgba(16, 185, 129, 0.12)' : score === 'Medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)';

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
      <span
        aria-label={`Lead score ${score}`}
        style={{
          background: bgColor,
          color,
          border: `1px solid ${color}`,
          borderRadius: 9999,
          padding: '2px 10px',
          fontSize: 12,
          fontWeight: 600,
          lineHeight: 1.6,
        }}
      >
        {score}
      </span>
      {typeof confidence === 'number' && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }} aria-label="Score confidence">
          {confidence}% confidence
        </span>
      )}
    </div>
  );
}

export default LeadScoring;