/* ============================================================
   التجوّل داخل الأماكن: نفس الشخصية تمشي في كل مشهد
   - لابتوب: الأسهم أو WASD
   - هاتف: لمس/سحب على المشهد + أزرار D-pad
   - الجبل يبقى بعالمه المستقل (mountain.js)
   ============================================================ */
(function (A) {
  const G = A.game;
  const VW = 480, VH = 270;

  // حدود المشي لكل مكان (إحداثيات المشهد 480×270)
  const BOUNDS = {
    village: { x0: 38, x1: 1122, y0: 208, y1: 252 },
    palace:  { x0: 150, x1: 330, y0: 226, y1: 258 },
    forest:  { x0: 36, x1: 444, y0: 204, y1: 250 },
    mine:    { x0: 36, x1: 444, y0: 216, y1: 254 },
    ruins:   { x0: 40, x1: 440, y0: 220, y1: 256 },
    market:  { x0: 40, x1: 440, y0: 236, y1: 258 },
    jinn:    { x0: 40, x1: 440, y0: 214, y1: 252 },
  };
  // عوالم أعرض من الشاشة: الكاميرا تتبع البطل (دير النار صار دربًا طويلًا)
  const WORLD_W = { village: 1160 };
  const DEFAULT_BOUNDS = { x0: 40, x1: 440, y0: 208, y1: 252 };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dirOf = (e) => {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || e.code === 'KeyW') return 'up';
    if (k === 'ArrowDown' || k === 's' || k === 'S' || e.code === 'KeyS') return 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || e.code === 'KeyA') return 'left';
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || e.code === 'KeyD') return 'right';
    return null;
  };

  const R = (A.roam = {});
  let active = false;
  let sceneId = null;
  let hero = null;
  let x = 84, y = 216;
  let facing = 1;
  let moving = false;
  let target = null;
  let dragId = null;
  let lastNow = 0;
  let camX = 0;
  let camDrawn = 0;
  const keys = { up: false, down: false, left: false, right: false };

  // كشكات/نقاط تفاعل: تقترب منها وتسأل، أو تنقر علامتها فتمشي إليها.
  let hotspots = [];
  let near = null;
  let pending = null;
  let busy = false;
  let sceneVisible = true;
  const markerEls = new Map();

  const bounds = () => BOUNDS[sceneId] || DEFAULT_BOUNDS;

  R.status = function () {
    return { active, sceneId, x, y, facing, moving, camX, near: near && near.id };
  };
  R.camX = function () { return active ? camX : 0; };

  // ---------- نقاط التفاعل ----------
  R.setHotspots = function (list) {
    hotspots = (list || []).filter(Boolean).map((h) => Object.assign({ r: 26, enabled: true }, h));
    near = null;
    pending = null;
    busy = false;
    sceneVisible = true;
    buildMarkers();
    updatePrompt();
  };

  function buildMarkers() {
    const host = A.$('.roam-markers', G.ui);
    if (!host) return;
    host.innerHTML = '';
    markerEls.clear();
    for (const h of hotspots) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'roam-mark' + (h.ready ? ' quest' : ' done');
      b.dataset.id = h.id;
      b.style.left = ((h.x - camX) / VW * 100) + '%';
      b.style.top = (((h.my != null) ? h.my : (h.y - 56)) / VH * 100) + '%';
      b.innerHTML = `<span class="mk-ico">${h.icon || '◆'}</span>`;
      b.setAttribute('aria-label', h.label || 'تفاعل');
      b.onpointerdown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (h.enabled) goToHotspot(h);
      };
      b.onclick = (e) => { e.preventDefault(); e.stopPropagation(); };
      host.appendChild(b);
      markerEls.set(h, b);
    }
  }

  function placeMarkers() {
    markerEls.forEach((el, h) => {
      el.style.left = ((h.x - camX) / VW * 100) + '%';
    });
  }

  function goToHotspot(h) {
    const b = bounds();
    const side = x < h.x ? -1 : 1;
    target = { x: clamp(h.x + side * 15, b.x0, b.x1), y: clamp(h.y + 2, b.y0, b.y1) };
    pending = h;
  }

  function interact(h) {
    if (!h || !h.enabled || busy) return;
    if (G.mode !== 'scene' || A.$('.dlg', G.dlgLayer) || A.$('.modal-bg', G.stage)) return;
    busy = true;
    if (h.actor) h.actor.flip = x < h.x;
    target = null;
    let p;
    try { p = h.onInteract && h.onInteract(h); }
    catch (err) { console.warn(err); busy = false; return; }
    if (p && typeof p.finally === 'function') p.finally(() => { busy = false; });
    else busy = false;
  }
  R.interact = interact;

  function updatePrompt() {
    const el = A.$('.roam-prompt', G.ui);
    if (!el) return;
    if (!near || !sceneVisible) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    el.innerHTML = `<span class="mk-ico">${near.icon || '◆'}</span><span>${A.esc(near.label || 'تفاعل')}</span><kbd>${coarse ? 'المس' : 'E'}</kbd>`;
    el.onclick = (e) => { e.preventDefault(); interact(near); };
  }

  function paintNear() {
    markerEls.forEach((el, h) => el.classList.toggle('near', h === near));
  }

  function setSceneVisible(v) {
    if (v === sceneVisible) return;
    sceneVisible = v;
    const mk = A.$('.roam-markers', G.ui);
    const pr = A.$('.roam-prompt', G.ui);
    if (mk) mk.classList.toggle('hidden', !v);
    if (pr) pr.classList.toggle('hidden', !v || !near);
    if (!v) moving = false;
  }

  R.attach = function (id, actor) {
    if (!G.state || !G.actors) return;
    sceneId = id || (G.state.screen && G.state.screen.id) || 'village';
    hero = actor || G.actors.find((a) => a.kind === 'hero');
    if (!hero) {
      hero = { kind: 'hero', x: 84, y: 216, s: 2.3, pose: 'idle', opts: G.heroOpts() };
      G.actors.push(hero);
    }
    const b = bounds();
    const saved = G.state.roamPos && G.state.roamPos[sceneId];
    x = clamp(saved ? saved.x : (hero.x || 84), b.x0, b.x1);
    y = clamp(saved ? saved.y : (hero.y || 216), b.y0, b.y1);
    hero.x = x;
    hero.y = y;
    hero.pose = 'idle';
    hero.bob = false;
    const worldW = WORLD_W[sceneId] || VW;
    camX = clamp(x - VW / 2, 0, Math.max(0, worldW - VW));
    camDrawn = camX;
    facing = 1;
    hero.flip = false;
    lastNow = 0;
    target = null;
    dragId = null;
    moving = false;
    hotspots = [];
    near = null;
    pending = null;
    busy = false;
    sceneVisible = true;
    markerEls.clear();
    active = true;
    R.active = true;
    A.$$('[data-rdir]', G.ui).forEach((btn) => { btn.onpointerdown = null; });
    renderUI();
    bindInput();
  };

  R.detach = function () {
    if (!active) return;
    if (G.state && sceneId) {
      G.state.roamPos = G.state.roamPos || {};
      G.state.roamPos[sceneId] = { x: +x.toFixed(1), y: +y.toFixed(1) };
    }
    active = false;
    R.active = false;
    moving = false;
    target = null;
    dragId = null;
    hotspots = [];
    near = null;
    pending = null;
    busy = false;
    markerEls.clear();
    unbindInput();
    const ui = A.$('.roam-ui', G.ui);
    if (ui) ui.remove();
    const marks = A.$('.roam-markers', G.ui);
    if (marks) marks.remove();
    const prompt = A.$('.roam-prompt', G.ui);
    if (prompt) prompt.remove();
  };

  R.update = function (now) {
    if (!active) return;
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    const busyScene = G.mode !== 'scene' || A.$('.dlg', G.dlgLayer) || A.$('.modal-bg', G.stage) || A.$('.choices', G.dlgLayer);
    if (busyScene) {
      moving = false;
      setSceneVisible(false);
      return;
    }
    setSceneVisible(true);
    const b = bounds();
    let dx = 0, dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (!dx && !dy && target) {
      const ddx = target.x - x, ddy = target.y - y;
      const d = Math.hypot(ddx, ddy);
      if (d < 3) target = null;
      else { dx = ddx / d; dy = ddy / d; }
    }
    if (dx || dy) {
      const len = Math.hypot(dx, dy) || 1;
      dx /= len; dy /= len;
      const sp = 86;
      x = clamp(x + dx * sp * dt, b.x0, b.x1);
      y = clamp(y + dy * sp * dt, b.y0, b.y1);
      if (dx) facing = dx < 0 ? -1 : 1;
      moving = true;
    } else {
      moving = false;
    }
    hero.x = x;
    hero.y = y;
    hero.flip = facing < 0;
    hero.pose = moving ? 'walk' : 'idle';

    // كاميرا تتبع البطل في المواقع الواسعة (دير النار)
    const worldW = WORLD_W[sceneId] || VW;
    if (worldW > VW) {
      const maxCam = Math.max(0, worldW - VW);
      const want = clamp(x - VW / 2, 0, maxCam);
      camX += (want - camX) * Math.min(1, dt * 14);
      // ضمانة: تبقى الشخصية داخل الشاشة دائمًا ولو تأخّرت الكاميرا لحظة.
      const lo = Math.max(0, x - (VW - 32));
      const hi = Math.min(maxCam, x - 32);
      camX = Math.max(lo, Math.min(hi, camX));
      if (Math.abs(camX - camDrawn) > 0.35) { camDrawn = camX; placeMarkers(); }
    } else if (camX !== 0) {
      camX = 0;
      camDrawn = 0;
      placeMarkers();
    }

    // أقرب كشك + استدارة أصحاب الكشكات نحو اللاعب
    let best = null, bestD = 1e9;
    for (const h of hotspots) {
      const d = Math.hypot(x - h.x, y - h.y);
      if (d < bestD) { bestD = d; best = h; }
      if (h.actor && Math.abs(x - h.x) < 120) h.actor.flip = x < h.x;
    }
    const nb = best && bestD <= (best.r || 26) ? best : null;
    if (nb !== near) { near = nb; updatePrompt(); paintNear(); }
    if (pending) {
      const pd = Math.hypot(x - pending.x, y - pending.y);
      if (pd <= (pending.r || 26) + 6 && !moving) {
        const h = pending;
        pending = null;
        interact(h);
      }
    }
  };

  // ---------- واجهة الحركة ----------
  function renderUI() {
    const wrap = document.createElement('div');
    wrap.className = 'roam-ui';
    wrap.innerHTML = A.genderText(`
      <div class="roam-hint">← → أو WASD للحركة — اضغط E للتفاعل مع الأشياء القريبة</div>
      <div class="roam-dpad">
        <span></span><button type="button" data-rdir="up" aria-label="أعلى"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 8.5 8.5H1.5z"/></svg></button><span></span>
        <button type="button" data-rdir="left" aria-label="يسار"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 5 8.5 1.5V8.5z"/></svg></button><span class="roam-dot"></span><button type="button" data-rdir="right" aria-label="يمين"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M8.5 5 1.5 8.5V1.5z"/></svg></button>
        <span></span><button type="button" data-rdir="down" aria-label="أسفل"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1.5 1.5H8.5z"/></svg></button><span></span>
      </div>`);
    G.ui.appendChild(wrap);
    const marks = document.createElement('div');
    marks.className = 'roam-markers';
    G.ui.appendChild(marks);
    const prompt = document.createElement('button');
    prompt.type = 'button';
    prompt.className = 'roam-prompt hidden';
    G.ui.appendChild(prompt);
    A.$$('[data-rdir]', wrap).forEach((btn) => {
      const dir = btn.dataset.rdir;
      const on = (e) => {
        e.preventDefault();
        e.stopPropagation();
        keys[dir] = true;
        target = null;
      };
      const off = (e) => { e.preventDefault(); keys[dir] = false; };
      btn.addEventListener('pointerdown', on);
      btn.addEventListener('pointerup', off);
      btn.addEventListener('pointerleave', off);
      btn.addEventListener('pointercancel', off);
    });
  }

  // ---------- المدخلات ----------
  function stagePoint(e) {
    const r = G.stage.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * VW + camX,
      y: (e.clientY - r.top) / r.height * VH,
    };
  }
  function onKeyDown(e) {
    if (!active || G.mode !== 'scene') return;
    if (A.$('.dlg', G.dlgLayer) || A.$('.modal-bg', G.stage)) return;
    if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
      if (near && !e.repeat) { e.preventDefault(); interact(near); }
      return;
    }
    const dir = dirOf(e);
    if (!dir) return;
    e.preventDefault();
    keys[dir] = true;
    target = null;
  }
  function onKeyUp(e) {
    const dir = dirOf(e);
    if (dir) keys[dir] = false;
  }
  function onPointerDown(e) {
    if (!active || G.mode !== 'scene') return;
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest && e.target.closest('button,.modal-bg,.choices')) return;
    if (A.$('.dlg', G.dlgLayer)) return;
    const b = bounds();
    const pt = stagePoint(e);
    target = { x: clamp(pt.x, b.x0, b.x1), y: clamp(pt.y, b.y0, b.y1) };
    dragId = e.pointerId;
  }
  function onPointerMove(e) {
    if (!active || dragId !== e.pointerId) return;
    const b = bounds();
    const pt = stagePoint(e);
    target = { x: clamp(pt.x, b.x0, b.x1), y: clamp(pt.y, b.y0, b.y1) };
  }
  function onPointerUp(e) {
    if (dragId === e.pointerId) dragId = null;
  }
  function bindInput() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    G.stage.addEventListener('pointerdown', onPointerDown);
    G.stage.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  }
  function unbindInput() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    G.stage.removeEventListener('pointerdown', onPointerDown);
    G.stage.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', onPointerUp);
    keys.up = keys.down = keys.left = keys.right = false;
  }
})(window.ASH);
