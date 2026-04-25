/* eslint-disable */
function Onboarding({ onDone }) {
  const slides = [
    { e:'📍', t:'Find venues nearby', s:'See what\'s lit around you in real time. Bars, clubs, karaoke, hookah — all on one map.' },
    { e:'👀', t:'Check in to the moment', s:'Scan the QR at the door and join the venue\'s live presence. You\'re only here while you\'re here.' },
    { e:'💬', t:'Start a conversation', s:'Send a wave. Drop into 5-minute chats. Match if it\'s a vibe — your venue chats vanish in 24 hours.' },
    { e:'🎯', t:'Have fun, on you', s:'Earn 🪙 tokens by showing up. Spend them on activities, polls and contests at your spot.' },
  ];
  const [i, setI] = React.useState(0);
  const cur = slides[i];
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'80px 28px 28px', position:'relative' }}>
      <div style={{ position:'absolute', inset:'0 -20px auto -20px', height:280,
        background: 'radial-gradient(60% 80% at 50% 0%, rgba(124,111,247,0.18), transparent 70%)' }}/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:24, position:'relative' }}>
        <div style={{ width:140, height:140, borderRadius:'50%', display:'grid', placeItems:'center',
          fontSize: 76, background: 'rgba(124,111,247,0.12)', border:'1px solid rgba(124,111,247,0.25)',
          boxShadow: '0 10px 40px rgba(124,111,247,0.3) inset, 0 0 50px rgba(124,111,247,0.25)' }}>{cur.e}</div>
        <h1 style={{ fontFamily:C.fontDisplay, fontWeight:800, fontSize:30, letterSpacing:-0.6, color:C.fg1, textAlign:'center', margin:0 }}>{cur.t}</h1>
        <p style={{ fontSize:15, lineHeight:1.5, color:C.fg2, textAlign:'center', margin:0, maxWidth:300 }}>{cur.s}</p>
      </div>
      <div style={{ display:'flex', justifyContent:'center', gap:6, marginBottom:18 }}>
        {slides.map((_, j) => (
          <div key={j} style={{ width: i===j ? 24 : 6, height:6, borderRadius:9999,
            background: i===j ? C.gradPrimary : 'rgba(255,255,255,0.15)', transition:'all 250ms' }}/>
        ))}
      </div>
      <PrimaryButton onClick={() => i < slides.length-1 ? setI(i+1) : onDone?.()}>
        {i < slides.length-1 ? 'Continue' : "Let's go!"}
      </PrimaryButton>
      {i < slides.length-1 && (
        <button onClick={onDone} style={{ background:'none', border:0, color:C.fg2, marginTop:10, padding:12,
          fontFamily:C.fontBody, fontSize:13, cursor:'pointer' }}>Skip for now</button>
      )}
    </div>
  );
}
window.Onboarding = Onboarding;
