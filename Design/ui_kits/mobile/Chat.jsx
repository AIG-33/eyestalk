/* eslint-disable */
function Chat({ peer, onBack }) {
  const [msgs, setMsgs] = React.useState([
    { from:'them', t:'Hey! I see you waved 👋' },
    { from:'me',   t:'Yeah — first time at Stardust?' },
    { from:'them', t:'Second. The DJ kills it tonight 🎧' },
  ]);
  const [draft, setDraft] = React.useState('');
  const send = () => { if(draft.trim()){ setMsgs(m => [...m, {from:'me', t:draft}]); setDraft(''); } };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:C.bg }}>
      {/* header */}
      <div style={{ padding:'48px 16px 14px', display:'flex', alignItems:'center', gap:12,
        borderBottom:'1px solid rgba(255,255,255,0.06)', background:C.bg2 }}>
        <button onClick={onBack} style={{ background:'none', border:0, color:C.fg1, fontSize:22, cursor:'pointer' }}>‹</button>
        <Avatar name={peer?.n||'M'} size={40} color={peer?.color||C.gradMatch} online={true}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:15, color:C.fg1 }}>{peer?.n||'Maya'}</div>
          <div style={{ fontSize:11, color:C.mint }}>● Online · at Stardust Lounge</div>
        </div>
        <div style={{ padding:'6px 10px', borderRadius:9999, background:'rgba(255,217,61,0.14)', color:C.gold, fontSize:11, fontWeight:600 }}>
          ⏱ 4:32
        </div>
      </div>

      {/* messages */}
      <div style={{ flex:1, overflow:'auto', padding:'16px 16px 100px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ alignSelf:'center', fontSize:10, color:C.fg3, fontWeight:600, letterSpacing:1, textTransform:'uppercase', padding:'4px 12px',
          background:C.glass, borderRadius:9999 }}>5-minute timed chat</div>
        {msgs.map((m,i) => (
          <div key={i} style={{
            alignSelf: m.from==='me' ? 'flex-end' : 'flex-start',
            maxWidth: '78%', padding:'10px 14px', fontSize:14, lineHeight:1.4,
            borderRadius: m.from==='me' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: m.from==='me' ? C.gradPrimary : C.glass,
            color: m.from==='me' ? '#fff' : C.fg1,
            border: m.from==='me' ? 0 : '1px solid rgba(255,255,255,0.06)',
            boxShadow: m.from==='me' ? '0 4px 12px rgba(124,111,247,0.25)' : 'none'
          }}>{m.t}</div>
        ))}
      </div>

      {/* composer */}
      <div style={{ padding:'10px 14px 24px', borderTop:'1px solid rgba(255,255,255,0.06)', background:C.bg,
        display:'flex', gap:8, alignItems:'center' }}>
        <button style={{ width:40, height:40, borderRadius:'50%', border:0, background:C.glass, color:C.fg1, cursor:'pointer', fontSize:18 }}>＋</button>
        <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
          placeholder="Say hi…" style={{
            flex:1, height:42, padding:'0 14px', borderRadius:9999, border:'1px solid '+C.glassBorder,
            background:C.glass, color:C.fg1, fontFamily:C.fontBody, fontSize:14, outline:'none' }}/>
        <button onClick={send} style={{ width:42, height:42, borderRadius:'50%', border:0,
          background:C.gradPrimary, color:'#fff', cursor:'pointer', fontSize:18, boxShadow:C.glowPrimary }}>→</button>
      </div>
    </div>
  );
}
window.Chat = Chat;
