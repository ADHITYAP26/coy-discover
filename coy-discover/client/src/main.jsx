import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heart, X, Users, Compass, Sparkles, MapPin, RotateCcw } from 'lucide-react';
import './style.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
function App() {
  const [tab, setTab] = useState('discover');
  const [feed, setFeed] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [match, setMatch] = useState(null);
  const [anim, setAnim] = useState('');
  const [drag, setDrag] = useState({x:0,y:0});
  const pointer = useRef(null);
  const card = feed[0];

  async function load() {
    setLoading(true); setError('');
    try {
      const [f,m] = await Promise.all([fetch(`${API}/feed`), fetch(`${API}/matches`)]);
      if (!f.ok || !m.ok) throw new Error('Could not load Discover. Is the API running?');
      setFeed(await f.json()); setMatches(await m.json());
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function swipe(action) {
    if (!card || anim) return;
    setAnim(action === 'like' ? 'fly-right' : 'fly-left');
    try {
      const response = await fetch(`${API}/swipe`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profileId:card.id,action})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Swipe failed');
      window.setTimeout(() => {
        setFeed(current => current.filter(p => p.id !== card.id));
        setAnim(''); setDrag({x:0,y:0});
        if (result.match) { setMatch(result.profile); setMatches(current => [result.profile,...current]); }
      }, 230);
    } catch (e) { setError(e.message); setAnim(''); }
  }
  function pointerDown(e) { if (anim) return; pointer.current = {x:e.clientX,y:e.clientY}; e.currentTarget.setPointerCapture(e.pointerId); }
  function pointerMove(e) { if (!pointer.current) return; setDrag({x:e.clientX-pointer.current.x,y:e.clientY-pointer.current.y}); }
  function pointerUp() {
    if (!pointer.current) return;
    const dx=drag.x; pointer.current=null;
    if (dx > 90) swipe('like'); else if (dx < -90) swipe('pass'); else setDrag({x:0,y:0});
  }

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Heart size={17} fill="currentColor"/></span> coy</a><div className="top-note"><span className="live-dot"/> A little more connection</div><button className="avatar" aria-label="Profile">A</button></header>
    <main>
      <div className="intro"><div className="eyebrow"><Sparkles size={14}/> GOOD CONNECTIONS START HERE</div><h1>Meet someone <em>unexpected.</em></h1><p>Discover people nearby who share your kind of spark.</p></div>
      <nav className="tabs"><button className={tab==='home'?'active':''} onClick={()=>setTab('home')}><span><Heart size={17}/></span> Home</button><button className={tab==='discover'?'active':''} onClick={()=>setTab('discover')}><span><Compass size={17}/></span> Discover</button><button className={tab==='matches'?'active':''} onClick={()=>setTab('matches')}><span><Users size={17}/></span> Matches <b>{matches.length}</b></button></nav>
      {tab==='home' && <section className="blank-home"/>}
      {tab==='discover' && <section className="discover-area">
        {loading ? <div className="empty"><div className="loader"/><h2>Finding your people…</h2></div> : error ? <div className="empty"><h2>Something went wrong</h2><p>{error}</p><button className="primary" onClick={load}>Try again</button></div> : card ? <>
          <div className="counter">YOUR DISCOVER QUEUE <span>{feed.length} LEFT</span></div>
          <div className="card-stage">
            <div className={`profile-card ${anim}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{pointer.current=null;setDrag({x:0,y:0})}} style={{'--drag-x':`${drag.x}px`,'--drag-y':`${drag.y}px`,'--rotation':`${drag.x/22}deg`}}>
              <img className="profile-photo" src={card.photo} alt={`${card.name}'s profile`} draggable="false" onError={e=>{e.currentTarget.src='https://placehold.co/600x800/f4e4df/755b57?text=Profile'}}/>
              <div className="photo-shade"/><div className="swipe-label like-label">LIKE</div><div className="swipe-label pass-label">PASS</div>
              <div className="profile-info"><div className="name-line"><h2>{card.name}, {card.age}</h2><span className="verified">✓</span></div><div className="location"><MapPin size={14}/>{card.city}</div><p>{card.bio}</p><div className="interests">{card.interests.map(x=><span key={x}>{x}</span>)}</div></div>
            </div>
          </div>
          <div className="swipe-actions"><button className="action pass" onClick={()=>swipe('pass')} aria-label="Pass"><X size={27}/></button><button className="action like" onClick={()=>swipe('like')} aria-label="Like"><Heart size={25} fill="currentColor"/></button></div>
          <p className="hint"> <span>←</span> Pass <i>·</i> Drag or tap <i>·</i> Like <span>→</span></p>
        </> : <div className="empty"><div className="empty-icon"><Heart size={30}/></div><h2>You're all caught up</h2><p>There are no more profiles to discover right now. Check back later for new faces.</p><button className="secondary" onClick={load}><RotateCcw size={16}/> Refresh feed</button></div>}
      </section>}
      {tab==='matches' && <section className="matches-area"><div className="section-heading"><div><div className="eyebrow">THE FEELING IS MUTUAL</div><h2>Your matches</h2></div><span className="match-count">{matches.length} total</span></div>{matches.length ? <div className="match-grid">{matches.map(m=><article className="match-card" key={m.id}><img src={m.photo} alt=""/><div><h3>{m.name}, {m.age}</h3><p><MapPin size={13}/>{m.city}</p><div className="match-tag"><Heart size={12} fill="currentColor"/> It's mutual</div></div></article>)}</div> : <div className="empty match-empty"><div className="empty-icon"><Heart size={30}/></div><h2>Your story starts with a spark</h2><p>When you and someone else like each other, your mutual matches will appear here.</p><button className="primary" onClick={()=>setTab('discover')}>Explore Discover</button></div>}</section>}
    </main>
    <footer>Made for mutual moments <span>♥</span><small>Demo experience · 18+ only</small></footer>
    {match && <div className="modal-backdrop"><div className="match-modal"><button className="modal-close" onClick={()=>setMatch(null)}>×</button><div className="confetti">✦　♥　✦</div><div className="eyebrow">THE FEELING IS MUTUAL</div><h2>It's a <em>match!</em></h2><p>You and {match.name} liked each other.</p><div className="match-avatars"><img src={match.photo} alt=""/><div><Heart fill="currentColor" size={22}/></div><div className="you-avatar">A</div></div><button className="primary wide" onClick={()=>{setMatch(null);setTab('matches')}}>See your matches</button><button className="text-button" onClick={()=>setMatch(null)}>Keep discovering</button></div></div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
