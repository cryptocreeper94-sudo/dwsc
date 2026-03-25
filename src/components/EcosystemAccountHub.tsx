/**
 * EcosystemAccountHub V2 — Standalone Portable (Inline Styles)
 * Premium + Mobile-Optimized + Rotating Affiliate Bonus
 * Zero external dependencies. Drop into any React repo.
 */
import { useState, useEffect, useCallback, type CSSProperties } from 'react';

const SSO = 'https://dwtl.io';
const PRE = 'https://dwtl.io/presale';

/* ── Rotating Bonus System (embedded) ── */
interface Bonus { id:string; app:string; icon:string; headline:string; reward:string; sigAmount:number; multiplier?:string; perk?:string; url:string; refParam:string; accent:string; glow:string; start:string; end:string; }
const BONUSES: Bonus[] = [
  { id:'chronicles',app:'Chronicles',icon:'📜',headline:'Legacy Founders Drive',reward:'Refer a friend to Chronicles',sigAmount:500,multiplier:'2×',perk:'Founder Badge',url:'https://yourlegacy.io/chronicles/login',refParam:'ref',accent:'#06b6d4',glow:'rgba(6,182,212,0.06)',start:'2026-03-24',end:'2026-04-07' },
  { id:'orbit',app:'ORBIT Staffing',icon:'🌐',headline:'ORBIT Member Drive',reward:'Onboard someone to ORBIT',sigAmount:1000,multiplier:'3×',perk:'Hallmark boost',url:'https://orbitstaffing.io',refParam:'ref',accent:'#8b5cf6',glow:'rgba(139,92,246,0.06)',start:'2026-04-07',end:'2026-04-21' },
  { id:'trustgen',app:'TrustGen 3D',icon:'🎨',headline:'Creator Collective',reward:'Bring 3 users to TrustGen',sigAmount:750,multiplier:'2×',perk:'3D asset pack',url:'https://trustgen.tlid.io/explore',refParam:'ref',accent:'#f43f5e',glow:'rgba(244,63,94,0.06)',start:'2026-04-21',end:'2026-05-05' },
  { id:'bomber',app:'Bomber 3D',icon:'⛳',headline:'Long Drive Challenge',reward:'Invite players to Bomber',sigAmount:300,multiplier:'2×',perk:'Pro skin',url:'https://bomber.tlid.io',refParam:'ref',accent:'#10b981',glow:'rgba(16,185,129,0.06)',start:'2026-05-05',end:'2026-05-19' },
  { id:'vault',app:'TrustVault',icon:'🔐',headline:'Secure the Network',reward:'Refer friends to TrustVault',sigAmount:600,multiplier:'2×',perk:'Vault tier up',url:'https://trustvault.tlid.io',refParam:'ref',accent:'#06b6d4',glow:'rgba(6,182,212,0.06)',start:'2026-05-19',end:'2026-06-02' },
  { id:'void',app:'THE VOID',icon:'🕳️',headline:'Void Explorers',reward:'Bring friends into THE VOID',sigAmount:400,multiplier:'2×',perk:'Void ID skin',url:'https://intothevoid.app',refParam:'ref',accent:'#8b5cf6',glow:'rgba(139,92,246,0.06)',start:'2026-06-02',end:'2026-06-16' },
  { id:'lotops',app:'Lot Ops Pro',icon:'🚗',headline:'Fleet Expansion',reward:'Onboard a dealer',sigAmount:1500,multiplier:'5×',perk:'Analytics unlock',url:'https://lotopspro.io',refParam:'ref',accent:'#f59e0b',glow:'rgba(245,158,11,0.06)',start:'2026-06-16',end:'2026-06-30' },
  { id:'lume',app:'Lume',icon:'💡',headline:'Language Pioneers',reward:'Invite devs to Lume',sigAmount:500,multiplier:'2×',perk:'v1.0 early access',url:'https://lume-lang.org',refParam:'ref',accent:'#06b6d4',glow:'rgba(6,182,212,0.06)',start:'2026-06-30',end:'2026-07-14' },
];
function getBonus(): Bonus { const t=new Date().toISOString().split('T')[0]; const m=BONUSES.find(b=>t>=b.start&&t<b.end); if(m)return m; const y=new Date(),s=new Date(y.getFullYear(),0,1),w=Math.ceil(((y.getTime()-s.getTime())/864e5+s.getDay()+1)/7); return BONUSES[w%BONUSES.length]; }
function timeLeft(b:Bonus):string { const d=new Date(b.end).getTime()-Date.now(); if(d<=0)return'Ending soon'; const days=Math.floor(d/864e5); return days>1?`${days} days left`:`${Math.floor((d%864e5)/36e5)}h left`; }
function refUrl(b:Bonus,u?:string):string { const s=b.url.includes('?')?'&':'?'; return `${b.url}${s}${b.refParam}=${u||'eco'}&bonus=${b.id}`; }

const APPS = [
  {n:'Trust Hub',u:'https://trusthub.tlid.io',i:'🛡️'},{n:'TrustGen 3D',u:'https://trustgen.tlid.io',i:'🎨'},{n:'TrustVault',u:'https://trustvault.tlid.io',i:'🔐'},
  {n:'Chronicles',u:'https://yourlegacy.io',i:'📜'},{n:'ORBIT',u:'https://orbitstaffing.io',i:'🌐'},{n:'Lume',u:'https://lume-lang.org',i:'💡'},
  {n:'Bomber 3D',u:'https://bomber.tlid.io',i:'⛳'},{n:'THE VOID',u:'https://intothevoid.app',i:'🕳️'},{n:'Lot Ops',u:'https://lotopspro.io',i:'🚗'},
  {n:'SignalCast',u:'https://signalcast.tlid.io',i:'📡'},{n:'Studio',u:'https://studio.tlid.io',i:'🎛️'},
];

function getUser():{name?:string;email?:string;avatar?:string}|null {
  for(const k of['tl_user','trustlayer_user','user','auth_user','dwtl_user','eco_user','vanops_user','orbit_user','trustgen_user','chronicles_user','bomber_user']){
    try{const r=localStorage.getItem(k);if(r){const d=JSON.parse(r);if(d&&(d.name||d.email||d.username||d.displayName))return{name:d.displayName||d.name||d.username||d.email?.split('@')[0],email:d.email,avatar:d.avatar||d.avatarUrl||d.profilePic}}}catch{}
  }
  return null;
}
function ini(n:string):string{return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}

/* ── Inline Styles ── */
const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

const S: Record<string, CSSProperties> = {
  trigger:{position:'fixed',top:14,right:16,zIndex:9998,width:38,height:38,borderRadius:'50%',border:'2px solid rgba(6,182,212,0.35)',background:'linear-gradient(135deg,rgba(8,10,18,0.9),rgba(8,10,18,0.9))',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,color:'rgba(255,255,255,0.85)',boxShadow:'0 4px 20px rgba(0,0,0,0.4)',padding:0,outline:'none'},
  backdrop:{position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(6px)',WebkitBackdropFilter:'blur(6px)'},
  panel:{position:'fixed',top:0,right:0,zIndex:9999,width:isMobile?'100vw':360,maxWidth:'100vw',height:'100dvh',background:'linear-gradient(180deg,rgba(8,10,18,0.98),rgba(4,6,12,0.99))',borderLeft:isMobile?'none':'1px solid rgba(6,182,212,0.1)',backdropFilter:'blur(60px)',WebkitBackdropFilter:'blur(60px)',overflowY:'auto' as const,display:'flex',flexDirection:'column' as const,overscrollBehavior:'contain'},
  drag:{display:isMobile?'flex':'none',justifyContent:'center',padding:'10px 0 4px'},
  dragBar:{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,0.12)'},
  hdr:{padding:'20px 20px 16px',borderBottom:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',gap:14},
  av:{width:48,height:48,borderRadius:'50%',border:'2px solid transparent',background:'linear-gradient(135deg,rgba(8,10,18,0.9),rgba(8,10,18,0.9))',backgroundClip:'padding-box',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0,boxShadow:'inset 0 0 0 2px rgba(6,182,212,0.2)'},
  info:{flex:1,minWidth:0},
  nm:{fontSize:15,fontWeight:700,color:'rgba(255,255,255,0.92)',whiteSpace:'nowrap' as const,overflow:'hidden',textOverflow:'ellipsis'},
  em:{fontSize:11,color:'rgba(6,182,212,0.5)',fontFamily:"'JetBrains Mono',monospace",marginTop:2},
  close:{width:30,height:30,borderRadius:10,border:'1px solid rgba(255,255,255,0.04)',background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.25)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,flexShrink:0,padding:0,outline:'none'},
  bonus:{margin:16,padding:16,borderRadius:16,border:'1px solid rgba(6,182,212,0.12)',position:'relative' as const,overflow:'hidden'},
  bonusLbl:{display:'flex',alignItems:'center',gap:6,fontSize:9,fontWeight:800,textTransform:'uppercase' as const,letterSpacing:'0.14em',marginBottom:10},
  bonusDot:{width:6,height:6,borderRadius:'50%'},
  bonusHead:{fontSize:16,fontWeight:800,color:'rgba(255,255,255,0.92)',marginBottom:4},
  bonusReward:{fontSize:12,color:'rgba(255,255,255,0.45)',marginBottom:12,lineHeight:1.4},
  bonusStats:{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap' as const},
  bonusSig:{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:8,background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.15)',fontSize:12,fontWeight:900,color:'#67e8f9',fontFamily:"'JetBrains Mono',monospace"},
  bonusMult:{display:'inline-flex',padding:'3px 8px',borderRadius:8,background:'linear-gradient(135deg,rgba(168,85,247,0.1),rgba(6,182,212,0.08))',border:'1px solid rgba(168,85,247,0.2)',fontSize:11,fontWeight:900,color:'#c4b5fd'},
  bonusPerk:{display:'inline-flex',padding:'3px 8px',borderRadius:8,background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.15)',fontSize:10,fontWeight:700,color:'#6ee7b7'},
  bonusTimer:{fontSize:10,color:'rgba(255,255,255,0.25)',fontFamily:"'JetBrains Mono',monospace"},
  bonusCta:{display:'flex',alignItems:'center',justifyContent:'center',gap:6,width:'100%',padding:isMobile?'12px 0':'10px 0',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,textDecoration:'none',border:'none',cursor:'pointer',marginTop:10,minHeight:isMobile?48:44},
  sec:{padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.02)'},
  lbl:{fontSize:9,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.12em',color:'rgba(255,255,255,0.18)',marginBottom:8},
  row:{display:'flex',alignItems:'center',gap:12,padding:isMobile?'12px 14px':'10px 12px',borderRadius:12,cursor:'pointer',textDecoration:'none',color:'rgba(255,255,255,0.65)',marginBottom:1,minHeight:isMobile?48:44},
  rIcon:{width:32,height:32,borderRadius:10,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0},
  rCont:{flex:1,minWidth:0},
  rTitle:{fontSize:13,fontWeight:600},
  rSub:{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:1},
  badge:{padding:'2px 8px',borderRadius:6,fontSize:10,fontWeight:800,fontFamily:"'JetBrains Mono',monospace"},
  badgeC:{background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.15)',color:'#67e8f9'},
  badgeG:{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.15)',color:'#6ee7b7'},
  grid:{display:'flex',flexWrap:'wrap' as const,gap:6,padding:'0 12px'},
  appBadge:{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.04)',textDecoration:'none',color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:600,minHeight:32},
  conn:{padding:'32px 24px',display:'flex',flexDirection:'column' as const,alignItems:'center',gap:16,textAlign:'center' as const,flex:1,justifyContent:'center'},
  connBtn:{display:'inline-flex',alignItems:'center',gap:8,padding:isMobile?'14px 36px':'12px 32px',borderRadius:999,background:'linear-gradient(135deg,#06b6d4,#8b5cf6)',color:'#fff',fontSize:isMobile?15:14,fontWeight:700,textDecoration:'none',border:'none',cursor:'pointer',minHeight:isMobile?48:44},
  ft:{marginTop:'auto',padding:'14px 20px',borderTop:'1px solid rgba(255,255,255,0.02)',fontSize:10,color:'rgba(255,255,255,0.12)',textAlign:'center' as const},
  ftLink:{color:'rgba(6,182,212,0.35)',textDecoration:'none'},
};

export function EcosystemAccountHub() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null);
  const bonus = getBonus();
  const [tl, setTl] = useState(timeLeft(bonus));

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => { const iv=setInterval(()=>setTl(timeLeft(bonus)),60000); return()=>clearInterval(iv); }, [bonus]);
  useEffect(() => { if(!open)return; const h=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false)}; document.addEventListener('keydown',h); return()=>document.removeEventListener('keydown',h); }, [open]);
  useEffect(() => { if(open){document.body.style.overflow='hidden'; return()=>{document.body.style.overflow=''}} }, [open]);

  const toggle = useCallback(() => setOpen(o=>!o), []);
  const close = useCallback(() => setOpen(false), []);
  const redir = (() => { try{return encodeURIComponent(window.location.origin)}catch{return''} })();

  return (
    <>
      <button style={{...S.trigger,...(open?{borderColor:'#06b6d4'}:{})}} onClick={toggle} aria-label="Account Hub">
        {user?.avatar?<img style={{width:30,height:30,borderRadius:'50%',objectFit:'cover'}} src={user.avatar} alt=""/>:user?.name?<span style={{fontSize:11,fontWeight:800,color:'#67e8f9'}}>{ini(user.name)}</span>:'👤'}
      </button>

      {open && <div style={S.backdrop} onClick={close} />}

      {open && (
        <div style={S.panel}>
          <div style={S.drag}><div style={S.dragBar}/></div>

          <div style={S.hdr}>
            <div style={S.av}>{user?.avatar?<img src={user.avatar} alt="" style={{width:42,height:42,borderRadius:'50%',objectFit:'cover'}}/>:user?.name?<span style={{fontWeight:800,fontSize:14,color:'#67e8f9'}}>{ini(user.name)}</span>:'👤'}</div>
            <div style={S.info}><div style={S.nm}>{user?.name||'Trust Layer'}</div><div style={S.em}>{user?.email||'Connect your account'}</div></div>
            <button style={S.close} onClick={close}>✕</button>
          </div>

          {/* 🔥 BONUS CARD */}
          <div style={{...S.bonus,background:`linear-gradient(135deg,${bonus.glow},rgba(0,0,0,0.1))`}}>
            <div style={{...S.bonusLbl,color:bonus.accent}}><span style={{...S.bonusDot,background:bonus.accent}}/>🔥 This Week's Bonus</div>
            <div style={S.bonusHead}>{bonus.icon} {bonus.headline}</div>
            <div style={S.bonusReward}>{bonus.reward}</div>
            <div style={S.bonusStats}>
              <span style={S.bonusSig}>⚡ {bonus.sigAmount.toLocaleString()} SIG</span>
              {bonus.multiplier&&<span style={S.bonusMult}>{bonus.multiplier}</span>}
              {bonus.perk&&<span style={S.bonusPerk}>+ {bonus.perk}</span>}
            </div>
            <div style={S.bonusTimer}>⏱ {tl}</div>
            <a style={{...S.bonusCta,background:`linear-gradient(135deg,${bonus.accent},#8b5cf6)`}} href={refUrl(bonus,user?.name)} target="_blank" rel="noopener noreferrer">🚀 Refer & Earn</a>
          </div>

          {user ? (
            <>
              <div style={S.sec}><div style={S.lbl}>Signal Wallet</div>
                <a style={S.row} href={PRE} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>⚡</div><div style={S.rCont}><div style={S.rTitle}>Signal (SIG)</div><div style={S.rSub}>Signal Charging · $0.001</div></div><span style={{...S.badge,...S.badgeC}}>LIVE</span></a>
                <a style={S.row} href={`${SSO}/wallet`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>💎</div><div style={S.rCont}><div style={S.rTitle}>Manage Wallet</div><div style={S.rSub}>Balance, transactions</div></div></a>
              </div>
              <div style={S.sec}><div style={S.lbl}>Trust & Identity</div>
                <a style={S.row} href={`${SSO}/hallmark`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>🏛️</div><div style={S.rCont}><div style={S.rTitle}>DW-STAMP Hallmark</div><div style={S.rSub}>Trust verification & tier</div></div><span style={{...S.badge,...S.badgeG}}>✓</span></a>
                <a style={S.row} href={`${SSO}/profile`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>🆔</div><div style={S.rCont}><div style={S.rTitle}>Trust Layer ID</div><div style={S.rSub}>Manage your TLID</div></div></a>
              </div>
              <div style={S.sec}><div style={S.lbl}>Rewards</div>
                <a style={S.row} href={`${SSO}/rewards`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>🎁</div><div style={S.rCont}><div style={S.rTitle}>Ecosystem Rewards</div><div style={S.rSub}>Points, referrals, bonuses</div></div></a>
                <a style={S.row} href={`${SSO}/affiliate`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>🤝</div><div style={S.rCont}><div style={S.rTitle}>Affiliate Program</div><div style={S.rSub}>Earn from referrals</div></div></a>
              </div>
              <div style={S.sec}><div style={S.lbl}>Ecosystem Apps</div><div style={S.grid}>{APPS.map(a=><a key={a.n} style={S.appBadge} href={a.u} target="_blank" rel="noopener noreferrer"><span style={{fontSize:12}}>{a.i}</span>{a.n}</a>)}</div></div>
              <div style={S.sec}><div style={S.lbl}>Settings</div>
                <a style={S.row} href={`${SSO}/settings`} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>⚙️</div><div style={S.rCont}><div style={S.rTitle}>Account Settings</div><div style={S.rSub}>Preferences, security</div></div></a>
                <a style={S.row} href="/settings"><div style={S.rIcon}>🎨</div><div style={S.rCont}><div style={S.rTitle}>App Settings</div><div style={S.rSub}>Theme, display, local</div></div></a>
              </div>
            </>
          ) : (
            <>
              <div style={S.conn}><div style={{fontSize:44,opacity:0.5}}>🛡️</div><div style={{fontSize:17,fontWeight:800,color:'rgba(255,255,255,0.88)'}}>Connect to Trust Layer</div><div style={{fontSize:12,color:'rgba(255,255,255,0.35)',lineHeight:1.55,maxWidth:260}}>Sign in with your Trust Layer ID to access your wallet, hallmark, rewards, and ecosystem apps.</div><a style={S.connBtn} href={`${SSO}/login?redirect=${redir}`} target="_blank" rel="noopener noreferrer">🔗 Connect Account</a></div>
              <div style={S.sec}><div style={S.lbl}>Signal Charging</div><a style={S.row} href={PRE} target="_blank" rel="noopener noreferrer"><div style={S.rIcon}>⚡</div><div style={S.rCont}><div style={S.rTitle}>Start Charging</div><div style={S.rSub}>SIG $0.001 → $0.01 at TGE</div></div><span style={{...S.badge,...S.badgeC}}>10×</span></a></div>
              <div style={S.sec}><div style={S.lbl}>Explore the Ecosystem</div><div style={S.grid}>{APPS.map(a=><a key={a.n} style={S.appBadge} href={a.u} target="_blank" rel="noopener noreferrer"><span style={{fontSize:12}}>{a.i}</span>{a.n}</a>)}</div></div>
            </>
          )}
          <div style={S.ft}><a style={S.ftLink} href={SSO} target="_blank" rel="noopener noreferrer">Trust Layer</a> · Ecosystem Account Hub</div>
        </div>
      )}
    </>
  );
}
