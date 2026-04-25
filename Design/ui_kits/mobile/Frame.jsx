/* eslint-disable */
function Frame({ children, paused }) {
  return (
    <div style={{
      position:'relative', width: 390, height: 844, borderRadius: 56,
      background: '#000', padding: 12, boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 2px #1a1a2e',
      overflow:'hidden'
    }}>
      <div style={{ position:'relative', width:'100%', height:'100%', borderRadius: 44, overflow:'hidden',
        background: C.bg, display:'flex', flexDirection:'column' }}>
        {/* notch */}
        <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)',
          width:120, height:32, background:'#000', borderRadius:9999, zIndex:20 }}/>
        <StatusBar/>
        {children}
      </div>
    </div>
  );
}
window.Frame = Frame;
