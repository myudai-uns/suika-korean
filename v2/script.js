/* ============================================================
 * 한글수박 v2 — single-file game logic
 * ============================================================ */

/* ========== Word data ========== */
const PASTEL = ['#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF','#D7BAFF','#FFB3E6','#FFCC99','#A8E6CF','#FFD93D','#FF6B9D'];
const RADII  = [22,28,35,42,50,58,68,78,90,104,120];

const CHAIN_NORMAL = [
  {word:'네',                meaning:'はい',                roma:'ne'},
  {word:'안녕',              meaning:'やあ',                roma:'annyeong'},
  {word:'고마워',            meaning:'ありがとう',           roma:'gomawo'},
  {word:'사랑해',            meaning:'愛してる',             roma:'saranghae'},
  {word:'안녕하세요',        meaning:'こんにちは',           roma:'annyeonghaseyo'},
  {word:'감사합니다',        meaning:'ありがとうございます',  roma:'gamsahamnida'},
  {word:'사랑합니다',        meaning:'愛しています',         roma:'saranghamnida'},
  {word:'만나서 반가워요',   meaning:'お会いできて嬉しい',    roma:'mannaseo bangawoyo'},
  {word:'한국 좋아해요',     meaning:'韓国が好き',           roma:'hanguk joahaeyo'},
  {word:'한글 마스터 🇰🇷',  meaning:'ハングルマスター',      roma:'hangeul master'},
  {word:'한국 LEGEND 🌏',    meaning:'韓国レジェンド',       roma:'hanguk legend'},
];
const CHAIN_KPOP = [
  {word:'오빠',         meaning:'お兄さん(年上男性)', roma:'oppa'},
  {word:'언니',         meaning:'お姉さん(年上女性)', roma:'eonni'},
  {word:'대박',         meaning:'すごい!',           roma:'daebak'},
  {word:'화이팅',       meaning:'ファイト!',         roma:'hwaiting'},
  {word:'심쿵',         meaning:'胸キュン',           roma:'simkung'},
  {word:'덕질',         meaning:'推し活',             roma:'deokjil'},
  {word:'최애',         meaning:'最推し',             roma:'choeae'},
  {word:'무대 짱',      meaning:'ステージ最高',        roma:'mudae jjang'},
  {word:'평생 응원해',  meaning:'一生応援する',        roma:'pyeongsaeng eungwonhae'},
  {word:'아이돌 ⭐',    meaning:'アイドル',            roma:'aidol'},
  {word:'K-POP LEGEND 💜',meaning:'K-POPレジェンド',  roma:'k-pop legend'},
];
const CHAIN_DAILY = [
  {word:'좋아',                   meaning:'いいね',          roma:'joa'},
  {word:'몰라',                   meaning:'知らない',         roma:'molla'},
  {word:'배고파',                 meaning:'お腹すいた',       roma:'baegopa'},
  {word:'맛있어',                 meaning:'おいしい',         roma:'masisseo'},
  {word:'재미있어요',             meaning:'面白いです',       roma:'jaemiisseoyo'},
  {word:'행복해요',               meaning:'幸せです',         roma:'haengbokhaeyo'},
  {word:'사랑스러워요',           meaning:'愛らしいです',     roma:'sarangseureowoyo'},
  {word:'한국에 가고 싶어요',     meaning:'韓国に行きたい',    roma:'hanguge gago sipeoyo'},
  {word:'한국어 잘 해요',         meaning:'韓国語上手です',   roma:'hangugeo jal haeyo'},
  {word:'데일리 클리어 ⭐',       meaning:'デイリークリア',   roma:'daily clear'},
  {word:'한국 ULTIMATE 👑',       meaning:'韓国アルティメット',roma:'hanguk ultimate'},
];
const CHAINS = { normal:CHAIN_NORMAL, kpop:CHAIN_KPOP, daily:CHAIN_DAILY, review:CHAIN_NORMAL };
const SPAWN_LEVELS = [1,1,1,2,2,2,3,3,4];

function dailySeed(){const d=new Date();return (d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate())>>>0;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

/* ========== Physics ========== */
let _bodyId = 1;
class Body {
  constructor(o){
    this.id=_bodyId++; this.x=o.x; this.y=o.y; this.r=o.radius;
    this.vx=o.vx||0; this.vy=o.vy||0;
    this.angle=(Math.random()-0.5)*0.4; this.angularVel=0;
    this.level=o.level||1; this.data=o.data||{};
    this.mass=Math.PI*this.r*this.r*0.001;
    this.invMass=o.static?0:1/this.mass;
    this.static=!!o.static; this.frozen=!!o.frozen;
    this.bornAt=performance.now();
    this.markedForRemoval=false;
    this.aboveCeilingAt=0; this.lastMergeFlash=0; this.scale=0;
  }
}
class World {
  constructor(o){
    this.w=o.width; this.h=o.height;
    this.gravity=o.gravity??0.55;
    this.airDamp=0.9985; this.angularDamp=0.92; this.angularMax=0.18;
    this.restitution=0.18; this.friction=0.4;
    this.ceiling=o.ceiling??80;
    this.bodies=[]; this.solverIter=4;
    this.events={merge:[],ceiling:[]};
  }
  on(e,f){this.events[e].push(f)}
  emit(e,...a){for(const f of this.events[e])f(...a)}
  add(b){this.bodies.push(b);return b}
  step(dt=1){
    const B=this.bodies;
    for(const b of B){
      if(b.frozen||b.static) continue;
      b.vy+=this.gravity*dt; b.vx*=this.airDamp; b.vy*=this.airDamp;
      b.angularVel*=this.angularDamp;
      if(b.angularVel> this.angularMax) b.angularVel= this.angularMax;
      if(b.angularVel<-this.angularMax) b.angularVel=-this.angularMax;
      b.x+=b.vx*dt; b.y+=b.vy*dt; b.angle+=b.angularVel*dt;
      if(b.scale<1) b.scale=Math.min(1,b.scale+0.12);
    }
    for(let it=0;it<this.solverIter;it++){
      for(const b of B){
        if(b.frozen) continue;
        if(b.x-b.r<0){b.x=b.r;if(b.vx<0)b.vx=-b.vx*this.restitution}
        if(b.x+b.r>this.w){b.x=this.w-b.r;if(b.vx>0)b.vx=-b.vx*this.restitution}
        if(b.y+b.r>this.h){
          b.y=this.h-b.r;
          if(b.vy>0){b.vy=-b.vy*this.restitution;b.vx*=0.85;b.angularVel+=(Math.random()-0.5)*0.02}
        }
      }
      for(let i=0;i<B.length;i++){
        const a=B[i]; if(a.frozen) continue;
        for(let j=i+1;j<B.length;j++){
          const b=B[j]; if(b.frozen) continue;
          const dx=b.x-a.x, dy=b.y-a.y;
          const d2=dx*dx+dy*dy, md=a.r+b.r;
          if(d2>=md*md) continue;
          const dist=Math.sqrt(d2)||0.0001;
          const nx=dx/dist, ny=dy/dist;
          const overlap=md-dist;
          if(it===this.solverIter-1 && a.level===b.level
             && !a.markedForRemoval && !b.markedForRemoval
             && a.scale>0.7 && b.scale>0.7){
            this.emit('merge',a,b,nx,ny);
            if(a.markedForRemoval) break;
            continue;
          }
          const ti=a.invMass+b.invMass||1;
          a.x-=nx*(overlap*(a.invMass/ti)); a.y-=ny*(overlap*(a.invMass/ti));
          b.x+=nx*(overlap*(b.invMass/ti)); b.y+=ny*(overlap*(b.invMass/ti));
          const rvx=b.vx-a.vx, rvy=b.vy-a.vy;
          const vn=rvx*nx+rvy*ny;
          if(vn>0) continue;
          const e=this.restitution;
          const ji=-(1+e)*vn/ti, ix=ji*nx, iy=ji*ny;
          a.vx-=ix*a.invMass; a.vy-=iy*a.invMass;
          b.vx+=ix*b.invMass; b.vy+=iy*b.invMass;
          const tx=-ny, ty=nx;
          const vt=rvx*tx+rvy*ty;
          const jt=-vt*this.friction/ti;
          a.vx-=jt*tx*a.invMass; a.vy-=jt*ty*a.invMass;
          b.vx+=jt*tx*b.invMass; b.vy+=jt*ty*b.invMass;
          const spin=Math.max(-0.04,Math.min(0.04,vt*0.0008));
          a.angularVel-=spin; b.angularVel+=spin;
        }
      }
    }
    const now=performance.now();
    for(const b of B){
      if(b.frozen||b.markedForRemoval) continue;
      const top=b.y-b.r, sp=Math.abs(b.vy);
      if(top<this.ceiling && sp<0.6){
        if(b.aboveCeilingAt===0) b.aboveCeilingAt=now;
        else if(now-b.aboveCeilingAt>1500) this.emit('ceiling',b);
      } else b.aboveCeilingAt=0;
    }
    if(B.some(b=>b.markedForRemoval)) this.bodies=B.filter(b=>!b.markedForRemoval);
  }
}

/* ========== Storage ========== */
const Storage = (()=>{
  const KEY='suika_v2';
  function defaults(){return{
    highScore:0, highScoreByMode:{normal:0,kpop:0,daily:0,review:0},
    learnedWords:{}, mistakeWords:{}, playCount:0,
    maxLevelReached:1, muted:false,
  }}
  let cache;
  try{const raw=localStorage.getItem(KEY); cache=raw?Object.assign(defaults(),JSON.parse(raw)):defaults();}
  catch(e){cache=defaults();}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(cache));}catch(e){}}
  return {
    get(){return cache},
    setHighScore(s,m){let d=false;if(s>cache.highScore){cache.highScore=s;d=true}if(s>(cache.highScoreByMode[m]||0)){cache.highScoreByMode[m]=s;d=true}if(d)save()},
    learn(w){const x=cache.learnedWords[w]||{count:0,firstSeen:Date.now()};x.count=(x.count||0)+1;x.lastSeen=Date.now();cache.learnedWords[w]=x;if(cache.mistakeWords[w]){const m=cache.mistakeWords[w];m.count=Math.max(0,(m.count||0)-1);if(m.count<=0)delete cache.mistakeWords[w]}save()},
    addMistake(w){const m=cache.mistakeWords[w]||{count:0};m.count=(m.count||0)+1;m.ts=Date.now();cache.mistakeWords[w]=m;save()},
    incrementPlay(){cache.playCount++;save()},
    setMaxLevel(l){if(l>cache.maxLevelReached){cache.maxLevelReached=l;save()}},
    toggleMute(){cache.muted=!cache.muted;save();return cache.muted},
  };
})();

/* ========== UI ========== */
const UI = (()=>{
  const $ = id=>document.getElementById(id);
  function setScore(s){$('score').textContent=s.toLocaleString()}
  function setBest(s){$('best').textContent=s.toLocaleString()}
  function setCombo(n){
    const c=$('combo'); $('combo-n').textContent=n;
    if(n>1){c.classList.add('active'); c.style.transform='scale(1.18)'; requestAnimationFrame(()=>c.style.transform='')}
    else c.classList.remove('active');
  }
  function pop(x,y,t,combo){
    const w=$('popups'); const e=document.createElement('div');
    e.className='pop'+(combo?' combo':''); e.textContent=t;
    e.style.left=x+'px'; e.style.top=y+'px';
    w.appendChild(e); setTimeout(()=>e.remove(),1000);
  }
  function showHover(x,y,b){
    const c=$('hover'), d=b.data||{};
    c.innerHTML=`<b>${d.word||''}</b><span class="me">${d.meaning||''}</span><span class="ro">${d.roma||''}</span>`;
    c.style.left=x+'px'; c.style.top=y+'px'; c.style.display='block';
  }
  function hideHover(){$('hover').style.display='none'}
  function shake(intensity){
    const g=$('game'); const start=performance.now();
    function loop(now){
      const e=now-start;
      if(e>320){g.style.transform='';return}
      const dec=1-e/320;
      const dx=(Math.random()-0.5)*intensity*dec*2;
      const dy=(Math.random()-0.5)*intensity*dec*2;
      g.style.transform=`translate(${dx}px,${dy}px)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  function setNextWord(w){const e=$('next-word'); if(e) e.textContent=w||''}
  function setMute(m){$('b-mute').textContent = m?'🔇':'🔊'}
  function renderTree(chain,maxLv){
    const t=$('tree'); if(!t) return;
    let h='';
    for(let i=0;i<chain.length;i++){
      const lv=i+1, on=lv<=maxLv, peak=lv===maxLv;
      h+=`<span class="dot ${on?'on':''} ${peak?'peak':''}" style="background:${PASTEL[i]}" title="Lv.${lv} ${on?chain[i].word:'？？？'}"></span>`;
    }
    t.innerHTML=h;
  }
  function renderChainList(chain,maxLv){
    const l=$('chain-list'); if(!l) return;
    let h='';
    for(let i=0;i<chain.length;i++){
      const lv=i+1, it=chain[i], on=lv<=maxLv;
      h+=`<div class="cr ${on?'on':''}">
        <span class="lv">${lv}</span>
        <span class="cd" style="background:${PASTEL[i]}"></span>
        <span class="w">${on?it.word:'？？？'}</span>
        <span class="me">${on?it.meaning:''}</span>
      </div>`;
    }
    l.innerHTML=h;
  }
  function open(id){$(id).classList.add('show')}
  function close(id){$(id).classList.remove('show')}
  function showOver(s,b,maxLv,learned){
    $('r-score').textContent=s.toLocaleString();
    $('r-best').textContent=b.toLocaleString();
    $('r-max').textContent='Lv.'+maxLv;
    $('r-learned').textContent=learned;
    open('m-over');
  }
  function renderGlossary(){
    const d=Storage.get(), L=d.learnedWords;
    const all=[]; Object.values(CHAINS).forEach(c=>c.forEach((it,i)=>all.push({...it,level:i+1})));
    const seen=new Set(), uniq=all.filter(w=>{if(seen.has(w.word))return false;seen.add(w.word);return true});
    const learned=uniq.filter(w=>L[w.word]).length;
    $('g-stats').innerHTML=`
      <div>語数 <b>${learned}/${uniq.length}</b></div>
      <div>プレイ <b>${d.playCount}</b></div>
      <div>最高Lv <b>${d.maxLevelReached}</b></div>
      <div>BEST <b>${d.highScore.toLocaleString()}</b></div>`;
    $('glossary-list').innerHTML = uniq.sort((a,b)=>a.level-b.level).map(w=>{
      const ok=!!L[w.word], cnt=ok?L[w.word].count:0;
      return `<div class="gi ${ok?'':'lock'}">
        <b>${ok?w.word:'？？？'}</b>
        <i>${ok?w.meaning:'未取得'}</i>
        <em>Lv.${w.level} ${ok?'・x'+cnt:''}</em>
      </div>`;
    }).join('');
  }
  return { setScore, setBest, setCombo, pop, showHover, hideHover, shake, setNextWord, setMute, renderTree, renderChainList, open, close, showOver, renderGlossary };
})();

/* ========== Game ========== */
const Game = (()=>{
  const $=id=>document.getElementById(id);
  const canvas=$('game'), ctx=canvas.getContext('2d');
  const nextC=$('next-canvas'), nextX=nextC.getContext('2d');

  const WIDTH=canvas.width, HEIGHT=canvas.height;
  const CEILING=90, SPAWN_Y=50, COMBO_TIMEOUT=1400;

  // Visual scale of canvas relative to natural fit (leaves background margin)
  const SCALE=0.7;

  let world, mode='normal', chain=CHAINS.normal, rng=Math.random;
  let score=0, combo=0, lastMergeAt=0;
  let maxLevelThisRun=1, learnedThisRun=new Set();
  let nextLevel=pickSpawn();
  let dropX=WIDTH/2, lastDropAt=0;
  const dropCooldown=550;
  let gameOver=false, hoverBody=null, bgPulse=0, gameOverTo=0;

  function pickSpawn(){
    if(mode==='review'){
      const m=Storage.get().mistakeWords, ls=[];
      chain.forEach((it,i)=>{ if(m[it.word] && i+1<=5) ls.push(i+1) });
      if(ls.length && rng()<0.55) return ls[Math.floor(rng()*ls.length)];
    }
    return SPAWN_LEVELS[Math.floor(rng()*SPAWN_LEVELS.length)];
  }

  /* ===== Audio ===== */
  let audio=null;
  function ensureAudio(){if(!audio){try{audio=new(window.AudioContext||window.webkitAudioContext)()}catch(e){audio=null}}}
  function sfx(t,lv){
    if(Storage.get().muted) return;
    ensureAudio(); if(!audio) return;
    const o=audio.createOscillator(), g=audio.createGain();
    o.connect(g); g.connect(audio.destination);
    const T=audio.currentTime;
    if(t==='merge'){
      const f=220+lv*60;
      o.type='sine'; o.frequency.setValueAtTime(f,T);
      o.frequency.exponentialRampToValueAtTime(f*1.6,T+0.18);
      g.gain.setValueAtTime(0.18,T); g.gain.exponentialRampToValueAtTime(0.001,T+0.3);
      o.start(T); o.stop(T+0.32);
    } else if(t==='drop'){
      o.type='triangle'; o.frequency.setValueAtTime(440,T);
      o.frequency.exponentialRampToValueAtTime(180,T+0.12);
      g.gain.setValueAtTime(0.08,T); g.gain.exponentialRampToValueAtTime(0.001,T+0.18);
      o.start(T); o.stop(T+0.2);
    } else if(t==='over'){
      o.type='sawtooth'; o.frequency.setValueAtTime(280,T);
      o.frequency.exponentialRampToValueAtTime(60,T+0.6);
      g.gain.setValueAtTime(0.2,T); g.gain.exponentialRampToValueAtTime(0.001,T+0.65);
      o.start(T); o.stop(T+0.7);
    } else if(t==='combo'){
      const f=660+lv*80;
      o.type='square'; o.frequency.setValueAtTime(f,T);
      o.frequency.exponentialRampToValueAtTime(f*1.3,T+0.1);
      g.gain.setValueAtTime(0.12,T); g.gain.exponentialRampToValueAtTime(0.001,T+0.2);
      o.start(T); o.stop(T+0.2);
    }
  }

  function buildWorld(){
    world=new World({width:WIDTH,height:HEIGHT,gravity:0.55,ceiling:CEILING});
    world.on('merge',onMerge);
    world.on('ceiling',onCeiling);
  }
  function onMerge(a,b){
    if(a.markedForRemoval||b.markedForRemoval) return;
    a.markedForRemoval=true; b.markedForRemoval=true;
    const newLv=a.level+1, cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
    const base=newLv*newLv*10, now=performance.now();
    if(now-lastMergeAt<COMBO_TIMEOUT) combo++; else combo=1;
    lastMergeAt=now;
    const mult=1+(combo-1)*0.5, gained=Math.round(base*mult);
    score+=gained; UI.setScore(score); UI.setCombo(combo);

    const rect=canvas.getBoundingClientRect();
    const sx=rect.width/canvas.width, sy=rect.height/canvas.height;
    UI.pop(rect.left+cx*sx, rect.top+cy*sy, '+'+gained, combo>1);

    if(newLv<=chain.length){
      const data=chain[newLv-1], r=RADII[newLv-1];
      const body=new Body({x:cx,y:cy,radius:r,level:newLv,data:{...data,color:PASTEL[newLv-1]}});
      body.scale=0.2; body.lastMergeFlash=performance.now();
      world.add(body);
      Storage.learn(data.word); learnedThisRun.add(data.word);
      maxLevelThisRun=Math.max(maxLevelThisRun,newLv);
      Storage.setMaxLevel(maxLevelThisRun);
      UI.renderTree(chain, Storage.get().maxLevelReached);
      sfx('merge',newLv);
      if(combo>=2) sfx('combo',combo);
      if(newLv>=6){UI.shake(Math.min(18,4+newLv)); bgPulse=1}
      if(newLv===chain.length){
        score+=5000; UI.setScore(score);
        UI.pop(rect.left+cx*sx, rect.top+(cy-30)*sy, '+5000 LEGEND!', true);
        UI.shake(24);
      }
    } else { score+=1000; UI.setScore(score); sfx('merge',11) }
  }
  function onCeiling(){ if(!gameOver) triggerOver(); }
  function triggerOver(){
    gameOver=true; sfx('over'); UI.shake(20);
    for(const b of world.bodies){if(!b.frozen && b.data && b.data.word) Storage.addMistake(b.data.word)}
    Storage.setHighScore(score,mode); Storage.incrementPlay();
    if(gameOverTo) clearTimeout(gameOverTo);
    gameOverTo=setTimeout(()=>{gameOverTo=0; if(gameOver){const d=Storage.get(); UI.showOver(score,d.highScore,maxLevelThisRun,learnedThisRun.size)}}, 700);
  }
  function tryDrop(){
    if(gameOver) return;
    const now=performance.now();
    if(now-lastDropAt<dropCooldown) return;
    lastDropAt=now;
    const lv=nextLevel, data=chain[lv-1], r=RADII[lv-1];
    const x=Math.max(r,Math.min(WIDTH-r,dropX));
    const body=new Body({x,y:SPAWN_Y,radius:r,level:lv,data:{...data,color:PASTEL[lv-1]}});
    body.scale=0.5; world.add(body);
    sfx('drop'); nextLevel=pickSpawn(); drawNext();
  }

  /* ===== Render ===== */
  function clear(){
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    const g=ctx.createLinearGradient(0,0,0,HEIGHT);
    g.addColorStop(0,'#fff7ee'); g.addColorStop(1,'#ffe6e0');
    ctx.fillStyle=g; ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.fillStyle='rgba(255,180,210,0.06)';
    for(let i=0;i<HEIGHT;i+=24) ctx.fillRect(0,i,WIDTH,12);
  }
  function drawCeiling(){
    ctx.strokeStyle = bgPulse>0 ? `rgba(255,80,120,${0.3+bgPulse*0.7})` : 'rgba(255,170,200,0.6)';
    ctx.setLineDash([10,8]); ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(0,CEILING); ctx.lineTo(WIDTH,CEILING); ctx.stroke();
    ctx.setLineDash([]);
    if(bgPulse>0) bgPulse=Math.max(0,bgPulse-0.04);
  }
  function drawGuide(){
    if(gameOver) return;
    const lv=nextLevel, r=RADII[lv-1];
    const x=Math.max(r,Math.min(WIDTH-r,dropX));
    ctx.strokeStyle='rgba(196,62,110,0.35)'; ctx.setLineDash([4,6]); ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x,SPAWN_Y+r); ctx.lineTo(x,HEIGHT); ctx.stroke();
    ctx.setLineDash([]);
    drawBody({x,y:SPAWN_Y,r,level:lv,data:{...chain[lv-1],color:PASTEL[lv-1]},angle:0,scale:1}, 0.85);
  }
  function drawBody(b, alpha=1){
    const r=b.r*(b.scale??1), color=b.data.color||PASTEL[b.level-1];
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.angle||0); ctx.globalAlpha=alpha;
    ctx.beginPath(); ctx.arc(0,r*0.15,r,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fill();
    const grad=ctx.createRadialGradient(-r*0.35,-r*0.4,r*0.1,0,0,r);
    grad.addColorStop(0,'#fff'); grad.addColorStop(0.25,lighten(color,0.15)); grad.addColorStop(1,color);
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle=darken(color,0.18); ctx.lineWidth=Math.max(1.5,r*0.05); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(-r*0.35,-r*0.4,r*0.35,r*0.18,-0.5,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fill();
    const word=b.data.word||'', fs=fitFs(ctx,word,r*1.7,r*0.65);
    ctx.fillStyle=darken(color,0.55);
    ctx.font=`900 ${fs}px "Hiragino Maru Gothic ProN","Yu Gothic UI",system-ui,sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(word,0,0);
    if(b.lastMergeFlash){
      const dt=performance.now()-b.lastMergeFlash;
      if(dt<320){
        const a=1-dt/320;
        ctx.beginPath(); ctx.arc(0,0,r*(1+(1-a)*0.3),0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,220,80,${a})`; ctx.lineWidth=4*a; ctx.stroke();
      } else b.lastMergeFlash=0;
    }
    ctx.restore();
  }
  function fitFs(c,t,maxW,base){let s=base;c.font=`900 ${s}px sans-serif`;const w=c.measureText(t).width;if(w>maxW) s=s*(maxW/w);return Math.max(8,Math.min(base,s))}
  function lighten(hex,a){const c=h2r(hex);return`rgb(${Math.min(255,c.r+255*a)|0},${Math.min(255,c.g+255*a)|0},${Math.min(255,c.b+255*a)|0})`}
  function darken(hex,a){const c=h2r(hex);return`rgb(${Math.max(0,c.r-255*a)|0},${Math.max(0,c.g-255*a)|0},${Math.max(0,c.b-255*a)|0})`}
  function h2r(hex){const m=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return m?{r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)}:{r:200,g:200,b:200}}

  function drawNext(){
    const w=nextC.width, h=nextC.height;
    nextX.clearRect(0,0,w,h);
    const lv=nextLevel, data=chain[lv-1];
    const r=Math.min(RADII[lv-1],w*0.4), cx=w/2, cy=h/2;
    nextX.save();
    const grad=nextX.createRadialGradient(cx-r*0.35,cy-r*0.4,r*0.1,cx,cy,r);
    const color=PASTEL[lv-1];
    grad.addColorStop(0,'#fff'); grad.addColorStop(0.25,lighten(color,0.15)); grad.addColorStop(1,color);
    nextX.beginPath(); nextX.arc(cx,cy,r,0,Math.PI*2); nextX.fillStyle=grad; nextX.fill();
    nextX.strokeStyle=darken(color,0.18); nextX.lineWidth=2; nextX.stroke();
    const fs=fitFs(nextX,data.word,r*1.7,r*0.55);
    nextX.fillStyle=darken(color,0.55);
    nextX.font=`900 ${fs}px "Hiragino Maru Gothic ProN","Yu Gothic UI",sans-serif`;
    nextX.textAlign='center'; nextX.textBaseline='middle';
    nextX.fillText(data.word,cx,cy);
    nextX.restore();
    UI.setNextWord(data.word);
  }

  function frame(){
    if(!gameOver) world.step(1);
    clear(); drawCeiling();
    for(const b of world.bodies) drawBody(b);
    drawGuide();
    if(combo>0 && performance.now()-lastMergeAt>COMBO_TIMEOUT){
      if(combo>1){combo=0; UI.setCombo(1)}
    }
    requestAnimationFrame(frame);
  }

  /* ===== Input ===== */
  function relX(e){
    const r=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return Math.max(0,Math.min(WIDTH,(t.clientX-r.left)*(canvas.width/r.width)));
  }
  function onMove(e){
    dropX=relX(e);
    const r=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    const cx=(t.clientX-r.left)*(canvas.width/r.width);
    const cy=(t.clientY-r.top)*(canvas.height/r.height);
    let f=null;
    for(const b of world.bodies){
      const dx=b.x-cx, dy=b.y-cy;
      if(dx*dx+dy*dy<b.r*b.r){f=b;break}
    }
    hoverBody=f;
    if(f && cy>SPAWN_Y+60){
      const sx=r.width/canvas.width, sy=r.height/canvas.height;
      UI.showHover(r.left+f.x*sx, r.top+(f.y-f.r)*sy, f);
    } else UI.hideHover();
  }
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('mouseleave',()=>UI.hideHover());
  canvas.addEventListener('mousedown',e=>{if(gameOver)return;e.preventDefault();dropX=relX(e);tryDrop()});
  let touchStart=null;
  canvas.addEventListener('touchstart',e=>{e.preventDefault();if(gameOver)return;UI.hideHover();onMove(e);touchStart={t:performance.now(),inspect:!!hoverBody}},{passive:false});
  canvas.addEventListener('touchmove', e=>{e.preventDefault();if(gameOver)return;onMove(e)},{passive:false});
  canvas.addEventListener('touchend',  e=>{e.preventDefault();if(gameOver||!touchStart){touchStart=null;return}const dt=performance.now()-touchStart.t;if(touchStart.inspect && dt<500){setTimeout(()=>UI.hideHover(),1600)}else{tryDrop();UI.hideHover()}touchStart=null},{passive:false});
  canvas.addEventListener('touchcancel',()=>{touchStart=null;UI.hideHover()});
  document.addEventListener('keydown',e=>{
    if(gameOver) return;
    if(e.key==='ArrowLeft')  dropX=Math.max(0,dropX-16);
    if(e.key==='ArrowRight') dropX=Math.min(WIDTH,dropX+16);
    if(e.key===' '||e.key==='Enter'){e.preventDefault();tryDrop()}
  });

  /* ===== Mode / restart ===== */
  function setMode(m){
    mode=m; chain=CHAINS[m]||CHAINS.normal;
    rng = (m==='daily') ? mulberry32(dailySeed()) : Math.random;
    document.querySelectorAll('.m').forEach(b=>b.classList.toggle('active', b.getAttribute('data-mode')===m));
    restart();
  }
  function restart(){
    if(gameOverTo){clearTimeout(gameOverTo); gameOverTo=0}
    UI.close('m-over'); UI.hideHover();
    score=0; combo=0; lastMergeAt=0;
    maxLevelThisRun=1; learnedThisRun=new Set();
    gameOver=false; hoverBody=null; bgPulse=0;
    dropX=WIDTH/2; lastDropAt=0;
    nextLevel=pickSpawn();
    buildWorld();
    UI.setScore(0); UI.setCombo(1);
    UI.renderTree(chain, Storage.get().maxLevelReached);
    drawNext();
  }

  /* ===== Responsive sizing — JS-driven for guaranteed fit ===== */
  function syncLayout(){
    // Use innerHeight (most reliable across iOS Safari quirks)
    const vh = window.innerHeight;
    const tools = document.getElementById('tools');
    const toolsH = tools ? tools.offsetHeight : 56;
    const app = document.getElementById('app');
    if(app) app.style.bottom = toolsH + 'px';
    // Compute board's own size and fit canvas there
    const board = document.getElementById('board');
    if(!board) return;
    const availW = board.clientWidth;
    const availH = board.clientHeight;
    const ratio = WIDTH / HEIGHT; // 420/640
    let w = availW, h = w / ratio;
    if(h > availH){ h = availH; w = h * ratio }
    w *= SCALE; h *= SCALE;
    canvas.style.width  = Math.floor(w) + 'px';
    canvas.style.height = Math.floor(h) + 'px';
  }

  /* ===== Boot ===== */
  function init(){
    document.querySelectorAll('.m').forEach(b=>b.addEventListener('click',()=>setMode(b.getAttribute('data-mode'))));
    $('b-reset').addEventListener('click',()=>{if(confirm('リセットしますか？')) restart()});
    $('b-mute').addEventListener('click',()=>UI.setMute(Storage.toggleMute()));
    $('b-help').addEventListener('click',()=>UI.open('m-help'));
    $('b-glossary').addEventListener('click',()=>{UI.renderGlossary();UI.open('m-glossary')});
    $('tree').addEventListener('click',()=>{UI.renderChainList(chain,Storage.get().maxLevelReached);UI.open('m-tree')});
    $('r-again').addEventListener('click',()=>{UI.close('m-over');restart()});
    $('r-glossary').addEventListener('click',()=>{UI.close('m-over');UI.renderGlossary();UI.open('m-glossary')});

    UI.setMute(Storage.get().muted);
    UI.setBest(Storage.get().highScore);

    syncLayout();
    const refit = ()=>syncLayout();
    window.addEventListener('resize',refit);
    window.addEventListener('orientationchange',()=>{refit();setTimeout(refit,100);setTimeout(refit,400)});
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize',refit);
      window.visualViewport.addEventListener('scroll',refit);
    }

    setMode('normal');
    requestAnimationFrame(frame);
  }

  return { init, restart, setMode };
})();

window.UI = UI;
window.addEventListener('load', Game.init);
