/* ============================================================
   فن الخلفيات — مشاهد بيكسل متحركة
   ============================================================ */
(function (A) {
  const W = 480, H = 270;
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
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
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
  const sky = (g, c1, c2, y2) => {
    const gr = g.createLinearGradient(0, 0, 0, y2 || 200);
    gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.fillStyle = gr; g.fillRect(0, 0, W, y2 || 200);
  };
  const glow = (g, x, y, r, c, a) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = a == null ? 0.5 : a;
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  };

  // ---------- بيانات ثابتة ----------
  const R = A.rng(20261108);
  const STARS = Array.from({ length: 130 }, () => ({
    x: R() * W, y: R() * 165, s: R() < 0.86 ? 1 : 2, p: R() * 6.28, b: 0.3 + R() * 0.7,
  }));
  const EMBERS = Array.from({ length: 46 }, () => ({
    x: R() * W, y: R() * H, sp: 4 + R() * 14, ph: R() * 6.28, sz: R() < 0.7 ? 1 : 2, a: 0.25 + R() * 0.6,
  }));
  const FLIES = Array.from({ length: 28 }, () => ({
    x: 30 + R() * 420, y: 110 + R() * 120, ph: R() * 6.28, sp: 0.4 + R() * 0.9,
  }));
  const ASH = Array.from({ length: 60 }, () => ({
    x: R() * W, y: R() * H, sp: 6 + R() * 16, ph: R() * 6.28, sz: R() < 0.8 ? 1 : 2,
  }));
  const MOUNTAINS = [];
  function ridge(seed, baseY, amp, n) {
    const rr = A.rng(seed);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * W;
      const y = baseY - (i % 2 === 0 ? amp * (0.6 + rr() * 0.6) : amp * 0.18 * rr());
      pts.push([x, y]);
    }
    return pts;
  }
  MOUNTAINS.push(ridge(11, 150, 58, 16));
  MOUNTAINS.push(ridge(22, 172, 40, 12));
  MOUNTAINS.push(ridge(33, 196, 24, 10));

  const TREES = [];
  (function () {
    const rr = A.rng(777);
    for (let i = 0; i < 26; i++) TREES.push({ x: rr() * W, y: 150 + rr() * 90, h: 40 + rr() * 60, w: 18 + rr() * 22, d: rr() < 0.5 ? 0 : 1 });
  })();

  function stars(g, t) {
    for (const s of STARS) {
      const a = s.b * (0.55 + 0.45 * Math.sin(t * 0.8 + s.p));
      g.globalAlpha = a;
      g.fillStyle = '#e8e2d0';
      g.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
    }
    g.globalAlpha = 1;
  }
  function moon(g, x, y, r, col) {
    disc(g, x, y, r, col);
    disc(g, x + r * 0.25, y - r * 0.15, r * 0.24, 'rgba(120,110,120,.22)');
    disc(g, x - r * 0.3, y + r * 0.3, r * 0.17, 'rgba(120,110,120,.18)');
    disc(g, x + r * 0.1, y + r * 0.5, r * 0.1, 'rgba(120,110,120,.16)');
    glow(g, x, y, r * 2.4, 'rgba(210,215,230,.5)', 0.14);
  }
  function mountainLayer(g, pts, color) {
    g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
    for (const p of pts) g.lineTo(p[0], p[1]);
    g.lineTo(W, H); g.closePath(); g.fill();
  }
  function pine(g, x, y, h, w, c, c2) {
    rect(g, x - 1, y - h * 0.25, 2, h * 0.25, c2 || c);
    for (let i = 0; i < 4; i++) {
      const yy = y - h * 0.2 - (h * 0.8) * (i / 4);
      const ww = w * (1 - i * 0.18);
      g.fillStyle = i % 2 && c2 ? c2 : c;
      g.beginPath();
      g.moveTo(x - ww / 2, yy);
      g.lineTo(x, yy - h * 0.34);
      g.lineTo(x + ww / 2, yy);
      g.closePath(); g.fill();
    }
  }
  function fog(g, t, y, h, col, a) {
    for (let i = 0; i < 3; i++) {
      const dx = Math.sin(t * 0.18 + i * 2) * 26;
      g.globalAlpha = a;
      g.fillStyle = col;
      g.fillRect(-40 + dx + i * 170, y + Math.sin(t * 0.3 + i) * 3, 200, h);
    }
    g.globalAlpha = 1;
  }
  function embers(g, t, yMax) {
    for (const e of EMBERS) {
      const y = ((e.y - t * e.sp) % (yMax || H) + (yMax || H)) % (yMax || H);
      const x = e.x + Math.sin(t * 1.1 + e.ph) * 7;
      g.globalAlpha = e.a * (0.6 + 0.4 * Math.sin(t * 2 + e.ph));
      g.fillStyle = '#e8823f';
      g.fillRect(Math.round(x), Math.round(y), e.sz, e.sz);
    }
    g.globalAlpha = 1;
  }
  function flies(g, t) {
    for (const f of FLIES) {
      const x = f.x + Math.sin(t * f.sp + f.ph) * 14;
      const y = f.y + Math.cos(t * f.sp * 0.8 + f.ph) * 9;
      const a = 0.25 + 0.55 * Math.abs(Math.sin(t * 1.3 + f.ph));
      g.globalAlpha = a * 0.35; g.fillStyle = '#9fe0b4'; disc(g, x, y, 2, '#9fe0b4');
      g.globalAlpha = a; rect(g, x, y, 1, 1, '#d8ffcf');
    }
    g.globalAlpha = 1;
  }
  function ashFall(g, t, col) {
    for (const a of ASH) {
      const y = (a.y + t * a.sp) % H;
      const x = a.x + Math.sin(t * 0.5 + a.ph) * 12;
      g.globalAlpha = 0.35 + 0.3 * Math.sin(t + a.ph);
      g.fillStyle = col || '#cfc6b4';
      g.fillRect(Math.round(x), Math.round(y), a.sz, a.sz);
    }
    g.globalAlpha = 1;
  }
  function ground(g, y, c1, c2) {
    rect(g, 0, y, W, H - y, c1);
    rect(g, 0, y, W, 3, c2 || c1);
    for (let i = 0; i < 60; i++) {
      const rr = A.rng(i * 97 + 3)();
      const x = rr * W, yy = y + 5 + ((i * 37) % (H - y - 6));
      g.globalAlpha = 0.25;
      rect(g, x, yy, 2, 1, i % 3 ? '#0a0d10' : '#3a3430');
      g.globalAlpha = 1;
    }
  }
  function hut(g, x, y, s, lit) {
    const w = 54 * s, h = 34 * s;
    rect(g, x - w / 2, y - h, w, h, '#241c22');
    rect(g, x - w / 2, y - h, w, 2, '#33262c');
    // سقف
    g.fillStyle = '#1a1418';
    g.beginPath(); g.moveTo(x - w / 2 - 6, y - h); g.lineTo(x, y - h - 22 * s); g.lineTo(x + w / 2 + 6, y - h); g.closePath(); g.fill();
    rect(g, x - w / 2 - 6, y - h, w + 12, 2, '#2e2226');
    // نافذة
    if (lit) {
      rect(g, x - 5 * s, y - h + 10 * s, 10 * s, 9 * s, '#e8a23f');
      rect(g, x - 5 * s, y - h + 10 * s, 10 * s, 1, '#ffd98a');
      glow(g, x, y - h + 14 * s, 26 * s, 'rgba(240,160,70,.55)', 0.35);
      rect(g, x - 1, y - h + 10 * s, 1, 9 * s, '#6b3a1a');
    } else {
      rect(g, x - 5 * s, y - h + 10 * s, 10 * s, 9 * s, '#0e0a0f');
    }
    // باب
    rect(g, x - 3, y - 12 * s, 7 * s, 12 * s, '#120d12');
    // مدخنة
    rect(g, x + w * 0.24, y - h - 12 * s, 5 * s, 14 * s, '#1e171c');
  }
  function tower(g, x, y, h, s) {
    rect(g, x - 9 * s, y - h, 18 * s, h, '#211a24');
    rect(g, x - 9 * s, y - h, 18 * s, 2, '#33262c');
    rect(g, x - 12 * s, y - h - 10 * s, 24 * s, 11 * s, '#241c26');
    for (let i = 0; i < 3; i++) rect(g, x - 11 * s + i * 8 * s, y - h - 14 * s, 5 * s, 5 * s, '#241c26');
    rect(g, x - 3 * s, y - h - 2 * s, 6 * s, 8 * s, '#e0a044');
    glow(g, x, y - h + 2 * s, 22 * s, 'rgba(230,150,60,.5)', 0.3);
  }
  function banner(g, x, y, h, col, emblem) {
    rect(g, x, y - h, 2, h, '#3a2c1e');
    const w = 16, hh = 26;
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + 2, y - h); g.lineTo(x + 2 + w, y - h); g.lineTo(x + 2 + w, y - h + hh);
    g.lineTo(x + 2 + w / 2, y - h + hh - 5); g.lineTo(x + 2, y - h + hh);
    g.closePath(); g.fill();
    if (emblem) { rect(g, x + 2 + w / 2 - 1, y - h + 8, 3, 3, emblem); }
  }
  function bonfire(g, t, x, y) {
    glow(g, x, y - 12, 52, 'rgba(240,140,50,.75)', 0.32);
    rect(g, x - 9, y - 3, 18, 3, '#1b1412');
    for (let i = 0; i < 5; i++) {
      const f = Math.sin(t * 7 + i * 1.7);
      const h = 10 + i * 3 + f * 4;
      const w = 7 - i;
      g.globalAlpha = 0.85 - i * 0.12;
      g.fillStyle = i < 2 ? '#ffe08a' : i < 4 ? '#e8823f' : '#a8381f';
      g.beginPath();
      g.moveTo(x - w, y - 2);
      g.lineTo(x, y - 2 - h - Math.max(0, f * 5));
      g.lineTo(x + w, y - 2);
      g.closePath(); g.fill();
    }
    g.globalAlpha = 1;
  }

  // ---------- عالم ما بعد الحرب ----------
  // يقرأ النهاية من حالة اللعبة: الاحتلال (bad) أو الترميم (good).
  function postWarMode() {
    const st = A.game && A.game.state;
    if (!st || !st.postWar) return null;
    return st.ending || null;
  }
  function postWarProps(g, t, w, baseY) {
    const mode = postWarMode();
    if (mode === 'bad') occupationProps(g, t, w, baseY);
    else if (mode === 'good') repairProps(g, t, w, baseY);
  }
  // راية احتلال سوداء بشارة قرمزية.
  function enemyBanner(g, x, y, t, ph) {
    const sway = Math.sin(t * 1.4 + ph) * 1.4;
    rect(g, x, y - 54, 2, 54, '#171016');
    rect(g, x - 2, y - 56, 6, 2, '#3a2a30');
    g.fillStyle = '#5a1018';
    g.beginPath();
    g.moveTo(x + 2, y - 52);
    g.lineTo(x + 24 + sway, y - 52);
    g.lineTo(x + 24 + sway, y - 28);
    g.lineTo(x + 13 + sway, y - 33);
    g.lineTo(x + 2, y - 28);
    g.closePath(); g.fill();
    rect(g, x + 10 + sway * 0.4, y - 44, 6, 6, '#c9a227');
    rect(g, x + 12 + sway * 0.4, y - 42, 2, 2, '#2a0a0e');
  }
  // حاجز رماح مائل.
  function spearBarricade(g, x, y, t, ph) {
    const lean = Math.sin(t * 0.9 + ph) * 0.7;
    line(g, x - 12, y, x + 10 + lean, y - 26, '#5a3a24', 1);
    line(g, x + 12, y, x - 10 - lean, y - 24, '#4a2e1c', 1);
    rect(g, x + 9 + lean, y - 28, 3, 3, '#9aa3ad');
    rect(g, x - 11 - lean, y - 26, 3, 3, '#8a929c');
    rect(g, x - 3, y - 5, 8, 2, '#3a2418');
    rect(g, x - 1, y - 7, 4, 4, '#2a1810');
  }
  function occupationProps(g, t, w, baseY) {
    w = w || W;
    const y = baseY || 240;
    const wide = w > 600;
    const flags = wide ? [92, 330, 566, 800, 1030] : [62, 246, 414];
    flags.forEach((x, i) => { if (x < w - 30) enemyBanner(g, x, y, t, i * 1.3); });
    const bars = wide ? [222, 640, 966] : [148, 338];
    bars.forEach((x, i) => { if (x < w - 20) spearBarricade(g, x, y, t, i * 1.7); });
    // جمرات حمراء صغيرة بين الحواجز
    const embers = wide ? [176, 470, 726, 1082] : [98, 292];
    embers.forEach((x, i) => {
      if (x > w - 12) return;
      const fl = 0.55 + 0.35 * Math.sin(t * 4 + i);
      glow(g, x, y - 3, 14, 'rgba(190,40,40,.55)', 0.28 * fl);
      rect(g, x - 2, y - 2, 5, 2, '#3a1418');
      rect(g, x, y - 5 - Math.round(fl * 2), 2, 4, '#d84a3a');
    });
  }
  // سقالة خشبية أمام جدار يُرمَّم.
  function scaffold(g, x, y) {
    rect(g, x - 17, y - 48, 2, 48, '#6b4c30');
    rect(g, x + 16, y - 48, 2, 48, '#6b4c30');
    rect(g, x - 17, y - 32, 35, 2, '#8a6a42');
    rect(g, x - 17, y - 15, 35, 2, '#8a6a42');
    rect(g, x - 20, y - 49, 6, 2, '#4a3422');
    rect(g, x + 15, y - 49, 6, 2, '#4a3422');
    line(g, x - 17, y - 46, x + 16, y - 6, '#7a5a36', 1);
    line(g, x + 16, y - 46, x - 17, y - 6, '#7a5a36', 1);
    // ألواح مستندة
    line(g, x - 23, y - 1, x - 7, y - 38, '#a07a46', 1);
    line(g, x + 23, y - 1, x + 8, y - 34, '#9a7442', 1);
    // غبار ترميم
    for (let i = 0; i < 5; i++) {
      const tt = ((Date.now() * 0.0003 + i * 0.17 + x * 0.01) % 1);
      rect(g, x - 4 + Math.sin(i * 2.1) * 9, y - 4 - tt * 34, 1, 1, '#c8bca8');
    }
  }
  // أكوام حجر وخشب جديدة.
  function repairPile(g, x, y) {
    rect(g, x - 12, y - 6, 24, 6, '#6a6570');
    rect(g, x - 10, y - 10, 8, 4, '#7a7580');
    rect(g, x + 1, y - 9, 7, 3, '#5c5762');
    rect(g, x - 2, y - 14, 5, 4, '#76717c');
    line(g, x - 14, y - 3, x + 13, y - 3, '#8a6a42', 1);
    rect(g, x + 14, y - 8, 12, 3, '#8a6a42');
    rect(g, x + 16, y - 11, 8, 3, '#a07a46');
  }
  function repairProps(g, t, w, baseY) {
    w = w || W;
    const y = baseY || 240;
    const wide = w > 600;
    const scaffolds = wide ? [300, 640, 980] : [126, 354];
    scaffolds.forEach((x) => { if (x < w - 28) scaffold(g, x, y); });
    const piles = wide ? [190, 520, 850, 1100] : [232, 424];
    piles.forEach((x) => { if (x < w - 18) repairPile(g, x, y); });
    // شرار/غبار خفيف يعلن أن العمل جارٍ
    for (let i = 0; i < 9; i++) {
      const x = (i * 53 + 17) % w;
      const yy = y - 6 - ((t * 9 + i * 11) % 42);
      g.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + i);
      rect(g, x, yy, 1, 1, '#d8c8a8');
      g.globalAlpha = 1;
    }
  }

  // ---------- المشاهد ----------
  const SCENES = {};

  SCENES.title = (g, t) => {
    sky(g, '#07060f', '#1c1122', 210);
    stars(g, t);
    moon(g, 366, 62, 34, '#d8cfc0');
    // سحب
    fog(g, t, 120, 16, '#2a1f30', 0.5);
    mountainLayer(g, MOUNTAINS[0], '#161020');
    mountainLayer(g, MOUNTAINS[1], '#120d1a');
    // قلعة على جرف
    rect(g, 250, 176, 230, 94, '#0b0810');
    rect(g, 250, 176, 230, 3, '#1d1424');
    const cx = 372, cy = 176;
    rect(g, cx - 46, cy - 42, 92, 42, '#171020');
    rect(g, cx - 52, cy - 16, 104, 16, '#120c18');
    tower(g, cx - 34, cy - 42, 52, 0.9);
    tower(g, cx + 30, cy - 44, 58, 0.8);
    rect(g, cx - 8, cy - 78, 18, 78, '#1a1222');
    rect(g, cx - 12, cy - 88, 26, 12, '#1a1222');
    for (let i = 0; i < 3; i++) rect(g, cx - 12 + i * 9, cy - 96, 5, 9, '#1a1222');
    banner(g, cx - 3, cy - 96, 20, '#5e1219', '#c9a227');
    glow(g, cx, 140, 70, 'rgba(158,31,42,.28)', 0.5);
    mountainLayer(g, MOUNTAINS[2], '#08060c');
    ashFall(g, t, '#8d8178');
    embers(g, t, 250);
    // صخور أمامية
    rect(g, 0, 246, W, 24, '#050409');
    for (let i = 0; i < 7; i++) rect(g, i * 72 - 10, 240 - (i % 3) * 5, 40, 12, '#07060c');
  };

  SCENES.intro = (g, t) => {
    SCENES.title(g, t);
    // سحابة دخان حمراء بعيدة
    glow(g, 120, 196, 90, 'rgba(190,60,30,.45)', 0.35);
  };

  SCENES.village = (g, t, o) => {
    const cam = (o && o.camX) || 0;
    const VW_WORLD = 1160;
    // سماء ونجوم وجبال: طبقات بعيدة ثابتة (parallax بسيط)
    sky(g, '#080b18', '#241a2a', 196);
    stars(g, t);
    moon(g, 402, 42, 17, '#e2d8c6');
    mountainLayer(g, MOUNTAINS[0], '#1a1424');
    mountainLayer(g, MOUNTAINS[1], '#15101d');
    // قلعة بعيدة
    rect(g, 372, 148, 52, 16, '#120d18');
    rect(g, 380, 128, 10, 24, '#120d18');
    rect(g, 377, 124, 16, 6, '#120d18');
    rect(g, 398, 134, 8, 18, '#120d18');
    glow(g, 390, 140, 34, 'rgba(200,120,60,.25)', 0.5);

    // ---------- عالم القرية الواسع ----------
    g.save();
    g.translate(-cam, 0);
    // أرض ممتدة
    rect(g, -20, 196, VW_WORLD + 40, 90, '#231c22');
    rect(g, -20, 196, VW_WORLD + 40, 2, '#3a2e2a');
    rect(g, -20, 236, VW_WORLD + 40, 34, '#1f1a20');
    rect(g, -20, 236, VW_WORLD + 40, 1, '#2c2530');
    // حصى وأحجار
    for (let i = 0; i < 190; i++) {
      const rr = A.rng(i * 61 + 11)();
      const x = -12 + rr * (VW_WORLD + 24);
      const yy = 200 + ((i * 29) % 62);
      g.globalAlpha = 0.2;
      rect(g, x, yy, 2, 1, i % 3 ? '#0a0d10' : '#3a3430');
      g.globalAlpha = 1;
    }
    // بلاط الدرب
    for (let i = 0; i < 58; i++) {
      const x = -8 + i * 20;
      g.globalAlpha = 0.16;
      rect(g, x, 244 + (i % 3), 16, 5, '#3a3438');
      g.globalAlpha = 1;
    }

    // سور الحصن: يمتد على عرض القرية
    rect(g, -20, 142, VW_WORLD + 40, 60, '#241f2c');
    rect(g, -20, 142, VW_WORLD + 40, 4, '#332c40');
    for (let i = 0; i < Math.ceil(VW_WORLD / 40) + 2; i++) {
      rect(g, -20 + i * 40, 133, 19, 11, '#241f2c');
      rect(g, -4 + i * 40, 133, 4, 11, '#191420');
    }
    g.fillStyle = '#2b2537';
    for (let y = 152; y < 200; y += 11) {
      g.fillRect(-20, y, VW_WORLD + 40, 1);
      const off = (Math.floor(y / 11) % 2) * 10;
      for (let x = -20 + off; x < VW_WORLD + 20; x += 20) g.fillRect(x, y, 1, 11);
    }
    // بوابة الحصن (غربًا)
    g.fillStyle = '#08060c';
    g.beginPath();
    g.moveTo(18, 202); g.lineTo(18, 166); g.arc(41, 166, 23, Math.PI, 0); g.lineTo(64, 202);
    g.closePath(); g.fill();
    glow(g, 41, 196, 30, 'rgba(255,170,80,.28)', 0.55);
    rect(g, 14, 180, 8, 22, '#2c1c14');
    rect(g, 60, 180, 8, 22, '#2c1c14');
    for (let i = 0; i < 4; i++) rect(g, 26 + i * 8, 150, 2, 22, '#4a4250');
    rect(g, 22, 156, 36, 2, '#4a4250');
    for (const tx of [10, 72]) {
      rect(g, tx, 178, 2, 10, '#2a2018');
      glow(g, tx + 1, 174, 15, 'rgba(255,160,60,.6)', 0.5);
      rect(g, tx + 1, 172, 1, 3, '#ffe0a0');
    }
    // أبراج على السور
    for (const tx of [84, 360, 700, 1040]) tower(g, tx, 218, 74, 1.15);
    // بيوت خلف الكشكات
    for (const h of [
      [150, 202, 1.0, true], [250, 198, 0.85, true], [372, 204, 0.95, false],
      [494, 200, 0.9, true], [588, 203, 0.8, false], [712, 199, 0.95, true],
      [836, 203, 0.85, false], [958, 200, 1.0, true], [1096, 204, 0.9, false],
    ]) hut(g, h[0], h[1], h[2], h[3]);
    // أعلام
    banner(g, 196, 208, 58, '#5e1219', '#c9a227');
    banner(g, 548, 212, 52, '#2b3550', '#c9a227');
    banner(g, 900, 210, 56, '#3a2a1e', '#c9a227');
    // بئر عند كشك البئر
    rect(g, 626, 226, 22, 12, '#3a343a');
    rect(g, 626, 226, 22, 2, '#4c464c');
    rect(g, 628, 210, 2, 16, '#2a2018'); rect(g, 644, 210, 2, 16, '#2a2018');
    rect(g, 626, 208, 22, 3, '#2a2018');
    // نيران في الساحة
    bonfire(g, t, 250, 234);
    bonfire(g, t, 680, 232);
    bonfire(g, t, 986, 234);
    // مصطبة حجرية في آخر الحصن بعد المحلات: يقعد عليها حسن
    rect(g, 1094, 247, 34, 5, '#2f2833');
    rect(g, 1094, 247, 34, 1, '#443c4a');
    rect(g, 1098, 252, 3, 2, '#241f2a');
    rect(g, 1121, 252, 3, 2, '#241f2a');
    // صناديق وأكياس على الرصيف
    for (const b of [[164, 240], [400, 246], [512, 242], [806, 244], [1012, 240]]) {
      rect(g, b[0], b[1], 9, 7, '#4a3626');
      rect(g, b[0], b[1], 9, 1, '#6b5238');
      rect(g, b[0] + 1, b[1] - 3, 7, 3, '#3a2a1e');
    }
    // دخان مداخن خفيف
    for (let i = 0; i < 12; i++) {
      const bx = [150, 360, 494, 712, 958][i % 5];
      const yy = 170 - ((t * 8 + i * 13) % 52);
      g.globalAlpha = (1 - (170 - yy) / 52) * 0.07;
      disc(g, bx + Math.sin(t + i) * 6, yy, 4 + i * 0.5, '#c8c0b8');
    }
    g.globalAlpha = 1;
    // كشكات المهام الجانبية: تُرسم خلف الممثلين
    if (A.village && A.village.drawStalls) A.village.drawStalls(g, t);
    // مدينة محتلّة أو قيد الترميم — تُرسم داخل عالم القرية مع الكاميرا.
    postWarProps(g, t, VW_WORLD, 236);
    g.restore();

    // رماد على كامل الشاشة
    ashFall(g, t, '#7d756e');
    // ضباب دافئ قرب النيران
    g.globalAlpha = 0.05;
    g.fillStyle = '#e0a060';
    g.fillRect(0, 200, W, 70);
    g.globalAlpha = 1;
  };

  SCENES.forest = (g, t) => {
    sky(g, '#07100f', '#18251f', 210);
    // ضوء بعيد
    glow(g, 300, 120, 90, 'rgba(120,180,150,.25)', 0.4);
    fog(g, t, 118, 30, '#2c4a40', 0.16);
    // طبقات أشجار
    for (const tr of TREES) {
      if (tr.d === 0 && tr.y > 215) continue;
      pine(g, tr.x, tr.y - 12, tr.h * 0.8, tr.w * 0.8, '#0d1a18', '#0a1413');
    }
    fog(g, t * 1.4, 166, 26, '#3c5e52', 0.14);
    ground(g, 198, '#141d18', '#243229');
    // جذور وصخور
    for (let i = 0; i < 9; i++) {
      rect(g, 20 + i * 52, 226 + (i % 3) * 8, 16, 4, '#0d1411');
    }
    for (const tr of TREES) {
      if (!(tr.d === 0 && tr.y > 215)) continue;
      pine(g, tr.x, tr.y + 10, tr.h, tr.w, '#081210', '#0b1714');
    }
    // فطر متوهج
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 84, y = 238 - (i % 2) * 8;
      rect(g, x, y, 1, 5, '#6f7a5a');
      g.globalAlpha = 0.25; disc(g, x, y - 1, 5, '#8fe0c0'); g.globalAlpha = 1;
      rect(g, x - 2, y - 2, 5, 2, '#9ad8b8');
    }
    flies(g, t);
    postWarProps(g, t, W, 236);
  };

  SCENES.mine = (g, t) => {
    rect(g, 0, 0, W, H, '#0b0a10');
    // جدران صخرية
    for (let i = 0; i < 40; i++) {
      const rr = A.rng(i * 31 + 5)();
      const x = rr * W, y = rr * 160;
      rect(g, x, y, 14 + (i % 5) * 8, 10 + (i % 4) * 6, i % 3 ? '#141119' : '#181420');
    }
    // فتحة ضوء
    g.fillStyle = '#2a2030';
    g.beginPath(); g.moveTo(330, 0); g.lineTo(420, 0); g.lineTo(396, 120); g.lineTo(352, 120); g.closePath(); g.fill();
    glow(g, 376, 40, 80, 'rgba(150,140,190,.28)', 0.4);
    // عوارض خشبية
    rect(g, 60, 60, 6, 170, '#3a2a1e');
    rect(g, 250, 64, 6, 166, '#3a2a1e');
    rect(g, 50, 56, 216, 9, '#4a3626');
    rect(g, 50, 56, 216, 2, '#5e4630');
    // فوانيس
    for (const lx of [96, 206, 300]) {
      const ly = 96;
      rect(g, lx, ly - 10, 1, 10, '#2a2018');
      rect(g, lx - 3, ly, 7, 9, '#c98f3a');
      rect(g, lx - 2, ly + 1, 5, 7, '#ffcf72');
      glow(g, lx, ly + 4, 40, 'rgba(255,180,80,.6)', 0.35);
    }
    ground(g, 212, '#19141a', '#2a2126');
    // سكة
    rect(g, 0, 240, W, 3, '#3a343a');
    for (let i = 0; i < 30; i++) rect(g, i * 17, 236, 3, 8, '#2a2428');
    // عربة
    rect(g, 150, 214, 44, 20, '#33262a');
    rect(g, 154, 218, 36, 12, '#1e171c');
    rect(g, 170, 232, 4, 4, '#0b080c'); rect(g, 186, 232, 4, 4, '#0b080c');
    // عروق خام
    for (let i = 0; i < 8; i++) {
      const rr = A.rng(i * 53 + 9)();
      const x = 30 + rr * 420, y = 30 + rr * 140;
      const a = 0.35 + 0.35 * Math.sin(t * 2 + i);
      g.globalAlpha = a; rect(g, x, y, 3, 2, i % 3 ? '#d9a441' : '#7fd0d8'); g.globalAlpha = 1;
    }
    embers(g, t, 200);
    postWarProps(g, t, W, 236);
  };

  SCENES.ruins = (g, t) => {
    sky(g, '#08070f', '#1d1420', 200);
    stars(g, t);
    moon(g, 96, 52, 30, '#cfc6bc');
    mountainLayer(g, MOUNTAINS[0], '#161020');
    mountainLayer(g, MOUNTAINS[1], '#110c18');
    // أقواس مهدّمة
    const arch = (x, y, w, h, c) => {
      rect(g, x, y - h, w, h, c);
      g.fillStyle = '#0a070d'; g.beginPath(); g.arc(x + w / 2, y - h + 2, w / 2 - 4, Math.PI, 0); g.fill();
      rect(g, x + w / 2 - 3, y - h + 2, 6, h, '#0a070d');
    };
    arch(150, 214, 52, 100, '#1c1622');
    arch(262, 220, 40, 70, '#18121d');
    arch(330, 210, 58, 120, '#1e1826');
    rect(g, 210, 190, 30, 24, '#1a141f');
    // أعمدة مكسورة
    rect(g, 60, 180, 16, 50, '#1a141f');
    rect(g, 60, 178, 20, 5, '#241c26');
    rect(g, 420, 190, 14, 40, '#18121c');
    // شجرة ميتة
    const deadTree = (x, y) => {
      rect(g, x, y - 52, 4, 52, '#151018');
      rect(g, x - 14, y - 40, 16, 3, '#151018');
      rect(g, x + 4, y - 46, 14, 3, '#151018');
      rect(g, x - 18, y - 52, 3, 14, '#151018');
      rect(g, x + 16, y - 58, 2, 14, '#151018');
    };
    deadTree(390, 216);
    deadTree(120, 210);
    ground(g, 216, '#1b151c', '#2e262c');
    // حطام
    for (let i = 0; i < 16; i++) rect(g, (i * 71) % W, 224 + (i % 5) * 6, 10 + (i % 4) * 6, 4, '#241d24');
    // شبح بعيد
    g.globalAlpha = 0.28;
    A.art.drawSprite(g, A.art.spr('wraith', { phase: Math.floor(t * 2) % 2 }), 300, 150, 2, false, 0.5);
    g.globalAlpha = 1;
    // غبار متوهج
    for (let i = 0; i < 20; i++) {
      const x = (i * 53 + t * 3) % W, y = 150 + (i * 29) % 80;
      g.globalAlpha = 0.2 + 0.2 * Math.sin(t + i);
      rect(g, x, y, 1, 1, '#cfc6b4');
    }
    g.globalAlpha = 1;
    postWarProps(g, t, W, 238);
  };

  SCENES.market = (g, t) => {
    sky(g, '#0a0c18', '#2a1a24', 180);
    stars(g, t);
    moon(g, 74, 40, 14, '#e2d8c6');
    mountainLayer(g, MOUNTAINS[1], '#171220');
    // ماء
    rect(g, 0, 190, W, 80, '#0c1620');
    for (let i = 0; i < 30; i++) {
      const y = 192 + i * 2.6;
      g.globalAlpha = 0.10 + 0.1 * Math.sin(t * 1.2 + i);
      rect(g, (i * 43 + t * 8) % W, y, 26, 1, i % 2 ? '#e0a044' : '#6fa0b0');
    }
    g.globalAlpha = 1;
    // ضفة
    rect(g, 0, 186, W, 8, '#241c20');
    // خيام وأكشاك
    const stall = (x, y, c1, c2) => {
      rect(g, x - 22, y - 26, 44, 26, '#241a1e');
      rect(g, x - 24, y - 30, 48, 5, c1);
      for (let i = 0; i < 6; i++) rect(g, x - 24 + i * 8, y - 30, 4, 5, c2);
      rect(g, x - 18, y - 20, 36, 3, '#3a2a24');
      // بضائع
      for (let i = 0; i < 4; i++) rect(g, x - 16 + i * 9, y - 24, 5, 4, i % 2 ? '#8a6a3f' : '#6b3a2a');
      glow(g, x, y - 20, 34, 'rgba(230,150,60,.35)', 0.32);
    };
    stall(210, 190, '#2b3550', '#8fa0b3');
    stall(330, 200, '#4a2a1e', '#c98a3a');
    // فوانيس معلّقة
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 50, y = 120 + Math.sin(i) * 8;
      rect(g, x, 110, 1, y - 110, '#2a2018');
      rect(g, x - 2, y, 5, 6, '#e0a044');
      glow(g, x, y + 3, 20, 'rgba(255,180,90,.6)', 0.28);
    }
    // قارب
    rect(g, 70, 214, 46, 10, '#241c1c');
    rect(g, 66, 212, 54, 3, '#3a2a22');
    rect(g, 92, 190, 2, 24, '#2a2018');
    // رصيف خشبي في المقدمة: مكان المشي
    rect(g, 0, 230, W, 40, '#1c1414');
    for (let y = 234; y < 270; y += 9) rect(g, 0, y, W, 1, '#2a201c');
    for (let x = 0; x < W; x += 40) rect(g, x, 230, 2, 40, '#2a201c');
    for (let x = 18; x < W; x += 86) {
      rect(g, x, 236, 4, 34, '#241a18');
      rect(g, x - 2, 230, 8, 3, '#3a2a22');
    }
    rect(g, 0, 230, W, 3, '#3a2a22');
    // برج بعيد
    tower(g, 430, 186, 44, 0.8);
    // مطاعم السوق على الرصيف
    if (A.village && A.village.drawMarketStalls) A.village.drawMarketStalls(g, t);
    postWarProps(g, t, W, 244);
    ashFall(g, t, '#6f6a62');
  };

  SCENES.jinn = (g, t) => {
    sky(g, '#0a0618', '#241238', 220);
    stars(g, t);
    // شفق
    for (let i = 0; i < 3; i++) {
      g.globalAlpha = 0.10 + i * 0.03;
      g.fillStyle = i === 1 ? '#7a3fb0' : '#3a7a9a';
      g.beginPath();
      g.moveTo(0, 40 + i * 26);
      g.bezierCurveTo(140, 10 + i * 30 + Math.sin(t * 0.3 + i) * 8, 320, 80 + i * 20, 480, 30 + i * 24);
      g.lineTo(480, 52 + i * 24);
      g.bezierCurveTo(320, 100 + i * 20, 140, 34 + i * 30, 0, 62 + i * 26);
      g.fill();
    }
    g.globalAlpha = 1;
    // قمران
    disc(g, 396, 46, 18, '#d8c8e8');
    disc(g, 396, 46, 18, 'rgba(0,0,0,0)');
    disc(g, 408, 42, 15, '#241238');
    disc(g, 96, 62, 7, '#e8d8ff');
    glow(g, 96, 62, 30, 'rgba(200,170,255,.5)', 0.25);
    // جزر عائمة
    const isle = (x, y, w) => {
      rect(g, x - w / 2, y, w, 6, '#241a3a');
      rect(g, x - w / 2, y, w, 2, '#3a2a5a');
      g.fillStyle = '#180f28';
      g.beginPath(); g.moveTo(x - w / 2, y + 6); g.lineTo(x + w / 2, y + 6); g.lineTo(x + w * 0.2, y + 18); g.closePath(); g.fill();
    };
    isle(100, 128, 46);
    isle(400, 112, 34);
    isle(300, 150, 26);
    // قصر: أقواس عالية
    const arch = (x, y, w, h) => {
      g.fillStyle = '#1e1530';
      g.fillRect(x, y - h, w, h);
      g.globalAlpha = 0.6; g.fillStyle = '#3a2a5a';
      g.fillRect(x, y - h, 3, h); g.fillRect(x + w - 3, y - h, 3, h);
      g.globalAlpha = 1;
    };
    arch(140, 210, 20, 170);
    arch(320, 214, 22, 180);
    arch(228, 206, 24, 150);
    // أرضية
    rect(g, 0, 210, W, 60, '#120b20');
    for (let i = 0; i < 12; i++) {
      g.globalAlpha = 0.10;
      rect(g, i * 40, 210 + (i % 3) * 6, 30, 1, '#b9a0e8');
    }
    g.globalAlpha = 1;
    // عروش
    for (const [x, c] of [[110, '#5e1a12'], [240, '#2a1a4a'], [370, '#1a3a44']]) {
      rect(g, x - 24, 186, 48, 26, '#1a1226');
      rect(g, x - 26, 182, 52, 5, c);
      rect(g, x - 30, 210, 60, 4, '#241a34');
    }
    // جنيّون
    A.art.drawSprite(g, A.art.spr('jinnFire'), 110, 196 + Math.sin(t * 1.3) * 3, 1.7, false, 0.92);
    A.art.drawSprite(g, A.art.spr('jinnMist'), 240, 196 + Math.sin(t * 1.1 + 2) * 3, 1.8, false, 0.92);
    A.art.drawSprite(g, A.art.spr('jinnFrost'), 370, 196 + Math.sin(t * 1.4 + 4) * 3, 1.75, false, 0.92);
    // رموز طائرة
    for (let i = 0; i < 14; i++) {
      const x = 40 + ((i * 83) % 400), y = 70 + ((i * 47) % 110) + Math.sin(t * 0.6 + i) * 6;
      const a = 0.25 + 0.3 * Math.sin(t * 1.4 + i);
      g.globalAlpha = a; rect(g, x, y, 2, 2, i % 3 ? '#b98cff' : '#7fd0d8');
      g.globalAlpha = a * 0.3; disc(g, x + 1, y + 1, 3, '#b98cff');
      g.globalAlpha = 1;
    }
    embers(g, t, 220);
    // انعكاس
    for (let i = 0; i < 16; i++) {
      g.globalAlpha = 0.05 + 0.04 * Math.sin(t + i);
      rect(g, (i * 57) % W, 226 + (i % 4) * 9, 40, 1, '#b9a0e8');
    }
    g.globalAlpha = 1;
    postWarProps(g, t, W, 228);
  };

  // قاعة العرش: ذهبٌ قديم، أعمدة، سجّاد أحمر، وضوءٌ يتسلّل من الشرفات
  SCENES.palace = (g, t) => {
    const bg = g.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0b0712'); bg.addColorStop(0.55, '#1d1224'); bg.addColorStop(1, '#120b16');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // جدار خلفي وأقواس
    rect(g, 0, 34, W, 188, '#171021');
    const hallArch = (x, base, w, h) => {
      const r = w / 2;
      g.fillStyle = '#241730';
      g.beginPath();
      g.moveTo(x, base);
      g.lineTo(x, base - h + r);
      g.arc(x + r, base - h + r, r, Math.PI, 0);
      g.lineTo(x + w, base);
      g.closePath(); g.fill();
      g.strokeStyle = '#3a2638'; g.lineWidth = 1; g.stroke();
    };
    for (let i = 0; i < 4; i++) {
      const x = 46 + i * 130;
      hallArch(x, 190, 34, 130);
      rect(g, x - 2, 60, 2, 130, '#2a1c32');
      rect(g, x + 32, 60, 2, 130, '#2a1c32');
      glow(g, x + 16, 72, 34, 'rgba(210,150,70,.16)', 0.4);
    }
    // نافذة الورد خلف العرش
    glow(g, 240, 96, 80, 'rgba(230,150,70,.32)', 0.5);
    disc(g, 240, 96, 30, '#3a2030');
    disc(g, 240, 96, 24, '#e0a050');
    disc(g, 240, 96, 17, '#4a2030');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      line(g, 240, 96, 240 + Math.cos(a) * 34, 96 + Math.sin(a) * 34, '#2a1a28', 1);
    }
    disc(g, 240, 96, 7, '#f4d08a');
    // أعلام ملكية
    banner(g, 34, 70, 86, '#3a1a2a', '#c9a227');
    banner(g, 420, 70, 86, '#3a1a2a', '#c9a227');
    // منصّة العرش ودرجات
    rect(g, 190, 172, 100, 18, '#241426');
    rect(g, 186, 190, 108, 12, '#1c101f');
    rect(g, 178, 202, 124, 14, '#150c18');
    rect(g, 214, 132, 52, 46, '#2a1830');
    rect(g, 220, 126, 40, 12, '#3a2038');
    rect(g, 226, 138, 28, 38, '#1c1022');
    rect(g, 230, 144, 20, 30, '#2e1c36');
    for (let i = 0; i < 3; i++) rect(g, 232 + i * 7, 118 - i * 2, 3, 10, '#c9a227');
    disc(g, 240, 112, 3, '#f0d27a');
    // سجّاد يمتد إلى الأمام
    g.fillStyle = '#4a121c';
    g.beginPath(); g.moveTo(226, 216); g.lineTo(254, 216); g.lineTo(292, 270); g.lineTo(188, 270); g.closePath(); g.fill();
    g.fillStyle = '#6a1a26';
    g.beginPath(); g.moveTo(232, 218); g.lineTo(248, 218); g.lineTo(274, 270); g.lineTo(206, 270); g.closePath(); g.fill();
    g.strokeStyle = '#a98c3c'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(229, 220); g.lineTo(196, 268); g.moveTo(251, 220); g.lineTo(284, 268); g.stroke();
    // أعمدة أمامية
    for (const x of [62, 418]) {
      rect(g, x - 9, 60, 18, 158, '#241828');
      rect(g, x - 12, 52, 24, 10, '#3a2634');
      rect(g, x - 12, 210, 24, 8, '#3a2634');
      rect(g, x - 5, 68, 3, 138, '#33203a');
      rect(g, x + 2, 68, 2, 138, '#1a101e');
      glow(g, x, 72, 24, 'rgba(210,150,70,.12)', 0.3);
    }
    // ثريات وشموع
    for (const [x, y] of [[150, 60], [330, 58]]) {
      line(g, x, 0, x, y, '#2a1c22', 1);
      rect(g, x - 12, y, 24, 2, '#3a2a22');
      for (let i = 0; i < 5; i++) {
        const cx = x - 10 + i * 5;
        rect(g, cx, y - 5, 1, 5, '#e0c080');
        glow(g, cx, y - 7, 7, 'rgba(255,200,110,.8)', 0.45);
        rect(g, cx, y - 7, 1, 2, '#ffe9b0');
      }
    }
    // مشاعل جانبية
    for (const [x, y] of [[98, 152], [382, 152]]) {
      rect(g, x - 1, y, 2, 18, '#2a1c18');
      rect(g, x - 5, y - 3, 10, 3, '#3a2a20');
      glow(g, x, y - 6, 30, 'rgba(255,150,60,.65)', 0.45);
      for (let i = 0; i < 3; i++) {
        g.globalAlpha = 0.7 - i * 0.16;
        g.fillStyle = i ? '#e07a3f' : '#ffe08a';
        g.beginPath();
        g.moveTo(x - 3 + i, y - 3);
        g.lineTo(x + Math.sin(t * 6 + i) * 2, y - 12 - i * 2);
        g.lineTo(x + 3 - i, y - 3);
        g.closePath(); g.fill();
      }
      g.globalAlpha = 1;
    }
    // أرضية رخامية
    rect(g, 0, 218, W, 52, '#160e1a');
    for (let i = 0; i < 7; i++) rect(g, 0, 224 + i * 7, W, 1, '#241628');
    for (let i = 0; i < 9; i++) rect(g, i * 58, 218, 1, 52, '#211427');
    // أعمدة ضوء
    for (const [x, w] of [[120, 26], [300, 20]]) {
      g.globalAlpha = 0.05;
      g.fillStyle = '#f0c070';
      g.beginPath(); g.moveTo(x - 6, 40); g.lineTo(x + 6, 40); g.lineTo(x + w, 220); g.lineTo(x - w, 220); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
    // غبار ذهبي
    for (let i = 0; i < 26; i++) {
      const x = (i * 71 + t * 4) % W, y = 50 + ((i * 43 + Math.sin(t * 0.7 + i) * 12) % 160);
      g.globalAlpha = 0.18 + 0.2 * Math.sin(t * 1.4 + i);
      rect(g, x, y, 1, 1, '#f0d27a');
      g.globalAlpha = 1;
    }
    embers(g, t, 180);
    postWarProps(g, t, W, 252);
  };

  SCENES.battle = (g, t) => {
    sky(g, '#1a0a10', '#4a1a1a', 200);
    // شمس فجر
    glow(g, 240, 150, 130, 'rgba(230,120,60,.55)', 0.5);
    disc(g, 240, 152, 22, '#e08a4a');
    fog(g, t * 0.6, 120, 30, '#3a2028', 0.22);
    mountainLayer(g, MOUNTAINS[0], '#241018');
    mountainLayer(g, MOUNTAINS[1], '#1a0c12');
    // قلعة
    rect(g, 360, 150, 110, 54, '#160a10');
    tower(g, 392, 150, 64, 1.2);
    tower(g, 448, 154, 48, 0.9);
    banner(g, 386, 84, 8, '#5e1219', '#c9a227');
    // دخان
    for (let i = 0; i < 4; i++) {
      const x = 100 + i * 90, yy = 190 - ((t * 10 + i * 23) % 100);
      g.globalAlpha = 0.12;
      disc(g, x + Math.sin(t * 0.7 + i) * 10, yy, 14 + i * 4, '#2a2228');
      g.globalAlpha = 1;
    }
    ground(g, 196, '#241418', '#3a2422');
    // أعلام إمبراطورية
    for (const [x, h] of [[40, 70], [300, 56], [452, 64]]) {
      banner(g, x, 220, h, '#1a1418', '#9e1f2a');
    }
    // أبراج حصار
    for (const [x, s] of [[150, 1], [330, 0.85]]) {
      rect(g, x - 16 * s, 150, 32 * s, 74, '#1c1418');
      rect(g, x - 18 * s, 146, 36 * s, 6, '#2a1e20');
      rect(g, x - 12 * s, 154, 8 * s, 10, '#0c080c');
      rect(g, x + 4 * s, 154, 8 * s, 10, '#0c080c');
      for (let i = 0; i < 4; i++) rect(g, x - 14 * s + i * 8 * s, 138 - i * 2, 4 * s, 8, '#2a1e20');
    }
    // منجنيق
    rect(g, 222, 222, 34, 4, '#2a1c18');
    rect(g, 236, 200, 3, 24, '#3a2a20');
    line(g, 236, 204, 214, 192, '#3a2a20', 2);
    // جنود ظلال
    for (let i = 0; i < 12; i++) {
      const x = 30 + i * 38, y = 232 + (i % 3) * 6;
      g.globalAlpha = 0.55;
      rect(g, x, y - 20, 4, 14, '#0e0a0e');
      rect(g, x - 1, y - 26, 6, 6, '#0e0a0e');
      rect(g, x + 4, y - 34, 1, 20, '#0e0a0e');
      g.globalAlpha = 1;
    }
    embers(g, t, 250);
    ashFall(g, t, '#8d8178');
  };

  // حصار السور: البحر الأسود يقف على الأفق، والسور يعتصم بمن بقي.
  SCENES.siege = (g, t) => {
    sky(g, '#0c070d', '#3a1a1c', 148);
    // عاصفة دخان ولهب على الأفق
    glow(g, 402, 150, 210, 'rgba(214,82,44,.55)', 0.5);
    glow(g, 70, 156, 150, 'rgba(180,70,40,.34)', 0.4);
    fog(g, t * 0.22, 34, 52, '#1a0f14', 0.6);
    fog(g, t * 0.4, 96, 34, '#2a161a', 0.4);
    mountainLayer(g, MOUNTAINS[0], '#22101a');
    mountainLayer(g, MOUNTAINS[1], '#180c12');

    // أرض المعركة خلف السور
    ground(g, 132, '#1a1012', '#2a1a1a');
    fog(g, t * 0.55, 166, 26, '#3a2226', 0.32);

    // جيش الرماد: صفوف لا تنتهي، مشاعل، رماح
    const rr = A.rng(9942);
    for (let row = 0; row < 9; row++) {
      const y = 138 + row * 9.2;
      const step = 8.4 - row * 0.2;
      const off = (row % 2) * 4 + Math.sin(t * 0.35 + row) * 1.4;
      for (let x = 150 + off + row * 3; x < 486; x += step) {
        const j = rr();
        const sway = Math.sin(t * 1.35 + x * 0.23 + row * 1.7) * 0.7;
        const sc = 1 + row * 0.045;
        const dark = row < 4 ? '#140c10' : '#1d1014';
        // جسم ورأس ورمح
        rect(g, x + sway, y - 6 * sc, 2 * sc, 6 * sc, dark);
        rect(g, x + sway - 0.5, y - 8.2 * sc, 2.4 * sc, 2.2 * sc, dark);
        line(g, x + sway + 2.4 * sc, y - 8 * sc, x + sway + 2.4 * sc + 1.5, y - 15 * sc, '#241820', 1);
        if (j < 0.16) {
          // مشعل
          const fx = x + sway + (j < 0.08 ? -2 : 3);
          g.globalAlpha = 0.45 + 0.35 * Math.sin(t * 5 + x);
          disc(g, fx, y - 11 * sc, 1, '#ffd88a');
          glow(g, fx, y - 11 * sc, 8, 'rgba(255,150,60,.7)', 0.35);
          g.globalAlpha = 1;
        } else if (j < 0.22) {
          // راية صغيرة
          g.globalAlpha = 0.6;
          rect(g, x + sway + 2, y - 13 * sc, 1, 7 * sc, '#2a1a1c');
          g.fillStyle = '#5a1219';
          g.fillRect(x + sway + 3, y - 13 * sc, 4, 3);
          g.globalAlpha = 1;
        }
      }
    }

    // أبراج حصار بعيدة تزحف ببطء
    for (const [x, s, sp] of [[316, 1.15, 0.8], [402, 0.9, 1.2], [462, 1.3, 0.55]]) {
      const bx = x + Math.sin(t * 0.12 * sp + x) * 2;
      rect(g, bx - 11 * s, 150 - 28 * s, 22 * s, 42 * s, '#170d12');
      rect(g, bx - 13 * s, 150 - 32 * s, 26 * s, 5 * s, '#231419');
      for (let i = 0; i < 3; i++) rect(g, bx - 10 * s + i * 8 * s, 150 - 38 * s, 4 * s, 6 * s, '#231419');
      rect(g, bx - 3 * s, 150 - 14 * s, 6 * s, 6 * s, '#e08a3a');
      glow(g, bx, 150 - 11 * s, 12 * s, 'rgba(240,140,60,.45)', 0.3);
    }
    // رايات الرماد على الأفق
    banner(g, 286, 184, 56, '#1a1016', '#9e1f2a');
    banner(g, 438, 180, 44, '#1a1016', '#9e1f2a');

    // غبار الزحف
    for (let i = 0; i < 5; i++) {
      const dx = (i * 113 + t * 7) % 500 - 20;
      g.globalAlpha = 0.06 + 0.03 * Math.sin(t + i);
      disc(g, dx, 196 + (i % 3) * 7, 22 + i * 4, '#6a4a44');
    }
    g.globalAlpha = 1;

    // ------- السور في المقدمة -------
    // وجه السور
    rect(g, 0, 224, W, H - 224, '#1a141f');
    rect(g, 0, 222, W, 3, '#2c2435');
    // مداميك
    g.fillStyle = '#221a2a';
    for (let y = 232; y < H; y += 8) {
      g.fillRect(0, y, W, 1);
      const off = (Math.floor(y / 8) % 2) * 12;
      for (let x = off; x < W; x += 24) g.fillRect(x, y, 1, 8);
    }
    // شرفات السور (المعرّفات)
    for (let x = -4; x < W; x += 26) {
      rect(g, x, 212, 17, 12, '#251c2e');
      rect(g, x, 212, 17, 2, '#3a2f47');
      rect(g, x + 14, 212, 3, 12, '#110d18');
    }
    // برجا السور
    for (const [tx, s] of [[8, 1.25], [452, 1.1]]) {
      rect(g, tx - 26 * s, 150, 52 * s, 76, '#211927');
      rect(g, tx - 29 * s, 146, 58 * s, 7, '#2e2538');
      for (let i = 0; i < 5; i++) rect(g, tx - 27 * s + i * 11 * s, 137, 7 * s, 10, '#2e2538');
      rect(g, tx - 5, 176, 10, 22, '#0b0810');
      rect(g, tx - 7, 176, 14, 2, '#3a3045');
      glow(g, tx, 172, 26, 'rgba(255,160,70,.5)', 0.4 + Math.sin(t * 3 + tx) * 0.06);
      gateBannerX(g, tx + 20, 146, 34, '#5e1219', '#c9a227');
    }
    // منجنيق على السور البعيد (يسار) — الذراع مشدود ثم يُطلق
    drawWallCatapult(g, 198, 214, t);

    // سهام المدافعين تنطلق نحو الحشد
    for (let i = 0; i < 7; i++) {
      const ph = (t * 0.9 + i * 0.37) % 1;
      const x0 = 128 + i * 43;
      const x1 = x0 + 26 + (i % 3) * 16;
      const y1 = 176 + (i % 4) * 6;
      const ax = x0 + (x1 - x0) * ph;
      const ay = 212 - Math.sin(ph * Math.PI) * 28 - (212 - y1) * ph;
      g.globalAlpha = 0.75 - ph * 0.35;
      line(g, ax, ay, ax + 3, ay + 1.4, '#d8c8a0', 1);
      g.globalAlpha = 1;
    }
    // حجر منجنيق يطير
    {
      const ph = (t * 0.42) % 1;
      const sx = 198, sy = 168, ex = 372, ey = 182;
      const px2 = sx + (ex - sx) * ph;
      const py2 = sy + (ey - sy) * ph - Math.sin(ph * Math.PI) * 48;
      disc(g, px2, py2, 2, '#4a4440');
    }

    // مدافعون: قوس، سيف، رمح — يقاتلون بكل ما بقي
    const defenders = [
      { x: 52, y: 214, kind: 'soldier', o: { weapon: 'bow' }, f: false },
      { x: 120, y: 214, kind: 'hunter', o: {}, f: false },
      { x: 156, y: 214, kind: 'soldier', o: { weapon: 'spear' }, f: false },
      { x: 258, y: 214, kind: 'soldier', o: { weapon: 'sword' }, f: true },
      { x: 300, y: 214, kind: 'soldier', o: { weapon: 'bow' }, f: true },
      { x: 352, y: 214, kind: 'soldier', o: { weapon: 'spear' }, f: true },
      { x: 408, y: 214, kind: 'hunter', o: {}, f: true },
      { x: 438, y: 214, kind: 'soldier', o: { weapon: 'sword' }, f: true },
    ];
    for (const d of defenders) {
      const bob = Math.sin(t * 2.2 + d.x * 0.07) * 0.8;
      g.globalAlpha = 0.35;
      g.fillStyle = '#000';
      g.beginPath(); g.ellipse(d.x, d.y - 1, 8, 2.4, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      A.art.drawSprite(g, A.art.spr(d.kind, d.o), d.x, d.y + bob, 1.9, d.f, 1);
    }

    // مشاعل على الشرفات
    for (const [x, ph] of [[84, 0], [222, 2], [330, 4], [412, 1.6]]) {
      rect(g, x, 220, 2, 8, '#2a2018');
      glow(g, x + 1, 214, 20, 'rgba(255,150,60,.6)', 0.45 + Math.sin(t * 4 + ph) * 0.08);
      g.globalAlpha = 0.85;
      g.fillStyle = '#ffd88a';
      g.beginPath(); g.moveTo(x - 2, 220); g.lineTo(x + 1 + Math.sin(t * 6 + ph) * 1.4, 212); g.lineTo(x + 4, 220); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }

    embers(g, t, 224);
    ashFall(g, t, '#a89484');
  };

  function gateBannerX(g, x, y, h, col, emblem) {
    rect(g, x, y - h, 2, h, '#3a2c1e');
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x + 2, y - h); g.lineTo(x + 18, y - h);
    g.lineTo(x + 18, y - h + 22); g.lineTo(x + 10, y - h + 18);
    g.lineTo(x + 2, y - h + 22); g.closePath(); g.fill();
    if (emblem) rect(g, x + 9, y - h + 8, 3, 3, emblem);
  }

  function drawWallCatapult(g, x, y, t) {
    const wob = Math.sin(t * 0.8) * 2;
    // قاعدة
    rect(g, x - 18, y - 4, 36, 4, '#2c1f16');
    rect(g, x - 15, y - 10, 4, 8, '#3a2a1c');
    rect(g, x + 11, y - 10, 4, 8, '#3a2a1c');
    // ذراع
    g.save();
    g.translate(x, y - 10);
    g.rotate(-0.7 + wob * 0.02);
    rect(g, -2, -34, 4, 34, '#5a4026');
    rect(g, -6, -36, 12, 4, '#3a2a1c');
    g.restore();
    // ثقل
    rect(g, x + 8, y - 14, 8, 6, '#3a3438');
    // سهم/حجر
    disc(g, x - 18 + wob, y - 40, 3, '#4a4440');
    glow(g, x, y - 20, 24, 'rgba(255,170,80,.25)', 0.4);
  }

  SCENES.dawn = (g, t) => {
    sky(g, '#2a2430', '#d8a06a', 210);
    glow(g, 240, 180, 160, 'rgba(255,210,140,.7)', 0.6);
    disc(g, 240, 178, 30, '#ffe0a0');
    mountainLayer(g, MOUNTAINS[0], '#4a3a44');
    mountainLayer(g, MOUNTAINS[1], '#3a2e38');
    fog(g, t * 0.5, 150, 26, '#e0b090', 0.25);
    rect(g, 0, 200, W, 70, '#241c22');
    // قلعة
    rect(g, 340, 156, 120, 50, '#2a2028');
    tower(g, 374, 156, 60, 1.1);
    tower(g, 430, 160, 46, 0.9);
    banner(g, 368, 96, 10, '#7a2a1a', '#e0c46a');
    // طيور
    for (let i = 0; i < 6; i++) {
      const x = 80 + i * 40 + Math.sin(t * 0.4 + i) * 10, y = 70 + i * 8;
      g.globalAlpha = 0.5;
      g.fillStyle = '#2a2028';
      g.fillRect(x, y, 2, 1); g.fillRect(x + 2, y - 1, 2, 1); g.fillRect(x + 4, y, 2, 1);
      g.globalAlpha = 1;
    }
    embers(g, t, 240);
    ashFall(g, t, '#c8b8a0');
  };

  // ---------- الخريطة ----------
  SCENES.map = (g, t) => {
    rect(g, 0, 0, W, H, '#0b1115');
    // بحر
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#0c161c'); gr.addColorStop(1, '#0a1014');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // يابسة
    g.fillStyle = '#151f1d';
    g.beginPath();
    g.moveTo(30, 250); g.lineTo(10, 170); g.lineTo(70, 120); g.lineTo(60, 60);
    g.lineTo(150, 30); g.lineTo(250, 50); g.lineTo(330, 22); g.lineTo(430, 60);
    g.lineTo(470, 130); g.lineTo(440, 210); g.lineTo(360, 250); g.lineTo(240, 262);
    g.closePath(); g.fill();
    g.strokeStyle = '#3f5a4a'; g.lineWidth = 1; g.stroke();
    // جبال
    const mtx = (x, y, s) => {
      g.fillStyle = '#2a3a34';
      g.beginPath(); g.moveTo(x - 12 * s, y); g.lineTo(x, y - 14 * s); g.lineTo(x + 12 * s, y); g.closePath(); g.fill();
      g.fillStyle = '#4a5e50';
      g.beginPath(); g.moveTo(x - 4 * s, y - 6 * s); g.lineTo(x, y - 14 * s); g.lineTo(x + 4 * s, y - 6 * s); g.closePath(); g.fill();
    };
    mtx(180, 92, 1.2); mtx(206, 86, 0.9); mtx(158, 98, 0.8); mtx(230, 96, 0.7);
    mtx(330, 78, 1); mtx(354, 84, 0.8);
    // غابة
    for (let i = 0; i < 34; i++) {
      const rr = A.rng(i * 71 + 17)();
      const x = 60 + rr * 120, y = 120 + ((i * 37) % 80);
      rect(g, x, y, 2, 2, '#2f4a3a');
    }
    // نهر
    g.strokeStyle = '#243c44'; g.lineWidth = 4; g.beginPath();
    g.moveTo(60, 80); g.bezierCurveTo(140, 130, 160, 160, 230, 200);
    g.bezierCurveTo(280, 226, 340, 220, 400, 250); g.stroke();
    g.strokeStyle = '#3a5a64'; g.lineWidth = 1; g.stroke();
    // مسارات
    const pathPts = [[70, 172], [128, 140], [196, 110], [250, 150], [286, 190], [180, 200], [370, 120], [420, 60]];
    g.setLineDash([2, 4]); g.strokeStyle = '#6b5a32'; g.lineWidth = 1;
    const links = [[0,1],[1,2],[2,6],[1,3],[3,4],[4,5],[0,5],[6,7]];
    for (const [a, b] of links) {
      g.beginPath(); g.moveTo(pathPts[a][0], pathPts[a][1]); g.lineTo(pathPts[b][0], pathPts[b][1]); g.stroke();
    }
    g.setLineDash([]);
    // شعار
    g.globalAlpha = 0.5;
    disc(g, 44, 232, 10, 'none');
    g.strokeStyle = '#6b5a32'; g.beginPath(); g.arc(44, 232, 9, 0, 6.3); g.stroke();
    g.beginPath(); g.moveTo(44, 222); g.lineTo(44, 242); g.stroke();
    g.beginPath(); g.moveTo(34, 232); g.lineTo(54, 232); g.stroke();
    g.globalAlpha = 1;
    // توهج نقاط
    for (const p of pathPts) {
      g.globalAlpha = 0.18 + 0.1 * Math.sin(t * 1.2 + p[0]);
      disc(g, p[0], p[1], 6, '#c9a227');
      g.globalAlpha = 1;
    }
    // كتابة خفيفة
    g.globalAlpha = 0.35; g.fillStyle = '#8a7a52';
    g.font = '7px "Noto Kufi Arabic"'; g.textAlign = 'center';
    g.fillText('جبال العظام', 200, 70);
    g.fillText('بحر الرماد', 400, 236);
    g.globalAlpha = 1;
  };

  // ---------- الرسم العام ----------
  // يسمح لوحدات أخرى (مثل الجبل) بتسجيل مشهدٍ برمجي.
  A.art.defineScene = function (id, fn) {
    if (typeof id === 'string' && typeof fn === 'function') SCENES[id] = fn;
  };

  A.art.drawScene = function (id, t, o) {
    o = o || {};
    const cam = o.camX || 0;
    const fn = SCENES[id] || SCENES.village;
    fn(ART_CTX, t, o);
    const g = ART_CTX;
    // ممثلون
    if (o.actors) {
      const list = o.actors.slice().sort((a, b) => (a.y || 0) - (b.y || 0));
      for (const a of list) {
        const ax = (a.x || 0) - cam;
        if (ax < -70 || ax > W + 70) continue;
        const spr = A.art.spr(a.kind, a.opts || {});
        const s = a.s || 2;

        // ممثل ملقًى على الأرض: يُدار حول قدميه، ويُمدّ ظلّه أفقيًا.
        if (a.lie) {
          const w = spr.width * s, h = spr.height * s;
          g.globalAlpha = 0.3;
          g.fillStyle = '#000';
          g.beginPath();
          g.ellipse(ax, a.y - 1, Math.max(8, w * 0.38), Math.max(2, 2.4 * s * 0.5), 0, 0, 6.3);
          g.fill();
          g.globalAlpha = 1;
          const ang = (a.lieAngle == null ? Math.PI * 0.5 : a.lieAngle) * (a.flip ? -1 : 1);
          g.save();
          g.translate(ax, a.y);
          g.rotate(ang);
          g.imageSmoothingEnabled = false;
          if (a.alpha != null) g.globalAlpha = a.alpha;
          g.drawImage(spr, -w / 2, -h, w, h);
          g.restore();
          g.globalAlpha = 1;
          continue;
        }

        const bob = a.pose === 'idle' && a.bob !== false ? Math.sin(t * 2 + (a.x || 0) * 0.05) * 1 : 0;
        g.globalAlpha = 0.3;
        g.fillStyle = '#000';
        g.beginPath();
        g.ellipse(ax, a.y - 1, 9 * s, 3 * s, 0, 0, 6.3);
        g.fill();
        g.globalAlpha = 1;
        A.art.drawSprite(g, spr, ax, a.y + bob, s, a.flip, a.alpha);
      }
    }
    if (o.vignette !== false) {
      const vg = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 300);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
    }
    if (o.tint) {
      g.globalAlpha = o.tintA || 0.25;
      g.fillStyle = o.tint; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
  };
  let ART_CTX = null;
  A.art.setContext = function (ctx) { ART_CTX = ctx; };
  A.art.W = W; A.art.H = H;
})(window.ASH);
