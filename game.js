/* ============================================================
   محرّك اللعبة: الحالة، الشاشات، الحوار، الحفظ
   ============================================================ */
(function (A) {
  const D = A.DATA;
  const G = (A.game = {});

  function isFemale(s) {
    if (!s) return false;
    if (s.gender === 'female') return true;
    if (s.gender === 'male') return false;
    return !!(A.art.lookInfo(s.look).female);
  }
  G.isFemale = isFemale;

  const SPEAKERS = {
    narr:      { name: '', role: '', bust: null },
    hero:      { name: () => G.state.name, role: () => (isFemale(G.state) ? 'مدنيّة من دير النار' : 'مدنيّ من دير النار'), bust: 'hero' },
    captain:   { name: 'النقيب عادل', role: 'حامية القرية', bust: 'captain' },
    smith:     { name: 'أم حيدر', role: 'حدّادة', bust: 'smith' },
    herbalist: { name: 'سلمى', role: 'عشّابة', bust: 'herbalist' },
    zainab:    { name: 'زينب', role: 'خيّاطة عابرة', bust: 'zainab' },
    donorLady: { name: 'أسماء', role: 'أمينة التبرّعات', bust: 'donorLady' },
    mari:      { name: 'ماري', role: 'دلالة القوافل', bust: 'mari' },
    lana:     { name: 'لانا', role: 'راعية', bust: 'lana' },
    sidra:     { name: 'سيدرا', role: 'حارسة الفوانيس', bust: 'sidra' },
    mason:     { name: 'أبو طارق', role: 'مهندس', bust: 'mason' },
    hunter:    { name: 'جاسم', role: 'صيّاد', bust: 'hunter' },
    mustafa:   { name: 'مصطفى', role: 'مشرّد من الجنوب', bust: 'mustafa' },
    hassan:    { name: 'حسن', role: 'مشرّد من الجنوب', bust: 'hassan' },
    farmer:    { name: 'الفلاح حسين', role: 'فلّاح الحضيرة', bust: 'farmer' },
    wizard:    { name: 'العارف نَورَس', role: 'يفتح الأبواب', bust: 'wizard' },
    jinnFire:  { name: 'سلطان الجمر', role: 'عرش النار', bust: 'jinnFire' },
    jinnMist:  { name: 'ملكة الضباب', role: 'عرش الضباب', bust: 'jinnMist' },
    jinnFrost: { name: 'الشيخ زمهرير', role: 'عرش الزمهرير', bust: 'jinnFrost' },
    jinnChild: { name: 'نُوّار', role: 'طفل من الجنّ', bust: 'jinnChild' },
    childBoy:  { name: 'سليم', role: 'من أطفال دير النار', bust: 'childBoy' },
    childGirl: { name: 'ياسمين', role: 'من أطفال دير النار', bust: 'childGirl' },
    champion:  { name: 'قائد الرماد', role: 'إمبراطورية الرماد', bust: 'champion' },
    soldier:   { name: 'جنديّ الحامية', role: 'كالدَر', bust: 'soldier' },
    king:      { name: 'الملك كالدَر', role: 'عرش المملكة', bust: 'king' },
    villagerWoman: { name: 'أم فرح', role: 'من أهل دير النار', bust: 'herbalist' },
    villagerMan:   { name: 'أبو سعيد', role: 'فلّاح', bust: 'hunter' },
    gateGuard:     { name: 'سالم', role: 'حارس البوابة', bust: 'soldier' },
    guard2:        { name: 'حارس البوابة', role: 'كالدَر', bust: 'soldier' },
    scout:         { name: 'سراج', role: 'كشّاف الحصن', bust: 'soldier' },
  };

  const RES_ICON = { wood: '#9a7440', iron: '#8fa0b3', herb: '#6aa477', stone: '#9a94a0' };
  // مكان إتمام كل مهمة من مهام ما بعد الحرب.
  const POST_QUEST_PLACE = { names: 'ruins', lanterns: 'mine', wheel: 'market', garden: 'forest' };

  // ---------- الحالة ----------
  function newState(name, look, gender) {
    const looks = A.art.LOOKS || [];
    let lk = Math.max(0, Math.min((looks.length || 1) - 1, (look | 0) || 0));
    let g = gender === 'female' ? 'female' : gender === 'male' ? 'male' : null;
    if (!g) g = looks[lk] && looks[lk].o.female ? 'female' : 'male';
    // تأكيد توافق الشكل مع الجنس المختار
    const wantFemale = g === 'female';
    if (!looks[lk] || !!looks[lk].o.female !== wantFemale) {
      const alt = looks.findIndex((L) => !!L.o.female === wantFemale);
      lk = alt < 0 ? 0 : alt;
    }
    const st = {
      v: 1,
      name: name || 'حارث',
      look: lk,
      gender: g,
      day: 1,
      daysLeft: D.maxDays,
      hp: D.player.hp,
      maxHp: D.player.hp,
      atk: D.player.atk,
      def: D.player.def,
      potions: D.player.potions,
      res: { wood: 0, iron: 0, herb: 0, stone: 0 },
      delivered: { wood: 0, iron: 0, herb: 0, stone: 0 },
      rep: 0,
      valor: 0,
      flags: {},
      quests: {},
      postQuests: {},
      postProgress: { names: 0, lanterns: 0, wheel: 0, saplings: 0, carved: [], planted: [] },
      trophies: {},
      main: { q: 0, stage: 0, done: 0 },
      jinnDeal: 0,
      battleChoice: null,
      screen: { name: 'map' },
      atPlace: null,
      visited: {},
      ending: null,
    };
    if (A.mainQuest) A.mainQuest.init(st);
    return st;
  }
  G.newState = newState;

  // ---------- التهيئة ----------
  G.init = function () {
    G.stage = document.getElementById('stage');
    G.canvas = document.getElementById('scene');
    G.ctx = G.canvas.getContext('2d');
    G.ctx.imageSmoothingEnabled = false;
    A.art.setContext(G.ctx);
    G.ui = document.getElementById('ui');
    G.dlgLayer = document.getElementById('dialog-layer');
    G.hudEl = document.getElementById('hud');
    G.toasts = document.getElementById('toasts');
    G.fade = document.getElementById('fade');
    G.mode = 'scene';
    G.screen = 'title';
    G.bg = 'title';
    G.actors = [];
    G.overlay = null;
    G.shakeMag = 0;
    G.shakeUntil = 0;
    G.battleStarted = false;
    G.state = null;
    G.t0 = performance.now();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const m = A.$('.modal-bg');
        if (m) { m.remove(); e.preventDefault(); }
      }
    });

    G.go('title');
    requestAnimationFrame(loop);
  };

  function loop(now) {
    try {
      // حالة قماش نظيفة كل إطار: يمنع أي انزياح/اختفاء إذا رمى رسمٌ استثناءً في منتصفه.
      G.ctx.setTransform(1, 0, 0, 1, 0, 0);
      G.ctx.globalAlpha = 1;
      G.ctx.globalCompositeOperation = 'source-over';
      const t = (now - G.t0) / 1000;
      if (A.roam && A.roam.active) A.roam.update(now);
      if (A.mountain && A.mountain.active) {
        A.mountain.draw(G.ctx, now);
      } else {
        G.ctx.save();
        if (now < G.shakeUntil) {
          const m = G.shakeMag;
          G.ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
        }
        A.art.drawScene(G.bg, t, { actors: G.actors, tint: G.bgTint, camX: A.roam && A.roam.active ? A.roam.camX() : 0 });
        G.ctx.restore();
        if (G.overlay) {
          try { G.overlay(G.ctx, t); } catch (e) { console.warn(e); }
        }
      }
    } catch (e) {
      // لا نوقف حلقة اللعبة أبدًا بسبب إطار واحد فاشل.
      console.warn('frame:', e);
    }
    requestAnimationFrame(loop);
  }

  G.setBg = function (id, actors, opts) {
    G.bg = id;
    G.actors = actors || [];
    G.bgTint = opts && opts.tint ? opts.tint : null;
  };
  G.shake = function (mag, ms) {
    if (!mag) { G.shakeUntil = 0; G.shakeMag = 0; return; }
    G.shakeMag = mag;
    G.shakeUntil = performance.now() + (ms || 150);
  };
  G.hideChrome = function () { G.hudEl.classList.add('hidden'); };
  G.showChrome = function () { G.hudEl.classList.remove('hidden'); };

  G.toast = function (msg, kind) {
    const txt = A.genderText ? A.genderText(msg) : msg;
    const el = A.el('div', 'toast ' + (kind || ''), '<span class="dot"></span><span>' + A.rich(txt) + '</span>');
    G.toasts.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  };

  // ---------- الحفظ ----------
  // حفظ مؤكَّد: نسخة أساسية + نسخة احتياطية من آخر حالة مختلفة،
  // وحفظ تلقائي عند إخفاء الصفحة أو الخروج كي لا يضيع التقدّم.
  const SAVE_KEY = 'ash.save.v1';
  const SAVE_BAK = 'ash.save.bak.v1';
  let lastSavedState = null;
  function readSave(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || !o.state || !o.state.name) return null;
      return o;
    } catch (e) { return null; }
  }
  G.save = function () {
    if (!G.state) return;
    try {
      const stateRaw = JSON.stringify(G.state);
      if (stateRaw === lastSavedState) return;
      const prev = localStorage.getItem(SAVE_KEY);
      if (prev) { try { localStorage.setItem(SAVE_BAK, prev); } catch (e) { /* تجاهل */ } }
      localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, ts: Date.now(), state: G.state }));
      lastSavedState = stateRaw;
    } catch (e) { /* ممتلئ أو معطّل */ }
  };
  G.loadRaw = function () { return readSave(SAVE_KEY) || readSave(SAVE_BAK); };
  G.hasBackup = function () {
    try {
      const bak = localStorage.getItem(SAVE_BAK);
      const main = localStorage.getItem(SAVE_KEY);
      return !!bak && bak !== main;
    } catch (e) { return false; }
  };
  G.restoreBackup = function () {
    try {
      const bak = localStorage.getItem(SAVE_BAK);
      if (!bak) return false;
      localStorage.setItem(SAVE_KEY, bak);
      return true;
    } catch (e) { return false; }
  };
  G.clearSave = function () {
    lastSavedState = null;
    try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(SAVE_BAK); } catch (e) {}
  };
  // لا تعتمد على إغلاق الزر فقط: المتصفح قد يُغلق أو يخفي الصفحة فجأة.
  window.addEventListener('pagehide', () => G.save());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') G.save();
  });

  // ---------- المؤثرات ----------
  function apply(e) {
    const s = G.state;
    if (!s || !e) return;
    if (e.res) for (const k in e.res) s.res[k] = Math.max(0, (s.res[k] || 0) + e.res[k]);
    if (e.flag) [].concat(e.flag).forEach((f) => (s.flags[f] = true));
    if (e.unflag) [].concat(e.unflag).forEach((f) => (s.flags[f] = false));
    if (e.rep) s.rep += e.rep;
    if (e.atk) s.atk += e.atk;
    if (e.def) s.def += e.def;
    if (e.maxHp) {
      s.maxHp += e.maxHp;
      if (e.maxHp > 0) s.hp += e.maxHp;
      s.hp = A.clamp(s.hp, 1, s.maxHp);
    }
    if (e.hp) s.hp = A.clamp(s.hp + e.hp, 0, s.maxHp);
    if (e.heal) s.hp = A.clamp(s.hp + e.heal, 0, s.maxHp);
    if (e.potions) s.potions = Math.max(0, s.potions + e.potions);
    if (e.quest) {
      s.quests[e.quest[0]] = e.quest[1];
      const q = D.quests[e.quest[0]];
      if (e.quest[1] === 'done' && q && q.trophy) awardTrophy(q.trophy);
    }
    G.updateHud();
    G.save();
  }
  G.apply = apply;

  // ---------- التروفيات ----------
  function awardTrophy(id) {
    const s = G.state;
    if (!s || !id) return;
    if (!s.trophies) s.trophies = {};
    if (s.trophies[id]) return;
    const t = D.trophies[id];
    s.trophies[id] = true;
    A.audio.trophy();
    G.toast('تروفي: ' + (t ? t.name : id), 'trophy');
    // تروفي الإكمال ١٠٠٪: كل التروفيات الأخرى بلا استثناء.
    G.checkPerfect(s);
  }
  G.awardTrophy = awardTrophy;

  G.checkPerfect = function (s) {
    s = s || G.state;
    if (!s || !s.trophies || s.trophies.perfect) return false;
    const ids = Object.keys(D.trophies).filter((id) => id !== 'perfect');
    if (!ids.length || !ids.every((id) => s.trophies[id])) return false;
    awardTrophy('perfect');
    return true;
  };

  G.postQuestDone = function (s) {
    if (!s || !s.postQuests) return 0;
    return Object.keys(D.postQuests).filter((id) => s.postQuests[id] === 'done').length;
  };

  G.trophyCount = function (s) {
    if (!s || !s.trophies) return 0;
    return Object.keys(D.trophies).filter((id) => s.trophies[id]).length;
  };

  // ---------- الحوار ----------
  G.say = function (who, text) {
    const s = G.state;
    text = A.genderText(String(text));
    text = A.t(text);
    text = text.replace(/\{name\}/g, A.nameFor(s ? s.name : 'حارث'));
    return new Promise((resolve) => {
      const spk = SPEAKERS[who] || SPEAKERS.narr;
      const isNarr = who === 'narr' || !spk.bust;
      const nm = typeof spk.name === 'function' ? spk.name() : spk.name;
      const role = typeof spk.role === 'function' ? spk.role() : (spk.role || '');
      G.dlgLayer.innerHTML = `
        <div class="dlg ${isNarr ? 'no-portrait' : ''}">
          ${isNarr ? '' : '<div class="dlg-portrait"><canvas></canvas></div>'}
          <div class="dlg-main">
            <div class="dlg-name">${A.esc(nm)}${role ? `<span class="role">${A.esc(role)}</span>` : ''}</div>
            <div class="dlg-text ${isNarr ? 'narr' : ''}"></div>
            <div class="dlg-hint"><span class="blink">◆</span> مسافة / نقرة للمتابعة</div>
          </div>
        </div>`;
      const $dlg = A.$('.dlg', G.dlgLayer);
      const $txt = A.$('.dlg-text', $dlg);
      const $hint = A.$('.dlg-hint', $dlg);
      if (!isNarr) {
        const c = A.$('canvas', $dlg);
        if (c) A.art.drawBustInto(c, spk.bust, spk.bust === 'hero' ? { look: s && s.look } : null);
      }
      const plain = text;
      let i = 0;
      let typing = true;
      let done = false;
      const iv = setInterval(() => {
        i += 2;
        if (i >= plain.length) { finishTyping(); return; }
        $txt.textContent = plain.slice(0, i);
      }, 14);

      function finishTyping() {
        clearInterval(iv);
        typing = false;
        $txt.innerHTML = A.rich(plain);
        $hint.style.opacity = '1';
      }
      function advance() {
        if (done) return;
        if (typing) { finishTyping(); return; }
        done = true;
        cleanup();
        resolve();
        scheduleDialogueCleanup();
      }
      function onKey(e) {
        if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); advance(); }
      }
      function onDown(e) {
        // تجاهل النقر فوق أزرار الاختيار
        if (e.target.closest && e.target.closest('.choices')) return;
        advance();
      }
      function cleanup() {
        document.removeEventListener('keydown', onKey);
        G.stage.removeEventListener('pointerdown', onDown);
      }
      setTimeout(() => {
        document.addEventListener('keydown', onKey);
        G.stage.addEventListener('pointerdown', onDown);
      }, 40);
      if (!plain.length) { finishTyping(); $hint.style.opacity = '0'; }
    });
  };

  G.ask = function (options) {
    const s = G.state;
    return new Promise((resolve) => {
      const shown = options.filter((o) => !o.show || o.show(s));
      const wrap = A.el('div', 'choices');
      shown.forEach((o, i) => {
        const enabled = !o.req || o.req(s);
        const b = A.el('button', 'choice' + (enabled ? '' : ' locked') + (o.danger ? ' danger' : ''));
        const badge = A.lang === 'en'
          ? (['A', 'B', 'C', 'D', 'E', 'F'][i] || String(i + 1))
          : (['أ', 'ب', 'ج', 'د', 'هـ', 'و'][i] || A.fmt(i + 1));
        b.innerHTML = `<span class="badge">${badge}</span><span>${A.esc(A.genderText(o.label))}${o.sub ? `<span class="ch-sub">${A.esc(A.genderText(o.sub))}</span>` : ''}${!enabled && o.reqText ? `<span class="ch-sub">${A.esc(A.genderText(o.reqText))}</span>` : ''}</span>`;
        if (enabled) b.addEventListener('click', (ev) => { ev.stopPropagation(); pick(i); });
        wrap.appendChild(b);
      });
      G.dlgLayer.appendChild(wrap);
      // موضع الأزرار فوق صندوق الحوار
      requestAnimationFrame(() => {
        const dlg = A.$('.dlg', G.dlgLayer);
        const sr = G.stage.getBoundingClientRect();
        const h = dlg ? dlg.getBoundingClientRect().height : 0;
        const ch = wrap.offsetHeight || 0;
        // أبقِ قائمة الخيارات داخل المسرح حتى على شاشات الهاتف القصيرة
        const maxBottom = Math.max(0, sr.height - ch - 4);
        const bottom = Math.min(h + 18, maxBottom);
        wrap.style.bottom = (bottom / sr.height * 100) + '%';
      });
      A.audio.select();

      function pick(i) {
        const chosen = shown[i];
        cleanup();
        wrap.remove();
        if (chosen && chosen.do) apply(chosen.do);
        A.audio.select();
        resolve(options.indexOf(chosen));
        scheduleDialogueCleanup();
      }
      const enabledIdx = shown.map((o, i) => (!o.req || o.req(s)) ? i : -1).filter((i) => i >= 0);
      function onKey(e) {
        const k = e.key;
        let n = -1;
        if (/^[1-6]$/.test(k)) n = +k - 1;
        else if (/^[a-fA-F]$/.test(k)) n = k.toLowerCase().charCodeAt(0) - 97;
        if (n >= 0 && enabledIdx.includes(n)) { e.preventDefault(); pick(n); return; }
        if (k === 'ArrowDown' || k === 'ArrowUp') {
          e.preventDefault();
          const bs = A.$$('.choice:not(.locked)', wrap);
          if (!bs.length) return;
          const cur = document.activeElement;
          let idx = bs.indexOf(cur);
          idx = k === 'ArrowDown' ? (idx + 1) % bs.length : (idx - 1 + bs.length) % bs.length;
          bs[idx].focus();
        }
      }
      document.addEventListener('keydown', onKey);
      function cleanup() { document.removeEventListener('keydown', onKey); }
    });
  };

  G.play = async function (nodes, depth) {
    depth = depth || 0;
    if (!nodes) return;
    if (depth > 12) return;
    for (const n of nodes) {
      if (!n) continue;
      if (n.do) apply(n.do);
      if (n.fn) await n.fn();
      if (n.t !== undefined) await G.say(n.w, n.t);
      if (n.c) {
        const i = await G.ask(n.c);
        const o = n.c[i];
        if (o) {
          // o.do يُطبَّق داخل G.ask عند الاختيار
          if (o.then) await G.play(o.then, depth + 1);
        }
      }
      if (n.battle) {
        const res = await A.battle.start(n.battle.enemy, n.battle.opts);
        const br = res.win ? n.battle.win : n.battle.lose;
        if (br) await G.play(br, depth + 1);
      }
    }
    G.save();
  };

  G.clearDialogue = function () { G.dlgLayer.innerHTML = ''; };

  // تنظيف آمن: إن انتهى المشهد دون أن تفتح شاشة جديدة أو خيارات جديدة،
  // نزيل صندوق الحوار المتقادم حتى لا يغطّي أزرار اللعب ويبدو اللعب متجمّدًا.
  function scheduleDialogueCleanup() {
    const node = A.$('.dlg', G.dlgLayer);
    if (!node) return;
    setTimeout(() => {
      if (!G.dlgLayer.contains(node)) return;      // استُبدل بحوارٍ جديد
      if (A.$('.choices', G.dlgLayer)) return;     // ما زالت هناك خيارات
      G.clearDialogue();
    }, 250);
  }

  // ---------- HUD ----------
  G.updateHud = function () {
    const s = G.state;
    if (!s || G.screen === 'title' || G.screen === 'end' || G.mode === 'battle' || G.mode === 'minigame' || G.mode === 'mountain') {
      G.hudEl.classList.add('hidden');
      return;
    }
    G.hudEl.classList.remove('hidden');
    if (s.postWar) {
      const sideIds = ['smith', 'herb', 'catapult', 'bow', 'child', 'ring', 'zainab', 'mari', 'lana', 'sidra', 'food'];
      const side = sideIds.filter((q) => s.quests[q] === 'done' || (q === 'ring' && s.flags.leftRing)).length;
      const pqTotal = Object.keys(D.postQuests).length;
      const pqDone = G.postQuestDone(s);
      G.hudEl.innerHTML = `
        <div class="hud-left">
          <div class="chip day">بعد الحرب</div>
          <div class="chip">❤ <b>${A.fmt(s.hp)}</b> / ${A.fmt(s.maxHp)}</div>
          <div class="chip">السمعة <b>${A.fmt(s.rep)}</b></div>
          <div class="chip">التروفيات <b>${A.fmt(G.trophyCount(s))}</b> / ${A.fmt(Object.keys(D.trophies).length)}</div>
          <div class="chip">المهام <b>${A.fmt(side)}</b> / ${A.fmt(sideIds.length)}</div>
          <div class="chip ${pqDone < pqTotal ? 'main-chip' : ''}">ما بعد الحرب <b>${A.fmt(pqDone)}</b> / ${A.fmt(pqTotal)}</div>
        </div>
        <div class="hud-right">
          <button class="hud-btn" data-quests="1">السجل</button>
          <button class="hud-btn" data-menu="1">☰</button>
        </div>`;
      const q = A.$('[data-quests]', G.hudEl), m = A.$('[data-menu]', G.hudEl);
      if (q) q.onclick = () => G.showQuests();
      if (m) m.onclick = () => G.showMenu();
      return;
    }
    const prep = Math.round(G.warSupply().ratio * 100);
    const chips = D.resOrder.map((k) =>
      `<div class="chip"><span class="dot" style="background:${RES_ICON[k]};color:${RES_ICON[k]}"></span>${A.resName(k, s.res[k])} <b>${A.fmt(s.res[k])}</b></div>`
    ).join('');
    const mqDone = Math.min((s.main && s.main.done) || 0, D.mainQuests.length);
    const mainChip = s.main && (mqDone > 0 || s.main.stage === 1 || s.main.stage === 2)
      ? `<div class="chip main-chip">أوامر النقيب <b>${A.fmt(mqDone)}</b> / ${A.fmt(D.mainQuests.length)}</div>`
      : '';
    G.hudEl.innerHTML = `
      <div class="hud-left">
        <div class="chip day ${s.daysLeft <= 5 ? 'urgent' : ''}">بقي <b>${A.fmt(Math.max(0, s.daysLeft))}</b> يومًا</div>
        <div class="chip">❤ <b>${A.fmt(s.hp)}</b> / ${A.fmt(s.maxHp)}</div>
        ${chips}
        <div class="chip">تجهيز <b>${A.fmt(prep)}٪</b></div>
        ${mainChip}
      </div>
      <div class="hud-right">
        <button class="hud-btn" data-quests="1">المهام</button>
        <button class="hud-btn" data-menu="1">☰</button>
      </div>`;
    const q = A.$('[data-quests]', G.hudEl), m = A.$('[data-menu]', G.hudEl);
    if (q) q.onclick = () => G.showQuests();
    if (m) m.onclick = () => G.showMenu();
  };

  // ---------- الشاشات ----------
  G.go = function (screen, arg) {
    if (A.mountain && A.mountain.active) A.mountain.exit();
    if (A.roam && A.roam.active) A.roam.detach();
    G.mode = 'scene';
    G.overlay = null;
    G.ui.innerHTML = '';
    G.clearDialogue();
    A.$$('.modal-bg').forEach((m) => m.remove());
    G.screen = screen;
    if (G.state) G.state.screen = screen === 'location' ? { name: 'location', id: arg } : { name: screen };
    if (screen === 'title') { G.hideChrome(); showTitle(); return; }
    if (!G.state) { G.go('title'); return; }
    if (screen === 'map') { showMap(); return; }
    if (screen === 'village') { showVillage(); return; }
    if (screen === 'location') { showLocation(arg); return; }
    if (screen === 'end') { return; }
  };

  // ---------- ملء الشاشة ----------
  // على الهاتف يخفي شريط عنوان المتصفح. داخل التطبيق المثبّت (PWA) ما نحتاجه أصلًا.
  G.fsElement = function () {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  };
  G.isStandalone = function () {
    // «تطبيق مثبّت» ≠ «ملء شاشة طلبناه الآن»: نستخدم علمًا داخليًا للتفريق بينهما.
    try {
      const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
      if (window.navigator.standalone === true) return true;
      if (mq('(display-mode: standalone)') || mq('(display-mode: minimal-ui)')) return true;
      if (mq('(display-mode: fullscreen)') && !G.fsRequested) return true;
    } catch (e) {}
    return false;
  };
  G.fsSupported = function () {
    const el = document.documentElement;
    return !!(el.requestFullscreen || el.webkitRequestFullscreen);
  };
  G.toggleFullscreen = function () {
    const d = document, el = d.documentElement;
    if (G.fsElement()) {
      const exit = d.exitFullscreen || d.webkitExitFullscreen;
      if (exit) exit.call(d);
      return false;
    }
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!req) return null;
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      G.fsRequested = true;
      if (p && p.catch) p.catch(() => { G.fsRequested = false; });
      // قفل الاتجاه أفقي أثناء ملء الشاشة (مدعوم على أندرويد، يُتجاهل بهدوء على iOS)
      try { window.screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
      return true;
    } catch (e) {
      G.fsRequested = false;
      return null;
    }
  };
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => {
    document.addEventListener(ev, () => {
      if (!G.fsElement()) G.fsRequested = false;
    });
  });

  // ---------- العنوان ----------
  function showTitle() {
    G.setBg('title', []);
    A.audio.ambient('title');
    G.state = null;
    G.saveExists = !!G.loadRaw();
    G.ui.innerHTML = `
      <div class="title-wrap">
        <div class="title-embers" aria-hidden="true"></div>
        <div class="title-frame" aria-hidden="true"></div>
        <button class="fs-btn" type="button" data-fs="1" aria-label="ملء الشاشة" title="ملء الشاشة">⛶</button>
        <div class="title-crest" aria-hidden="true">
          <span class="cr-line"></span>
          <span class="cr-mark">✦</span>
          <span class="cr-line"></span>
        </div>
        <div class="title-head">
          <div class="title-kicker">حكاية مدنيٍّ… وثلاثين يومًا قبل النهاية</div>
          <h1 class="game-title">رماد المملكة</h1>
          <div class="game-title-en">KINGDOM OF ASH</div>
          <div class="game-sub">ليس كل رمادٍ نهاية… بعضه <span>فجرٌ لم يُكتب بعد.</span></div>
        </div>
        <div class="sig">حكاية من صنع <a href="https://53536sg-alt.github.io/CyberTux-info/" target="_blank" rel="noopener">CyberTux / Nashwan</a></div>
        <div class="title-menu">
          <button class="btn title-btn primary" data-new="1">
            <span class="tb-ico">✦</span><span class="tb-txt">لعبة جديدة</span><span class="tb-arrow">›</span>
          </button>
          ${G.saveExists ? `<button class="btn title-btn" data-continue="1">
            <span class="tb-ico">↻</span><span class="tb-txt">متابعة الرحلة</span><span class="tb-arrow">›</span>
          </button>` : ''}
          ${G.hasBackup() ? `<button class="btn title-btn ghost" data-restore="1">
            <span class="tb-ico">⟲</span><span class="tb-txt">استعادة النسخة الاحتياطية</span><span class="tb-arrow">›</span>
          </button>` : ''}
          <button class="btn title-btn ghost" data-about="1">
            <span class="tb-ico">⌘</span><span class="tb-txt">عن اللعبة والتحكّم</span><span class="tb-arrow">›</span>
          </button>
          <button class="btn title-btn ghost" data-sound="1">
            <span class="tb-ico">♪</span><span class="tb-txt">الصوت: <b>${A.audio.muted ? 'مكتوم' : 'مفتوح'}</b></span><span class="tb-arrow">›</span>
          </button>
        </div>
        <div class="title-ver">نسخة 1.78</div>
      </div>`;
    const fsBtn = A.$('[data-fs]', G.ui);
    if (fsBtn) {
      // ما نعرضه إذا اللعبة مثبّتة كتطبيق (بلا شريط أصلًا) أو المتصفح ما يدعم ملء الشاشة.
      if (G.isStandalone() || !G.fsSupported()) fsBtn.remove();
      else fsBtn.onclick = () => G.toggleFullscreen();
    }
    A.$('[data-new]', G.ui).onclick = () => {
      if (!G.saveExists) { askName(); return; }
      G.confirm({
        title: 'لعبة جديدة',
        text: 'لديك رحلة محفوظة. إن بدأت لعبة جديدة فسيُمسح تقدّمك الحالي (مع الاحتفاظ بنسخة احتياطية حيث أمكن).',
        yes: 'ابدأ من جديد',
        no: 'إلغاء',
        onYes: askName,
      });
    };
    const cont = A.$('[data-continue]', G.ui);
    if (cont) cont.onclick = () => continueGame();
    A.$('[data-about]', G.ui).onclick = () => showAbout();
    const restore = A.$('[data-restore]', G.ui);
    if (restore) restore.onclick = () => {
      G.confirm({
        title: 'استعادة النسخة الاحتياطية',
        text: 'ستُستعاد آخر نسخة احتياطية من رحلتك، وتُستبدل الحالة الحالية.',
        yes: 'استعادة',
        no: 'إلغاء',
        onYes: () => { if (G.restoreBackup()) location.reload(); },
      });
    };
    A.$('[data-sound]', G.ui).onclick = (e) => {
      A.audio.init();
      const m = A.audio.toggle();
      const t = A.$('.tb-txt', e.currentTarget);
      if (t) {
        const en = A.lang === 'en';
        t.innerHTML = (en ? 'Sound: ' : 'الصوت: ') + '<b>' + (m ? (en ? 'Muted' : 'مكتوم') : (en ? 'On' : 'مفتوح')) + '</b>';
      }
    };
  }

  function askName() {
    A.audio.init();
    const looks = A.art.LOOKS || [];
    let gender = 'male';
    let selected = 0;
    const defName = (g) => {
      const fem = (g || gender) === 'female';
      if (A.lang === 'en') return fem ? 'Najwa' : 'Harith';
      return fem ? 'نجود' : 'حارث';
    };
    const isDefaultName = (v) => ['حارث', 'Harith', 'نجود', 'Najwa'].indexOf(String(v || '').trim()) !== -1;
    const m = G.modal(A.genderText(`
      <h2>قبل أن تبدأ…</h2>
      <p>كل حكاية تحتاج اسمًا ووجهًا. اختر من تكون.</p>
      <input class="name" id="name-input" maxlength="14" value="${defName(gender)}" autocomplete="off" spellcheck="false">
      <div class="looks-wrap">
        <div class="looks-label">الجنس</div>
        <div class="genders" id="genders">
          <button type="button" class="gender sel" data-gender="male">ذكر</button>
          <button type="button" class="gender" data-gender="female">أنثى</button>
        </div>
      </div>
      <div class="looks-wrap">
        <div class="looks-label">شكل الشخصية</div>
        <div class="looks" id="looks"></div>
      </div>
      <p style="color:#8d8176;font-size:.85em;margin-top:1em">اسمك يبقى كما تكتبه. الجنس والشكل يبقيان معك حتى النهاية.</p>
      <div class="close-row">
        <button class="btn primary" id="name-ok">ابدأ</button>
        <button class="btn" id="name-cancel">رجوع</button>
      </div>`));
    const input = A.$('#name-input', m.bg);
    const grid = A.$('#looks', m.bg);
    const onLang = () => {
      const cur = (input.value || '').trim();
      if (!cur || isDefaultName(cur)) input.value = defName(gender);
    };
    window.addEventListener('ash:lang', onLang);

    const renderLooks = () => {
      const list = looks
        .map((L, i) => ({ L, i }))
        .filter((x) => !!x.L.o.female === (gender === 'female'));
      if (!list.some((x) => x.i === selected)) selected = list.length ? list[0].i : 0;
      grid.style.gridTemplateColumns = `repeat(${Math.max(1, list.length)},1fr)`;
      grid.innerHTML = list.map(({ L, i }) => `
        <button type="button" class="look${i === selected ? ' sel' : ''}" data-look="${i}" aria-label="${A.esc(L.name)}">
          <canvas width="18" height="26"></canvas>
          <span>${A.esc(L.name)}</span>
        </button>`).join('');
      A.$$('.look', grid).forEach((b) => {
        const c = A.$('canvas', b);
        if (c) {
          const spr = A.art.spr('hero', { look: +b.dataset.look, weapon: null, cloak: true, pose: 'idle' });
          const ctx = c.getContext('2d');
          c.width = spr.width; c.height = spr.height;
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(spr, 0, 0);
        }
        b.onclick = () => {
          selected = +b.dataset.look;
          A.$$('.look', grid).forEach((x) => x.classList.toggle('sel', x === b));
          A.audio.click();
          input.focus();
        };
      });
    };

    A.$$('.gender', m.bg).forEach((b) => {
      b.onclick = () => {
        const cur = (input.value || '').trim();
        gender = b.dataset.gender === 'female' ? 'female' : 'male';
        if (!cur || isDefaultName(cur)) input.value = defName(gender);
        A.$$('.gender', m.bg).forEach((x) => x.classList.toggle('sel', x === b));
        A.audio.click();
        renderLooks();
        input.focus();
      };
    });
    renderLooks();

    setTimeout(() => { input.focus(); input.select(); }, 60);
    const done = () => window.removeEventListener('ash:lang', onLang);
    const start = () => {
      const v = (input.value || '').trim().slice(0, 14) || defName(gender);
      done();
      m.close();
      newGame(v, selected, gender);
    };
    A.$('#name-ok', m.bg).onclick = start;
    A.$('#name-cancel', m.bg).onclick = () => { done(); m.close(); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  }

  async function newGame(name, look, gender) {
    A.audio.init();
    G.state = newState(name, look, gender);
    G.battleStarted = false;
    G.save();
    G.go('village');
    await A.story.intro();
    G.go('village');
    await A.story.firstVillage();
  }
  G.newGame = newGame;

  async function continueGame() {
    const o = G.loadRaw();
    if (!o) { showTitle(); return; }
    A.audio.init();
    G.state = o.state;
    lastSavedState = JSON.stringify(G.state);
    G.battleStarted = false;
    // ترقية حقول ناقصة (مع الحفاظ على الجنس والشكل من الحفظ القديم)
    if (!G.state.gender) G.state.gender = A.art.lookInfo(G.state.look).female ? 'female' : 'male';
    const fresh = newState(G.state.name, G.state.look, G.state.gender);
    for (const k in fresh) {
      if (G.state[k] === undefined) G.state[k] = fresh[k];
      else if (fresh[k] && typeof fresh[k] === 'object' && !Array.isArray(fresh[k])) {
        for (const kk in fresh[k]) if (G.state[k][kk] === undefined) G.state[k][kk] = fresh[k][kk];
      }
    }
    if (A.mainQuest) A.mainQuest.ensure(G.state);
    if (!G.state.postQuests) G.state.postQuests = {};
    if (A.story && A.story.epiState) A.story.epiState(G.state);
    // ترقية الحفظ القديم: من أكمل مهمة جانبية يستحق تروفيها
    Object.keys(D.quests).forEach((q) => {
      const tid = D.quests[q].trophy;
      if (tid && G.state.quests[q] === 'done') G.state.trophies[tid] = true;
    });
    G.checkPerfect(G.state);
    // من مات في نهاية التضحية لا يعود إلى القرية.
    if (G.state.ending === 'sacrifice' && G.state.flags && G.state.flags.dead) {
      G.showEnding('sacrifice', G.state.finalScore || 0);
      return;
    }
    G.toast('أهلًا بعودتك، ' + G.state.name, 'good');
    const sc = G.state.screen || { name: 'map' };
    if (G.state.postWar) {
      if (sc.name === 'location' && sc.id) G.go('location', sc.id);
      else if (sc.name === 'village') G.go('village');
      else G.go('map');
      return;
    }
    if (sc.name === 'location' && sc.id) G.go('location', sc.id);
    else if (sc.name === 'village') G.go('village');
    else G.go('map');
  }

  function showAbout() {
    G.modal(A.genderText(`
      <h2>عن اللعبة</h2>
      <p><b>رماد المملكة</b> لعبة قصة ثنائية الأبعاد بأسلوب الدارك فانتازي. أنت مدنيّ بسيط، ومملكتك على وشك السقوط.</p>
      <h3>كيف تلعب</h3>
      <p class="ks">
        <b>الخريطة:</b> اختر مكانًا للسفر. كل رحلة تكلّف أيامًا.<br>
        <b>الحركة:</b> في كل الأماكن، امشِ بالأسهم أو WASD على اللابتوب، أو المس/اسحب المشهد واستخدم أزرار السهم على الهاتف.<br>
        <b>الجمع:</b> اضغط في الوقت المناسب على الشريط لتحصل على موارد أكثر.<br>
        <b>المهام:</b> ساعد أهل القرية لتحصل على سلاح ودرع ومنجنيق.<br>
        <b>الحوار:</b> اختر أ أو ب (أو ١ / ٢). اختياراتك تغيّر النهاية.<br>
        <b>الشكل:</b> تختار ملامح شخصيتك قبل أن تبدأ، وتبقى معك حتى النهاية.<br>
        <b>القتال:</b> هجوم، دفاع، جرعة، هروب. الأعداء يلمّحون قبل ضرباتهم القوية.<br>
        <b>الجنّ:</b> بعد أيام، يظهر العارف نورس. لا ترفضه. لكن اعلم أن عهد الجنّ له ثمن: اسمك، ظلّك، أو سنوات من عمرك — وكل ثمن يغيّر نهايتك.<br>
        <b>الفوز:</b> جهّز المؤونة، اكسب حلفاء، واختر سلاحك في المعركة الأخيرة.
      </p>
      <h3>أزرار</h3>
      <p class="ks">مسافة / Enter: متابعة الحوار — ١..٤: اختيار — Esc: إغلاق النوافذ.</p>
      <h3>الحقوق</h3>
      <p class="ks">صنع وتطوير: <b>CyberTux / Nashwan</b><br>
        <a href="https://53536sg-alt.github.io/CyberTux-info/" target="_blank" rel="noopener">53536sg-alt.github.io/CyberTux-info</a></p>
      <div class="close-row"><button class="btn primary" id="about-close">فهمت</button></div>`));
    A.$('#about-close').onclick = () => A.$('.modal-bg').remove();
  }

  // ---------- مودال ----------
  G.modal = function (html, cls) {
    const bg = A.el('div', 'modal-bg');
    bg.innerHTML = `<div class="modal ${cls || ''}">${html}</div>`;
    G.stage.appendChild(bg);
    const close = () => bg.remove();
    bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
    return { bg, close };
  };

  // تأكيد بسيط قبل أي إجراء يمسح الحفظ أو يبدأ من جديد.
  G.confirm = function (opts) {
    opts = opts || {};
    const m = G.modal(`
      <h2>${A.esc(opts.title || 'تأكيد')}</h2>
      <p>${opts.text || ''}</p>
      <div class="close-row">
        <button class="btn primary" id="cf-yes">${A.esc(opts.yes || 'تأكيد')}</button>
        <button class="btn" id="cf-no">${A.esc(opts.no || 'إلغاء')}</button>
      </div>`);
    A.$('#cf-no', m.bg).onclick = m.close;
    A.$('#cf-yes', m.bg).onclick = () => { m.close(); if (opts.onYes) opts.onYes(); };
    return m;
  };

  // بعد الحرب تختفي مهام النقيب الحربيّة وحدها من السجل، ويبقى كل شيء آخر.

  G.trophyGrid = function (s) {
    s = s || G.state || {};
    const ids = Object.keys(D.trophies);
    return ids.map((id, i) => {
      const t = D.trophies[id];
      const has = !!(s.trophies && s.trophies[id]);
      return `<div class="trophy ${has ? 'got' : ''}" style="--i:${i}">
        <span class="t-ico">${has ? t.icon : '؟'}</span>
        <span class="t-txt"><b>${has ? t.name : 'مقفل'}</b><small>${has ? t.desc : (t.hint || 'أكمل المهمة المرتبطة')}</small></span>
      </div>`;
    }).join('');
  };

  G.showTrophies = function () {
    const s = G.state;
    if (!s) return;
    const ids = Object.keys(D.trophies);
    const got = ids.filter((id) => s.trophies && s.trophies[id]).length;
    const rows = D.quests ? Object.keys(D.quests).filter((q) => q !== 'supplies') : [];
    const done = rows.filter((q) => s.quests && s.quests[q] === 'done').length;
    const m = G.modal(A.genderText(`
      <h2>الجوائز <span class="trophy-count">${A.fmt(got)} / ${A.fmt(ids.length)}</span></h2>
      <p>كل مهمة جانبية تترك أثرًا. هذه هي الآثار التي تركتها حتى الآن.</p>
      <div class="trophy-grid">${G.trophyGrid(s)}</div>
      <p style="color:#a59a88">المهام المكتملة: <b>${A.fmt(done)}</b> من <b>${A.fmt(rows.length)}</b>${s.flags.foodBought ? (s.postWar ? ' — الطعام ما زال معك، تبرّع به في صندوق التبرعات.' : ' — الطعام ما زال معك، سلّمه للمشرّدين.') : ''}</p>
      <div class="close-row"><button class="btn primary" id="tr-close">إغلاق</button></div>`));
    A.$('#tr-close', m.bg).onclick = m.close;
  };

  G.showQuests = function () {
    const s = G.state;
    const post = !!s.postWar;
    const rows = D.resOrder.map((k) => {
      const d = s.delivered[k], n = D.need[k];
      const pct = Math.min(100, Math.round((d / n) * 100));
      return `<div class="req ${d >= n ? 'done' : ''}">
        <div class="r-top"><span>${A.resName(k, n)}</span><b>${A.fmt(d)} / ${A.fmt(n)}</b></div>
        <div class="r-bar"><i style="transform:scaleX(${pct / 100})"></i></div>
      </div>`;
    }).join('');
    const side = Object.keys(D.quests).filter((q) => q !== 'supplies').map((q) => {
      const st = s.quests[q];
      const stateTxt = st === 'done' ? 'تمّ' : st === 'left' ? 'تُرك' : st === 'active' ? 'جارٍ' : 'متاح';
      return `<div class="quest ${st === 'done' ? 'done' : 'active'}">
        <div><div class="q-name">${D.quests[q].name}</div><div class="q-desc">${D.quests[q].desc}</div></div>
        <div class="q-state">${stateTxt}</div>
      </div>`;
    }).join('');
    const postStats = A.story && A.story.epilogueStats ? A.story.epilogueStats(s) : null;
    const postSide = Object.keys(D.postQuests).map((q) => {
      const d = D.postQuests[q];
      const st = s.postQuests && s.postQuests[q];
      const step = postStats && postStats.steps[q];
      const stateTxt = st === 'done' ? 'تمّ' : st === 'active' ? 'جارٍ' : 'متاح';
      const prog = step ? (step.state === 'done' ? 'مكتمل' : `${A.fmt(step.value)} / ${A.fmt(step.total)}`) : '';
      return `<div class="quest ${st === 'done' ? 'done' : 'active'}">
        <div>
          <div class="q-name">${d.name}${d.keepsake ? `<span class="epi-keep">${d.keepsake}</span>` : ''}</div>
          <div class="q-desc">${d.desc}</div>
          ${st === 'active' ? `<div class="q-desc">${d.objective}</div>` : ''}
          ${step && step.state === 'active' ? `<div class="q-prog"><i style="transform:scaleX(${Math.min(1, step.value / Math.max(1, step.total))})"></i><span>${prog}</span></div>` : ''}
        </div>
        <div class="q-state">${stateTxt}</div>
      </div>`;
    }).join('');
    const trophyIds = Object.keys(D.trophies);
    const got = trophyIds.filter((id) => s.trophies && s.trophies[id]);
    const sup = G.warSupply();
    const mainPct = Math.round((sup.bonus || 0) * 100);
    const prepPct = Math.round(sup.ratio * 100);
    const epi = post && A.story && A.story.epilogueStats ? A.story.epilogueStats(s) : null;
    const canFinish = !!(epi && epi.ceremony);
    const m = G.modal(A.genderText(`
      <h2>سجلّ المهام</h2>
      ${!post && A.mainQuest ? A.mainQuest.logHtml(s) : ''}
      ${post ? `<h3>خاتمة المملكة <span class="trophy-count">${A.fmt(epi.done)} / ${A.fmt(epi.total)}</span></h3>
        <p style="color:#a59a88">${epi.ceremony
          ? 'اكتملت الفصول الأربعة، وقرأتَ الأسماء عند النار. لم يبقَ شيء ينتظرك.'
          : epi.ready
            ? 'اكتملت الفصول الأربعة. عد إلى نار دير النار لتُقرأ الأسماء ويُغلق الكتاب.'
            : 'أربعة فصول صغيرة تعيد للمملكة ما أخذته الحرب: أسماء، ضوء، طريق، وشيء أخضر.'}</p>
        ${postSide}` : ''}
      ${post ? '' : `<h3>تجهيز الدفاع</h3>
      <div class="reqbar">${rows}</div>
      <p style="color:#a59a88">قوة الدفاع الحالية: <b style="color:#e0c46a">${A.fmt(prepPct)}٪</b>${mainPct ? ` — أوامر النقيب: <b style="color:#e0c46a">+${A.fmt(mainPct)}٪</b>` : ''}. سلّم الموارد للنقيب عادل في دير النار. المؤونة لا تُستهلك من تلقاء نفسها.</p>`}
      <h3>مهام جانبية</h3>
      ${side}
      <h3>التروفيات <span class="trophy-count">${A.fmt(got.length)} / ${A.fmt(trophyIds.length)}</span></h3>
      <div class="trophy-grid">${G.trophyGrid(s)}</div>
      <h3>حلفاء</h3>
      <p>${s.flags.jinnArmy ? 'جيش الجنّ: <b>وعدك بالحضور</b>' : s.flags.jinnNoArmy ? 'جيش الجنّ: <b>رفض</b>' : s.flags.jinnUnlocked ? 'قصر الجنّ مفتوح. لم يُعقد العهد بعد.' : 'لم تسمع عن حلفاء بعد… بعد.'}</p>
      <div class="close-row" ${canFinish ? 'style="justify-content:space-between;flex-wrap:wrap"' : ''}>
        ${canFinish ? '<button class="btn primary" id="q-finish">إنهاء اللعبة <small>ملخّص الحكاية</small></button>' : ''}
        <button class="btn" id="q-close">إغلاق</button>
      </div>`));
    A.$('#q-close', m.bg).onclick = m.close;
    const fin = A.$('#q-finish', m.bg);
    if (fin) fin.onclick = () => { m.close(); G.finishGame(); };
  };

  G.showMenu = function () {
    const s = G.state;
    const post = !!s.postWar;
    const m = G.modal(`
      <h2>توقّف</h2>
      <p>${post ? 'الحرب انتهت. المملكة مفتوحة أمامك — بلا أيام ولا جيش.' : `اليوم: <b>${A.fmt(s.day)}</b> — بقي <b>${A.fmt(Math.max(0, s.daysLeft))}</b> يومًا.`}</p>
      <div class="ks" style="margin:1em 0">
        الاسم: <b>${A.esc(s.name)}</b><br>
        السمعة: <b>${A.fmt(s.rep)}</b> — البسالة: <b>${A.fmt(s.valor)}</b> — الجرعات: <b>${A.fmt(s.potions)}</b><br>
        الهجوم: <b>${A.fmt(s.atk)}</b> — الدفاع: <b>${A.fmt(s.def)}</b>${post ? `<br>التروفيات: <b>${A.fmt(G.trophyCount(s))}</b> / ${A.fmt(Object.keys(D.trophies).length)}` : ''}
      </div>
      <div class="close-row" style="justify-content:space-between;flex-wrap:wrap">
        <button class="btn ghost" id="m-sound">الصوت: ${A.audio.muted ? 'مكتوم' : 'مفتوح'}</button>
        ${(!G.isStandalone() && G.fsSupported()) ? `<button class="btn ghost" id="m-fs">${G.fsElement() ? 'إنهاء ملء الشاشة' : 'ملء الشاشة'}</button>` : ''}
        <button class="btn" id="m-trophies">الجوائز <small>التروفيات</small></button>
        <button class="btn" id="m-save">حفظ</button>
        ${post ? '<button class="btn primary" id="m-roam">تجوّل في المملكة</button>' : ''}
        <button class="btn" id="m-title">العودة للعنوان</button>
        <button class="btn primary" id="m-close">متابعة</button>
      </div>`);
    A.$('#m-close', m.bg).onclick = m.close;
    const fsToggle = A.$('#m-fs', m.bg);
    if (fsToggle) fsToggle.onclick = (e) => {
      const on = G.toggleFullscreen();
      if (on !== null) e.currentTarget.textContent = on ? 'إنهاء ملء الشاشة' : 'ملء الشاشة';
    };
    A.$('#m-save', m.bg).onclick = () => { G.save(); G.toast('تم الحفظ.', 'good'); };
    const trophies = A.$('#m-trophies', m.bg);
    if (trophies) trophies.onclick = () => { m.close(); G.showTrophies(); };
    const roam = A.$('#m-roam', m.bg);
    if (roam) roam.onclick = () => { m.close(); G.go('map'); };
    A.$('#m-sound', m.bg).onclick = (e) => {
      A.audio.init();
      const mu = A.audio.toggle();
      e.currentTarget.textContent = 'الصوت: ' + (mu ? 'مكتوم' : 'مفتوح');
    };
    A.$('#m-title', m.bg).onclick = () => {
      G.save();
      m.close();
      G.go('title');
    };
  };

  // ---------- الخريطة ----------
  function showMap() {
    const s = G.state;
    const post = !!s.postWar;
    const mode = post ? (s.ending || '') : '';
    const occupied = mode === 'bad';
    const brokenWin = mode === 'good';
    G.setBg('map', []);
    G.updateHud();
    A.audio.ambient(post ? 'end' : 'map');
    const mainTarget = A.mainQuest ? A.mainQuest.mapTarget(s) : null;
    const mainHint = A.mainQuest ? A.mainQuest.hint(s) : '';
    const epi = post && A.story && A.story.epilogueStats ? A.story.epilogueStats(s) : null;
    const spots = D.mapOrder.filter((p) => {
      const loc = D.locations[p.id];
      return !loc.postOnly || post;
    }).map((p) => {
      const loc = D.locations[p.id];
      const locked = loc.locked && !(p.id === 'jinn' && s.flags.jinnUnlocked);
      // «أنت هنا»: اللاعب داخل الموقع بالفعل (دير النار، الجبل، أو أي موقع).
      const cur = s.screen || {};
      const inScene = A.roam && A.roam.active && A.roam.status && A.roam.status().sceneId === p.id;
      const here = s.atPlace === p.id || (cur.name === 'location' && cur.id === p.id) || cur.name === p.id || inScene;
      const isMain = !post && p.id === mainTarget;
      const postQuest = !post ? null : Object.keys(POST_QUEST_PLACE).find(
        (q) => POST_QUEST_PLACE[q] === p.id && s.postQuests && s.postQuests[q] === 'active'
      );
      let tag;
      if (here) tag = '<span class="tag here-tag">أنت هنا</span>';
      else if (locked) tag = '<span class="tag">مغلق</span>';
      else if (postQuest) tag = '<span class="tag main-tag">مهمة</span>';
      else if (post) tag = `<span class="tag">${p.id === 'palace' ? (occupied ? 'محتل' : brokenWin ? 'يُرمَّم' : 'الملك') : 'بلا وقت'}</span>`;
      else if (loc.travel) tag = `<span class="tag">${A.fmt(loc.travel)} يوم</span>`;
      else tag = `<span class="tag">${loc.free ? 'بلا وقت' : 'هنا'}</span>`;
      return `<button class="spot ${locked ? 'locked' : ''} ${here ? 'here' : ''} ${p.id === 'palace' ? 'crown' : ''} ${isMain ? 'main-target' : ''}" style="left:${p.x}%;top:${p.y}%" data-loc="${p.id}" data-name="${A.esc(loc.name)}" data-desc="${A.esc(loc.desc)}"${here ? ' data-here="1" aria-disabled="true"' : ''}${isMain ? ' data-main="1"' : ''}>
        <span class="pin"></span>
        <span class="lbl">${A.esc(loc.name)}</span>
        ${isMain ? '<span class="tag main-tag">أمر النقيب</span>' : ''}
        ${tag}
      </button>`;
    }).join('');
    G.ui.innerHTML = `
      <div class="map-title">${post ? 'خريطة كالدَر بعد الحرب' : 'خريطة كالدَر'}<small>${post ? 'لا أيام، لا جيوش. فقط طرقٌ تستحق أن تُقطع.' : `بقي ${A.fmt(Math.max(0, s.daysLeft))} يومًا قبل وصول الجيش`}</small></div>
      ${spots}
      <div class="map-info" id="map-info">${post
        ? occupied
          ? A.genderText('راية العدو فوق العاصمة. الجنود في كل طريق، والمدينة تنتظر من يرفع رأسه. المكان الذي أنت فيه الآن معطّل.')
          : brokenWin
            ? A.genderText('المملكة صمدت، لكنها مكسورة. العمال يرمّمون في كل مكان. المكان الذي أنت فيه الآن معطّل.')
            : A.genderText('الناس يفتحون لك الطريق. اذهب إلى دير النار لتسمع شكرهم، أو إلى قصر الملك ليُكرّمك. المكان الذي أنت فيه الآن معطّل.')
        : A.genderText('اختر مكانًا. كل رحلة تستهلك أيامًا — والأيام هي عدّوك الحقيقي. المكان الذي أنت فيه الآن لا يحتاج سفرًا.')}${!post && mainHint ? `<span class="mq-hint">أمر النقيب: ${A.esc(mainHint)}</span>` : ''}</div>
      ${!post && s.daysLeft <= 4 ? '<div class="map-battle"><button class="btn" id="go-battle">الاستعداد للمعركة</button></div>' : ''}
      ${post ? `<div class="map-peace">${occupied ? 'المملكة محتلّة — تجوّل بحرّية، لكن كل مكان فيه جنود العدو.' : brokenWin ? 'ما بعد الحرب — المملكة تُرمَّم في كل مكان.' : 'ما بعد الحرب — تجوّل بحرّية. لا خطر، لا أيام.'}${epi ? ` <span class="epi-map">${A.t('خاتمة المملكة:')} ${A.fmt(epi.done)} / ${A.fmt(epi.total)}${epi.ceremony ? ' ' + A.t('— مكتملة') : epi.ready ? ' ' + A.t('— عد إلى النار') : ''}</span>` : ''}</div>` : ''}`;

    A.$$('.spot', G.ui).forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.loc;
        const loc = D.locations[id];
        // لا يمكن السفر إلى المكان الذي تقف فيه أصلًا.
        if (b.dataset.here) {
          A.audio.click();
          G.toast('أنت هنا بالفعل — لا حاجة للسفر.', 'bad');
          return;
        }
        if (loc.locked && !(id === 'jinn' && s.flags.jinnUnlocked)) {
          A.audio.click();
          G.toast('الطريق مغلق… بعد.', 'bad');
          return;
        }
        G.travel(id);
      };
      b.addEventListener('mouseenter', () => {
        const info = A.$('#map-info');
        if (!info) return;
        info.innerHTML = A.genderText(b.dataset.here
          ? `<b>${b.dataset.name}</b> — أنت هنا الآن. اختر مكانًا آخر للسفر.${b.dataset.main ? ` <span class="mq-hint">أمر النقيب: ${A.esc(mainHint)}</span>` : ''}`
          : `<b>${b.dataset.name}</b> — ${b.dataset.desc}${b.dataset.main ? ` <span class="mq-hint">أمر النقيب: ${A.esc(mainHint)}</span>` : ''}`);
      });
    });
    const gb = A.$('#go-battle');
    if (gb) gb.onclick = () => G.confirmBattle();

    if (!post) {
      setTimeout(() => {
        if (G.screen === 'map' && s.daysLeft <= 8 && !s.flags.wizardMet && !s.flags.jinnUnlocked && !G.battleStarted) {
          A.story.wizard(false);
        }
      }, 600);
    }
  }

  async function travelTo(id) {
    if (G.mode !== 'scene' || G.screen === 'title') return;
    const s = G.state;
    const loc = D.locations[id];
    A.audio.init();
    A.audio.click();
    const cur = s.screen || {};
    const alreadyHere = s.atPlace === id || (cur.name === 'location' && cur.id === id) || cur.name === id;
    if (alreadyHere) {
      G.toast('أنت هنا بالفعل — لا حاجة للسفر.', 'bad');
      return;
    }
    const post = !!s.postWar;
    const cost = post ? 0 : loc.travel;
    // المشي إلى الجبل من موقعٍ يبدأ عند قوسه، لا من بوابة دير النار.
    if (id === 'mountain' && A.mountain) {
      if (A.mountain.pendingOutside) {
        // الخروج من بوابة الحصن: M.enter يضع اللاعب خارج البوابة.
        A.mountain.pendingGate = false;
        A.mountain.pendingPos = null;
      } else {
        const viaFortGate = !!A.mountain.pendingGate;
        const from = s.screen && s.screen.id;
        if (viaFortGate) {
          A.mountain.pendingPos = null;
        } else {
          A.mountain.pendingGate = false;
          A.mountain.pendingPos = from && from !== 'mountain' && A.mountain.entryFor
            ? A.mountain.entryFor(from)
            : null;
        }
      }
    }
    G.fade.classList.add('on');
    await A.sleep(260);
    if (cost > 0) G.spendDays(cost);
    G.go('location', id);
    A.audio.ambient(A.audio.placeMood(id, post));
    G.fade.classList.remove('on');
    await A.sleep(120);
    if (post) { G.save(); return; }
    const stop = await G.afterDays();
    if (stop) return;
    if (!s.visited[id]) {
      s.visited[id] = true;
      await arrivalScene(id);
      // مشهد الوصول لا يغيّر الشاشة، لذا يجب إزالة صندوق الحوار
      // وإلا بقي فوق أزرار الموقع وبدا اللعب متجمّدًا.
      G.clearDialogue();
    }
    G.save();
  }
  G.travel = travelTo;

  async function arrivalScene(id) {
    const loc = D.locations[id];
    if (loc.intro === 'forest') {
      await G.play([
        { w: 'narr', t: 'غابة الهمس. الهواء أثقل من صوتك، والأشجار تهمس بأسماء لا تعرفها.' },
        { w: 'narr', t: 'قالوا إن الجنّ كانوا يسكنون هنا قبل أن يُحرق. لهذا تهمس الأشجار: تحفظ أسماء من رحلوا.' },
      ]);
    } else if (loc.intro === 'mine') {
      await G.play([
        { w: 'narr', t: 'مناجم الجمر. الفوانيس ما زالت مشتعلة، كأن أحدًا تركها قبل قليل.' },
        { w: 'narr', t: 'تحت قدميك حديدٌ يكفي لصنع جيش… وحجرٌ يكفي لدفنه.' },
      ]);
    } else if (loc.intro === 'ruins') {
      await G.play([
        { w: 'narr', t: 'أنقاض قلعة الشمس. هنا بدأ كل شيء: العهد، والغابة المحروقة، والخوف.' },
        { w: 'narr', t: 'الحجر بارد رغم أن النهار لم ينتهِ بعد.' },
      ]);
    } else if (loc.intro === 'market') {
      await G.play([
        { w: 'narr', t: 'سوق الرماد. آخر مكانٍ لا يزال يبيع ويشتري.' },
        { w: 'narr', t: 'تسمع همسات: «الجيش عند النهر»… «القلعة تطفئ أنوارها»… «الجنّ عادوا».' },
      ]);
    } else if (loc.intro === 'jinn') {
      await G.play([
        { w: 'narr', t: 'الباب ينشقّ في الهواء. خلفه أرضٌ بنفسجية، وقمران، وقصرٌ لا يرمي ظلًّا.' },
        { w: 'narr', t: 'العروش الثلاثة في آخر القاعة. تسمع صوتك يعود إليك قبل أن تتكلم.' },
      ]);
    }
  }

  G.spendDays = function (n) {
    const s = G.state;
    s.daysLeft -= n;
    s.day += n;
    A.audio.day();
    G.updateHud();
    G.save();
  };

  // تسليم الموارد للنقيب
  G.deliver = async function () {
    const s = G.state;
    let gave = 0;
    const parts = [];
    D.resOrder.forEach((k) => {
      const room = Math.max(0, D.need[k] - s.delivered[k]);
      const take = Math.min(room, s.res[k] || 0);
      if (take > 0) {
        s.res[k] -= take;
        s.delivered[k] += take;
        gave += take;
        parts.push(A.fmt(take) + ' ' + A.resName(k, take));
      }
    });
    const completed = D.resOrder.every((k) => s.delivered[k] >= D.need[k]);
    if (completed && !s.flags.suppliesDone) {
      s.flags.suppliesDone = true;
      s.quests.supplies = 'done';
      s.rep += 2;
    }
    G.updateHud();
    G.save();
    if (gave > 0) {
      A.audio.coin();
      G.toast('سلّمت: ' + parts.join('، '), 'good');
    }
    await A.story.deliverScene(completed, gave > 0);
    if (G.screen === 'village') G.go('village');
  };

  // يعالج أخبار الأيام وتداعياتها. يحضر true إذا انتهى الوقت
  G.afterDays = async function () {
    const s = G.state;
    if (s.postWar) return false;
    if (s.daysLeft <= 0) {
      await G.forceBattle();
      return true;
    }
    const key = s.daysLeft;
    if (D.news[key] && !s.flags['news' + key]) {
      s.flags['news' + key] = true;
      await G.play([{ w: 'narr', t: D.news[key].text }]);
      G.save();
    }
    return false;
  };

  G.forceBattle = async function () {
    if (G.battleStarted) return;
    if (G.state && G.state.postWar) return;
    G.battleStarted = true;
    G.toast('وصل الجيش!', 'bad');
    A.audio.ambient('war');
    G.setBg('battle', []);
    await G.play([
      { w: 'narr', t: 'لم يبقَ يوم. الغبار يغطّي الشمس، والأبواب تُغلق واحدةً بعد أخرى.' },
      { w: 'narr', t: 'هذا ما جمعته. هذا كل ما لديك.' },
    ]);
    await A.story.warCouncil();
  };

  G.confirmBattle = function () {
    const s = G.state;
    if (G.battleStarted) return;
    if (s.postWar) { G.toast('انتهت الحرب. لا معركة بعد اليوم.', 'good'); return; }
    const sup = G.warSupply();
    const power = Math.round(sup.ratio * 100);
    const verdict = sup.ratio >= 0.8 ? 'السور جاهز.' : sup.ratio >= 0.45 ? 'السور يصمد… بالكاد.' : 'السور فارغ. هذه ليست معركة، هذه نهاية.';
    const m = G.modal(`
      <h2>الاستعداد للمعركة</h2>
      <p>لم يبقَ سوى <b>${A.fmt(Math.max(0, s.daysLeft))}</b> يومًا. إن بدأت المعركة الآن، لن تعود إلى الخريطة.</p>
      <p>قوة الدفاع: <b>${A.fmt(power)}٪</b> — ${verdict}</p>
      <p style="color:#a59a88">كل ما تجمعه يزيد قوّتك في القتال. الجنّ لا يقاتلون من أجل سورٍ فارغ. تأكّد أنك جمعت ما يكفي.</p>
      <div class="close-row">
        <button class="btn primary" id="battle-yes">ابدأ المعركة</button>
        <button class="btn" id="battle-no">ليس بعد</button>
      </div>`);
    A.$('#battle-no', m.bg).onclick = m.close;
    A.$('#battle-yes', m.bg).onclick = () => {
      m.close();
      G.battleStarted = true;
      A.story.warCouncil();
    };
  };

  // ---------- القرية ----------
  function npcIcon(kind) {
    const c = document.createElement('canvas');
    c.width = 34; c.height = 36;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(A.art.bust(kind), 0, 0);
    return c;
  }

  function showVillage() {
    const s = G.state;
    s.atPlace = 'village';
    if (s.postWar) { showVillagePeace(); return; }
    const hero = { kind: 'hero', x: 146, y: 226, s: 2.3, pose: 'idle', opts: G.heroOpts() };
    const actors = [
      { kind: 'soldier', x: 22, y: 218, s: 1.95, pose: 'idle', bob: true },
      { kind: 'soldier', x: 40, y: 218, s: 1.95, pose: 'idle', flip: true, bob: true },
      hero,
    ];
    if (A.village) actors.push(...A.village.populate(s));
    G.setBg('village', actors);
    G.updateHud();
    A.audio.ambient('village');

    const canBattle = s.daysLeft <= 4 || s.flags.jinnArmy || s.flags.jinnNoArmy;
    G.ui.innerHTML = A.genderText(`
      <div class="loc-head"><h2>دير النار</h2><p>الوطن — النار لا تنطفئ</p></div>
      <div class="loc-desc">الدرب طويل، والكشكات مفتوحة على جانبيه: حدّادة، عشّابة، خيّاطة، مهندس، صيّاد، وبئرٌ قديم. امشِ بينها — اقترب من أيّها ثم اضغط <b>E</b>، أو انقر على علامته لتمشي إليه.</div>
      <div class="loc-note">${s.flags.suppliesDone ? 'السور يقف. الناس يتدرّبون على الرماح. الأيام تتبقّى.' : 'اجمع الموارد وسلّمها للنقيب. المهام الجانبية تمنحك سلاحًا وأدوات.'}${s.day >= 2 && !s.flags.zainabGone ? ' امرأةٌ محجبة تجلس عند البئر وتخيط بلا عجلة.' : s.flags.zainabGone ? ' على حافة البئر، خيطٌ أحمر معلّق على الحجر.' : ''}${s.flags.foodBought ? ' الطعام الذي اشتريته ما زال دافئًا. المشرّدان ينتظران في آخر الدرب، بعد آخر محل.' : ''}</div>
      <div class="loc-actions">
        <button class="btn" data-v="quests">المهام <small>والتروفيات</small></button>
        <button class="btn" data-v="rest">استرح <small>يوم</small></button>
        ${canBattle ? '<button class="btn primary" data-v="battle">مجلس الحرب <small>المعركة الأخيرة</small></button>' : ''}
        <button class="btn ghost" data-v="map">الخريطة</button>
      </div>`);

    A.$$('[data-v]', G.ui).forEach((b) => {
      b.onclick = async () => {
        const v = b.dataset.v;
        if (v === 'map') { A.audio.click(); G.go('map'); return; }
        if (v === 'battle') { G.confirmBattle(); return; }
        if (v === 'quests') { A.audio.click(); G.showQuests(); return; }
        if (v === 'rest') {
          A.audio.click();
          G.spendDays(1);
          const heal = Math.round(s.maxHp * 0.55);
          s.hp = A.clamp(s.hp + heal, 0, s.maxHp);
          G.updateHud(); G.save();
          G.toast('استرحت. +' + A.fmt(heal) + ' صحة', 'good');
          const stop = await G.afterDays();
          if (!stop && G.screen === 'village') G.go('village');
        }
      };
    });
    A.roam.attach('village', hero);
    if (A.village) A.village.attach();

    // ثمن الاسم: أول مرة يعود فيها إلى القرية، يسأله الناس عن اسمه… ولا يعرف.
    if (s.flags.priceName && !s.flags.nameAsked && !s.flags.nameScene) {
      s.flags.nameScene = true;
      setTimeout(async () => {
        if (G.screen !== 'village' || G.mode !== 'scene') return;
        G.mode = 'talk';
        try { await A.story.nameForgotten(); } catch (err) { console.error(err); }
        G.mode = 'scene';
        if (G.screen === 'village') G.go('village');
      }, 550);
    }
    G.save();
  }

  // عالم ما بعد الحرب حسب النهاية:
  // bad = احتلال جنود الأعداء، good = ترميمات وعمّال، غيرها = سلام عادي.
  function postWarActors(s, id) {
    const mode = s && s.postWar ? (s.ending || '') : '';
    if (!mode) return [];
    const out = [];
    if (mode === 'bad') {
      if (id === 'village') {
        out.push(
          { kind: 'enemy', x: 248, y: 238, s: 2.1, pose: 'idle', bob: true, flip: true },
          { kind: 'enemy', x: 470, y: 240, s: 2.0, pose: 'idle', bob: true },
          { kind: 'enemy', x: 700, y: 238, s: 2.1, pose: 'idle', bob: true, flip: true },
          { kind: 'enemy', x: 928, y: 240, s: 2.0, pose: 'idle', bob: true },
          { kind: 'enemy', x: 1072, y: 238, s: 2.05, pose: 'idle', bob: true, flip: true }
        );
      } else if (id === 'palace') {
        out.push(
          { kind: 'enemy', x: 122, y: 232, s: 2.1, pose: 'idle', bob: true },
          { kind: 'enemy', x: 358, y: 232, s: 2.1, pose: 'idle', bob: true, flip: true },
          { kind: 'champion', x: 240, y: 206, s: 2.05, pose: 'idle', bob: true }
        );
      } else {
        out.push(
          { kind: 'enemy', x: 164, y: 220, s: 2.05, pose: 'idle', bob: true },
          { kind: 'enemy', x: 262, y: 218, s: 2.0, pose: 'idle', bob: true, flip: true },
          { kind: 'enemy', x: 366, y: 220, s: 2.1, pose: 'idle', bob: true }
        );
      }
    } else if (mode === 'good') {
      if (id === 'village') {
        out.push(
          { kind: 'mason', x: 286, y: 238, s: 2.1, pose: 'idle', bob: true },
          { kind: 'mason', x: 626, y: 238, s: 2.05, pose: 'idle', bob: true, flip: true },
          { kind: 'mason', x: 958, y: 238, s: 2.1, pose: 'idle', bob: true }
        );
      } else if (id === 'palace') {
        out.push(
          { kind: 'mason', x: 132, y: 250, s: 2.1, pose: 'idle', bob: true },
          { kind: 'mason', x: 348, y: 250, s: 2.05, pose: 'idle', bob: true, flip: true }
        );
      } else {
        out.push(
          { kind: 'mason', x: 170, y: 220, s: 2.05, pose: 'idle', bob: true },
          { kind: 'mason', x: 330, y: 220, s: 2.1, pose: 'idle', bob: true, flip: true }
        );
      }
    }
    return out;
  }

  // دير النار بعد الحرب: لا مؤونة، لا أيام — فقط ناسٌ يعرفونك.
  function showVillagePeace() {
    const s = G.state;
    s.atPlace = 'village';
    const mode = s.ending || '';
    const occupied = mode === 'bad';
    const brokenWin = mode === 'good';
    const hero = { kind: 'hero', x: 146, y: 226, s: 2.3, pose: 'idle', opts: G.heroOpts() };
    const actors = [
      hero,
    ];
    if (!occupied) {
      actors.push(
        { kind: 'soldier', x: 22, y: 218, s: 1.95, pose: 'idle', bob: true },
        { kind: 'soldier', x: 40, y: 218, s: 1.95, pose: 'idle', flip: true, bob: true }
      );
    }
    if (A.village) actors.push(...A.village.populate(s));
    actors.push(...postWarActors(s, 'village'));
    G.setBg('village', actors);
    G.updateHud();
    A.audio.ambient(occupied ? 'war' : 'village');

    const noteHead = occupied
      ? 'راية العدو فوق السور، وجنودٌ عند كل كشك. لا ملك، ولا تكريم — فقط مدينةٌ تتعلّم الصمت.'
      : brokenWin
        ? 'المدينة تُرمَّم: سقالات على البيوت، حجارة جديدة على الطريق، وأيادٍ تعمل منذ الفجر.'
        : (s.flags.honored
          ? 'الملك كرّمك. الناس لا ينسون من وقف في المقدمة.'
          : 'قصر الملك مفتوح. اذهب إليه لتُكرَّم — أو امشِ إلى الجبل، فالهواء هناك لا يطلب شيئًا.');
    const questNote = G.postQuestDone(s) < Object.keys(D.postQuests).length
      ? 'مهامٌ صغيرة ما زالت تنتظر: النقيب عادل في القرية، وسيدرا وماري ولانا في الطرق.'
      : 'اكتملت الفصول الأربعة. اذهب إلى النار — الناس ينتظرونك.';
    const foodNote = s.flags.foodBought
      ? ' الطعام الذي اشتريته ما زال دافئًا. صندوق التبرعات في منعطف الدرب ينتظرك — ضعه عند أسماء.'
      : '';
    const donationNote = s.postWar && !occupied
      ? ' في منعطف الدرب صندوق تبرعات، وأسماء أمينة التبرّعات تدوّن ما يصل. من يشتري طعامًا يذهب به إليها.'
      : '';

    const epi = A.story && A.story.epilogueStats ? A.story.epilogueStats(s) : null;
    const epiNote = epi
      ? (epi.ceremony
        ? 'خاتمة المملكة مكتملة. الأسماء على الحجر، والفوانيس مضاءة، والحديقة تنمو.'
        : epi.ready
          ? 'اكتملت الفصول الأربعة. اجلس عند النار لتُقرأ الأسماء ويُغلق الكتاب.'
          : 'أربعة فصول صغيرة تعيد للمملكة ما أخذته الحرب: أسماء، ضوء، طريق، وشيء أخضر.')
      : '';
    const epiBar = (q) => {
      const st = epi && epi.steps[q] ? epi.steps[q] : { value: 0, total: 1 };
      return `<i style="transform:scaleX(${Math.min(1, st.value / Math.max(1, st.total))})"></i>`;
    };

    G.ui.innerHTML = A.genderText(`
      <div class="loc-head"><h2>دير النار</h2><p>${occupied ? 'الوطن — تحت الاحتلال' : brokenWin ? 'الوطن — يُرمَّم' : 'الوطن — بعد الحرب'}</p></div>
      <div class="loc-desc">${occupied
        ? 'الأبواب مفتوحة على غير عادتها، والرماح التي كانت تحرسها صارت في أيدٍ أخرى. الكشكات تعمل، لكن أحدًا لا يرفع صوته.'
        : 'النار ما زالت مشتعلة، لكنها الآن نارٌ للخبز لا للحراسة. الكشكات فتحت أبوابها من جديد، والناس يمرّون ويسلّمون عليك.'}</div>
      ${epi ? `<div class="epi-card village ${epi.ceremony ? 'done' : ''}">
        <div class="epi-k">${A.t('خاتمة المملكة')} — ${nOf(epi.done, epi.total)}</div>
        <div class="epi-bars">
          <span>${epiBar('names')}</span><span>${epiBar('lanterns')}</span><span>${epiBar('wheel')}</span><span>${epiBar('garden')}</span>
        </div>
        <div class="epi-desc">${epiNote}</div>
        ${epi.ready && !epi.ceremony ? '<button class="btn primary" data-v="epilogue">اجلس عند النار <small>خاتمة المملكة</small></button>' : ''}
        ${epi.ceremony ? '<button class="btn gold" data-v="finish">إنهاء اللعبة <small>ملخّص الحكاية</small></button>' : ''}
      </div>` : ''}
      <div class="loc-note">${noteHead}<br>${questNote}${donationNote}${foodNote}</div>
      <div class="loc-actions">
        <button class="btn" data-v="quests">المهام <small>والتروفيات</small></button>
        <button class="btn primary" data-v="palace">قصر الملك <small>${occupied ? 'محتل' : 'تكريم'}</small></button>
        <button class="btn" data-v="walk">بوابة الحصن <small>إلى جبال العظام</small></button>
        <button class="btn ghost" data-v="map">الخريطة</button>
      </div>`);

    A.$$('[data-v]', G.ui).forEach((b) => {
      b.onclick = () => {
        const v = b.dataset.v;
        A.audio.click();
        if (v === 'quests') { G.showQuests(); return; }
        if (v === 'map') { G.go('map'); return; }
        if (v === 'epilogue') { G.epilogueCeremony(); return; }
        if (v === 'finish') { G.finishGame(); return; }
        if (v === 'palace') { G.go('location', 'palace'); return; }
        if (v === 'walk') {
          // الخروج من بوابة الحصن مباشرة إلى جبال العظام.
          G.exitFortGate();
        }
      };
    });
    A.roam.attach('village', hero);
    if (A.village) A.village.attach();
    G.save();
  }

  async function villageAction(id) {
    if (G.mode !== 'scene') return;
    A.audio.init();
    A.audio.click();
    const s = G.state;
    const qBefore = Object.assign({}, s.quests || {});
    G.mode = 'talk';
    try {
      if (id === 'thanks1' || id === 'thanks2' || id === 'thanks3') { await A.story.postWarThanks(id); }
      else if (id === 'captain' && s.postWar) { await A.story.postWarThanks('captain'); }
      else if (id === 'captain') { await A.story.captain(); }
      else if (id === 'smith') { await A.story.smith(); }
      else if (id === 'herb') { await A.story.herb(); }
      else if (id === 'mason') { await A.story.mason(); }
      else if (id === 'hunter') { await A.story.hunter(); }
      else if (id === 'well') { await A.story.well(); }
      else if (id === 'zainab') { await A.story.zainab(); }
      else if (id === 'wizard') { await A.story.wizard(true); }
      else if (id === 'homeless') { await A.story.homeless(); }
      else if (id === 'playground') { await A.story.playground(); }
      else if (id === 'donations') { await A.story.donations(); }
      else if (id === 'memorial' || id === 'lanterns' || id === 'garden' || id === 'caravan') {
        await A.story.epilogueTrace(id);
      }
    } catch (err) { console.error(err); }
    G.mode = 'scene';
    if (G.screen === 'village') G.go('village');
    if (A.village) A.village.afterAction(qBefore);
    G.save();
  }
  G.villageAction = villageAction;

  // مشهد خاتمة المملكة عند نار الدير.
  G.epilogueCeremony = async function () {
    const s = G.state;
    if (!s || G.mode !== 'scene') return;
    A.audio.init();
    A.audio.click();
    G.mode = 'talk';
    try { await A.story.epilogueCeremony(); } catch (err) { console.error(err); }
    G.mode = 'scene';
    if (G.screen === 'village') G.go('village');
    G.save();
  };

  // إتمام مهمة بسيطة من مهام ما بعد الحرب في مكانها المحدّد.
  G.completePostQuest = async function (qid) {
    const s = G.state;
    if (!s || !s.postQuests || s.postQuests[qid] !== 'active') return;
    if (G.mode !== 'scene') return;
    A.audio.init();
    A.audio.click();
    G.mode = 'talk';
    try { await A.story.postQuestScene(qid); } catch (err) { console.error(err); }
    G.mode = 'scene';
    if (G.screen === 'location') G.go('location', (s.screen && s.screen.id) || 'map');
    else if (G.screen === 'village') G.go('village');
    G.save();
  };

  // الخروج من بوابة الحصن مشيًا إلى جبال العظام.
  G.exitFortGate = function () {
    if (!G.state || G.mode !== 'scene' || G.screen === 'title') return;
    A.audio.init();
    A.audio.click();
    // نبدأ خارج البوابة مباشرة: الضغط على البوابة يعني أنك خرجت فعلًا.
    if (A.mountain) A.mountain.pendingOutside = true;
    G.toast('تفتح البوابة وتخرج من الحصن نحو جبال العظام.', 'good');
    Promise.resolve(G.travel('mountain')).catch((e) => console.warn(e));
  };

  // ---------- الموقع ----------
  function walkFrom(id) {
    if (A.mountain) {
      A.mountain.pendingGate = false;
      A.mountain.pendingPos = id && A.mountain.entryFor ? A.mountain.entryFor(id) : null;
    }
    G.go('location', 'mountain');
  }

  // أثر كل فصل من فصول الخاتمة داخل مكانه.
  const EPI_TRACE = {
    ruins: { q: 'names', trace: 'memorial', title: 'حجر الأسماء' },
    mine: { q: 'lanterns', trace: 'lanterns', title: 'فوانيس العائدين' },
    market: { q: 'wheel', trace: 'caravan', title: 'قافلة ماري' },
    forest: { q: 'garden', trace: 'garden', title: 'حديقة الرماد' },
  };
  const EPI_LABELS = {
    names: 'الأسماء', lanterns: 'الضوء', wheel: 'الطريق', garden: 'الأخضر',
  };
  // رقم من رقم — يُبنى بالإنجليزية مباشرة كي لا يبقى «من» في واجهة إنجليزية.
  function nOf(v, total) {
    return A.lang === 'en' ? A.fmt(v) + ' of ' + A.fmt(total) : A.fmt(v) + ' من ' + A.fmt(total);
  }

  // بطاقة «أثر الخاتمة»: تعرض الفصل داخل مكانه وما تبقّى منه.
  function epilogueCard(id) {
    const s = G.state;
    const at = EPI_TRACE[id];
    if (!s || !s.postWar || !at || !A.story || !A.story.epilogueStats) return '';
    const stats = A.story.epilogueStats(s);
    const step = stats.steps[at.q] || { state: 'offered', value: 0, total: 1 };
    const pq = D.postQuests[at.q] || {};
    let desc;
    if (step.state === 'done') {
      if (at.q === 'names') {
        desc = A.t('الأسماء محفورة:') + ' ' + stats.names.map((n) => A.t(n)).join(A.lang === 'en' ? ', ' : '، ') + '.';
      } else if (at.q === 'lanterns') desc = A.t('الفوانيس الخمسة مضاءة، والضوء يصل إلى آخر النفق.');
      else if (at.q === 'wheel') desc = A.t('العجلة تدور بلا صرير، والطريق إلى الجنوب مفتوح.');
      else desc = A.t(A.story.gardenMood(stats));
    } else if (step.state === 'active') {
      desc = A.t('الفصل جارٍ:') + ' ' + nOf(step.value, step.total) + '. ' + A.t(pq.objective || '');
    } else {
      desc = A.t('لم يبدأ بعد.') + ' ' + A.t('ابحث عن') + ' ' + A.t(pq.giver || 'صاحب الأثر') + '.';
    }
    const done = step.state === 'done';
    return `<div class="epi-card ${done ? 'done' : ''}">
      <div class="epi-k">${A.t('خاتمة المملكة')} — ${A.t(EPI_LABELS[at.q] || '')}</div>
      <div class="epi-title">${A.esc(at.title)}</div>
      <div class="epi-desc">${A.esc(desc)}</div>
      <div class="epi-meter"><i style="transform:scaleX(${Math.min(1, step.value / Math.max(1, step.total))})"></i><span>${nOf(step.value, step.total)}</span></div>
      ${done ? `<button class="btn ghost" data-a="trace" data-t="${at.trace}">${A.t('تأمّل الأثر')}</button>` : ''}
    </div>`;
  }

  function showLocation(id) {
    const s = G.state;
    const loc = D.locations[id];
    if (!loc) { G.go('map'); return; }
    s.atPlace = id;
    if (id === 'village') { G.go('village'); return; }

    // الجبل عالم 2D مستقل: كاميرا وحركة مشي بدل شاشة أزرار.
    if (id === 'mountain') {
      G.screen = 'location';
      s.screen = { name: 'location', id };
      A.mountain.enter();
      return;
    }

    const post = !!s.postWar;
    const mode = post ? (s.ending || '') : '';
    const occupied = mode === 'bad';
    const brokenWin = mode === 'good';

    // قصر الملك: مشهد التكريم — أو العرش المحتل في نهاية سقوط المملكة.
    if (id === 'palace') {
      const hero = { kind: 'hero', x: 240, y: 254, s: 2.45, pose: 'idle', opts: G.heroOpts() };
      const actors = [
        { kind: 'soldier', x: 112, y: 232, s: 2.1, pose: 'idle', bob: true },
        { kind: 'king', x: 240, y: 206, s: 2.05, pose: 'idle', bob: true },
        { kind: 'soldier', x: 368, y: 232, s: 2.1, pose: 'idle', flip: true, bob: true },
        hero,
      ];
      if (occupied) {
        actors.splice(0, 3, ...postWarActors(s, 'palace'));
      } else if (brokenWin) {
        actors.push(...postWarActors(s, 'palace'));
      }
      G.setBg('palace', actors);
      G.updateHud();
      A.audio.ambient(occupied ? 'war' : 'palace');
      G.ui.innerHTML = A.genderText(`
        <div class="loc-head"><h2>${A.esc(loc.name)}</h2><p>${A.esc(loc.sub)} — ${occupied ? 'محتل' : 'بعد الحرب'}</p></div>
        <div class="loc-desc">${A.esc(loc.desc)}</div>
        <div class="loc-note">${occupied
          ? 'العرش فارغ، وراية العدو معلّقة فوقه. الحرّاس لا يمنعونك — ينتظرون أن تفعل شيئًا يستحقّ القتل.'
          : brokenWin
            ? 'الحجر يُرمَّم، والضوء يعود إلى القاعة. الملك ينتظرك — والمدينة تعمل خلف الأبواب.'
            : (s.flags.honored ? 'الملك يعرفك الآن بالاسم. القاعة أهدأ من أن تحتاج إلى حرّاس.' : 'الملك ينتظرك. لا تجعله ينتظر طويلًا — الملوك يكبرون بسرعة.')}</div>
        <div class="loc-actions">
          ${occupied ? '' : `<button class="btn primary" data-a="king">${s.flags.honored ? 'الجلوس مع الملك' : 'مقابلة الملك'} <small>تكريم</small></button>`}
          <button class="btn ghost" data-a="walk">امشِ إلى الجبل <small>على قدميك</small></button>
          <button class="btn ghost" data-a="back">عودة للخريطة <small>بلا وقت</small></button>
        </div>`);
      A.$$('[data-a]', G.ui).forEach((b) => {
        b.onclick = async () => {
          const a = b.dataset.a;
          if (a === 'back') { A.audio.click(); G.go('map'); return; }
          if (a === 'walk') { A.audio.click(); G.go('location', 'mountain'); return; }
          if (a === 'king') {
            if (G.mode !== 'scene') return;
            A.audio.init(); A.audio.click();
            G.mode = 'talk';
            try { await A.story.kingHonor(); } catch (err) { console.error(err); }
            G.mode = 'scene';
            if (G.screen === 'location' && s.screen && s.screen.id === 'palace') G.go('location', 'palace');
            G.save();
          }
        };
      });
      A.roam.attach('palace', hero);
      G.save();
      return;
    }

    const hero = { kind: 'hero', x: 84, y: id === 'market' ? 242 : 216, s: 2.3, pose: 'idle', opts: G.heroOpts() };
    const actors = [hero];
    if (id === 'forest') actors.push({ kind: 'hunter', x: 386, y: 212, s: 2.2, pose: 'idle', flip: true, bob: true });
    if (id === 'market') {
      actors.push({ kind: 'herbalist', x: 118, y: 244, s: 2.05, pose: 'idle', bob: true });
      actors.push({ kind: 'smith', x: 390, y: 244, s: 2.05, pose: 'idle', flip: true, bob: true });
    }
    const npcSpots = {
      market: { id: 'mari', name: 'ماري', role: 'دلالة القوافل', bust: 'mari' },
      forest: { id: 'lana', name: 'لانا', role: 'راعية', bust: 'lana' },
      mine: { id: 'sidra', name: 'سيدرا', role: 'حارسة الفوانيس', bust: 'sidra' },
    };
    const npc = npcSpots[id];
    if (npc) actors.push({ kind: npc.id, x: 300, y: id === 'market' ? 240 : 212, s: 2.15, pose: 'idle', flip: true, bob: true });
    actors.push(...postWarActors(s, id));
    G.setBg(loc.bg, actors);
    G.updateHud();
    A.audio.ambient(A.audio.placeMood(id, post));

    const actions = [];
    const mainHere = !post && !!A.mainQuest && A.mainQuest.canAct(s, id);
    if (mainHere) {
      actions.push(`<button class="btn primary main-act" data-a="main">${A.esc(A.mainQuest.actionLabel(s, id))} <small>أمر النقيب</small></button>`);
    }
    if (!post) {
      if (loc.gather) actions.push(`<button class="btn primary" data-a="gather">جمع الموارد <small>يوم واحد</small></button>`);
      if (id === 'ruins') actions.push(`<button class="btn" data-a="explore">استكشاف الأنقاض <small>يوم</small></button>`);
      else if (loc.gather) actions.push(`<button class="btn" data-a="explore">استكشاف <small>يوم</small></button>`);
    } else {
      actions.push(`<button class="btn primary" data-a="breathe">تأمّل المكان <small>بلا وقت</small></button>`);
      Object.keys(POST_QUEST_PLACE).forEach((q) => {
        if (POST_QUEST_PLACE[q] !== id) return;
        if (!s.postQuests || s.postQuests[q] !== 'active') return;
        actions.push(`<button class="btn" data-a="postq" data-q="${q}">${A.esc(D.postQuests[q].objective)} <small>مهمة ما بعد الحرب</small></button>`);
      });
    }
    if (id === 'market') actions.push(`<button class="btn primary" data-a="trade">مقايضة</button>`);
    if (npc) actions.push(`<button class="btn" data-a="npc">${npc.name} <small>${npc.role}</small></button>`);
    if (id === 'jinn') {
      if (!s.jinnDeal) actions.push(`<button class="btn primary" data-a="court">دخول القصر</button>`);
      else actions.push(`<button class="btn" data-a="court">لقاء العرش</button>`);
    }
    if (post) actions.push(`<button class="btn ghost" data-a="walk">امشِ إلى الجبل <small>على قدميك</small></button>`);
    const backCost = post ? 0 : loc.travel;
    actions.push(`<button class="btn ghost" data-a="back">عودة للخريطة <small>${backCost ? A.fmt(backCost) + ' يوم' : 'بلا وقت'}</small></button>`);

    G.ui.innerHTML = A.genderText(`
      <div class="loc-head"><h2>${A.esc(loc.name)}</h2><p>${A.esc(loc.sub)} — ${post ? 'بعد الحرب' : loc.travel ? 'رحلة ' + A.fmt(loc.travel) + ' يوم' : 'هنا'}</p></div>
      <div class="loc-desc">${A.esc(loc.desc)}</div>
      ${epilogueCard(id)}
      <div class="loc-note">${post
        ? occupied
          ? 'المكان تحت الاحتلال. جنود العدو يمرّون بانتظام، ولا أحد يرفع رأسه طويلًا.'
          : brokenWin
            ? 'آثار الحرب تُرمَّم هنا: سقالات، حجارة جديدة، وأيادٍ لا تتوقف.'
            : 'لا جيش، ولا أيام. المكان كما تركه الناس: حيّ، ويتنفّس.'
        : id === 'market' ? 'الأسعار تُدفع موارد. لا وقت هنا — فقط صفقات.' + (s.quests.food === 'active' && !s.flags.foodBought ? ' المطاعم على الضفة تبيع طعامًا للمشرّدين — اقترب من أحدها واضغط E.' : '') : id === 'jinn' ? A.genderText('لا تنحنِ لهم. ولا تَعِد بما لا تستطيع.') : 'كل يوم تبقى فيه هنا… يوم لا يعود.'}${mainHere ? ` <b class="mq-inline">أمر النقيب: ${A.esc(A.mainQuest.hint(s))}</b>` : ''}</div>
      <div class="loc-actions">${actions.join('')}</div>`);

    A.$$('[data-a]', G.ui).forEach((b) => {
      b.onclick = async () => {
        const a = b.dataset.a;
        if (a === 'back') { A.audio.click(); G.go('map'); }
        else if (a === 'walk') { A.audio.click(); walkFrom(id); }
        else if (a === 'trace' && A.story) {
          if (G.mode !== 'scene') return;
          A.audio.init(); A.audio.click();
          G.mode = 'talk';
          try { await A.story.epilogueTrace(b.dataset.t); } catch (err) { console.error(err); }
          G.mode = 'scene';
          if (G.screen === 'location') G.go('location', id);
          G.save();
        }
        else if (a === 'main' && A.mainQuest) A.mainQuest.locationAction(s, id);
        else if (a === 'gather') G.gather();
        else if (a === 'explore') G.explore();
        else if (a === 'trade') G.openMarket();
        else if (a === 'court') G.enterCourt();
        else if (a === 'postq') G.completePostQuest(b.dataset.q);
        else if (a === 'npc' && npc) locationNpc(id, npc);
        else if (a === 'breathe') {
          A.audio.click();
          const lines = {
            forest: 'تقف بين الأشجار وتسمع الهمس. هذه المرة، لا يحمل أسماء من ماتوا فقط — يحمل اسمك أيضًا، حيًّا.',
            mine: 'الفوانيس ما زالت مشتعلة. تحت قدميك حديدٌ لم يعد يحتاج إلى جيش.',
            ruins: 'الأنقاض صامتة. لم يبقَ فيها ما يُستكشف، فقط ما يُتذكّر.',
            market: 'الباعة يعودون واحدًا واحدًا. أول ما يبيعونه: خبز، لا أسلحة.',
            jinn: 'الجنّ لا يظهرون. لكن الهواء يهتزّ كأن أحدًا يبتسم.',
          };
          if (occupied) {
            G.play([{ w: 'narr', t: 'تقف ساكنًا. جنديّان يمرّان بجانبك ولا ينظران. المدينة تتعلم كيف تتنفّس تحت الرماح.' }]);
          } else if (brokenWin) {
            G.play([{ w: 'narr', t: 'صوت المطارق لا يتوقف. كل حجرٍ يُعاد إلى مكانه، وكل بابٍ يُصلَّح، يعني أن أحدًا ما زال يريد البقاء.' }]);
          } else {
            G.play([{ w: 'narr', t: lines[id] || 'تتنفّس. هذا يكفي.' }]);
          }
        }
      };
    });
    A.roam.attach(id, hero);
    if (id === 'market' && A.village) A.village.attachMarket();
    G.save();
  }

  async function locationNpc(id, npc) {
    if (G.mode !== 'scene') return;
    A.audio.init();
    A.audio.click();
    G.mode = 'talk';
    try {
      if (npc.id === 'mari') await A.story.mari();
      else if (npc.id === 'lana') await A.story.lana();
      else if (npc.id === 'sidra') await A.story.sidra();
    } catch (err) { console.error(err); }
    G.mode = 'scene';
    if (G.screen === 'location') G.go('location', id);
    G.save();
  }

  G.enterCourt = async function () {
    const s = G.state;
    G.mode = 'talk';
    if (!s.jinnDeal) await A.story.jinnCourt();
    else await A.story.jinnReturn();
    G.mode = 'scene';
    if (G.screen === 'location') G.go('location', 'jinn');
  };

  // ---------- الجمع ----------
  G.gather = async function () {
    const s = G.state;
    const id = s.screen && s.screen.id;
    const loc = D.locations[id];
    if (!loc || !loc.gather || G.mode !== 'scene') return;
    G.mode = 'talk';
    const mg = await A.battle.gatherGame(2);
    const gains = {};
    D.resOrder.forEach((k) => {
      const base = loc.gather[k];
      if (!base) return;
      gains[k] = Math.max(0, A.rand(base[0], base[1]) + Math.min(4, mg.bonus));
    });
    let parts = [];
    for (const k in gains) { s.res[k] += gains[k]; parts.push('+' + A.fmt(gains[k]) + ' ' + A.resName(k, gains[k])); }
    A.audio.coin();
    G.toast('جمعت: ' + parts.join('، '), 'good');
    G.updateHud();
    G.spendDays(1);
    G.go('location', id);
    await G.say('narr', mg.perfect >= 2 ? 'يداك تعرفان الطريق. حملت أكثر ممّا توقّعت.' : mg.bonus >= 2 ? 'عملٌ جيد. الحمولة تكفي ليومين.' : 'الحمولة خفيفة. ربما تسرّعت.');
    const stop = await G.afterDays();
    if (stop) return;
    // خطر
    if (Math.random() < loc.danger) {
      const e = A.pick(loc.enemies);
      const intro = A.DATA.enemies[e].intro;
      G.setBg(loc.bg, []);
      await G.play([{ w: 'narr', t: intro }]);
      const r = await A.battle.start(e);
      G.mode = 'scene';
      if (!r) { G.go('location', id); return; }
      if (r.win) G.toast('نجوت من الهجوم.', 'good');
    }
    G.mode = 'scene';
    if (G.screen === 'location') G.go('location', id);
    G.save();
  };

  G.explore = async function () {
    const s = G.state;
    const id = s.screen && s.screen.id;
    const loc = D.locations[id];
    if (!loc || G.mode !== 'scene') return;
    G.mode = 'talk';
    if (id === 'ruins') {
      await A.story.ruinsExplore();
    } else if (id === 'market') {
      await A.story.market();
      G.mode = 'scene';
      return;
    } else {
      const lore = A.pick(D.lore[id] || D.lore.village);
      await G.play([{ w: 'narr', t: lore }]);
      if (Math.random() < 0.5) {
        const k = A.pick(Object.keys(loc.gather || { herb: [1, 2] }));
        const amt = loc.gather ? loc.gather[k][0] : 1;
        s.res[k] += amt;
        G.toast('وجدت ' + A.fmt(amt) + ' ' + A.resName(k, amt), 'good');
        G.updateHud();
      }
    }
    G.spendDays(1);
    G.go('location', id);
    const stop = await G.afterDays();
    if (stop) return;
    if (Math.random() < (loc.danger || 0) * 0.75) {
      const e = A.pick(loc.enemies);
      await G.play([{ w: 'narr', t: D.enemies[e].intro }]);
      await A.battle.start(e);
      G.mode = 'scene';
    }
    G.mode = 'scene';
    if (G.screen === 'location') G.go('location', id);
    G.save();
  };

  // ---------- مطاعم السوق ----------
  G.openFoodShop = function (which) {
    const s = G.state;
    if (!s) return;
    const post = !!s.postWar;
    // لا تعرف أن هناك جائعين قبل أن تلقاهم بنفسك في آخر الدرب.
    if (!post && (s.quests || {}).food !== 'active' && (s.quests || {}).food !== 'done') {
      G.toast('لا تعرف بعد لمن تشتري. اذهب إلى آخر درب الحصن وتحدّث إلى المشرّدين أولًا.', 'bad');
      return;
    }
    if (s.flags.foodBought) {
      G.toast(post
        ? 'لديك طعامٌ دافئ. تبرّع به في صندوق التبرعات داخل الحصن.'
        : 'لديك طعامٌ دافئ. خذه إلى المشرّدين في آخر الدرب.', 'good');
      return;
    }
    const shops = {
      stew: {
        name: 'مطعم قدر الرماد',
        sub: 'قدرٌ كبير يغلي منذ الفجر. صاحبه يقول إن الحرب تجعل الناس تأكل أسرع.',
        meals: [
          { label: 'حساء لحم وخبز', give: { wood: 4 }, giveText: '٤ خشب', desc: 'يكفي رجلين. ساخن، وثقيل بما يكفي ليوم.' },
          { label: 'قدر عدس وحجر ساخن', give: { stone: 3 }, giveText: '٣ حجر', desc: 'الحجر يُسخَّن ويوضع تحت القدر. طعام الفقراء… لكنه يملأ.' },
        ],
      },
      bread: {
        name: 'مخبز أم هاني',
        sub: 'امرأةٌ عجوز تبيع الخبز من تنّورٍ حجري. تقول إن الرغيف لا يسأل من يقاتل.',
        meals: [
          { label: 'رغيفان وجبن', give: { herb: 3 }, giveText: '٣ أعشاب', desc: 'الأعشاب تُقايَض هنا كأنها ملح. الخبز طازج.' },
          { label: 'خبز ولحم مقدّد', give: { iron: 2 }, giveText: '٢ حديد', desc: 'الحديد أثقل من الخبز، لكنهما يتساويان عند الجوع.' },
        ],
      },
    };
    const shop = shops[which] || shops.stew;
    const rows = shop.meals.map((meal, i) => {
      const can = Object.keys(meal.give).every((k) => (s.res[k] || 0) >= meal.give[k]);
      const cost = Object.keys(meal.give).map((k) => A.fmt(meal.give[k]) + ' ' + A.resName(k, meal.give[k])).join(' + ');
      return `<div class="quest ${can ? 'active' : ''}" style="align-items:center">
        <div><div class="q-name">${meal.label}</div><div class="q-desc">${meal.desc}</div></div>
        <button class="btn ${can ? 'primary' : ''}" data-meal="${i}" ${can ? '' : 'disabled'}>${cost}</button>
      </div>`;
    }).join('');
    const m = G.modal(A.genderText(`
      <h2>${shop.name}</h2>
      <p>${shop.sub}</p>
      <p style="color:#c9a227">${post ? 'اشترِ طعامًا للمتضرّرين من الحرب. تبرّع به في صندوق التبرعات داخل الحصن.' : 'اشترِ طعامًا للمشرّدين. يكفي رجلين، ويُحمل حتى تُسلّمه.'}</p>
      ${rows}
      <p style="color:#8d8176;font-size:.9em">لديك: ${D.resOrder.map((k) => A.fmt(s.res[k] || 0) + ' ' + A.resName(k, s.res[k] || 0)).join(' — ')}</p>
      <div class="close-row"><button class="btn" id="food-close">ليس الآن</button></div>`));
    A.$('#food-close', m.bg).onclick = m.close;
    A.$$('[data-meal]', m.bg).forEach((b) => {
      b.onclick = () => {
        const meal = shop.meals[+b.dataset.meal];
        if (!meal) return;
        if (!Object.keys(meal.give).every((k) => (s.res[k] || 0) >= meal.give[k])) return;
        m.close();
        const spend = {};
        for (const k in meal.give) spend[k] = -meal.give[k];
        G.apply({ res: spend, flag: 'foodBought' });
        s.flags.foodFrom = shop.name;
        G.toast(post
          ? 'اشتريت طعامًا. تبرّع به في صندوق التبرعات داخل الحصن.'
          : 'اشتريت طعامًا. خذه إلى مصطفى وحسن في آخر الدرب.', 'good');
        A.audio.coin();
        if (G.screen === 'location') G.go('location', 'market');
      };
    });
  };

  // ---------- السوق ----------
  // شرائح خصم السمعة: كلما عرف الناس اسمك، خفّ ما تدفعه.
  const MARKET_TIERS = [
    { min: 45, pct: 50 },
    { min: 25, pct: 35 },
    { min: 10, pct: 20 },
  ];
  G.marketTier = function (s) {
    const rep = (s && s.rep) || 0;
    for (const t of MARKET_TIERS) if (rep >= t.min) return { pct: t.pct, min: t.min, rep };
    return { pct: 0, min: 10, rep };
  };
  G.marketCost = function (t, s) {
    const pct = G.marketTier(s).pct;
    const give = {};
    for (const k in t.give) give[k] = Math.max(1, Math.floor(t.give[k] * (1 - pct / 100)));
    return give;
  };
  G.openMarket = function () {
    const s = G.state;
    const render = () => {
      const tier = G.marketTier(s);
      const next = MARKET_TIERS.slice().reverse().find((t) => s.rep < t.min);
      const discountNote = tier.pct > 0
        ? `خصم السمعة: <b>${A.pct(tier.pct)}</b> — سمعتك: ${A.fmt(s.rep || 0)}.`
        : `لا خصم بعد. عند سمعة ${A.fmt(10)} يبدأ التاجر بتخفيض السعر.`;
      const nextNote = tier.pct > 0 && next
        ? ` عند سمعة ${A.fmt(next.min)} يصبح الخصم ${A.pct(next.pct)}.`
        : '';
      const arrow = A.lang === 'en' ? '→' : '←';
      const rows = D.trades.map((t, i) => {
        const give = G.marketCost(t, s);
        const can = Object.keys(give).every((k) => s.res[k] >= give[k]);
        const cost = Object.keys(give).map((k) => A.fmt(give[k]) + ' ' + A.resName(k, give[k])).join(' + ');
        const oldCost = Object.keys(t.give).map((k) => A.fmt(t.give[k]) + ' ' + A.resName(k, t.give[k])).join(' + ');
        const saved = tier.pct > 0 && oldCost !== cost ? ` · <span class="mq-hint">السعر القديم:</span> <s>${oldCost}</s>` : '';
        const gain = Object.keys(t.take).map((k) => A.fmt(t.take[k]) + ' ' + A.resName(k, t.take[k])).join(' + ');
        return `<div class="quest ${can ? 'active' : ''}" style="align-items:center">
          <div><div class="q-name">${cost} ${arrow} ${gain}</div><div class="q-desc">${can ? 'صفقة متاحة' : 'لا تملك ما يكفي'}${saved}</div></div>
          <button class="btn ${can ? 'primary' : ''}" data-trade="${i}" ${can ? '' : 'disabled'}>تبادل</button>
        </div>`;
      }).join('');
      const held = D.resOrder.map((k) => `${A.resName(k, s.res[k])}: <b>${A.fmt(s.res[k])}</b>`).join(' — ');
      return `<h2>سوق الرماد</h2>
        <p>لا ذهب هنا. كل شيء يُقاس بما تحمله.</p>
        <div class="ks" style="margin:1em 0">${held}</div>
        <div class="ks" style="margin:0 0 1em">${discountNote}${nextNote}</div>
        ${rows}
        <p style="color:#8d8176;font-size:.85em;margin-top:1em">المقايضة لا تكلّف أيامًا. التاجر لا يسأل من أين جاء الحديد — لكنه يعرف اسمك.</p>
        <div class="close-row"><button class="btn" id="market-close">إغلاق</button></div>`;
    };
    const m = G.modal(render());
    const wire = () => {
      A.$('#market-close', m.bg).onclick = m.close;
      A.$$('[data-trade]', m.bg).forEach((b) => {
        b.onclick = () => {
          const t = D.trades[+b.dataset.trade];
          const give = G.marketCost(t, s);
          if (!Object.keys(give).every((k) => s.res[k] >= give[k])) return;
          A.audio.coin();
          for (const k in give) s.res[k] -= give[k];
          for (const k in t.take) s.res[k] += t.take[k];
          G.updateHud(); G.save();
          m.bg.querySelector('.modal').innerHTML = render();
          wire();
          G.toast('تمّت المقايضة.', 'good');
        };
      });
    };
    wire();
  };

  // تجهيز الدفاع: المسلَّم + ما بيدك، بحدّ المطلوب لكل مادة.
  G.warSupply = function () {
    const s = G.state;
    let needTot = 0, gotTot = 0, delTot = 0;
    D.resOrder.forEach((k) => {
      const need = D.need[k];
      const del = Math.min(need, s.delivered[k] || 0);
      const held = Math.min(need - del, s.res[k] || 0);
      needTot += need;
      delTot += del;
      gotTot += del + held;
    });
    const bonus = A.clamp((s.main && s.main.done) || 0, 0, D.mainQuests.length) * 0.08;
    return { needTot, gotTot, delTot, bonus, ratio: A.clamp(gotTot / needTot + bonus, 0, 1) };
  };

  // قوة الحرب: الموارد تمنح هجومًا ودفاعًا إضافيين داخل كل قتال.
  G.warStrength = function () {
    const r = G.warSupply().ratio;
    return {
      ratio: r,
      atk: Math.round(r * 4),
      def: Math.round(r * 2),
      // مجال أوسع في القوس والمنجنيق، وزحف أبطأ للأعداء
      acc: r * 12,
      slow: r * 0.12,
    };
  };

  // ---------- المعركة الأخيرة ----------
  G.finishBattle = async function (res) {
    const s = G.state;
    A.audio.afterBattle();
    const sup = G.warSupply();
    const ratio = sup.ratio;
    const sideIds = ['smith', 'herb', 'catapult', 'bow', 'child', 'ring', 'zainab', 'mari', 'lana', 'sidra', 'food'];
    const side = sideIds.filter((q) => s.quests[q] === 'done' || (q === 'ring' && s.flags.leftRing)).length;
    const jinnVoices = Math.min(3, s.jinnDeal || 0);
    // الجنّ لا يقاتلون من أجل سورٍ فارغ: مساعدتهم مشروطة بحدّ أدنى من التجهيز.
    const jinnHelps = ratio >= 0.5;
    const jinn = jinnHelps ? jinnVoices * 3 : 0;
    if (jinnVoices > 0 && !jinnHelps) s.flags.jinnAbandoned = true;
    else s.flags.jinnJoined = jinnVoices > 0;

    const wins = res && res.waves ? res.waves.filter((w) => w && w.win).length : 0;
    let weapon = 2;
    if (res) {
      weapon = res.win ? 8 : 2;
      // كل موجة إضافية تُثبت أن السور صمد أطول
      if (res.totalWaves && res.win) weapon += Math.min(2, Math.max(0, res.totalWaves - 1));
    }
    const hpBonus = Math.round((s.hp / s.maxHp) * 4);
    const pot = Math.min(2, s.potions);

    // ٥٥ تجهيز + ٢٢ مهام + ٩ جنّ + ١٠ سلاح + ٤ صحة + ٢ جرعات = ١٠٢ (تُقصّ عند ١٠٠)
    const raw = ratio * 55 + side * 2 + jinn + weapon + hpBonus + pot;
    let score = Math.min(100, Math.round(raw));
    // شرط صريح: التجهيز الناقص يعني السقوط حتى لو ساعد الجنّ أو فاز في القتال.
    if (ratio < 0.45) score = Math.min(score, 43);
    if (ratio < 0.2) score = Math.min(score, 22);

    // ثمن السنوات: الجنّ يستردّون الأربع سنوات في أحرج لحظة، فيصمد السور بموت من حماه.
    if (s.flags.priceYearsDoom) {
      s.flags.sacrifice = true;
      s.flags.dead = true;
      s.flags.mercy = false;
      s.flags.execute = false;
      s.flags.twist = false;
      s.flags.peace = false;
      // مشهد حيّ: قتال آلي أمام البوابة، سقوط، ثم وابل سهام الجيش والنصر.
      await G.sacrificeFinale(score, res);
      return;
    }

    await G.play([
      { w: 'narr', t: 'الغبار يهدأ. لا أحد يصرخ. هذه أسوأ من صرخة.' },
      { w: 'narr', t: jinnHelps && jinnVoices > 0
        ? 'على الأفق البعيد، يمرّ ضوءٌ بلون النار والضباب. الجنّ أوفوا بوعدهم.'
        : (jinnVoices > 0
          ? 'على التلّ، نار الجنّ تخبو… ثم تنطفئ. لا أحد يقاتل من أجل جدارٍ خالٍ.'
          : 'لا حلفاء. لا معجزات. فقط ما جمعته بيديك.') },
      { w: 'narr', t: ratio < 0.45
        ? 'تنظر إلى الساحة: صناديق فارغة، رماحٌ بلا رؤوس، وجرحى بلا ضمادات. لم يكن هذا دفاعًا… كان انتظارًا.'
        : (ratio < 0.8
          ? 'السور صمد. ليس كما ينبغي، لكنه صمد. بعض الصناديق ما زالت فارغة.'
          : 'السور يقف كأنه لم يُلمس. ما جمعته بيديك كان أصلب من الحجر.') },
      ...(res && res.totalWaves ? [{ w: 'narr', t: res.win
        ? 'مرّت ' + A.fmt(res.totalWaves) + ' موجات. وأنت ما زلت واقفًا.'
        : 'لم تصمد كل الموجات. انكسر صفٌّ، ثم انفتح الطريق خلفه.' }] : []),
      { w: 'narr', t: 'فارسٌ أسود يزحف على الأرض، درعه مكسور. إنه قائد الرماد.' },
    ]);

    // مشهد الإنهاء: البطل يقف فوق القائد، ثم يختار الرحمة أو «تقتله» (فتلة) أو السلام.
    let choice = 0;
    if (A.cinema && A.cinema.lastDuel) {
      choice = await A.cinema.lastDuel();
    } else {
      const picked = await G.ask([
        { label: 'ارحمه.', sub: 'دعه يحمل خبر الهزيمة' },
        { label: 'تقتله.', sub: 'أدر النصل قبل أن تسحبه', danger: true },
        { label: 'اعرض السلام.', sub: 'لنا أسماء… وأنتم تملكون رمادًا', req: (st) => st.flags.jinnArmy || st.flags.suppliesDone, reqText: 'تحتاج موقف قوّة (جيش الجنّ أو تجهيز كامل)' },
      ]);
      // الفهرس الأصلي: 0 رحمة، 2 فتلة، 3 سلام.
      choice = [0, 2, 3][picked] || 0;
      if (choice === 0) await G.play([{ w: 'narr', t: 'تنحني وتأخذ سيفه. لا تقتله. لم يفهم لماذا، وأنت أيضًا.' }]);
      else if (choice === 1) await G.play([{ w: 'narr', t: 'تغرس السيف. الرماد لا يصرخ. فقط يزداد.' }]);
      else if (choice === 2) await G.play([{ w: 'narr', t: 'تُدخل السيف، ثم تفتله. جسد القائد ينتفض مرة واحدة، ثم يستسلم للرماد.' }]);
      else await G.play([
        { w: 'narr', t: 'تكتب على درعه المكسور: «لنا أسماء، وأنتم تملكون رمادًا. لنتفاوض».' },
        { w: 'narr', t: 'لا تعرف إن كان أحدٌ سيقرأ. لكن الكلمة الأولى في الحكاية دائمًا تُكتب قبل النهاية.' },
      ]);
    }

    if (choice === 0) s.flags.mercy = true;
    else if (choice === 1) s.flags.execute = true;
    else if (choice === 2) { s.flags.execute = true; s.flags.twist = true; }
    else s.flags.peace = true;

    s.ending = A.story.tierOf(score);
    // النهايات الناجحة فقط تُكرَّم، والتكريم نفسه لا يتغيّر بتغيّر النهاية.
    // الخسارة (bad) والتضحية (sacrifice) لا تكريم فيهما.
    if (['best', 'good', 'neutral'].indexOf(s.ending) >= 0 && A.cinema && !s.flags.honored) {
      await A.cinema.palaceHonor(s.ending);
    }
    G.showEnding(s.ending, score, res);
  };

  G.showEnding = function (tier, score, res) {
    const s = G.state;
    if (typeof score === 'number' && isFinite(score)) s.finalScore = score;
    else score = typeof s.finalScore === 'number' ? s.finalScore : 0;
    G.screen = 'end';
    G.hideChrome();
    G.clearDialogue();
    G.ui.innerHTML = '';
    G.setBg(tier === 'sacrifice' ? 'dawn' : (tier === 'best') ? 'dawn' : tier === 'good' ? 'dawn' : tier === 'neutral' ? 'battle' : 'ruins', []);
    A.audio.stopAmbient();
    A.audio.ambient(tier === 'bad' ? 'sorrow' : 'end');
    const titles = {
      sacrifice: 'الفجر الذي لم تره',
      best: 'فجرٌ رمادي',
      good: 'نصرٌ مكسور',
      neutral: 'مملكة الرماد',
      bad: 'سقوط كالدَر',
    };
    const kinds = {
      sacrifice: 'نهاية: تضحية',
      best: 'نهاية: نصرٌ كلّف كل شيء',
      good: 'نهاية: نجاة',
      neutral: 'نهاية: صبرٌ طويل',
      bad: 'نهاية: رماد',
    };
    const sup = G.warSupply();
    const sideIds = ['smith', 'herb', 'catapult', 'bow', 'child', 'ring', 'zainab', 'mari', 'lana', 'sidra', 'food'];
    const side = sideIds.filter((q) => s.quests[q] === 'done' || (q === 'ring' && s.flags.leftRing)).length;
    const trophyTotal = Object.keys(D.trophies).length;
    const trophyGot = G.trophyCount(s);
    const trophyList = Object.keys(D.trophies).filter((id) => s.trophies && s.trophies[id])
      .map((id) => `<span class="end-trophy" title="${A.esc(D.trophies[id].desc)}">${D.trophies[id].icon} ${A.esc(D.trophies[id].name)}</span>`).join('');
    const weapons = { bow: 'القوس', sword: 'السيف', catapult: 'المنجنيق' };
    const ep = A.story.epilogue(tier, s.flags);
    const isSacrifice = tier === 'sacrifice';
    const wrap = A.el('div', 'end-wrap');
    wrap.innerHTML = `
      <div class="end-panel">
        <h1>${titles[tier]}</h1>
        <div class="end-kind">${kinds[tier]}</div>
        <div class="end-text">${A.rich(A.genderText(ep))}</div>
        <div class="end-stats">
          <div><span>الأيام حتى النهاية</span><b>${A.fmt(D.maxDays)}</b></div>
          <div><span>تجهيز الدفاع</span><b>${A.pct(sup.ratio * 100)}</b></div>
          <div><span>المهام الجانبية</span><b>${A.fmt(side)} / ${A.fmt(sideIds.length)}</b></div>
          <div><span>التروفيات</span><b>${A.fmt(trophyGot)} / ${A.fmt(trophyTotal)}</b></div>
          <div><span>أصوات الجنّ</span><b>${A.fmt(Math.min(3, s.jinnDeal))} / ٣</b></div>
          <div><span>البسالة</span><b>${A.fmt(s.valor)}</b></div>
          <div><span>السمعة</span><b>${A.fmt(s.rep)}</b></div>
          <div><span>السلاح</span><b>${weapons[s.battleChoice] || '—'}</b></div>
          <div><span>النتيجة</span><b>${A.fmt(score)} / ١٠٠</b></div>
        </div>
        ${trophyList ? `<div class="end-trophy-row">${trophyList}</div>` : ''}
        <p style="color:#8d8176;font-size:.9em;text-align:center">
          ${A.genderText(isSacrifice
            ? 'هذه نهاية واحدة من خمس. جرّب أن تدفع ثمنًا آخر… أو ألّا تدفع شيئًا.'
            : tier === 'best'
              ? 'أفضل نهاية. جرّب غدًا نهايةً مختلفة — بالرحمة، أو بالسلام، أو بثمنٍ آخر.'
              : 'هناك نهايات أخرى. اختياراتك… والثمن الذي تدفعه.')}
        </p>
        ${isSacrifice
          ? `<p style="color:#c9b483;font-size:.95em;text-align:center;margin:.6em 0 0">
              لم تخرج من هذه الحرب. لكن المملكة خرجت. ومن يحمل الرماد يعرف: بعض الفجر يُشترى بمن لا يراه.
            </p>`
          : `<p style="color:#c9b483;font-size:.95em;text-align:center;margin:.6em 0 0">
              ${tier === 'bad'
                ? 'المملكة سقطت، لكنك نجوت. اخرج وتجوّل — سترى رايات العدو في كل مكان.'
                : 'لكن الحرب انتهت. المملكة ما زالت هناك، والطرق مفتوحة. اخرج وتجوّل — الناس يريدون أن يشكروك.'}
            </p>`}
        <p class="end-credit">رماد المملكة — صنع وتطوير
          <a href="https://53536sg-alt.github.io/CyberTux-info/" target="_blank" rel="noopener">CyberTux / Nashwan</a>
        </p>
        <div class="close-row" style="justify-content:center;flex-wrap:wrap">
          ${isSacrifice ? '' : `<button class="btn primary" id="end-roam">${tier === 'bad' ? 'تجوّل في المدينة المحتلّة' : 'تجوّل في المملكة'}</button>`}
          <button class="btn" id="end-again">أعد اللعب</button>
          <button class="btn ghost" id="end-title">العنوان</button>
        </div>
      </div>`;
    G.stage.appendChild(wrap);
    if (!isSacrifice) A.$('#end-roam', wrap).onclick = () => {
      wrap.remove();
      G.screen = 'map';
      if (s.screen) s.screen = { name: 'map' };
      G.go('map');
    };
    A.$('#end-again', wrap).onclick = () => {
      G.confirm({
        title: 'أعد اللعب',
        text: 'ستبدأ من اليوم الأول، وسيُمسح تقدّم هذه الرحلة (مع الاحتفاظ بنسخة احتياطية حيث أمكن).',
        yes: 'أعد اللعب',
        no: 'إلغاء',
        onYes: () => { G.clearSave(); location.reload(); },
      });
    };
    A.$('#end-title', wrap).onclick = () => { G.save(); location.reload(); };

    // الحرب تنتهي، لكن الحكاية لا: نحفظ حالة ما بعد الحرب ليكمل اللاعب التجوّل.
    // في نهاية التضحية لا يوجد بطلٌ يعود ليتجوّل.
    s.postWar = !isSacrifice;
    s.ended = true;
    s.ending = tier;
    G.save();
  };

  // شاشة «إنهاء اللعبة»: تُفتح بعد اكتمال خاتمة المملكة، وتعرض ملخّص التقدّم والحقوق.
  G.finishGame = function () {
    const s = G.state;
    if (!s) return;
    const epi = A.story && A.story.epilogueStats ? A.story.epilogueStats(s) : null;
    if (!epi || !epi.ceremony) { G.toast('لم تكتمل الحكاية بعد.', 'bad'); return; }
    const titles = {
      sacrifice: 'الفجر الذي لم تره',
      best: 'فجرٌ رمادي',
      good: 'نصرٌ مكسور',
      neutral: 'مملكة الرماد',
      bad: 'سقوط كالدَر',
    };
    const kinds = {
      sacrifice: 'نهاية: تضحية',
      best: 'نهاية: نصرٌ كلّف كل شيء',
      good: 'نهاية: نجاة',
      neutral: 'نهاية: صبرٌ طويل',
      bad: 'نهاية: رماد',
    };
    const sideIds = ['smith', 'herb', 'catapult', 'bow', 'child', 'ring', 'zainab', 'mari', 'lana', 'sidra', 'food'];
    const side = sideIds.filter((q) => s.quests[q] === 'done' || (q === 'ring' && s.flags.leftRing)).length;
    const vis = Object.keys(D.trophies);
    const visGot = vis.filter((id) => s.trophies && s.trophies[id]).length;
    const trophyList = vis.filter((id) => s.trophies && s.trophies[id])
      .map((id) => `<span class="end-trophy" title="${A.esc(D.trophies[id].desc)}">${D.trophies[id].icon} ${A.esc(D.trophies[id].name)}</span>`).join('');
    const sc = s.screen || { name: 'map' };
    const wrap = A.el('div', 'end-wrap');
    wrap.innerHTML = `
      <div class="end-panel finish-panel">
        <h1>اكتملت الحكاية</h1>
        <div class="end-kind">${kinds[s.ending] || kinds.good} — المملكة بعد الحرب</div>
        <div class="end-text">${A.esc(s.name)} — ${A.t('ثلاثون يومًا، وحربٌ واحدة، وأربعة فصول بعدها. لم يبقَ شيء ينتظرك الآن — فقط ما تركته خلفك.')}\n\n${A.t('هذا ما بنيتَه من رماد:')}</div>
        <div class="end-stats">
          <div><span>النهاية</span><b>${titles[s.ending] || titles.good}</b></div>
          <div><span>السمعة</span><b>${A.fmt(s.rep)}</b></div>
          <div><span>البسالة</span><b>${A.fmt(s.valor)}</b></div>
          <div><span>فصول الخاتمة</span><b>${A.fmt(epi.done)} / ${A.fmt(epi.total)}</b></div>
          <div><span>الأسماء المحفورة</span><b>${A.fmt(epi.names.length)} / ${A.fmt(4)}</b></div>
          <div><span>الفوانيس المضاءة</span><b>${A.fmt(epi.lanterns)} / ${A.fmt(5)}</b></div>
          <div><span>الشتلات المغروسة</span><b>${A.fmt(epi.saplings)} / ${A.fmt(4)}</b></div>
          <div><span>المهام الجانبية</span><b>${A.fmt(side)} / ${A.fmt(sideIds.length)}</b></div>
          <div><span>التروفيات</span><b>${A.fmt(visGot)} / ${A.fmt(vis.length)}</b></div>
          <div><span>الأيام حتى النهاية</span><b>${A.fmt(s.day || D.maxDays)}</b></div>
        </div>
        ${trophyList ? `<div class="end-trophy-row">${trophyList}</div>` : ''}
        <p style="color:#c9b483;font-size:.95em;text-align:center;margin:.6em 0 0">
          ${A.genderText('حملتَ الرماد، ثم أعطيتَ المملكة أسماءً وضوءًا وطريقًا وشيئًا أخضر. شكرًا لأنك وصلت إلى النهاية.')}
        </p>
        <p class="end-credit">رماد المملكة — صنع وتطوير
          <a href="https://53536sg-alt.github.io/CyberTux-info/" target="_blank" rel="noopener">Nashwan / CyberTux</a>
        </p>
        <div class="close-row" style="justify-content:center;flex-wrap:wrap">
          <button class="btn primary" id="finish-roam">متابعة التجوّل</button>
          <button class="btn ghost" id="finish-title">العنوان</button>
        </div>
      </div>`;
    G.stage.appendChild(wrap);
    A.$('#finish-roam', wrap).onclick = () => {
      wrap.remove();
      if (sc.name === 'location' && sc.id) G.go('location', sc.id);
      else if (sc.name === 'village') G.go('village');
      else G.go('map');
    };
    A.$('#finish-title', wrap).onclick = () => { G.save(); wrap.remove(); G.go('title'); };
    G.save();
  };

  // مشهد نهاية التضحية: قتال 2D آلي، سقوط، ثم وابل سهام الجيش والنصر.
  G.sacrificeFinale = async function (score, res) {
    const s = G.state;
    if (!s) return;
    G.mode = 'scene';
    A.cinema.beginLastStand();
    A.audio.battleMusic('finalBattle');
    // حوار قصير جدًا قبل القتال، ثم يُترك المشهد للحركة كي يشاهد اللاعب.
    await G.play([
      { w: 'narr', t: 'بوقٌ من الشرق. ثم عشرة. الأفق نفسه يتحرّك.' },
      { w: 'captain', t: 'كل السهام على اليمين! لا تدعوا سلّمًا يثبت!' },
      { w: 'hero', t: 'افتحوا البوابة. أنا أحمله عنكم… إلى أن يصل الفجر.' },
      { w: 'captain', t: 'لا. لا أحد يخرج.' },
    ]);
    // القتال يدور تلقائيًا: البطل يضرب من يقترب، والمدافعون يغطّونه من فوق السور.
    G.mode = 'scene';
    A.cinema.resumeLastStand();
    A.cinema.setLastStandPhase('breach');
    await A.sleep(6500);
    // الجنّ يستردّون الأربع سنوات في أحرج لحظة.
    A.audio.ambient('sorrow');
    await G.play([
      { w: 'narr', t: 'ثم تُسحب الأربع سنوات من صدرك دفعة واحدة.' },
      { w: 'hero', t: 'لن تمرّوا.' },
    ]);
    A.cinema.setLastStandPhase('fall');
    await A.sleep(2300);
    // السور يردّ بوابل سهام يُسقط الجيش كله.
    A.cinema.setLastStandPhase('volley');
    // انتظر حتى يسقط آخر جندي في الوابل (مهما كان معدّل الإطارات).
    await A.sleep(1600);
    const vt = Date.now();
    while (Date.now() - vt < 8000) {
      const ls = A.cinema.ls;
      if (!ls || !ls.enemies.length) break;
      await A.sleep(150);
    }
    await A.sleep(1400);
    A.cinema.setLastStandPhase('victory');
    A.audio.afterBattle();
    A.audio.ambient('end');
    await A.sleep(1800);
    await G.play([
      { w: 'narr', t: 'سهام المملكة تُظلم السماء، ويسقط البحر الأسود كله أمام الباب.' },
      { w: 'narr', t: 'لم ترَ الفجر. لكن الفجر رآك.' },
    ]);
    A.cinema.setLastStandPhase('dawn');
    await A.sleep(2300);
    A.cinema.stop();
    s.ending = 'sacrifice';
    // بعد سنة: المملكة ترفع للبطل تمثالًا، والملك نفسه يقف أمامه.
    await A.cinema.memorial();
    G.showEnding('sacrifice', score, res);
  };

  // عرض سريع لنهاية التضحية (للتجربة): نفس المشهد الكامل دون حفظ.
  G.devSacrifice = async function () {
    const s = G.state;
    if (!s) return;
    s.day = D.maxDays;
    s.daysLeft = 0;
    s.flags.priceYearsDoom = true;
    s.flags.sacrifice = true;
    s.flags.dead = true;
    s.flags.mercy = false;
    s.flags.execute = false;
    s.flags.twist = false;
    s.flags.peace = false;
    s.ending = 'sacrifice';
    s.finalScore = 88;
    await G.sacrificeFinale(s.finalScore);
  };

  // ---------- أدوات ----------
  G.heroOpts = function () {
    const s = G.state;
    return {
      look: s && s.look ? s.look : 0,
      weapon: s && s.flags.bow ? 'bow' : s && s.flags.sword ? 'sword' : null,
      cloak: true,
    };
  };

  G.autoCheckWizard = function () {
    const s = G.state;
    if (!s) return;
    if (G.screen === 'map' && s.daysLeft <= 8 && !s.flags.wizardMet && !s.flags.jinnUnlocked) {
      A.story.wizard(false);
    }
  };
})(window.ASH);
