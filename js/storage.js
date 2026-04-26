/* ============================================================
 * storage.js — localStorage wrapper
 * ============================================================ */

const Storage = (() => {
  const KEY = 'suika_korean_v1';

  function defaults(){
    return {
      highScore: 0,
      highScoreByMode: { normal:0, daily:0, kpop:0, review:0 },
      learnedWords: {},   // { "안녕": { count: n, lastSeen: ts, mode } }
      mistakeWords: {},   // words that were on board at game over (low mastery)
      playCount: 0,
      maxLevelReached: 1,
      muted: false,
      dailyDoneOn: null,  // YYYYMMDD when last daily completed
      dailyBest: 0,
    };
  }

  let cache = load();

  function load(){
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return defaults();
      return Object.assign(defaults(), JSON.parse(raw));
    } catch(e){
      return defaults();
    }
  }

  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch(e){}
  }

  return {
    get(){ return cache; },
    set(patch){ Object.assign(cache, patch); save(); },
    save,
    setHighScore(score, mode){
      let dirty = false;
      if(score > cache.highScore){ cache.highScore = score; dirty = true; }
      if(score > (cache.highScoreByMode[mode] || 0)){
        cache.highScoreByMode[mode] = score; dirty = true;
      }
      if(dirty) save();
    },
    learn(word){
      const w = cache.learnedWords[word] || { count:0, firstSeen: Date.now() };
      w.count = (w.count || 0) + 1;
      w.lastSeen = Date.now();
      cache.learnedWords[word] = w;
      // If previously a mistake, clear since they're learning it again
      if(cache.mistakeWords[word]){
        const m = cache.mistakeWords[word];
        m.count = Math.max(0, (m.count||0) - 1);
        if(m.count <= 0) delete cache.mistakeWords[word];
      }
      save();
    },
    addMistake(word){
      const m = cache.mistakeWords[word] || { count:0 };
      m.count = (m.count || 0) + 1;
      m.ts = Date.now();
      cache.mistakeWords[word] = m;
      save();
    },
    incrementPlay(){ cache.playCount++; save(); },
    setMaxLevel(lv){ if(lv > cache.maxLevelReached){ cache.maxLevelReached = lv; save(); } },
    toggleMute(){ cache.muted = !cache.muted; save(); return cache.muted; },
    reset(){ cache = defaults(); save(); },
  };
})();
