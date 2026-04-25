/* eslint-disable */
function SignIn({ onIn }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'80px 28px 28px', position:'relative' }}>
      <div style={{ position:'absolute', inset:'0 -20px auto -20px', height:300,
        background:'radial-gradient(60% 90% at 50% 0%, rgba(124,111,247,0.20), transparent 70%)' }}/>
      <div style={{ marginTop:30, position:'relative' }}>
        <img src="../../assets/logo-redesigned-mark.svg" style={{ height:84 }}/>
        <h1 style={{ fontFamily:C.fontDisplay, fontWeight:800, fontSize:36, letterSpacing:-0.7, marginTop:18, marginBottom:8, color:C.fg1 }}>
          From a glance<br/>
          <span style={{ background:C.gradPrimary, WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>to a conversation.</span>
        </h1>
        <p style={{ fontSize:15, lineHeight:1.5, color:C.fg2, margin:0, maxWidth:320 }}>
          Sign in to see who's around you tonight.
        </p>
      </div>
      <div style={{ flex:1 }}/>
      <div style={{ display:'flex', flexDirection:'column', gap:10, position:'relative' }}>
        <GhostButton onClick={onIn}>
           Continue with Apple
        </GhostButton>
        <GhostButton onClick={onIn}>
          Continue with Google
        </GhostButton>
        <PrimaryButton onClick={onIn}>Sign in with email</PrimaryButton>
        <div style={{ textAlign:'center', fontSize:12, color:C.fg3, marginTop:8 }}>
          By continuing you agree to the <span style={{ color:C.primaryLight }}>Terms</span> · <span style={{ color:C.primaryLight }}>Privacy</span>
        </div>
      </div>
    </div>
  );
}
window.SignIn = SignIn;
