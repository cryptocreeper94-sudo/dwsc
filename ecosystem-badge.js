/**
 * DarkWave Ecosystem Profile Badge — Vanilla JS Widget
 * Drop-in <script> tag for static HTML sites.
 * Renders the ecosystem profile button (top-right) with identity panel.
 *
 * Usage: <script src="/ecosystem-badge.js" defer></script>
 *
 * DarkWave Studios LLC — Copyright 2026
 */
(function () {
  'use strict';

  const HUB = 'https://trusthub.tlid.io';
  const IDENTITY_API = HUB + '/api/user/ecosystem-identity';
  const TOKEN_KEYS = ['dwtl_session_token', 'tl_session_token', 'trustlayer_token', 'hub_session_token'];
  const USER_KEYS = ['dwtl_user', 'tl_user', 'trustlayer_user', 'user', 'auth_user', 'eco_user'];

  const APPS = [
    { n: 'Trust Layer', u: 'https://dwtl.io', i: '🌊' },
    { n: 'Trust Hub', u: 'https://trusthub.tlid.io', i: '🛡️' },
    { n: 'DWSC', u: 'https://dwsc.io', i: '◈' },
    { n: 'TrustVault', u: 'https://trustvault.studio', i: '🔐' },
    { n: 'TrustShield', u: 'https://trustshield.tech', i: '🛡️' },
    { n: 'Axiom', u: 'https://axiom42.com', i: '🧠' },
    { n: 'Pulse', u: 'https://darkwavepulse.com', i: '📈' },
    { n: 'Lume', u: 'https://lume-lang.org', i: '💡' },
    { n: 'Lume42', u: 'https://lume42.com', i: '⚡' },
    { n: 'Lume-Cortex', u: 'https://lume-cortex.com', i: '🧬' },
    { n: 'Lume Auto', u: 'https://lumeauto.tech', i: '🚗' },
    { n: 'GarageBot', u: 'https://garagebot.io', i: '🔧' },
    { n: 'DWStudios', u: 'https://darkwavestudios.io', i: '🎛️' },
    { n: 'ORBIT', u: 'https://orbitstaffing.io', i: '🌐' },
    { n: 'TrustGen', u: 'https://trustgen.design', i: '🎨' },
    { n: 'Chronicles', u: 'https://yourlegacy.io', i: '📜' },
    { n: 'THE VOID', u: 'https://intothevoid.app', i: '🕳️' },
    { n: 'Verdara', u: 'https://verdara.tlid.io', i: '🌿' },
    { n: 'HydroCore', u: 'https://hydrocore.com', i: '💧' },
    { n: 'Meridian', u: 'https://meridiancanon.com', i: '📖' },
  ];

  function getToken() {
    for (var k of TOKEN_KEYS) { try { var v = localStorage.getItem(k); if (v) return v; } catch (e) { } }
    return null;
  }

  function getSnapshot() {
    for (var k of USER_KEYS) {
      try { var r = localStorage.getItem(k); if (r) { var d = JSON.parse(r); if (d && (d.name || d.email || d.username || d.displayName)) return d; } } catch (e) { }
    }
    return null;
  }

  function initials(name) {
    return name.split(' ').map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
  }

  var isMobile = window.innerWidth <= 640;

  // ── Build DOM ──
  var badge = document.createElement('div');
  badge.id = 'dw-eco-badge';
  badge.innerHTML = '';

  // Trigger button
  var btn = document.createElement('button');
  btn.id = 'dw-eco-trigger';
  btn.setAttribute('aria-label', 'Ecosystem Profile');
  btn.textContent = '👤';
  Object.assign(btn.style, {
    position: 'fixed', top: '14px', right: '16px', zIndex: '9998',
    width: '38px', height: '38px', borderRadius: '50%',
    border: '2px solid rgba(6,182,212,0.35)',
    background: 'linear-gradient(135deg,rgba(8,10,18,0.92),rgba(8,10,18,0.92))',
    backdropFilter: 'blur(20px)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '15px', color: 'rgba(255,255,255,0.85)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    padding: '0', outline: 'none', transition: 'all 0.2s ease',
  });

  // Backdrop
  var backdrop = document.createElement('div');
  Object.assign(backdrop.style, {
    position: 'fixed', top: '0', left: '0', right: '0', bottom: '0',
    zIndex: '9998', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
    display: 'none',
  });

  // Panel
  var panel = document.createElement('div');
  Object.assign(panel.style, {
    position: 'fixed', top: '0', right: '0', zIndex: '9999',
    width: isMobile ? '100vw' : '380px', maxWidth: '100vw', height: '100dvh',
    background: 'linear-gradient(180deg,rgba(6,8,16,0.99),rgba(2,4,10,0.995))',
    borderLeft: isMobile ? 'none' : '1px solid rgba(6,182,212,0.12)',
    backdropFilter: 'blur(60px)', overflowY: 'auto',
    fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    display: 'none', flexDirection: 'column',
  });

  var isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'flex' : 'none';
    backdrop.style.display = isOpen ? 'block' : 'none';
    btn.style.borderColor = isOpen ? '#06b6d4' : 'rgba(6,182,212,0.35)';
    btn.style.boxShadow = isOpen ? '0 0 20px rgba(6,182,212,0.3)' : '0 4px 20px rgba(0,0,0,0.4)';
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadIdentity();
    } else {
      document.body.style.overflow = '';
    }
  }

  function close() { if (isOpen) toggle(); }

  btn.addEventListener('click', toggle);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  function renderPanel(identity) {
    var name = identity ? (identity.displayName || identity.username || identity.name || '') : '';
    var email = identity ? (identity.email || '') : '';
    var avatar = identity ? (identity.avatarUrl || identity.avatar || '') : '';
    var tier = identity ? (identity.memberTier || 'free') : 'free';
    var tierLabels = { founder: '🏅 Founder', premium: '💎 Premium', standard: '✓ Standard', free: 'Free' };
    var tierColors = { founder: '#fbbf24', premium: '#7dd3fc', standard: '#67e8f9', free: 'rgba(255,255,255,0.35)' };

    // Update trigger avatar
    if (avatar) {
      btn.innerHTML = '<img src="' + avatar + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover" />';
    } else if (name) {
      btn.innerHTML = '<span style="font-size:10px;font-weight:800;color:#67e8f9">' + initials(name) + '</span>';
    }

    var html = '';
    // Close + header
    html += '<div style="padding:18px 18px 14px;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:12px">';
    if (avatar) {
      html += '<div style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(6,182,212,0.25);overflow:hidden;flex-shrink:0"><img src="' + avatar + '" style="width:100%;height:100%;object-fit:cover"></div>';
    } else {
      html += '<div style="width:48px;height:48px;border-radius:50%;border:2px solid rgba(6,182,212,0.25);display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(6,182,212,0.12),rgba(14,165,233,0.08));font-size:18px;font-weight:800;color:#67e8f9;flex-shrink:0">' + (name ? initials(name) : '👤') + '</div>';
    }
    html += '<div style="flex:1;min-width:0">';
    html += '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.92);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (name || 'DarkWave Ecosystem') + '</div>';
    if (email) html += '<div style="font-size:10px;color:rgba(6,182,212,0.55);font-family:JetBrains Mono,monospace;margin-top:1px">' + email + '</div>';
    if (identity) html += '<div style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:6px;font-size:9px;font-weight:800;letter-spacing:0.06em;margin-top:3px;background:rgba(6,182,212,0.10);color:' + (tierColors[tier] || tierColors.free) + '">' + (tierLabels[tier] || 'Free') + '</div>';
    html += '</div>';
    html += '<button onclick="document.getElementById(\'dw-eco-badge\').dispatchEvent(new Event(\'close\'))" style="width:28px;height:28px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;padding:0;outline:none;margin-left:auto">✕</button>';
    html += '</div>';

    if (!identity) {
      html += '<div style="padding:40px 24px;text-align:center">';
      html += '<div style="font-size:32px;margin-bottom:12px">🌊</div>';
      html += '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,0.8);margin-bottom:8px">Connect to Trust Layer</div>';
      html += '<div style="font-size:12px;color:rgba(255,255,255,0.35);margin-bottom:20px;line-height:1.5">Sign in to access your wallet, identity, and ecosystem apps.</div>';
      html += '<a href="' + HUB + '/login" target="_blank" rel="noopener noreferrer" style="display:inline-flex;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#fff;text-decoration:none;font-size:13px;font-weight:700">Sign In</a>';
      html += '</div>';
    }

    // Ecosystem Apps
    html += '<div style="padding:14px 14px 6px"><div style="font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;color:rgba(255,255,255,0.18);margin-bottom:8px">Ecosystem Apps</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
    APPS.forEach(function (a) {
      html += '<a href="' + a.u + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:7px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);text-decoration:none;color:rgba(255,255,255,0.5);font-size:10px;font-weight:600;min-height:30px;transition:all 0.15s"><span style="font-size:11px">' + a.i + '</span>' + a.n + '</a>';
    });
    html += '</div></div>';

    // Trust Hub download
    html += '<div style="padding:10px 14px"><a href="https://expo.dev/accounts/cryptocreeper/projects/trust-layer-hub/builds/e90deea6-4ae4-43b8-8a7a-628c0b51ce49" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;text-decoration:none;background:linear-gradient(135deg,rgba(6,182,212,0.10),rgba(14,165,233,0.06));border:1px solid rgba(6,182,212,0.18)">';
    html += '<div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#06b6d4,#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:20px">🛡️</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.92)">Trust Layer Hub</div><div style="font-size:10px;color:rgba(6,182,212,0.6);margin-top:1px">Your entire ecosystem in one app</div></div>';
    html += '<div style="padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;background:linear-gradient(135deg,#06b6d4,#0ea5e9);color:#000;white-space:nowrap">FREE ↓</div>';
    html += '</a></div>';

    // Lume Scan ad
    html += '<div style="padding:0 14px 14px"><a href="https://lumeauto.tech/order" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:12px;text-decoration:none;background:linear-gradient(135deg,rgba(16,185,129,0.08),rgba(245,158,11,0.05));border:1px solid rgba(16,185,129,0.15)">';
    html += '<div style="width:40px;height:40px;border-radius:10px;flex-shrink:0;background:linear-gradient(135deg,#10b981,#f59e0b);display:flex;align-items:center;justify-content:center;font-size:18px">🔧</div>';
    html += '<div style="flex:1"><div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.92)">Lume Scan</div><div style="font-size:10px;color:rgba(16,185,129,0.6);margin-top:1px">Pro OBD-II diagnostics · 42 live signals</div></div>';
    html += '<div style="padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;background:linear-gradient(135deg,#10b981,#059669);color:#000;white-space:nowrap">$29.99</div>';
    html += '</a></div>';

    // Footer
    html += '<div style="margin-top:auto;padding:12px 18px;border-top:1px solid rgba(255,255,255,0.025);font-size:9px;color:rgba(255,255,255,0.12);text-align:center">';
    html += '© 2026 <a href="https://darkwavestudios.io" target="_blank" style="color:rgba(6,182,212,0.4);text-decoration:none">DarkWave Studios LLC</a> · Trust Layer Ecosystem';
    html += '</div>';

    panel.innerHTML = html;
  }

  function loadIdentity() {
    var token = getToken();
    if (!token) {
      var snap = getSnapshot();
      renderPanel(snap);
      return;
    }
    fetch(IDENTITY_API, { headers: { Authorization: 'Bearer ' + token }, credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { renderPanel(data || getSnapshot()); })
      .catch(function () { renderPanel(getSnapshot()); });
  }

  badge.addEventListener('close', close);

  // Initial render
  renderPanel(null);

  badge.appendChild(btn);
  badge.appendChild(backdrop);
  badge.appendChild(panel);
  document.body.appendChild(badge);
})();
