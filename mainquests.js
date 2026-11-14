/* ============================================================
   أوامر النقيب عادل — سلسلة مهام أساسية متتابعة
   - كل أمر يمنحه النقيب في دير النار.
   - عند إتمام أمر، يمنحك الأمر الذي بعده في نفس اللقاء.
   - سراج الكشّاف يظهر في مكان عشوائي، ويجب إعادته إلى دير النار.
   ============================================================ */
(function (A) {
  const MQ = (A.mainQuest = {});
  const D = A.DATA;

  const RANDOM_PLACES = ['forest', 'mine', 'ruins'];
  const TOTAL = () => D.mainQuests.length;

  // المكافآت الثابتة لكل أمر (نسبة التجهيز تُحسب من عدد الأوامر المكتملة)
  const REWARDS = [
    { atk: 1, rep: 2 },
    { def: 1, rep: 2 },
    { rep: 2, res: { herb: 2 }, potions: 1 },
    { atk: 1, rep: 2, potions: 2 },
  ];

  const N = (t) => ({ w: 'narr', t });
  const H = (t) => ({ w: 'hero', t });
  const SAY = (w, t) => ({ w, t });

  function G() { return A.game; }
  function locName(id) { return (D.locations[id] && D.locations[id].name) || ''; }

  // ------------------------------------------------------------
  //  الحالة
  // ------------------------------------------------------------
  MQ.init = function (s) {
    if (!s) return s;
    if (!s.main) s.main = { q: 0, stage: 0, done: 0 };
    if (!s.flags) s.flags = {};
    if (RANDOM_PLACES.indexOf(s.flags.scoutAt) < 0) {
      s.flags.scoutAt = A.pick(RANDOM_PLACES);
    }
    return s;
  };

  MQ.ensure = function (s) {
    if (!s) return s;
    MQ.init(s);
    const m = s.main;
    const total = TOTAL();
    if (typeof m.q !== 'number' || isNaN(m.q) || m.q < 0) m.q = 0;
    if (m.q > total) m.q = total;
    if (typeof m.done !== 'number' || isNaN(m.done) || m.done < 0) m.done = 0;
    if (m.done > total) m.done = total;
    if (typeof m.stage !== 'number' || [0, 1, 2, 3].indexOf(m.stage) < 0) {
      m.stage = m.done > 0 ? 1 : 0;
    }
    if (m.q >= total) { m.q = total; m.stage = 3; m.done = total; }
    if (m.done < m.q) m.done = m.q;
    return s;
  };

  MQ.stage = function (s) {
    return s && s.main ? s.main.stage : -1;
  };

  MQ.ready = function (s) {
    const st = MQ.stage(s);
    return st === 0 || st === 2;
  };

  MQ.complete = function (s) {
    return !!(s && s.main && (s.main.stage === 3 || s.main.q >= TOTAL()));
  };

  MQ.current = function (s) {
    if (!s || !s.main || s.main.q >= TOTAL()) return null;
    return D.mainQuests[s.main.q];
  };

  // المكان الذي يجب أن يذهب إليه اللاعب الآن.
  MQ.mapTarget = function (s) {
    if (!s || !s.main || MQ.complete(s)) return null;
    if (s.main.stage === 0 || s.main.stage === 2) return 'village';
    const q = s.main.q;
    if (q === 0) return s.flags.scoutAt || 'forest';
    if (q === 1) return 'mine';
    if (q === 2) return 'forest';
    if (q === 3) return 'ruins';
    return null;
  };

  // نصّ المطلوب الحالي.
  MQ.hint = function (s) {
    if (!s || !s.main) return '';
    if (MQ.complete(s)) return 'أتممتَ أوامر النقيب الأربعة.';
    const Q = MQ.current(s);
    if (!Q) return '';
    if (s.main.stage === 0) return 'كلّم النقيب عادل في دير النار لأخذ أمرك.';
    if (s.main.stage === 2) return Q.turnIn + ' — النقيب في دير النار.';
    if (s.main.q === 0) return Q.objective.replace('{place}', locName(s.flags.scoutAt));
    return Q.objective;
  };

  // هل توجد هنا نقطة تفاعل خاصة بأمر النقيب؟
  MQ.canAct = function (s, id) {
    if (!s || !s.main || s.main.stage !== 1) return false;
    const q = s.main.q;
    if (q === 0) return id === s.flags.scoutAt && !s.flags.scoutFound;
    if (q === 1) return id === 'mine' && !s.flags.towerFixed;
    if (q === 2) return id === 'forest' && !s.flags.roadClear;
    if (q === 3) return id === 'ruins' && !s.flags.vaultOpen;
    return false;
  };

  MQ.actionLabel = function (s, id) {
    if (!s || !s.main) return '';
    const q = s.main.q;
    if (q === 0) return 'ابحث عن سراج';
    if (q === 1) return 'إصلاح برج الإنذار';
    if (q === 2) return 'تطهير الطريق الجنوبي';
    if (q === 3) return 'فتح خزنة الحصن';
    return 'أمر النقيب';
  };

  // ------------------------------------------------------------
  //  الحوار: عرض الأمر التالي
  // ------------------------------------------------------------
  function offerNodes(s) {
    const q = s.main.q;
    const at = locName(s.flags.scoutAt);
    if (q === 0) {
      return [
        SAY('captain', 'قبل أن تذهب… **سراج**. كشّافنا. خرج إلى الطريق قبل ثلاثة أيام ولم يعد.'),
        SAY('captain', 'آخر أثر له كان في **' + at + '**. ابحث عنه، وأعده إلى دير النار. لن أرسل رجلًا آخر.'),
        H('سأجده.'),
        SAY('captain', 'أعده حيًّا. هذا كل ما أطلبه.'),
      ];
    }
    if (q === 1) {
      return [
        SAY('captain', 'أمرك التالي: **برج الإنذار** فوق مناجم الجمر. نصفه انهار في العاصفة الأخيرة.'),
        SAY('captain', 'إن لم يُصلَح، لن نرى الجيش قبل أن يطرق البوابة. تحتاج **٤ خشب و٣ حديد و٢ حجر**، ويومًا واحدًا.'),
        H('سأصعد وأصلحه.'),
        SAY('captain', 'الحجر هناك يسمع قبل أن يرى. خذ حذرك.'),
      ];
    }
    if (q === 2) {
      return [
        SAY('captain', 'أمرك التالي: **الطريق الجنوبي**. قطّاع الطريق نصبوا كمينًا في غابة الهمس.'),
        SAY('captain', 'القوافل لا تمرّ، والمؤونة لا تصل. طهّر الطريق، وعد. لا تطاردهم إلى العمق.'),
        H('سأفتح الطريق.'),
        SAY('captain', 'عد حيًّا. الطريق لا يستحق رجلًا ميتًا.'),
      ];
    }
    return [
      SAY('captain', 'أمرك الأخير — حتى الآن. في **أنقاض قلعة الشمس** بابٌ حجري لا يفتح.'),
      SAY('captain', 'يقولون إن خلفه **خزنة الحصن** من زمن العهد الأول. سلاحٌ ومؤونة… وربما شيءٌ لا يجب أن يخرج.'),
      H('سأفتحه.'),
      SAY('captain', 'افتحه، لكن لا تأخذ منه أكثر مما تحتاج.'),
    ];
  }

  function doneNodes(q, last) {
    if (q === 0) {
      return [
        SAY('captain', 'سراج! كنتَ أعزل من عصفور في الريح.'),
        SAY('scout', 'وكنتُ أظنّ أنني سأموت هناك. هذا… لم يتركني.'),
        SAY('captain', 'أحسنت. البرج التالي — تعال، عندي أمر لك.'),
      ];
    }
    if (q === 1) {
      return [
        SAY('captain', 'البرج يرى الطريق كله الآن. سمعت صوته في الليل: حديدٌ على حديد. كان جيدًا.'),
        SAY('captain', 'لكن الجيش لا يتوقف عند برج. عندي أمر آخر.'),
      ];
    }
    if (q === 2) {
      return [
        SAY('captain', 'الطريق آمن. القافلة وصلت السوق قبل قليل. ماري أرسلت شكرها مع أول عابر.'),
        SAY('captain', 'بقي أمر واحد. شيءٌ أخبرني عنه العارف نورس قبل أن يختفي.'),
      ];
    }
    return [
      SAY('captain', 'خزنة الحصن! لم أرَ مثل هذا منذ العهد الأول.'),
      SAY('captain', 'هذا سلاح الحصن القديم. الآن، إن وصل الجيش، سيجد سورًا… وذكرى.'),
      H('لن يكون رمادًا.'),
      SAY('captain', 'لا. لن يكون.'),
    ];
  }

  MQ.offer = async function (s) {
    const g = G();
    if (!s || !s.main || s.main.q >= TOTAL()) return;
    const q = s.main.q;
    s.main.stage = 1;
    g.updateHud();
    g.save();
    await g.play(offerNodes(s));
    g.toast('أمر جديد من النقيب: ' + D.mainQuests[q].name, 'time');
    g.updateHud();
    g.save();
  };

  // الأمر الأول يُعطى في نهاية مشهد القرية الأول.
  MQ.offerFirst = async function (s) {
    if (!s || !s.main || s.main.stage !== 0 || s.main.q !== 0) return;
    await MQ.offer(s);
  };

  // ------------------------------------------------------------
  //  تسليم الأمر عند النقيب
  // ------------------------------------------------------------
  MQ.turnIn = async function (s) {
    const g = G();
    const q = s.main.q;
    if (q >= TOTAL() || s.main.stage !== 2) return;
    const last = q === TOTAL() - 1;

    s.main.done = Math.min(TOTAL(), (s.main.done || 0) + 1);
    if (last) {
      s.main.q = TOTAL();
      s.main.stage = 3;
    } else {
      s.main.q = q + 1;
      s.main.stage = 1;
    }
    g.apply(REWARDS[q] || {});
    if (last) g.awardTrophy('captain');
    g.updateHud();
    g.save();

    await g.play(doneNodes(q, last));
    if (!last) {
      await g.play(offerNodes(s));
      g.toast('أمر جديد من النقيب: ' + D.mainQuests[s.main.q].name, 'time');
    } else {
      g.toast('أتممتَ أوامر النقيب الأربعة. تجهيز الدفاع أقوى.', 'trophy');
    }
    g.updateHud();
    g.save();
  };

  // يعالج لقاء النقيب إن كان هناك أمر جديد أو تسليم. يعيد true إن انتهى الحوار.
  MQ.captain = async function (s) {
    if (!s || !s.main || s.postWar) return false;
    if (s.main.stage === 0) {
      await MQ.offer(s);
      return true;
    }
    if (s.main.stage === 2) {
      await MQ.turnIn(s);
      return true;
    }
    return false;
  };

  // ------------------------------------------------------------
  //  نقاط التفاعل في المواقع
  // ------------------------------------------------------------
  async function findScout(s) {
    const g = G();
    await g.play([
      N('تتبع آثار الأقدام بين الصخور. الهواء بارد، والأثر ينتهي عند ظلٍّ كبير.'),
      N('بين جذع مكسور وصخرة، تجد سراجًا ملتصقًا بالحجر. ذئبٌ بعينين كجمرتين يقف بينك وبينه.'),
    ]);
    const r = await A.battle.start('wolf');
    if (!r || !r.win) {
      if (!r || !r.fled) await g.play([N('تتراجع، والذئب يعود إلى ظلّه. سراج ما زال هناك… لم يفت الأوان.')]);
      return true;
    }
    await g.play([
      SAY('scout', 'أنت…؟ ظننت أن النقيب نسيَني.'),
      H('لم ينسَ. أرسلني.'),
      SAY('scout', 'ساقي… لا أستطيع المشي بسرعة. لكنني أستطيع أن أتبعك.'),
      N('تسند سراج على كتفك، وتأخذانه نحو دير النار.'),
    ]);
    s.flags.scoutFound = true;
    s.main.stage = 2;
    g.toast('وجدت سراج. أعده إلى دير النار وكلّم النقيب.', 'good');
    g.updateHud();
    g.save();
    return true;
  }

  async function repairTower(s) {
    const g = G();
    const Q = D.mainQuests[1];
    const cost = Q.cost || {};
    const missing = [];
    for (const k in cost) {
      const had = s.res[k] || 0;
      if (had < cost[k]) missing.push(A.fmt(cost[k] - had) + ' ' + A.resName(k, cost[k] - had));
    }
    if (missing.length) {
      await g.play([
        N('تتفحّص البرج: العارضة الرئيسية مكسورة، والحجر متصدّع. لن يصمد بلا ترميم.'),
        N('تحتاج إلى **' + Q.costText + '**. ينقصك: ' + missing.join('، ') + '.'),
      ]);
      g.toast('ينقصك: ' + missing.join('، '), 'bad');
      return true;
    }
    const c = await g.ask([
      Object.assign({ label: 'أصلح البرج. (' + Q.costText + ')' }, { sub: 'يوم واحد' }),
      { label: 'ليس الآن.' },
    ]);
    if (c !== 0) return true;
    const spend = {};
    for (const k in cost) spend[k] = -cost[k];
    g.apply({ res: spend });
    g.spendDays(1);
    await g.play([
      N('تشدّ العارضة، وتثبّت الحجر بالحديد. البرج يتنفّس من جديد.'),
      N('من أعلاه، ترى الطريق حتى البوابة… وترى الغبار البعيد.'),
    ]);
    s.flags.towerFixed = true;
    s.main.stage = 2;
    g.toast('أصلحت برج الإنذار. عُد إلى النقيب.', 'good');
    g.updateHud();
    g.save();
    const stop = await g.afterDays();
    if (stop) return false;
    return true;
  }

  async function clearRoad(s) {
    const g = G();
    await g.play([
      N('عند منعطف الطريق، رجالٌ بثياب ممزّقة يوقفون العربات. واحدهم يرفع سيفًا صدئًا، وخلفه ذئبٌ مربوط بحبل.'),
      N('العربات المقلوبة تسدّ الطريق. لا مجال للمرور إلا من بينهم.'),
    ]);
    const r = await A.battle.gauntlet([
      { enemy: 'bandit' },
      { enemy: 'wolf' },
    ]);
    A.audio.afterBattle();
    if (!r || !r.win) {
      if (!r || !r.fled) await g.play([N('تتراجع إلى الأشجار. الطريق ما زال مغلقًا… لكنك تعرف الآن كم منهم.')]);
      return true;
    }
    s.flags.roadClear = true;
    s.main.stage = 2;
    await g.play([
      N('يسقط آخر رجل، ويجري الذئب نحو الأشجار. الطريق مفتوح.'),
      N('تعيد العربة المقلوبة إلى الطريق. العجلة تدور بلا صرير.'),
    ]);
    g.toast('أمنتَ الطريق الجنوبي. عُد إلى النقيب.', 'good');
    g.updateHud();
    g.save();
    return true;
  }

  async function openVault(s) {
    const g = G();
    await g.play([
      N('الباب الحجري في قلب الأنقاض. عليه ثلاثة رموز: شمسٌ، رمادٌ، وعهد.'),
      N('تحت كل رمز، كلمات محفورة بيدٍ قديمة. الباب ينتظر اختيارًا.'),
    ]);
    const c = await g.ask([
      { label: 'الشمس', sub: 'رمز العهد الأول' },
      { label: 'الرماد', sub: 'ما بقي من المملكة' },
      { label: 'العهد', sub: 'ما كُسر في الغابة' },
    ]);
    let blessed = false;
    if (c === 2) {
      blessed = true;
      if (!s.flags.vaultBlessed) {
        s.flags.vaultBlessed = true;
        s.potions += 1;
        await g.play([
          N('تضغط رمز العهد. الباب يئنّ، ثم ينفتح. شيءٌ دافئ يلمس يدك: جرعة قديمة ما زالت صالحة.'),
        ]);
        g.toast('العهد يعرف من يحفظه. +١ جرعة', 'good');
      } else {
        await g.play([N('الرمز يضيء من جديد. الباب يعرفك.')]);
      }
    } else {
      const hurt = Math.min(3, Math.max(0, s.hp - 1));
      s.hp = Math.max(1, s.hp - hurt);
      await g.play([
        N('تضغط الرمز الخطأ. الباب يحرق كفّك، ثم ينفتح على أي حال.'),
      ]);
      g.toast('أحرق الباب كفّك. −' + A.fmt(hurt) + ' صحة', 'bad');
    }
    g.updateHud();
    g.save();
    await g.play([
      N('من داخل الظلام، تسمع عظامًا تتحرّك. هيكلٌ حارس يستيقظ، وسيفه يجرّ على الحجر.'),
    ]);
    const r = await A.battle.start('skeleton', { enemyHp: blessed ? 18 : 22 });
    if (!r || !r.win) {
      if (!r || !r.fled) await g.play([N('تتراجع من الخزنة. الهيكل يعود إلى مكانه… والباب يبقى مفتوحًا.')]);
      return true;
    }
    s.flags.vaultOpen = true;
    s.main.stage = 2;
    await g.play([
      N('داخل الخزنة: صندوق حجري، وسيفٌ لا يزال لامعًا، وجرّتان من زيت.'),
      H('خزنة الحصن… كانت هنا كل هذا الوقت.'),
    ]);
    g.toast('فتحت خزنة الحصن. عُد إلى النقيب.', 'good');
    g.updateHud();
    g.save();
    return true;
  }

  MQ.locationAction = async function (s, id) {
    const g = G();
    if (!s || g.mode !== 'scene' || !MQ.canAct(s, id)) return;
    A.audio.init();
    A.audio.click();
    g.mode = 'talk';
    let ok = true;
    try {
      const q = s.main.q;
      if (q === 0) ok = await findScout(s);
      else if (q === 1) ok = await repairTower(s);
      else if (q === 2) ok = await clearRoad(s);
      else if (q === 3) ok = await openVault(s);
    } catch (e) {
      console.error(e);
    }
    if (ok === false) return; // انتهى الوقت وبدأت المعركة الأخيرة
    g.mode = 'scene';
    if (g.screen === 'location') g.go('location', id);
    g.save();
  };

  // ------------------------------------------------------------
  //  الواجهة: سجل المهام
  // ------------------------------------------------------------
  MQ.logHtml = function (s) {
    if (!s || !s.main) return '';
    const total = TOTAL();
    const m = s.main;
    const done = MQ.complete(s) ? total : Math.min(total, m.done || 0);
    const Q = MQ.current(s);
    const track = D.mainQuests.map((x, i) => {
      const cls = i < done ? 'done' : (i === m.q && !MQ.complete(s)) ? 'current' : '';
      return `<span class="mq-step ${cls}" title="${A.esc(x.name)}"><i>${A.fmt(i + 1)}</i><em>${A.esc(x.name)}</em></span>`;
    }).join('');

    let card;
    if (MQ.complete(s)) {
      card = `<div class="mainquest done">
        <div class="mq-name">أوامر النقيب مكتملة</div>
        <div class="mq-desc">أتممتَ أربعة أوامر للنقيب عادل. تجهيز الدفاع أقوى، والناس يعرفون من وقف معهم.</div>
      </div>`;
    } else if (Q) {
      card = `<div class="mainquest">
        <div class="mq-top"><div class="mq-name">${A.esc(Q.name)}</div><span class="mq-bonus">+٨٪ تجهيز</span></div>
        <div class="mq-desc">${A.esc(Q.desc)}</div>
        <div class="mq-task"><b>المطلوب:</b> ${A.esc(MQ.hint(s))}</div>
        <div class="mq-reward"><b>المكافأة:</b> ${A.esc(Q.reward)}</div>
      </div>`;
    }

    return `<h3>أوامر النقيب <span class="trophy-count">${A.fmt(done)} / ${A.fmt(total)}</span></h3>
      <div class="mq-track">${track}</div>
      ${card || ''}`;
  };
})(window.ASH);
