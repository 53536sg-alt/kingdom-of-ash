/* ============================================================
   فن البيكسل — الشخصيات والبورتريهات (مرسومة بالكود)
   ============================================================ */
(function (A) {
  A.art = A.art || {};
  const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const px = (g, x, y, c) => rect(g, x, y, 1, 1, c);
  function disc(g, cx, cy, r, c) {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
    }
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

  // ---------- ذاكرة الأرواح ----------
  const cache = new Map();
  function sprite(key, w, h, fn) {
    if (cache.has(key)) return cache.get(key);
    const cw = w + 2, ch = h + 2;
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    g.translate(1, 1);
    g.imageSmoothingEnabled = false;
    fn(g);
    // إضافة حدّ خارجي داكن (Outline) تلقائي
    try {
      const img = g.getImageData(0, 0, cw, ch);
      const d = img.data;
      const out = new Uint8ClampedArray(d);
      const aAt = (x, y) => (x < 0 || y < 0 || x >= cw || y >= ch ? 0 : d[(y * cw + x) * 4 + 3]);
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          if (d[i + 3] === 0) {
            if (aAt(x - 1, y) > 40 || aAt(x + 1, y) > 40 || aAt(x, y - 1) > 40 || aAt(x, y + 1) > 40) {
              out[i] = 9; out[i + 1] = 6; out[i + 2] = 14; out[i + 3] = 255;
            }
          }
        }
      }
      g.putImageData(new ImageData(out, cw, ch), 0, 0);
    } catch (e) { /* تجاهل */ }
    cache.set(key, c);
    return c;
  }

  A.art.drawSprite = function (ctx, spr, x, y, s, flip, alpha) {
    if (!spr) return;
    s = s || 1;
    const w = spr.width * s, h = spr.height * s;
    const dx = Math.round(x - w / 2);
    const dy = Math.round(y - h + s);
    ctx.save();
    if (alpha != null) ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    if (flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(spr, 0, 0, w, h);
    } else {
      ctx.drawImage(spr, dx, dy, w, h);
    }
    ctx.restore();
  };

  // ---------- لوحات الألوان ----------
  const PAL = {
    hero:      { skin:'#d9a066', skin2:'#b57d4a', hair:'#3b2a26', cloth:'#3c3654', cloth2:'#241f33', leather:'#4a3426', accent:'#c28a45', boot:'#2a1c18', cloak:'#3c2b33', cloak2:'#291b21', eye:'#120c14', metal:'#8d99a8' },
    heroRose:  { skin:'#e2b07c', skin2:'#bb8254', hair:'#6d3527', cloth:'#543a5c', cloth2:'#2f2037', leather:'#4d3328', accent:'#d29a58', boot:'#2a1a1a', cloak:'#422c3c', cloak2:'#291a25', eye:'#1a0f16', metal:'#8d99a8' },
    heroWolf:  { skin:'#c08a5e', skin2:'#96663f', hair:'#4a3f38', cloth:'#3b3a32', cloth2:'#23231d', leather:'#4a3828', accent:'#a08a52', boot:'#221a16', cloak:'#33342c', cloak2:'#1f201a', eye:'#120e12', metal:'#9aa3ad' },
    heroHawk:  { skin:'#d69b6c', skin2:'#ae744a', hair:'#2e2018', cloth:'#3e4a48', cloth2:'#242e2d', leather:'#4a3426', accent:'#b98545', boot:'#241a18', cloak:'#33403c', cloak2:'#1f2724', eye:'#120c12', metal:'#8d99a8' },
    smith:     { skin:'#c98d62', skin2:'#a06a42', hair:'#5e3324', cloth:'#5b3a2a', cloth2:'#2e1d17', leather:'#3a2418', accent:'#d9a441', boot:'#241713', cloak:'#3b241f', cloak2:'#291712', eye:'#150d10', metal:'#a7b0bd' },
    herbalist: { skin:'#d3a077', skin2:'#aa7750', hair:'#4b3a2c', cloth:'#3f5a44', cloth2:'#26382b', leather:'#3a2e22', accent:'#88b07a', boot:'#241a16', cloak:'#2c3f33', cloak2:'#1d2b22', eye:'#141014', metal:'#8a9a7e' },
    zainab:    { skin:'#efc7a0', skin2:'#d2a277', hair:'#221416', cloth:'#b0617a', cloth2:'#7a3a50', leather:'#6b4a36', accent:'#e6c07a', scarf:'#f4efe4', scarf2:'#d8d0c0', boot:'#2a1c1e', cloak:'#8a4a60', cloak2:'#5e2e40', eye:'#0b0609', metal:'#8d99a8' },
    donorLady: { skin:'#d8a67e', skin2:'#b17c55', hair:'#3a2a26', cloth:'#6a5a38', cloth2:'#40311d', leather:'#4a3826', accent:'#c9a227', scarf:'#e9dfc6', scarf2:'#c9bda0', boot:'#2a1c1e', cloak:'#5a4a32', cloak2:'#382d1e', eye:'#140f0e', metal:'#8d99a8' },
    mari:      { skin:'#d9a077', skin2:'#b57a52', hair:'#3a241c', cloth:'#6a3f4a', cloth2:'#452733', leather:'#5a3a2a', accent:'#e0b46a', scarf:'#3f6b66', scarf2:'#2b4b48', boot:'#2a1a1a', cloak:'#54424a', cloak2:'#35262e', eye:'#1a1012', metal:'#8d99a8' },
    lana:     { skin:'#c88f66', skin2:'#a06a44', hair:'#2e1d17', cloth:'#3f4a35', cloth2:'#242c1e', leather:'#5a4030', accent:'#b98a45', boot:'#241a14', cloak:'#33402e', cloak2:'#20281c', eye:'#140e10', metal:'#8a9a7e' },
    sidra:     { skin:'#d7a27a', skin2:'#b17c55', hair:'#2a2020', cloth:'#3a4a62', cloth2:'#222c3c', leather:'#5a4232', accent:'#e0b45a', scarf:'#4a5a72', scarf2:'#33404f', boot:'#20202a', cloak:'#2f3a4a', cloak2:'#1c232c', eye:'#141018', metal:'#9aa3ad' },
    mason:     { skin:'#c08a5e', skin2:'#96663f', hair:'#8a8378', cloth:'#4a4038', cloth2:'#2c2621', leather:'#4a3828', accent:'#b8a06a', boot:'#241c16', cloak:'#36302a', cloak2:'#241f1b', eye:'#120e12', metal:'#9aa3ad' },
    hunter:    { skin:'#c99163', skin2:'#9d6a40', hair:'#3f2c1f', cloth:'#4a4230', cloth2:'#2a2418', leather:'#5a4030', accent:'#9c7b3a', boot:'#231a12', cloak:'#3a3524', cloak2:'#272316', eye:'#130e10', metal:'#8f9a8a' },
    mustafa:   { skin:'#8a5530', skin2:'#5c3518', hair:'#140c08', cloth:'#5a4a34', cloth2:'#332a1e', leather:'#4a3a26', accent:'#d8c8a4', boot:'#1e1712', cloak:'#3e362a', cloak2:'#262019', eye:'#0d0908', metal:'#8a8a82' },
    hassan:    { skin:'#c08a5e', skin2:'#96663f', hair:'#4a3a2a', cloth:'#443a34', cloth2:'#28221e', leather:'#4e3c2c', accent:'#9a7e4a', boot:'#221a16', cloak:'#38302a', cloak2:'#241e1a', eye:'#120e0c', metal:'#8f9490' },
    farmer:    { skin:'#c49a72', skin2:'#9a724e', hair:'#e8e2d4', cloth:'#5a4e3a', cloth2:'#332c20', leather:'#4a3826', accent:'#b09a62', boot:'#241c16', cloak:'#4a4132', cloak2:'#2e2820', eye:'#130f0c', metal:'#9aa08a' },
    captain:   { skin:'#cf9569', skin2:'#a5734a', hair:'#4a3020', cloth:'#2e3c5c', cloth2:'#1c253a', leather:'#3a2c22', accent:'#c9a227', boot:'#221a18', cloak:'#2b3550', cloak2:'#1b2234', eye:'#121014', metal:'#aab4c2' },
    wizard:    { skin:'#c9a98a', skin2:'#9c7f66', hair:'#9a9aa8', cloth:'#3a2e58', cloth2:'#241b3a', leather:'#3a2c48', accent:'#7f6ad1', boot:'#1e1830', cloak:'#2e2450', cloak2:'#1d1736', eye:'#c9b6ff', metal:'#b9a7ff' },
    soldier:   { skin:'#b98a62', skin2:'#8f6440', hair:'#2a211c', cloth:'#2a2a33', cloth2:'#17171e', leather:'#33261e', accent:'#7a1f26', boot:'#191314', cloak:'#232329', cloak2:'#151519', eye:'#0f0d12', metal:'#6e7681' },
    // جندي الاحتلال: درعٌ داكن وشارة قرمزية — يُرى فورًا في المدينة المحتلّة.
    enemy:     { skin:'#b98a62', skin2:'#8f6440', hair:'#1a1111', cloth:'#2a1218', cloth2:'#160a0e', leather:'#3a2018', accent:'#a3202c', boot:'#120a0c', cloak:'#241016', cloak2:'#15080c', eye:'#e0574f', metal:'#5b545c' },
    bandit:    { skin:'#b98a62', skin2:'#8f6440', hair:'#2e2118', cloth:'#4a3a2a', cloth2:'#2a2018', leather:'#5a4030', accent:'#8a3a2a', boot:'#1c1512', cloak:'#33241c', cloak2:'#211711', eye:'#0f0d12', metal:'#7a8088' },
    champion:  { skin:'#a87a55', skin2:'#7e5639', hair:'#2a1a18', cloth:'#241f2b', cloth2:'#121017', leather:'#2e2020', accent:'#9e1f2a', boot:'#121014', cloak:'#1b1820', cloak2:'#0e0c12', eye:'#e0574f', metal:'#4a4650' },
    king:      { skin:'#d8b08a', skin2:'#b4865e', hair:'#d8d0c0', cloth:'#3a1a40', cloth2:'#24102a', leather:'#4a3020', accent:'#e6bf58', boot:'#1e1418', cloak:'#4a1a30', cloak2:'#2e1020', eye:'#1a0f16', metal:'#e0c070' },
    statue:    { skin:'#9a958a', skin2:'#777368', hair:'#6d6a62', cloth:'#8a857a', cloth2:'#6f6b62', leather:'#625e56', accent:'#b8ac86', boot:'#5c5851', cloak:'#7d786e', cloak2:'#635f57', eye:'#4a4740', metal:'#b9b3a4' },
    jinnFire:  { skin:'#e8703a', skin2:'#b8492a', hair:'#ffb347', cloth:'#7a2318', cloth2:'#4a120c', accent:'#ffb347', glow:'#ffd27a', eye:'#ffe9b0' },
    jinnMist:  { skin:'#b79ad6', skin2:'#8a6cae', hair:'#e0c8ff', cloth:'#3a2a5a', cloth2:'#241a3d', accent:'#d6b4ff', glow:'#e8d4ff', eye:'#f4eaff' },
    jinnFrost: { skin:'#a8cfe0', skin2:'#7ba8bd', hair:'#dff6ff', cloth:'#2a4a5a', cloth2:'#182e3d', accent:'#bfe9ff', glow:'#dff6ff', eye:'#effcff' },
    child:     { skin:'#b9e0d8', skin2:'#8fbcb2', hair:'#2a3f3d', cloth:'#3a5a55', cloth2:'#243a36', accent:'#bff5ea', glow:'#a8ffe8', eye:'#e8fff9' },
    // أطفال دير النار بعد الحرب: ألوان ترابية دافئة.
    childBoy:  { skin:'#d8a878', skin2:'#b07c50', hair:'#3a2418', cloth:'#4e5e3e', cloth2:'#2e3826', leather:'#5a4030', accent:'#c8a24a', boot:'#2a1c14', eye:'#140e10', metal:'#8a9a7e' },
    childGirl: { skin:'#e0b28a', skin2:'#b8845c', hair:'#2e1d17', cloth:'#8a4a56', cloth2:'#5a2c38', leather:'#5a4030', accent:'#e2c07a', boot:'#2a1c1e', eye:'#140e10', metal:'#8a9a7e' },
  };

  // ---------- أشكال اللاعب ----------
  const LOOKS = [
    { id: 'ash',  name: 'شابٌّ من دير النار', pal: 'hero',     o: {}, bust: { hair: 'short', scar: true } },
    { id: 'rose', name: 'فتاةٌ من دير النار', pal: 'heroRose', o: { female: true, longHair: true, skirt: true, earring: true }, bust: { hair: 'long', female: true } },
    { id: 'wolf', name: 'محاربٌ مشرّد', pal: 'heroWolf', o: { beard: true, scar: true }, bust: { hair: 'short', beard: true, scar: true } },
    { id: 'hawk', name: 'محاربةٌ مشرّدة', pal: 'heroHawk', o: { female: true, braid: true, shortHair: true, scar: true, skirt: true, earring: true }, bust: { hair: 'braid', female: true, scar: true } },
  ];
  A.art.LOOKS = LOOKS;
  A.art.look = function (i) {
    const n = Math.max(0, Math.min(LOOKS.length - 1, (i | 0) || 0));
    return LOOKS[n];
  };
  A.art.lookInfo = function (i) {
    const n = Math.max(0, Math.min(LOOKS.length - 1, (i | 0) || 0));
    return { index: n, female: !!LOOKS[n].o.female, name: LOOKS[n].name, id: LOOKS[n].id };
  };

  // ---------- إنسان ----------
  function humanoid(g, p, o) {
    o = o || {};
    const pose = o.pose || 'idle';
    const attack = pose === 'attack', hurt = pose === 'hurt', walk = pose === 'walk', cast = pose === 'cast';
    const dy = hurt ? 1 : 0;
    const eye = p.eye || '#120c14';
    const fem = !!o.female;

    // عباءة خلفية
    if (o.cloak !== false && p.cloak) {
      if (fem) {
        rect(g, 4, 10 + dy, 8, 9, p.cloak);
        rect(g, 3, 19 + dy, 10, 2, p.cloak);
        rect(g, 4, 10 + dy, 1, 9, p.cloak2 || p.cloth2);
        rect(g, 11, 10 + dy, 1, 9, p.cloak2 || p.cloth2);
      } else {
        rect(g, 3, 10 + dy, 10, 10, p.cloak);
        rect(g, 4, 20 + dy, 8, 2, p.cloak);
        rect(g, 3, 10 + dy, 1, 10, p.cloak2 || p.cloth2);
        rect(g, 12, 10 + dy, 1, 10, p.cloak2 || p.cloth2);
      }
    }

    // ساقان
    const l1 = walk ? 1 : 0;
    rect(g, 5, 17 + dy - l1, 2, 5, p.cloth2);
    rect(g, 9, 17 + dy + l1, 2, 5, p.cloth2);
    rect(g, 4, 22 + dy - l1, 4, 2, p.boot);
    rect(g, 9, 22 + dy + l1, 4, 2, p.boot);
    px(g, 7, 21 + dy - l1, p.leather); px(g, 9, 21 + dy + l1, p.leather);

    // جذع
    if (fem) {
      rect(g, 5, 10 + dy, 6, 6, p.cloth);
      rect(g, 5, 10 + dy, 6, 1, p.cloth);
      rect(g, 4, 10 + dy, 1, 3, p.cloth2);
      rect(g, 11, 10 + dy, 1, 3, p.cloth2);
      rect(g, 4, 13 + dy, 1, 3, p.cloth);
      rect(g, 11, 13 + dy, 1, 3, p.cloth);
      px(g, 6, 12 + dy, p.cloth2); px(g, 9, 12 + dy, p.cloth2);
    } else {
      rect(g, 4, 10 + dy, 8, 6, p.cloth);
      rect(g, 4, 10 + dy, 8, 1, p.cloth);
      rect(g, 4, 10 + dy, 1, 6, p.cloth2);
      rect(g, 11, 10 + dy, 1, 6, p.cloth2);
    }
    // حزام
    rect(g, 4, 15 + dy, 8, 2, p.leather || p.cloth2);
    px(g, 7, 15 + dy, p.accent); px(g, 8, 15 + dy, p.accent);
    // قميص/زينة صدر
    if (o.trim !== false) {
      if (fem) {
        px(g, 7, 11 + dy, p.accent); px(g, 8, 11 + dy, p.accent);
      } else {
        px(g, 6, 11 + dy, p.accent); px(g, 6, 12 + dy, p.accent);
        px(g, 9, 11 + dy, p.accent);
      }
    }
    if (fem && o.skirt) {
      // تنّورة واسعة تكسر صورة الجسد المستطيل
      rect(g, 4, 17 + dy, 8, 3, p.cloth2 || p.cloth);
      rect(g, 3, 20 + dy, 10, 2, p.cloth2 || p.cloth);
      rect(g, 3, 22 + dy, 10, 1, p.cloth || p.cloth2);
      rect(g, 6, 18 + dy, 4, 4, p.cloth);
      px(g, 5, 22 + dy, p.accent); px(g, 8, 22 + dy, p.accent);
    }
    if (fem && o.shawl) {
      const sc = p.scarf || p.accent, sc2 = p.scarf2 || p.cloth2;
      // شال ينسدل على الكتفين فوق الثوب
      rect(g, 4, 10 + dy, 8, 3, sc);
      rect(g, 4, 10 + dy, 8, 1, p.accent);
      rect(g, 3, 12 + dy, 2, 6, sc2);
      rect(g, 11, 12 + dy, 2, 6, sc2);
      px(g, 7, 12 + dy, p.accent);
    }
    if (o.apron) rect(g, 5, 12 + dy, 6, 6, p.leather || '#4a3426');
    if (o.satchel) {
      rect(g, 3, 13 + dy, 2, 4, p.leather || '#4a3426');
      rect(g, 3, 13 + dy, 2, 1, p.accent);
      px(g, 4, 12 + dy, p.accent);
    }
    if (o.tabard) { rect(g, 5, 12 + dy, 6, 7, p.accent); rect(g, 7, 13 + dy, 2, 3, p.cloth2); }

    // ذراع خلفي
    rect(g, 2, 11 + dy, 2, 5, p.cloth2);
    rect(g, 2, 15 + dy, 2, 2, p.skin2);

    // ذراع أمامي + يد
    if (attack) {
      rect(g, 11, 11 + dy, 2, 3, p.cloth2);
      rect(g, 12, 9 + dy, 2, 2, p.skin);
      rect(g, 13, 8 + dy, 2, 2, p.skin);
    } else if (cast) {
      rect(g, 12, 10 + dy, 2, 3, p.cloth2);
      rect(g, 13, 8 + dy, 2, 2, p.skin);
    } else if (o.guard) {
      rect(g, 11, 11 + dy, 2, 4, p.cloth2);
      rect(g, 12, 15 + dy, 2, 2, p.skin);
    } else {
      rect(g, 12, 11 + dy, 2, 5, p.cloth2);
      rect(g, 12, 15 + dy, 2, 2, p.skin);
    }

    // رأس
    if (o.helm) {
      rect(g, 5, 1 + dy, 6, 4, p.metal);
      rect(g, 4, 3 + dy, 1, 3, p.metal);
      rect(g, 11, 3 + dy, 1, 3, p.metal);
      rect(g, 7, 4 + dy, 2, 3, p.metal);
      rect(g, 5, 1 + dy, 4, 1, '#cfd8e3');
      if (o.plume) { rect(g, 7, -2 + dy, 2, 3, o.plume); rect(g, 6, 0 + dy, 2, 1, o.plume); }
      rect(g, 5, 4 + dy, 2, 2, p.skin2); rect(g, 9, 4 + dy, 2, 2, p.skin2);
    } else if (o.hood) {
      rect(g, 4, 1 + dy, 8, 4, p.cloth);
      rect(g, 3, 3 + dy, 2, 6, p.cloth2);
      rect(g, 11, 3 + dy, 2, 6, p.cloth2);
      rect(g, 5, 4 + dy, 6, 4, p.skin);
      rect(g, 5, 1 + dy, 6, 1, p.cloth2);
      if (o.female) {
        rect(g, 3, 7 + dy, 1, 5, p.hair);
        rect(g, 12, 7 + dy, 1, 5, p.hair);
      }
    } else if (o.hijab) {
      const sc = p.scarf || p.accent, sc2 = p.scarf2 || p.cloth2;
      // حجاب يغطي الشعر والجانبين ويترك الوجه
      rect(g, 4, 0 + dy, 8, 4, sc);
      rect(g, 3, 3 + dy, 2, 8, sc);
      rect(g, 11, 3 + dy, 2, 8, sc);
      rect(g, 5, 1 + dy, 6, 1, p.accent);
      rect(g, 4, 3 + dy, 1, 1, sc2);
      rect(g, 11, 3 + dy, 1, 1, sc2);
      // وجه داخل الحجاب
      rect(g, 5, 4 + dy, 6, 4, p.skin);
      rect(g, 6, 8 + dy, 4, 1, p.skin2);
      // طرف الحجاب على الكتف
      rect(g, 4, 10 + dy, 1, 3, sc2);
      rect(g, 11, 10 + dy, 1, 3, sc2);
      px(g, 10, 2 + dy, p.accent);
    } else if (o.wrap) {
      rect(g, 4, 1 + dy, 8, 4, p.accent);
      rect(g, 3, 3 + dy, 1, 6, p.accent);
      rect(g, 12, 3 + dy, 1, 6, p.accent);
      rect(g, 5, 4 + dy, 6, 4, p.skin);
      rect(g, 5, 1 + dy, 6, 1, p.cloth2 || p.accent);
      px(g, 10, 2 + dy, p.accent);
      if (o.female) {
        rect(g, 4, 8 + dy, 1, 5, p.hair);
        rect(g, 11, 8 + dy, 1, 5, p.hair);
      }
    } else {
      rect(g, 5, 1 + dy, 6, 3, p.hair);
      rect(g, 4, 3 + dy, 1, 3, p.hair);
      rect(g, 11, 3 + dy, 1, 3, p.hair);
      if (o.longHair || (o.female && !o.shortHair)) {
        rect(g, 3, 4 + dy, 1, 7, p.hair);
        rect(g, 12, 4 + dy, 1, 7, p.hair);
        rect(g, 2, 7 + dy, 1, 3, p.hair);
      }
      if (o.braid) {
        rect(g, 12, 5 + dy, 1, 3, p.hair);
        rect(g, 13, 8 + dy, 1, 3, p.hair);
        px(g, 13, 11 + dy, p.accent);
      }
      rect(g, 5, 4 + dy, 6, 4, p.skin);
      rect(g, 6, 8 + dy, 4, 1, p.skin2);
      if (o.beard) {
        rect(g, 6, 8 + dy, 4, 2, p.hair);
        if (o.longBeard) {
          // لحية شيخ طويلة تنسدل على الصدر
          rect(g, 5, 10 + dy, 6, 2, p.hair);
          rect(g, 6, 12 + dy, 4, 2, p.hair);
          rect(g, 7, 14 + dy, 2, 2, p.hair);
        }
      }
      if (o.crown) {
        rect(g, 5, 0 + dy, 6, 1, p.accent);
        px(g, 5, -1 + dy, p.accent); px(g, 7, -2 + dy, p.accent); px(g, 9, -1 + dy, p.accent); px(g, 10, -1 + dy, p.accent);
      }
      if (o.horns) {
        line(g, 4, 2 + dy, 2, 0 + dy, '#d8cbb2');
        line(g, 11, 2 + dy, 13, 0 + dy, '#d8cbb2');
      }
    }

    // لحية الشيخ تحت غطاء الرأس: فرع الغطاء (wrap) يحجب اللحية العادية،
    // فنرسمها هنا للفلاح العجوز حتى تظهر بيضاء على صدره.
    if (o.longBeard && o.wrap) {
      rect(g, 6, 8 + dy, 4, 2, p.hair);
      rect(g, 5, 10 + dy, 6, 2, p.hair);
      rect(g, 6, 12 + dy, 4, 2, p.hair);
      rect(g, 7, 14 + dy, 2, 2, p.hair);
      rect(g, 7, 8 + dy, 2, 1, '#c9c1ae');
    }

    // عيون
    if (o.glowEyes) {
      g.globalAlpha = 0.28; disc(g, 6, 6 + dy, 2, p.glow || p.accent); disc(g, 10, 6 + dy, 2, p.glow || p.accent); g.globalAlpha = 1;
      rect(g, 6, 6 + dy, 2, 1, p.eye);
      rect(g, 9, 6 + dy, 2, 1, p.eye);
    } else {
      px(g, 6, 6 + dy, eye); px(g, 7, 6 + dy, eye);
      px(g, 9, 6 + dy, eye); px(g, 10, 6 + dy, eye);
    }
    if (o.female) {
      // رموش وشفتان
      px(g, 7, 5 + dy, eye); px(g, 10, 5 + dy, eye);
      px(g, 7, 8 + dy, '#a85a52'); px(g, 8, 8 + dy, '#a85a52');
      px(g, 8, 8 + dy, '#c97a70');
      if (o.beauty) {
        // حواجب مقوّسة وعيون سوداء
        px(g, 5, 4 + dy, p.hair); px(g, 6, 4 + dy, p.hair);
        px(g, 9, 4 + dy, p.hair); px(g, 10, 4 + dy, p.hair);
        px(g, 6, 6 + dy, '#000000'); px(g, 7, 6 + dy, '#000000');
        px(g, 9, 6 + dy, '#000000'); px(g, 10, 6 + dy, '#000000');
        px(g, 6, 5 + dy, p.hair); px(g, 9, 5 + dy, p.hair);
        // شفاه وردية ممتلئة
        px(g, 7, 8 + dy, '#c95f72'); px(g, 8, 8 + dy, '#e08a96');
      }
      if (o.earring) { px(g, 4, 8 + dy, p.accent); px(g, 11, 8 + dy, p.accent); }
    }
    if (o.scar) line(g, 8, 4 + dy, 10, 8 + dy, p.skin2);

    // درع
    if (o.guard) {
      rect(g, 11, 10 + dy, 3, 5, p.metal);
      rect(g, 11, 10 + dy, 3, 1, '#cfd8e3');
      px(g, 12, 12 + dy, p.accent);
      rect(g, 12, 15 + dy, 1, 1, p.metal);
    }

    // سلاح
    const wp = o.weapon;
    if (wp === 'sword') {
      if (attack) {
        line(g, 13, 14 + dy, 16, 3 + dy, '#d7e0ec', 2);
        line(g, 13, 14 + dy, 15, 8 + dy, '#8d99a8', 1);
        rect(g, 12, 14 + dy, 3, 1, p.accent);
      } else {
        rect(g, 13, 6 + dy, 2, 8, '#cfd8e3');
        rect(g, 13, 6 + dy, 1, 8, '#eef3f9');
        rect(g, 12, 13 + dy, 4, 1, p.accent);
        rect(g, 13, 14 + dy, 1, 2, '#5a3a22');
      }
    } else if (wp === 'bow') {
      const bx = 14, by = 5 + dy;
      if (attack) {
        rect(g, bx - 2, by + 2, 1, 1, '#6b4a2f'); rect(g, bx - 3, by + 4, 1, 4, '#6b4a2f');
        rect(g, bx - 2, by + 9, 1, 1, '#6b4a2f');
        line(g, bx - 2, by + 3, bx - 2, by + 9, '#d8cbb2');
        line(g, bx - 3, by + 4, bx - 9, by + 6, '#cfd8e3');
      } else {
        rect(g, bx, by + 1, 1, 8, '#6b4a2f');
        rect(g, bx - 1, by, 1, 2, '#6b4a2f');
        rect(g, bx - 1, by + 9, 1, 2, '#6b4a2f');
        line(g, bx - 1, by + 2, bx - 1, by + 9, '#d8cbb2');
      }
    } else if (wp === 'staff') {
      rect(g, 13, 4 + dy, 2, 14, '#4a3426');
      rect(g, 13, 4 + dy, 1, 14, '#6b4a2f');
      g.globalAlpha = 0.3; disc(g, 14, 3 + dy, 3, p.accent); g.globalAlpha = 1;
      disc(g, 14, 3 + dy, 1, p.accent);
      disc(g, 14, 3 + dy, 1, '#fff6d8');
    } else if (wp === 'spear') {
      rect(g, 13, 2 + dy, 1, 16, '#5a3a22');
      rect(g, 12, 0 + dy, 3, 2, '#cfd8e3');
      rect(g, 13, -1 + dy, 1, 1, '#eef3f9');
    } else if (wp === 'pick') {
      rect(g, 13, 7 + dy, 1, 10, '#5a3a22');
      line(g, 11, 8 + dy, 15, 6 + dy, '#9aa3ad', 2);
      rect(g, 15, 5 + dy, 1, 1, '#cfd8e3');
    } else if (wp === 'hammer') {
      rect(g, 13, 9 + dy, 1, 8, '#5a3a22');
      rect(g, 11, 6 + dy, 5, 3, '#8d99a8');
      rect(g, 11, 6 + dy, 5, 1, '#cfd8e3');
    }
  }

  // ---------- ذئب ----------
  function wolf(g, c, o) {
    const p = c || {};
    const body = p.body || '#5a5360', dark = p.dark || '#39333f', light = p.light || '#7d7585', belly = p.belly || '#948a98';
    const corpse = o && o.corpse;
    if (corpse) {
      rect(g, 2, 9, 12, 3, body);
      rect(g, 2, 9, 12, 1, dark);
      rect(g, 12, 7, 4, 3, body);
      rect(g, 14, 8, 2, 1, dark);
      return;
    }
    // ذيل
    rect(g, 1, 6, 3, 2, body);
    rect(g, 0, 4, 2, 3, body);
    px(g, 0, 3, dark);
    // جسم
    rect(g, 3, 6, 9, 5, body);
    rect(g, 3, 6, 9, 2, light);
    rect(g, 3, 10, 9, 1, dark);
    rect(g, 4, 9, 7, 1, belly);
    // رقبة ورأس
    rect(g, 10, 4, 3, 5, body);
    rect(g, 12, 4, 4, 4, body);
    rect(g, 12, 4, 4, 1, light);
    rect(g, 15, 6, 2, 2, dark);
    // آذان
    rect(g, 12, 2, 1, 2, dark); rect(g, 14, 2, 1, 2, dark);
    px(g, 12, 2, body); px(g, 14, 2, body);
    // أرجل
    rect(g, 4, 11, 2, 3, dark); rect(g, 6, 12, 2, 2, body);
    rect(g, 9, 11, 2, 3, dark); rect(g, 11, 12, 2, 2, body);
    // عين
    if (p.eye) { px(g, 13, 5, p.eye); g.globalAlpha = .3; px(g, 13, 4, p.eye); g.globalAlpha = 1; }
  }

  // ---------- هيكل ----------
  function skeleton(g, o) {
    const bone = '#cfc6ae', bone2 = '#9a927e', dark = '#4a463c';
    // جمجمة
    rect(g, 5, 2, 6, 6, bone);
    rect(g, 4, 4, 1, 3, bone);
    rect(g, 11, 4, 1, 3, bone);
    rect(g, 5, 2, 4, 1, '#e4dcc4');
    rect(g, 6, 5, 2, 2, '#141018'); rect(g, 9, 5, 1, 2, '#141018');
    rect(g, 6, 8, 4, 1, bone2);
    px(g, 7, 7, dark); px(g, 9, 7, dark);
    // عنق وعمود
    rect(g, 7, 9, 1, 8, bone2);
    // أضلاع
    rect(g, 5, 10, 5, 1, bone); rect(g, 5, 12, 5, 1, bone); rect(g, 5, 14, 4, 1, bone);
    rect(g, 5, 10, 1, 6, bone2);
    // حوض
    rect(g, 5, 16, 5, 2, bone); rect(g, 5, 18, 2, 1, bone); rect(g, 8, 18, 2, 1, bone);
    // ساقان
    rect(g, 5, 19, 1, 4, bone2); rect(g, 9, 19, 1, 4, bone2);
    rect(g, 4, 23, 3, 1, bone); rect(g, 8, 23, 3, 1, bone);
    // ذراع وسيف
    rect(g, 3, 11, 1, 4, bone2); rect(g, 2, 15, 2, 1, bone);
    line(g, 12, 8, 15, 15, '#8d99a8', 1);
    rect(g, 11, 8, 2, 1, '#5a3a22');
    // قماش ممزق
    if (!o || o.cloth !== false) { rect(g, 4, 12, 6, 4, '#3a2a30'); rect(g, 5, 16, 1, 3, '#3a2a30'); rect(g, 8, 16, 1, 2, '#3a2a30'); }
  }

  // ---------- شبح ----------
  function wraith(g, t, p) {
    p = p || {};
    const cloth = p.cloth || '#2a2340', dark = p.dark || '#171227', glow = p.glow || '#8fd4ff';
    const bob = Math.sin(t * 1.6) > 0 ? 0 : 1;
    // عباءة
    rect(g, 4, 4 + bob, 8, 3, cloth);
    rect(g, 3, 7 + bob, 10, 9, cloth);
    rect(g, 2, 12 + bob, 12, 7, cloth);
    rect(g, 2, 12 + bob, 1, 7, dark);
    rect(g, 13, 12 + bob, 1, 7, dark);
    // أهداب متحركة
    for (let i = 0; i < 7; i++) {
      const h = 2 + ((i * 3 + Math.floor(t * 4)) % 4);
      rect(g, 2 + i * 2, 19 + bob, 1, h, i % 2 ? cloth : dark);
    }
    // قلنسوة
    rect(g, 4, 1 + bob, 8, 3, dark);
    rect(g, 4, 4 + bob, 1, 5, dark); rect(g, 11, 4 + bob, 1, 5, dark);
    rect(g, 5, 4 + bob, 6, 4, '#0c0913');
    // عيون
    g.globalAlpha = 0.3; disc(g, 6, 6 + bob, 2, glow); disc(g, 10, 6 + bob, 2, glow); g.globalAlpha = 1;
    rect(g, 6, 6 + bob, 2, 1, glow); rect(g, 9, 6 + bob, 2, 1, glow);
    // أيدي
    rect(g, 1, 11 + bob, 2, 4, '#b9b0a0');
    rect(g, 13, 11 + bob, 2, 4, '#b9b0a0');
    px(g, 1, 15 + bob, '#8f887a'); px(g, 14, 15 + bob, '#8f887a');
    // خصلات سفلية
    g.globalAlpha = 0.75;
  }

  // ---------- خفاش ----------
  function bat(g, t) {
    const flap = Math.sin(t * 9) > 0 ? 1 : 0;
    const body = '#4a3548', wing = '#332436', eye = '#e0574f';
    rect(g, 7, 3, 2, 5, body);
    rect(g, 6, 2, 4, 1, body);
    rect(g, 7, 1, 1, 1, wing); rect(g, 9, 1, 1, 1, wing);
    // أجنحة
    if (flap) {
      rect(g, 1, 4, 6, 2, wing); rect(g, 0, 5, 2, 2, wing);
      rect(g, 9, 4, 6, 2, wing); rect(g, 14, 5, 2, 2, wing);
      px(g, 2, 3, wing); px(g, 13, 3, wing);
    } else {
      rect(g, 1, 2, 5, 5, wing);
      rect(g, 10, 2, 5, 5, wing);
      rect(g, 0, 3, 1, 2, wing); rect(g, 15, 3, 1, 2, wing);
    }
    px(g, 7, 4, eye); px(g, 9, 4, eye);
    rect(g, 6, 8, 4, 1, body);
  }

  // ---------- عفريت المنجم ----------
  function imp(g, t, o) {
    const skin = '#7a8a52', skin2 = '#55613a', cloth = '#3a2a22', horn = '#d8cbb2', eye = '#f0d060';
    rect(g, 4, 4, 4, 4, skin);
    rect(g, 4, 4, 4, 1, '#93a365');
    rect(g, 2, 2, 2, 2, horn); px(g, 2, 1, horn);
    rect(g, 8, 2, 2, 2, horn); px(g, 8, 1, horn);
    rect(g, 5, 6, 1, 1, eye); rect(g, 7, 6, 1, 1, eye);
    // جسم
    rect(g, 3, 8, 6, 5, cloth);
    rect(g, 4, 9, 4, 3, skin2);
    // ذراعان
    rect(g, 1, 9, 2, 3, skin); rect(g, 2, 12, 2, 1, skin);
    rect(g, 9, 9, 2, 3, skin);
    // ساقان
    rect(g, 4, 13, 2, 4, skin2); rect(g, 7, 13, 2, 4, skin2);
    rect(g, 3, 17, 3, 1, '#2a1c14'); rect(g, 7, 17, 3, 1, '#2a1c14');
    // معول
    rect(g, 10, 6, 1, 8, '#5a3a22');
    line(g, 8, 6, 12, 4, '#9aa3ad', 1);
    // عيون متوهجة
    g.globalAlpha = .25; rect(g, 4, 5, 5, 2, eye); g.globalAlpha = 1;
  }

  // ---------- جني ----------
  function jinn(g, p, kind, t) {
    const float = Math.sin(t * 1.3 + (kind === 'mist' ? 2 : kind === 'frost' ? 4 : 0)) > 0 ? 0 : 1;
    const y = float;
    const glow = p.glow || p.accent;
    // هالة
    g.globalAlpha = 0.10;
    disc(g, 11, 18 + y, 14, glow);
    g.globalAlpha = 1;
    // ذيل دخان/لهب
    for (let i = 0; i < 6; i++) {
      const h = 4 + ((i * 5 + Math.floor(t * 5)) % 5);
      rect(g, 5 + i * 2, 30 + y - h, 2, h, i % 2 ? p.cloth : p.cloth2);
    }
    // عباءة
    rect(g, 5, 13 + y, 12, 12, p.cloth);
    rect(g, 4, 18 + y, 14, 7, p.cloth);
    rect(g, 6, 25 + y, 10, 5, p.cloth2);
    rect(g, 5, 13 + y, 1, 15, p.cloth2);
    rect(g, 16, 13 + y, 1, 15, p.cloth2);
    // نقوش
    rect(g, 11, 15 + y, 1, 6, p.accent);
    rect(g, 8, 18 + y, 1, 1, p.accent); rect(g, 13, 18 + y, 1, 1, p.accent);
    rect(g, 8, 21 + y, 1, 1, p.accent); rect(g, 13, 21 + y, 1, 1, p.accent);
    // كتفان
    rect(g, 3, 13 + y, 3, 3, p.accent);
    rect(g, 16, 13 + y, 3, 3, p.accent);
    // ذراعان
    rect(g, 1, 15 + y, 3, 5, p.skin);
    rect(g, 18, 15 + y, 3, 5, p.skin);
    rect(g, 0, 19 + y, 2, 2, p.skin2);
    rect(g, 20, 19 + y, 2, 2, p.skin2);
    // رأس
    rect(g, 7, 5 + y, 8, 8, p.skin);
    rect(g, 7, 5 + y, 8, 2, p.skin);
    rect(g, 7, 11 + y, 8, 2, p.skin2);
    rect(g, 8, 3 + y, 6, 2, p.hair);
    // قرون/تاج
    if (kind === 'fire') {
      line(g, 7, 3 + y, 5, 0 + y, p.accent); line(g, 15, 3 + y, 17, 0 + y, p.accent);
      rect(g, 8, 2 + y, 6, 1, p.accent);
      px(g, 10, 1 + y, p.accent); px(g, 12, 0 + y, p.accent);
    } else if (kind === 'mist') {
      // تاج ملكة الضباب وطرحة تنساب على الكتفين
      rect(g, 6, 2 + y, 10, 2, p.accent);
      rect(g, 7, 1 + y, 8, 1, p.accent);
      px(g, 7, 0 + y, p.accent); px(g, 11, -1 + y, '#f4eaff'); px(g, 15, 0 + y, p.accent);
      g.globalAlpha = 0.7;
      rect(g, 4, 5 + y, 2, 15, p.accent);
      rect(g, 16, 5 + y, 2, 16, p.accent);
      rect(g, 3, 17 + y, 3, 4, p.accent);
      rect(g, 16, 18 + y, 3, 4, p.accent);
      g.globalAlpha = 1;
    } else {
      rect(g, 7, 2 + y, 8, 1, p.accent);
      line(g, 6, 3 + y, 4, 0 + y, p.accent); line(g, 16, 3 + y, 18, 0 + y, p.accent);
      px(g, 9, 1 + y, '#eefbff'); px(g, 13, 1 + y, '#eefbff');
    }
    // عيون
    g.globalAlpha = 0.32; disc(g, 9, 8 + y, 2, glow); disc(g, 13, 8 + y, 2, glow); g.globalAlpha = 1;
    rect(g, 9, 8 + y, 2, 1, p.eye || glow);
    rect(g, 12, 8 + y, 2, 1, p.eye || glow);
    if (kind === 'mist') {
      // عيون إضافية
      px(g, 10, 10 + y, glow); px(g, 12, 10 + y, glow);
      // رموش
      px(g, 8, 7 + y, glow); px(g, 14, 7 + y, glow);
    }
    // فم
    if (kind === 'mist') rect(g, 10, 11 + y, 3, 1, '#c97a70');
    else rect(g, 10, 11 + y, 3, 1, p.cloth2);
  }

  // ---------- طفل جني ----------
  function childJinn(g, t) {
    const p = PAL.child;
    const y = Math.sin(t * 2) > 0 ? 0 : 1;
    g.globalAlpha = 0.14; disc(g, 6, 9 + y, 8, p.glow); g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) rect(g, 3 + i * 2, 14 + y, 2, 2 + i, p.cloth2);
    rect(g, 2, 6 + y, 8, 8, p.cloth);
    rect(g, 3, 8 + y, 6, 4, p.skin);
    rect(g, 3, 4 + y, 6, 4, p.skin);
    rect(g, 3, 3 + y, 6, 1, p.hair);
    rect(g, 4, 5 + y, 1, 1, p.eye); rect(g, 7, 5 + y, 1, 1, p.eye);
    g.globalAlpha = .4; rect(g, 4, 5 + y, 1, 1, p.glow); rect(g, 7, 5 + y, 1, 1, p.glow); g.globalAlpha = 1;
    rect(g, 1, 8 + y, 1, 3, p.skin); rect(g, 10, 8 + y, 1, 3, p.skin);
    rect(g, 4, 12 + y, 1, 2, p.cloth); rect(g, 7, 12 + y, 1, 2, p.cloth);
  }

  // ---------- مولّد الشخصيات ----------
  const HUMAN = {
    hero: { pal: 'hero', o: { weapon: 'sword' } },
    smith: { pal: 'smith', o: { apron: true, weapon: 'hammer', beard: false, female: true, wrap: true, skirt: true, earring: true } },
    herbalist: { pal: 'herbalist', o: { wrap: true, female: true, skirt: true, earring: true, satchel: true } },
    zainab: { pal: 'zainab', o: { female: true, hijab: true, shawl: true, skirt: true, satchel: true, beauty: true } },
    donorLady: { pal: 'donorLady', o: { female: true, hijab: true, shawl: true, skirt: true, apron: true, earring: true } },
    mari: { pal: 'mari', o: { female: true, hijab: true, shawl: true, skirt: true, satchel: true } },
    lana: { pal: 'lana', o: { female: true, longHair: true, braid: true, skirt: true, satchel: true, earring: true } },
    sidra: { pal: 'sidra', o: { female: true, wrap: true, shawl: true, skirt: true, apron: true, earring: true } },
    mason: { pal: 'mason', o: { beard: true, weapon: 'hammer' } },
    hunter: { pal: 'hunter', o: { weapon: 'bow' } },
    mustafa: { pal: 'mustafa', o: { beard: true, satchel: true, wrap: true } },
    hassan: { pal: 'hassan', o: { satchel: true, wrap: true } },
    farmer: { pal: 'farmer', o: { beard: true, longBeard: true, wrap: true, apron: true, satchel: true } },
    captain: { pal: 'captain', o: { helm: true, weapon: 'spear', tabard: true } },
    wizard: { pal: 'wizard', o: { hood: true, weapon: 'staff', glowEyes: true } },
    soldier: { pal: 'soldier', o: { helm: true, weapon: 'spear', guard: true } },
    enemy: { pal: 'enemy', o: { helm: true, weapon: 'spear', guard: true, tabard: true, plume: '#a3202c' } },
    bandit: { pal: 'bandit', o: { hood: true, weapon: 'sword' } },
    champion: { pal: 'champion', o: { helm: true, plume: '#9e1f2a', weapon: 'sword', guard: true } },
    king: { pal: 'king', o: { crown: true, beard: true, cloak: true } },
    childBoy: { pal: 'childBoy', o: { shortHair: true } },
    childGirl: { pal: 'childGirl', o: { female: true, braid: true, shortHair: true, skirt: true } },
  };

  A.art.spr = function (kind, opts) {
    opts = opts || {};
    if (kind === 'wolf') return sprite('wolf' + (opts.corpse ? 'c' : ''), 16, 14, (g) => wolf(g, opts.pal, opts));
    if (kind === 'bat') return sprite('bat' + (opts.flap ? 'f' : ''), 16, 10, (g) => bat(g, opts.t || 0));
    if (kind === 'skeleton') return sprite('skel' + (opts.cloth === false ? 'n' : ''), 16, 24, (g) => skeleton(g, opts));
    if (kind === 'wraith') return sprite('wraith' + (opts.phase || 0), 16, 24, (g) => wraith(g, (opts.phase || 0) * 0.7, opts.pal));
    if (kind === 'imp') return sprite('imp', 12, 18, (g) => imp(g, 0));
    if (kind === 'child') return sprite('childjinn' + (opts.phase || 0), 12, 18, (g) => childJinn(g, (opts.phase || 0) * 0.6));
    if (kind === 'jinnFire') return sprite('jinnFire', 22, 36, (g) => jinn(g, PAL.jinnFire, 'fire', 0));
    if (kind === 'jinnMist') return sprite('jinnMist', 22, 36, (g) => jinn(g, PAL.jinnMist, 'mist', 0));
    if (kind === 'jinnFrost') return sprite('jinnFrost', 22, 36, (g) => jinn(g, PAL.jinnFrost, 'frost', 0));
    if (kind === 'jinnChild') return sprite('jinnChild', 12, 18, (g) => childJinn(g, 0));
    if (kind === 'statue') {
      const fem = !!opts.female;
      return sprite('statue_hero' + (fem ? '_f' : ''), 16, 24, (g) => humanoid(g, PAL.statue, {
        weapon: 'sword', pose: 'idle', cloak: true, female: fem, longHair: fem, skirt: fem,
      }));
    }
    if (kind === 'hero') {
      const L = A.art.look(opts.look);
      const pose = opts.pose || 'idle';
      const key = 'h_hero_' + L.id + '_' + pose + (opts.weapon ? '_' + opts.weapon : '') +
        (opts.cloak === false ? '_nc' : '') + (opts.guard ? '_g' : '');
      return sprite(key, 16, 24, (g) => {
        const o = Object.assign({}, L.o, opts, { pose });
        humanoid(g, Object.assign({}, PAL[L.pal] || PAL.hero, { hair: o.hair || (PAL[L.pal] || PAL.hero).hair }), o);
      });
    }
    const h = HUMAN[kind];
    if (!h) return null;
    const pose = opts.pose || 'idle';
    const key = 'h_' + kind + '_' + pose + (opts.weapon ? '_' + opts.weapon : '');
    return sprite(key, 16, 24, (g) => {
      const o = Object.assign({}, h.o, opts, { pose });
      humanoid(g, PAL[h.pal], o);
    });
  };

  // ---------- البورتريهات ----------
  const BUST = {
    hero:      { pal: 'hero', hair: 'short', scar: true },
    smith:     { pal: 'smith', hair: 'wrap', female: true, strong: true },
    herbalist: { pal: 'herbalist', hair: 'scarf', female: true },
    zainab:    { pal: 'zainab', hair: 'hijab', female: true, beauty: true },
    donorLady: { pal: 'donorLady', hair: 'hijab', female: true },
    mari:      { pal: 'mari', hair: 'hijab', female: true },
    lana:     { pal: 'lana', hair: 'braid', female: true },
    sidra:     { pal: 'sidra', hair: 'wrap', female: true },
    mason:     { pal: 'mason', hair: 'bald', beard: true },
    hunter:    { pal: 'hunter', hair: 'short', beard: true },
    captain:   { pal: 'captain', hair: 'short', helm: true, beard: true },
    wizard:    { pal: 'wizard', hair: 'hood', glow: true, beard: true },
    jinnFire:  { pal: 'jinnFire', hair: 'horn', glow: true },
    jinnMist:  { pal: 'jinnMist', hair: 'veil', glow: true, female: true },
    jinnFrost: { pal: 'jinnFrost', hair: 'crown', glow: true, beard: true },
    jinnChild: { pal: 'child', hair: 'short', glow: true, small: true },
    childBoy:  { pal: 'childBoy', hair: 'short', small: true },
    childGirl: { pal: 'childGirl', hair: 'short', female: true, small: true },
    champion:  { pal: 'champion', hair: 'helm', helm: true, glow: true },
    soldier:   { pal: 'soldier', hair: 'helm', helm: true },
    enemy:     { pal: 'enemy', hair: 'helm', helm: true },
    mustafa:   { pal: 'mustafa', hair: 'wrap', beard: true },
    hassan:    { pal: 'hassan', hair: 'wrap' },
    farmer:    { pal: 'farmer', hair: 'wrap', beard: true, longBeard: true },
    king:      { pal: 'king', hair: 'crown', beard: true },
  };

  function bustDraw(g, p, o) {
    const skin = p.skin, skin2 = p.skin2 || skin, hair = p.hair || '#3a2a26';
    const cloth = p.cloth, cloth2 = p.cloth2 || cloth, accent = p.accent || '#c9a227';
    const big = !o.small;
    const fem = !!o.female;
    const top = big ? 3 : 7;
    // أكتاف
    if (fem) {
      rect(g, 4, 27, 24, 7, cloth);
      rect(g, 4, 27, 24, 1, p.cloth2 || cloth2);
      rect(g, 4, 30, 5, 4, cloth2); rect(g, 23, 30, 5, 4, cloth2);
      rect(g, 7, 28, 18, 1, accent);
      rect(g, 14, 28, 4, 3, skin2);
      rect(g, 15, 28, 2, 2, skin);
    } else {
      rect(g, 2, 27, 28, 7, cloth);
      rect(g, 2, 27, 28, 1, p.cloth2 || cloth2);
      rect(g, 2, 30, 6, 4, cloth2); rect(g, 24, 30, 6, 4, cloth2);
      rect(g, 5, 28, 22, 1, accent);
    }
    // رقبة
    if (fem) {
      rect(g, 14, 23, 4, 5, skin2);
      rect(g, 14, 23, 4, 1, skin);
    } else {
      rect(g, 13, 23, 6, 5, skin2);
      rect(g, 13, 23, 6, 1, skin);
    }
    // رأس
    const hy = big ? 4 : 8;
    if (fem) {
      rect(g, 12, hy, 8, 2, skin2);
      rect(g, 10, hy + 2, 12, 13, skin2);
      rect(g, 11, hy + 15, 10, 2, skin2);
      rect(g, 13, hy + 17, 6, 1, skin2);
    } else {
      rect(g, 11, hy, 10, 2, skin2);
      rect(g, 9, hy + 2, 14, 14, skin2);
      rect(g, 11, hy + 16, 10, 2, skin2);
      rect(g, 12, hy + 18, 8, 1, skin2);
    }
    // إضاءة الوجه
    if (fem) {
      rect(g, 11, hy + 3, 8, 11, skin);
      rect(g, 11, hy + 3, 3, 8, skin);
      rect(g, 13, hy + 14, 5, 1, skin);
    } else {
      rect(g, 10, hy + 3, 9, 12, skin);
      rect(g, 10, hy + 3, 4, 9, skin);
      rect(g, 12, hy + 15, 6, 1, skin);
    }
    // أذنان
    if (fem) {
      rect(g, 8, hy + 7, 2, 4, skin2);
      rect(g, 22, hy + 7, 2, 4, skin2);
    } else {
      rect(g, 7, hy + 7, 2, 4, skin2);
      rect(g, 23, hy + 7, 2, 4, skin2);
    }
    // شعر
    if (o.hair === 'short' || o.hair === 'helm') {
      rect(g, 9, hy - 2, 14, 4, hair);
      rect(g, 9, hy + 1, 2, 9, hair);
      rect(g, 21, hy + 1, 2, 11, hair);
      rect(g, 11, hy - 2, 8, 2, hair);
      rect(g, 10, hy - 1, 5, 2, hair);
    } else if (o.hair === 'long') {
      rect(g, 9, hy - 2, 14, 4, hair);
      rect(g, 8, hy, 2, 20, hair);
      rect(g, 22, hy, 2, 22, hair);
      rect(g, 7, hy + 8, 1, 10, hair);
      rect(g, 24, hy + 10, 1, 10, hair);
      // خصلات على الكتف
      rect(g, 6, hy + 19, 4, 2, hair);
      rect(g, 22, hy + 21, 4, 2, hair);
    } else if (o.hair === 'braid') {
      rect(g, 9, hy - 2, 14, 4, hair);
      rect(g, 9, hy + 1, 2, 8, hair);
      rect(g, 21, hy + 1, 2, 9, hair);
      // ضفيرة على الكتف
      rect(g, 7, hy + 8, 2, 3, hair);
      rect(g, 6, hy + 11, 3, 2, hair);
      rect(g, 6, hy + 13, 2, 3, hair);
      rect(g, 5, hy + 16, 3, 2, hair);
      px(g, 5, hy + 18, accent);
    } else if (o.hair === 'scarf') {
      rect(g, 8, hy - 4, 16, 5, accent);
      rect(g, 7, hy - 2, 18, 2, accent);
      rect(g, 6, hy + 1, 3, 18, accent);
      rect(g, 23, hy + 1, 3, 18, accent);
      rect(g, 9, hy - 4, 14, 1, cloth2);
      rect(g, 9, hy - 1, 12, 2, hair);
      rect(g, 9, hy + 2, 2, 13, hair);
      rect(g, 21, hy + 2, 2, 13, hair);
      // طرف الشال على الكتف
      rect(g, 7, hy + 14, 5, 3, accent);
      rect(g, 8, hy + 17, 4, 1, cloth2);
    } else if (o.hair === 'hijab') {
      const sc = p.scarf || accent, sc2 = p.scarf2 || cloth2;
      // حجاب يحيط بالوجه ويغطي الشعر والرقبة
      rect(g, 8, hy - 5, 16, 7, sc);
      rect(g, 7, hy - 2, 2, 17, sc);
      rect(g, 23, hy - 2, 2, 17, sc);
      rect(g, 8, hy - 5, 16, 1, accent);
      rect(g, 8, hy + 1, 16, 1, sc2);
      // ينسدل على الرقبة وأعلى الصدر
      rect(g, 10, hy + 16, 12, 12, sc);
      rect(g, 9, hy + 20, 14, 3, sc2);
      rect(g, 10, hy + 16, 12, 1, accent);
      px(g, 21, hy + 2, accent);
    } else if (o.hair === 'wrap') {
      rect(g, 8, hy - 3, 16, 5, accent);
      rect(g, 8, hy - 1, 16, 1, p.cloth2 || cloth2);
      rect(g, 7, hy + 2, 2, 5, accent);
      rect(g, 23, hy + 2, 2, 5, accent);
      rect(g, 22, hy - 4, 3, 2, accent);
      if (fem) {
        rect(g, 9, hy + 5, 2, 9, hair);
        rect(g, 21, hy + 5, 2, 9, hair);
      }
    } else if (o.hair === 'bald') {
      rect(g, 9, hy, 14, 1, skin);
      rect(g, 8, hy + 2, 1, 8, skin2);
      rect(g, 23, hy + 2, 1, 8, skin2);
    } else if (o.hair === 'hood') {
      rect(g, 7, hy - 5, 18, 7, cloth);
      rect(g, 6, hy + 1, 3, 16, cloth2);
      rect(g, 22, hy + 1, 3, 16, cloth2);
      rect(g, 8, hy - 5, 16, 2, cloth);
      rect(g, 9, hy + 1, 14, 1, cloth2);
      rect(g, 10, hy + 1, 12, 2, hair); // خصلات تطل
    } else if (o.hair === 'horn') {
      rect(g, 9, hy - 2, 14, 3, hair);
      line(g, 8, hy - 1, 5, hy - 8, accent, 1); line(g, 7, hy - 2, 6, hy - 9, accent, 1);
      line(g, 23, hy - 1, 26, hy - 8, accent, 1);
      rect(g, 7, hy - 9, 1, 1, accent); rect(g, 26, hy - 9, 1, 1, accent);
      // تاج صغير
      rect(g, 12, hy - 4, 8, 1, accent);
    } else if (o.hair === 'crown') {
      rect(g, 9, hy - 2, 14, 3, hair);
      rect(g, 8, hy - 4, 16, 2, accent);
      for (let i = 0; i < 4; i++) { rect(g, 8 + i * 4, hy - 7, 1, 3, accent); px(g, 8 + i * 4, hy - 8, '#eaf8ff'); }
      rect(g, 6, hy + 3, 3, 12, hair); rect(g, 23, hy + 3, 3, 12, hair);
    } else if (o.hair === 'veil') {
      g.globalAlpha = 0.92;
      rect(g, 7, hy - 4, 18, 9, accent);
      rect(g, 6, hy + 3, 3, 18, accent);
      rect(g, 23, hy + 3, 3, 18, accent);
      rect(g, 9, hy + 13, 14, 7, accent);
      g.globalAlpha = 1;
      rect(g, 8, hy + 1, 2, 12, '#b89ad6');
      rect(g, 22, hy + 1, 2, 12, '#b89ad6');
      // طرحة ممدودة على الكتفين
      rect(g, 7, hy + 16, 6, 2, accent);
      rect(g, 19, hy + 16, 6, 2, accent);
    }
    // وجه
    // حاجبان
    if (fem) {
      rect(g, 11, hy + 6, 3, 1, hair);
      rect(g, 18, hy + 6, 3, 1, hair);
    } else {
      rect(g, 11, hy + 6, 4, 1, hair);
      rect(g, 17, hy + 6, 4, 1, hair);
    }
    // عيون
    const ey = hy + 8;
    if (o.glow) {
      g.globalAlpha = 0.3; disc(g, 13, ey, 3, p.glow || accent); disc(g, 19, ey, 3, p.glow || accent); g.globalAlpha = 1;
      rect(g, 12, ey, 3, 1, p.eye || accent);
      rect(g, 18, ey, 3, 1, p.eye || accent);
      rect(g, 13, ey - 1, 1, 1, p.glow || accent);
      rect(g, 19, ey - 1, 1, 1, p.glow || accent);
    } else {
      rect(g, 11, ey, 4, 2, '#e8e2d4');
      rect(g, 17, ey, 4, 2, '#e8e2d4');
      rect(g, 13, ey, 2, 2, o.pal === 'captain' ? '#4a6b8a' : '#2a2018');
      rect(g, 18, ey, 2, 2, o.pal === 'captain' ? '#4a6b8a' : '#2a2018');
      px(g, 13, ey, '#fff');
      if (fem) {
        px(g, 11, ey - 1, hair); px(g, 14, ey - 1, hair);
        px(g, 17, ey - 1, hair); px(g, 20, ey - 1, hair);
        px(g, 21, ey, hair);
      }
    }
    // أنف
    rect(g, 15, ey + 1, 2, 3, skin2);
    rect(g, 15, ey + 3, 2, 1, '#a2734c');
    // فم
    if (!o.beard) {
      if (fem) {
        rect(g, 14, hy + 14, 4, 1, '#a85a52');
        px(g, 15, hy + 14, '#c97a70');
      } else {
        rect(g, 13, hy + 14, 5, 1, '#8a5340');
        px(g, 15, hy + 14, '#c98f72');
      }
    }
    // لحية
    if (o.beard) {
      rect(g, 11, hy + 12, 10, 4, hair);
      rect(g, 12, hy + 16, 8, 3, hair);
      rect(g, 13, hy + 19, 6, 1, hair);
      rect(g, 13, hy + 13, 6, 1, '#8a5340');
      if (o.longBeard) {
        // لحية الشيخ: طبقات بيضاء أطول على الصدر
        rect(g, 12, hy + 20, 8, 2, hair);
        rect(g, 13, hy + 22, 6, 2, hair);
        rect(g, 14, hy + 24, 4, 1, hair);
        rect(g, 13, hy + 21, 1, 2, '#c9c1ae');
        rect(g, 18, hy + 21, 1, 2, '#c9c1ae');
      }
    }
    // درع
    if (o.helm) {
      rect(g, 8, hy - 3, 16, 4, p.metal || '#9aa3ad');
      rect(g, 8, hy - 3, 16, 1, '#cfd8e3');
      rect(g, 7, hy + 1, 3, 7, p.metal || '#9aa3ad');
      rect(g, 22, hy + 1, 3, 7, p.metal || '#9aa3ad');
      rect(g, 14, hy + 1, 3, 5, p.metal || '#9aa3ad');
      rect(g, 8, hy + 7, 16, 1, '#6c757f');
    }
    // ندبة
    if (o.scar) { rect(g, 19, hy + 9, 1, 4, skin2); rect(g, 20, hy + 10, 1, 2, '#a2734c'); }
    // قلادة/طوق
    rect(g, 12, 26, 8, 1, accent);
  }

  A.art.bust = function (kind, opts) {
    if (kind === 'hero') {
      const L = A.art.look(opts && opts.look);
      const p = PAL[L.pal] || PAL.hero;
      return sprite('bust_hero_' + L.id, 32, 34, (g) =>
        bustDraw(g, p, Object.assign({ pal: L.pal }, L.bust)));
    }
    const b = BUST[kind] || BUST.hero;
    return sprite('bust_' + kind, 32, 34, (g) => bustDraw(g, PAL[b.pal], b));
  };

  A.art.drawBustInto = function (canvas, kind, opts) {
    const spr = A.art.bust(kind, opts);
    const ctx = canvas.getContext('2d');
    canvas.width = 32; canvas.height = 34;
    ctx.clearRect(0, 0, 32, 34);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(spr, 0, 0);
  };

  A.art.PAL = PAL;
})(window.ASH);
