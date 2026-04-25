/* eslint-disable */
function Profile({ onTabChange }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <div style={{ flex:1, overflow:'auto' }}>
        {/* header w/ glow */}
        <div style={{ position:'relative', padding:'60px 20px 20px',
          background:'radial-gradient(70% 80% at 50% 0%, rgba(124,111,247,0.22), transparent 70%)' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <Avatar name="Riley" size={92} color={C.gradMatch} ring/>
            <div style={{ fontFamily:C.fontDisplay, fontWeight:800, fontSize:24, color:C.fg1, letterSpacing:-0.4 }}>Riley S.</div>
            <div style={{ fontSize:12, color:C.fg2 }}>@rileyy · 26 · Brooklyn</div>
            <div style={{ display:'flex', gap:6 }}>
              <Tag color={C.mint}>● Online</Tag>
              <Tag color={C.gold}>🪙 1,250</Tag>
              <Tag>3 matches</Tag>
            </div>
          </div>
        </div>

        {/* stats */}
        <div style={{ padding:'4px 20px 16px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { k:'Check-ins', v:'47' },
            { k:'Waves sent', v:'128' },
            { k:'Chats', v:'19' },
          ].map(s => (
            <div key={s.k} style={{ background:C.bg2, border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ fontFamily:'Space Grotesk,Inter', fontWeight:600, fontSize:20, color:C.fg1 }}>{s.v}</div>
              <div style={{ fontSize:10, color:C.fg3, fontWeight:600, textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>{s.k}</div>
            </div>
          ))}
        </div>

        {/* settings */}
        <div style={{ padding:'8px 20px 20px' }}>
          <Eyebrow style={{ marginBottom:8 }}>Account</Eyebrow>
          {[
            { e:'✏️', t:'Edit profile', s:'Photo, bio, display name' },
            { e:'🔔', t:'Notifications', s:'Waves, matches, chat replies' },
            { e:'🪙', t:'Tokens & rewards', s:'1,250 available' },
            { e:'🌐', t:'Language', s:'English (RU available)' },
            { e:'🌙', t:'Theme', s:'Dark · matches your night' },
            { e:'🔐', t:'Privacy', s:'Who can see you here' },
          ].map((row,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 4px',
              borderBottom: i<5 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.bg2, display:'grid', placeItems:'center', fontSize:16 }}>{row.e}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:600, color:C.fg1 }}>{row.t}</div>
                <div style={{ fontSize:11, color:C.fg2, marginTop:2 }}>{row.s}</div>
              </div>
              <div style={{ color:C.fg3 }}>›</div>
            </div>
          ))}

          <button style={{ marginTop:18, width:'100%', height:48, borderRadius:14, background:'rgba(255,71,87,0.08)',
            border:'1px solid rgba(255,71,87,0.25)', color:C.red, fontFamily:C.fontBody, fontWeight:600, fontSize:13, cursor:'pointer' }}>
            Sign out
          </button>
        </div>
      </div>
      <TabBar active="profile" onChange={onTabChange}/>
    </div>
  );
}
window.Profile = Profile;
