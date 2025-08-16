import React, { useEffect, useRef, useState } from 'react';

export function TopNav() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header
      role="banner"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'var(--bg-elev)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div aria-hidden style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand)', display: 'grid', placeItems: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 12c5 0 7-8 8-8s3 8 8 8-7 8-8 8-3-8-8-8Z" stroke="white" strokeWidth="1.5" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>AI Business Developer</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lead Generation</div>
          </div>
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: '1px solid var(--border)',
              padding: '6px 10px',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            <div aria-hidden style={{ width: 24, height: 24, borderRadius: 999, background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))' }} />
            <span style={{ fontSize: 13, color: 'var(--text)' }}>You</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {open && (
            <div role="menu" aria-label="Profile menu" style={{ position: 'absolute', right: 0, marginTop: 8, minWidth: 180, background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <button role="menuitem" style={menuItemStyle} onClick={() => setOpen(false)}>Profile</button>
              <button role="menuitem" style={menuItemStyle} onClick={() => setOpen(false)}>Settings</button>
              <div aria-hidden style={{ height: 1, background: 'var(--border)' }} />
              <button role="menuitem" style={{ ...menuItemStyle, color: 'var(--danger)' }} onClick={() => setOpen(false)}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  textAlign: 'left',
  background: 'transparent',
  border: 'none',
  padding: '10px 12px',
  cursor: 'pointer',
  fontSize: 14,
  color: 'var(--text)',
};

export default TopNav;