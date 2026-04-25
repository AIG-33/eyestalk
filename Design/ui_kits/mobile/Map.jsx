/* eslint-disable */
const VENUES = [
  { id:'sl', name:'Stardust Lounge', type:'🪩', sub:'Nightclub', dist:'0.2 mi', here:47, x:60, y:36, grad:'linear-gradient(135deg,#7C6FF7,#A29BFE)' },
  { id:'kk', name:'Kit & Caboodle', type:'🎤', sub:'Karaoke', dist:'0.4 mi', here:23, x:34, y:54, grad:'linear-gradient(135deg,#FF6B9D,#FFD93D)' },
  { id:'tb', name:'Top Spin Bar', type:'⚽', sub:'Sports bar', dist:'0.6 mi', here:31, x:78, y:62, grad:'linear-gradient(135deg,#00E5A0,#00D4FF)' },
  { id:'rk', name:'Rack Em', type:'🎱', sub:'Billiards', dist:'0.9 mi', here:12, x:18, y:74, grad:'linear-gradient(135deg,#1E1E3F,#2A2A5A)' },
];

function MapMock() {
  // mock map background — abstract roads on dark indigo
  return (
    <svg viewBox="0 0 390 700" preserveAspectRatio="xMidYMid slice"
      style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
      <defs>
        <radialGradient id="amb1" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="rgba(124,111,247,0.25)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
        <radialGradient id="amb2" cx="80%" cy="80%" r="40%">
          <stop offset="0%" stopColor="rgba(255,107,157,0.18)"/><stop offset="100%" stopColor="transparent"/>
        </radialGradient>
      </defs>
      <rect width="390" height="700" fill="#0D0D1A"/>
      <rect width="390" height="700" fill="url(#amb1)"/>
      <rect width="390" height="700" fill="url(#amb2)"/>
      {/* roads */}
      <g stroke="#1E1E3F" strokeWidth="14" fill="none" strokeLinecap="round">
        <path d="M -20 180 L 420 220"/>
        <path d="M -20 360 L 420 320"/>
        <path d="M -20 540 L 420 510"/>
        <path d="M 80 -20 L 120 720"/>
        <path d="M 240 -20 L 220 720"/>
        <path d="M 340 -20 L 360 720"/>
      </g>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none">
        <path d="M -20 180 L 420 220"/><path d="M -20 360 L 420 320"/>
        <path d="M -20 540 L 420 510"/>
        <path d="M 80 -20 L 120 720"/><path d="M 240 -20 L 220 720"/><path d="M 340 -20 L 360 720"/>
      </g>
      {/* parks */}
      <rect x="180" y="240" width="80" height="60" rx="12" fill="rgba(0,229,160,0.08)"/>
      <rect x="20" y="440" width="100" height="60" rx="12" fill="rgba(0,229,160,0.06)"/>
    </svg>
  );
}

function MapScreen({ onOpenVenue, onTabChange }) {
  return (
    <div style={{ flex:1, position:'relative', display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <MapMock/>
        {/* user location */}
        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'rgba(124,111,247,0.18)', position:'absolute', inset:'-20px', animation:'pulse 1.8s ease-in-out infinite' }}/>
          <div style={{ width:18, height:18, borderRadius:'50%', background:C.primary, border:'3px solid #fff', boxShadow: C.glowPrimary }}/>
        </div>
        {/* venue markers */}
        {VENUES.map(v => (
          <button key={v.id} onClick={() => onOpenVenue(v)}
            style={{ position:'absolute', left:`${v.x}%`, top:`${v.y}%`, transform:'translate(-50%,-50%)',
              width:48, height:48, borderRadius:'50%', background: v.grad, color:'#fff', border:0,
              boxShadow:'0 0 16px rgba(124,111,247,0.55), 0 4px 12px rgba(0,0,0,0.5)',
              fontSize:22, cursor:'pointer', display:'grid', placeItems:'center' }}>
            <span>{v.type}</span>
            {v.here > 20 && (
              <span style={{ position:'absolute', top:-4, right:-4, background:C.red, color:'#fff', fontSize:10,
                fontWeight:700, padding:'2px 6px', borderRadius:9999, border:'2px solid '+C.bg }}>{v.here}</span>
            )}
          </button>
        ))}

        {/* Top bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, paddingTop:44 }}>
          <TopBar
            left={<img src="../../assets/logo-redesigned-mark.svg" style={{ width:36, height:36 }}/>}
            title="EyesTalk"
            subtitle="From a glance to a conversation"
            right={
              <button style={{ width:48, height:48, borderRadius:9999, border:0,
                background:C.gradPrimary, color:'#fff', cursor:'pointer', boxShadow:C.glowPrimary, fontSize:18 }}>
                ⌘
              </button>}
          />
        </div>

        {/* QR check-in FAB */}
        <button style={{ position:'absolute', right:20, bottom:140, width:60, height:60, borderRadius:'50%',
          border:0, background:C.gradPrimary, color:'#fff', cursor:'pointer',
          boxShadow:'0 0 25px rgba(124,111,247,0.55), 0 0 50px rgba(124,111,247,0.25)',
          display:'grid', placeItems:'center', fontSize:24 }}>
          ▢
        </button>
        <button style={{ position:'absolute', right:20, bottom:210, width:48, height:48, borderRadius:'50%',
          border:'1px solid rgba(255,255,255,0.08)', background:'rgba(13,13,26,0.7)', backdropFilter:'blur(12px)',
          color:C.fg1, cursor:'pointer', fontSize:18 }}>
          ⌖
        </button>

        {/* Filter chips */}
        <div style={{ position:'absolute', top:140, left:0, right:0, padding:'0 20px', display:'flex', gap:8, overflowX:'auto' }}>
          <Tag bg={C.gradPrimary} color="#fff" style={{padding:'8px 14px',fontSize:12,boxShadow:C.glowPrimary}}>All</Tag>
          <Tag bg="rgba(13,13,26,0.7)" color={C.fg2} style={{padding:'8px 14px',fontSize:12,border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)'}}>🪩 Clubs</Tag>
          <Tag bg="rgba(13,13,26,0.7)" color={C.fg2} style={{padding:'8px 14px',fontSize:12,border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)'}}>🎤 Karaoke</Tag>
          <Tag bg="rgba(13,13,26,0.7)" color={C.fg2} style={{padding:'8px 14px',fontSize:12,border:'1px solid rgba(255,255,255,0.1)',backdropFilter:'blur(12px)'}}>⚽ Sports</Tag>
        </div>

        {/* Bottom carousel preview */}
        <div style={{ position:'absolute', bottom:90, left:0, right:0, padding:'0 16px' }}>
          <div onClick={() => onOpenVenue(VENUES[0])}
            style={{ background:'rgba(255,255,255,0.08)', backdropFilter:'blur(20px)',
              border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:14,
              display:'flex', alignItems:'center', gap:12, cursor:'pointer' }}>
            <div style={{ width:44, height:44, borderRadius:'50%', background:VENUES[0].grad,
              display:'grid', placeItems:'center', fontSize:20 }}>🪩</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:C.fontDisplay, fontWeight:700, fontSize:15, color:C.fg1 }}>Stardust Lounge</div>
              <div style={{ fontSize:11, color:C.fg2, marginTop:2 }}>🪩 Nightclub · 0.2 mi · <span style={{color:C.mint}}>● 47 here now</span></div>
            </div>
            <div style={{ color:C.fg3, fontSize:18 }}>›</div>
          </div>
        </div>
      </div>
      <TabBar active="map" onChange={onTabChange}/>
      <style>{`@keyframes pulse{0%,100%{transform:scale(1);opacity:0.5}50%{transform:scale(1.4);opacity:0.15}}`}</style>
    </div>
  );
}
window.MapScreen = MapScreen; window.VENUES = VENUES;
