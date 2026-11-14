/* ============================================================
   جبال العظام — منطقة تجوّل 2D
   عالم أكبر من الشاشة، كاميرا تتبعك، حركة بالكيبورد واللمس،
   ونقاط تأمّل بلا قتال ولا صعوبات.
   ============================================================ */
(function (A) {
  const M = (A.mountain = {});
  const G = A.game;

  const VW = 480, VH = 270;
  const WORLD_W = 1680;
  const WALK = { x0: 40, x1: WORLD_W - 40, y0: 182, y1: 262 };
  const START = { x: 72, y: 228 };
  const GATE_X = 154;       // منتصف البوابة
  const GATE_OUT_X = 215;   // بعد الخروج من البوابة
  const GATE_IN_X = 120;    // العودة إلى داخل الحصن
  const GATE_WEST_X = 46;   // أقصى غرب قبل الخروج للقرية (قبل حدّ المشي كي لا تُقصّ الشخصية)

  // مسارات تتفرّع من درب الجبل إلى كل موقع في المملكة.
  const ROUTES = [
    { id: 'forest', forkX: 360, ex: 386, ey: 206, side: -1, label: 'غابة الهمس', target: 'forest' },
    { id: 'mine',   forkX: 500, ex: 474, ey: 250, side: 1,  label: 'مناجم الجمر', target: 'mine' },
    { id: 'market', forkX: 940, ex: 966, ey: 250, side: 1,  label: 'سوق الرماد', target: 'market' },
    { id: 'ruins',  forkX: 1166, ex: 1192, ey: 206, side: -1, label: 'أنقاض قلعة الشمس', target: 'ruins' },
    { id: 'jinn',   forkX: 1338, ex: 1364, ey: 204, side: -1, label: 'قصر الجِنّ', target: 'jinn' },
    { id: 'palace', forkX: 1590, ex: 1606, ey: 238, side: 0,  label: 'قصر الملك', target: 'palace' },
  ];

  // ---------- أدوات رسم ----------
  const clamp = A.clamp;
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const disc = (g, cx, cy, r, c) => {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
    }
  };
  const line = (g, x0, y0, x1, y1, c, t) => {
    t = t || 1;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
    let guard = Math.max(8, (dx + dy) * 3 + 8);
    g.fillStyle = c;
    for (;;) {
      g.fillRect(x0, y0, t, t);
      if (x0 === x1 && y0 === y1) break;
      if (--guard <= 0) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  };
  function glow(g, x, y, r, c1, a) {
    // حماية: أي إحداثي غير صالح كان يرمي استثناءً ويقطع الرسم في منتصفه.
    if (!isFinite(x) || !isFinite(y) || !isFinite(r) || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
    gr.addColorStop(0, c1);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.globalAlpha = a == null ? 1 : a;
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore();
  }
  const pathY = (x) => 234 + Math.sin(x * 0.0052) * 9 + Math.sin(x * 0.013 + 1.2) * 4;

  // ---------- بناء العالم ----------
  function makePeaks(seed, count, span, base, hMin, hMax) {
    const r = A.rng(seed);
    const out = [];
    for (let i = 0; i < count; i++) {
      const x = -240 + (i / (count - 1)) * (span + 480) + (r() - 0.5) * 46;
      const h = hMin + r() * (hMax - hMin);
      out.push({ x, h, w: h * (0.85 + r() * 0.75), base: base + (r() - 0.5) * 10 });
    }
    return out;
  }
  const FAR = makePeaks(1109, 24, 2000, 151, 70, 154);
  const MID = makePeaks(4417, 21, 2000, 186, 46, 112);

  const POINTS = [
    {
      id: 'valley', x: 260, y: 226, name: 'مطلّ الوادي',
      lines: [
        'تقف على حافة الصخر. تحتك، دير النار صغيرة مثل جمرةٍ لم تنطفئ بعد. تصعد من بعيد رائحة الخبز والحديد… والحياة.',
        'من هنا، يبدو كل شيء صغيرًا: البيوت، السور، الحرب. لكن الناس ليسوا صغارًا. أنت تعرف ذلك الآن.',
      ],
    },
    {
      id: 'fall', x: 602, y: 238, name: 'شلال الفضة',
      lines: [
        'الماء يسقط من أعلى الجرف بلا توقف. لا يسأل عن المملكة، ولا عن الإمبراطورية، ولا عنك. فقط يسقط، ويلمع، ويبدأ من جديد.',
        'تمدّ يدك إلى الرذاذ. بارد، وحقيقي، ولا يطلب شيئًا. تكاد تنسى أنك تحمل اسمًا.',
      ],
    },
    {
      id: 'lake', x: 1020, y: 218, name: 'بحيرة المرآة',
      lines: [
        'البحيرة ساكنة حتى أن القمر يسبح فيها كأنه سمكة فضية. لا تموج الماء إلا حين تلمسه الريح، وكأن الجبل يتنفس.',
        'ترى وجهك في الماء. ليس بطلًا، ولا قديسًا. فقط أنت — وقد عدت. هذا يكفي.',
      ],
    },
    {
      id: 'farmer', x: 700, y: 248, name: 'الفلاح حسين', kind: 'farmer',
      lines: [
        'رجلٌ عريض الكتفين يقف عند حضيرة الدجاج، يرمي الحبّ للطيور ويعدّها بصوتٍ خافت.',
        'الفلاح حسين يسلّم عليك من بعيد، ثم يعود إلى دجاجه. لا شيء يطلبه، وهذا سبب كافٍ للوقوف هنا.',
      ],
    },
    {
      id: 'shrine', x: 1420, y: 234, name: 'مقصورة القمة',
      lines: [
        'مقصورةٌ صغيرة من حجرٍ أبيض، بناها ناسٌ لم يعد لهم اسم. الشموع ما زالت مشتعلة، كأن أحدًا تركها لك.',
        'لا تطلب شيئًا. تجلس، وتترك الضوء يفعل ما يفعله. حين تنهض، تشعر أن ظهرك أخفّ.',
      ],
    },
  ];

  // أشجار وصخور وفوانيس موزّعة على العالم
  const PROPS = [];
  (function buildProps() {
    const r = A.rng(77231);
    for (let i = 0; i < 54; i++) {
      const x = 30 + r() * (WORLD_W - 60);
      if (x < 235) continue; // اترك مكان البوابة والسور
      const side = r();
      let y = side < 0.48 ? pathY(x) - 20 - r() * 26 : pathY(x) + 20 + r() * 16;
      y = clamp(y, 191, 268);
      const h = 24 + r() * 42;
      PROPS.push({ type: 'tree', x, y, h, w: h * (0.5 + r() * 0.18), tone: r() < 0.35 ? 1 : 0, seed: r() });
    }
    for (let i = 0; i < 30; i++) {
      const x = 24 + r() * (WORLD_W - 48);
      if (x < 235 || (x > 670 && x < 895)) continue;
      const y = clamp(pathY(x) + (r() < 0.5 ? -13 : 17) + (r() - 0.5) * 10, 192, 264);
      PROPS.push({ type: 'rock', x, y, w: 3 + r() * 7, h: 2 + r() * 4, tone: r() });
    }
    for (let i = 0; i < 46; i++) {
      const x = 24 + r() * (WORLD_W - 48);
      if (x < 235 || (x > 670 && x < 895)) continue;
      const y = clamp(pathY(x) + (r() < 0.55 ? -18 : 15) + (r() - 0.5) * 12, 191, 258);
      PROPS.push({ type: 'flower', x, y, c: r() < 0.35 ? '#bff5e0' : r() < 0.7 ? '#f4cf7a' : '#d7a8ff', phase: r() * 6.3 });
    }
    for (const x of [262, 452, 746, 1088, 1248, 1404]) {
      PROPS.push({ type: 'lantern', x, y: clamp(pathY(x) + 24, 220, 256), h: 20 + (x % 3) * 3 });
    }
    PROPS.push({ type: 'camp', x: 322, y: 250 });
    PROPS.push({ type: 'shrine', x: 1420, y: 252 });
    PROPS.push({ type: 'cliff', x: 548, y: 244 });
    PROPS.push({ type: 'lake', x: 1020, y: 206 });

    // بوابة الحصن: الخروج من دير النار والدخول إليها مشيًا
    PROPS.push({ type: 'gate', x: GATE_X, y: 120 });
    PROPS.push({ type: 'guard', x: 128, y: 254, flip: false, phase: 0.4 });
    PROPS.push({ type: 'guard', x: 182, y: 254, flip: true, phase: 2.1 });

    // حضيرة دير النار — ديكور على الضفّة الشمالية، لا تسدّ الدرب
    PROPS.push({ type: 'stable', x: 704, y: 214 });
    PROPS.push({ type: 'pen', x: 800, y: 214, w: 160, h: 54 });
    PROPS.push({ type: 'horse', x: 736, y: 210, flip: true, phase: 1.3 });
    PROPS.push({ type: 'horse', x: 838, y: 211, flip: false, phase: 3.4 });
    PROPS.push({ type: 'cow', x: 762, y: 208, flip: false, phase: 0.2 });
    PROPS.push({ type: 'cow', x: 856, y: 209, flip: true, phase: 2.8 });
    PROPS.push({ type: 'sheep', x: 778, y: 213, flip: false, phase: 1.9 });
    PROPS.push({ type: 'sheep', x: 822, y: 212, flip: true, phase: 4.2 });
    PROPS.push({ type: 'pig', x: 798, y: 211, flip: false, phase: 0.9 });
    PROPS.push({ type: 'pig', x: 868, y: 211, flip: true, phase: 3.1 });
    PROPS.push({ type: 'chicken', x: 720, y: 214, flip: false, phase: 0.5 });
    PROPS.push({ type: 'chicken', x: 884, y: 214, flip: true, phase: 2.4 });
    // الفلاح حسين: مجاملة فقط، لا مهمة
    PROPS.push({ type: 'farmer', x: 700, y: 248, phase: 1.1 });
    PROPS.push({ type: 'sign', x: 236, y: 241, text: 'دير النار' });
    PROPS.push({ type: 'sign', x: 1602, y: 220, text: 'قصر الملك' });

    // لافتات المسارات: خشبٌ صغير على حافة الدرب، بنفس هيئة لافتات الجبل القديمة.
    for (const r of ROUTES) {
      PROPS.push({ type: 'sign', x: r.ex, y: r.ey + 2, text: r.label });
    }
  })();

  const STARS = (function () {
    const r = A.rng(912);
    return Array.from({ length: 84 }, (_, i) => ({
      x: r() * VW, y: 2 + r() * 137, s: r() < 0.14 ? 2 : 1, p: r() * 6.3, sp: 0.6 + r() * 1.5,
    }));
  })();

  const PETALS = (function () {
    const r = A.rng(331);
    return Array.from({ length: 42 }, () => ({
      x: r() * VW, y: r() * VH, vy: 4 + r() * 9, vx: -2 - r() * 5, p: r() * 6.3, c: r() < 0.5 ? '#e8d8c0' : '#d7b6d0',
    }));
  })();

  const FIREFLIES = (function () {
    const r = A.rng(808);
    return Array.from({ length: 34 }, () => ({
      x: 620 + r() * 760, y: 198 + r() * 54, p: r() * 6.3, sp: 0.3 + r() * 0.8, r: 1 + r() * 1.4,
    }));
  })();

  // ---------- الحالة ----------
  let active = false;
  let player = { x: START.x, y: START.y, facing: 1, moving: false };
  let vel = { x: 0, y: 0 };
  let lastPos = null;
  let camX = 0;
  let lastNow = 0;
  const keys = { up: false, down: false, left: false, right: false };
  let target = null;
  let dragId = null;
  let paused = false;
  let near = null;
  let nearId = null;
  let nearRoute = null;
  let nearRouteDist = 999;
  let routeId = null;
  let lastRegion = '';
  const visited = {};
  let gateState = 'in';     // in: داخل الحصن، out: خارج البوابة
  let gateBusy = false;
  let leaving = false;
  let rightBlocked = false;
  let enterGrace = 0;
  let routeGrace = 0;
  let stuckTime = 0;
  let stepPhase = 0;

  function state() { return G.state; }

  // حالة للاختبار/التشخيص فقط
  M.status = function () {
    return {
      active, x: player.x, y: player.y, camX, gateState, leaving, paused,
      route: nearRoute ? nearRoute.id : null, target,
    };
  };

  // موضع الظهور عند العودة من موقعٍ إلى الجبل: عند قوس ذلك الموقع.
  M.entryFor = function (id) {
    const r = ROUTES.find((x) => x.target === id);
    if (!r) return null;
    return { x: r.ex, y: clamp(r.ey, WALK.y0 + 4, WALK.y1 - 4) };
  };
  M.routeAt = function (id) {
    const r = ROUTES.find((x) => x.id === id);
    return r ? { x: r.ex, y: r.ey, forkX: r.forkX } : null;
  };

  // ---------- الدخول والخروج ----------
  M.enter = function () {
    if (!G.state) { G.go('title'); return; }
    active = true;
    M.active = true;
    G.mode = 'mountain';
    paused = false;
    target = null;
    dragId = null;
    lastNow = 0;
    near = null;
    nearId = null;
    nearRoute = null;
    routeId = null;
    leaving = false;
    gateBusy = false;
    rightBlocked = false;
    vel.x = vel.y = 0;
    stuckTime = 0;
    stepPhase = 0;
    const forceInside = !!M.pendingGate;
    const outsideGate = !!M.pendingOutside;
    M.pendingGate = false;
    M.pendingOutside = false;
    const forcedPos = M.pendingPos;
    M.pendingPos = null;
    const p = outsideGate
      ? { x: GATE_OUT_X + 16, y: 246 }
      : (forceInside ? START : (forcedPos || lastPos || START));
    player.x = clamp(p.x, WALK.x0, WALK.x1);
    player.y = clamp(p.y, WALK.y0, WALK.y1);
    gateState = player.x >= GATE_OUT_X ? 'out' : 'in';
    enterGrace = 0.85;
    routeGrace = 0.6;
    player.facing = 1;
    player.moving = false;
    camX = clamp(player.x - VW / 2, 0, WORLD_W - VW);
    G.setBg('mountain', []);
    G.hideChrome();
    A.audio.init();
    A.audio.ambient('mountain');
    renderUI();
    bindInput();
    if (outsideGate) {
      setTimeout(() => {
        if (active) G.toast('خرجت من بوابة الحصن — جبال العظام أمامك.', 'good');
      }, 120);
    }
    G.save();
  };

  M.exit = function () {
    if (!active) return;
    lastPos = { x: player.x, y: player.y };
    active = false;
    M.active = false;
    paused = false;
    target = null;
    dragId = null;
    unbindInput();
    G.ui.innerHTML = '';
    if (G.ctx) G.ctx.setTransform(1, 0, 0, 1, 0, 0);
  };

  function leaveToMap() {
    if (!active) return;
    A.audio.click();
    G.go('map');
  }

  // الخروج من بوابة الحصن: إلى دير النار (غربًا) أو قصر الملك (شرقًا).
  function exitTo(where, arg) {
    if (leaving) return;
    leaving = true;
    target = null;
    player.moving = false;
    A.audio.click();
    G.fade.classList.add('on');
    setTimeout(() => {
      if (!active) { leaving = false; return; }
      G.save();
      if (where === 'location') G.go('location', arg);
      else G.go(where);
      G.fade.classList.remove('on');
      leaving = false;
    }, 340);
  }

  async function guardSalute(goingOut) {
    if (gateBusy) return;
    gateBusy = true;
    try {
      const s = state();
      const name = s ? s.name : 'حارث';
      if (goingOut) {
        await G.play([
          { w: 'gateGuard', t: 'البوابة مفتوحة، {name}. اخرج وامشِ — الجبل لا يسأل عن الأوراق.' },
          { w: 'guard2', t: 'سلامٌ على من في الخارج. قل لهم إن دير النار ما زالت واقفة.' },
          { w: 'hero', t: 'أوصل السلام. وأعِد البوابة خلفي.' },
        ]);
      } else {
        await G.play([
          { w: 'guard2', t: 'عالٍ سالمًا؟ البوابة لم تُغلق في وجهك ولا مرة.' },
          { w: 'gateGuard', t: 'أهلًا بعودتك، {name}. النار مشتعلة، والشاي ساخن.' },
        ]);
      }
    } catch (e) { console.warn(e); }
    gateBusy = false;
  }

  // ---------- واجهة الجبال ----------
  function renderUI() {
    const dots = POINTS.map((p) =>
      `<span class="mtn-mark" style="left:${(p.x / WORLD_W * 100).toFixed(1)}%"></span>`).join('');
    G.ui.innerHTML = A.genderText(`
      <div class="mtn-ui">
        <div class="mtn-top">
          <div class="mtn-title"><b>جبال العظام</b><span id="mtn-region">وادي الفجر</span></div>
          <div class="mtn-trail" id="mtn-trail">${dots}<i id="mtn-dot"></i></div>
        </div>
        <div class="mtn-prompt" id="mtn-prompt">سر في الوادي. اقترب من الضوء لتتأمّل.</div>
        <div class="mtn-hint">← → أو WASD للحركة — انقر الأرض للمشي — انقر على قوس الطريق أو E للدخول — البوابة غربًا <span style="opacity:.55">· إصدار 1.77</span></div>
        <div class="mtn-actions">
          <button type="button" class="btn ghost" data-mtn="map">عودة للخريطة</button>
          <button type="button" class="btn primary" data-mtn="meditate" disabled>تأمّل</button>
        </div>
        <div class="mtn-dpad">
          <span></span><button type="button" data-dir="up" aria-label="أعلى"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5 8.5 8.5H1.5z"/></svg></button><span></span>
          <button type="button" data-dir="left" aria-label="يسار"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M1.5 5 8.5 1.5V8.5z"/></svg></button><span class="mtn-dot"></span><button type="button" data-dir="right" aria-label="يمين"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M8.5 5 1.5 8.5V1.5z"/></svg></button>
          <span></span><button type="button" data-dir="down" aria-label="أسفل"><svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8.5 1.5 1.5H8.5z"/></svg></button><span></span>
        </div>
      </div>`);
    const back = A.$('[data-mtn="map"]', G.ui);
    if (back) back.onclick = (e) => { e.stopPropagation(); leaveToMap(); };
    const med = A.$('[data-mtn="meditate"]', G.ui);
    if (med) med.onclick = (e) => { e.stopPropagation(); interact(); };
    A.$$('[data-dir]', G.ui).forEach((b) => {
      const dir = b.dataset.dir;
      const on = (e) => { e.preventDefault(); e.stopPropagation(); keys[dir] = true; target = null; };
      const off = (e) => { e.preventDefault(); keys[dir] = false; };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointerleave', off);
      b.addEventListener('pointercancel', off);
    });
    updatePrompt(true);
    updateRegion(true);
    updateTrail();
  }

  function updateTrail() {
    const dot = A.$('#mtn-dot', G.ui);
    if (dot) dot.style.left = (player.x / WORLD_W * 100).toFixed(2) + '%';
  }

  function regionName(x) {
    if (x < 220) return 'بوابة دير النار';
    if (x < 430) return 'وادي الفجر';
    if (x < 640) return 'شلال الفضة';
    if (x < 920) return 'حضيرة دير النار';
    if (x < 1140) return 'بحيرة المرآة';
    if (x < 1320) return 'بستان الفوانيس';
    return 'مقصورة القمة';
  }

  function updateRegion(force) {
    const name = regionName(player.x);
    if (!force && name === lastRegion) return;
    lastRegion = name;
    const el = A.$('#mtn-region', G.ui);
    if (el) el.textContent = name;
  }

  function findNear() {
    let best = null, bd = 34;
    for (const p of POINTS) {
      const d = Math.hypot(p.x - player.x, (p.y - 8) - player.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  function findRoute() {
    let best = null, bd = 34;
    for (const r of ROUTES) {
      // الأقواس على الضفّتين: القياس من قاعدة القوس إلى قدمي البطل
      const d = Math.hypot(r.ex - player.x, r.ey - player.y);
      if (d < bd) { bd = d; best = r; }
    }
    nearRouteDist = best ? bd : 999;
    return best;
  }

  // هل الطريق مفتوح الآن؟
  function routeState(r) {
    const s = state();
    if (!s) return { ok: false, why: 'لا حكاية بعد.' };
    if (r.id === 'palace' && !s.postWar) {
      return { ok: false, why: 'الطريق إلى قصر الملك مغلق حتى تنتهي الحرب. البوابة غربًا.' };
    }
    if (r.id === 'jinn' && !s.flags.jinnUnlocked) {
      return { ok: false, why: 'الطريق إلى قصر الجنّ مغلق. لا يعرف الطريق إلا من دعاه العرّاف.' };
    }
    if (gateState !== 'out') {
      return { ok: false, why: 'اخرج من بوابة دير النار أولًا؛ كل الطرق تبدأ خارج السور.' };
    }
    return { ok: true };
  }

  function updatePrompt(force) {
    near = findNear();
    nearRoute = findRoute();
    if (!force && near === nearId && nearRoute === routeId) return;
    nearId = near;
    routeId = nearRoute;
    const el = A.$('#mtn-prompt', G.ui);
    const med = A.$('[data-mtn="meditate"]', G.ui);
    if (nearRoute) {
      const rs = routeState(nearRoute);
      if (med) {
        med.disabled = !rs.ok;
        med.textContent = A.genderText(rs.ok ? 'ادخل ' + nearRoute.label : 'الطريق مغلق');
      }
      if (el) {
        el.classList.toggle('hot', rs.ok);
        el.textContent = A.genderText(rs.ok
          ? 'طريق «' + nearRoute.label + '» — انقر على القوس أو اضغط E للدخول.'
          : rs.why);
      }
      return;
    }
    if (med) {
      med.disabled = !near;
      med.textContent = A.genderText(near
        ? (near.kind === 'farmer' ? 'سلّم على الفلاح حسين' : 'تأمّل عند ' + near.name)
        : 'تأمّل');
    }
    if (!el) return;
    el.classList.toggle('hot', !!near);
    el.textContent = A.genderText(near
      ? (near.kind === 'farmer'
        ? 'الفلاح حسين يقف عند الحضيرة — اضغط E لتسلّم عليه.'
        : 'اقتربت من «' + near.name + '» — اضغط تأمّل، أو مسافة.')
      : (gateState === 'in'
        ? 'داخل حصن دير النار. اخرج من البوابة شرقًا، أو تابع غربًا لدخول القرية.'
        : (!visited.valley && player.x < 460
          ? 'سر في الوادي. الطرق تتفرّع من الدرب — انقر على قوس الطريق أو اضغط E لسلوكه.'
          : 'الطرق تتفرّع من الدرب. انقر على القوس أو اضغط E لدخوله.')));
  }

  // ---------- الحركة ----------
  function blocked(x, y) {
    // البحيرة: ماءٌ في الضفّة العليا، والدرب يمرّ تحته
    const lx = (x - 1020) / 100, ly = (y - 202) / 23;
    if (lx * lx + ly * ly < 1) return true;
    // بركة الشلال
    const fx = (x - 590) / 54, fy = (y - 252) / 11;
    if (fx * fx + fy * fy < 1) return true;
    return false;
  }

  // إذا نقر اللاعب على الماء أو خارج الحدود، قرّب الهدف إلى أقرب أرض صالحة.
  function nearestFree(x, y) {
    x = clamp(x, WALK.x0, WALK.x1);
    y = clamp(y, WALK.y0, WALK.y1);
    if (!blocked(x, y)) return { x, y };
    for (let r = 5; r <= 110; r += 5) {
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const nx = clamp(x + Math.cos(a) * r, WALK.x0, WALK.x1);
        const ny = clamp(y + Math.sin(a) * r, WALK.y0, WALK.y1);
        if (!blocked(nx, ny)) return { x: nx, y: ny };
      }
    }
    return { x: clamp(x, WALK.x0, WALK.x1), y: WALK.y1 };
  }

  function moveTo(nx, ny) {
    const ox = player.x, oy = player.y;
    nx = clamp(nx, WALK.x0, WALK.x1);
    ny = clamp(ny, WALK.y0, WALK.y1);
    if (!blocked(nx, ny)) {
      player.x = nx;
      player.y = ny;
      return true;
    }
    // انزلاق على المحورين
    let moved = false;
    if (!blocked(nx, oy)) { player.x = nx; moved = true; }
    if (!blocked(player.x, ny)) { player.y = ny; moved = true; }
    if (moved) return true;
    // لفّ حول الحاجز بدل الارتطام
    const ddx = nx - ox, ddy = ny - oy;
    const len = Math.hypot(ddx, ddy) || 1;
    const dx = ddx / len, dy = ddy / len;
    for (const a of [0.55, -0.55, 1.05, -1.05]) {
      const ca = Math.cos(a), sa = Math.sin(a);
      const tx = clamp(ox + (dx * ca - dy * sa) * len, WALK.x0, WALK.x1);
      const ty = clamp(oy + (dx * sa + dy * ca) * len, WALK.y0, WALK.y1);
      if (!blocked(tx, ty)) {
        player.x = tx;
        player.y = ty;
        return true;
      }
    }
    return false;
  }

  function update(dt) {
    updateTrail();
    updateRegion(false);
    if (enterGrace > 0) enterGrace = Math.max(0, enterGrace - dt);
    if (routeGrace > 0) routeGrace = Math.max(0, routeGrace - dt);
    if (leaving) { player.moving = false; vel.x = vel.y = 0; return; }
    if (paused || A.$('.dlg', G.dlgLayer)) {
      player.moving = false;
      vel.x = vel.y = 0;
      return;
    }
    let dx = 0, dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    if (!dx && !dy && target) {
      const ddx = target.x - player.x, ddy = target.y - player.y;
      const d = Math.hypot(ddx, ddy);
      if (d < 8) target = null;
      else { dx = ddx / d; dy = ddy / d; }
    }

    // سرعة هادئة جدًا: المشي في الوادي ليس سباقًا.
    const MAX_SP = 46;
    if (dx || dy) {
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const k = Math.min(1, dt * 10);
      vel.x += (dx * MAX_SP - vel.x) * k;
      vel.y += (dy * MAX_SP - vel.y) * k;
    } else {
      const damp = Math.max(0, 1 - dt * 15);
      vel.x *= damp;
      vel.y *= damp;
      if (Math.abs(vel.x) < 1) vel.x = 0;
      if (Math.abs(vel.y) < 1) vel.y = 0;
    }
    const sp = Math.hypot(vel.x, vel.y);
    if (sp > 1.5) {
      const moved = moveTo(player.x + vel.x * dt, player.y + vel.y * dt);
      player.moving = moved;
      stepPhase += dt * sp * 0.11;
      if (!moved) {
        stuckTime += dt;
        vel.x *= 0.45;
        vel.y *= 0.45;
      } else {
        stuckTime = Math.max(0, stuckTime - dt * 2);
      }
      if (Math.abs(vel.x) > 3) player.facing = vel.x < 0 ? -1 : 1;
    } else {
      player.moving = false;
      stuckTime = 0;
    }
    if (stuckTime > 0.45) {
      target = null;
      stuckTime = 0;
    }
    const targetCam = clamp(player.x - VW / 2, 0, WORLD_W - VW);
    // قفل الكاميرا على اللاعب: الشخصية تبقى دائمًا داخل الشاشة، لا تخرج منها أبدًا.
    camX = targetCam;

    // البوابة: حراس يسلّمون عند الخروج/الدخول، ومشي بين المناطق عند الأطراف.
    if (!A.$('.dlg', G.dlgLayer)) {
      if (gateState === 'in' && player.x >= GATE_OUT_X) {
        gateState = 'out';
        guardSalute(true);
        G.toast('أنت خارج البوابة. الطرق تتفرّع أمامك — انقر على قوس الطريق أو اضغط E لسلوكه.', 'good');
      } else if (gateState === 'out' && player.x <= GATE_IN_X) {
        gateState = 'in';
        guardSalute(false);
      }
      const post = !!(state() && state().postWar);
      if (enterGrace <= 0 && player.x <= GATE_WEST_X) {
        exitTo('village');
        return;
      } else if (enterGrace <= 0 && player.x >= WALK.x1 - 4) {
        if (post) exitTo('location', 'palace');
        else if (!rightBlocked) {
          rightBlocked = true;
          player.x = WALK.x1 - 40;
          vel.x = 0;
          G.toast('الطريق إلى قصر الملك مغلق حتى تنتهي الحرب. البوابة غربًا.', 'bad');
        }
      } else if (player.x < WALK.x1 - 60) {
        rightBlocked = false;
      }
    }
    updatePrompt(false);

    // لا دخول تلقائي عند مجرّد الاقتراب: الدخول يحتاج نقرة على القوس أو مفتاح E.
  }

  async function meditate() {
    if (!active || paused || !near) return;
    const p = near;
    paused = true;
    target = null;
    player.moving = false;
    A.audio.click();
    const first = !visited[p.id];
    visited[p.id] = true;
    if (p.kind === 'farmer') {
      try {
        if (A.story && A.story.farmer) await A.story.farmer();
      } catch (e) { console.warn(e); }
      G.toast(first ? 'سلّمت على الفلاح حسين.' : 'حسين يرفع يده لك من بين الدجاج.', 'good');
      paused = false;
      updatePrompt(true);
      return;
    }
    try {
      await G.say('narr', first ? p.lines[0] : (p.lines[1] || p.lines[0]));
      const s = state();
      if (s) {
        s.hp = Math.min(s.maxHp, s.hp + 5);
        G.save();
      }
      G.toast(first ? 'لحظة سلام في ' + p.name : 'عدت إلى ' + p.name + '. الجبل يتذكّرك.', 'good');
    } catch (e) { console.warn(e); }
    paused = false;
    updatePrompt(true);
  }

  // دخول طريقٍ مشيًا: أيقونة القوس أو زر «ادخل» أو مفتاح E.
  function enterRoute(r) {
    if (!active || leaving || !r) return;
    const rs = routeState(r);
    if (!rs.ok) {
      A.audio.click();
      G.toast(rs.why, 'bad');
      return;
    }
    leaving = true;
    target = null;
    player.moving = false;
    vel.x = vel.y = 0;
    A.audio.click();
    const s = state();
    if (s) s.flags.lastTrail = r.id;
    G.save();
    // G.travel يتكفّل بالأيام ومشهد الوصول والموسيقى، ثم يُخرجنا من الجبل.
    G.mode = 'scene';
    Promise.resolve(G.travel(r.target)).catch((e) => {
      console.warn(e);
      leaving = false;
    });
  }

  function interact() {
    if (!active || paused) return;
    if (nearRoute) { enterRoute(nearRoute); return; }
    if (near) meditate();
  }

  // ---------- المدخلات ----------
  function dirOf(e) {
    const k = e.key;
    if (k === 'ArrowUp' || k === 'w' || k === 'W' || e.code === 'KeyW') return 'up';
    if (k === 'ArrowDown' || k === 's' || k === 'S' || e.code === 'KeyS') return 'down';
    if (k === 'ArrowLeft' || k === 'a' || k === 'A' || e.code === 'KeyA') return 'left';
    if (k === 'ArrowRight' || k === 'd' || k === 'D' || e.code === 'KeyD') return 'right';
    return null;
  }
  function onKeyDown(e) {
    if (!active) return;
    if (e.key === 'Escape') { e.preventDefault(); leaveToMap(); return; }
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
      if (!A.$('.dlg', G.dlgLayer)) {
        e.preventDefault();
        interact();
      }
      return;
    }
    const dir = dirOf(e);
    if (dir) {
      if (A.$('.dlg', G.dlgLayer)) return;
      e.preventDefault();
      keys[dir] = true;
      target = null;
    }
  }
  function onKeyUp(e) {
    const dir = dirOf(e);
    if (dir) keys[dir] = false;
  }
  function stagePoint(e) {
    const r = G.stage.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) / r.width * VW,
      y: (e.clientY - r.top) / r.height * VH,
    };
  }
  function onPointerDown(e) {
    if (!active || paused || leaving) return;
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest && e.target.closest('button')) return;
    if (A.$('.dlg', G.dlgLayer)) return;
    const pt = stagePoint(e);
    const wx = pt.x + camX;
    // النقر على قوس طريق يدخله مباشرة (بدل الدخول التلقائي عند الاقتراب).
    const clickedRoute = ROUTES.find((r) => Math.abs(r.ex - wx) <= 34 && Math.abs(r.ey - pt.y) <= 38);
    if (clickedRoute) {
      const rs = routeState(clickedRoute);
      if (rs.ok) { enterRoute(clickedRoute); return; }
      A.audio.click();
      G.toast(rs.why, 'bad');
      return;
    }
    target = nearestFree(wx, pt.y);
    dragId = e.pointerId;
  }
  function onPointerMove(e) {
    if (!active || leaving || dragId !== e.pointerId) return;
    const pt = stagePoint(e);
    target = nearestFree(pt.x + camX, pt.y);
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

  // ---------- الرسم ----------
  function drawStars(g, t) {
    for (const s of STARS) {
      const a = 0.32 + 0.5 * (0.5 + 0.5 * Math.sin(t * s.sp + s.p));
      g.globalAlpha = a;
      rect(g, s.x, s.y, s.s, s.s, '#dfe9ff');
      if (s.s === 2) { g.globalAlpha = a * 0.4; disc(g, s.x + 1, s.y + 1, 2, '#9fc4e8'); }
    }
    g.globalAlpha = 1;
  }

  function drawAurora(g, t) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      for (let x = -10; x <= VW + 10; x += 8) {
        const y = 34 + i * 19 + Math.sin(x * 0.018 + t * 0.26 + i * 1.9) * 10 + Math.sin(x * 0.006 - t * 0.15 + i * 1.2) * 7;
        if (x === -10) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = i === 0 ? 'rgba(84,214,190,.10)' : i === 1 ? 'rgba(130,178,232,.08)' : 'rgba(188,142,232,.07)';
      g.lineWidth = 13 + i * 7;
      g.lineCap = 'round';
      g.stroke();
    }
    // ستائر ضوء رقيقة
    for (let i = 0; i < 12; i++) {
      const x = (i * 47 + Math.sin(t * 0.2 + i) * 18 + VW) % VW;
      const y = 24 + (i % 4) * 18;
      g.globalAlpha = 0.025 + 0.02 * Math.sin(t * 0.7 + i);
      g.fillStyle = i % 2 ? '#8be8d4' : '#b9a0ff';
      g.fillRect(x, y, 2, 48 + (i % 3) * 18);
    }
    g.globalAlpha = 1;
    g.restore();
  }

  function drawMoon(g, t) {
    glow(g, 396, 48, 62, 'rgba(205,226,255,.5)', 0.55);
    disc(g, 396, 48, 22, '#edf3ff');
    disc(g, 392, 45, 18, '#e2ebfa');
    g.globalAlpha = 0.22;
    disc(g, 389, 41, 4, '#a8bdd8');
    disc(g, 401, 53, 3, '#b6c9df');
    disc(g, 398, 36, 2, '#c1d2e6');
    g.globalAlpha = 1;
    // هالة صغيرة متحركة
    g.globalAlpha = 0.07 + 0.03 * Math.sin(t * 0.8);
    disc(g, 396, 48, 30, '#dce8ff');
    g.globalAlpha = 1;
  }

  function drawPeaks(g, list, offset, dark, snow, alpha) {
    g.save();
    g.translate(-offset, 0);
    for (const p of list) {
      const sx = p.x;
      if (sx - p.w < -80 || sx + p.w > VW + 80) continue;
      const top = p.base - p.h;
      g.globalAlpha = alpha;
      // جسم الجبل
      g.fillStyle = dark;
      g.beginPath();
      g.moveTo(p.x - p.w * 0.56, p.base);
      g.lineTo(p.x - p.w * 0.24, p.base - p.h * 0.52);
      g.lineTo(p.x - p.w * 0.09, p.base - p.h * 0.63);
      g.lineTo(p.x + p.w * 0.04, top);
      g.lineTo(p.x + p.w * 0.19, p.base - p.h * 0.61);
      g.lineTo(p.x + p.w * 0.39, p.base - p.h * 0.33);
      g.lineTo(p.x + p.w * 0.58, p.base);
      g.closePath();
      g.fill();
      // الوجه المضاء
      g.globalAlpha = alpha * 0.34;
      g.fillStyle = snow;
      g.beginPath();
      g.moveTo(p.x + p.w * 0.04, top);
      g.lineTo(p.x + p.w * 0.19, p.base - p.h * 0.61);
      g.lineTo(p.x + p.w * 0.39, p.base - p.h * 0.33);
      g.lineTo(p.x + p.w * 0.58, p.base);
      g.lineTo(p.x + p.w * 0.05, p.base);
      g.closePath();
      g.fill();
      // قمة ثلجية
      if (p.h > 78) {
        g.globalAlpha = alpha * 0.9;
        g.fillStyle = snow;
        g.beginPath();
        g.moveTo(p.x + p.w * 0.04, top);
        g.lineTo(p.x - p.w * 0.06, top + p.h * 0.19);
        g.lineTo(p.x - p.w * 0.01, top + p.h * 0.15);
        g.lineTo(p.x + p.w * 0.02, top + p.h * 0.23);
        g.lineTo(p.x + p.w * 0.07, top + p.h * 0.15);
        g.lineTo(p.x + p.w * 0.12, top + p.h * 0.26);
        g.lineTo(p.x + p.w * 0.15, top + p.h * 0.18);
        g.lineTo(p.x + p.w * 0.18, top + p.h * 0.25);
        g.lineTo(p.x + p.w * 0.16, top + p.h * 0.12);
        g.closePath();
        g.fill();
      }
    }
    g.globalAlpha = 1;
    g.restore();
  }

  function mist(g, y, t, rgb) {
    const gr = g.createLinearGradient(0, y - 18, 0, y + 18);
    gr.addColorStop(0, 'rgba(' + rgb + ',0)');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',.12)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, y - 18, VW, 36);
    g.globalAlpha = 0.05;
    g.fillStyle = '#d8ecff';
    g.beginPath();
    for (let x = -10; x <= VW + 10; x += 16) {
      const yy = y + Math.sin(x * 0.03 + t * 0.5) * 4;
      if (x === -10) g.moveTo(x, yy); else g.lineTo(x, yy);
    }
    g.lineTo(VW + 10, y + 18); g.lineTo(-10, y + 18); g.closePath(); g.fill();
    g.globalAlpha = 1;
  }

  function ground(g, camX, t) {
    const gr = g.createLinearGradient(0, 168, 0, VH);
    gr.addColorStop(0, '#18291f');
    gr.addColorStop(0.42, '#111e18');
    gr.addColorStop(1, '#070d0b');
    g.fillStyle = gr;
    g.fillRect(0, 168, VW, VH - 168);
    // ضوء القمر على العشب
    g.globalAlpha = 0.06;
    g.fillStyle = '#bcd8c4';
    g.fillRect(0, 170, VW, 18);
    g.globalAlpha = 1;

    g.save();
    g.translate(-camX, 0);
    // مسار ترابي متعرّج
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const path = () => {
      g.beginPath();
      for (let x = -40; x <= WORLD_W + 40; x += 16) {
        const y = pathY(x);
        if (x === -40) g.moveTo(x, y); else g.lineTo(x, y);
      }
    };
    g.strokeStyle = '#241f18'; g.lineWidth = 38; path(); g.stroke();
    g.strokeStyle = '#3a3022'; g.lineWidth = 29; path(); g.stroke();
    g.strokeStyle = '#4b3d2b'; g.lineWidth = 20; path(); g.stroke();
    g.globalAlpha = 0.35; g.strokeStyle = '#6a5638'; g.lineWidth = 2; path(); g.stroke(); g.globalAlpha = 1;
    // حصى المسار
    const r = A.rng(661);
    for (let i = 0; i < 120; i++) {
      const x = 20 + r() * (WORLD_W - 40);
      const y = pathY(x) + (r() - 0.5) * 22;
      rect(g, x, y, 1 + (r() < 0.2 ? 1 : 0), 1, r() < 0.5 ? '#5a4c36' : '#30281d');
    }
    g.restore();
  }

  function drawLake(g, t) {
    const cx = 1020, cy = 206;
    glow(g, cx, cy, 116, 'rgba(90,160,200,.18)', 0.5);
    g.fillStyle = '#0e2434';
    g.beginPath(); g.ellipse(cx, cy, 96, 25, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#123248';
    g.beginPath(); g.ellipse(cx, cy, 88, 20, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(150,210,230,.20)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, cy, 94, 24, 0, 0, Math.PI * 2); g.stroke();
    // انعكاس القمر
    for (let i = 0; i < 12; i++) {
      const w = 10 + Math.sin(t * 1.6 + i) * 5;
      g.globalAlpha = 0.14 + 0.1 * Math.sin(t * 2 + i * 1.4);
      rect(g, cx - w / 2 + Math.sin(t * 0.8 + i) * 3, cy - 13 + i * 2.2, w, 1, '#dcecff');
    }
    g.globalAlpha = 1;
    // موجات
    for (let i = 0; i < 5; i++) {
      const w = 30 + Math.sin(t * 0.8 + i) * 7;
      g.globalAlpha = 0.12;
      g.strokeStyle = '#8fd0e0';
      g.beginPath(); g.ellipse(cx - 30 + i * 15, cy - 5 + i * 4, w, 3, 0, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
    // زنابق مضيئة
    for (const [dx, dy, c] of [[-64, 5, '#bff5e0'], [52, 8, '#f4cf7a'], [-18, 13, '#d7a8ff']]) {
      disc(g, cx + dx, cy + dy, 2, c);
      glow(g, cx + dx, cy + dy, 12, c, 0.4);
    }
  }

  function drawCliff(g, t) {
    const x = 548;
    // جرف خلف الشلال
    g.fillStyle = '#101b27';
    g.beginPath();
    g.moveTo(x - 76, 232); g.lineTo(x - 54, 126); g.lineTo(x - 12, 104);
    g.lineTo(x + 42, 118); g.lineTo(x + 70, 232); g.closePath(); g.fill();
    g.fillStyle = '#162736';
    g.beginPath();
    g.moveTo(x - 48, 224); g.lineTo(x - 32, 140); g.lineTo(x + 2, 122);
    g.lineTo(x + 34, 136); g.lineTo(x + 48, 224); g.closePath(); g.fill();
    // شقوق
    g.strokeStyle = '#0b131c'; g.lineWidth = 1;
    for (let i = 0; i < 8; i++) line(g, x - 40 + i * 10, 140 + (i % 3) * 14, x - 26 + i * 9, 224 - (i % 4) * 10, '#0b131c', 1);
    // الماء
    glow(g, x + 3, 190, 42, 'rgba(160,220,235,.38)', 0.5);
    for (let i = 0; i < 6; i++) {
      const wx = x - 10 + i * 5;
      const off = Math.sin(t * 9 + i * 1.3) * 1.5;
      g.globalAlpha = 0.32 + i * 0.08;
      g.fillStyle = i % 2 ? '#c9eef8' : '#8fd0e0';
      g.fillRect(wx + off, 132, 2, 114);
    }
    g.globalAlpha = 0.4;
    g.fillStyle = '#e8fbff';
    for (let i = 0; i < 12; i++) {
      const wx = x - 16 + ((i * 13 + t * 24) % 36);
      rect(g, wx, 132 + ((i * 21 + t * 38) % 108), 1, 5, '#e8fbff');
    }
    g.globalAlpha = 1;
    // بركة (أسفل الدرب بقليل حتى يبقى الممرّ سالكًا)
    g.fillStyle = '#103040';
    g.beginPath(); g.ellipse(x + 6, 252, 60, 14, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#164354';
    g.beginPath(); g.ellipse(x + 6, 251, 50, 10, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 7; i++) {
      g.globalAlpha = 0.18 + 0.12 * Math.sin(t * 2 + i);
      g.strokeStyle = '#bdeaf4';
      g.beginPath(); g.ellipse(x - 30 + i * 12, 250 + (i % 3) * 3, 14 + (i % 3) * 5, 2, 0, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
    // رذاذ
    for (let i = 0; i < 14; i++) {
      g.globalAlpha = 0.08 + 0.06 * Math.sin(t * 2 + i);
      disc(g, x - 20 + ((i * 11 + t * 7) % 54), 244 - ((i * 13 + t * 9) % 18), 3 + (i % 3), '#d8f4fa');
    }
    g.globalAlpha = 1;
  }

  function drawTree(g, p, t) {
    const sway = Math.sin(t * 0.9 + p.x * 0.03) * 1.2;
    const dark = p.tone ? '#08120f' : '#0b1713';
    const lit = p.tone ? '#153228' : '#193b2e';
    rect(g, p.x - 1, p.y - 4, 2, 5, '#0a0806');
    for (let i = 0; i < 5; i++) {
      const hh = p.h * (0.34 + i * 0.14);
      const ww = p.w * (1 - i * 0.16);
      const yy = p.y - 5 - i * p.h * 0.16;
      g.fillStyle = i % 2 ? lit : dark;
      g.beginPath();
      g.moveTo(p.x - ww / 2 + sway * (i / 5), yy);
      g.lineTo(p.x + sway * (i / 5), yy - hh);
      g.lineTo(p.x + ww / 2 + sway * (i / 5), yy);
      g.closePath(); g.fill();
    }
  }

  function drawRock(g, p) {
    g.fillStyle = p.tone < 0.5 ? '#20251f' : '#262a26';
    g.beginPath();
    g.moveTo(p.x - p.w, p.y);
    g.lineTo(p.x - p.w * 0.5, p.y - p.h);
    g.lineTo(p.x + p.w * 0.2, p.y - p.h * 1.2);
    g.lineTo(p.x + p.w, p.y);
    g.closePath(); g.fill();
    g.fillStyle = 'rgba(180,200,190,.10)';
    g.fillRect(p.x - p.w * 0.4, p.y - p.h * 0.85, Math.max(1, p.w * 0.7), 1);
  }

  function drawFlower(g, p, t) {
    const glowA = 0.28 + 0.22 * Math.sin(t * 1.3 + p.phase);
    const sway = Math.sin(t * 1.1 + p.phase) * 1;
    line(g, p.x, p.y, p.x + sway, p.y - 6, '#1e3a2c', 1);
    g.globalAlpha = glowA + 0.2;
    disc(g, p.x + sway, p.y - 7, 1.6, p.c);
    g.globalAlpha = glowA * 0.55;
    disc(g, p.x + sway, p.y - 7, 5, p.c);
    g.globalAlpha = 1;
  }

  function drawLantern(g, p, t) {
    rect(g, p.x - 1, p.y - p.h, 2, p.h, '#2a2118');
    rect(g, p.x - 5, p.y - p.h - 6, 10, 7, '#3a2a1c');
    rect(g, p.x - 4, p.y - p.h - 5, 8, 5, '#f4cf7a');
    g.globalAlpha = 0.75 + 0.15 * Math.sin(t * 3 + p.x);
    glow(g, p.x, p.y - p.h - 2, 26, 'rgba(255,190,90,.55)', 0.55);
    g.globalAlpha = 1;
    disc(g, p.x, p.y - p.h - 2, 2, '#fff1c8');
  }

  function drawCamp(g, t) {
    const x = 322, y = 250;
    rect(g, x - 12, y - 2, 24, 3, '#2a2018');
    rect(g, x - 3, y - 8, 6, 6, '#3a2a1e');
    glow(g, x, y - 8, 34, 'rgba(255,160,70,.55)', 0.5);
    for (let i = 0; i < 4; i++) {
      const h = 5 + i * 3 + Math.sin(t * 7 + i * 1.5) * 2;
      g.globalAlpha = 0.75 - i * 0.13;
      g.fillStyle = i < 2 ? '#ffe08a' : '#e07a3f';
      g.beginPath();
      g.moveTo(x - 3 + i, y - 4);
      g.lineTo(x + Math.sin(t * 6 + i) * 2, y - 4 - h);
      g.lineTo(x + 3 - i, y - 4);
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
    // مقعد حجري
    rect(g, x + 18, y - 5, 12, 3, '#2a2a26');
    rect(g, x + 19, y - 2, 2, 4, '#1e1e1a');
    rect(g, x + 27, y - 2, 2, 4, '#1e1e1a');
  }

  function drawShrine(g, t) {
    const x = 1420, y = 252;
    glow(g, x, y - 56, 100, 'rgba(255,190,100,.22)', 0.5);
    // منصّة ودرجات
    rect(g, x - 56, y - 4, 112, 7, '#2a2a28');
    rect(g, x - 46, y - 10, 92, 6, '#34332e');
    rect(g, x - 36, y - 16, 72, 6, '#3e3c34');
    // عمودان
    for (const dx of [-25, 25]) {
      rect(g, x + dx - 4, y - 66, 8, 52, '#4a4740');
      rect(g, x + dx - 6, y - 68, 12, 5, '#6a6250');
      rect(g, x + dx - 5, y - 18, 10, 4, '#5a5548');
      rect(g, x + dx - 2, y - 64, 2, 46, '#5a5548');
    }
    // عتبة وقوس
    rect(g, x - 32, y - 74, 64, 7, '#5a5548');
    rect(g, x - 28, y - 80, 56, 6, '#6a6250');
    rect(g, x - 20, y - 86, 40, 6, '#4a4740');
    // توهج داخلي
    glow(g, x, y - 48, 34, 'rgba(255,214,140,.55)', 0.6);
    // تمثال صغير
    rect(g, x - 6, y - 44, 12, 22, '#3a3832');
    rect(g, x - 4, y - 52, 8, 9, '#46443c');
    disc(g, x, y - 56, 4, '#4e4b42');
    // شموع
    for (let i = 0; i < 10; i++) {
      const cx = x - 44 + (i * 9.5), cy = y - 6 - (i % 3) * 2;
      rect(g, cx, cy - 4, 2, 4, '#d8c8a0');
      glow(g, cx + 1, cy - 6, 10, 'rgba(255,190,80,.7)', 0.45);
      rect(g, cx + 1, cy - 7, 1, 2, i % 2 ? '#ffe9b0' : '#ffb45a');
    }
    // أعلام صغيرة
    rect(g, x - 52, y - 88, 1, 28, '#2a2018');
    g.fillStyle = '#5e1219';
    g.beginPath(); g.moveTo(x - 51, y - 88); g.lineTo(x - 34, y - 84); g.lineTo(x - 34, y - 72); g.lineTo(x - 51, y - 76); g.closePath(); g.fill();
    rect(g, x - 43, y - 84, 3, 3, '#c9a227');
    // رموز محفورة
    g.globalAlpha = 0.3;
    g.strokeStyle = '#c9a227';
    g.beginPath(); g.arc(x, y - 30, 9, 0, 6.3); g.stroke();
    g.beginPath(); g.moveTo(x, y - 39); g.lineTo(x, y - 21); g.moveTo(x - 9, y - 30); g.lineTo(x + 9, y - 30); g.stroke();
    g.globalAlpha = 1;
  }

  function drawMeditation(g, p, t) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + p.x * 0.01);
    const wy = p.y - 30 + Math.sin(t * 1.4 + p.x * 0.02) * 3;
    g.globalAlpha = 0.15 + pulse * 0.12;
    g.strokeStyle = '#f0d27a';
    g.beginPath(); g.ellipse(p.x, p.y - 1, 16 + pulse * 4, 5 + pulse * 2, 0, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = 1;
    glow(g, p.x, wy, 22, 'rgba(255,226,150,.7)', 0.35 + pulse * 0.2);
    disc(g, p.x, wy, 2, '#fff6d8');
    g.globalAlpha = 0.5 + pulse * 0.3;
    disc(g, p.x, wy, 4, '#f0d27a');
    g.globalAlpha = 1;
    // حجر صغير
    g.fillStyle = '#34342e';
    g.beginPath(); g.moveTo(p.x - 6, p.y); g.lineTo(p.x - 3, p.y - 5); g.lineTo(p.x + 3, p.y - 6); g.lineTo(p.x + 6, p.y); g.closePath(); g.fill();
  }

  function animalShadow(g, x, y, w) {
    g.globalAlpha = 0.26;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(x, y - 1, w, 2.6, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }

  function drawHorse(g, p, t) {
    const bob = Math.sin(t * 0.9 + p.phase) * 0.5;
    animalShadow(g, p.x, p.y, 13);
    g.save();
    g.translate(p.x, p.y + bob);
    if (p.flip) g.scale(-1, 1);
    const body = '#5a3a26', dark = '#3a2418', mane = '#241610', hoof = '#161210';
    rect(g, -11, -18, 21, 9, body);
    rect(g, -13, -16, 3, 7, dark);
    rect(g, 7, -22, 4, 8, body);
    rect(g, 9, -25, 7, 4, body);
    rect(g, 15, -24, 2, 3, dark);
    rect(g, 8, -27, 3, 3, mane);
    rect(g, 6, -21, 3, 7, mane);
    rect(g, -9, -9, 2, 9, dark); rect(g, -5, -9, 2, 9, dark);
    rect(g, 6, -9, 2, 9, dark); rect(g, 10, -9, 2, 9, dark);
    rect(g, -9, -2, 3, 2, hoof); rect(g, -5, -2, 3, 2, hoof);
    rect(g, 6, -2, 3, 2, hoof); rect(g, 10, -2, 3, 2, hoof);
    rect(g, -14, -17, 3, 9, mane);
    rect(g, -16, -14, 3, 6, dark);
    rect(g, 14, -23, 1, 1, '#090604');
    rect(g, -2, -18, 6, 1, 'rgba(255,255,255,.10)');
    g.restore();
  }

  function drawCow(g, p, t) {
    const bob = Math.sin(t * 0.7 + p.phase) * 0.45;
    animalShadow(g, p.x, p.y, 12);
    g.save();
    g.translate(p.x, p.y + bob);
    if (p.flip) g.scale(-1, 1);
    const body = '#d6cec2', patch = '#2a2420', pink = '#c98a80';
    rect(g, -10, -16, 20, 9, body);
    rect(g, -7, -15, 6, 5, patch);
    rect(g, 2, -12, 5, 4, patch);
    rect(g, -8, -8, 2, 8, '#b8b0a4'); rect(g, -4, -8, 2, 8, '#b8b0a4');
    rect(g, 4, -8, 2, 8, '#b8b0a4'); rect(g, 8, -8, 2, 8, '#b8b0a4');
    rect(g, -8, -1, 3, 1, '#1a1614'); rect(g, -4, -1, 3, 1, '#1a1614');
    rect(g, 4, -1, 3, 1, '#1a1614'); rect(g, 8, -1, 3, 1, '#1a1614');
    rect(g, 9, -19, 6, 6, body);
    rect(g, 13, -16, 3, 3, pink);
    rect(g, 10, -21, 1, 2, '#efe8dc'); rect(g, 13, -21, 1, 2, '#efe8dc');
    rect(g, 9, -18, 1, 1, '#201a18');
    rect(g, -11, -15, 3, 6, body); rect(g, -12, -11, 2, 3, patch);
    rect(g, -10, -16, 8, 1, 'rgba(255,255,255,.18)');
    g.restore();
  }

  function drawSheep(g, p, t) {
    const bob = Math.sin(t * 0.8 + p.phase) * 0.5;
    animalShadow(g, p.x, p.y, 10);
    g.save();
    g.translate(p.x, p.y + bob);
    if (p.flip) g.scale(-1, 1);
    const wool = '#e6ded0', wool2 = '#cfc6b6', face = '#3a3230';
    disc(g, -6, -14, 5, wool);
    disc(g, 0, -16, 5, wool2);
    disc(g, 6, -13, 4, wool);
    rect(g, -9, -13, 17, 5, wool);
    rect(g, 7, -17, 4, 5, face);
    rect(g, 8, -18, 3, 2, wool2);
    rect(g, 10, -16, 1, 1, '#0a0806');
    rect(g, -7, -8, 1, 8, face); rect(g, -3, -8, 1, 8, face);
    rect(g, 3, -8, 1, 8, face); rect(g, 6, -8, 1, 8, face);
    rect(g, -7, -1, 2, 1, '#1a1614'); rect(g, 3, -1, 2, 1, '#1a1614');
    g.restore();
  }

  function drawPig(g, p, t) {
    const bob = Math.sin(t * 1.1 + p.phase) * 0.4;
    animalShadow(g, p.x, p.y, 9);
    g.save();
    g.translate(p.x, p.y + bob);
    if (p.flip) g.scale(-1, 1);
    const body = '#c98a80', dark = '#a86a64', snout = '#e4aaa0';
    rect(g, -9, -12, 16, 7, body);
    rect(g, 4, -15, 6, 5, body);
    rect(g, 9, -13, 3, 3, snout);
    rect(g, 10, -12, 1, 1, '#7a4a44');
    rect(g, 5, -17, 2, 2, dark);
    rect(g, -6, -6, 2, 6, dark); rect(g, -1, -6, 2, 6, dark);
    rect(g, 4, -6, 2, 6, dark); rect(g, 8, -6, 2, 6, dark);
    rect(g, -10, -12, 2, 4, dark);
    line(g, -11, -10, -14, -13, dark, 1);
    line(g, -14, -13, -12, -15, dark, 1);
    rect(g, 7, -14, 1, 1, '#160d0c');
    g.restore();
  }

  function drawChicken(g, p, t) {
    const bob = Math.sin(t * 3 + p.phase) * 0.6;
    animalShadow(g, p.x, p.y, 4);
    g.save();
    g.translate(p.x, p.y + bob);
    if (p.flip) g.scale(-1, 1);
    const body = '#e2d8c6', dark = '#c4b8a2';
    disc(g, 0, -5, 3.4, body);
    disc(g, 2, -8, 2.2, body);
    rect(g, 2, -11, 2, 2, '#c33a2e');
    rect(g, 1, -9, 1, 1, '#1a1410');
    rect(g, 4, -8, 2, 1, '#e0a040');
    rect(g, -1, -2, 1, 2, '#e0a040'); rect(g, 2, -2, 1, 2, '#e0a040');
    rect(g, -2, -5, 2, 1, dark);
    g.restore();
  }

  // الفلاح حسين: شيخٌ كبير يقف عند الحضيرة متكئًا على عصاه.
  function drawFarmer(g, p, t) {
    const bob = Math.sin(t * 1.4 + p.phase) * 0.5;
    animalShadow(g, p.x, p.y, 8);
    // دلو الحبّ
    rect(g, p.x + 10, p.y - 5, 7, 5, '#3a2a1c');
    rect(g, p.x + 10, p.y - 5, 7, 1, '#5a4630');
    rect(g, p.x + 12, p.y - 7, 3, 2, '#c9a227');
    // عصا خشبية عتيقة في يده اليمنى (تُرسم قبل الشخصية فتظهر اليد ممسكة بها)
    rect(g, p.x + 10, p.y - 38, 2, 40, '#5a3f24');
    rect(g, p.x + 10, p.y - 38, 1, 22, '#7a5a34');
    rect(g, p.x + 9, p.y - 40, 4, 2, '#6e5133');
    rect(g, p.x + 12, p.y - 24, 2, 1, '#3a2a1a');
    rect(g, p.x + 8, p.y - 18, 2, 1, '#3a2a1a');
    rect(g, p.x + 12, p.y - 31, 2, 1, '#8a6a3c');
    A.art.drawSprite(g, A.art.spr('farmer'), p.x, p.y + bob, 2.05, false, 1);
    // دجاجة صغيرة عند قدميه
    const hb = Math.sin(t * 3.1 + 1.4) * 0.5;
    disc(g, p.x - 10, p.y - 3 + hb, 2.4, '#e2d8c6');
    disc(g, p.x - 8.5, p.y - 5 + hb, 1.4, '#e2d8c6');
    rect(g, p.x - 8, p.y - 7 + hb, 1, 1, '#c33a2e');
  }

  function drawStable(g, p, t) {
    const x = p ? p.x : 704, y = p ? p.y : 214;
    // كومة قش
    rect(g, x - 36, y - 7, 16, 7, '#7a5a26');
    rect(g, x - 34, y - 10, 12, 4, '#8f6c30');
    for (let i = 0; i < 5; i++) rect(g, x - 35 + i * 3, y - 7, 1, 7, '#5e441c');
    // حظيرة
    rect(g, x - 26, y - 30, 52, 30, '#33251a');
    rect(g, x - 26, y - 30, 52, 2, '#4a3624');
    g.fillStyle = '#4a3320';
    g.beginPath();
    g.moveTo(x - 32, y - 30); g.lineTo(x, y - 44); g.lineTo(x + 32, y - 30); g.closePath(); g.fill();
    g.fillStyle = '#5e4228';
    g.beginPath();
    g.moveTo(x - 26, y - 31); g.lineTo(x, y - 41); g.lineTo(x + 8, y - 35); g.closePath(); g.fill();
    // باب
    rect(g, x - 8, y - 22, 16, 22, '#150e09');
    rect(g, x - 9, y - 23, 18, 2, '#5e4228');
    rect(g, x - 2, y - 15, 4, 4, '#33251a');
    // فانوس
    rect(g, x + 24, y - 22, 1, 8, '#2a2018');
    rect(g, x + 22, y - 26, 5, 5, '#3a2a1c');
    rect(g, x + 23, y - 25, 3, 3, '#f4cf7a');
    glow(g, x + 24, y - 24, 12, 'rgba(255,190,90,.5)', 0.5 + Math.sin(t * 3) * 0.08);
    // سياج صغير
    for (let i = 0; i < 4; i++) rect(g, x - 30 + i * 16, y - 8, 2, 8, '#3a2a1c');
    rect(g, x - 30, y - 6, 52, 1, '#4a3624');
  }

  function drawPen(g, p, t) {
    const x0 = p.x - p.w / 2, x1 = p.x + p.w / 2, y = p.y;
    g.globalAlpha = 0.16;
    g.fillStyle = '#223a2a';
    g.fillRect(x0, y - 28, p.w, 28);
    g.globalAlpha = 1;
    const wood = '#4a3520', wood2 = '#5e4528';
    for (let x = x0; x <= x1; x += 22) {
      rect(g, x - 1, y - 22, 2, 22, wood);
      rect(g, x - 1, y - 24, 3, 2, wood2);
    }
    rect(g, x0, y - 18, x1 - x0, 2, wood2);
    rect(g, x0, y - 10, x1 - x0, 2, wood);
    rect(g, x0, y - 2, x1 - x0, 2, wood);
    // قش ودلو
    rect(g, x0 + 10, y - 6, 18, 6, '#8a6a30');
    for (let i = 0; i < 6; i++) rect(g, x0 + 11 + i * 3, y - 6, 1, 6, '#6a5024');
    rect(g, x1 - 22, y - 8, 7, 8, '#4a4038');
    rect(g, x1 - 22, y - 8, 7, 1, '#5e544a');
    // طائر على السياج
    const bx = x0 + 66, by = y - 24;
    const hop = Math.sin(t * 2.2 + 1.2) > 0.86 ? 1 : 0;
    disc(g, bx, by - hop, 2, '#d8cbb4');
    disc(g, bx + 1, by - 2 - hop, 1.4, '#d8cbb4');
    rect(g, bx + 2, by - 2 - hop, 1, 1, '#e0a040');
  }

  function drawSign(g, p) {
    g.save();
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 7px "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif';
    const bw = Math.max(38, Math.ceil(g.measureText(p.text).width) + 14);
    rect(g, p.x - 1, p.y - 19, 2, 19, '#3a2a1c');
    rect(g, p.x - bw / 2, p.y - 31, bw, 13, '#4a3422');
    rect(g, p.x - bw / 2, p.y - 31, bw, 2, '#5e4528');
    rect(g, p.x - bw / 2, p.y - 20, bw, 2, '#2a1c12');
    rect(g, p.x - bw / 2 + 2, p.y - 30, 1, 10, '#5a4128');
    g.fillStyle = '#d8c090';
    g.fillText(p.text, p.x, p.y - 24);
    g.restore();
  }

  function drawGuard(g, p, t) {
    const bob = Math.sin(t * 1.5 + p.phase) * 0.5;
    animalShadow(g, p.x, p.y, 9);
    A.art.drawSprite(g, A.art.spr('soldier'), p.x, p.y + bob, 2.05, p.flip, 1);
  }

  function gateBanner(g, x, y, h, col, emblem) {
    rect(g, x, y - h, 2, h, '#3a2c1e');
    const w = 16, hh = 26;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + 2, y - h); g.lineTo(x + 2 + w, y - h); g.lineTo(x + 2 + w, y - h + hh);
    g.lineTo(x + 2 + w / 2, y - h + hh - 5); g.lineTo(x + 2, y - h + hh);
    g.closePath(); g.fill();
    if (emblem) rect(g, x + 2 + w / 2 - 1, y - h + 8, 3, 3, emblem);
  }

  function drawFortGate(g, t) {
    const x0 = -34, x1 = 252, base = 252, top = 150;
    // جسم السور
    rect(g, x0, top, x1 - x0, base - top, '#221d2b');
    rect(g, x0, top, x1 - x0, 4, '#332c40');
    // مداميك الحجر
    g.fillStyle = '#2b2537';
    for (let y = top + 10; y < base; y += 12) {
      g.fillRect(x0, y, x1 - x0, 1);
      const off = (Math.floor(y / 12) % 2) * 10;
      for (let x = x0 + off; x < x1; x += 20) g.fillRect(x, y, 1, 12);
    }
    // شرفات السور
    for (let x = x0 + 4; x < x1 - 8; x += 27) {
      rect(g, x, top - 12, 17, 12, '#2b2537');
      rect(g, x + 14, top - 12, 3, 12, '#1a1622');
    }
    // برجان
    for (const tx of [30, 232]) {
      rect(g, tx - 17, 106, 34, 146, '#2a2435');
      rect(g, tx - 19, 100, 38, 8, '#332c40');
      for (let i = 0; i < 4; i++) rect(g, tx - 19 + i * 10, 92, 7, 8, '#332c40');
      rect(g, tx - 3, 124, 6, 14, '#0b0910');
      rect(g, tx - 5, 124, 10, 2, '#3a3344');
      // مشعل على البرج
      rect(g, tx + 14, 168, 1, 10, '#2a2018');
      glow(g, tx + 14, 166, 16, 'rgba(255,170,80,.6)', 0.45 + Math.sin(t * 4 + tx) * 0.08);
      rect(g, tx + 14, 165, 1, 3, '#ffe0a0');
    }
    // فتحة البوابة
    const gw = 60, gx = GATE_X;
    g.fillStyle = '#08060c';
    g.beginPath();
    g.moveTo(gx - gw / 2, base);
    g.lineTo(gx - gw / 2, 188);
    g.arc(gx, 188, gw / 2, Math.PI, 0);
    g.lineTo(gx + gw / 2, base);
    g.closePath();
    g.fill();
    glow(g, gx, 236, 46, 'rgba(255,170,80,.22)', 0.6);
    // بابان خشبيان مفتوحان
    rect(g, gx - gw / 2 - 2, 192, 11, base - 192, '#2c1c14');
    rect(g, gx + gw / 2 - 9, 192, 11, base - 192, '#2c1c14');
    for (let i = 0; i < 4; i++) {
      rect(g, gx - gw / 2 - 1, 198 + i * 15, 9, 1, '#4a3222');
      rect(g, gx + gw / 2 - 8, 198 + i * 15, 9, 1, '#4a3222');
    }
    // مصراع حديدي مرفوع
    g.fillStyle = '#4a4250';
    for (let i = 0; i < 5; i++) rect(g, gx - gw / 2 + 9 + i * 10, 150, 2, 30, '#4a4250');
    rect(g, gx - gw / 2 + 6, 156, gw - 12, 2, '#4a4250');
    rect(g, gx - gw / 2 + 6, 168, gw - 12, 2, '#4a4250');
    // إطار حجري للقوس
    g.strokeStyle = '#3a3344';
    g.lineWidth = 5;
    g.beginPath();
    g.arc(gx, 188, gw / 2 + 3, Math.PI, 0);
    g.stroke();
    // مشاعل على جانبي البوابة
    for (const [tx, ph] of [[gx - gw / 2 - 14, 0], [gx + gw / 2 + 14, 2]]) {
      rect(g, tx, 196, 2, 14, '#2a2018');
      rect(g, tx - 4, 193, 10, 3, '#3a2a20');
      glow(g, tx + 1, 188, 24, 'rgba(255,160,60,.65)', 0.55);
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.7 - i * 0.16;
        g.fillStyle = i ? '#e07a3f' : '#ffe08a';
        g.beginPath();
        g.moveTo(tx - 3 + i, 192);
        g.lineTo(tx + 1 + Math.sin(t * 6 + ph + i) * 2, 184 - i * 2);
        g.lineTo(tx + 4 - i, 192);
        g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    }
    // راية فوق البوابة
    gateBanner(g, gx + 3, 150, 42, '#5e1219', '#c9a227');
    // لوحة اسم المملكة
    rect(g, gx - 30, 198, 60, 12, '#1a1420');
    rect(g, gx - 30, 198, 60, 1, '#5a4a2a');
    g.save();
    g.direction = 'rtl';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = 'bold 8px "Noto Kufi Arabic", "Noto Sans Arabic", sans-serif';
    g.fillStyle = '#c9a227';
    g.fillText('دير النار', gx, 204);
    g.restore();
    // ظل الأرض عند البوابة
    g.globalAlpha = 0.22;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(gx, base - 2, 52, 6, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
  }

  function drawProp(g, p, t) {
    if (p.type === 'tree') drawTree(g, p, t);
    else if (p.type === 'rock') drawRock(g, p);
    else if (p.type === 'flower') drawFlower(g, p, t);
    else if (p.type === 'lantern') drawLantern(g, p, t);
    else if (p.type === 'camp') drawCamp(g, t);
    else if (p.type === 'shrine') drawShrine(g, t);
    else if (p.type === 'cliff') drawCliff(g, t);
    else if (p.type === 'lake') drawLake(g, t);
    else if (p.type === 'gate') drawFortGate(g, t);
    else if (p.type === 'guard') drawGuard(g, p, t);
    else if (p.type === 'stable') drawStable(g, p, t);
    else if (p.type === 'pen') drawPen(g, p, t);
    else if (p.type === 'horse') drawHorse(g, p, t);
    else if (p.type === 'cow') drawCow(g, p, t);
    else if (p.type === 'sheep') drawSheep(g, p, t);
    else if (p.type === 'pig') drawPig(g, p, t);
    else if (p.type === 'chicken') drawChicken(g, p, t);
    else if (p.type === 'farmer') drawFarmer(g, p, t);
    else if (p.type === 'sign') drawSign(g, p);
  }

  function drawPlayer(g, t) {
    const s = state();
    const sc = 2.15 + (player.y - WALK.y0) / (WALK.y1 - WALK.y0) * 0.58;
    const bob = player.moving ? Math.sin(t * 11) * 0.8 : Math.sin(t * 2) * 0.35;
    // اللاعب يُرسم في إحداثيات العالم — لازم نطرح الكاميرا مثله مثل الأرض والديكور،
    // وإلا بقي على إحداثيات العالم وطلع من الشاشة مع تقدّمه رغم أن الكاميرا تتبعه.
    g.save();
    g.translate(-camX, 0);
    // ظل
    g.globalAlpha = 0.34;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(player.x, player.y - 1, 9 * sc, 2.6 * sc, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    // هالة دافئة خفيفة
    glow(g, player.x, player.y - 12, 22, 'rgba(230,200,140,.18)', 0.5);
    const spr = A.art.spr('hero', {
      look: s ? s.look : 0,
      pose: player.moving ? 'walk' : 'idle',
      weapon: s && s.flags && s.flags.bow ? 'bow' : s && s.flags && s.flags.sword ? 'sword' : null,
      cloak: true,
    });
    A.art.drawSprite(g, spr, player.x, player.y + bob, sc, player.facing < 0, 1);
    g.restore();
  }

  function drawForeground(g, camX, t) {
    // عشب أمامي داكن يتحرك أسرع قليلًا من العالم
    g.save();
    g.translate(-camX * 1.06, 0);
    for (let i = 0; i < 34; i++) {
      const x = -80 + i * 56 + Math.sin(i * 2.7) * 14;
      const y = 266 + (i % 3) * 2;
      const h = 10 + (i % 5) * 5;
      const sway = Math.sin(t * 1.3 + i) * 2;
      for (let j = 0; j < 3; j++) {
        g.strokeStyle = j === 0 ? '#050b08' : '#08120d';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + j * 3 - 3, y);
        g.quadraticCurveTo(x + j * 2 + sway, y - h * 0.6, x + j * 3 - 6 + sway, y - h - (j % 2) * 4);
        g.stroke();
      }
    }
    g.restore();
  }

  function drawPetals(g, t) {
    for (const p of PETALS) {
      const x = (p.x + p.vx * t + Math.sin(t * 0.7 + p.p) * 5 + VW * 4) % VW;
      const y = (p.y + p.vy * t) % VH;
      g.globalAlpha = 0.22 + 0.18 * Math.sin(t + p.p);
      rect(g, x, y, 2, 1, p.c);
      g.globalAlpha = 1;
    }
  }

  function drawFireflies(g, camX, t) {
    for (const f of FIREFLIES) {
      const sx = f.x - camX;
      if (sx < -20 || sx > VW + 20) continue;
      const x = sx + Math.sin(t * f.sp + f.p) * 5;
      const y = f.y + Math.sin(t * f.sp * 1.7 + f.p * 2) * 3;
      const a = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2 + f.p));
      g.globalAlpha = a;
      disc(g, x, y, f.r, '#ffe9a8');
      g.globalAlpha = a * 0.3;
      disc(g, x, y, f.r * 4, '#ffcf6a');
      g.globalAlpha = 1;
    }
  }

  function drawBirds(g, t) {
    g.globalAlpha = 0.25;
    g.fillStyle = '#9cb8cc';
    for (let i = 0; i < 5; i++) {
      const x = (60 + i * 74 + t * (4 + i)) % (VW + 80) - 40;
      const y = 62 + i * 11 + Math.sin(t * 0.5 + i) * 5;
      g.fillRect(x, y, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x + 4, y, 2, 1);
    }
    g.globalAlpha = 1;
  }

  function render(g, t) {
    // سماء
    const sky = g.createLinearGradient(0, 0, 0, VH);
    sky.addColorStop(0, '#050912');
    sky.addColorStop(0.45, '#0b1627');
    sky.addColorStop(0.75, '#183047');
    sky.addColorStop(1, '#243c4a');
    g.fillStyle = sky;
    g.fillRect(0, 0, VW, VH);

    drawStars(g, t);
    drawAurora(g, t);
    drawMoon(g, t);
    drawBirds(g, t);
    drawPeaks(g, FAR, camX * 0.12, '#1a2943', '#b8cde0', 0.85);
    mist(g, 142, t, '150,190,210');
    drawPeaks(g, MID, camX * 0.32, '#101d31', '#8298b2', 0.92);
    mist(g, 176, t, '140,180,200');

    ground(g, camX, t);

    // العالم: طبقات خلف اللاعب
    g.save();
    g.translate(-camX, 0);
    for (const p of PROPS) {
      if (p.x - camX < -140 || p.x - camX > VW + 140) continue;
      if (p.y <= player.y) drawProp(g, p, t);
    }
    for (const p of POINTS) drawMeditation(g, p, t);
    g.restore();

    drawPlayer(g, t);

    // الطبقات الأمامية
    g.save();
    g.translate(-camX, 0);
    for (const p of PROPS) {
      if (p.x - camX < -140 || p.x - camX > VW + 140) continue;
      if (p.y > player.y) drawProp(g, p, t);
    }
    g.restore();

    drawFireflies(g, camX, t);
    drawPetals(g, t);
    drawForeground(g, camX, t);

    // تعتيم أطراف
    const vg = g.createRadialGradient(VW / 2, VH / 2, 100, VW / 2, VH / 2, 330);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.52)');
    g.fillStyle = vg;
    g.fillRect(0, 0, VW, VH);
  }

  M.draw = function (ctx, now) {
    if (!active) return;
    // شبكة أمان: لو رمى أي رسم استثناءً في منتصف الإطار يبقى التحويل نظيفًا
    // بدل أن يتراكم الانزياح عامًا بعد عام (كان يجمّد الصورة ويترك أشكالًا عالقة).
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    try {
      update(dt);
      render(ctx, now / 1000);
    } catch (e) {
      console.warn('mountain draw:', e);
    } finally {
      // مهما حدث داخل الرسم، لا نترك قماش اللعبة منزاحًا أو نصف مرسوم.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  // مشهد احتياطي إن استُدعي A.art.drawScene('mountain') من خارج العالم
  if (A.art.defineScene) {
    A.art.defineScene('mountain', (g, t) => {
      const sky = g.createLinearGradient(0, 0, 0, VH);
      sky.addColorStop(0, '#050912');
      sky.addColorStop(0.6, '#14273a');
      sky.addColorStop(1, '#243c4a');
      g.fillStyle = sky; g.fillRect(0, 0, VW, VH);
      drawStars(g, t);
      drawAurora(g, t);
      drawMoon(g, t);
      drawPeaks(g, FAR, 0, '#1a2943', '#b8cde0', 0.85);
      drawPeaks(g, MID, 0, '#101d31', '#8298b2', 0.92);
      ground(g, 0, t);
      g.save();
      drawShrine(g, t);
      drawCliff(g, t);
      drawLake(g, t);
      g.restore();
      drawPetals(g, t);
    });
  }
})(window.ASH);
