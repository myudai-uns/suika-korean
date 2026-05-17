/* ============================================================
 * 한글수박 v2 — single-file game logic
 * ============================================================ */

/* ========== Word data ========== */
// 5. パレットを「彩度高め・明度キープ」で微調整（韓国語学習のやわらかさは維持）
const PASTEL = ['#FF8FA3','#FFC68C','#FFEE66','#7CE9A0','#7CC4FF','#C9A8FF','#FF8FD8','#FFB166','#6EE0B8','#FFCB1F','#FF3D85'];
const RADII  = [22,28,35,42,50,58,68,78,90,104,120];

/* === 1. 複数正解対応 ============================================
 * 各語に optional `answers` 配列を持たせ、複数の日本語訳を正解扱いに。
 * `answers` が無ければ `meaning` のみが正解（後方互換）。
 * UI に表示する代表訳は引き続き `meaning`。
 * ================================================================ */
const CHAIN_NORMAL = [
  {word:'네',                meaning:'はい',                roma:'ne',                  answers:['はい','ええ','うん']},
  {word:'안녕',              meaning:'やあ',                roma:'annyeong',            answers:['やあ','こんにちは','ハイ','元気']},
  {word:'고마워',            meaning:'ありがとう',           roma:'gomawo',              answers:['ありがとう','どうも','サンキュー']},
  {word:'사랑해',            meaning:'愛してる',             roma:'saranghae',           answers:['愛してる','大好き']},
  {word:'안녕하세요',        meaning:'こんにちは',           roma:'annyeonghaseyo',      answers:['こんにちは','おはようございます','こんばんは']},
  {word:'감사합니다',        meaning:'ありがとうございます',  roma:'gamsahamnida',        answers:['ありがとうございます','感謝します']},
  {word:'사랑합니다',        meaning:'愛しています',         roma:'saranghamnida',       answers:['愛しています','愛してます']},
  {word:'만나서 반가워요',   meaning:'お会いできて嬉しい',    roma:'mannaseo bangawoyo',  answers:['お会いできて嬉しい','はじめまして']},
  {word:'한국 좋아해요',     meaning:'韓国が好き',           roma:'hanguk joahaeyo',     answers:['韓国が好き','韓国大好き']},
  {word:'한글 마스터 🇰🇷',  meaning:'ハングルマスター',      roma:'hangeul master'},
  {word:'한국 LEGEND 🌏',    meaning:'韓国レジェンド',       roma:'hanguk legend'},
];
const CHAIN_KPOP = [
  {word:'오빠',         meaning:'お兄さん(年上男性)', roma:'oppa',                   answers:['お兄さん(年上男性)','オッパ','年上の男性']},
  {word:'언니',         meaning:'お姉さん(年上女性)', roma:'eonni',                  answers:['お姉さん(年上女性)','オンニ','年上の女性']},
  {word:'대박',         meaning:'すごい!',           roma:'daebak',                  answers:['すごい!','やばい!','最高!']},
  {word:'화이팅',       meaning:'ファイト!',         roma:'hwaiting',                answers:['ファイト!','頑張れ!','がんばれ!']},
  {word:'심쿵',         meaning:'胸キュン',           roma:'simkung',                 answers:['胸キュン','キュン']},
  {word:'덕질',         meaning:'推し活',             roma:'deokjil',                 answers:['推し活','オタ活']},
  {word:'최애',         meaning:'最推し',             roma:'choeae',                  answers:['最推し','一番好き']},
  {word:'무대 짱',      meaning:'ステージ最高',        roma:'mudae jjang',             answers:['ステージ最高','ステージ最強']},
  {word:'평생 응원해',  meaning:'一生応援する',        roma:'pyeongsaeng eungwonhae',  answers:['一生応援する','ずっと応援']},
  {word:'아이돌 ⭐',    meaning:'アイドル',            roma:'aidol'},
  {word:'K-POP LEGEND 💜',meaning:'K-POPレジェンド',  roma:'k-pop legend'},
];
const CHAIN_DAILY = [
  {word:'좋아',                   meaning:'いいね',          roma:'joa',                   answers:['いいね','好き','OK']},
  {word:'몰라',                   meaning:'知らない',         roma:'molla',                 answers:['知らない','わからない']},
  {word:'배고파',                 meaning:'お腹すいた',       roma:'baegopa',               answers:['お腹すいた','腹減った']},
  {word:'맛있어',                 meaning:'おいしい',         roma:'masisseo',              answers:['おいしい','うまい']},
  {word:'재미있어요',             meaning:'面白いです',       roma:'jaemiisseoyo',          answers:['面白いです','楽しいです']},
  {word:'행복해요',               meaning:'幸せです',         roma:'haengbokhaeyo',         answers:['幸せです','ハッピーです']},
  {word:'사랑스러워요',           meaning:'愛らしいです',     roma:'sarangseureowoyo',      answers:['愛らしいです','可愛いです']},
  {word:'한국에 가고 싶어요',     meaning:'韓国に行きたい',    roma:'hanguge gago sipeoyo',  answers:['韓国に行きたい','韓国行きたいです']},
  {word:'한국어 잘 해요',         meaning:'韓国語上手です',   roma:'hangugeo jal haeyo',    answers:['韓国語上手です','韓国語うまい']},
  {word:'데일리 클리어 ⭐',       meaning:'デイリークリア',   roma:'daily clear'},
  {word:'한국 ULTIMATE 👑',       meaning:'韓国アルティメット',roma:'hanguk ultimate'},
];
const CHAIN_HANJA = [
  {word:'일',  meaning:'1（イル）',  roma:'il'},
  {word:'이',  meaning:'2（イ）',    roma:'i'},
  {word:'삼',  meaning:'3（サム）',  roma:'sam'},
  {word:'사',  meaning:'4（サ）',    roma:'sa'},
  {word:'오',  meaning:'5（オ）',    roma:'o'},
  {word:'육',  meaning:'6（ユク）',  roma:'yuk'},
  {word:'칠',  meaning:'7（チル）',  roma:'chil'},
  {word:'팔',  meaning:'8（パル）',  roma:'pal'},
  {word:'구',  meaning:'9（ク）',    roma:'gu'},
  {word:'십',  meaning:'10（シプ）', roma:'sip'},
];
const CHAIN_GOYU = [
  {word:'하나',   meaning:'ひとつ', roma:'hana'},
  {word:'둘',     meaning:'ふたつ', roma:'dul'},
  {word:'셋',     meaning:'みっつ', roma:'set'},
  {word:'넷',     meaning:'よっつ', roma:'net'},
  {word:'다섯',   meaning:'いつつ', roma:'daseot'},
  {word:'여섯',   meaning:'むっつ', roma:'yeoseot'},
  {word:'일곱',   meaning:'ななつ', roma:'ilgop'},
  {word:'여덟',   meaning:'やっつ', roma:'yeodeol'},
  {word:'아홉',   meaning:'ここのつ', roma:'ahop'},
  {word:'열',     meaning:'とお',   roma:'yeol'},
];
const CHAINS = {
  normal:CHAIN_NORMAL, kpop:CHAIN_KPOP, daily:CHAIN_DAILY, review:CHAIN_NORMAL,
  hanja:CHAIN_HANJA, goyu:CHAIN_GOYU,
};
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
    // 質量係数を下げて「軽い」感触に（衝突時の反応が機敏、積み上げも安定）
    this.mass=Math.PI*this.r*this.r*0.0006;
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
    // === 物理パラメータ（軽め＋高摩擦で「安定して積める」感触） ===
    this.gravity=o.gravity??0.55;       // 重力やや弱め: 軽く落ちる
    this.airDamp=0.9985;                // 空気抵抗そのまま
    this.angularDamp=0.82;              // 回転を強めに減衰（横転を抑制）
    this.angularMax=0.10;               // 回転速度上限を低く（コロコロ転がらない）
    this.restitution=0.08;              // 跳ね返りほぼ無し（"カツン"より"スッ"）
    this.friction=0.55;                 // 摩擦大幅 UP: 横滑り/コロコロを抑制
    this.mergeRange=1.06;               // 合体トリガ控えめ
    this.ceiling=o.ceiling??80;
    this.bodies=[];
    this.solverIter=6;                  // 反復回数: 重なり/食い込み抑制
    this.events={merge:[],ceiling:[]};
    this._ceilingFired=false;
  }
  on(e,f){this.events[e].push(f)}
  emit(e,...a){
    // 4. ceiling は 1回だけ通知（多重 triggerOver 防止）
    if(e==='ceiling'){
      if(this._ceilingFired) return;
      this._ceilingFired = true;
    }
    for(const f of this.events[e])f(...a)
  }
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
          const mergeR=md*this.mergeRange;
          // Skip entirely if too far for both merge and collision
          if(d2>=mergeR*mergeR) continue;
          const dist=Math.sqrt(d2)||0.0001;
          const nx=dx/dist, ny=dy/dist;
          // Merge check uses the loosened mergeRange (fires before tight contact)
          if(it===this.solverIter-1 && a.level===b.level
             && !a.markedForRemoval && !b.markedForRemoval
             && a.scale>0.7 && b.scale>0.7
             && !(a.data && a.data.failed) && !(b.data && b.data.failed)){
            this.emit('merge',a,b,nx,ny);
            if(a.markedForRemoval) break;
            continue;
          }
          // Collision response only when actually overlapping
          if(d2>=md*md) continue;
          const overlap=md-dist;
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
    /* === 4. オーバーフロー検出（厳密化） ============================
     * - 生成から GRACE_MS 経過していない果物は無視（落下中の通過は誤検出しない）
     * - 上端 (b.y - b.r) が CEILING を超えた状態が STAY_MS 連続したら ceiling 通知
     * - frozen / markedForRemoval は除外
     * - グレー失敗果物も他の果物と同じ扱い（除外しない）
     * - emit は World 側で一度だけ通知（多重発火防止）
     * ============================================================ */
    const now = performance.now();
    const GRACE_MS = 1500;   // 生成直後の猶予
    const STAY_MS  = 900;    // 上端が線を越えた状態の継続秒数
    for(const b of B){
      if(b.frozen||b.markedForRemoval) continue;
      if(now - b.bornAt < GRACE_MS){ b.aboveCeilingAt = 0; continue; }
      const top = b.y - b.r;
      if(top < this.ceiling){
        if(b.aboveCeilingAt===0) b.aboveCeilingAt = now;
        else if(now - b.aboveCeilingAt > STAY_MS) this.emit('ceiling', b);
      } else {
        b.aboveCeilingAt = 0;
      }
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
    customLists:[], activeCustomId:null,
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
    /* === Custom word lists === */
    listCustom(){return cache.customLists.slice()},
    getCustom(id){return cache.customLists.find(l=>l.id===id)||null},
    saveCustom(list){
      const i=cache.customLists.findIndex(l=>l.id===list.id);
      if(i>=0) cache.customLists[i]=list; else cache.customLists.push(list);
      save();
    },
    deleteCustom(id){
      cache.customLists=cache.customLists.filter(l=>l.id!==id);
      if(cache.activeCustomId===id) cache.activeCustomId=null;
      save();
    },
    setActiveCustom(id){cache.activeCustomId=id;save()},
    getActiveCustom(){return cache.customLists.find(l=>l.id===cache.activeCustomId)||null},
  };
})();

/* ========== UI ========== */
const UI = (()=>{
  const $ = id=>document.getElementById(id);
  function setScore(s){$('score').textContent=s.toLocaleString()}
  function setBest(s){$('best').textContent=s.toLocaleString()}
  function setCombo(n){
    // ×Nラベルは UI 簡素化で撤去。要素が無ければ何もしない（コンボロジック自体は維持）
    const c=$('combo'); if(!c) return;
    const cn=$('combo-n'); if(cn) cn.textContent=n;
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
  function setMute(m){$('b-mute').textContent = (m?'🔇':'🔊') + ' 音声'}
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
  /* ===== Custom list UI ===== */
  function renderCustomList(onPick, onEdit){
    const root=$('custom-list'); if(!root) return;
    const lists=Storage.listCustom();
    if(lists.length===0){
      root.innerHTML=`<div class="cl-row empty">まだリストがありません。「＋ 新しいリスト」から作成</div>`;
      return;
    }
    root.innerHTML='';
    lists.forEach(l=>{
      const row=document.createElement('div');
      row.className='cl-row';
      row.innerHTML=`<b>${escapeHtml(l.name||'(無題)')}</b><em>${l.words.length}語</em><button class="cl-edit">編集</button>`;
      row.addEventListener('click',e=>{
        if(e.target.classList.contains('cl-edit')){ e.stopPropagation(); onEdit(l.id); }
        else { onPick(l.id); }
      });
      root.appendChild(row);
    });
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}

  function openCustomEdit(list, onSave, onDelete){
    $('ce-title').textContent = list.id ? 'リスト編集' : '新しいリスト';
    $('ce-name').value = list.name || '';
    const wrap=$('ce-words'); wrap.innerHTML='';
    const words = list.words.slice();
    if(words.length===0) words.push({word:'',meaning:''});
    words.forEach((w,i)=>wrap.appendChild(buildWordRow(w,i)));
    refreshLv();

    const addBtn=$('ce-add');
    const onAdd=()=>{
      if(wrap.children.length>=10) return;
      wrap.appendChild(buildWordRow({word:'',meaning:''},wrap.children.length));
      refreshLv();
    };
    const onSaveClick=()=>{
      const name=$('ce-name').value.trim()||'(無題)';
      const collected=[];
      [...wrap.children].forEach(row=>{
        const w=row.querySelector('input.word').value.trim();
        const m=row.querySelector('input.meaning').value.trim();
        if(w && m) collected.push({word:w, meaning:m, roma:''});
      });
      if(collected.length<3){ alert('単語は最低3語入力してください'); return; }
      onSave({...list, name, words:collected});
    };
    const onCancel=()=>close('m-custom-edit');
    const onDeleteClick=()=>{
      if(!list.id) { close('m-custom-edit'); return; }
      if(confirm('このリストを削除しますか？')) { onDelete(list.id); }
    };
    addBtn.onclick=onAdd;
    $('ce-save').onclick=onSaveClick;
    $('ce-cancel').onclick=onCancel;
    $('ce-delete').onclick=onDeleteClick;
    $('ce-delete').style.display = list.id ? '' : 'none';
    open('m-custom-edit');

    function buildWordRow(w,i){
      const row=document.createElement('div');
      row.className='ce-word-row';
      row.innerHTML=`
        <span class="ce-lv">Lv.${i+1}</span>
        <input class="word" type="text" placeholder="韓国語" value="${escapeHtml(w.word||'')}" maxlength="20">
        <input class="meaning" type="text" placeholder="意味" value="${escapeHtml(w.meaning||'')}" maxlength="20">
        <button class="ce-rm" type="button" aria-label="削除">×</button>`;
      row.querySelector('.ce-rm').onclick=()=>{
        if(wrap.children.length<=1) return;
        row.remove(); refreshLv();
      };
      return row;
    }
    function refreshLv(){
      [...wrap.children].forEach((r,i)=>{ r.querySelector('.ce-lv').textContent='Lv.'+(i+1); });
      addBtn.style.display = wrap.children.length>=10 ? 'none' : '';
    }
  }

  /* ===== Quiz overlay =====
   * 仕様:
   *  - correctSet (Set<string>) を渡し、選んだ候補の meaning がそこに含まれれば正解
   *  - 10秒カウントダウン。タイムアウトは不正解として onAnswer(false,'timeout')
   *  - 二重発火（連打・ダブルクリック）を opts.dataset.locked で抑止
   *  - 正解/不正解/タイムアウト/closeQuiz いずれの経路でも必ずタイマー解除
   */
  let _quizTimer = 0;       // setInterval id for the per-second tick
  let _quizClosing = false; // re-entry guard for finalize()
  function clearQuizTimer(){
    if(_quizTimer){ clearInterval(_quizTimer); _quizTimer = 0; }
  }
  function showQuiz(question, choices, correctSet, onAnswer){
    const root=$('quiz');
    _quizClosing = false;
    $('quiz-word').textContent=question.word;
    const opts=$('quiz-opts'); opts.innerHTML='';
    delete opts.dataset.locked;

    // タイマー表示（既存の .quiz-timer があれば再利用、無ければ生成）
    let timerEl = root.querySelector('.quiz-timer');
    if(!timerEl){
      timerEl = document.createElement('div');
      timerEl.className = 'quiz-timer';
      const card = root.querySelector('.quiz-card');
      card.insertBefore(timerEl, card.querySelector('.quiz-opts'));
    }
    // DOM は一度だけ構築 → 以降は width / text だけ更新（CSS トランジションを活かす）
    timerEl.innerHTML = `<div class="qt-bar"><div class="qt-fill"></div></div><div class="qt-num"></div>`;
    const qtFill = timerEl.querySelector('.qt-fill');
    const qtNum  = timerEl.querySelector('.qt-num');
    const TOTAL = 10;
    let remain = TOTAL;
    const renderTimer = () => {
      const pct = Math.max(0, (remain/TOTAL)*100);
      qtFill.style.width = pct + '%';
      qtNum.textContent = remain + ' 秒';
      qtNum.classList.toggle('low', remain<=3);
    };
    renderTimer();

    const finalize = (correct, reason)=>{
      if(_quizClosing) return;
      _quizClosing = true;
      clearQuizTimer();
      opts.dataset.locked = '1';
      // ハイライト（タイムアウト時は全選択肢を wrong に）
      if(reason === 'timeout'){
        [...opts.children].forEach(x=>x.classList.add('wrong'));
      }
      setTimeout(()=>{
        root.classList.remove('show');
        opts.innerHTML=''; delete opts.dataset.locked;
        timerEl.innerHTML='';
        onAnswer(correct, reason||(correct?'correct':'wrong'));
      }, correct?260:reason==='timeout'?620:480);
    };

    choices.forEach((c)=>{
      const b=document.createElement('button');
      b.type='button'; b.className='quiz-opt'; b.textContent=c.meaning;
      b.addEventListener('click',()=>{
        if(opts.dataset.locked) return;          // 二重発火防止
        opts.dataset.locked='1';
        const correct = correctSet.has(c.meaning);
        b.classList.add(correct?'correct':'wrong');
        [...opts.children].forEach(x=>{ if(x!==b) x.classList.add('dim'); });
        finalize(correct, correct?'correct':'wrong');
      },{passive:true});
      opts.appendChild(b);
    });

    // 1秒ごとに更新、0でタイムアウト
    clearQuizTimer();
    _quizTimer = setInterval(()=>{
      remain -= 1;
      if(remain <= 0){
        renderTimer();
        finalize(false, 'timeout');
      } else {
        renderTimer();
      }
    }, 1000);

    root.classList.add('show');
  }
  function hideQuiz(){
    clearQuizTimer();
    _quizClosing = true;       // 中断: 既に submit 済みでも安全
    const r=$('quiz'); r.classList.remove('show');
    $('quiz-opts').innerHTML='';
    const t=r.querySelector('.quiz-timer'); if(t) t.innerHTML='';
  }
  function isQuizOpen(){ return $('quiz').classList.contains('show'); }

  /* ===== 2. スタート画面 ===== */
  function showStart(){
    const s=$('start'); if(!s) return;
    s.classList.add('show');
    // ボタン状態をリセット
    s.querySelectorAll('.sm').forEach(b=>b.classList.remove('picked'));
    const go=$('b-start');
    if(go){ go.disabled=true; go.textContent='カテゴリを選んでね'; }
  }
  function hideStart(){ const s=$('start'); if(s) s.classList.remove('show'); }
  function isStartOpen(){ const s=$('start'); return !!(s && s.classList.contains('show')); }

  return { setScore, setBest, setCombo, pop, showHover, hideHover, shake, setNextWord, setMute, renderTree, renderChainList, open, close, showOver, renderGlossary, renderCustomList, openCustomEdit, showQuiz, hideQuiz, isQuizOpen, showStart, hideStart, isStartOpen };
})();

/* ========== Game ========== */
const Game = (()=>{
  const $=id=>document.getElementById(id);
  const canvas=$('game'), ctx=canvas.getContext('2d');
  const nextC=$('next-canvas'), nextX=nextC.getContext('2d');

  const WIDTH=canvas.width, HEIGHT=canvas.height;
  const CEILING=90, SPAWN_Y=50, COMBO_TIMEOUT=1400;

  // Visual scale of canvas relative to natural fit (leaves background margin)
  const SCALE=0.85;

  let world, mode='normal', chain=CHAINS.normal, rng=Math.random;
  let score=0, combo=0, lastMergeAt=0;
  let maxLevelThisRun=1, learnedThisRun=new Set();
  let nextLevel=pickSpawn();
  let dropX=WIDTH/2, lastDropAt=0;
  // 5. 落下クールダウンを短縮 → 「ポンポン落とせる」テンポに
  const dropCooldown=400;
  let gameOver=false, hoverBody=null, bgPulse=0, gameOverTo=0;
  // 2. スタート画面: 初回ロード時 false。Start 押下時に true へ。
  let started=false;
  // 5. マージ時の小さなパーティクル群
  const particles=[];

  function pickSpawn(){
    const cap=Math.max(1, Math.min(4, chain.length-1));
    if(mode==='review'){
      const m=Storage.get().mistakeWords, ls=[];
      chain.forEach((it,i)=>{ if(m[it.word] && i+1<=cap) ls.push(i+1) });
      if(ls.length && rng()<0.55) return ls[Math.floor(rng()*ls.length)];
    }
    return Math.min(cap, SPAWN_LEVELS[Math.floor(rng()*SPAWN_LEVELS.length)]);
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
    // 5. 物理は World 側のデフォルトに任せる（gravity 等を集約）
    world=new World({width:WIDTH,height:HEIGHT,ceiling:CEILING});
    world.on('merge',onMerge);
    world.on('ceiling',onCeiling);
  }
  /* === 5. パーティクル =============================================
   * マージ瞬間に小さな粒を放出して「キラッ」とした即時フィードバック。
   * 過剰にならないよう数・寿命は控えめ。
   * ============================================================== */
  function spawnParticles(cx, cy, color, n){
    for(let i=0;i<n;i++){
      const a = Math.random()*Math.PI*2;
      const s = 1.5 + Math.random()*3.2;
      particles.push({
        x:cx, y:cy,
        vx:Math.cos(a)*s, vy:Math.sin(a)*s - 1.2,
        r: 2 + Math.random()*2.4,
        life: 1, decay: 0.04 + Math.random()*0.02,
        color
      });
    }
  }
  function stepParticles(){
    if(particles.length===0) return;
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx; p.y+=p.vy;
      p.vy+=0.18; p.vx*=0.985;
      p.life -= p.decay;
      if(p.life<=0) particles.splice(i,1);
    }
  }
  function drawParticles(){
    for(const p of particles){
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function onMerge(a,b){
    if(a.markedForRemoval||b.markedForRemoval) return;
    a.markedForRemoval=true; b.markedForRemoval=true;
    const newLv=a.level+1, cx=(a.x+b.x)/2, cy=(a.y+b.y)/2;
    // 5. マージ位置にパーティクル
    spawnParticles(cx, cy, PASTEL[Math.min(newLv-1, PASTEL.length-1)], 10 + Math.min(12, newLv*2));
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
    // 4. 多重発火ガード（emit 側でも防いでいるが念のため）
    if(gameOver) return;
    gameOver=true;
    UI.hideQuiz();        // 3. ゲームオーバー時は必ずタイマー解除
    sfx('over'); UI.shake(20);
    for(const b of world.bodies){if(!b.frozen && b.data && b.data.word) Storage.addMistake(b.data.word)}
    Storage.setHighScore(score,mode); Storage.incrementPlay();
    if(gameOverTo) clearTimeout(gameOverTo);
    gameOverTo=setTimeout(()=>{gameOverTo=0; if(gameOver){const d=Storage.get(); UI.showOver(score,d.highScore,maxLevelThisRun,learnedThisRun.size)}}, 700);
  }
  function shuffleArr(a){
    const r=a.slice();
    for(let i=r.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[r[i],r[j]]=[r[j],r[i]];}
    return r;
  }
  /* === 1. 複数正解対応 ============================================
   * - 質問語の `answers`（無ければ [meaning]）を「正解集合」として保持。
   * - distractor 抽出時に、その語の表記（meaning / answers 全部）が
   *   正解集合と重複する場合は除外（混同防止）。
   * - 表示は各候補の `meaning` を使う（後方互換）。
   * - 正解判定は onAnswer 側で「選んだ候補の meaning が正解集合に含まれるか」。
   * ================================================================ */
  function answersOf(w){
    if(!w) return [];
    if(Array.isArray(w.answers) && w.answers.length) return w.answers.slice();
    return w.meaning ? [w.meaning] : [];
  }
  function buildQuiz(question){
    const correctSet = new Set(answersOf(question));
    correctSet.add(question.meaning);
    const pool = chain.filter(w => {
      if(w.word === question.word) return false;
      // 候補語の表記いずれかが正解集合と重複したら距離が近すぎるので除外
      const allMeans = answersOf(w).concat([w.meaning]);
      return !allMeans.some(m => correctSet.has(m));
    });
    // 候補同士の meaning 重複も除外
    const seen = new Set();
    const dedup = pool.filter(w => {
      if(seen.has(w.meaning)) return false;
      seen.add(w.meaning); return true;
    });
    const distractors = shuffleArr(dedup).slice(0,2);
    while(distractors.length<2){
      distractors.push({word:'__none__', meaning:'？？？'});
    }
    return shuffleArr([question, ...distractors]);
  }
  function tryDrop(){
    if(gameOver || !started) return;          // 3. 開始前は落下しない
    if(UI.isQuizOpen()) return;
    const now=performance.now();
    if(now-lastDropAt<dropCooldown) return;
    lastDropAt=now;
    const lv=nextLevel, question=chain[lv-1];
    const x=dropX;
    const choices=buildQuiz(question);
    // 1. 正解集合（answers + meaning）を構築して UI に渡す
    const correctSet = new Set(answersOf(question));
    correctSet.add(question.meaning);
    UI.showQuiz(question, choices, correctSet, (correct, reason)=>{
      // 3. タイムアウトも不正解扱い → グレー失敗果物
      dropFruit(x, lv, !correct);
      if(!correct && question && question.word) Storage.addMistake(question.word);
    });
  }
  function dropFruit(x, lv, failed){
    if(gameOver) return;
    const data=chain[lv-1], r=RADII[lv-1];
    const cx=Math.max(r,Math.min(WIDTH-r,x));
    const body=new Body({x:cx,y:SPAWN_Y,radius:r,level:lv,data:{...data,color:PASTEL[lv-1],failed:!!failed}});
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
    const r=b.r*(b.scale??1);
    const failed=!!(b.data && b.data.failed);
    const baseColor=b.data.color||PASTEL[b.level-1];
    const color=failed ? grayscale(baseColor) : baseColor;
    ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(b.angle||0); ctx.globalAlpha=alpha*(failed?0.85:1);
    ctx.beginPath(); ctx.arc(0,r*0.15,r,0,Math.PI*2); ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fill();
    const grad=ctx.createRadialGradient(-r*0.35,-r*0.4,r*0.1,0,0,r);
    grad.addColorStop(0, failed?'#f0f0f0':'#fff'); grad.addColorStop(0.25,lighten(color,0.15)); grad.addColorStop(1,color);
    ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fillStyle=grad; ctx.fill();
    ctx.strokeStyle=failed?'#666':darken(color,0.18); ctx.lineWidth=Math.max(1.5,r*0.05);
    if(failed){ ctx.setLineDash([4,3]); }
    ctx.stroke();
    if(failed){ ctx.setLineDash([]); }
    ctx.beginPath(); ctx.ellipse(-r*0.35,-r*0.4,r*0.35,r*0.18,-0.5,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.fill();
    const word=b.data.word||'', fs=fitFs(ctx,word,r*1.7,r*0.65);
    ctx.fillStyle=failed?'#444':darken(color,0.55);
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
  function grayscale(hex){const c=h2r(hex);const g=(c.r*0.3+c.g*0.59+c.b*0.11)|0;const m=Math.min(220,Math.max(140,g));return `rgb(${m},${m},${m})`}

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
    // 2. スタート前 / ゲームオーバー時は物理停止
    if(!gameOver && started) world.step(1);
    clear(); drawCeiling();
    for(const b of world.bodies) drawBody(b);
    // 5. パーティクルは果物の上に、ガイドの下に重ねる
    stepParticles(); drawParticles();
    if(started) drawGuide();
    if(combo>0 && performance.now()-lastMergeAt>COMBO_TIMEOUT){
      if(combo>1){combo=0; UI.setCombo(1)}
    }
    requestAnimationFrame(frame);
  }

  /* ===== Input ===== */
  function onMove(e){
    const t=e.touches?e.touches[0]:e;
    const r=canvas.getBoundingClientRect();
    const cx=(t.clientX-r.left)*(canvas.width/r.width);
    const cy=(t.clientY-r.top)*(canvas.height/r.height);
    // dropX is always derived from touch x, clamped to canvas internal range
    // (so touches outside canvas left/right snap to the corresponding edge)
    dropX=Math.max(0,Math.min(WIDTH,cx));
    // Hover detection only when actually inside canvas
    let f=null;
    if(cx>=0 && cx<=WIDTH && cy>=0 && cy<=HEIGHT){
      for(const b of world.bodies){
        const dx=b.x-cx, dy=b.y-cy;
        if(dx*dx+dy*dy<b.r*b.r){f=b;break}
      }
    }
    hoverBody=f;
    if(f && cy>SPAWN_Y+60){
      const sx=r.width/canvas.width, sy=r.height/canvas.height;
      UI.showHover(r.left+f.x*sx, r.top+(f.y-f.r)*sy, f);
    } else UI.hideHover();
  }
  // タップ対象が UI なら通常タッチハンドラに任せる
  // drop-zone は pointer-events:none なので e.target にはならない（透過）
  const isUI = el => !!(el && el.closest && el.closest('button, .modal, .menu, .quiz, .start'));

  // Mouse: keep the canvas-only behavior (cursor doesn't obscure view)
  canvas.addEventListener('mousemove',onMove);
  canvas.addEventListener('mouseleave',()=>UI.hideHover());
  canvas.addEventListener('mousedown',e=>{if(gameOver||!started)return;e.preventDefault();onMove(e);tryDrop()});

  /* === ボトムドロップゾーン + ドラッグ・トゥ・アンサー ===========
   * 1) 指を画面下端 (drop-zone) に到達させると tryDrop で出題
   * 2) 出題後はそのままドラッグで選択肢ハイライト
   * 3) 指を離した位置の選択肢が自動で選ばれる（onAnswer 実行）
   * 4) 指を離した位置が選択肢上でなければ通常タップ動作に委ねる
   * ============================================================ */
  let touchStart = null;
  let quizArmedByDrag = false;
  let lastChoiceEl = null;
  const dropZoneEl = document.getElementById('drop-zone');

  function inBottomZone(clientY){
    // 視覚ストリップは極細だが、判定範囲は上方向に +14px だけ広げて
    // 「指でちゃんと届くが誤タッチでは入らない」帯にする
    if(dropZoneEl){
      const r = dropZoneEl.getBoundingClientRect();
      return clientY >= r.top - 14;
    }
    return clientY >= window.innerHeight - 28;
  }
  function highlightChoiceAt(clientX, clientY){
    if(!UI.isQuizOpen()) return;
    const el = document.elementFromPoint(clientX, clientY);
    const opt = el && el.closest ? el.closest('.quiz-opt') : null;
    if(opt === lastChoiceEl) return;
    if(lastChoiceEl) lastChoiceEl.classList.remove('finger-over');
    lastChoiceEl = opt || null;
    if(lastChoiceEl) lastChoiceEl.classList.add('finger-over');
  }
  function clearChoiceHighlight(){
    if(lastChoiceEl){ lastChoiceEl.classList.remove('finger-over'); lastChoiceEl=null; }
  }
  function armDropZone(on){
    if(!dropZoneEl) return;
    dropZoneEl.classList.toggle('armed', !!on);
  }

  document.addEventListener('touchstart',e=>{
    if(gameOver||!started) return;
    if(isUI(e.target)) return;          // let UI handle its own taps
    e.preventDefault();
    UI.hideHover();
    const t = e.touches[0];
    onMove(e);
    // ボトムゾーンの自動出題は「ゾーン外で開始 → 引き下ろし」の意図的動作のみ
    // 開始時点でゾーン内なら誤タッチ扱いし、自動発動はしない（タップでの通常出題は touchend 側で）
    touchStart={
      t:performance.now(),
      inspect:!!hoverBody,
      startedAbove: !inBottomZone(t.clientY),
    };
    armDropZone(true);
  },{passive:false});

  document.addEventListener('touchmove',e=>{
    if(gameOver||!started||!touchStart) return;
    e.preventDefault();
    const t = e.touches[0];

    // 出題中: 指の下の選択肢をハイライト（落下位置は出題時点で固定）
    if(UI.isQuizOpen()){
      highlightChoiceAt(t.clientX, t.clientY);
      return;
    }

    // 出題前: 通常の照準ガイド更新
    onMove(e);

    // 「ゾーン外スタート → 引き下ろしでゾーン突入」のみ自動出題
    if(touchStart.startedAbove && inBottomZone(t.clientY)){
      quizArmedByDrag = true;
      tryDrop();
      requestAnimationFrame(()=>highlightChoiceAt(t.clientX, t.clientY));
    }
  },{passive:false});

  document.addEventListener('touchend',e=>{
    if(gameOver||!started||!touchStart){
      touchStart=null; quizArmedByDrag=false; clearChoiceHighlight(); armDropZone(false); return;
    }
    e.preventDefault();
    const ct = (e.changedTouches && e.changedTouches[0]) || null;

    // 出題中: 指の下に選択肢があれば自動選択（既存クリックハンドラを発火）
    if(UI.isQuizOpen()){
      let opt = lastChoiceEl;
      if(!opt && ct){
        const el = document.elementFromPoint(ct.clientX, ct.clientY);
        opt = el && el.closest ? el.closest('.quiz-opt') : null;
      }
      clearChoiceHighlight();
      armDropZone(false);
      if(opt){
        // 既存ハンドラに委譲 → 正解判定 + 果物落下 + タイマー解除まで一括
        opt.click();
      }
      // 選択肢上で離していなければクイズは開いたまま（タップで通常選択可能）
      quizArmedByDrag = false;
      touchStart = null;
      return;
    }

    // 出題前 → 既存仕様: 単語ホバー or tryDrop
    const dt=performance.now()-touchStart.t;
    if(touchStart.inspect && dt<500){
      setTimeout(()=>UI.hideHover(),1600);
    } else if(!quizArmedByDrag){
      tryDrop();
      UI.hideHover();
    } else {
      UI.hideHover();
    }
    quizArmedByDrag=false;
    touchStart=null;
    armDropZone(false);
  },{passive:false});

  document.addEventListener('touchcancel',()=>{
    touchStart=null; quizArmedByDrag=false;
    clearChoiceHighlight(); armDropZone(false);
    UI.hideHover();
  });
  document.addEventListener('keydown',e=>{
    if(gameOver) return;
    if(e.key==='ArrowLeft')  dropX=Math.max(0,dropX-16);
    if(e.key==='ArrowRight') dropX=Math.min(WIDTH,dropX+16);
    if(e.key===' '||e.key==='Enter'){e.preventDefault();tryDrop()}
  });

  /* ===== Mode / restart =====
   * 2. ゲーム中にモード変更 → 既存の restart ロジックで盤面リセット。
   *    ゲーム未開始（!started）でも setMode を呼べば即時開始する。
   */
  function setMode(m){
    if(m==='custom'){
      const list=Storage.getActiveCustom();
      if(!list || !list.words || list.words.length<3){ openCustomPicker(); return; }
      mode=m; chain=list.words;
    } else {
      mode=m; chain=CHAINS[m]||CHAINS.normal;
    }
    rng = (m==='daily') ? mulberry32(dailySeed()) : Math.random;
    document.querySelectorAll('.m').forEach(b=>b.classList.toggle('active', b.getAttribute('data-mode')===m));
    started = true;
    UI.hideStart();
    restart();
  }
  function openCustomPicker(){
    UI.renderCustomList(
      (id)=>{ Storage.setActiveCustom(id); UI.close('m-custom'); setMode('custom'); },
      (id)=>{ const l=Storage.getCustom(id); UI.openCustomEdit(l, saveCustomList, deleteCustomList); }
    );
    UI.open('m-custom');
  }
  function saveCustomList(list){
    if(!list.id) list.id='cl_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6);
    Storage.saveCustom(list);
    Storage.setActiveCustom(list.id);
    UI.close('m-custom-edit'); UI.close('m-custom');
    setMode('custom');
  }
  function deleteCustomList(id){
    Storage.deleteCustom(id);
    UI.close('m-custom-edit');
    openCustomPicker();
  }
  function restart(){
    if(gameOverTo){clearTimeout(gameOverTo); gameOverTo=0}
    UI.close('m-over'); UI.hideHover(); UI.hideQuiz();
    score=0; combo=0; lastMergeAt=0;
    maxLevelThisRun=1; learnedThisRun=new Set();
    gameOver=false; hoverBody=null; bgPulse=0;
    dropX=WIDTH/2; lastDropAt=0;
    particles.length=0;            // 5. パーティクルもクリア
    nextLevel=pickSpawn();
    buildWorld();
    UI.setScore(0); UI.setCombo(1);
    UI.renderTree(chain, Storage.get().maxLevelReached);
    drawNext();
  }

  /* ===== Responsive sizing — JS-driven for guaranteed fit ===== */
  function syncLayout(){
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
    document.querySelectorAll('.m').forEach(b=>b.addEventListener('click',()=>{
      const mm=b.getAttribute('data-mode');
      if(mm==='custom') openCustomPicker();
      else setMode(mm);
    }));
    const newBtn=$('b-custom-new');
    if(newBtn) newBtn.addEventListener('click',()=>{
      UI.openCustomEdit({id:null, name:'', words:[]}, saveCustomList, deleteCustomList);
    });

    // Hamburger menu toggle + close-on-outside
    const menu = $('menu');
    const closeMenu = () => menu.classList.remove('show');
    $('b-menu').addEventListener('click', e=>{
      e.stopPropagation();
      menu.classList.toggle('show');
    });
    document.addEventListener('click', e=>{
      if(menu.classList.contains('show') && !menu.contains(e.target) && e.target.id !== 'b-menu'){
        closeMenu();
      }
    });
    document.addEventListener('touchstart', e=>{
      if(menu.classList.contains('show') && !menu.contains(e.target) && e.target.id !== 'b-menu'){
        closeMenu();
      }
    }, {passive:true});

    $('b-reset').addEventListener('click',()=>{closeMenu(); if(confirm('リセットしますか？')) restart()});
    $('b-mute').addEventListener('click',()=>{closeMenu(); UI.setMute(Storage.toggleMute())});
    $('b-help').addEventListener('click',()=>{closeMenu(); UI.open('m-help')});
    $('b-glossary').addEventListener('click',()=>{closeMenu(); UI.renderGlossary(); UI.open('m-glossary')});

    // 進化リスト表示は UI から削除済み。要素がある場合だけクリックを有効化（互換用）
    const treeEl = $('tree');
    if(treeEl) treeEl.addEventListener('click',()=>{UI.renderChainList(chain,Storage.get().maxLevelReached);UI.open('m-tree')});
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

    /* ===== 2. スタート画面 ===== */
    // 初回ロード: ゲームを始めず、まず空盤面と Start 画面を表示。
    mode='normal'; chain=CHAINS.normal; rng=Math.random;
    buildWorld();
    UI.setScore(0); UI.setCombo(1);
    UI.renderTree(chain, Storage.get().maxLevelReached);
    drawNext();

    let pickedMode = null;
    const startModes = document.getElementById('start-modes');
    const bStart = document.getElementById('b-start');
    if(startModes && bStart){
      startModes.querySelectorAll('.sm').forEach(btn=>{
        btn.addEventListener('click',()=>{
          startModes.querySelectorAll('.sm').forEach(b=>b.classList.remove('picked'));
          btn.classList.add('picked');
          pickedMode = btn.getAttribute('data-mode');
          bStart.disabled = false;
          bStart.textContent = (pickedMode==='custom') ? '自作リストを選ぶ' : 'START';
        });
      });
      bStart.addEventListener('click',()=>{
        if(!pickedMode) return;
        if(pickedMode==='custom'){
          // 自作リスト未選択なら既存ピッカーを開く（start は背後に残す → キャンセル時に戻れる）
          const active = Storage.getActiveCustom();
          if(!active || !active.words || active.words.length<3){
            openCustomPicker();
            return;
          }
        }
        setMode(pickedMode);
      });
    }
    UI.showStart();

    requestAnimationFrame(frame);
  }

  return { init, restart, setMode };
})();

window.UI = UI;
window.addEventListener('load', Game.init);
