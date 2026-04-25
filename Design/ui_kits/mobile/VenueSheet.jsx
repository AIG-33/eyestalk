/* eslint-disable */
function VenueSheet({ venue, onClose, onChat, onCheckin }) {
  if (!venue) return null;
  const people = [
    { n:'Maya', age:24, color:'linear-gradient(135deg,#FF6B9D,#7C6FF7)', online:true },
    { n:'Alex', age:27, color:'linear-gradient(135deg,#7C6FF7,#A29BFE)', online:true },
    { n:'Jordan', age:23, color:'linear-gradient(135deg,#FFD93D,#FF6B9D)', online:true },
    { n:'Riley', age:29, color:'linear-gradient(135deg,#00E5A0,#00D4FF)' },
    { n:'Sam', age:25, color:'linear-gradient(135deg,#FF6B9D,#FFD93D)' },
    { n:'Chris', age:26, color:'linear-gradient(135deg,#7C6FF7,#FF6B9D)' },
  ];
  return (
    <div style={{ position:'absolute', inset:0, zIndex:30, background:'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        position:'absolute', left:0, right:0, bottom:0, top:80,
        background: C.bg, borderRadius:'24px 24px 0 0', overflow:'hidden',
        display:'flex', flexDirection:'column',
        animation:'sheet 280ms cubic-bezier(0,0,0.2,1)' }}>
        {/* handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0' }}>
          <div style={{ width:40, height:4, borderRadius:9999, background:C.bg4 }}/>
        </div>
        {/* header w/ ambient gradient */}
        <div style={{ position:'relative', padding:'10px 20px 18px',
          background:'radial-gradient(80% 100% at 30% 0%, rgba(124,111,247,0.25), transparent 60%), radial-gradient(70% 70% at 90% 0%, rgba(255,107,157,0.18), transparent 60%)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:64, height:64, borderRadius:18, background:venue.grad,
              display:'grid', placeItems:'center', fontSize:32, boxShadow:C.glowPrimary }}>{venue.type}</div>
            <div style={{ flex:1 }}>
              <h1 style={{ fontFamily:C.fontDisplay, fontWeight:800, fontSize:24, letterSpacing:-0.5, color:C.fg1, margin:0 }}>{venue.name}</h1>
              <div style={{ fontSize:12, color:C.fg2, marginTop:4, display:'flex', gap:8, alignItems:'center' }}>
                <Tag>{venue.sub}</Tag>
                <span>· {venue.dist}</span>
              </div>
            </div>
            <button onClick={onClose} style={{ width:36, height:36, borderRadius:'50%', border:0,
              background:C.glass, color:C.fg2, cursor:'pointer', fontSize:16 }}>✕</button>
          </div>

          <div style={{ display:'flex', gap:10, marginTop:14 }}>
            <div style={{ flex:1, padding:'10px 12px', background:C.glass, borderRadius:12, border:'1px solid '+C.glassBorder }}>
              <div style={{ fontSize:10, color:C.fg3, fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>Here now</div>
              <div style={{ fontFamily:'Space Grotesk,Inter', fontWeight:600, fontSize:22, color:C.mint, marginTop:2 }}>● {venue.here}</div>
            </div>
            <div style={{ flex:1, padding:'10px 12px', background:C.glass, borderRadius:12, border:'1px solid '+C.glassBorder }}>
              <div style={{ fontSize:10, color:C.fg3, fontWeight:600, textTransform:'uppercase', letterSpacing:1.5 }}>Vibe tonight</div>
              <div style={{ fontFamily:C.fontDisplay, fontWeight:700, fontSize:18, color:C.fg1, marginTop:2 }}>🔥 Lit</div>
            </div>
          </div>
        </div>

        {/* check in */}
        <div style={{ padding:'8px 20px 16px' }}>
          <PrimaryButton onClick={onCheckin}>📍 Check in here</PrimaryButton>
          <div style={{ fontSize:11, color:C.fg3, textAlign:'center', marginTop:8 }}>
            Scan the QR at the door — you'll appear to others here.
          </div>
        </div>

        {/* people */}
        <div style={{ flex:1, overflow:'auto', padding:'8px 20px 20px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Eyebrow>Who's here · {venue.here}</Eyebrow>
            <span style={{ fontSize:12, color:C.primaryLight, fontWeight:600 }}>See all</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {people.map(p => (
              <div key={p.n} onClick={() => onChat(p)}
                style={{ background:C.bg2, border:'1px solid rgba(255,255,255,0.06)', borderRadius:18,
                  padding:14, cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <Avatar name={p.n} size={44} color={p.color} online={p.online}/>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:C.fg1 }}>{p.n}</div>
                    <div style={{ fontSize:11, color:C.fg2 }}>{p.age} · {p.online ? 'Open to chat' : 'Maybe later'}</div>
                  </div>
                </div>
                <button style={{ marginTop:10, width:'100%', height:36, borderRadius:10, border:0,
                  background: p.online ? C.gradPrimary : C.glass, color: p.online ? '#fff' : C.fg2,
                  fontFamily:C.fontBody, fontWeight:600, fontSize:12, cursor:'pointer',
                  boxShadow: p.online ? C.glowPrimary : 'none' }}>
                  👋 Wave
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes sheet{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
}
window.VenueSheet = VenueSheet;
