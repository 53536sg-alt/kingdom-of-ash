/* ============================================================
   كشكات دير النار ومطاعم السوق
   - كل مهمة جانبية لها كشك/مكان تمشي إليه
   - الرسم برمجي بالكامل + حركات صغيرة (بخار، شرار، أشرعة)
   - نقاط التفاعل تُدار عبر roam.js
   ============================================================ */
(function (A) {
  const G = A.game;
  const V = (A.village = {});

  function rect(g, x, y, w, h, c) {
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function disc(g, x, y, r, c) {
    g.fillStyle = c;
    g.beginPath();
    g.arc(x, y, Math.max(0.2, r), 0, Math.PI * 2);
    g.fill();
  }
  function glow(g, x, y, r, c, a) {
    if (!isFinite(x) || !isFinite(y) || !isFinite(r) || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, c);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.globalAlpha = a == null ? 1 : Math.max(0, Math.min(1, a));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
    g.restore();
  }
  function poly(g, pts, c) {
    g.fillStyle = c;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fill();
  }
  function line(g, x0, y0, x1, y1, c, t) {
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
  }

  function px(g, x, y, c) { rect(g, x, y, 1, 1, c); }

  // ------------------------------------------------------------
  //  كشكات دير النار
  // ------------------------------------------------------------
  const SPOTS = [
    { id: 'mustafa', kind: 'beggar', x: 1080, ay: 245, my: 206, icon: '◌', role: 'المشرّدان', spr: 'mustafa', quest: 'food', ss: 2.0, bob: false, r: 26, show: (s) => !s.postWar },
    { id: 'hassan', kind: 'beggar', x: 1114, ay: 250, my: 214, icon: '◍', role: 'المشرّدان', spr: 'hassan', quest: 'food', ss: 1.7, sit: true, bob: false, r: 26, show: (s) => !s.postWar },
    { id: 'captain', kind: 'post', x: 196, ay: 238, my: 172, icon: '✦', role: 'النقيب', spr: 'captain', r: 27 },
    { id: 'smith', kind: 'forge', x: 318, ay: 238, my: 172, icon: '⚒', role: 'الحدّادة', spr: 'smith', quest: 'smith', r: 28 },
    { id: 'herb', kind: 'herbs', x: 432, ay: 238, my: 172, icon: '✿', role: 'العشّابة', spr: 'herbalist', quest: 'herb', r: 28 },
    // زينب ترحل مع قافلة الفجر بعد مهمتها، ولا تعود بعد انتهاء الحرب إطلاقًا.
    { id: 'zainab', kind: 'sewing', x: 540, ay: 239, my: 172, icon: '✂', role: 'الخيّاطة', spr: 'zainab', quest: 'zainab', r: 28, show: (s) => !s.postWar && !s.flags.zainabGone && s.day >= 2 },
    { id: 'well', kind: 'well', x: 637, ay: 236, my: 172, icon: '◉', role: 'البئر القديم', quest: 'child', r: 30 },
    { id: 'mason', kind: 'stone', x: 760, ay: 238, my: 172, icon: '⛏', role: 'المهندس', spr: 'mason', quest: 'catapult', r: 28 },
    { id: 'wizard', kind: 'arcane', x: 890, ay: 238, my: 172, icon: '✧', role: 'العارف', spr: 'wizard', r: 28, show: (s) => !s.postWar && s.flags.wizardMet && !s.flags.jinnUnlocked },
    { id: 'hunter', kind: 'pelts', x: 1030, ay: 238, my: 172, icon: '➶', role: 'الصيّاد', spr: 'hunter', quest: 'bow', r: 30 },
    // ملعب الأطفال: يظهر بعد الحرب في النهايات التي بقيت فيها المدينة حيّة.
    { id: 'playground', kind: 'playground', x: 1094, ay: 243, my: 172, icon: '❖', role: 'ملعب الأطفال', r: 34, show: (s) => s.postWar && s.ending !== 'bad' },
    // آثار خاتمة المملكة: تظهر في دير النار بعد إتمام كل فصل.
    { id: 'memorial', kind: 'memorial', x: 252, ay: 246, my: 188, icon: '▦', role: 'حجر الأسماء', r: 30, show: (s) => !!s.flags.epi_names },
    { id: 'lanterns', kind: 'lanterns', x: 700, ay: 246, my: 184, icon: '☼', role: 'فوانيس العائدين', r: 30, show: (s) => !!s.flags.epi_lanterns },
    { id: 'garden', kind: 'garden', x: 830, ay: 246, my: 188, icon: '❧', role: 'حديقة الرماد', r: 30, show: (s) => !!s.flags.epi_garden },
    { id: 'caravan', kind: 'caravan', x: 970, ay: 246, my: 188, icon: '◎', role: 'قافلة ماري', r: 30, show: (s) => !!s.flags.epi_wheel },
    // صندوق تبرعات المتضرّرين من الحرب: يظهر بعد الحرب في مكان الخيّاطة القديم.
    { id: 'donations', kind: 'donations', x: 540, ay: 246, my: 182, icon: '▣', role: 'صندوق التبرعات', r: 30, show: (s) => !!s.postWar },
  ];
  V.spots = SPOTS;
  V.worldW = 1160;

  function norm(s) {
    s = s || {};
    return { day: s.day || 1, postWar: !!s.postWar, ending: s.ending || '', flags: s.flags || {}, quests: s.quests || {}, postQuests: s.postQuests || {}, main: s.main };
  }
  function active(s) {
    const st = norm(s);
    return SPOTS.filter((sp) => !sp.show || sp.show(st));
  }
  V.active = active;

  function ready(sp, s) {
    const st = norm(s);
    if (sp.id === 'captain') {
      if (st.postWar) return !st.postQuests || st.postQuests.names !== 'done';
      const mainReady = !!(A.mainQuest && A.mainQuest.ready(st));
      return mainReady || !st.flags.suppliesDone;
    }
    if (sp.quest) return st.quests[sp.quest] !== 'done';
    return true;
  }
  V.ready = ready;

  // أنيميشن الكشك: يتنفّس مع الوقت.
  function stallBase(g, x, t, ph, c1, c2, half, top, inner) {
    const hw = half || 22;
    const ty = top == null ? 190 : top - 8; // بداية واجهة المحل
    // ظل خلفي
    g.globalAlpha = 0.28;
    rect(g, x - hw + 2, ty + 8, hw * 2 - 4, 30, '#05040a');
    g.globalAlpha = 1;
    // واجهة المحل: جدار مستقبل اللاعب
    rect(g, x - hw - 2, ty, hw * 2 + 4, 36, '#241a13');
    rect(g, x - hw, ty + 3, hw * 2, 31, '#33251a');
    // ألواح وأعمدة خشبية
    rect(g, x - hw - 1, ty + 2, 2, 34, '#4a3422');
    rect(g, x + hw - 1, ty + 2, 2, 34, '#4a3422');
    rect(g, x - hw, ty + 13, hw * 2, 2, '#1e150f');
    // فتحة العرض: داخل المحل مظلم مع لمحة بضاعة
    rect(g, x - hw + 4, ty + 16, hw * 2 - 8, 10, '#120d10');
    rect(g, x - hw + 4, ty + 16, hw * 2 - 8, 1, '#0a0709');
    g.globalAlpha = 0.35;
    rect(g, x - hw + 7, ty + 20, 4, 4, c1);
    rect(g, x + hw - 12, ty + 19, 5, 5, c2);
    g.globalAlpha = 1;
    // سقف/مظلة مخططة بارزة نحو الشارع
    const segs = Math.max(6, Math.round((hw * 2 + 12) / 7));
    const sw = (hw * 2 + 12) / segs;
    for (let i = 0; i < segs; i++) {
      const wob = Math.sin(t * 2.2 + ph + i * 0.55) * 0.9;
      rect(g, x - hw - 6 + i * sw, ty - 6 + wob, sw + 0.5, 8, i % 2 ? c1 : c2);
      rect(g, x - hw - 6 + i * sw + 1, ty + 2 + wob, sw - 2, 2, i % 2 ? c2 : c1);
    }
    rect(g, x - hw - 7, ty - 7, hw * 2 + 14, 2, '#20160f');
    // لوحة المحل المعلّقة فوق المظلة (حتى لا تحجب وجه صاحب المحل)
    rect(g, x - 8, ty - 8, 1, 2, '#5a4026');
    rect(g, x + 7, ty - 8, 1, 2, '#5a4026');
    rect(g, x - 11, ty - 16, 22, 9, '#171009');
    rect(g, x - 10, ty - 15, 20, 7, '#2f2114');
    rect(g, x - 10, ty - 15, 20, 1, '#6b4c30');
    rect(g, x - 10, ty - 9, 20, 1, '#0d0906');
    // عتبة حجرية
    rect(g, x - hw - 2, 233, hw * 2 + 4, 3, '#2c2630');
    rect(g, x - hw - 2, 233, hw * 2 + 4, 1, '#3f3846');
    // صاحب المحل يُرسم داخل الواجهة، قبل البضاعة والمنضدة
    if (inner) inner();
    // قنديل صغير
    lantern(g, x + hw - 3, ty + 8, t, ph + 1.2, '#ffcf7a');
    return { hw, ty, signY: ty - 11.5 };
  }

  // منضدة البيع: تُرسم بعد صاحب المحل ليظهر واقفًا خلفها لا أمامها.
  function counter(g, x, hw, tone) {
    const c1 = tone || '#4a3422', c2 = tone ? 'rgba(255,255,255,.18)' : '#6b4c30';
    rect(g, x - hw + 1, 224, hw * 2 - 2, 8, c1);
    rect(g, x - hw + 1, 224, hw * 2 - 2, 2, c2);
    rect(g, x - hw + 5, 232, 4, 1, '#2a1c12');
    rect(g, x + hw - 9, 232, 4, 1, '#2a1c12');
    // حافة أمامية وظل
    g.globalAlpha = 0.35;
    rect(g, x - hw + 1, 230, hw * 2 - 2, 2, '#160f0a');
    g.globalAlpha = 1;
  }

  // صاحب المحل: يقف داخل الواجهة خلف المنضدة، مقطوعٌ أسفل الصدر.
  function drawShopkeeper(g, sp, t) {
    const ph = (sp.x % 7) * 0.6;
    const bob = Math.sin(t * 1.5 + ph) * 0.5;
    const sc = sp.insideS || 1.55;
    const spr = A.art.spr(sp.spr, {});
    if (!spr) return;
    // ظل داخلي خفيف
    g.globalAlpha = 0.28;
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(sp.x, 231, 13 * (sc / 2), 2.4, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    A.art.drawSprite(g, spr, sp.x, 231 + bob, sc, !!sp.flip, 1);
  }

  function lantern(g, x, y, t, ph, c) {
    const fl = 0.72 + 0.28 * Math.sin(t * 5 + ph);
    glow(g, x, y, 11, c, 0.17 * fl);
    rect(g, x, y - 5, 1, 3, '#2a2018');
    rect(g, x - 2, y - 2, 5, 6, '#241a16');
    rect(g, x - 1, y - 1, 3, 4, c);
    g.globalAlpha = 0.72 * fl;
    rect(g, x - 1, y, 2, 1, '#fff2c8');
    g.globalAlpha = 1;
  }

  // شارة المحل: شكل بسيط يدلّ على الحرفة (يُرسم داخل اللافتة)
  function emblem(g, kind, x, y, t, ph) {
    const gold = '#d8b45a', pale = '#efe0b4', dark = '#8a6a2a', pale2 = '#b9c8b0';
    const fl = 0.82 + 0.18 * Math.sin(t * 3 + ph);
    g.globalAlpha = fl;
    if (kind === 'forge') {
      rect(g, x - 5, y + 2, 10, 2, '#9aa3ad');
      rect(g, x - 2, y + 4, 4, 1, '#5a5f6a');
      rect(g, x + 3, y - 3, 1, 5, '#7a5a36');
      rect(g, x + 1, y - 3, 5, 2, '#aab4c2');
    } else if (kind === 'herbs') {
      rect(g, x - 1, y - 4, 1, 9, '#7da35d');
      poly(g, [[x - 1, y - 2], [x - 5, y - 4], [x - 1, y + 1]], '#8fbd68');
      poly(g, [[x, y - 1], [x + 4, y - 3], [x + 1, y + 1]], '#b7d58a');
    } else if (kind === 'stone') {
      rect(g, x - 4, y + 3, 8, 2, '#6a6570');
      rect(g, x - 2, y + 1, 3, 2, '#8a8490');
      line(g, x - 4, y - 3, x + 4, y + 3, '#7a5a36');
      line(g, x + 4, y - 3, x - 4, y + 1, '#aab4c2');
    } else if (kind === 'pelts') {
      poly(g, [[x - 4, y - 3], [x, y - 5], [x + 4, y - 3], [x + 2, y + 3], [x, y + 5], [x - 2, y + 3]], '#8a5c34');
      rect(g, x - 3, y - 2, 6, 1, '#b07a46');
    } else if (kind === 'post') {
      rect(g, x - 5, y - 4, 1, 9, '#6b5238');
      poly(g, [[x - 4, y - 4], [x + 5, y - 4], [x + 5, y + 2], [x, y], [x - 4, y + 2]], '#7a1f26');
      rect(g, x, y - 2, 1, 2, gold);
    } else if (kind === 'sewing') {
      rect(g, x + 2, y - 5, 1, 9, '#e8e0d0');
      rect(g, x + 1, y - 5, 3, 1, '#e8e0d0');
      rect(g, x - 5, y + 2, 7, 1, '#b04050');
      rect(g, x - 5, y + 1, 1, 2, '#b04050');
    } else if (kind === 'arcane') {
      const r = 4 + Math.sin(t * 2 + ph) * 0.6;
      rect(g, x - 1, y - r, 2, r * 2, '#c9b6ff');
      rect(g, x - r, y - 1, r * 2, 2, '#c9b6ff');
      rect(g, x - 2, y - 2, 4, 4, '#f4eaff');
    } else if (kind === 'well') {
      rect(g, x - 3, y - 3, 6, 5, '#5a4a3a');
      rect(g, x - 4, y - 4, 8, 1, '#8a7a62');
      rect(g, x - 1, y - 6, 1, 2, '#6b5238');
    } else {
      // طعام
      rect(g, x - 5, y, 10, 4, '#5a4a3a');
      rect(g, x - 5, y, 10, 1, '#8a7a62');
      rect(g, x - 3, y - 2, 1, 2, '#efe0b4');
      rect(g, x, y - 3, 1, 3, '#efe0b4');
      rect(g, x + 3, y - 2, 1, 2, '#efe0b4');
    }
    g.globalAlpha = 1;
  }

  function steam(g, x, y, t, ph, col, n) {
    for (let i = 0; i < (n || 4); i++) {
      const tt = ((t * 0.34 + i / (n || 4) + ph) % 1);
      const yy = y - tt * 24;
      const xx = x + Math.sin(t * 1.5 + i * 2.1 + ph) * (2 + tt * 4) + tt * 2;
      g.globalAlpha = (1 - tt) * 0.26;
      disc(g, xx, yy, 2.4 + tt * 3.2, col);
    }
    g.globalAlpha = 1;
  }

  function sparks(g, x, y, t, ph, n, col, spread, rise) {
    for (let i = 0; i < (n || 6); i++) {
      const tt = ((t * 0.75 + i * 0.19 + ph) % 1);
      const xx = x + Math.sin(t * 2.2 + i * 1.9 + ph) * (spread || 7) * tt;
      const yy = y - tt * (rise || 30);
      g.globalAlpha = (1 - tt) * (0.55 + 0.35 * Math.sin(t * 7 + i));
      rect(g, xx, yy, 1, 1, col || '#ffd27a');
    }
    g.globalAlpha = 1;
  }

  function dust(g, x, y, t, ph, n, col) {
    for (let i = 0; i < (n || 5); i++) {
      const tt = ((t * 0.22 + i * 0.17 + ph) % 1);
      const xx = x + Math.sin(t * 1.1 + i * 2.4 + ph) * 12;
      const yy = y - tt * 18;
      g.globalAlpha = (1 - tt) * 0.22;
      rect(g, xx, yy, 1, 1, col || '#b9b2a6');
    }
    g.globalAlpha = 1;
  }

  // ---------- أنواع الكشكات ----------
  function drawForge(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#6e241c', '#321610', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'forge', x, s.signY, t, ph);
    // سندان
    rect(g, x + 10, 217, 11, 3, '#4a4a54');
    rect(g, x + 13, 220, 5, 4, '#34343e');
    rect(g, x + 8, 224, 15, 2, '#25252c');
    // مطرقة
    rect(g, x + 6, 212, 2, 9, '#5a3a20');
    rect(g, x + 3, 211, 7, 3, '#6a6a74');
    // نار الحدادة
    rect(g, x - 20, 222, 13, 4, '#2a1710');
    const fh = 4 + Math.abs(Math.sin(t * 3.4 + ph)) * 7;
    rect(g, x - 18, 222 - fh, 2, fh, '#ff7b2a');
    rect(g, x - 15, 222 - fh * 0.82, 2, fh * 0.82, '#ffb04a');
    rect(g, x - 12, 222 - fh * 0.56, 2, fh * 0.56, '#ff9a3d');
    glow(g, x - 15, 219, 16, 'rgba(255,140,50,.45)', 0.42 + 0.16 * Math.sin(t * 3 + ph));
    sparks(g, x - 15, 221, t, ph, 8, '#ffd27a', 9, 32);
    // شرار دائم على السندان
    sparks(g, x + 15, 216, t, ph + 1.8, 3, '#fff0b0', 4, 12);
  }

  function drawHerbs(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#4f6b42', '#26361f', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'herbs', x, s.signY, t, ph);
    // باقات معلّقة
    for (let i = 0; i < 2; i++) {
      const bx = x - 14 + i * 27;
      const sway = Math.sin(t * 1.8 + ph + i * 1.7) * 1.4;
      rect(g, bx + sway, 207, 1, 9, '#6b4a2c');
      for (let j = 0; j < 4; j++) {
        rect(g, bx - 2 + j * 1.4 + sway, 210 + j * 2, 4, 1, j % 2 ? '#7da35d' : '#a8c47a');
      }
    }
    // قدر الدواء
    rect(g, x + 8, 217, 10, 6, '#3a343a');
    rect(g, x + 7, 217, 12, 2, '#514a52');
    rect(g, x + 10, 223, 6, 2, '#241e22');
    glow(g, x + 13, 221, 9, 'rgba(160,220,140,.35)', 0.3);
    steam(g, x + 13, 216, t, ph, '#cfe0c0', 4);
    // jars
    rect(g, x - 19, 218, 4, 6, '#5a4a36');
    rect(g, x - 14, 220, 3, 4, '#6b5a42');
    // leaves on counter
    for (let i = 0; i < 3; i++) rect(g, x - 4 + i * 3, 222, 2, 1, '#8fbd68');
  }

  function drawStone(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#5c5662', '#2a2630', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'stone', x, s.signY, t, ph);
    // أحجار مرصوفة
    rect(g, x - 19, 219, 10, 6, '#6a6570');
    rect(g, x - 17, 216, 7, 3, '#7a7580');
    rect(g, x + 8, 220, 9, 5, '#5c5762');
    rect(g, x + 10, 217, 5, 3, '#76717c');
    // حبل
    rect(g, x + 9, 224, 10, 2, '#8a6a42');
    rect(g, x + 11, 222, 6, 2, '#8a6a42');
    // مطرقة
    rect(g, x - 11, 210, 2, 11, '#5a3a20');
    rect(g, x - 14, 209, 8, 3, '#7a7480');
    dust(g, x + 13, 222, t, ph, 6, '#b9b2a6');
  }

  function drawPelts(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#5a3a28', '#2b1c14', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'pelts', x, s.signY, t, ph);
    // جلود معلّقة
    for (let i = 0; i < 2; i++) {
      const bx = x - 13 + i * 24;
      const sway = Math.sin(t * 1.7 + ph + i * 2.1) * 1.5;
      poly(g, [
        [bx - 5 + sway, 207], [bx + 5 + sway, 207],
        [bx + 4 + sway, 217], [bx + sway, 221], [bx - 4 + sway, 217],
      ], i % 2 ? '#7a5230' : '#684426');
      rect(g, bx - 3 + sway, 209, 6, 1, '#95673d');
    }
    // قرون صغيرة
    rect(g, x + 14, 208, 1, 8, '#d8c8a8');
    rect(g, x + 11, 206, 3, 2, '#d8c8a8');
    rect(g, x + 16, 205, 2, 2, '#d8c8a8');
    // سكين
    rect(g, x - 18, 220, 10, 2, '#9aa3ad');
    rect(g, x - 21, 220, 4, 2, '#4a3426');
  }

  function drawPost(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#5e241f', '#341410', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'post', x, s.signY, t, ph);
    // صناديق مؤونة
    rect(g, x - 20, 218, 9, 7, '#6b5232');
    rect(g, x - 20, 218, 9, 1, '#8a6a42');
    rect(g, x - 15, 215, 4, 3, '#7a5a36');
    rect(g, x + 12, 219, 9, 6, '#5e462a');
    rect(g, x + 12, 219, 9, 1, '#7a5a36');
    // خريطة/ورقة تتمايل
    const f = Math.sin(t * 2.6 + ph) * 0.7;
    rect(g, x - 4, 219 + f, 8, 5, '#d8c9a6');
    rect(g, x - 3, 220 + f, 6, 1, '#8a6a42');
    // قنديل إضافي
    lantern(g, x - 18, 208, t, ph + 2.2, '#ffd88a');
    // بند صغير
    rect(g, x + 17, 206, 2, 12, '#3a2a1c');
    rect(g, x + 15, 206, 6, 3, '#7a1f26');
  }

  function drawSewing(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#7a2a3a', '#3a1822', 21, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'sewing', x, s.signY, t, ph);
    // قماش أحمر يتمايل على الجانبين (الوسط مفتوح لرؤية الخيّاطة)
    for (const i of [0, 1, 4, 5]) {
      const bx = x - 17 + i * 5;
      const sway = Math.sin(t * 2.2 + ph + i * 0.7) * 1.2;
      rect(g, bx, 207 + sway, 4, 10 + (i % 2) * 2, i % 3 ? '#8f2734' : '#b04050');
    }
    // خيط ذهبي على الطرفين
    rect(g, x - 16, 214, 7, 1, '#d8b45a');
    rect(g, x + 10, 214, 6, 1, '#d8b45a');
    // بكرة
    rect(g, x + 10, 220, 6, 4, '#4a3426');
    rect(g, x + 11, 218, 4, 2, '#a84a5a');
    // إبرة تلمع
    const gl = 0.4 + 0.6 * Math.abs(Math.sin(t * 3.2 + ph));
    g.globalAlpha = gl;
    rect(g, x + 18, 214, 1, 6, '#e8e0d0');
    rect(g, x + 17, 213, 3, 1, '#e8e0d0');
    g.globalAlpha = 1;
  }

  function drawArcane(g, x, t, ph, sp) {
    const s = stallBase(g, x, t, ph, '#3a2a58', '#211736', 22, null, () => sp && drawShopkeeper(g, sp, t));
    emblem(g, 'arcane', x, s.signY, t, ph);
    // شموع
    for (let i = 0; i < 2; i++) {
      const cx = x - 15 + i * 31;
      rect(g, cx, 218, 3, 7, '#d8cfb8');
      const fh = 2 + Math.abs(Math.sin(t * 4 + ph + i)) * 3;
      rect(g, cx + 1, 218 - fh, 1, fh, i ? '#bfe9ff' : '#ffd27a');
      glow(g, cx + 1, 216, 8, i ? 'rgba(160,220,255,.45)' : 'rgba(255,200,110,.45)', 0.4);
    }
    // دائرة رون
    g.globalAlpha = 0.45 + 0.2 * Math.sin(t * 2 + ph);
    g.strokeStyle = '#a98bff';
    g.lineWidth = 1;
    g.beginPath();
    g.arc(x, 222, 6 + Math.sin(t * 1.7 + ph) * 0.7, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
    // كرة سحرية
    const oy = 211 + Math.sin(t * 2.1 + ph) * 2;
    glow(g, x + 15, oy, 12, 'rgba(170,140,255,.55)', 0.55);
    disc(g, x + 15, oy, 3, '#c9b6ff');
    disc(g, x + 14, oy - 1, 1.2, '#f4eaff');
    sparks(g, x + 15, oy + 3, t, ph + 0.9, 5, '#c9b6ff', 8, 18);
  }

  function drawWell(g, x, t, ph) {
    // البئر نفسها مرسومة في المشهد؛ هنا الحبل والدلو والضوء
    const sway = Math.sin(t * 1.7 + ph) * 1.6;
    rect(g, x + sway, 208, 1, 16, '#6a5238');
    rect(g, x - 3 + sway, 222, 7, 5, '#3a2c20');
    rect(g, x - 3 + sway, 222, 7, 1, '#5a4630');
    rect(g, x - 1 + sway, 227, 3, 1, '#2a2018');
    glow(g, x, 223, 15, 'rgba(160,230,220,.4)', 0.3 + 0.14 * Math.sin(t * 2.4 + ph));
    // أبخرة شاحبة
    for (let i = 0; i < 3; i++) {
      const tt = ((t * 0.3 + i / 3 + ph) % 1);
      g.globalAlpha = (1 - tt) * 0.2;
      disc(g, x + Math.sin(t + i * 2) * 4, 224 - tt * 16, 2 + tt * 2, '#bfeee8');
    }
    g.globalAlpha = 1;
    // قنديل على عمود البئر
    lantern(g, x + 15, 208, t, ph + 0.4, '#ffe0a0');
  }

  // حسن: جالسٌ على حافة الرصيف، يلتفّ بعباءته وينتظر.
  function drawSeatedBeggar(g, x, t, ph) {
    const br = Math.sin(t * 1.6 + ph) * 0.5;
    // ظل
    g.globalAlpha = 0.3;
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(x, 250, 17, 3.4, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    // ساقان ممدودتان على الرصيف
    rect(g, x - 15, 246, 10, 4, '#3a3226');
    rect(g, x - 15, 248, 10, 2, '#2a241c');
    rect(g, x - 6, 247, 9, 3, '#43382a');
    rect(g, x - 6, 249, 9, 1, '#2a241c');
    // قدم
    rect(g, x - 17, 246, 3, 3, '#2a1f16');
    // عباءة/جسد منحنٍ
    g.fillStyle = '#4a3e30';
    g.beginPath();
    g.moveTo(x - 6, 232 + br);
    g.lineTo(x + 7, 232 + br);
    g.lineTo(x + 9, 248);
    g.lineTo(x - 8, 248);
    g.closePath();
    g.fill();
    // ثنيات العباءة
    rect(g, x - 3, 236 + br, 1, 11, '#3a3024');
    rect(g, x + 2, 234 + br, 1, 13, '#3a3024');
    // ذراع تحتضن الركبة
    rect(g, x - 5, 238 + br, 12, 3, '#5a4a36');
    rect(g, x + 6, 240 + br, 3, 6, '#b9865a');
    // رأس + عمامة
    rect(g, x - 3, 224 + br, 7, 8, '#c08a5e');
    rect(g, x - 2, 226 + br, 2, 1, '#1a120e');
    rect(g, x + 2, 226 + br, 2, 1, '#1a120e');
    rect(g, x - 1, 230 + br, 4, 2, '#3a2a1e');
    rect(g, x - 5, 222 + br, 11, 3, '#8a7a5a');
    rect(g, x - 5, 224 + br, 2, 4, '#7a6a4c');
    rect(g, x + 4, 224 + br, 2, 4, '#7a6a4c');
    // صحن فارغ بجانبه
    rect(g, x + 12, 247, 8, 2, '#5a4a3a');
    rect(g, x + 13, 246, 6, 1, '#7a6a58');
    // جمرة دافئة
    const fl = 0.5 + 0.4 * Math.sin(t * 4 + ph);
    glow(g, x + 14, 248, 6, 'rgba(255,160,80,.35)', 0.22 * fl);
    rect(g, x + 14, 248, 2, 1, '#ffb060');
    dust(g, x + 16, 247, t, ph, 3, '#8a7462');
  }

  function drawBeggar(g, x, t, ph, i) {
    // بطانية على الأرض + صرّة + صحن
    g.globalAlpha = 0.6;
    poly(g, [[x - 11, 245], [x + 11, 245], [x + 9, 250], [x - 9, 250]], i ? '#3a3228' : '#38302a');
    g.globalAlpha = 1;
    rect(g, x - 13, 247, 26, 1, '#4a3a2c');
    // صرّة صغيرة
    rect(g, x - 14, 238, 5, 8, '#4a3626');
    rect(g, x - 13, 237, 3, 2, '#6b5238');
    // صحن فارغ
    rect(g, x + 7, 243, 6, 2, '#5a4a3a');
    rect(g, x + 8, 242, 4, 1, '#7a6a58');
    // جمرة دافئة
    const fl = 0.5 + 0.4 * Math.sin(t * 4 + ph);
    glow(g, x + 1, 245, 7, 'rgba(255,160,80,.35)', 0.25 * fl);
    rect(g, x, 245, 2, 1, '#ffb060');
    dust(g, x + 1, 244, t, ph, 3, '#8a7462');
  }

  // ملعب أطفال صغير: أرجوحة وحصان خشبي وكرة، على أرضٍ رملية دافئة.
  function drawPlayground(g, x, t) {
    const y = 248;
    // أرض رملية ناعمة
    g.globalAlpha = 0.5;
    poly(g, [[x - 34, y - 9], [x + 34, y - 9], [x + 30, y + 2], [x - 30, y + 2]], '#6a5740');
    g.globalAlpha = 0.28;
    poly(g, [[x - 27, y - 6], [x + 28, y - 6], [x + 24, y], [x - 24, y]], '#8a7354');
    g.globalAlpha = 1;
    // سور خشبي قصير خلف الملعب
    for (let i = -3; i <= 3; i++) rect(g, x + i * 10, y - 20, 2, 19, i % 2 ? '#4a3422' : '#553c28');
    rect(g, x - 32, y - 19, 64, 2, '#6b4c30');
    rect(g, x - 32, y - 9, 64, 1, '#4a3422');
    // إطار الأرجوحة
    line(g, x - 23, y - 1, x - 15, y - 44, '#6b4c30', 2);
    line(g, x - 11, y - 1, x - 15, y - 44, '#6b4c30', 2);
    line(g, x + 23, y - 1, x + 15, y - 44, '#6b4c30', 2);
    line(g, x + 11, y - 1, x + 15, y - 44, '#6b4c30', 2);
    rect(g, x - 17, y - 46, 34, 2, '#8a6a42');
    rect(g, x - 17, y - 46, 34, 1, '#a07a46');
    // مقعد يتأرجح ببطء
    const sway = Math.sin(t * 1.5) * 2.2;
    line(g, x - 7, y - 45, x - 7 + sway, y - 23, '#c8b898', 1);
    line(g, x + 7, y - 45, x + 7 + sway, y - 23, '#c8b898', 1);
    rect(g, x - 10 + sway, y - 23, 20, 3, '#7a5a36');
    rect(g, x - 10 + sway, y - 23, 20, 1, '#9a7442');
    // حصان خشبي صغير على قوس
    const rock = Math.sin(t * 2.1) * 1.2;
    line(g, x + 22, y, x + 30, y - 8, '#5a3e26', 1);
    line(g, x + 38, y, x + 30, y - 8, '#5a3e26', 1);
    rect(g, x + 26, y - 15 + rock, 10, 7, '#8a5a36');
    rect(g, x + 33, y - 19 + rock, 5, 5, '#9a6a42');
    rect(g, x + 33, y - 18 + rock, 2, 2, '#c8a878');
    rect(g, x + 27, y - 8 + rock, 2, 4, '#5a3e26');
    rect(g, x + 34, y - 8 + rock, 2, 4, '#5a3e26');
    px(g, x + 37, y - 18 + rock, '#2a1a12');
    // كرة مخطّطة
    disc(g, x - 27, y - 4, 4, '#b04a38');
    rect(g, x - 29, y - 5, 2, 2, '#e0b070');
    rect(g, x - 25, y - 4, 2, 1, '#e0b070');
    // مربعات حجلة بالطباشير
    g.globalAlpha = 0.5;
    for (let i = 0; i < 3; i++) {
      rect(g, x - 38 + i * 8, y - 22 + (i % 2) * 7, 6, 6, '#c8bca8');
    }
    g.globalAlpha = 1;
    // زهور صغيرة حول السور
    for (let i = 0; i < 5; i++) {
      const fx = x - 34 + i * 17;
      rect(g, fx, y - 6, 1, 4, '#4a6a3a');
      px(g, fx, y - 8, i % 2 ? '#d8b45a' : '#c06a5a');
    }
  }

  // ---------- آثار خاتمة المملكة ----------
  function drawMemorial(g, x, t) {
    const y = 246;
    g.globalAlpha = 0.32;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(x, y, 20, 3.2, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    rect(g, x - 18, y - 4, 36, 5, '#282430');
    rect(g, x - 16, y - 6, 32, 3, '#3a3442');
    rect(g, x - 13, y - 34, 26, 29, '#332f3c');
    rect(g, x - 12, y - 33, 24, 27, '#454050');
    rect(g, x - 12, y - 33, 24, 2, '#5b5568');
    for (let i = 0; i < 6; i++) {
      const w = 7 + ((i * 5) % 9);
      rect(g, x - 8, y - 29 + i * 3.6, w, 1, '#211d28');
      rect(g, x - 8, y - 28.4 + i * 3.6, w, 0.6, '#5a5468');
    }
    const fl = 0.7 + 0.3 * Math.sin(t * 4);
    glow(g, x - 20, y - 8, 9, 'rgba(255,190,120,.5)', 0.3 * fl);
    rect(g, x - 21, y - 8, 2, 6, '#d8c8a8');
    px(g, x - 21, y - 10, '#ffd27a');
    glow(g, x + 20, y - 7, 8, 'rgba(255,190,120,.5)', 0.26 * fl);
    rect(g, x + 19, y - 7, 2, 5, '#d8c8a8');
    px(g, x + 19, y - 9, '#ffd27a');
  }

  function drawLanterns(g, x, t) {
    const y = 248;
    g.globalAlpha = 0.3;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(x, y, 17, 3, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    rect(g, x - 6, y - 5, 12, 5, '#2c2630');
    rect(g, x - 2, y - 42, 4, 38, '#4a3422');
    rect(g, x - 2, y - 42, 1, 38, '#6b4c30');
    rect(g, x - 16, y - 42, 32, 3, '#5a3e26');
    rect(g, x - 16, y - 42, 32, 1, '#7a5a36');
    for (let i = 0; i < 5; i++) {
      const lx = x - 13 + i * 6.5;
      const sway = Math.sin(t * 1.4 + i) * 1.2;
      line(g, lx, y - 40, lx + sway, y - 34, '#2a2018', 1);
      const fl = 0.65 + 0.35 * Math.sin(t * 5 + i * 1.7);
      glow(g, lx + sway, y - 30, 8, 'rgba(255,200,110,.55)', 0.22 * fl);
      rect(g, lx - 2 + sway, y - 34, 4, 7, '#241a16');
      rect(g, lx - 1 + sway, y - 33, 2, 5, '#ffcf7a');
      rect(g, lx - 1 + sway, y - 31, 2, 1, '#fff2c8');
    }
    rect(g, x - 11, y - 16, 22, 8, '#2f2114');
    rect(g, x - 10, y - 15, 20, 6, '#44301c');
    rect(g, x - 7, y - 13, 14, 1, '#7a5a36');
  }

  function drawGarden(g, x, t) {
    const y = 249;
    g.globalAlpha = 0.42;
    poly(g, [[x - 25, y - 12], [x + 25, y - 12], [x + 22, y + 1], [x - 22, y + 1]], '#5a4a36');
    g.globalAlpha = 0.3;
    poly(g, [[x - 21, y - 9], [x + 21, y - 9], [x + 19, y - 2], [x - 19, y - 2]], '#7a6244');
    g.globalAlpha = 1;
    for (let i = -2; i <= 2; i++) rect(g, x + i * 11, y - 13, 2, 12, i % 2 ? '#4a3422' : '#553c28');
    rect(g, x - 25, y - 13, 50, 2, '#6b4c30');
    for (let i = 0; i < 4; i++) {
      const sx = x - 17 + i * 11.5;
      const sw = Math.sin(t * 1.2 + i * 1.3) * 1.6;
      rect(g, sx, y - 11, 1, 9, '#3f5a32');
      line(g, sx, y - 11, sx - 4 + sw, y - 17, '#4d6b3a', 1);
      line(g, sx, y - 11, sx + 4 + sw, y - 16, '#5d7d46', 1);
      px(g, sx - 4 + sw, y - 18, i === 2 ? '#d8b45a' : '#7fa05a');
      px(g, sx + 4 + sw, y - 17, '#7fa05a');
      px(g, sx, y - 13, '#8fb86a');
    }
    rect(g, x + 26, y - 10, 6, 10, '#4a3422');
    rect(g, x + 27, y - 11, 4, 2, '#6b4c30');
  }

  function drawCaravan(g, x, t) {
    const y = 247;
    g.globalAlpha = 0.3;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(x + 4, y, 30, 3.4, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;
    rect(g, x - 20, y - 20, 40, 12, '#5a3e26');
    rect(g, x - 19, y - 19, 38, 10, '#6b4c30');
    rect(g, x - 19, y - 19, 38, 1, '#8a6a42');
    for (let i = 0; i < 4; i++) rect(g, x - 18 + i * 9, y - 18, 1, 9, '#4a3422');
    rect(g, x - 10, y - 31, 18, 12, '#7a5a36');
    rect(g, x - 9, y - 30, 16, 10, '#8a6a42');
    rect(g, x - 1, y - 31, 1, 12, '#5a3e26');
    rect(g, x - 9, y - 30, 16, 1, '#a07a46');
    line(g, x + 19, y - 16, x + 33, y - 23, '#6b4c30', 2);
    line(g, x + 33, y - 23, x + 40, y - 17, '#5a3e26', 2);
    rect(g, x + 37, y - 23, 7, 5, '#7a5a36');
    rect(g, x + 38, y - 24, 5, 1, '#c9a227');
    const wx = x + 12, wy = y - 6, rad = 8;
    disc(g, wx, wy, rad, '#2a2018');
    disc(g, wx, wy, rad - 2, '#4a3422');
    const a = t * 0.7;
    for (let i = 0; i < 6; i++) {
      const an = a + i * Math.PI / 3;
      line(g, wx, wy, wx + Math.cos(an) * (rad - 2), wy + Math.sin(an) * (rad - 2), '#8a6a42', 1);
    }
    disc(g, wx, wy, 2, '#2a2018');
  }

  // ------------------------------------------------------------
  //  صندوق تبرعات المتضرّرين من الحرب (بعد الحرب)
  // ------------------------------------------------------------
  function drawDonations(g, x, t) {
    // ظل
    g.globalAlpha = 0.25;
    rect(g, x - 27, 222, 54, 26, '#05040a');
    g.globalAlpha = 1;
    // سارية وراية حمراء تتمايل
    rect(g, x + 26, 166, 2, 74, '#4a3624');
    const sway = Math.sin(t * 1.6) * 1.2;
    poly(g, [[x + 24, 170], [x + 4 + sway, 174], [x + 6 + sway, 198], [x + 24, 194]], '#6d1f2a');
    poly(g, [[x + 24, 170], [x + 14 + sway, 172], [x + 15 + sway, 184], [x + 24, 181]], '#8e2a36');
    disc(g, x + 15 + sway, 187, 2.2, '#e0c46a');
    // فانوس معلّق على سارية الراية
    lantern(g, x + 24, 198, t, 1.3, '#ffcf7a');
    // امرأة الحصن واقفة عند طرف الطاولة (قبل الطاولة كي تحجب حافتها كتفها قليلًا)
    const keeper = A.art.spr('donorLady', { pose: 'idle' });
    if (keeper) {
      g.globalAlpha = 0.26;
      g.fillStyle = '#000';
      g.beginPath();
      g.ellipse(x - 38, 243, 13, 2.6, 0, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 1;
      A.art.drawSprite(g, keeper, x - 38, 243 + Math.sin(t * 1.4 + 0.6) * 0.6, 2, false, 1);
    }
    // طاولة التبرعات
    rect(g, x - 26, 212, 52, 2, '#8a6440');
    rect(g, x - 24, 214, 48, 4, '#6b4c30');
    rect(g, x - 22, 218, 44, 12, '#3a2a1b');
    rect(g, x - 22, 230, 3, 14, '#2a1d13');
    rect(g, x + 19, 230, 3, 14, '#2a1d13');
    // صندوق التبرعات بفتحة ذهبية
    rect(g, x - 16, 200, 18, 13, '#4a3422');
    rect(g, x - 16, 200, 18, 2, '#c9a227');
    rect(g, x - 9, 203, 4, 1.4, '#0b0810');
    rect(g, x - 15, 205, 16, 1, '#5f4429');
    // كيس حبوب
    poly(g, [[x + 8, 200], [x + 20, 200], [x + 22, 213], [x + 6, 213]], '#7a6350');
    rect(g, x + 9, 203, 10, 1, '#93805f');
    // أرغبة على صحن
    rect(g, x + 5, 213, 17, 1.6, '#8a7a62');
    disc(g, x + 9, 210, 3.4, '#c9954a');
    disc(g, x + 15, 211, 3, '#b8843e');
    disc(g, x + 19, 209.5, 2.6, '#d8a75a');
    // جمرة صغيرة على الطاولة
    rect(g, x - 3, 211, 1.6, 1.6, '#e2603a');
    glow(g, x - 2, 212, 6, 'rgba(255,150,60,.35)', 0.25 + 0.08 * Math.sin(t * 2.4));
  }

  function drawSpot(g, sp, t) {
    if (sp.kind === 'forge') drawForge(g, sp.x, t, 0.3, sp);
    else if (sp.kind === 'herbs') drawHerbs(g, sp.x, t, 1.1, sp);
    else if (sp.kind === 'stone') drawStone(g, sp.x, t, 2.0, sp);
    else if (sp.kind === 'pelts') drawPelts(g, sp.x, t, 2.8, sp);
    else if (sp.kind === 'post') drawPost(g, sp.x, t, 3.4, sp);
    else if (sp.kind === 'sewing') drawSewing(g, sp.x, t, 4.0, sp);
    else if (sp.kind === 'arcane') drawArcane(g, sp.x, t, 4.7, sp);
    else if (sp.kind === 'well') drawWell(g, sp.x, t, 5.2);
    else if (sp.kind === 'playground') drawPlayground(g, sp.x, t);
    else if (sp.kind === 'memorial') drawMemorial(g, sp.x, t);
    else if (sp.kind === 'lanterns') drawLanterns(g, sp.x, t);
    else if (sp.kind === 'garden') drawGarden(g, sp.x, t);
    else if (sp.kind === 'caravan') drawCaravan(g, sp.x, t);
    else if (sp.kind === 'donations') drawDonations(g, sp.x, t);
    else if (sp.kind === 'beggar') {
      if (sp.sit) drawSeatedBeggar(g, sp.x, t, 5.8);
      else drawBeggar(g, sp.x, t, 5.8, 0);
    }
  }

  V.drawStalls = function (g, t) {
    const s = G.state || {};
    for (const sp of active(s)) {
      if (sp.kind === 'beggar' && s.postWar) continue;
      drawSpot(g, sp, t);
      // المنضدة تُرسم بعد البضاعة لتبقى أمام الجميع
      if (sp.spr && sp.kind !== 'beggar') {
        counter(g, sp.x, sp.kind === 'sewing' ? 21 : 22,
          sp.kind === 'sewing' ? '#54202c' : sp.kind === 'arcane' ? '#2e2346' : null);
      }
    }
  };

  // ------------------------------------------------------------
  //  مطاعم السوق
  // ------------------------------------------------------------
  function foodStall(g, x, t, ph, c1, c2) {
    const s = stallBase(g, x, t, ph, c1, c2, 24, 198);
    emblem(g, 'food', x, s.signY, t, ph);
    // قدر كبير
    rect(g, x - 17, 216, 13, 8, '#2f2b30');
    rect(g, x - 18, 215, 15, 2, '#413c44');
    rect(g, x - 15, 224, 9, 2, '#1e1b20');
    glow(g, x - 11, 222, 12, 'rgba(255,150,60,.38)', 0.32 + 0.12 * Math.sin(t * 3 + ph));
    steam(g, x - 11, 214, t, ph, '#f0e0c8', 5);
    // ملعقة خشبية
    rect(g, x - 6, 210, 1, 12, '#7a5a36');
    // أرغفة معلّقة
    for (let i = 0; i < 3; i++) {
      const bx = x + 8 + i * 5;
      const sway = Math.sin(t * 2 + ph + i) * 0.8;
      rect(g, bx + sway, 208, 4, 7, i % 2 ? '#b8843e' : '#c9954a');
      rect(g, bx + 1 + sway, 210, 2, 1, '#e8c07a');
    }
    // صحون
    rect(g, x + 8, 221, 5, 2, '#8a7a62');
    rect(g, x + 15, 222, 4, 1, '#8a7a62');
    dust(g, x + 16, 220, t, ph, 4, '#e0d0b0');
    // بخار إضافي يتصاعد ببطء
    steam(g, x + 6, 220, t, ph + 1.7, '#d8c8b0', 3);
    counter(g, x, 24);
  }

  V.drawMarketStalls = function (g, t) {
    foodStall(g, 118, t, 0.5, '#6b2c22', '#3a1814');
    foodStall(g, 390, t, 2.1, '#6b5a2a', '#3a3018');
    // فوانيس معلّقة فوق الرصيف
    for (let i = 0; i < 4; i++) {
      lantern(g, 88 + i * 104, 196, t, i * 1.3, i % 2 ? '#ffcf7a' : '#ffb060');
    }
  };

  // ------------------------------------------------------------
  //  الممثلون ونقاط التفاعل
  // ------------------------------------------------------------
  V.populate = function (s) {
    // أصحاب المحلات يُرسمون داخل واجهاتهم (drawStalls)؛ الممثلون هنا للمشرّدين والأطفال.
    const out = active(s).filter((sp) => sp.spr && sp.kind === 'beggar' && !sp.sit).map((sp) => ({
      kind: sp.spr,
      shop: sp.id,
      x: sp.x + (sp.id === 'mustafa' ? 0 : 14),
      y: sp.ay || 237,
      s: sp.ss || 2.12,
      pose: 'idle',
      bob: sp.bob !== false,
      flip: !!sp.flip,
    }));
    if (active(s).some((sp) => sp.kind === 'playground')) {
      out.push(
        { kind: 'childBoy', x: 1072, y: 245, s: 1.35, pose: 'idle', bob: true, flip: true },
        { kind: 'childGirl', x: 1118, y: 246, s: 1.3, pose: 'idle', bob: true }
      );
    }
    return out;
  };

  V.attach = function () {
    const s = G.state || {};
    const list = active(s);
    const hs = list.map((sp) => {
      const actor = (G.actors || []).find((a) => a.shop === sp.id);
      const target = sp.id === 'mustafa' || sp.id === 'hassan' ? 'homeless' : sp.id;
      return {
        id: sp.id,
        x: sp.x,
        y: (sp.ay || 237) - 2,
        my: sp.my,
        icon: sp.icon,
        label: sp.role,
        ready: ready(sp, s),
        r: sp.r || 27,
        actor,
        onInteract: () => (G.villageAction ? G.villageAction(target) : null),
      };
    });
    // بوابة الحصن (غربًا): الضغط عليها يخرجك من الحصن إلى جبال العظام.
    hs.push({
      id: 'fortgate',
      x: 48,
      y: 232,
      my: 166,
      icon: '⇱',
      label: 'بوابة الحصن — الخروج إلى جبال العظام',
      ready: true,
      r: 32,
      onInteract: () => (G.exitFortGate ? G.exitFortGate() : null),
    });
    A.roam.setHotspots(hs);
  };

  V.attachMarket = function () {
    const s = G.state || {};
    // المطاعم لا تبيع «طعام المشرّدين» إلا بعد لقائهم.
    const foodQuest = (s.quests || {}).food;
    const can = !s.flags.foodBought && foodQuest === 'active';
    A.roam.setHotspots([
      {
        id: 'rest1', x: 118, y: 242, my: 186, icon: '♨', label: 'مطعم قدر الرماد',
        ready: can, r: 30, onInteract: () => G.openFoodShop('stew'),
      },
      {
        id: 'rest2', x: 390, y: 242, my: 186, icon: '◍', label: 'مخبز أم هاني',
        ready: can, r: 30, onInteract: () => G.openFoodShop('bread'),
      },
    ]);
  };

  // وميض على علامة الكشك بعد إكمال مهمة
  V.afterAction = function (beforeQuests) {
    const s = G.state;
    if (!s) return;
    const before = beforeQuests || {};
    const now = s.quests || {};
    for (const sp of active(s)) {
      if (!sp.quest || now[sp.quest] !== 'done' || before[sp.quest] === 'done') continue;
      const el = A.$('.roam-mark[data-id="' + sp.id + '"]', G.ui);
      if (!el) continue;
      el.classList.add('celebrate');
      const pop = document.createElement('span');
      pop.className = 'roam-pop';
      pop.textContent = 'تمّت المهمة';
      el.appendChild(pop);
      setTimeout(() => { el.classList.remove('celebrate'); pop.remove(); }, 1500);
    }
  };
})(window.ASH);
