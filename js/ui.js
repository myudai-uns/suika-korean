/* ============================================================
 * ui.js — DOM updates, modals, popups, hover tooltip
 * ============================================================ */

const UI = (() => {
  const $ = id => document.getElementById(id);

  function setScore(s){
    $('score').textContent = s.toLocaleString();
  }
  function setHi(s){
    $('hi-score').textContent = s.toLocaleString();
  }
  function setCombo(n){
    const card = $('combo-card');
    $('combo-n').textContent = n;
    if(n > 1){
      card.classList.add('active');
      card.style.transform = 'scale(1.18)';
      requestAnimationFrame(()=>{ card.style.transform = ''; });
    } else {
      card.classList.remove('active');
    }
  }

  function popScore(x, y, text, combo=false){
    const wrap = $('popups');
    const el = document.createElement('div');
    el.className = 'pop-score' + (combo ? ' combo' : '');
    el.textContent = text;
    el.style.left = x + 'px';
    el.style.top  = y + 'px';
    wrap.appendChild(el);
    setTimeout(()=>el.remove(), 1000);
  }

  function showHover(x, y, body){
    const card = $('hover-card');
    const d = body.data || {};
    card.innerHTML = `<b>${d.word || ''}</b><span class="meaning">${d.meaning || ''}</span><span class="roma">${d.roma || ''}</span>`;
    card.style.left = x + 'px';
    card.style.top  = y + 'px';
    card.style.display = 'block';
  }
  function hideHover(){ $('hover-card').style.display = 'none'; }

  function shakeCanvas(intensity = 8){
    const wrap = $('canvas-wrap');
    let t = 0;
    const start = performance.now();
    function loop(now){
      const elapsed = now - start;
      if(elapsed > 320){ wrap.style.transform = ''; return; }
      const decay = 1 - elapsed / 320;
      const dx = (Math.random()-0.5) * intensity * decay * 2;
      const dy = (Math.random()-0.5) * intensity * decay * 2;
      wrap.style.transform = `translate(${dx}px,${dy}px)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function renderChainList(chain, maxReached){
    let html = '';
    for(let i = 0; i < chain.length; i++){
      const lv = i + 1;
      const it = chain[i];
      const unlocked = lv <= maxReached;
      html += `<div class="chain-row ${unlocked?'unlocked':''}">
        <span class="ch-lv">${lv}</span>
        <span class="ch-dot" style="background:${PASTEL[i]}"></span>
        <span class="ch-w">${unlocked ? it.word : '？？？'}</span>
        <span class="ch-m">${unlocked ? it.meaning : ''}</span>
      </div>`;
    }
    const list = $('chain-list');
    if(list) list.innerHTML = html;
    const modalList = $('chain-list-modal');
    if(modalList) modalList.innerHTML = html;
  }

  function openModal(id){ $(id).classList.add('show'); }
  function closeModal(id){ $(id).classList.remove('show'); }

  function showGameOver(score, best, maxLevel, learnedThisRun){
    $('r-score').textContent = score.toLocaleString();
    $('r-best').textContent  = best.toLocaleString();
    $('r-max').textContent   = 'Lv.' + maxLevel;
    $('r-learned').textContent = learnedThisRun;
    openModal('m-over');
  }

  function renderGlossary(){
    const data = Storage.get();
    const learned = data.learnedWords;
    const allWords = [];
    Object.values(CHAINS).forEach(chain => {
      chain.forEach((item, idx) => {
        allWords.push({ ...item, level: idx+1 });
      });
    });
    // Dedupe by word
    const seen = new Set();
    const uniq = allWords.filter(w => {
      if(seen.has(w.word)) return false;
      seen.add(w.word);
      return true;
    });

    const learnedCount = uniq.filter(w => learned[w.word]).length;

    $('g-stats').innerHTML = `
      <div class="gs">語数 <b>${learnedCount}/${uniq.length}</b></div>
      <div class="gs">プレイ <b>${data.playCount}</b></div>
      <div class="gs">最高Lv <b>${data.maxLevelReached}</b></div>
      <div class="gs">BEST <b>${data.highScore.toLocaleString()}</b></div>
    `;

    const html = uniq.sort((a,b)=>a.level-b.level).map(w => {
      const ok = !!learned[w.word];
      const cnt = ok ? learned[w.word].count : 0;
      return `<div class="gloss-item ${ok?'':'locked'}">
        <span class="gko">${ok ? w.word : '？？？'}</span>
        <span class="gja">${ok ? w.meaning : '未取得'}</span>
        <span class="gn">Lv.${w.level} ${ok ? '・x'+cnt : ''}</span>
      </div>`;
    }).join('');
    $('glossary-list').innerHTML = html;
  }

  function setMuteIcon(muted){
    $('btn-mute').textContent = muted ? '🔇 OFF' : '🔊 音';
  }

  return {
    setScore, setHi, setCombo, popScore,
    showHover, hideHover, shakeCanvas,
    renderChainList, openModal, closeModal,
    showGameOver, renderGlossary, setMuteIcon,
  };
})();
