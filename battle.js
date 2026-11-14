/* ============================================================
   القتال والألعاب المصغّرة
   ============================================================ */
(function (A) {
  const B = (A.battle = {});
  const px = (x) => (x / 480) * 100 + '%';
  const py = (y) => (y / 270) * 100 + '%';

  function G() { return A.game; }
  function S() { return A.game.state; }

  function dmgPop(x, y, txt, cls) {
    const el = A.el('div', 'dmg ' + (cls || ''), txt);
    el.style.left = px(x);
    el.style.top = py(y - 20);
    G().ui.appendChild(el);
    setTimeout(() => el.remove(), 950);
  }

  // ============================================================
  //  قتال الأدوار
  // ============================================================
  B.start = async function (enemyId, opts) {
    opts = opts || {};
    const g = G(), s = S();
    if (g.mode === 'battle') return { win: false, aborted: true };
    const base = A.DATA.enemies[enemyId];
    if (!base) return { win: false };
    const E = Object.assign({}, base, { hp: base.hp, maxHp: base.hp, charging: false, poison: 0 });
    if (opts.enemyHp) { E.hp = opts.enemyHp; E.maxHp = opts.enemyHp; }
    // قوة الحرب من الموارد: هجوم ودفاع إضافيان في كل قتال
    const ws = (g.warStrength && g.warStrength()) || { atk: 0, def: 0, ratio: 0 };
    const waveLabel = (opts.wave && opts.waves)
      ? 'الموجة ' + A.fmt(opts.wave) + ' / ' + A.fmt(opts.waves)
      : A.esc(E.title || '');
    const prepLabel = ws.ratio > 0.01 ? ' · تجهيز ' + A.fmt(Math.round(ws.ratio * 100)) + '٪' : '';

    g.mode = 'battle';
    g.hideChrome();
    A.audio.battleMusic(opts.final ? 'finalBattle' : 'battle');

    const heroA = { kind: 'hero', x: 142, y: 208, s: 2.4, pose: 'idle', opts: g.heroOpts(), bob: false, flip: false };
    const foeA = { kind: E.sprite, x: 336, y: 208, s: E.scale, pose: 'idle', bob: false, flip: true, alpha: 1 };
    g.setBg(E.bg, [heroA, foeA], { vignette: true, tint: opts.tint });

    const wrap = A.el('div', 'battle-ui');
    wrap.innerHTML = `
      <div class="enemy-card">
        <div class="ec-name"><span>${A.esc(E.name)}</span><span class="lv">${waveLabel}</span></div>
        <div class="hpbar"><i style="transform:scaleX(1)"></i><span>${A.fmt(E.hp)}</span></div>
      </div>
      <div class="player-card">
        <div class="ec-name"><span>${A.esc(s.name)}</span><span class="lv">بسالة ${A.fmt(s.valor)}${prepLabel}</span></div>
        <div class="hpbar hero"><i style="transform:scaleX(${s.hp / s.maxHp})"></i><span>${A.fmt(s.hp)} / ${A.fmt(s.maxHp)}</span></div>
      </div>
      <div class="battle-log"></div>
      <div class="battle-actions"></div>`;
    g.ui.innerHTML = '';
    g.ui.appendChild(wrap);

    const $log = A.$('.battle-log', wrap);
    const $acts = A.$('.battle-actions', wrap);
    const $ehp = A.$('.enemy-card .hpbar i', wrap);
    const $ehpt = A.$('.enemy-card .hpbar span', wrap);
    const $php = A.$('.player-card .hpbar i', wrap);
    const $phpt = A.$('.player-card .hpbar span', wrap);

    const say = (t) => {
      let x = A.genderText(String(t));
      x = A.t(x);
      x = x.replace(/\{t\}/g, A.nameFor ? A.nameFor(s.name) : s.name).replace(/  +/g, ' ');
      $log.innerHTML = A.rich(x);
    };

    function refresh() {
      $ehp.style.transform = 'scaleX(' + Math.max(0, E.hp / E.maxHp) + ')';
      $ehpt.textContent = A.fmt(Math.max(0, E.hp));
      $php.style.transform = 'scaleX(' + Math.max(0, s.hp / s.maxHp) + ')';
      $phpt.textContent = A.fmt(Math.max(0, s.hp)) + ' / ' + A.fmt(s.maxHp);
      $('.player-card .lv', wrap).textContent = 'بسالة ' + A.fmt(s.valor);
      g.updateHud();
    }

    let focus = 0;
    let weakened = 0;
    let busy = false;

    function renderActions() {
      const pot = s.potions;
      $acts.innerHTML = `
        <button class="btn primary" data-act="attack">هجوم <small>${A.fmt(Math.max(1, s.atk - E.def))} ضرر تقريبًا</small></button>
        <button class="btn" data-act="guard">دفاع <small>تقليل الضرر</small></button>
        <button class="btn" data-act="potion" ${pot <= 0 ? 'disabled' : ''}>جرعة <small>${A.fmt(pot)} متبقية</small></button>
        <button class="btn ghost" data-act="flee">هروب <small>قد يفشل</small></button>`;
      A.$$('[data-act]', $acts).forEach((b) => (b.onclick = () => pickAction(b.dataset.act)));
    }

    let resolveAction = null;
    function pickAction(a) {
      if (busy || !resolveAction) return;
      const r = resolveAction;
      resolveAction = null;
      A.audio.click();
      r(a);
    }
    function waitAction() {
      renderActions();
      $acts.style.pointerEvents = 'auto';
      return new Promise((res) => {
        resolveAction = res;
        setTimeout(() => {
          // دعم لوحة المفاتيح
          const h = (e) => {
            const k = e.key;
            if (k === '1' || k === 'ArrowRight') pickAction('attack');
            else if (k === '2') pickAction('guard');
            else if (k === '3') pickAction('potion');
            else if (k === '4') pickAction('flee');
            else return;
            e.preventDefault();
            document.removeEventListener('keydown', h);
          };
          document.addEventListener('keydown', h);
          const obs = setInterval(() => {
            if (!resolveAction) { clearInterval(obs); document.removeEventListener('keydown', h); }
          }, 300);
        }, 30);
      });
    }

    function heroOpts(pose) {
      const o = g.heroOpts();
      o.pose = pose || 'idle';
      return o;
    }

    async function lunge(actor, dx, ms) {
      const sgn = actor === heroA ? 1 : -1;
      actor.dx = (actor.dx || 0) + dx * sgn;
      await A.sleep(ms || 130);
      actor.dx = 0;
    }

    function applyActor() {
      heroA.opts = heroOpts(heroA.pose);
      g.actors = [heroA, foeA];
    }

    say(E.intro || ('يواجهك ' + E.name));
    await A.sleep(900);

    // حلقة القتال
    while (E.hp > 0 && s.hp > 0) {
      busy = false;
      const act = await waitAction();
      $acts.style.pointerEvents = 'none';
      busy = true;

      if (act === 'attack') {
        heroA.pose = 'attack'; applyActor();
        if (s.flags.bow) A.audio.arrow();
        await lunge(heroA, 26, 120);
        let dmg = s.atk + (ws.atk || 0) + A.rand(-1, 2) + (focus ? 2 : 0);
        focus = 0;
        const crit = Math.random() < (s.flags.bow ? 0.26 : 0.16);
        if (crit) dmg = Math.round(dmg * 1.85);
        dmg = Math.max(1, dmg - (E.def || 0));
        E.hp -= dmg;
        A.audio.hit();
        g.shake(4, 140);
        dmgPop(336, 150, '−' + A.fmt(dmg), crit ? 'crit' : '');
        if (crit) say('**ضربة قاتلة!** ' + (E.hp > 0 ? 'تتأرجح ' + E.name + '، لكنها لا تسقط.' : ''));
        else say('تضرب ' + E.name + '.');
        refresh();
        await A.sleep(300);
        heroA.pose = 'idle'; applyActor();
      } else if (act === 'guard') {
        focus = 1;
        heroA.pose = 'guard'; applyActor();
        say('ترفع درعك وتتحمّل. الضرر القادم أقلّ، وهجومك التالي أقوى.');
        await A.sleep(320);
        heroA.pose = 'idle'; applyActor();
      } else if (act === 'potion') {
        if (s.potions <= 0) { say('لا جرعات لديك.'); await A.sleep(350); continue; }
        s.potions--;
        const heal = Math.min(16, s.maxHp - s.hp);
        s.hp += heal;
        A.audio.heal();
        dmgPop(142, 150, '+' + A.fmt(heal), 'heal');
        say('تشرب جرعة أعشاب. يعود بعض الدفء إلى أطرافك.');
        refresh();
        await A.sleep(420);
      } else if (act === 'flee') {
        if (Math.random() < 0.62) {
          A.audio.lose();
          say('تتراجع خطوتين… ثم تجري. **نجوت.**');
          await A.sleep(800);
          cleanup();
          s.rep = Math.max(0, s.rep);
          return { win: false, fled: true };
        } else {
          say('تحاول الهرب، لكن الطريق مغلق.');
          await A.sleep(500);
        }
      }

      if (E.hp <= 0) break;

      // دور العدو
      await A.sleep(180);
      $acts.style.pointerEvents = 'none';
      let atk;
      if (E.charging) {
        atk = E.chargingAtk;
        E.charging = false;
        E.chargingAtk = null;
      } else {
        atk = A.pick(E.attacks);
        if (atk.windup) {
          E.charging = true;
          E.chargingAtk = atk;
          foeA.pose = 'attack'; applyActor();
          A.audio.tower();
          say('**' + E.name + ' يستجمع قوّته…** استعدّ!');
          await A.sleep(650);
          foeA.pose = 'idle'; applyActor();
          refresh();
          continue;
        }
      }

      foeA.pose = 'attack'; applyActor();
      await lunge(foeA, 24, 130);

      if (atk.heal) {
        E.hp = Math.min(E.maxHp, E.hp + atk.heal);
        say('يتراجع ' + E.name + ' ويستعيد أنفاسه.');
        A.audio.heal();
        refresh();
        await A.sleep(450);
        foeA.pose = 'idle'; applyActor();
        continue;
      }

      let raw = A.rand(atk.dmg[0], atk.dmg[1]) - Math.floor((s.def + (ws.def || 0)) / 2);
      if (atk.effect === 'weaken') weakened = 2;
      if (focus > 0) { raw = Math.max(1, Math.round(raw * 0.35)); focus = 0; }
      raw = Math.max(0, raw);
      s.hp -= raw;
      A.audio.hurt();
      g.shake(6, 180);
      dmgPop(142, 150, '−' + A.fmt(raw), 'hurt');
      say(atk.text);
      refresh();
      await A.sleep(360);
      foeA.pose = 'idle'; applyActor();

      if (weakened > 0) {
        s.atk = Math.max(1, s.atk - 0);
        weakened--;
      }

      if (s.hp <= 0) break;
    }

    // نهاية
    let result;
    if (E.hp <= 0) {
      A.audio.win();
      say(E.death || 'سقط العدو.');
      foeA.alpha = 0.35;
      g.actors = [heroA, foeA];
      await A.sleep(700);
      const loot = E.loot || {};
      const got = [];
      const names = A.DATA.res;
      for (const k in loot) {
        s.res[k] = (s.res[k] || 0) + loot[k];
        got.push('+' + loot[k] + ' ' + names[k].name);
      }
      s.valor += E.valor || 1;
      if (s.valor >= 4 && !s.flags.vet1) { s.flags.vet1 = true; s.atk += 1; got.push('+١ هجوم'); }
      if (s.valor >= 8 && !s.flags.vet2) { s.flags.vet2 = true; s.maxHp += 4; s.hp += 4; got.push('+٤ حدّ أقصى'); }
      if (Math.random() < 0.22) { s.potions++; got.push('+١ جرعة'); }
      if (got.length) g.toast('الغنيمة: ' + got.join('، '), 'good');
      g.updateHud();
      result = { win: true, loot, valor: E.valor || 1, enemy: E.id };
    } else {
      A.audio.lose();
      say('تنهار على الأرض… يجرّك أحدهم بعيدًا قبل أن يجهز عليك.');
      s.hp = Math.max(1, Math.round(s.maxHp * 0.4));
      const rk = A.pick(A.DATA.resOrder);
      const lost = Math.min(s.res[rk], A.rand(1, 2));
      if (lost > 0) { s.res[rk] -= lost; g.toast('فقدت ' + A.fmt(lost) + ' ' + A.resName(rk, lost), 'bad'); }
      g.updateHud();
      result = { win: false, lost: true, enemy: E.id };
      await A.sleep(1100);
    }

    cleanup();
    return result;

    function cleanup() {
      wrap.remove();
      g.ui.innerHTML = '';
      g.mode = 'scene';
      g.shake(0);
      g.showChrome();
      g.updateHud();
      if (!opts.keepMusic) A.audio.afterBattle();
    }
  };

  // ============================================================
  //  معركة متعددة الموجات: عدة أعداء متتابعين مع استراحة قصيرة
  // ============================================================
  B.gauntlet = async function (waves, opts) {
    opts = opts || {};
    const g = G(), s = S();
    const results = [];
    for (let i = 0; i < waves.length; i++) {
      if (i > 0) {
        // استراحة قصيرة وشفاء بين الموجات
        const heal = Math.min(Math.round(s.maxHp * 0.18), Math.max(0, s.maxHp - s.hp));
        if (heal > 0) {
          s.hp += heal;
          A.audio.heal();
          g.toast('استراحة بين الموجات: +' + A.fmt(heal) + ' صحة', 'good');
        }
        g.updateHud();
        await A.sleep(650);
      }
      const w = waves[i];
      const res = await B.start(w.enemy || w.id, Object.assign({}, opts, {
        enemyHp: w.hp,
        tint: w.tint || opts.tint,
        wave: i + 1,
        waves: waves.length,
        keepMusic: true,
      }));
      results.push(res || { win: false });
      if (!res || !res.win) {
        return {
          win: false, waves: results, waveReached: i + 1, totalWaves: waves.length,
          fled: !!(res && res.fled),
        };
      }
      if (i < waves.length - 1) g.toast('الموجة ' + A.fmt(i + 1) + ' انكسرت. التالية تتقدّم…', 'good');
    }
    return { win: true, waves: results, waveReached: waves.length, totalWaves: waves.length };
  };

  function $(sel, root) { return (root || document).querySelector(sel); }

  // ============================================================
  //  لعبة الجمع (توقيت)
  // ============================================================
  B.gatherGame = async function (rounds) {
    rounds = rounds || 2;
    const g = G(), s = S();
    g.mode = 'minigame';
    const wrap = A.el('div', 'minigame');
    wrap.innerHTML = A.genderText(`
      <div class="mg-title"><span>اضبط يدك… واضغط في الوقت المناسب</span><small class="mg-round"></small></div>
      <div class="mg-track">
        <div class="mg-zone"></div>
        <div class="mg-marker"></div>
      </div>
      <div class="mg-hint">اضغط <b>مسافة</b> أو انقر على الشاشة</div>
      <div class="mg-pips">${'<i></i>'.repeat(rounds)}</div>
      <div class="mg-result hidden"></div>`);
    g.ui.appendChild(wrap);
    const $zone = $('.mg-zone', wrap), $marker = $('.mg-marker', wrap);
    const $round = $('.mg-round', wrap), $result = $('.mg-result', wrap);
    const $pips = A.$$('.mg-pips i', wrap);

    let spent = 0;
    let bonus = 0;
    let perfect = 0;

    for (let r = 0; r < rounds; r++) {
      $round.textContent = 'الجولة ' + A.fmt(r + 1) + ' / ' + A.fmt(rounds);
      $result.classList.add('hidden');
      const zc = 18 + Math.random() * 64;
      const zw = 20;
      $zone.style.left = Math.max(0, zc - zw / 2) + '%';
      $zone.style.width = zw + '%';
      $zone.classList.remove('perfect');

      const speed = 0.95 + r * 0.28;
      let pos = 30 + Math.random() * 40;
      let dir = Math.random() < 0.5 ? 1 : -1;
      let stopped = false;
      let raf = 0;

      await new Promise((resolve) => {
        const tick = () => {
          if (stopped) return;
          pos += dir * speed;
          if (pos > 100) { pos = 100; dir = -1; }
          if (pos < 0) { pos = 0; dir = 1; }
          $marker.style.left = pos + '%';
          raf = requestAnimationFrame(tick);
        };
        const stop = () => {
          if (stopped) return;
          stopped = true;
          cancelAnimationFrame(raf);
          const d = Math.abs(pos - zc);
          let msg, col;
          if (d < 3.2) { bonus += 2; perfect++; msg = 'إصابة كاملة! +٢'; col = 'perfect'; A.audio.coin(); }
          else if (d < zw / 2) { bonus += 1; msg = 'جيد! +١'; A.audio.gather(); }
          else { msg = 'أخطأت…'; A.audio.click(); }
          $result.className = 'mg-result';
          $result.innerHTML = A.genderText(`<div class="big">${msg}</div><div class="sm">${d < 3.2 ? 'يدك تعرف الطريق' : d < zw / 2 ? 'مقبول' : 'الموارد لا تُستعجل'}</div>`);
          if (perfect) $zone.classList.add('perfect');
          $pips[r].classList.add('on');
          setTimeout(() => { $result.classList.add('hidden'); resolve(); }, 850);
          document.removeEventListener('keydown', key);
          wrap.removeEventListener('pointerdown', stop);
        };
        const key = (e) => {
          if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); stop(); }
        };
        document.addEventListener('keydown', key);
        wrap.addEventListener('pointerdown', stop);
        raf = requestAnimationFrame(tick);
      });
    }
    wrap.remove();
    g.ui.innerHTML = '';
    g.mode = 'scene';
    return { bonus, perfect };
  };

  // ============================================================
  //  لعبة القوس (المعركة النهائية)
  // ============================================================
  B.bowGame = async function (opts) {
    opts = opts || {};
    const g = G();
    g.mode = 'minigame';
    A.audio.battleMusic(opts.final ? 'finalBattle' : 'battle');
    const lastStand = !!opts.lastStand;
    g.setBg(lastStand ? 'siege' : 'battle', [{ kind: 'hero', x: 92, y: 214, s: 2.5, pose: 'idle', opts: g.heroOpts(), bob: false }], {});
    const ws = (g.warStrength && g.warStrength()) || { ratio: 0, acc: 0, slow: 0 };

    // ثلاث موجات متتابعة، كل واحدة أسرع وأكبر
    const WAVES = lastStand
      ? [
        { total: 7, need: 3, gap: 0.6, speed: 1.0, time: 9500, name: 'زحف لا يتوقّف', label: 'الموجة الأولى' },
        { total: 9, need: 4, gap: 0.52, speed: 1.08, time: 10500, name: 'الرماح تغطّي الأفق', label: 'الموجة الثانية' },
        { total: 12, need: 5, gap: 0.44, speed: 1.16, time: 12000, name: 'البحر الأسود يقترب', label: 'الموجة الثالثة' },
      ]
      : [
        { total: 5, need: 3, gap: 0.95, speed: 1.0, time: 13000, name: 'المشاة يتقدّمون', label: 'الموجة الأولى' },
        { total: 6, need: 4, gap: 0.82, speed: 1.08, time: 13500, name: 'الرماحون يقتربون', label: 'الموجة الثانية' },
        { total: 7, need: 5, gap: 0.7, speed: 1.16, time: 14500, name: 'الحرس الأسود يزحف', label: 'الموجة الثالثة' },
      ];
    const ACC = 27 + (ws.acc || 0);   // تجهيز أعلى = مجال إصابة أوسع
    const SLOW = 1 - (ws.slow || 0);   // تجهيز أعلى = زحف أبطأ

    const wrap = A.el('div', 'battle-ui');
    wrap.innerHTML = A.genderText(lastStand
      ? `
      <div class="battle-log" style="bottom:15cqh">أنت على السور. خلفك مدافعون يرمون بكل ما بقي: سهم، سيف، حجر. أمامك بحرٌ لا ينتهي. <b>اضغط على الجنود</b> واثبت. ثلاث موجات.</div>
      <div class="enemy-card" style="top:6.5cqh;left:50%;transform:translateX(-50%);width:min(44cqw,420px);text-align:center">
        <div class="ec-name" style="justify-content:center"><span class="wave-name">الموجة الأولى</span><span class="lv">الإصابات: <b class="score">٠</b> / <b class="need">٣</b></span></div>
      </div>`
      : `
      <div class="battle-log" style="bottom:15cqh">أسقط الجنود قبل أن يصلوا إلى السور. <b>اضغط عليهم</b>. ثلاث موجات.</div>
      <div class="enemy-card" style="top:6.5cqh;left:50%;transform:translateX(-50%);width:min(44cqw,420px);text-align:center">
        <div class="ec-name" style="justify-content:center"><span class="wave-name">الموجة الأولى</span><span class="lv">الإصابات: <b class="score">٠</b> / <b class="need">٣</b></span></div>
      </div>`);
    g.ui.innerHTML = '';
    g.ui.appendChild(wrap);
    const $score = $('.score', wrap);
    const $need = $('.need', wrap);
    const $wave = $('.wave-name', wrap);
    const $log = $('.battle-log', wrap);

    const stage = document.getElementById('stage');
    const toCanvas = (e) => {
      const r = stage.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 480, y: (e.clientY - r.top) / r.height * 270 };
    };

    let state = null;
    let mouse = { x: 240, y: 135 };
    let raf = 0, last = performance.now();

    function waveState(i) {
      return {
        i, cfg: WAVES[i], soldiers: [], kills: 0, spawned: 0,
        spawnT: 0, over: false, arrows: [], timer: 0, resolve: null,
      };
    }

    function spawn() {
      const st = state;
      if (!st || st.spawned >= st.cfg.total) return;
      st.spawned++;
      st.soldiers.push({
        x: 505, y: 198 + Math.random() * 14,
        sp: (64 + Math.random() * 26) * st.cfg.speed * SLOW,
        s: 2.15 + Math.random() * 0.25, alive: true, wob: Math.random() * 6.28,
      });
    }

    function shoot(x, y) {
      const st = state;
      if (!st || st.over) return;
      let best = null, bd = 1e9;
      for (const so of st.soldiers) {
        if (!so.alive) continue;
        const dx = so.x - x, dy = (so.y - 26) - y;
        const d = Math.hypot(dx, dy);
        if (d < ACC && d < bd) { bd = d; best = so; }
      }
      st.arrows.push({ x0: 96, y0: 174, x1: x, y1: y, t0: performance.now() });
      A.audio.arrow();
      if (best) {
        best.alive = false;
        st.kills++;
        A.audio.hit();
        dmgPop(best.x, best.y - 20, 'إصابة', 'crit');
        $score.textContent = A.fmt(st.kills);
        if (st.kills >= st.cfg.need) finishWave(true);
      }
    }

    const onDown = (e) => { const p = toCanvas(e); shoot(p.x, p.y); };
    const onMove = (e) => { mouse = toCanvas(e); };
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.style.cursor = 'none';

    function update(st, dt) {
      st.spawnT -= dt;
      if (st.spawnT <= 0 && st.spawned < st.cfg.total) { spawn(); st.spawnT = st.cfg.gap; }
      for (const so of st.soldiers) {
        if (!so.alive) continue;
        so.x -= so.sp * dt;
        if (so.x < 55) so.alive = false; // عبروا السور
      }
      if (st.spawned >= st.cfg.total && st.soldiers.every((x) => !x.alive)) finishWave(false);
    }

    function loop() {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (state && !state.over) {
        update(state, dt);
        // بيانات للاختبار والوصولية: الموجة ومواضع الأعداء الحيّة
        wrap.dataset.wave = String(state.i + 1);
        wrap.dataset.kills = String(state.kills);
        wrap.dataset.enemies = state.soldiers.filter((s) => s.alive)
          .map((s) => Math.round(s.x) + ',' + Math.round(s.y - 26)).join(';');
      }
    }

    g.overlay = (ctx, t) => {
      const st = state;
      if (!st) return;
      const now = performance.now();
      for (const so of st.soldiers) {
        if (!so.alive) continue;
        const bob = Math.sin(t * 8 + so.wob) * 1;
        A.art.drawSprite(ctx, A.art.spr('soldier'), so.x, so.y + bob, so.s, true, 1);
        ctx.fillStyle = 'rgba(158,31,42,.6)';
        ctx.fillRect(Math.round(so.x) - 8, Math.round(so.y + bob) + 2, 16, 1);
      }
      for (let i = st.arrows.length - 1; i >= 0; i--) {
        const a = st.arrows[i];
        const k = (now - a.t0) / 220;
        if (k > 1) { st.arrows.splice(i, 1); continue; }
        const x = A.lerp(a.x0, a.x1, k), y = A.lerp(a.y0, a.y1, k) - Math.sin(k * Math.PI) * 16;
        ctx.strokeStyle = '#e8dcc0'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (a.x1 - a.x0) * 0.05, y + (a.y1 - a.y0) * 0.05); ctx.stroke();
      }
      // مؤشر التصويب
      ctx.strokeStyle = 'rgba(232,220,192,.8)'; ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(mouse.x) - 7, Math.round(mouse.y) - 7, 14, 14);
      ctx.fillStyle = '#e8823f'; ctx.fillRect(Math.round(mouse.x) - 1, Math.round(mouse.y) - 1, 3, 3);
      // شريط تقدّم الموجة
      ctx.fillStyle = 'rgba(10,7,16,.8)'; ctx.fillRect(150, 246, 180, 5);
      ctx.fillStyle = '#9e1f2a'; ctx.fillRect(150, 246, 180 * Math.min(1, st.spawned / st.cfg.total), 5);
    };

    function finishWave(early) {
      const st = state;
      if (!st || st.over) return;
      st.over = true;
      clearTimeout(st.timer);
      const res = { wave: st.i + 1, kills: st.kills, need: st.cfg.need, total: st.cfg.total, win: st.kills >= st.cfg.need };
      A.audio[res.win ? 'win' : 'lose']();
      $log.innerHTML = A.rich(A.genderText(res.win
        ? `**${st.cfg.label}: ${A.fmt(st.kills)} إصابة.** انكسر الصفّ… لكن غيرهم يتقدّم.`
        : `${st.cfg.label}: ${A.fmt(st.kills)} إصابة فقط. اخترقوا الصفّ الأول.`));
      setTimeout(() => { if (st.resolve) st.resolve(res); }, early ? 450 : 850);
    }

    function runWave(i) {
      state = waveState(i);
      const cfg = WAVES[i];
      $wave.textContent = cfg.label + ' — ' + cfg.name;
      $need.textContent = A.fmt(cfg.need);
      $score.textContent = A.fmt(0);
      $log.innerHTML = A.rich(A.genderText('**' + cfg.label + '.** ' + cfg.name + '. أسقط ' + A.fmt(cfg.need) + ' قبل أن يعبروا.'));
      state.timer = setTimeout(() => { if (state) finishWave(false); }, cfg.time);
      return new Promise((r) => (state.resolve = r));
    }

    function cleanup() {
      cancelAnimationFrame(raf);
      if (state) clearTimeout(state.timer);
      state = null;
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.style.cursor = '';
      g.overlay = null;
      wrap.remove();
      g.ui.innerHTML = '';
      g.mode = 'scene';
    }

    raf = requestAnimationFrame(loop);

    const results = [];
    try {
      for (let i = 0; i < WAVES.length; i++) {
        const r = await runWave(i);
        results.push(r);
        if (!r.win) break;
        if (i < WAVES.length - 1) {
          $log.innerHTML = A.rich(A.genderText('**الموجة انكسرت.** اسحب نفسًا… التالية تتحرّك.'));
          await A.sleep(1100);
        }
      }
    } catch (e) { console.error(e); }

    const cleared = results.length === WAVES.length && results.every((r) => r.win);
    const won = lastStand ? false : cleared;
    const killsTot = results.reduce((a, r) => a + r.kills, 0);
    $log.innerHTML = A.rich(A.genderText(lastStand
      ? (cleared
        ? `**ثلاث موجات… وما زال الأفق أسود.** ${A.fmt(killsTot)} إصابة. السور صمد، لكن الأعداد لا تنتهي.`
        : `**اخترقوا الصف.** ${A.fmt(killsTot)} إصابة… وهم أكثر من السهام.`)
      : (won
        ? `**ثلاث موجات صدّتها يدك.** ${A.fmt(killsTot)} إصابة. الأبراج تتقدّم الآن، لكن السور ما زال واقفًا.`
        : `الموجة ${A.fmt(results.length)} اخترقت. ${A.fmt(killsTot)} إصابة… لا تكفي.`)));
    A.audio[won ? 'win' : 'lose']();
    if (lastStand) A.audio.hurt();
    await A.sleep(lastStand ? 2100 : 1500);
    cleanup();
    return { win: won, lastStand, cleared, waves: results, waveReached: results.length, totalWaves: WAVES.length, kills: killsTot };
  };

  // ============================================================
  //  لعبة المنجنيق
  // ============================================================
  B.catapultGame = async function (opts) {
    opts = opts || {};
    const g = G();
    g.mode = 'minigame';
    A.audio.battleMusic(opts.final ? 'finalBattle' : 'battle');
    g.setBg('battle', [
      { kind: 'hero', x: 62, y: 230, s: 2.35, pose: 'idle', opts: g.heroOpts(), bob: false },
    ], {});
    const ws = (g.warStrength && g.warStrength()) || { ratio: 0 };
    // التجهيز يوسّع نافذة الإصابة
    const PAD = (ws.ratio || 0) * 5;

    // هندسة المنجنيق: محور الذراع، طول الذراع الطويل والقصير، وزاويتا الشدّ والإطلاق.
    const CAT = {
      pivot: { x: 134, y: 184 },
      long: 78,
      short: 34,
      cocked: 0.34,
      released: -0.72,
      armPoint(angle, len) {
        return { x: this.pivot.x + Math.cos(angle) * len, y: this.pivot.y + Math.sin(angle) * len };
      },
    };

    // ثلاث موجات، كل واحدة أسرع وأضيق. كل إصابة تُسقط مجموعة من ثلاثة جنود.
    const WAVES = [
      { shots: 3, need: 2, lo: 52, hi: 80, speed: 58, advance: 1.1, label: 'الموجة الأولى', name: 'كتيبة المشاة' },
      { shots: 3, need: 2, lo: 55, hi: 78, speed: 66, advance: 1.6, label: 'الموجة الثانية', name: 'حملة الرماح' },
      { shots: 4, need: 3, lo: 57, hi: 75, speed: 74, advance: 2.2, label: 'الموجة الثالثة', name: 'الزحف الأخير' },
    ];

    const wrap = A.el('div', 'battle-ui');
    wrap.innerHTML = A.genderText(`
      <div class="battle-log" style="bottom:16cqh">أنت خلف المنجنيق. أدِر الرافعة حتى تشتدّ الطاقة، ثم أطلق عندما يدخل المؤشّر المنطقة الحمراء. كل حجر يُسقط مجموعة من ثلاثة جنود. ثلاث موجات.</div>
      <div class="enemy-card" style="top:6.5cqh;left:50%;transform:translateX(-50%);width:min(40cqw,380px);text-align:center">
        <div class="ec-name" style="justify-content:center"><span class="wave-name">الموجة الأولى</span><span class="lv">مجموعات: <b class="score">٠</b> / <b class="need">٢</b></span></div>
      </div>`);
    g.ui.innerHTML = '';
    g.ui.appendChild(wrap);
    const $score = $('.score', wrap);
    const $need = $('.need', wrap);
    const $wave = $('.wave-name', wrap);
    const $log = $('.battle-log', wrap);

    let state = null;
    let raf = 0, last = performance.now();

    function enemyGroups(count) {
      const start = [432, 390, 348, 306];
      return start.slice(0, count).map((x) => ({ x, base: x, alive: true, deadAt: 0 }));
    }

    function runWave(i) {
      const cfg = WAVES[i];
      state = {
        i, cfg, value: 0, dir: 1, firing: false, shots: 0, hits: 0,
        over: false, proj: null, targets: enemyGroups(cfg.shots), resolve: null,
      };
      $wave.textContent = cfg.label + ' — ' + cfg.name;
      $need.textContent = A.fmt(cfg.need);
      $score.textContent = A.fmt(0);
      $log.innerHTML = A.rich(A.genderText('**' + cfg.label + '.** ' + cfg.name + ' تتقدّم. كل حجر يسقط ثلاثة. أطلق ' + A.fmt(cfg.need) + ' مجموعات من ' + A.fmt(cfg.shots) + ' رميات.'));
      return new Promise((r) => (state.resolve = r));
    }

    function finishWave() {
      const st = state;
      if (!st || st.over) return;
      st.over = true;
      const win = st.hits >= st.cfg.need;
      A.audio[win ? 'win' : 'lose']();
      $log.innerHTML = A.rich(A.genderText(win
        ? `**${st.cfg.label}: ${A.fmt(st.hits)} مجموعات سقطت.** ${A.fmt(st.hits * 3)} جنديًا لم يعودوا.`
        : `${st.cfg.label}: ${A.fmt(st.hits)} مجموعات فقط. الباقي يعبر فوق الحجارة.`));
      setTimeout(() => {
        if (st.resolve) st.resolve({ wave: st.i + 1, hits: st.hits, need: st.cfg.need, shots: st.shots, total: st.cfg.shots, kills: st.hits * 3, win });
      }, 900);
    }

    function fire() {
      const st = state;
      if (!st || st.firing || st.over) return;
      if (st.shots >= st.cfg.shots) return;
      st.firing = true;
      st.shots++;
      const power = st.value;
      const lo = Math.max(0, st.cfg.lo - PAD), hi = Math.min(100, st.cfg.hi + PAD);
      const hit = power >= lo && power <= hi;
      A.audio.tower();
      if (hit) {
        st.hits++;
        $score.textContent = A.fmt(st.hits);
        A.audio.hit();
        g.shake(8, 260);
      }
      const aliveTargets = st.targets.filter((t) => t.alive);
      const target = aliveTargets.length
        ? aliveTargets.reduce((a, b) => (b.x < a.x ? b : a))
        : null;
      const miss = hit ? 0 : (power < lo ? -1 : 1);
      st.proj = {
        t0: performance.now(), power, hit, target,
        ex: (target ? target.x : 420) + miss * 34,
        ey: 212,
      };
      const tip = CAT.armPoint(CAT.released, CAT.long);
      st.proj.sx = tip.x;
      st.proj.sy = tip.y;
      setTimeout(() => {
        if (state !== st) return;
        st.proj = null;
        st.firing = false;
        if (st.hits >= st.cfg.need || st.shots >= st.cfg.shots) finishWave();
      }, 950);
    }

    const onDown = () => fire();
    const onKey = (e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); fire(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);

    function loop() {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!state || state.firing || state.over) return;
      state.value += state.dir * state.cfg.speed * dt;
      if (state.value > 100) { state.value = 100; state.dir = -1; }
      if (state.value < 0) { state.value = 0; state.dir = 1; }
      // المجموعات تتقدّم نحو السور
      for (const tg of state.targets) {
        if (tg.alive) tg.x = Math.max(252, tg.x - state.cfg.advance * dt);
      }
      // بيانات للاختبار والوصولية: الطاقة ونافذة الإصابة
      const lo = Math.max(0, state.cfg.lo - PAD), hi = Math.min(100, state.cfg.hi + PAD);
      wrap.dataset.wave = String(state.i + 1);
      wrap.dataset.power = String(Math.round(state.value));
      wrap.dataset.lo = String(Math.round(lo));
      wrap.dataset.hi = String(Math.round(hi));
      wrap.dataset.shots = String(state.shots);
      wrap.dataset.hits = String(state.hits);
    }

    g.overlay = (ctx) => {
      const st = state;
      if (!st) return;
      const now = performance.now();

      // ---------- مجموعات الأعداء ----------
      const drawSoldier = (x, feet, phase, dead) => {
        if (dead) {
          ctx.fillStyle = 'rgba(5,4,8,.45)';
          ctx.beginPath(); ctx.ellipse(x, feet - 1, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#241318'; ctx.fillRect(x - 10, feet - 7, 15, 5);
          ctx.fillStyle = '#3a1f24'; ctx.fillRect(x - 6, feet - 8, 9, 4);
          ctx.fillStyle = '#2a1a18'; ctx.fillRect(x - 14, feet - 8, 5, 5);
          ctx.fillStyle = '#201a20'; ctx.fillRect(x - 15, feet - 10, 6, 3);
          ctx.fillStyle = '#2b1c1c'; ctx.fillRect(x + 1, feet - 6, 7, 4);
          ctx.strokeStyle = '#5d4522'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(x - 18, feet - 2); ctx.lineTo(x + 18, feet - 4); ctx.stroke();
          return;
        }
        const step = Math.sin(phase) * 2;
        ctx.fillStyle = 'rgba(5,4,8,.42)';
        ctx.beginPath(); ctx.ellipse(x, feet - 1, 7, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        // ساقان
        ctx.fillStyle = '#161018';
        ctx.fillRect(x - 3, feet - 9, 3, 9 + step);
        ctx.fillRect(x + 1, feet - 9, 3, 9 - step);
        ctx.fillStyle = '#0d090b';
        ctx.fillRect(x - 4, feet - 1 + step, 4, 2);
        ctx.fillRect(x + 1, feet - 1 - step, 4, 2);
        // عباءة وجذع
        ctx.fillStyle = '#3a1f24'; ctx.fillRect(x - 5, feet - 24, 10, 15);
        ctx.fillStyle = '#241318'; ctx.fillRect(x - 5, feet - 24, 10, 3);
        ctx.fillStyle = '#1b1214'; ctx.fillRect(x - 5, feet - 14, 10, 2);
        // كتفان
        ctx.fillStyle = '#241318';
        ctx.fillRect(x - 7, feet - 24, 3, 4); ctx.fillRect(x + 4, feet - 24, 3, 4);
        // رأس وخوذة
        ctx.fillStyle = '#2e1c19'; ctx.fillRect(x - 3, feet - 31, 6, 7);
        ctx.fillStyle = '#201a20'; ctx.fillRect(x - 4, feet - 34, 8, 4);
        ctx.fillRect(x - 1, feet - 37, 3, 3);
        ctx.fillStyle = '#4a3f37'; ctx.fillRect(x - 5, feet - 33, 10, 1);
        ctx.fillStyle = '#c9a227';
        ctx.fillRect(x - 2, feet - 29, 1, 1); ctx.fillRect(x + 1, feet - 29, 1, 1);
        // درع
        ctx.fillStyle = '#2b1c1c'; ctx.fillRect(x - 8, feet - 23, 4, 10);
        ctx.fillStyle = '#5c2a2a'; ctx.fillRect(x - 7, feet - 22, 2, 8);
        // رمح
        ctx.strokeStyle = '#5d4522'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 5, feet - 13); ctx.lineTo(x + 10, feet - 35); ctx.stroke();
        ctx.fillStyle = '#8fa0b3';
        ctx.beginPath();
        ctx.moveTo(x + 10, feet - 39);
        ctx.lineTo(x + 8, feet - 34);
        ctx.lineTo(x + 12, feet - 34);
        ctx.closePath(); ctx.fill();
        // ذراع ممسكة بالرمح
        ctx.fillStyle = '#2a1a18'; ctx.fillRect(x + 3, feet - 22, 3, 8);
      };

      st.targets.forEach((tg, gi) => {
        const feet = 234;
        if (!tg.alive) {
          for (let i = 0; i < 3; i++) drawSoldier(tg.x + (i - 1) * 11, feet + (i === 1 ? -1 : 0), 0, true);
          ctx.fillStyle = 'rgba(120,40,35,.16)';
          ctx.fillRect(tg.x - 16, feet - 2, 30, 2);
          return;
        }
        // غبار الزحف
        ctx.fillStyle = 'rgba(140,120,95,.10)';
        ctx.fillRect(tg.x + 10, feet - 3, 14, 2);
        ctx.fillRect(tg.x + 3, feet - 1, 20, 1);
        for (let i = 0; i < 3; i++) {
          const off = (i - 1) * 11;
          const bob = Math.sin(now / 150 + gi * 1.7 + i * 2.1) > 0.6 ? 1 : 0;
          drawSoldier(tg.x + off, feet + (off === 0 ? -2 : 0) - bob, now / 170 + gi + i * 2, false);
        }
      });

      // ---------- حركة الذراع ----------
      let angle = CAT.cocked - Math.min(0.06, (st.value || 0) * 0.0006);
      let flying = 0;
      if (st.proj) {
        const since = now - st.proj.t0;
        const swing = Math.max(0, Math.min(1, since / 300));
        const ease = 1 - Math.pow(1 - swing, 3);
        angle = CAT.cocked + (CAT.released - CAT.cocked) * ease;
        flying = Math.max(0, Math.min(1, (since - 240) / 650));
      }

      const timber = (x1, y1, x2, y2, w, face) => {
        ctx.strokeStyle = '#160f0b';
        ctx.lineWidth = w + 2;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = face || '#5a3a20';
        ctx.lineWidth = w;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = 'rgba(201,162,39,.18)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x1 + 1, y1 - 1); ctx.lineTo(x2 + 1, y2 - 1); ctx.stroke();
      };

      const wheel = (cx, cy, r) => {
        ctx.fillStyle = '#0d0a08'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#3a2415'; ctx.beginPath(); ctx.arc(cx, cy, r - 2, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#6a4626'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, r - 4, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4 + 0.2;
          ctx.strokeStyle = '#24160d'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4)); ctx.stroke();
        }
        ctx.fillStyle = '#17110c'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#7d5a2c'; ctx.fillRect(cx - 1, cy - 1, 2, 2);
      };

      // ظل الآلة على الأرض
      ctx.fillStyle = 'rgba(5,4,8,.55)';
      ctx.beginPath(); ctx.ellipse(138, 249, 78, 6, 0, 0, Math.PI * 2); ctx.fill();

      // ---------- العجلات والهيكل ----------
      wheel(90, 236, 13);
      wheel(176, 236, 15);
      timber(76, 244, 198, 244, 7, '#4b301b');
      timber(82, 232, 194, 232, 6, '#5c3b20');
      timber(102, 240, 132, 184, 7, '#5f3d21');
      timber(178, 240, 138, 184, 7, '#4a2e18');
      timber(112, 216, 166, 216, 5, '#4a2e18');
      timber(92, 240, 112, 216, 4, '#3a2415');
      timber(188, 240, 166, 216, 4, '#3a2415');

      // محور حديدي
      ctx.fillStyle = '#1a1714'; ctx.beginPath(); ctx.arc(CAT.pivot.x, CAT.pivot.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7e6a45'; ctx.beginPath(); ctx.arc(CAT.pivot.x, CAT.pivot.y, 2.5, 0, Math.PI * 2); ctx.fill();

      // ---------- الرافعة والبكرة (خلف الآلة) ----------
      const shortEnd = CAT.armPoint(angle, -CAT.short);
      const crankA = (st.value || 0) * 0.11;
      ctx.strokeStyle = '#b79a60'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(86, 224); ctx.lineTo(108, 210); ctx.lineTo(shortEnd.x, shortEnd.y); ctx.stroke();

      ctx.fillStyle = '#241a12'; ctx.beginPath(); ctx.arc(86, 224, 7, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 10; i++) {
        const a = i * Math.PI / 5 + crankA * 0.4;
        ctx.fillStyle = '#5d4522'; ctx.fillRect(86 + Math.cos(a) * 9 - 1, 224 + Math.sin(a) * 9 - 1, 2, 2);
      }
      ctx.strokeStyle = '#a88a52'; ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) { ctx.beginPath(); ctx.arc(86, 224, i * 2 + 1, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = '#8a6a35'; ctx.beginPath(); ctx.arc(86, 224, 3.5, 0, Math.PI * 2); ctx.fill();
      // مقبض الرافعة الذي يمسكه البطل
      const hx = 76 + Math.cos(crankA) * 11, hy = 224 + Math.sin(crankA) * 11;
      ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(86, 224); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.fillStyle = '#6b4a28'; ctx.fillRect(hx - 2, hy - 4, 4, 8);
      ctx.fillStyle = '#9b7136'; ctx.fillRect(hx - 1, hy - 3, 2, 2);

      // ---------- الذراع الخشبي ----------
      ctx.save();
      ctx.translate(CAT.pivot.x, CAT.pivot.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-CAT.short - 5, -5);
      ctx.lineTo(CAT.long + 2, -2.5);
      ctx.lineTo(CAT.long + 2, 2.5);
      ctx.lineTo(-CAT.short - 5, 5);
      ctx.closePath();
      ctx.fillStyle = '#1b120c'; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-CAT.short - 4, -3.5);
      ctx.lineTo(CAT.long, -1.5);
      ctx.lineTo(CAT.long, 1.5);
      ctx.lineTo(-CAT.short - 4, 3.5);
      ctx.closePath();
      ctx.fillStyle = '#6b4526'; ctx.fill();
      ctx.fillStyle = 'rgba(201,162,39,.22)';
      ctx.fillRect(-CAT.short, -1.2, CAT.long + CAT.short, 1);
      // أشرطة حديد على الذراع
      ctx.fillStyle = '#26221c';
      ctx.fillRect(CAT.long - 10, -3, 2, 6);
      ctx.fillRect(22, -3.5, 2, 7);
      ctx.restore();

      // ---------- الثقل الموازن ----------
      const cw = CAT.armPoint(angle, -CAT.short);
      const bw = 24, bh = 17;
      const bx = cw.x - bw / 2, by = cw.y + 11;
      ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cw.x, cw.y); ctx.lineTo(bx + 3, by); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cw.x, cw.y); ctx.lineTo(bx + bw - 3, by); ctx.stroke();
      ctx.fillStyle = '#241811'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#4e331d'; ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
      // حجارة داخل الصندوق
      ctx.fillStyle = '#2b231c';
      ctx.fillRect(bx + 4, by + 4, 5, 4); ctx.fillRect(bx + 11, by + 7, 6, 4); ctx.fillRect(bx + 6, by + 10, 4, 3);
      // أشرطة حديد
      ctx.fillStyle = '#171310';
      ctx.fillRect(bx + 3, by, 2, bh); ctx.fillRect(bx + bw - 5, by, 2, bh);
      ctx.fillRect(bx, by + 2, bw, 2); ctx.fillRect(bx, by + bh - 3, bw, 2);

      // ---------- المقلاع والحجر ----------
      const tip = CAT.armPoint(angle, CAT.long);
      ctx.strokeStyle = '#c0a46a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x + 7, tip.y + 9); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.lineTo(tip.x - 2, tip.y + 10); ctx.stroke();
      ctx.fillStyle = '#3b2415'; ctx.fillRect(tip.x + 2, tip.y + 8, 8, 5);
      if (!st.proj) {
        ctx.fillStyle = '#7b7568'; ctx.beginPath(); ctx.arc(tip.x + 6, tip.y + 10, 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#4d4941'; ctx.fillRect(tip.x + 5, tip.y + 9, 2, 2);
      }

      // ---------- الحجر الطائر ----------
      if (st.proj && flying > 0) {
        const k = flying;
        const ex = st.proj.ex, ey = st.proj.ey;
        const x = A.lerp(st.proj.sx, ex, k);
        const y = A.lerp(st.proj.sy, ey, k) - Math.sin(k * Math.PI) * (58 + st.proj.power * 0.62);
        ctx.fillStyle = 'rgba(224,122,63,.18)';
        ctx.fillRect(x - 7, y - 1, 4, 2); ctx.fillRect(x - 11, y + 1, 3, 1);
        ctx.fillStyle = '#6d675b'; ctx.beginPath(); ctx.arc(x, y, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#a39a87'; ctx.fillRect(x - 1, y - 2, 2, 2);
        ctx.fillStyle = '#c9a227'; ctx.fillRect(x + 1, y + 1, 1, 1);
        if (k >= 1 && st.proj.hit && !st.proj.done) {
          st.proj.done = true;
          if (st.proj.target) st.proj.target.alive = false;
          const tx = st.proj.target ? st.proj.target.x : ex;
          for (let i = 0; i < 14; i++) {
            ctx.fillStyle = i % 3 === 0 ? '#9e1f2a' : i % 2 ? '#e8823f' : '#c9a227';
            ctx.fillRect(tx + (Math.random() * 34 - 17), 204 + Math.random() * 22, 2, 2);
          }
          ctx.fillStyle = 'rgba(150,130,105,.20)';
          ctx.fillRect(tx - 18, 226, 36, 4);
        }
      }

      // ---------- شريط شدّ الرافعة ----------
      const bx2 = 274, by2 = 246, bw2 = 178;
      ctx.fillStyle = 'rgba(10,7,16,.86)'; ctx.fillRect(bx2, by2, bw2, 9);
      const lo = Math.max(0, st.cfg.lo - PAD), hi = Math.min(100, st.cfg.hi + PAD);
      ctx.fillStyle = 'rgba(158,31,42,.55)'; ctx.fillRect(bx2 + bw2 * (lo / 100), by2, bw2 * ((hi - lo) / 100), 9);
      ctx.fillStyle = '#6b5626'; ctx.fillRect(bx2 + bw2 * (lo / 100), by2, bw2 * ((hi - lo) / 100), 1);
      ctx.fillStyle = 'rgba(201,162,39,.35)';
      for (let i = 1; i < 10; i++) ctx.fillRect(bx2 + bw2 * (i / 10), by2 + 1, 1, 7);
      const mx = bx2 + bw2 * (st.value / 100);
      ctx.fillStyle = '#f2e7cd'; ctx.fillRect(mx - 1, by2 - 3, 3, 15);
      ctx.strokeStyle = '#4f3f27'; ctx.strokeRect(bx2 + 0.5, by2 + 0.5, bw2, 9);
      ctx.fillStyle = '#8b7f75'; ctx.font = '5px "Noto Kufi Arabic"'; ctx.textAlign = 'center';
      ctx.fillText('شدّ الرافعة', bx2 + bw2 / 2, by2 + 17);
    };

    function cleanup() {
      cancelAnimationFrame(raf);
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      state = null;
      g.overlay = null;
      wrap.remove();
      g.ui.innerHTML = '';
      g.mode = 'scene';
    }

    raf = requestAnimationFrame(loop);
    const results = [];
    try {
      for (let i = 0; i < WAVES.length; i++) {
        const r = await runWave(i);
        results.push(r);
        if (!r.win) break;
        if (i < WAVES.length - 1) {
          $log.innerHTML = A.rich(A.genderText('**المجموعات سقطت.** أعِد التلقيم… الموجة التالية تتقدّم.'));
          await A.sleep(1100);
        }
      }
    } catch (e) { console.error(e); }

    const won = results.length === WAVES.length && results.every((r) => r.win);
    const hitsTot = results.reduce((a, r) => a + r.hits, 0);
    $log.innerHTML = A.rich(A.genderText(won
      ? `**ثلاث موجات من الحجر.** ${A.fmt(hitsTot)} مجموعات سقطت. ${A.fmt(hitsTot * 3)} جنديًا لم يعودوا. الساحة صامتة، والجيش يتوقف ليحصي خسائره.`
      : `الموجة ${A.fmt(results.length)} لم تُسقط بما يكفي. ${A.fmt(hitsTot)} مجموعات فقط… والمجموعات تعبر.`));
    A.audio[won ? 'win' : 'lose']();
    await A.sleep(1500);
    cleanup();
    return { win: won, waves: results, waveReached: results.length, totalWaves: WAVES.length, hits: hitsTot, kills: hitsTot * 3 };
  };

  // ============================================================
  //  شريط مهارة بسيط (للاختبارات والتلميحات)
  // ============================================================
  B.barGame = B.gatherGame;
})(window.ASH);
