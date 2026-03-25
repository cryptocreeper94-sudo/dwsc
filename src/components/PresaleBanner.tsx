/**
 * PresaleBanner — Self-contained Signal (SIG) presale promotion.
 * No external CSS or dependencies required.
 * Dismissible per-session (sessionStorage) — comes back next visit.
 */
import { useState } from 'react';

const PRESALE_URL = 'https://dwtl.io/presale';

const styles: Record<string, React.CSSProperties> = {
  banner: { position: 'relative', zIndex: 50, background: 'linear-gradient(135deg, rgba(6,182,212,0.06) 0%, rgba(168,85,247,0.04) 50%, rgba(6,182,212,0.06) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(6,182,212,0.25)', padding: '10px 16px' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' as const },
  live: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: '#6ee7b7' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.5)' },
  token: { fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' },
  price: { fontSize: 14, fontWeight: 900, color: '#67e8f9', fontFamily: 'monospace' },
  arrow: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  tge: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  multiplier: { display: 'inline-flex', padding: '2px 8px', borderRadius: 6, background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(168,85,247,0.08))', border: '1px solid rgba(6,182,212,0.2)', fontSize: 11, fontWeight: 900, color: '#67e8f9' },
  cta: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 20px', borderRadius: 999, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' as const },
  dismiss: { position: 'absolute' as const, right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 14, cursor: 'pointer', padding: 4 },
};

export function PresaleBanner() {
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem('presale-banner-dismissed') === 'true'; } catch { return false; } });
  if (dismissed) return null;
  return (
    <div style={styles.banner}>
      <div style={styles.inner}>
        <span style={styles.live}><span style={styles.dot} /> LIVE</span>
        <span style={styles.token}>Signal Charging <span style={styles.price}>$0.001</span> <span style={styles.arrow}>→</span> <span style={styles.tge}>$0.01 at TGE</span> <span style={styles.multiplier}>10×</span></span>
        <a style={styles.cta} href={PRESALE_URL} target="_blank" rel="noopener noreferrer">⚡ Start Charging</a>
      </div>
      <button style={styles.dismiss} onClick={() => { setDismissed(true); try { sessionStorage.setItem('presale-banner-dismissed', 'true'); } catch {} }} aria-label="Dismiss">✕</button>
    </div>
  );
}
