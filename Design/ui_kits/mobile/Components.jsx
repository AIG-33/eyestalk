/* eslint-disable */
// Shared atoms for the EyesTalk mobile UI kit.
// Loaded as Babel JSX; exposes components on window.

const C = {
  bg: '#0D0D1A', bg2: '#161630', bg3: '#1E1E3F', bg4: '#2A2A5A',
  fg1: '#E8E8F0', fg2: '#A0A0B8', fg3: '#5A5A78',
  primary: '#7C6FF7', primaryLight: '#A29BFE',
  pink: '#FF6B9D', mint: '#00E5A0', gold: '#FFD93D', red: '#FF4757', cyan: '#00D4FF',
  gradPrimary: 'linear-gradient(135deg,#7C6FF7,#A29BFE)',
  gradMatch:   'linear-gradient(135deg,#FF6B9D,#7C6FF7)',
  gradPremium: 'linear-gradient(135deg,#FFD93D,#FF6B9D)',
  glowPrimary: '0 0 15px rgba(124,111,247,0.4),0 0 30px rgba(124,111,247,0.15)',
  glowMint:    '0 0 12px rgba(0,229,160,0.45)',
  glowPink:    '0 0 12px rgba(255,107,157,0.45)',
  glass: 'rgba(255,255,255,0.08)', glassBorder: 'rgba(255,255,255,0.08)',
  fontDisplay: "'Clash Display',Inter,system-ui,sans-serif",
  fontBody:    "Inter,system-ui,sans-serif",
};

function PrimaryButton({ children, onClick, style, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        height: 56, padding: '0 24px', border: 0, borderRadius: 16,
        background: C.gradPrimary, color: '#fff',
        fontFamily: C.fontBody, fontWeight: 600, fontSize: 15,
        boxShadow: C.glowPrimary, cursor: 'pointer', opacity: disabled ? 0.4 : 1,
        transition: 'opacity 250ms', width: '100%', ...style }}>
      {children}
    </button>
  );
}

function GhostButton({ children, onClick, style }) {
  return (
    <button onClick={onClick}
      style={{ height: 56, padding: '0 24px', border: '1px solid '+C.glassBorder, borderRadius: 16,
        background: C.glass, color: C.fg1, fontFamily: C.fontBody, fontWeight: 600, fontSize: 15,
        cursor: 'pointer', width: '100%', ...style }}>
      {children}
    </button>
  );
}

function Tag({ children, color = C.primaryLight, bg, style }) {
  const tint = bg || `rgba(${color === C.primaryLight ? '124,111,247' : color === C.mint ? '0,229,160' : color === C.pink ? '255,107,157' : color === C.gold ? '255,217,61' : '124,111,247'},0.15)`;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:9999,
      background: tint, color, fontSize: 11, fontWeight: 600, ...style }}>{children}</span>
  );
}

function Avatar({ name, size = 44, color = C.gradPrimary, online, ring }) {
  const inner = (
    <div style={{ width: size, height: size, borderRadius:'50%', background: color,
      display:'grid', placeItems:'center', color:'#fff', fontWeight:700,
      fontFamily:C.fontDisplay, fontSize: size*0.42, border: ring ? '2px solid '+C.bg : 0 }}>
      {name?.[0] || '?'}
    </div>
  );
  return (
    <div style={{ position:'relative', width: size, height: size, padding: ring ? 2 : 0,
      borderRadius:'50%', background: ring ? C.gradPrimary : 'transparent', boxSizing:'content-box' }}>
      {inner}
      {online && (
        <div style={{ position:'absolute', right:-1, bottom:-1, width: Math.max(10,size*0.26), height: Math.max(10,size*0.26),
          borderRadius:'50%', background: C.mint, border: '2px solid '+C.bg, boxShadow: C.glowMint }} />
      )}
    </div>
  );
}

function Eyebrow({ children, style }) {
  return <div style={{ fontSize:10, fontWeight:600, letterSpacing:1.5, textTransform:'uppercase', color: C.fg3, ...style }}>{children}</div>;
}

function StatusDot({ color = C.mint, size = 8 }) {
  return <span style={{ display:'inline-block', width:size, height:size, borderRadius:'50%', background:color,
    boxShadow:`0 0 8px ${color}`}}/>;
}

function TabBar({ active = 'map', onChange }) {
  const tabs = [
    { id:'map', icon:'🗺️', label:'Map' },
    { id:'chats', icon:'💬', label:'Chats' },
    { id:'tokens', icon:'🪙', label:'Tokens' },
    { id:'profile', icon:'👤', label:'Profile' },
  ];
  return (
    <div style={{ height:74, padding:'10px 16px 14px', background: C.bg, borderTop:'1px solid rgba(255,255,255,0.06)',
      display:'flex', alignItems:'center', justifyContent:'space-around' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange?.(t.id)}
          style={{ background:'none', border:0, cursor:'pointer', display:'flex', flexDirection:'column',
            alignItems:'center', gap:4, color: active === t.id ? C.primaryLight : C.fg3,
            fontFamily: C.fontBody, position:'relative' }}>
          <span style={{ fontSize: active === t.id ? 26 : 22, lineHeight:1 }}>{t.icon}</span>
          <span style={{ fontSize:11, fontWeight: active === t.id ? 600 : 500 }}>{t.label}</span>
          {active === t.id && <div style={{ position:'absolute', bottom:-4, width:4, height:4, borderRadius:'50%',
            background: C.primaryLight, boxShadow: '0 0 8px '+C.primaryLight }}/>}
        </button>
      ))}
    </div>
  );
}

function TopBar({ left, right, title, subtitle }) {
  return (
    <div style={{ position:'relative', padding:'52px 20px 12px', display:'flex', alignItems:'center', gap:12,
      background:'linear-gradient(180deg,rgba(13,13,26,0.95) 0%,rgba(13,13,26,0.6) 70%,transparent 100%)',
      backdropFilter:'blur(8px)' }}>
      {left}
      <div style={{ flex:1, minWidth:0 }}>
        {title && <div style={{ fontFamily:C.fontDisplay, fontWeight:700, fontSize:18, color:C.fg1, letterSpacing:-0.2 }}>{title}</div>}
        {subtitle && <div style={{ fontSize:11, color:C.fg2, marginTop:2 }}>{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

function StatusBar() {
  return (
    <div style={{ position:'absolute', top:0, left:0, right:0, height:44, padding:'14px 22px 0',
      display:'flex', justifyContent:'space-between', fontFamily:C.fontBody, fontSize:14, fontWeight:600, color:C.fg1, zIndex: 10 }}>
      <span>9:41</span>
      <span style={{ display:'inline-flex', gap:6, alignItems:'center', fontSize:12 }}>
        <span>📶</span><span>📡</span><span>🔋</span>
      </span>
    </div>
  );
}

Object.assign(window, { C, PrimaryButton, GhostButton, Tag, Avatar, Eyebrow, StatusDot, TabBar, TopBar, StatusBar });
