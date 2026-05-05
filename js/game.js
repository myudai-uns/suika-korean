/* ============================================================
 * game.js — Main loop, input, rendering, mode logic
 * ============================================================ */

const Game = (() => {
  const $ = id => document.getElementById(id);

  const canvas = $('game');
  const ctx = canvas.getContext('2d');
  const nextCanvas = $('next-canvas');
  const nextCtx = nextCanvas.getContext('2d');

  // World setup
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const CEILING = 90;          // danger line
  const SPAWN_Y = 50;          // y at which preview floats
  const COMBO_TIMEOUT = 1400;  // ms

  let world;
  let mode = 'normal';
  let chain = CHAINS.normal;
  let rng = Math.random;
  let score = 0;
  let combo = 0;
  let lastMergeAt = 0;
  let maxLevelThisRun = 1;
  let learnedThisRun = new Set();
  let nextLevel = pickSpawnLevel();
  let dropX = WIDTH / 2;
  let canDrop = true;
  let dropCooldown = 550; // ms between drops
  let lastDropAt = 0;
  let gameOver = false;
  let hoverBody = null;
  let bgPulse = 0;
  let gameOverTimeoutId = 0;

  /* ===== SOUND (WebAudio synth) ===== */
  let audioCtx = null;
  function ensureAudio(){
    if(!audioCtx){
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ audioCtx = null; }
    }
  }
  function sfx(type, level=1){
    if(Storage.get().muted) return;
    ensureAudio();
    if(!audioCtx) return;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    if(type === 'merge'){
      const f = 220 + level * 60;
      o.type = 'sine';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.18);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.32);
    } else if(type === 'drop'){
      o.type = 'triangle';
      o.frequency.setValueAtTime(440, t);
      o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      o.start(t); o.stop(t + 0.2);
    } else if(type === 'over'){
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(280, t);
      o.frequency.exponentialRampToValueAtTime(60, t + 0.6);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      o.start(t); o.stop(t + 0.7);
    } else if(type === 'combo'){
      const f = 660 + level * 80;
      o.type = 'square';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.1);
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2);
    }
  }

  /* ===== Spawn level picker ===== */
  function pickSpawnLevel(){
    // Bias toward smaller levels; review mode biases higher levels of mistake words
    if(mode === 'review'){
      // Try to spawn a level whose chain word is in mistakeWords
      const m = Storage.get().mistakeWords;
      const mistakeLevels = [];
      chain.forEach((it, i) => {
        if(m[it.word] && i+1 <= 5) mistakeLevels.push(i+1);
      });
      if(mistakeLevels.length && rng() < 0.55){
        return mistakeLevels[Math.floor(rng() * mistakeLevels.length)];
      }
    }
    return SPAWN_LEVELS[Math.floor(rng() * SPAWN_LEVELS.length)];
  }

  /* ===== Setup world ===== */
  function buildWorld(){
    world = new World({
      width: WIDTH, height: HEIGHT,
      gravity: 0.55, ceiling: CEILING,
    });
    world.on('merge', onMerge);
    world.on('ceiling', onCeiling);
  }

  function onMerge(a, b, nx, ny){
    if(a.markedForRemoval || b.markedForRemoval) return;
    a.markedForRemoval = true;
    b.markedForRemoval = true;
    const newLevel = a.level + 1;
    const cx = (a.x + b.x) / 2;
    const cy = (a.y + b.y) / 2;
    // (Bodies are swept after physics step — don't remove here)

    // Score
    const base = newLevel * newLevel * 10;
    const now = performance.now();
    if(now - lastMergeAt < COMBO_TIMEOUT) combo++;
    else combo = 1;
    lastMergeAt = now;
    const mult = 1 + (combo - 1) * 0.5;
    const gained = Math.round(base * mult);
    score += gained;
    UI.setScore(score);
    UI.setCombo(combo);

    // Pop visual (convert canvas-internal coords to screen px)
    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / canvas.width;
    const sy = rect.height / canvas.height;
    UI.popScore(rect.left + cx * sx, rect.top + cy * sy, '+' + gained, combo > 1);

    // Spawn next-level body if exists in chain
    if(newLevel <= chain.length){
      const data = chain[newLevel - 1];
      const r = RADII[newLevel - 1];
      const body = new Body({
        x: cx, y: cy,
        radius: r, level: newLevel,
        data: { ...data, color: PASTEL[newLevel - 1] },
      });
      body.scale = 0.2;
      body.lastMergeFlash = performance.now();
      world.add(body);
      // Mark as learned
      Storage.learn(data.word);
      learnedThisRun.add(data.word);
      maxLevelThisRun = Math.max(maxLevelThisRun, newLevel);
      Storage.setMaxLevel(maxLevelThisRun);
      // Re-render chain ladder if new max
      UI.renderChainList(chain, Storage.get().maxLevelReached);

      sfx('merge', newLevel);
      if(combo >= 2) sfx('combo', combo);
      if(newLevel >= 6){
        UI.shakeCanvas(Math.min(18, 4 + newLevel));
        bgPulse = 1;
      }
      // Reaching final level: massive bonus
      if(newLevel === chain.length){
        score += 5000;
        UI.setScore(score);
        UI.popScore(rect.left + cx * sx, rect.top + (cy - 30) * sy, '+5000 LEGEND!', true);
        UI.shakeCanvas(24);
      }
    } else {
      // Already at max — destroy two and award bonus
      score += 1000;
      UI.setScore(score);
      sfx('merge', 11);
    }
  }

  function onCeiling(body){
    if(gameOver) return;
    triggerGameOver();
  }

  /* ===== Game over ===== */
  function triggerGameOver(){
    gameOver = true;
    sfx('over');
    UI.shakeCanvas(20);

    // Mark everything still on board as a "mistake"
    for(const b of world.bodies){
      if(!b.frozen && b.data && b.data.word) Storage.addMistake(b.data.word);
    }
    Storage.setHighScore(score, mode);
    Storage.incrementPlay();

    if(gameOverTimeoutId) clearTimeout(gameOverTimeoutId);
    gameOverTimeoutId = setTimeout(()=>{
      gameOverTimeoutId = 0;
      if(gameOver){
        const data = Storage.get();
        UI.showGameOver(score, data.highScore, maxLevelThisRun, learnedThisRun.size);
      }
    }, 700);
  }

  /* ===== Drop ===== */
  function tryDrop(){
    if(gameOver) return;
    const now = performance.now();
    if(now - lastDropAt < dropCooldown) return;
    lastDropAt = now;
    const lv = nextLevel;
    const data = chain[lv - 1];
    const r = RADII[lv - 1];
    const x = Math.max(r, Math.min(WIDTH - r, dropX));
    const body = new Body({
      x, y: SPAWN_Y, radius: r, level: lv,
      data: { ...data, color: PASTEL[lv - 1] },
    });
    body.scale = 0.5;
    world.add(body);
    sfx('drop');
    nextLevel = pickSpawnLevel();
    drawNextPreview();
  }

  /* ===== Rendering ===== */
  function clear(){
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // Background — soft gradient
    const g = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    g.addColorStop(0, '#fff7ee');
    g.addColorStop(1, '#ffe6e0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Wall striping (decorative)
    ctx.fillStyle = 'rgba(255,180,210,0.06)';
    for(let i = 0; i < HEIGHT; i += 24){
      ctx.fillRect(0, i, WIDTH, 12);
    }
  }

  function drawCeiling(){
    // Danger line
    ctx.strokeStyle = bgPulse > 0 ? `rgba(255,80,120,${0.3 + bgPulse*0.7})` : 'rgba(255,170,200,0.6)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CEILING);
    ctx.lineTo(WIDTH, CEILING);
    ctx.stroke();
    ctx.setLineDash([]);
    if(bgPulse > 0) bgPulse = Math.max(0, bgPulse - 0.04);
  }

  function drawDropGuide(){
    if(gameOver) return;
    const lv = nextLevel;
    const r = RADII[lv - 1];
    const x = Math.max(r, Math.min(WIDTH - r, dropX));
    // Guide line
    ctx.strokeStyle = 'rgba(196,62,110,0.35)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, SPAWN_Y + r);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);
    // Ghost circle (the next item)
    drawCircleBody({
      x, y: SPAWN_Y, r, level: lv,
      data: { ...chain[lv - 1], color: PASTEL[lv - 1] },
      angle: 0, scale: 1,
    }, 0.85);
  }

  function drawCircleBody(b, alpha = 1){
    const r = b.r * (b.scale ?? 1);
    const color = b.data.color || PASTEL[b.level - 1];
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle || 0);
    ctx.globalAlpha = alpha;

    // Drop shadow
    ctx.beginPath();
    ctx.arc(0, r * 0.15, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fill();

    // Body — radial gradient for cute 3D feel
    const grad = ctx.createRadialGradient(-r*0.35, -r*0.4, r*0.1, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.25, lighten(color, 0.15));
    grad.addColorStop(1, color);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = darken(color, 0.18);
    ctx.lineWidth = Math.max(1.5, r * 0.05);
    ctx.stroke();

    // Highlight
    ctx.beginPath();
    ctx.ellipse(-r*0.35, -r*0.4, r*0.35, r*0.18, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();

    // Word text — fit
    const word = b.data.word || '';
    const fontSize = fitFontSize(word, r * 1.7, r * 0.65);
    ctx.fillStyle = darken(color, 0.55);
    ctx.font = `900 ${fontSize}px "Hiragino Maru Gothic ProN","Yu Gothic UI",system-ui,sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 0, 0);

    // Merge flash
    const now = performance.now();
    if(b.lastMergeFlash){
      const dt = now - b.lastMergeFlash;
      if(dt < 320){
        const a = 1 - dt / 320;
        ctx.beginPath();
        ctx.arc(0, 0, r * (1 + (1 - a) * 0.3), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,220,80,${a})`;
        ctx.lineWidth = 4 * a;
        ctx.stroke();
      } else b.lastMergeFlash = 0;
    }

    ctx.restore();
  }

  function fitFontSize(text, maxWidth, baseSize){
    // Quick estimate
    let size = baseSize;
    ctx.font = `900 ${size}px sans-serif`;
    let w = ctx.measureText(text).width;
    if(w > maxWidth){
      size = size * (maxWidth / w);
    }
    return Math.max(8, Math.min(baseSize, size));
  }

  function lighten(hex, amt){
    const c = hexToRgb(hex);
    return `rgb(${Math.min(255, c.r + 255*amt)|0},${Math.min(255, c.g + 255*amt)|0},${Math.min(255, c.b + 255*amt)|0})`;
  }
  function darken(hex, amt){
    const c = hexToRgb(hex);
    return `rgb(${Math.max(0, c.r - 255*amt)|0},${Math.max(0, c.g - 255*amt)|0},${Math.max(0, c.b - 255*amt)|0})`;
  }
  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if(!m) return {r:200,g:200,b:200};
    return { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) };
  }

  function drawNextPreview(){
    const w = nextCanvas.width;
    const h = nextCanvas.height;
    nextCtx.clearRect(0, 0, w, h);
    const lv = nextLevel;
    const data = chain[lv - 1];
    const r = Math.min(RADII[lv-1], w*0.4);
    const cx = w/2, cy = h/2;
    nextCtx.save();
    const grad = nextCtx.createRadialGradient(cx-r*0.35, cy-r*0.4, r*0.1, cx, cy, r);
    const color = PASTEL[lv-1];
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.25, lighten(color, 0.15));
    grad.addColorStop(1, color);
    nextCtx.beginPath();
    nextCtx.arc(cx, cy, r, 0, Math.PI*2);
    nextCtx.fillStyle = grad; nextCtx.fill();
    nextCtx.strokeStyle = darken(color, 0.18); nextCtx.lineWidth = 2; nextCtx.stroke();
    nextCtx.fillStyle = darken(color, 0.55);
    const fs = fitFontSizeOn(nextCtx, data.word, r*1.7, r*0.55);
    nextCtx.font = `900 ${fs}px "Hiragino Maru Gothic ProN","Yu Gothic UI",sans-serif`;
    nextCtx.textAlign = 'center'; nextCtx.textBaseline = 'middle';
    nextCtx.fillText(data.word, cx, cy);
    nextCtx.restore();
  }
  function fitFontSizeOn(c, text, maxWidth, baseSize){
    let s = baseSize;
    c.font = `900 ${s}px sans-serif`;
    const w = c.measureText(text).width;
    if(w > maxWidth) s = s * (maxWidth/w);
    return Math.max(7, Math.min(baseSize, s));
  }

  function frame(){
    if(!gameOver){
      world.step(1);
    }
    clear();
    drawCeiling();

    for(const b of world.bodies){
      drawCircleBody(b);
    }

    drawDropGuide();

    // Combo decay
    if(combo > 0 && performance.now() - lastMergeAt > COMBO_TIMEOUT){
      if(combo > 1){ combo = 0; UI.setCombo(1); }
    }

    requestAnimationFrame(frame);
  }

  /* ===== Input ===== */
  function relativeX(evt){
    const rect = canvas.getBoundingClientRect();
    const t = evt.touches ? evt.touches[0] : evt;
    const x = (t.clientX - rect.left) * (canvas.width / rect.width);
    return Math.max(0, Math.min(WIDTH, x));
  }
  function onMove(evt){
    dropX = relativeX(evt);
    // Hover detection
    const rect = canvas.getBoundingClientRect();
    const t = evt.touches ? evt.touches[0] : evt;
    const cx = (t.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (t.clientY - rect.top)  * (canvas.height / rect.height);
    let found = null;
    for(const b of world.bodies){
      const dx = b.x - cx, dy = b.y - cy;
      if(dx*dx + dy*dy < b.r*b.r){ found = b; break; }
    }
    hoverBody = found;
    if(found && cy > SPAWN_Y + 60){
      const sx = rect.width / canvas.width;
      const sy = rect.height / canvas.height;
      const px = rect.left + found.x * sx;
      const py = rect.top  + (found.y - found.r) * sy;
      UI.showHover(px, py, found);
    } else {
      UI.hideHover();
    }
  }
  function onClick(evt){
    if(gameOver) return;
    evt.preventDefault();
    dropX = relativeX(evt);
    tryDrop();
  }
  function onLeave(){ UI.hideHover(); }

  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseleave', onLeave);
  canvas.addEventListener('mousedown', onClick);

  // Touch: drag to aim, lift to drop. Cancel if user dragged onto an existing
  // body (treated as inspection — no drop).
  let touchStart = null;
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    if(gameOver) return;
    UI.hideHover();
    onMove(e); // sets dropX & hoverBody
    touchStart = { x: dropX, t: performance.now(), inspect: !!hoverBody };
  }, {passive:false});
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if(gameOver) return;
    onMove(e);
  }, {passive:false});
  canvas.addEventListener('touchend', e => {
    e.preventDefault();
    if(gameOver || !touchStart) { touchStart = null; return; }
    const dt = performance.now() - touchStart.t;
    // If user tapped directly on an existing body, treat as inspect
    // (show hover briefly) instead of drop.
    if(touchStart.inspect && dt < 500){
      // Hover already shown via onMove
      setTimeout(()=>UI.hideHover(), 1600);
    } else {
      tryDrop();
      UI.hideHover();
    }
    touchStart = null;
  }, {passive:false});
  canvas.addEventListener('touchcancel', () => { touchStart = null; UI.hideHover(); });

  // Keyboard arrow nudging + space to drop
  document.addEventListener('keydown', e => {
    if(gameOver) return;
    if(e.key === 'ArrowLeft'){ dropX = Math.max(0, dropX - 16); }
    if(e.key === 'ArrowRight'){ dropX = Math.min(WIDTH, dropX + 16); }
    if(e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); tryDrop(); }
  });

  /* ===== Mode switching ===== */
  function setMode(m){
    mode = m;
    chain = CHAINS[m] || CHAINS.normal;
    if(m === 'daily'){
      rng = mulberry32(dailySeed());
    } else {
      rng = Math.random;
    }
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-mode') === m);
    });
    restart();
  }

  function restart(){
    if(gameOverTimeoutId){ clearTimeout(gameOverTimeoutId); gameOverTimeoutId = 0; }
    UI.closeModal('m-over');
    UI.hideHover();
    score = 0; combo = 0; lastMergeAt = 0;
    maxLevelThisRun = 1;
    learnedThisRun = new Set();
    gameOver = false;
    hoverBody = null;
    bgPulse = 0;
    dropX = WIDTH / 2;
    lastDropAt = 0;
    nextLevel = pickSpawnLevel();
    buildWorld();
    UI.setScore(0);
    UI.setCombo(1);
    UI.renderChainList(chain, Storage.get().maxLevelReached);
    drawNextPreview();
  }

  /* ===== Responsive sizing ===== */
  function fitCanvasWrap(){
    const stage = document.querySelector('.stage');
    const wrap  = document.getElementById('canvas-wrap');
    const tools = document.querySelector('.toolbar');
    const sideL = document.querySelector('.side-l');
    const sideR = document.querySelector('.side-r');
    if(!stage || !wrap) return;

    // Reset previous explicit sizing so we measure stage's natural available
    // space — otherwise we'd carry over a stale (possibly too-tall) value
    // that already pushed the toolbar out of view.
    wrap.style.width  = '';
    wrap.style.height = '';

    const cs = getComputedStyle(stage);
    const isColumn = cs.flexDirection === 'column' || cs.flexDirection === 'column-reverse';
    const gap = parseFloat(cs.rowGap || cs.gap) || parseFloat(cs.columnGap || cs.gap) || 6;

    const lVisible = sideL && sideL.offsetParent !== null;
    const rVisible = sideR && sideR.offsetParent !== null;
    const lW = lVisible ? sideL.offsetWidth  : 0;
    const lH = lVisible ? sideL.offsetHeight : 0;
    const rW = rVisible ? sideR.offsetWidth  : 0;
    const rH = rVisible ? sideR.offsetHeight : 0;

    let availW, availH;
    if(isColumn){
      availW = Math.max(80, stage.clientWidth);
      const sideHs = (lH > 0 ? lH + gap : 0) + (rH > 0 ? rH + gap : 0);
      availH = Math.max(80, stage.clientHeight - sideHs);
    } else {
      const sideWs = (lW > 0 ? lW + gap : 0) + (rW > 0 ? rW + gap : 0);
      availW = Math.max(80, stage.clientWidth - sideWs);
      availH = Math.max(80, stage.clientHeight);
    }
    const ratio = WIDTH / HEIGHT; // 420/640
    let w = availW;
    let h = w / ratio;
    if(h > availH){ h = availH; w = h * ratio; }

    // SAFETY NET — guarantee the resulting wrap rectangle stays inside the
    // visible viewport (handles iOS Safari URL-bar overlay edge cases where
    // CSS-computed available space can be optimistic).
    const stageTop = stage.getBoundingClientRect().top;
    const toolH = tools ? tools.offsetHeight : 0;
    const toolMargin = tools ? parseFloat(getComputedStyle(tools).marginTop) || 0 : 0;
    const safeBottom = (window.visualViewport ? window.visualViewport.height : window.innerHeight)
                     - toolH - toolMargin - 4;
    if(stageTop + h > safeBottom){
      h = Math.max(80, safeBottom - stageTop);
      w = h * ratio;
    }

    wrap.style.width  = Math.floor(w) + 'px';
    wrap.style.height = Math.floor(h) + 'px';
  }

  /* ===== Boot ===== */
  function init(){
    // Bind tabs
    document.querySelectorAll('.mode-btn').forEach(b => {
      b.addEventListener('click', () => setMode(b.getAttribute('data-mode')));
    });
    // Toolbar
    $('btn-restart').addEventListener('click', () => {
      if(!confirm('リトライしますか？現在のスコアは破棄されます。')) return;
      restart();
    });
    $('btn-mute').addEventListener('click', () => {
      const m = Storage.toggleMute();
      UI.setMuteIcon(m);
    });
    $('btn-help').addEventListener('click', () => UI.openModal('m-help'));
    $('btn-tree').addEventListener('click', () => {
      UI.renderChainList(chain, Storage.get().maxLevelReached);
      UI.openModal('m-chain');
    });
    $('btn-glossary').addEventListener('click', () => { UI.renderGlossary(); UI.openModal('m-glossary'); });
    // Modal buttons
    $('r-again').addEventListener('click', () => { UI.closeModal('m-over'); restart(); });
    $('r-glossary').addEventListener('click', () => { UI.closeModal('m-over'); UI.renderGlossary(); UI.openModal('m-glossary'); });

    UI.setMuteIcon(Storage.get().muted);
    UI.setHi(Storage.get().highScore);
    fitCanvasWrap();
    // CSS 100svh handles app height. We just need to refit the canvas when
    // the viewport actually changes (rotation, keyboard, chrome show/hide).
    const onViewportChange = () => fitCanvasWrap();
    const refitDelayed = () => {
      onViewportChange();
      setTimeout(onViewportChange, 100);
      setTimeout(onViewportChange, 350);
    };
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', refitDelayed);
    window.addEventListener('pageshow', refitDelayed);
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', onViewportChange);
    }
    refitDelayed();
    setMode('normal');
    requestAnimationFrame(frame);
  }

  return { init, restart, setMode };
})();

window.addEventListener('load', Game.init);
