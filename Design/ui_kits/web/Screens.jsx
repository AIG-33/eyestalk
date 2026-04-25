'use strict';

const W = window;

// ---------- shared bits ----------
const Card = ({ children, style }) => (
  <div style={{ background:'var(--bg-secondary)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:18, padding:24, ...style }}>{children}</div>
);
const Stat = ({ label, value, hint, hintColor }) => (
  <Card>
    <div style={{ fontSize:13, color:'var(--fg-2)', marginBottom:6 }}>{label}</div>
    <div style={{ fontSize:34, fontWeight:800, color:'var(--fg-1)', letterSpacing:'-0.5px', lineHeight:1 }}>{value}</div>
    {hint && <div style={{ fontSize:11, color: hintColor || 'var(--fg-3)', marginTop:10 }}>{hint}</div>}
  </Card>
);
const Pill = ({ children, color = '#A29BFE', bg = 'rgba(124,111,247,0.12)' }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, fontWeight:600, color, background:bg, padding:'4px 10px', borderRadius:999, letterSpacing:0.2 }}>{children}</span>
);
const Btn = ({ children, primary, onClick, style }) => (
  <button onClick={onClick} style={{
    border:'none', cursor:'pointer', borderRadius:12, padding:'10px 18px', fontWeight:600, fontSize:13,
    color: primary ? '#fff' : 'var(--fg-1)',
    background: primary ? 'linear-gradient(135deg,#7C6FF7,#A29BFE)' : 'rgba(255,255,255,0.06)',
    boxShadow: primary ? 'var(--glow-primary)' : 'none',
    ...style,
  }}>{children}</button>
);

// ---------- DASHBOARD ----------
const Dashboard = () => (
  <Page title="Dashboard" subtitle="Overview of what's happening at your venue right now">
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:16 }}>
      <Stat label="Active Users" value="47" hint="● Live" hintColor="#00E5A0"/>
      <Stat label="Total Check-ins" value="312" hint="Today"/>
      <Stat label="Active Activities" value="3" hint="Running" hintColor="#A29BFE"/>
    </div>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
      {[
        ['📺','Live Screen', 'Real-time stats display for the bar TV'],
        ['📈','Analytics', 'Charts and trends for activity over time'],
        ['🎯','Activities', 'Create polls, tournaments, quests, challenges'],
        ['🛡️','Moderation', 'Review and resolve user reports'],
      ].map(([i,t,h]) => (
        <Card key={t} style={{ cursor:'pointer' }}>
          <h2 style={{ fontSize:16, fontWeight:600, margin:'0 0 6px', color:'var(--fg-1)' }}>{i} {t}</h2>
          <p style={{ fontSize:13, color:'var(--fg-3)', margin:0 }}>{h}</p>
        </Card>
      ))}
    </div>
  </Page>
);

// ---------- LIVE SCREEN ----------
const LiveScreen = () => {
  const [t, setT] = React.useState(new Date());
  React.useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const time = t.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  return (
    <div style={{ minHeight:'100%', padding:48, background:'linear-gradient(180deg,#0D0D1A,#161630)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:48 }}>
        <div>
          <h1 style={{ fontSize:48, fontWeight:800, margin:0, color:'var(--fg-1)', letterSpacing:'-1.2px' }}>Stardust Lounge</h1>
          <p style={{ color:'#A29BFE', fontSize:18, marginTop:6, fontWeight:300 }}>EyesTalk</p>
        </div>
        <div style={{ fontSize:64, fontWeight:300, color:'var(--fg-1)', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{time}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:32 }}>
        <Card style={{ padding:32, background:'rgba(255,255,255,0.04)' }}>
          <p style={{ color:'var(--fg-2)', fontSize:16, margin:'0 0 6px' }}>Active Users</p>
          <p style={{ fontSize:64, fontWeight:900, margin:0, color:'var(--fg-1)' }}>47</p>
        </Card>
        <Card style={{ padding:32, background:'rgba(255,255,255,0.04)' }}>
          <p style={{ color:'var(--fg-2)', fontSize:16, margin:'0 0 6px' }}>Active Activities</p>
          <p style={{ fontSize:64, fontWeight:900, margin:0, color:'var(--fg-1)' }}>3</p>
        </Card>
      </div>
      <h2 style={{ fontSize:22, fontWeight:700, color:'var(--fg-1)', margin:'0 0 16px' }}>Activities</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        {[
          { e:'📊', t:'POLL', title:'Best track of the night?', tl:'12:42', leader:'Disco · 18 votes' },
          { e:'🏆', t:'CONTEST', title:'Best dressed', tl:'01:15', leader:'12 entries' },
          { e:'🎯', t:'CHALLENGE', title:'First to 10 check-ins this week', tl:'2d 4h', leader:'@alex_k · 7' },
          { e:'⚔️', t:'TOURNAMENT', title:'Pool finals · bracket', tl:'00:38', leader:'Round 2 of 3' },
        ].map(a => (
          <Card key={a.title} style={{ background:'rgba(255,255,255,0.04)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:20 }}>{a.e}</span>
                <span style={{ fontSize:11, color:'#A29BFE', fontWeight:700, letterSpacing:1.4 }}>{a.t}</span>
              </div>
              <span style={{ fontSize:11, color:'#FF4757', background:'rgba(255,71,87,0.1)', border:'1px solid rgba(255,71,87,0.2)', padding:'3px 9px', borderRadius:999, fontFamily:'ui-monospace,monospace' }}>{a.tl}</span>
            </div>
            <p style={{ fontSize:18, fontWeight:700, color:'var(--fg-1)', margin:'0 0 4px' }}>{a.title}</p>
            <p style={{ fontSize:12, color:'var(--fg-3)', margin:0 }}>{a.leader}</p>
          </Card>
        ))}
      </div>
      <div style={{ marginTop:40, display:'flex', justifyContent:'center', alignItems:'center', gap:10 }}>
        <span style={{ width:8, height:8, borderRadius:5, background:'#00E5A0', boxShadow:'var(--glow-success)', animation:'etPulse 1.8s ease-in-out infinite' }}/>
        <span style={{ color:'var(--fg-3)', fontSize:13 }}>Live · realtime</span>
      </div>
    </div>
  );
};

// ---------- ACTIVITIES ----------
const Activities = () => (
  <Page title="Activities" subtitle="Create and manage polls, contests, quests, and challenges for your guests"
    action={<Btn primary>+ New activity</Btn>}>
    <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:12 }}>
      {[
        { e:'📊', t:'Best track of the night?',     type:'Poll',       p:24, tk:120, st:'Active', stColor:'#00E5A0' },
        { e:'🏆', t:'Best dressed',                  type:'Contest',    p:12, tk:0,   st:'Active', stColor:'#00E5A0' },
        { e:'🎯', t:'First to 10 check-ins',         type:'Challenge',  p:8,  tk:50,  st:'Active', stColor:'#00E5A0' },
        { e:'⚔️', t:'Pool finals · bracket',         type:'Tournament', p:16, tk:200, st:'Active', stColor:'#00E5A0' },
        { e:'🗺️', t:'Find the hidden flamingo',      type:'Quest',      p:0,  tk:30,  st:'Draft',  stColor:'#A29BFE' },
        { e:'💰', t:'Bid for a free hookah set',    type:'Auction',    p:34, tk:5,   st:'Completed', stColor:'#5A5A78' },
      ].map(a => (
        <div key={a.t} style={{ background:'var(--bg-secondary)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:'16px 20px', display:'grid', gridTemplateColumns:'40px 1fr auto auto 90px', gap:18, alignItems:'center' }}>
          <div style={{ fontSize:22 }}>{a.e}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--fg-1)' }}>{a.t}</div>
            <div style={{ fontSize:11, color:'var(--fg-3)', textTransform:'uppercase', letterSpacing:1.2, marginTop:3 }}>{a.type}</div>
          </div>
          <Pill>{a.p} joined</Pill>
          <Pill color="#FFD23F" bg="rgba(255,210,63,0.12)">🪙 {a.tk}</Pill>
          <Pill color={a.stColor} bg={`${a.stColor}1f`}>● {a.st}</Pill>
        </div>
      ))}
    </div>
  </Page>
);

// ---------- QR CODES ----------
const QrCodes = () => (
  <Page title="QR Codes" subtitle="Generate and print QR codes to place around your venue for easy check-in"
    action={<Btn primary>+ Generate New</Btn>}>
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
      {[
        { code:'EYESTALK-A1B2C3D4-K7M9P', zone:'Main bar',     active:true,  date:'Mar 12, 2025' },
        { code:'EYESTALK-A1B2C3D4-Q3T8N', zone:'VIP lounge',   active:true,  date:'Mar 10, 2025' },
        { code:'EYESTALK-A1B2C3D4-W4X7Z', zone:'Patio',        active:false, date:'Feb 28, 2025' },
      ].map(q => (
        <Card key={q.code}>
          <div style={{ aspectRatio:'1/1', borderRadius:14, background:'#fff', padding:14, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
            {/* fake QR pattern */}
            <svg viewBox="0 0 21 21" width="100%" height="100%" shapeRendering="crispEdges">
              <rect width="21" height="21" fill="#fff"/>
              {Array.from({ length: 21*21 }).map((_,i) => {
                const x = i%21, y = Math.floor(i/21);
                // anchors
                const corner = (cx,cy) => (x>=cx&&x<cx+7&&y>=cy&&y<cy+7) && !(x>=cx+1&&x<cx+6&&y>=cy+1&&y<cy+6) || (x>=cx+2&&x<cx+5&&y>=cy+2&&y<cy+5);
                if (corner(0,0) || corner(14,0) || corner(0,14)) return <rect key={i} x={x} y={y} width="1" height="1" fill="#0D0D1A"/>;
                // pseudo random based on idx + code seed
                const seed = (q.code.charCodeAt(7) + x*7 + y*13) % 10;
                if (seed < 4 && x>=8 && (y<8 || y>12) || seed<4 && y>=8 && x>12) return <rect key={i} x={x} y={y} width="1" height="1" fill="#0D0D1A"/>;
                if ((x*y + q.code.charCodeAt(9)) % 7 === 0 && x>1 && y>1 && x<19 && y<19) return <rect key={i} x={x} y={y} width="1" height="1" fill="#0D0D1A"/>;
                return null;
              })}
            </svg>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
            <div style={{ fontSize:14, fontWeight:600, color:'var(--fg-1)' }}>{q.zone}</div>
            <Pill color={q.active ? '#00E5A0' : '#5A5A78'} bg={q.active ? 'rgba(0,229,160,0.1)' : 'rgba(90,90,120,0.15)'}>● {q.active ? 'Active' : 'Inactive'}</Pill>
          </div>
          <div style={{ fontFamily:'ui-monospace,monospace', fontSize:10, color:'var(--fg-3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:14 }}>{q.code}</div>
          <div style={{ display:'flex', gap:8 }}>
            <Btn style={{ flex:1, padding:'8px 12px', fontSize:12 }}>⬇ Download</Btn>
            <Btn style={{ flex:1, padding:'8px 12px', fontSize:12 }}>🖨 Print</Btn>
          </div>
        </Card>
      ))}
    </div>
  </Page>
);

// ---------- ANALYTICS ----------
const Analytics = () => {
  const data = [12,18,14,22,28,24,32,40,38,52,48,56,62,58,68,74,70,82,78,68,56,44,32,22];
  const max = Math.max(...data);
  return (
    <Page title="Analytics" subtitle="Charts and trends for your venue's activity over time">
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:16 }}>
        <Stat label="Check-ins (7d)" value="412" hint="↑ 18% vs last week" hintColor="#00E5A0"/>
        <Stat label="Avg dwell time" value="58m" hint="↑ 4m vs last week" hintColor="#00E5A0"/>
        <Stat label="Returning %" value="34%" hint="↓ 2% vs last week" hintColor="#FF4757"/>
        <Stat label="Tokens earned" value="1.2k" hint="🪙 by guests today" hintColor="#FFD23F"/>
      </div>
      <Card style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:18 }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:'var(--fg-1)', margin:0 }}>Check-ins Over Time</h3>
          <span style={{ fontSize:11, color:'var(--fg-3)' }}>last 24 hours · hourly</span>
        </div>
        <svg viewBox="0 0 480 160" style={{ width:'100%', height:160 }}>
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C6FF7" stopOpacity="0.6"/>
              <stop offset="100%" stopColor="#7C6FF7" stopOpacity="0"/>
            </linearGradient>
          </defs>
          {/* area */}
          <path d={`M 0 160 ${data.map((v,i) => `L ${i*(480/(data.length-1))} ${160 - (v/max)*140}`).join(' ')} L 480 160 Z`} fill="url(#g1)"/>
          {/* line */}
          <path d={`M 0 ${160-(data[0]/max)*140} ${data.map((v,i) => `L ${i*(480/(data.length-1))} ${160 - (v/max)*140}`).join(' ')}`} stroke="#7C6FF7" strokeWidth="2" fill="none"/>
          {data.map((v,i) => <circle key={i} cx={i*(480/(data.length-1))} cy={160 - (v/max)*140} r="2.5" fill="#A29BFE"/>)}
        </svg>
      </Card>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card>
          <h3 style={{ fontSize:15, fontWeight:600, color:'var(--fg-1)', margin:'0 0 14px' }}>Top Activities</h3>
          {[
            ['📊','Best track of the night?', 248],
            ['🏆','Best dressed',             182],
            ['⚔️','Pool finals',              140],
            ['🎯','First to 10 check-ins',    96],
          ].map(([e,t,n]) => (
            <div key={t} style={{ display:'grid', gridTemplateColumns:'24px 1fr 60px', gap:10, alignItems:'center', padding:'8px 0' }}>
              <span style={{ fontSize:16 }}>{e}</span>
              <div>
                <div style={{ fontSize:13, color:'var(--fg-1)', marginBottom:4 }}>{t}</div>
                <div style={{ height:4, borderRadius:2, background:'rgba(255,255,255,0.06)', overflow:'hidden' }}>
                  <div style={{ width:`${(n/248)*100}%`, height:'100%', background:'linear-gradient(90deg,#7C6FF7,#A29BFE)' }}/>
                </div>
              </div>
              <div style={{ fontSize:12, fontVariantNumeric:'tabular-nums', color:'var(--fg-2)', textAlign:'right' }}>{n}</div>
            </div>
          ))}
        </Card>
        <Card>
          <h3 style={{ fontSize:15, fontWeight:600, color:'var(--fg-1)', margin:'0 0 14px' }}>Peak Hours</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:3, alignItems:'end', height:120 }}>
            {data.map((v,i) => (
              <div key={i} style={{ height:`${(v/max)*100}%`, background: v>56 ? '#7C6FF7' : 'rgba(124,111,247,0.3)', borderRadius:3 }} title={`${i}:00 — ${v}`}/>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--fg-3)', marginTop:8 }}>
            <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
          </div>
        </Card>
      </div>
    </Page>
  );
};

// ---------- shared Page wrapper ----------
const Page = ({ title, subtitle, action, children }) => (
  <div style={{ padding:'32px 36px' }}>
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
      <div>
        <h1 style={{ fontSize:28, fontWeight:800, margin:0, color:'var(--fg-1)', letterSpacing:'-0.6px' }}>{title}</h1>
        {subtitle && <p style={{ fontSize:14, color:'var(--fg-2)', margin:'4px 0 0' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
    {children}
  </div>
);

W.WebDashboard = Dashboard;
W.WebLiveScreen = LiveScreen;
W.WebActivities = Activities;
W.WebQrCodes = QrCodes;
W.WebAnalytics = Analytics;
