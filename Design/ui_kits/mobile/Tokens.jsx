/* eslint-disable */
function Tokens({ onTabChange }) {
  const txs = [
    { e:'📍', t:'Checked in · Stardust Lounge', d:'Tonight, 11:12 PM', amt:'+50', pos:true },
    { e:'🗳️', t:'Voted in tonight\'s poll', d:'Tonight, 10:48 PM', amt:'+10', pos:true },
    { e:'⚔️', t:'Joined karaoke tournament', d:'Yesterday, 9:30 PM', amt:'-100', pos:false },
    { e:'🎯', t:'Daily check-in streak · 7d', d:'Yesterday, 8:15 PM', amt:'+25', pos:true },
    { e:'🏆', t:'Won billiards challenge', d:'Tue, 11:02 PM', amt:'+200', pos:true },
  ];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      <div style={{ flex:1, overflow:'auto', padding:'56px 20px 20px' }}>
        <Eyebrow>Your balance</Eyebrow>
        <div style={{ marginTop:6, padding:'22px 20px', borderRadius:24, position:'relative', overflow:'hidden',
          background:'linear-gradient(135deg, rgba(255,217,61,0.18), rgba(255,107,157,0.10) 60%, rgba(124,111,247,0.05))',
          border:'1px solid rgba(255,217,61,0.25)' }}>
          <div style={{ position:'absolute', right:-30, top:-30, width:160, height:160, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(255,217,61,0.35), transparent 70%)' }}/>
          <div style={{ display:'flex', alignItems:'baseline', gap:10, position:'relative' }}>
            <span style={{ fontSize:34 }}>🪙</span>
            <div style={{ fontFamily:'Space Grotesk,Inter', fontWeight:600, fontSize:48, color:C.gold, letterSpacing:-1 }}>1,250</div>
          </div>
          <div style={{ fontSize:12, color:C.fg2, marginTop:4 }}>Earn more by checking in, voting, and joining activities at venues.</div>
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button style={{ flex:1, height:44, borderRadius:12, border:0, background:C.gradPrimary, color:'#fff',
              fontWeight:600, fontFamily:C.fontBody, fontSize:13, cursor:'pointer', boxShadow:C.glowPrimary }}>Top up</button>
            <button style={{ flex:1, height:44, borderRadius:12, border:'1px solid '+C.glassBorder, background:C.glass, color:C.fg1,
              fontWeight:600, fontFamily:C.fontBody, fontSize:13, cursor:'pointer' }}>Send to friend</button>
          </div>
        </div>

        <Eyebrow style={{ marginTop:24, marginBottom:8 }}>Recent activity</Eyebrow>
        {txs.map((tx,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 4px',
            borderBottom: i<txs.length-1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ width:38, height:38, borderRadius:12, background:C.bg2, display:'grid', placeItems:'center', fontSize:16 }}>{tx.e}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:600, color:C.fg1 }}>{tx.t}</div>
              <div style={{ fontSize:11, color:C.fg3, marginTop:2 }}>{tx.d}</div>
            </div>
            <div style={{ fontFamily:'Space Grotesk,Inter', fontWeight:600, fontSize:14,
              color: tx.pos ? C.mint : C.red }}>{tx.amt}</div>
          </div>
        ))}
      </div>
      <TabBar active="tokens" onChange={onTabChange}/>
    </div>
  );
}
window.Tokens = Tokens;
