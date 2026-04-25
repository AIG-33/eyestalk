'use strict';

const W = window;

const Sidebar = ({ active, onChange, venueName }) => {
  const items = [
    { id: 'dashboard',     icon: '📊', label: 'Dashboard',    hint: "Overview of what's happening at your venue" },
    { id: 'live-screen',   icon: '📺', label: 'Live Screen',  hint: 'Real-time stats display for the bar TV' },
    { id: 'analytics',     icon: '📈', label: 'Analytics',    hint: 'Charts and trends over time' },
    { id: 'activities',    icon: '🎯', label: 'Activities',   hint: 'Polls, contests, quests, challenges' },
    { id: 'services',      icon: '🎟️', label: 'Services',     hint: 'Bookable slots priced in tokens' },
    { id: 'announcements', icon: '📢', label: 'Announcements', hint: 'Push messages to checked-in guests' },
    { id: 'loyalty',       icon: '🏆', label: 'Loyalty',      hint: 'Reward streaks and visit frequency' },
    { id: 'moderation',    icon: '🛡️', label: 'Moderation',   hint: 'Review user reports' },
    { id: 'qr-codes',      icon: '📱', label: 'QR Codes',     hint: 'Print codes for instant check-in' },
    { id: 'settings',      icon: '⚙️', label: 'Settings',     hint: 'Edit venue name, geofence, more' },
  ];
  return (
    <aside style={{ width:248, background:'var(--bg-secondary)', borderRight:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', flexShrink:0 }}>
      <div style={{ padding:'22px 22px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <img src="assets/logo-mark.svg" width="28" height="28" alt=""/>
        <h1 style={{ fontSize:20, fontWeight:800, margin:0, color:'var(--fg-1)', letterSpacing:'-0.3px' }}>EyesTalk</h1>
      </div>
      <div style={{ padding:'12px 14px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <button style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:12, background:'transparent', border:'none', color:'inherit', cursor:'pointer', textAlign:'left' }}>
          <span style={{ fontSize:18 }}>🪩</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--fg-1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{venueName}</div>
            <div style={{ fontSize:11, color:'var(--fg-3)' }}>2 venues</div>
          </div>
          <span style={{ color:'var(--fg-3)', fontSize:12 }}>▾</span>
        </button>
      </div>
      <nav style={{ flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        {items.map(it => {
          const on = it.id === active;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} title={it.hint}
              style={{
                display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12,
                background: on ? 'rgba(124,111,247,0.15)' : 'transparent',
                border:'none', cursor:'pointer', textAlign:'left',
                color: on ? 'var(--accent-light)' : 'var(--fg-2)',
                fontSize:13, fontWeight:500,
                boxShadow: on ? '0 0 12px rgba(124,111,247,0.1)' : 'none',
              }}>
              <span style={{ fontSize:18, lineHeight:1 }}>{it.icon}</span>
              <span style={{ flex:1 }}>{it.label}</span>
              {on && <span style={{ width:6, height:6, borderRadius:3, background:'var(--accent)', boxShadow:'var(--glow-primary)' }}/>}
            </button>
          );
        })}
      </nav>
      <div style={{ padding:14, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
        <button style={{ width:'100%', textAlign:'left', padding:'10px 14px', borderRadius:12, background:'transparent', border:'none', color:'#FF4757', fontSize:13, fontWeight:500, cursor:'pointer' }}>
          Sign out
        </button>
      </div>
    </aside>
  );
};

W.WebSidebar = Sidebar;
