/* ============================================================
   مشاهد سينمائية متحركة: التكريم، التمثال، والوقفة الأخيرة
   كل الرسم برمجي على نفس قماش اللعبة 480×270.
   ============================================================ */
(function (A) {
  const C = (A.cinema = {});
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
    let dx = Math.abs(Math.round(x1) - Math.round(x0)), dy = Math.abs(Math.round(y1) - Math.round(y0));
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx - dy;
    let guard = Math.max(8, (dx + dy) * 3 + 8);
    g.fillStyle = c;
    let x = Math.round(x0), y = Math.round(y0);
    for (;;) {
      g.fillRect(x, y, t, t);
      if (x === Math.round(x1) && y === Math.round(y1)) break;
      if (--guard <= 0) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  };
  const glow = (g, x, y, r, c, a) => {
    if (!isFinite(x) || !isFinite(y) || !isFinite(r) || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = a == null ? 0.5 : a;
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  };
  const clamp = A.clamp || ((v, a, b) => Math.max(a, Math.min(b, v)));
  const lerp = A.lerp || ((a, b, k) => a + (b - a) * k);

  let raf = 0, last = 0;

  C.mode = null;
  C.phase = 'idle';
  C.age = 0;
  C.t0 = 0;
  C.actors = [];
  C.hero = null;
  C.king = null;
  C.ls = null;
  C.duel = null;
  C.revealT = 0;
  C.update = null;
  C.overlay = null;

  function G() { return A.game; }

  function begin(mode, bg, actors) {
    const g = G();
    if (!g) return;
    C.stop();
    C.mode = mode;
    C.phase = 'idle';
    C.phaseT = 0;
    C.age = 0;
    C.t0 = performance.now();
    C.revealT = 0;
    C.actors = actors || [];
    C.hero = null;
    C.king = null;
    g.mode = 'scene';
    g.hideChrome();
    g.clearDialogue();
    g.ui.innerHTML = '';
    g.setBg(bg, C.actors, {});
    g.overlay = null;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick(t) {
    if (!C.mode) { raf = 0; return; }
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    C.age = (t - C.t0) / 1000;
    try { if (C.update) C.update(dt, C.age); } catch (e) { console.warn(e); }
  }

  C.stop = function () {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    C.mode = null;
    C.phase = 'idle';
    C.phaseT = 0;
    C.actors = [];
    C.hero = null;
    C.king = null;
    C.ls = null;
    C.duel = null;
    C.revealT = 0;
    C.update = null;
    C.overlay = null;
    const g = G();
    if (g && g.overlay) g.overlay = null;
  };

  // ============================================================
  //  التكريم داخل قصر الملك — بعد الفوز
  // ============================================================
  C.palaceHonor = async function (tier) {
    const g = G(), s = g && g.state;
    if (!g || !s) return;
    const hero = { kind: 'hero', x: 112, y: 252, s: 2.5, pose: 'walk', opts: g.heroOpts(), bob: false };
    const king = { kind: 'king', x: 240, y: 204, s: 2.15, pose: 'idle', bob: true };
    const actors = [
      { kind: 'soldier', x: 92, y: 238, s: 2.05, pose: 'idle', bob: true, flip: true },
      { kind: 'soldier', x: 388, y: 238, s: 2.05, pose: 'idle', bob: true, flip: true },
      { kind: 'villagerWoman', x: 42, y: 246, s: 1.95, pose: 'idle', bob: true },
      { kind: 'herbalist', x: 70, y: 246, s: 1.95, pose: 'idle', bob: true, flip: true },
      { kind: 'hunter', x: 414, y: 246, s: 1.95, pose: 'idle', bob: true, flip: true },
      { kind: 'villagerMan', x: 446, y: 246, s: 1.95, pose: 'idle', bob: true, flip: true },
      king,
      hero,
    ];
    // بعض المشاهد القديمة لا تعرف هذه الأنواع؛ استبدلها بصور متاحة.
    const safe = actors.map((a) => {
      if (a.kind === 'villagerWoman') return Object.assign({}, a, { kind: 'herbalist', opts: {} });
      if (a.kind === 'villagerMan') return Object.assign({}, a, { kind: 'hunter', opts: {} });
      return a;
    });
    begin('honor', 'palace', safe);
    C.hero = hero;
    C.king = king;
    C.phase = 'enter';
    C.phaseT = 0;
    C.update = function (dt) {
      C.phaseT += dt;
      if (C.phase === 'enter') {
        const k = clamp(C.phaseT / 2.2, 0, 1);
        const e = A.easeOut ? A.easeOut(k) : k;
        hero.x = lerp(112, 238, e);
        hero.pose = k < 0.94 ? 'walk' : 'idle';
        if (k >= 1) C.phase = 'stand';
      }
    };
    C.overlay = function (ctx) { drawHonorOverlay(ctx); };
    g.overlay = C.overlay;
    A.audio.ambient('palace');

    await A.sleep(750);
    await g.play([
      { w: 'narr', t: 'الأبواب الحديدية تفتح. القاعة كلها واقفة، إلا الملك.' },
      { w: 'king', t: 'اقترب، {name}. لم يحمل أحدٌ عنّا هذا الثقل من قبل.' },
    ]);
    C.phase = 'sword';
    C.phaseT = 0;
    g.shake(2, 260);
    await A.sleep(850);
    await g.play([
      { w: 'narr', t: 'يرفع سيفًا قديمًا، ويضعه على كتفك. القاعة تُضيء.' },
      { w: 'king', t: 'لن أمنحك تاجًا؛ التيجان تُخلع. سأمنحك اسمًا يبقى: **حامي دير النار**.' },
      { w: 'narr', t: 'خلف الأبواب، المدينة تهتف باسمك.' },
    ]);
    if (!s.flags.honored) {
      s.flags.honored = true;
      s.rep += 12;
      g.awardTrophy('honor');
      g.toast('كرّمك الملك: حامي دير النار', 'trophy');
    }
    await A.sleep(900);
    C.stop();
  };

  function drawHonorOverlay(ctx) {
    const age = C.age;
    // أعمدة ضوء ذهبية
    for (const [x, w] of [[120, 26], [300, 20], [210, 14]]) {
      ctx.globalAlpha = 0.045 + 0.02 * Math.sin(age * 0.9 + x);
      ctx.fillStyle = '#f0c070';
      ctx.beginPath();
      ctx.moveTo(x - 6, 34); ctx.lineTo(x + 6, 34);
      ctx.lineTo(x + w, 236); ctx.lineTo(x - w, 236);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // غبار ذهبي
    for (let i = 0; i < 30; i++) {
      const x = (i * 67 + age * (5 + (i % 4) * 3)) % 470 + 5;
      const y = 46 + ((i * 41 + Math.sin(age * 0.8 + i) * 16) % 182);
      ctx.globalAlpha = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(age * 1.7 + i));
      rect(ctx, x, y, 1, 1, '#f2d483');
    }
    ctx.globalAlpha = 1;
    // السيف الذي يمنح الاسم
    if (C.phase === 'sword' || C.phase === 'stand') {
      const on = C.phase === 'sword' ? clamp(C.phaseT / 0.35, 0, 1) : 1;
      const pulse = 0.45 + 0.25 * Math.sin(age * 4.5);
      const x0 = 256, y0 = 187, x1 = 248, y1 = 216;
      ctx.globalAlpha = on * 0.55;
      line(ctx, x0, y0, x1, y1, '#ffe9ad', 2);
      ctx.globalAlpha = on * (0.28 + pulse * 0.25);
      line(ctx, x0 + 1, y0, x1 + 1, y1, '#fff6d8', 1);
      glow(ctx, lerp(x0, x1, 0.65), lerp(y0, y1, 0.65), 14, 'rgba(255,225,150,.9)', on * (0.26 + pulse * 0.2));
      ctx.globalAlpha = 1;
    }
    // شرارات صاعدة عند لحظة التكريم
    if (C.phase === 'sword') {
      for (let i = 0; i < 16; i++) {
        const life = (C.phaseT * 1.6 + i * 0.11) % 1;
        const x = 232 + Math.sin(i * 2.3) * 18;
        const y = 218 - life * 64;
        ctx.globalAlpha = (1 - life) * 0.8;
        rect(ctx, x, y, 1, 2, i % 3 ? '#f5cf72' : '#fff0be');
      }
      ctx.globalAlpha = 1;
    }
  }

  // ============================================================
  //  قائد الرماد — الوقوف فوقه وإنهاء الأمر
  // ============================================================
  C.lastDuel = async function () {
    const g = G(), s = g && g.state;
    if (!g || !s) return 0;

    const baseY = 252;
    const hero = {
      kind: 'hero', x: 122, y: baseY, s: 2.55, pose: 'idle', bob: false,
      opts: Object.assign({}, g.heroOpts(), { weapon: 'sword' }),
    };
    const champ = {
      kind: 'champion', x: 352, y: 247, s: 2.75, pose: 'idle', lie: true,
      lieAngle: -Math.PI / 2, bob: false, opts: { weapon: null },
    };
    const actors = [
      { kind: 'soldier', x: 62, y: 246, s: 1.85, lie: true, lieAngle: -Math.PI / 2, bob: false },
      { kind: 'soldier', x: 438, y: 242, s: 1.75, lie: true, lieAngle: Math.PI / 2, bob: false },
      champ,
      hero,
    ];

    begin('lastduel', 'battle', actors);
    const L = (C.duel = {
      hero, champ, phase: 'approach', phaseT: 0, baseY,
      blood: [], dust: [], dustT: 0, stabbed: false, pulled: false, twist: false, deadT: 0,
    });
    C.update = function (dt) { updateLastDuel(dt); };
    C.overlay = function (ctx) { drawLastDuelOverlay(ctx); };
    g.overlay = C.overlay;
    A.audio.ambient('war');

    let choice = 0;
    try {
      // يقترب البطل من القائد الملقى ويقف عند صدره.
      await A.sleep(1550);
      L.phase = 'stand';
      L.phaseT = 0;
      hero.x = 308;
      hero.y = baseY;
      await g.play([
        { w: 'narr', t: 'تصل إلى القائد. درعه مكسور، وسيفه ملقًى على بعد خطوة. الرماد يزحف بعيدًا عن قدميك كأنه يعرفك.' },
        { w: 'champion', t: 'أنت… مدنيّ. كنتَ تحمل فحمًا.' },
        { w: 'hero', t: 'كنتُ أحمل الفحم. ثم حملتُ المدينة.' },
      ]);

      // خيارات النهاية — «تقتله» (فتلة) هو الإنهاء الوحيد، مع الرحمة أو السلام.
      const picked = await g.ask([
        { label: 'ارحمه.', sub: 'دعه يحمل خبر الهزيمة' },
        { label: 'تقتله.', sub: 'أدر النصل قبل أن تسحبه', danger: true },
        { label: 'اعرض السلام.', sub: 'لنا أسماء… وأنتم تملكون رمادًا', req: (st) => st.flags.jinnArmy || st.flags.suppliesDone, reqText: 'تحتاج موقف قوّة (جيش الجنّ أو تجهيز كامل)' },
      ]);
      // نعيد الفهرس الأصلي (0 رحمة، 2 فتلة، 3 سلام) كي يبقى منطق النهاية في game.js كما هو.
      choice = [0, 2, 3][picked] || 0;

      if (choice === 1 || choice === 2) {
        const twist = choice === 2;
        L.twist = twist;
        // يترك السيف في يده ويغرسه — نرسم النصل في الطبقة العلوية.
        hero.opts = Object.assign({}, hero.opts, { weapon: null });
        L.phase = 'raise';
        L.phaseT = 0;
        A.audio.select();
        await A.sleep(300);

        L.phase = 'stab';
        L.phaseT = 0;
        L.stabbed = true;
        A.audio.hit();
        g.shake(3.4, 320);
        spawnBlood(L, 18, twist ? 1.2 : 1);
        await A.sleep(430);

        if (twist) {
          L.phase = 'twist';
          L.phaseT = 0;
          A.audio.hurt();
          g.shake(4.4, 460);
          spawnBlood(L, 15, 1.35);
          await A.sleep(820);
        } else {
          await A.sleep(360);
        }

        L.phase = 'dead';
        L.phaseT = 0;
        L.deadT = 0;
        A.audio.hit();
        g.shake(2, 260);
        await A.sleep(420);
        await g.play([
          { w: 'narr', t: twist
            ? 'تُدخل السيف، ثم تفتله. جسد القائد ينتفض مرة واحدة، ثم يستسلم للرماد.'
            : 'تغرس السيف. الرماد لا يصرخ. فقط يزداد.' },
        ]);
        await A.sleep(440);
        if (twist) {
          L.pulled = true;
          A.audio.hit();
          g.shake(1.4, 160);
        }
        await g.play([
          { w: 'narr', t: twist
            ? 'تسحب النصل. خلفك، تسمع خطوةً تتراجع، ثم أخرى. الجيش ينسحب كأنه لم يكن.'
            : 'تترك السيف في درعه. خلفك، تسمع خطوةً تتراجع، ثم أخرى. الجيش ينسحب كأنه لم يكن.' },
        ]);
        await A.sleep(760);
      } else if (choice === 0) {
        L.phase = 'mercy';
        L.phaseT = 0;
        await A.sleep(320);
        await g.play([
          { w: 'narr', t: 'تنحني وتأخذ سيفه. لا تقتله. لم يفهم لماذا، وأنت أيضًا.' },
          { w: 'champion', t: '…لماذا؟' },
          { w: 'narr', t: 'لا تجيب. تنظر إلى الجيش المتراجع، ثم تعود إلى السور.' },
        ]);
        await A.sleep(700);
      } else {
        L.phase = 'peace';
        L.phaseT = 0;
        await g.play([
          { w: 'narr', t: 'تكتب على درعه المكسور: «لنا أسماء، وأنتم تملكون رمادًا. لنتفاوض».' },
          { w: 'narr', t: 'لا تعرف إن كان أحدٌ سيقرأ. لكن الكلمة الأولى في الحكاية دائمًا تُكتب قبل النهاية.' },
        ]);
        await A.sleep(700);
      }
    } finally {
      C.stop();
    }
    return choice;
  };

  function updateLastDuel(dt) {
    const L = C.duel;
    if (!L) return;
    const h = L.hero, c = L.champ;
    L.phaseT += dt;

    if (L.phase === 'approach') {
      const k = clamp(L.phaseT / 1.55, 0, 1);
      const e = A.easeOut ? A.easeOut(k) : k;
      h.x = lerp(122, 308, e);
      h.y = L.baseY - Math.abs(Math.sin(L.phaseT * 8.5)) * 2;
      if (k >= 1) { L.phase = 'stand'; L.phaseT = 0; h.y = L.baseY; }
    } else {
      h.y = L.baseY;
    }

    // ارتجاف القائد: تنفّسٌ ضعيف، ثم نفضة الموت.
    if (L.phase === 'stab' || L.phase === 'twist') {
      c.y = 247 + Math.sin(L.phaseT * 34) * 1.7;
    } else if (L.phase === 'stand') {
      c.y = 247 + Math.sin(L.phaseT * 3.1) * 0.6;
    } else {
      c.y = 247;
    }

    // دم يسقط على الأرض.
    for (let i = L.blood.length - 1; i >= 0; i--) {
      const b = L.blood[i];
      b.life += dt;
      b.vy += 290 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life >= b.ttl || (b.y > 250 && b.vy > 0)) L.blood.splice(i, 1);
    }

    // غبار انسحاب الجيش بعد الموت.
    if (L.phase === 'dead') {
      L.deadT += dt;
      L.dustT -= dt;
      if (L.dustT <= 0 && L.deadT < 3.2) {
        for (let i = 0; i < 3; i++) {
          L.dust.push({
            x: 350 + Math.random() * 130,
            y: 226 + Math.random() * 22,
            vx: 14 + Math.random() * 36,
            vy: -6 - Math.random() * 12,
            r: 5 + Math.random() * 11,
            life: 0,
            ttl: 0.8 + Math.random() * 0.9,
          });
        }
        L.dustT = 0.16;
      }
    }
    for (let i = L.dust.length - 1; i >= 0; i--) {
      const d = L.dust[i];
      d.life += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.life >= d.ttl) L.dust.splice(i, 1);
    }
  }

  function duelChest(L) {
    const h = L.champ.s * 24;
    return { x: L.champ.x - h * 0.62, y: L.champ.y - 2 };
  }

  function spawnBlood(L, n, power) {
    const c = duelChest(L);
    for (let i = 0; i < n; i++) {
      L.blood.push({
        x: c.x + (Math.random() - 0.5) * 10,
        y: c.y - Math.random() * 3,
        vx: (Math.random() - 0.5) * 84 * (power || 1),
        vy: -24 - Math.random() * 76 * (power || 1),
        life: 0,
        ttl: 0.45 + Math.random() * 0.55,
        s: Math.random() < 0.35 ? 2 : 1,
        c: Math.random() < 0.5 ? '#7c0d14' : '#a3131b',
      });
    }
  }

  function duelBlade(ctx, x0, y0, x1, y1) {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const gx = Math.cos(ang + Math.PI / 2) * 7;
    const gy = Math.sin(ang + Math.PI / 2) * 7;
    line(ctx, x0, y0, x1, y1, '#23232b', 4);
    line(ctx, x0, y0, x1, y1, '#b9c0cc', 3);
    line(ctx, x0, y0, x1, y1, '#eef2f8', 1);
    // مقبض وواقية
    line(ctx, x0 + gx, y0 + gy, x0 - gx, y0 - gy, '#8a6a2e', 2);
    line(ctx, x0 - Math.cos(ang) * 6, y0 - Math.sin(ang) * 6, x0, y0, '#4a2c1e', 2);
  }

  function drawLastDuelOverlay(ctx) {
    const L = C.duel;
    if (!L) return;
    const age = C.age;
    const h = L.hero;
    const chest = duelChest(L);

    // غبار أرضي خفيف حول المشهد.
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#c8a07a';
    ctx.beginPath();
    ctx.ellipse(300, 250, 170, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // بركة دم تحت القائد.
    if (L.stabbed) {
      const k = L.phase === 'stab' ? clamp(L.phaseT / 0.45, 0, 1) : 1;
      ctx.globalAlpha = 0.62;
      ctx.fillStyle = '#3a070b';
      ctx.beginPath();
      ctx.ellipse(chest.x - 2, L.champ.y + 1, 10 + k * 10, 2.6 + k * 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#6e0c12';
      ctx.beginPath();
      ctx.ellipse(chest.x, L.champ.y, 4 + k * 6, 1.2 + k * 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // جزيئات الدم.
    for (const b of L.blood) {
      const a = clamp(1 - b.life / b.ttl, 0, 1);
      ctx.globalAlpha = a;
      rect(ctx, b.x, b.y, b.s, b.s, b.c);
    }
    ctx.globalAlpha = 1;

    // النصل: يُرفع، ثم يغرس، ثم يبقى في الصدر.
    const handX = h.x + 7, handY = h.y - 36;
    let bx = chest.x, by = chest.y - 1;
    if (L.phase === 'raise') {
      const k = clamp(L.phaseT / 0.3, 0, 1);
      bx = lerp(handX + 10, handX + 24, k);
      by = lerp(handY - 8, handY - 42, k);
      duelBlade(ctx, handX, handY, bx, by);
      glow(ctx, bx, by, 10, 'rgba(255,238,190,.95)', 0.35 + k * 0.2);
    } else if (L.phase === 'stab') {
      const k = clamp(L.phaseT / 0.18, 0, 1);
      bx = lerp(handX + 24, chest.x, k);
      by = lerp(handY - 42, chest.y - 1, k);
      duelBlade(ctx, handX, handY, bx, by);
      glow(ctx, bx, by, 14, 'rgba(255,220,170,.95)', 0.4 + 0.2 * Math.sin(age * 18));
    } else if (L.phase === 'twist') {
      const wob = Math.sin(L.phaseT * 28) * 2.2;
      bx = chest.x + wob;
      by = chest.y;
      duelBlade(ctx, handX + wob, handY, bx, by);
      glow(ctx, chest.x, chest.y, 16, 'rgba(220,30,36,.9)', 0.35 + 0.2 * Math.sin(L.phaseT * 22));
    } else if (L.stabbed) {
      if (L.pulled) duelBlade(ctx, handX, handY, handX + 18, handY + 24);
      else duelBlade(ctx, handX, handY, chest.x, chest.y);
      // رجفة النصل لحظة الموت.
      if (L.phase === 'dead' && L.phaseT < 0.35) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#c01822';
        ctx.beginPath();
        ctx.ellipse(chest.x, chest.y, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // غبار الانسحاب.
    for (const d of L.dust) {
      const k = clamp(1 - d.life / d.ttl, 0, 1);
      ctx.globalAlpha = 0.16 * k;
      ctx.fillStyle = '#b89a7a';
      ctx.beginPath();
      ctx.ellipse(d.x, d.y, d.r * (1.2 - k * 0.3), d.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.1 * k;
      ctx.fillStyle = '#5a4438';
      ctx.beginPath();
      ctx.ellipse(d.x - 4, d.y + 2, d.r * 0.7, d.r * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ظلال الجنود تنسحب نحو الأفق بعد سقوط قائدهم.
    if (L.phase === 'dead') {
      const k = clamp(L.deadT / 2.6, 0, 1);
      ctx.globalAlpha = 0.55 * (1 - k);
      ctx.fillStyle = '#120b10';
      for (let i = 0; i < 6; i++) {
        const x = 384 + i * 17 + k * (54 + (i % 3) * 22);
        const y = 226 + (i % 3) * 5 - k * 10;
        ctx.fillRect(x, y - 13, 3, 10);
        ctx.fillRect(x - 1, y - 17, 5, 4);
        ctx.fillRect(x + 4, y - 24, 1, 16);
      }
      ctx.globalAlpha = 1;
    }

    // لمسة فجر باردة على المشهد بأكمله.
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, 'rgba(80,30,26,' + (L.phase === 'dead' ? 0.28 : 0.16) + ')');
    gr.addColorStop(1, 'rgba(10,6,8,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // ============================================================
  //  التمثال داخل المملكة — نهاية التضحية
  // ============================================================
  C.memorial = async function () {
    const g = G(), s = g && g.state;
    if (!g || !s) return;
    const actors = [
      { kind: 'soldier', x: 66, y: 244, s: 2.0, pose: 'idle', bob: true, flip: true },
      { kind: 'captain', x: 108, y: 248, s: 2.05, pose: 'idle', bob: true },
      { kind: 'king', x: 158, y: 246, s: 2.1, pose: 'idle', bob: true },
      { kind: 'soldier', x: 320, y: 244, s: 2.0, pose: 'idle', bob: true, flip: true },
      { kind: 'soldier', x: 356, y: 246, s: 2.0, pose: 'idle', bob: true, flip: true },
      { kind: 'hunter', x: 396, y: 248, s: 1.95, pose: 'idle', bob: true, flip: true },
      { kind: 'herbalist', x: 430, y: 248, s: 1.9, pose: 'idle', bob: true, flip: true },
    ];
    begin('memorial', 'memorial', actors);
    C.revealT = 0;
    C.phase = 'veil';
    C.update = function (dt) { C.phaseT += dt; };
    C.overlay = function (ctx) { drawMemorialOverlay(ctx); };
    g.overlay = C.overlay;
    A.audio.ambient('end');

    await A.sleep(700);
    await g.play([
      { w: 'narr', t: 'بعد عام، في ساحة المملكة، يرفع الحجرُ إنسانًا.' },
      { w: 'narr', t: 'الملك يقف بنفسه أمام التمثال — لا على العرش.' },
    ]);
    C.phase = 'reveal';
    C.phaseT = 0;
    C.revealT = performance.now();
    g.shake(1.6, 220);
    await A.sleep(950);
    await g.play([
      { w: 'king', t: 'لم يطلب تاجًا. ولن نعطيه واحدًا. أعطوه حجرًا، ليبقى.' },
      { w: 'narr', t: 'يُسحب القماش. الوجه ليس وجهك تمامًا، لكن الوقفة وقفتك.' },
      { w: 'king', t: 'على القاعدة نكتب: **حامي دير النار**. وتحتها أسماء من وقفوا معه.' },
      { w: 'narr', t: 'في كل فجر، يضع أحدهم زهرة عند قدميك. الفجر الذي لم تره صار يُزار كل يوم.' },
    ]);
    s.flags.honored = true;
    s.flags.statue = true;
    s.flags.honorNames = true;
    if (!s.trophies || !s.trophies.honor) {
      s.rep += 12;
      g.awardTrophy('honor');
      g.toast('نُحت لك تمثال في ساحة المملكة', 'trophy');
    }
    C.phase = 'done';
    await A.sleep(1100);
    C.stop();
  };

  function drawMemorialOverlay(ctx) {
    const age = C.age;
    // ضوء الفجر
    glow(ctx, 240, 64, 130, 'rgba(255,210,140,.75)', 0.28 + Math.sin(age * 0.7) * 0.03);
    for (let i = 0; i < 24; i++) {
      const x = (i * 73 + age * 4) % 470 + 5;
      const y = 50 + ((i * 37 + Math.sin(age + i) * 14) % 170);
      ctx.globalAlpha = 0.16 + 0.2 * (0.5 + 0.5 * Math.sin(age * 1.5 + i));
      rect(ctx, x, y, 1, 1, '#f4d38a');
    }
    ctx.globalAlpha = 1;

    // القماش الذي يُسحب عن التمثال
    let k = 0;
    if (C.revealT) k = clamp((performance.now() - C.revealT) / 1900, 0, 1);
    if (k < 1) {
      const e = A.easeOut ? A.easeOut(k) : k;
      const drop = e * 128;
      const top = 137 + drop;
      const bottom = 232 + drop;
      ctx.globalAlpha = 0.98;
      rect(ctx, 207, top, 66, bottom - top, '#c7bba6');
      rect(ctx, 209, top + 2, 62, Math.max(0, bottom - top - 4), '#b6a992');
      rect(ctx, 212, top + 6, 2, Math.max(0, bottom - top - 12), '#a89a82');
      rect(ctx, 224, top + 4, 1, Math.max(0, bottom - top - 8), '#d8cdb9');
      rect(ctx, 242, top + 5, 2, Math.max(0, bottom - top - 10), '#a2957e');
      rect(ctx, 258, top + 4, 1, Math.max(0, bottom - top - 8), '#d8cdb9');
      rect(ctx, 207, top + 2, 66, 2, '#e2d7c4');
      // حبل ذهبي
      ctx.strokeStyle = '#c9a227';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(207, top + 10); ctx.lineTo(273, top + 12);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ورد/بتلات تتساقط بعد الكشف
    if (k > 0.35) {
      const n = Math.floor((k - 0.35) * 30);
      for (let i = 0; i < n; i++) {
        const life = (age * 0.22 + i * 0.27) % 1;
        const x = 196 + (i * 19) % 92 + Math.sin(age + i) * 5;
        const y = 120 + life * 126;
        ctx.globalAlpha = (1 - life) * 0.7;
        rect(ctx, x, y, 1, 1, i % 3 ? '#c96f7a' : '#e3a0a8');
      }
      ctx.globalAlpha = 1;
    }

    // غبار حجري عند سحب القماش
    if (C.phase === 'reveal' && C.phaseT < 1.1) {
      for (let i = 0; i < 14; i++) {
        const x = 214 + Math.sin(i * 2.1) * 24;
        const y = 224 - C.phaseT * 12 - (i % 4) * 3;
        ctx.globalAlpha = Math.max(0, 0.4 - C.phaseT * 0.3);
        rect(ctx, x, y, 1, 1, '#d8cdb9');
      }
      ctx.globalAlpha = 1;
    }
  }

  // مشهد الساحة: خلفية التمثال نفسه
  function drawMemorial(g, t) {
    const sky = g.createLinearGradient(0, 0, 0, 206);
    sky.addColorStop(0, '#241f30'); sky.addColorStop(0.5, '#7a4a4c'); sky.addColorStop(1, '#d99a68');
    g.fillStyle = sky; g.fillRect(0, 0, W, 206);
    glow(g, 240, 72, 150, 'rgba(255,214,150,.8)', 0.38);
    disc(g, 240, 74, 24, '#ffe1a6');

    // جبال بعيدة
    g.fillStyle = '#3a2a34';
    g.beginPath(); g.moveTo(0, 150);
    for (let x = 0; x <= W; x += 30) g.lineTo(x, 126 + Math.sin(x * 0.02 + 1) * 16 + (x % 60 ? 6 : 0));
    g.lineTo(W, 150); g.closePath(); g.fill();

    // سور المملكة في الخلف
    rect(g, 0, 118, W, 72, '#241b2a');
    rect(g, 0, 115, W, 4, '#332538');
    for (let x = -4; x < W; x += 26) {
      rect(g, x, 108, 16, 12, '#2b2032');
      rect(g, x, 108, 16, 2, '#3a2c40');
    }
    for (const tx of [44, 206, 268, 436]) {
      rect(g, tx - 14, 96, 28, 94, '#2a2031');
      rect(g, tx - 17, 92, 34, 6, '#362a3c');
      for (let i = 0; i < 3; i++) rect(g, tx - 15 + i * 11, 85, 7, 8, '#362a3c');
    }
    // بوابة المدينة خلف التمثال
    g.fillStyle = '#140e18';
    g.beginPath();
    g.moveTo(214, 190); g.lineTo(214, 148);
    g.arc(240, 148, 26, Math.PI, 0);
    g.lineTo(266, 190); g.closePath(); g.fill();
    rect(g, 232, 190, 16, 48, '#0d0910');
    glow(g, 240, 166, 52, 'rgba(255,170,80,.3)', 0.4);

    // أرضية الساحة
    rect(g, 0, 190, W, 80, '#2a212c');
    rect(g, 0, 190, W, 3, '#4a3a46');
    for (let i = 0; i < 8; i++) rect(g, 0, 198 + i * 10, W, 1, '#332733');
    for (let i = 0; i < 12; i++) rect(g, i * 44, 190, 1, 80, '#312431');

    // منصّة التمثال
    glow(g, 240, 206, 58, 'rgba(255,215,145,.52)', 0.3);
    rect(g, 210, 226, 60, 10, '#3a3038');
    rect(g, 206, 236, 68, 8, '#2d242c');
    rect(g, 216, 216, 48, 12, '#514752');
    rect(g, 220, 209, 40, 8, '#5e535c');
    rect(g, 220, 209, 40, 1, '#7e707a');
    // نقوش على القاعدة
    rect(g, 228, 219, 24, 1, '#9b8a72');
    rect(g, 231, 222, 18, 1, '#7d6e5a');
    rect(g, 234, 225, 12, 1, '#c9a227');

    // التمثال — يحمل هيئة البطل/البطلة كما اختارها اللاعب
    const look = A.art.look && A.game.state ? A.art.look(A.game.state.look) : null;
    const st = A.art.spr('statue', { female: !!(look && look.o && look.o.female) });
    A.art.drawSprite(g, st, 240, 212, 2.95, false, 1);
    // ظل خفيف تحت التمثال
    g.globalAlpha = 0.35;
    g.fillStyle = '#000';
    g.beginPath(); g.ellipse(240, 227, 26, 4, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1;

    // رايات المملكة
    for (const [x, y] of [[176, 100], [304, 100]]) {
      rect(g, x - 1, y, 2, 72, '#3a2c1e');
      g.fillStyle = '#5e1219';
      g.beginPath();
      g.moveTo(x + 1, y); g.lineTo(x + 20, y + 2);
      g.lineTo(x + 20, y + 30); g.lineTo(x + 10, y + 25);
      g.lineTo(x + 1, y + 30); g.closePath(); g.fill();
      rect(g, x + 8, y + 10, 4, 4, '#c9a227');
    }

    // مشاعل عند الساحة
    for (const [x, ph] of [[186, 0], [294, 2], [232, 4], [248, 1.6]]) {
      rect(g, x, 196, 2, 10, '#2a2018');
      glow(g, x + 1, 192, 18, 'rgba(255,160,70,.65)', 0.4 + Math.sin(t * 4 + ph) * 0.07);
      g.globalAlpha = 0.85;
      g.fillStyle = '#ffd88a';
      g.beginPath(); g.moveTo(x - 2, 196); g.lineTo(x + 1 + Math.sin(t * 6 + ph) * 1.4, 188); g.lineTo(x + 4, 196); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }

    // غبار ورماد فجري
    for (let i = 0; i < 24; i++) {
      const x = (i * 71 + t * 3) % W;
      const y = 150 + ((i * 31 + Math.sin(t * 0.6 + i) * 10) % 110);
      g.globalAlpha = 0.12 + 0.1 * Math.sin(t + i);
      rect(g, x, y, 1, 1, '#e8cf9e');
    }
    g.globalAlpha = 1;
  }

  // ============================================================
  //  الوقفة الأخيرة — التضحية أمام البوابة
  // ============================================================
  C.beginLastStand = function () {
    begin('laststand', 'laststand', []);
    C.ls = {
      enemies: [], arrows: [], volley: [], stones: [], corpses: [], slashes: [],
      spawnT: 0, arrowT: 0, stoneT: 0, volleyT: 0,
      phase: 'attack', phaseT: 0, dead: false, hits: 0, atk: 0, swung: false,
      fallT: 0, fallAt: 0, fell: false, puffs: [],
    };
    C.update = function (dt) { updateLastStand(dt); };
    C.overlay = function (ctx) { drawLastStandOverlay(ctx); };
    G().overlay = C.overlay;
  };

  C.resumeLastStand = function () {
    const g = G();
    if (!g || !C.ls) return;
    g.setBg('laststand', []);
    g.overlay = C.overlay || null;
  };

  C.setLastStandPhase = function (phase) {
    if (!C.ls) C.ls = {
      enemies: [], arrows: [], volley: [], stones: [], corpses: [], slashes: [],
      phase: phase, phaseT: 0, dead: false, hits: 0, atk: 0,
      spawnT: 0, arrowT: 0, stoneT: 0, volleyT: 0, swung: false,
      fallT: 0, fallAt: 0, fell: false, puffs: [],
    };
    C.ls.phase = phase;
    C.ls.phaseT = 0;
    C.ls.swung = false;
    if (phase === 'fall') {
      // لا تُعاد حركة السقوط أبدًا — حتى لو تغيّر الطور بعدها.
      if (C.ls.fell) return;
      C.ls.fell = true;
      C.ls.dead = true;
      C.ls.fallT = 0;
      C.ls.fallAt = performance.now();
      G().shake(3, 340);
      A.audio.hurt && A.audio.hurt();
    } else if (phase === 'volley') {
      // وابل سهام الجيش: كل عدو يُصاب في توقيت متدرّج حتى يسقط البحر كله.
      C.ls.volley = [];
      C.ls.volleyT = 0;
      C.ls.enemies.forEach((e, i) => {
        if (e.dieT == null) e.woundAt = 0.05 + i * 0.035 + Math.random() * 0.1;
      });
      G().shake(2, 220);
    } else if (phase === 'victory') {
      // صمت النصر: كل الأعداء سقطوا، والسور يرفع أقواسه.
      C.ls.arrows.length = 0;
      C.ls.volley.length = 0;
      C.ls.enemies.forEach((e) => { if (e.dieT == null) { e.dieT = 0; C.ls.hits++; } });
      G().shake(1, 120);
    } else if (phase === 'dawn') {
      C.ls.enemies.length = 0;
      C.ls.arrows.length = 0;
      C.ls.volley.length = 0;
      C.ls.stones.length = 0;
      C.ls.slashes.length = 0;
      C.ls.fallT = 0;
    }
  };

  function updateLastStand(dt) {
    const L = C.ls;
    if (!L) return;
    if (!L.volley) L.volley = [];
    if (!L.corpses) L.corpses = [];
    if (!L.slashes) L.slashes = [];
    if (!L.puffs) L.puffs = [];
    const now = performance.now();
    L.phaseT += dt;
    L.atk = (L.atk + dt) % 0.55;

    const fighting = L.phase === 'attack' || L.phase === 'breach';

    if (fighting) {
      const fast = L.phase === 'breach';
      L.spawnT -= dt;
      if (L.spawnT <= 0 && L.enemies.length < 18) {
        const side = Math.random() < 0.5 ? 1 : -1;
        const n = fast ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const stopX = side > 0
            ? 240 + 58 + Math.random() * 44
            : 240 - 58 - Math.random() * 44;
          L.enemies.push({
            x: side > 0 ? 320 + Math.random() * 70 : -20 - Math.random() * 70,
            y: 236 + Math.random() * 20,
            stopX,
            sp: (58 + Math.random() * 30) * (fast ? 1.2 : 1),
            s: 2.0 + Math.random() * 0.34,
            wob: Math.random() * 6.28,
            kind: Math.random() < 0.16 ? 'champion' : 'soldier',
            alive: true,
          });
        }
        L.spawnT = fast ? 0.34 : 0.62;
      }

      L.arrowT -= dt;
      if (L.arrowT <= 0) {
        const from = [62, 94, 126, 356, 388, 420][Math.floor(Math.random() * 6)];
        const side = from > 240 ? 1 : -1;
        L.arrows.push({
          x0: from, y0: 168, x1: side > 0 ? 250 + Math.random() * 210 : 230 - Math.random() * 210,
          y1: 215 + Math.random() * 26, t0: now, life: 0.48,
        });
        L.arrowT = 0.22 + Math.random() * 0.26;
      }

      L.stoneT -= dt;
      if (L.stoneT <= 0) {
        L.stones.push({ t0: now, life: 1.25, x0: 200, y0: 173, x1: 330 + Math.random() * 120, y1: 210 });
        L.stoneT = 2.4 + Math.random() * 1.8;
      }

      // ضربة سيف واسعة: تُسقط حتى ٥ أعداء في كل مرة.
      if (L.atk < 0.16 && !L.swung) {
        L.swung = true;
        L.slashes.push({ t0: now, life: 0.26, dir: (L.hits % 2) ? 1 : -1 });
        const near = L.enemies
          .filter((e) => e.dieT == null && Math.abs(e.x - 240) < 112)
          .sort((a, b) => Math.abs(a.x - 240) - Math.abs(b.x - 240));
        let killed = 0;
        for (const e of near) {
          if (killed >= 5) break;
          e.dieT = 0;
          L.hits++;
          killed++;
          L.puffs.push({ x: e.x, y: e.y - 14, t0: now, life: 0.42 });
        }
        if (killed) {
          A.audio.hit && A.audio.hit();
          G().shake(1.8, 90);
        }
      } else if (L.atk > 0.3) {
        L.swung = false;
      }
    }

    if (L.phase === 'volley') {
      // مطر السهام: دفعات كثيفة من فوق السور على كل ما تبقّى من الجيش.
      const alive = L.enemies.filter((e) => e.dieT == null);
      L.volleyT -= dt;
      if (L.volleyT <= 0 && (alive.length || L.phaseT < 3)) {
        for (let i = 0; i < 8; i++) {
          const target = alive.length && Math.random() < 0.8
            ? alive[Math.floor(Math.random() * alive.length)]
            : null;
          L.volley.push({
            x0: 24 + Math.random() * 432,
            y0: 88 + Math.random() * 44,
            x1: target ? target.x + (Math.random() - 0.5) * 16 : 60 + Math.random() * 360,
            y1: target ? target.y + 2 + Math.random() * 8 : 240 + Math.random() * 18,
            t0: now, life: 0.34 + Math.random() * 0.14,
          });
        }
        L.volleyT = 0.05;
      }
      for (const e of L.enemies) {
        if (e.woundAt != null && e.dieT == null && L.phaseT >= e.woundAt) {
          e.dieT = 0;
          L.hits++;
          L.puffs.push({ x: e.x, y: e.y - 14, t0: now, life: 0.5 });
        }
      }
    }

    // سقوط الأعداء وجثثهم
    for (let i = L.enemies.length - 1; i >= 0; i--) {
      const e = L.enemies[i];
      if (e.dieT != null) {
        e.dieT += dt;
        if (e.dieT > 0.95) {
          L.corpses.push({ x: e.x, kind: e.kind, s: e.s, flip: e.x > 240 });
          if (L.corpses.length > 46) L.corpses.shift();
          L.enemies.splice(i, 1);
        }
        continue;
      }
      if (!fighting) continue;
      // يقترب ثم يتوقف على بُعد من البطل — لا يتجمّع فوقه ولا يحيط به.
      if (e.stepX == null) e.stepX = 0;
      if (e.stopX > e.x) e.x = Math.min(e.stopX, e.x + e.sp * dt);
      else if (e.stopX < e.x) e.x = Math.max(e.stopX, e.x - e.sp * dt);
    }

    for (let i = L.arrows.length - 1; i >= 0; i--) {
      if (now - L.arrows[i].t0 > L.arrows[i].life * 1000) L.arrows.splice(i, 1);
    }
    for (let i = L.volley.length - 1; i >= 0; i--) {
      if (now - L.volley[i].t0 > L.volley[i].life * 1000) L.volley.splice(i, 1);
    }
    for (let i = L.stones.length - 1; i >= 0; i--) {
      if (now - L.stones[i].t0 > L.stones[i].life * 1000) L.stones.splice(i, 1);
    }
    for (let i = L.slashes.length - 1; i >= 0; i--) {
      if (now - L.slashes[i].t0 > L.slashes[i].life * 1000) L.slashes.splice(i, 1);
    }
    for (let i = L.puffs.length - 1; i >= 0; i--) {
      if (now - L.puffs[i].t0 > L.puffs[i].life * 1000) L.puffs.splice(i, 1);
    }
  }

  function drawLastStand(g, t) {
    const L = C.ls;
    // سماء الفجر المكهرب
    const sky = g.createLinearGradient(0, 0, 0, 190);
    sky.addColorStop(0, '#0b0710'); sky.addColorStop(0.55, '#35151b'); sky.addColorStop(1, '#7a3224');
    g.fillStyle = sky; g.fillRect(0, 0, W, 190);
    glow(g, 360, 162, 190, 'rgba(220,90,45,.5)', 0.5);
    glow(g, 80, 170, 150, 'rgba(170,70,45,.32)', 0.4);

    // جبال وغيوم
    g.fillStyle = '#26121a';
    g.beginPath(); g.moveTo(0, 146);
    for (let x = 0; x <= W; x += 26) g.lineTo(x, 122 + Math.sin(x * 0.026 + 1) * 14);
    g.lineTo(W, 146); g.closePath(); g.fill();
    g.fillStyle = 'rgba(30,16,20,.55)';
    for (let i = 0; i < 3; i++) g.fillRect((i * 173 + t * 4) % 500 - 30, 58 + i * 22, 170, 18);

    // جيش بعيد: صفوف ومشاعل
    const R = A.rng(551);
    for (let row = 0; row < 5; row++) {
      const y = 126 + row * 7;
      for (let x = 278 + (row % 2) * 5; x < 500; x += 8.5) {
        const sway = Math.sin(t * 1.1 + x * 0.2 + row) * 0.8;
        rect(g, x + sway, y - 5 - row, 2, 5 + row, '#140c11');
        rect(g, x + sway - 0.5, y - 7 - row, 2.4, 2.2, '#140c11');
        line(g, x + sway + 2, y - 7 - row, x + sway + 3, y - 14 - row, '#2a1820', 1);
        if (R() < 0.18) {
          const fx = x + sway + (R() < 0.5 ? -2 : 3);
          glow(g, fx, y - 10 - row, 7, 'rgba(255,150,60,.6)', 0.32);
          disc(g, fx, y - 10 - row, 1, '#ffd88a');
        }
      }
    }

    // السور خلف البوابة
    rect(g, 0, 150, W, 70, '#211a29');
    rect(g, 0, 147, W, 4, '#33293b');
    for (let x = -4; x < W; x += 26) {
      rect(g, x, 140, 16, 11, '#2a2234');
      rect(g, x, 140, 16, 2, '#3a3048');
    }
    // أبراج السور
    for (const [tx, sc] of [[28, 1.1], [452, 1.05]]) {
      rect(g, tx - 22 * sc, 104, 44 * sc, 62, '#2a2133');
      rect(g, tx - 25 * sc, 100, 50 * sc, 6, '#392d42');
      for (let i = 0; i < 4; i++) rect(g, tx - 22 * sc + i * 12 * sc, 92, 7 * sc, 9, '#392d42');
      rect(g, tx - 4, 126, 8, 18, '#0b0810');
      glow(g, tx, 122, 22, 'rgba(255,160,70,.55)', 0.35 + Math.sin(t * 3 + tx) * 0.05);
    }

    // البوابة في المنتصف
    g.fillStyle = '#0c0810';
    g.beginPath();
    g.moveTo(208, 218); g.lineTo(208, 176);
    g.arc(240, 176, 32, Math.PI, 0);
    g.lineTo(272, 218); g.closePath(); g.fill();
    rect(g, 212, 178, 56, 40, '#160e18');
    for (let i = 0; i < 5; i++) rect(g, 214 + i * 11, 178, 2, 40, '#3a2a2a');
    rect(g, 232, 196, 16, 2, '#5a4026');
    rect(g, 236, 208, 8, 2, '#5a4026');

    // المدافعون فوق السور
    const defs = [
      { x: 78, kind: 'soldier', o: { weapon: 'bow' }, f: false },
      { x: 118, kind: 'hunter', o: {}, f: false },
      { x: 164, kind: 'soldier', o: { weapon: 'spear' }, f: false },
      { x: 310, kind: 'soldier', o: { weapon: 'bow' }, f: true },
      { x: 356, kind: 'hunter', o: {}, f: true },
      { x: 402, kind: 'soldier', o: { weapon: 'spear' }, f: true },
    ];
    const cheering = L && (L.phase === 'victory' || L.phase === 'dawn');
    for (const d of defs) {
      const bob = Math.sin(t * (cheering ? 5 : 2) + d.x * 0.08) * (cheering ? 1.6 : 0.7);
      g.globalAlpha = 0.3; g.fillStyle = '#000';
      g.beginPath(); g.ellipse(d.x, 164, 8, 2.2, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      const o = Object.assign({}, d.o);
      if (cheering) o.pose = 'attack';
      A.art.drawSprite(g, A.art.spr(d.kind, o), d.x, 166 + bob, 1.5, d.f, 1);
    }
    if (cheering) {
      const ck = clamp((L.phaseT || 0) / 1.2, 0, 1);
      glow(g, 240, 168, 210, 'rgba(255,205,120,' + (0.22 + ck * 0.2) + ')', 0.5);
    }
    // رايات
    for (const [x, y, col] of [[180, 132, '#5e1219'], [300, 132, '#5e1219']]) {
      rect(g, x, y, 2, 40, '#3a2c1e');
      g.fillStyle = col;
      g.beginPath(); g.moveTo(x + 2, y); g.lineTo(x + 19, y + 2); g.lineTo(x + 19, y + 24); g.lineTo(x + 10, y + 20); g.lineTo(x + 2, y + 24); g.closePath(); g.fill();
      rect(g, x + 9, y + 8, 3, 3, '#c9a227');
    }

    // الأرض
    rect(g, 0, 218, W, 52, '#171016');
    rect(g, 0, 218, W, 2, '#2c202a');
    for (let i = 0; i < 5; i++) {
      g.globalAlpha = 0.08 + 0.03 * Math.sin(t + i);
      disc(g, (i * 113 + t * 6) % 500 - 20, 238 + (i % 3) * 6, 20 + i * 3, '#6a4a44');
    }
    g.globalAlpha = 1;

    // سهام المدافعين
    if (L) {
      const now = performance.now();
      for (const a of L.arrows) {
        const k = clamp((now - a.t0) / (a.life * 1000), 0, 1);
        const x = lerp(a.x0, a.x1, k);
        const y = lerp(a.y0, a.y1, k) - Math.sin(k * Math.PI) * 20;
        g.globalAlpha = 0.85 - k * 0.35;
        line(g, x, y, x + (a.x1 - a.x0) * 0.04, y + 1.2, '#e8dcc0', 1);
        g.globalAlpha = 1;
      }
      // حجر المنجنيق
      for (const st of L.stones) {
        const k = clamp((now - st.t0) / (st.life * 1000), 0, 1);
        const x = lerp(st.x0, st.x1, k);
        const y = lerp(st.y0, st.y1, k) - Math.sin(k * Math.PI) * 54;
        disc(g, x, y, 2.4, '#4a4440');
        glow(g, x, y, 7, 'rgba(255,180,90,.5)', 0.18);
      }

      // الجثث على الأرض
      for (const c of L.corpses || []) {
        const spr = A.art.spr(c.kind, {});
        const s = c.s * 0.95, w = spr.width * s, h = spr.height * s;
        g.save();
        g.translate(c.x, 256);
        g.rotate((c.flip ? -1 : 1) * Math.PI * 0.5);
        g.globalAlpha = 0.4;
        g.drawImage(spr, -w / 2, -h, w, h);
        g.restore();
      }
      g.globalAlpha = 1;

      // المهاجمون
      for (const e of L.enemies) {
        if (e.dieT != null) {
          // يسقط: يميل ثم يختفي، ويترك جثة على الأرض.
          const k = clamp(e.dieT / 0.55, 0, 1);
          const spr = A.art.spr(e.kind, { weapon: 'sword' });
          const s = e.s, w = spr.width * s, h = spr.height * s;
          g.save();
          g.translate(e.x, e.y + Math.sin(k * Math.PI) * -4);
          g.rotate(k * Math.PI * 0.62 * (e.x > 240 ? 1 : -1));
          g.globalAlpha = clamp(1 - Math.max(0, e.dieT - 0.7) * 2.6, 0, 1);
          g.drawImage(spr, -w / 2, -h, w, h);
          g.restore();
          g.globalAlpha = 1;
          continue;
        }
        const bob = Math.sin(t * 8 + e.wob) * 1;
        const flip = e.x > 240;
        const atRing = e.stopX != null && Math.abs(e.x - e.stopX) < 5;
        const pose = atRing ? 'attack' : 'idle';
        A.art.drawSprite(g, A.art.spr(e.kind, { weapon: 'sword', pose: pose }), e.x, e.y + bob, e.s, flip, 1);
      }

      // وابل سهام الجيش — سهام طويلة وواضحة مع ذيل مضيء
      for (const a of L.volley || []) {
        const k = clamp((now - a.t0) / (a.life * 1000), 0, 1);
        const x = lerp(a.x0, a.x1, k);
        const y = lerp(a.y0, a.y1, k) - Math.sin(k * Math.PI) * 6;
        const dx = a.x1 - a.x0, dy = a.y1 - a.y0;
        const len = Math.hypot(dx, dy) || 1;
        const tx = x - (dx / len) * 13;
        const ty = y - (dy / len) * 13;
        g.globalAlpha = 0.95;
        line(g, tx, ty, x, y, '#ffe8b0', 2);
        glow(g, x, y, 5, 'rgba(255,225,160,.55)', 0.22);
        g.globalAlpha = 1;
      }

      // ومضات الدم والغبار عند سقوط الأعداء
      for (const pf of L.puffs || []) {
        const k = clamp((now - pf.t0) / (pf.life * 1000), 0, 1);
        g.globalAlpha = (1 - k) * 0.75;
        disc(g, pf.x, pf.y, 2 + k * 9, '#7a1820');
        disc(g, pf.x, pf.y - 2, 1 + k * 5, '#c9a227');
        g.globalAlpha = 1;
      }

      // أثر ضربة السيف: قوسان على الجانبين
      for (const sl of L.slashes || []) {
        const k = clamp((now - sl.t0) / (sl.life * 1000), 0, 1);
        g.globalAlpha = (1 - k) * 0.9;
        g.strokeStyle = '#f7eccd';
        g.lineWidth = 2;
        g.beginPath();
        g.arc(246, 236, 20 + k * 16, -1.25 + k * 0.6, 1.0 + k * 0.6);
        g.stroke();
        g.beginPath();
        g.arc(234, 234, 22 + k * 14, Math.PI - 0.35 + k * 0.6, Math.PI + 1.5 + k * 0.6);
        g.stroke();
        g.globalAlpha = 1;
      }
    }

    // البطل
    const dawn = L && L.phase === 'dawn';
    const dead = L && L.dead;
    const hop = A.game && A.game.heroOpts ? A.game.heroOpts() : {};
    if (!dead && !dawn) {
      const pose = L && L.atk < 0.16 ? 'attack' : 'idle';
      const bob = Math.sin(t * 2.2) * 0.8;
      g.globalAlpha = 0.35; g.fillStyle = '#000';
      g.beginPath(); g.ellipse(240, 260, 12, 3, 0, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      A.art.drawSprite(g, A.art.spr('hero', { look: hop.look, pose: pose, weapon: 'sword', cloak: true }), 240, 262 + bob, 2.85, false, 1);
    } else if (!dawn) {
      // يسقط البطل مرة واحدة فقط، بزمن حقيقي لا يُصفَّر مع تغيّر الطور.
      const k = clamp((performance.now() - (L.fallAt || performance.now())) / 1450, 0, 1);
      const spr = A.art.spr('hero', { look: hop.look, pose: 'hurt', weapon: 'sword', cloak: true });
      const s = 2.85, w = spr.width * s, h = spr.height * s;
      g.save();
      g.translate(240, 258);
      g.rotate(k * Math.PI * 0.48);
      g.globalAlpha = 0.92;
      g.imageSmoothingEnabled = false;
      g.drawImage(spr, -w / 2, -h + s, w, h);
      g.restore();
      g.globalAlpha = 1;
    }

    // بعد الفجر: سيف مغروس وحيد
    if (L && L.phase === 'dawn') {
      const a = clamp((L.phaseT || 0) / 0.8, 0, 1);
      g.globalAlpha = a;
      glow(g, 240, 232, 32, 'rgba(255,215,150,.55)', 0.5);
      rect(g, 239, 232, 2, 22, '#b8b2a4');
      rect(g, 236, 246, 8, 2, '#8a7a52');
      rect(g, 239, 230, 2, 2, '#e6dfcc');
      // زهرة عند القاعدة
      rect(g, 228, 250, 1, 4, '#4a6a3a');
      rect(g, 226, 247, 5, 3, '#b8616a');
      rect(g, 228, 246, 1, 1, '#e3a0a8');
      g.globalAlpha = 1;
    }
  }

  function drawLastStandOverlay(ctx) {
    const L = C.ls;
    if (!L) return;
    const age = C.age;
    // دخان وزفرات
    for (let i = 0; i < 18; i++) {
      const x = (i * 53 + age * 8) % 500 - 10;
      const y = 190 + ((i * 31 + Math.sin(age * 0.7 + i) * 9) % 66);
      ctx.globalAlpha = 0.1 + 0.06 * Math.sin(age + i);
      rect(ctx, x, y, 1, 1, '#d8b890');
    }
    ctx.globalAlpha = 1;
    // وميض عند سقوط البطل وأشرطة سينمائية رقيقة
    if (L.phase === 'fall') {
      const k = clamp(L.phaseT / 0.35, 0, 1);
      if (k < 1) {
        ctx.globalAlpha = (1 - k) * 0.35;
        ctx.fillStyle = '#e8d8c0';
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    }
    if (L.phase === 'volley') {
      // عتمة مفاجئة تجعل السهام المضيئة تبرز
      const dk = clamp(L.phaseT / 0.5, 0, 1);
      ctx.globalAlpha = 0.22 * dk;
      ctx.fillStyle = '#07040a';
      ctx.fillRect(0, 0, W, H);
      const f = Math.max(0, Math.sin(L.phaseT * 16)) * 0.06;
      ctx.globalAlpha = f;
      ctx.fillStyle = '#f6e8c8';
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (L.phase === 'victory') {
      const k = clamp(L.phaseT / 1.4, 0, 1);
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(255,214,150,' + (0.22 * k) + ')');
      gr.addColorStop(1, 'rgba(255,170,100,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
    if (L.phase === 'dawn') {
      const k = clamp(L.phaseT / 2.2, 0, 1);
      const gr = ctx.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, 'rgba(255,232,190,' + (0.35 * k) + ')');
      gr.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, W, H);
    }
    // إطار داكن خفيف
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#050308';
    ctx.fillRect(0, 0, W, 9);
    ctx.fillRect(0, H - 9, W, 9);
    ctx.globalAlpha = 1;
  }

  // تسجيل المشهدين في محرّك الفن
  if (A.art && A.art.defineScene) {
    A.art.defineScene('memorial', (g, t) => drawMemorial(g, t));
    A.art.defineScene('laststand', (g, t) => drawLastStand(g, t));
  }
})(window.ASH);
