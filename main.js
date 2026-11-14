/* نقطة الانطلاق */
(function (A) {
  function boot() {
    A.game.init();
    const L = (ar, en) => (A.lang === 'en' ? en : ar);

    // دخول سريع للاختبار: ?fort يفتح دير النار مباشرة (لا يمسّ الحفظ).
    try {
      const q = new URLSearchParams(location.search);
      if (q.get('ending') === 'sacrifice') {
        const st = A.game.newState('حارث', 0, 'male');
        st.day = A.DATA.maxDays;
        st.daysLeft = 0;
        st.rep = 5;
        st.jinnDeal = 2;
        st.res = { wood: 40, iron: 30, herb: 20, stone: 30 };
        st.flags.priceYearsDoom = true;
        A.game.state = st;
        A.game.screen = 'village';
        A.game.setBg('village', [{ kind: 'hero', x: 146, y: 226, s: 2.3, pose: 'idle', opts: A.game.heroOpts() }]);
        // نعرض ساحة الوقفة الأخيرة فورًا، لكن لا نبدأ الصوت إلا بعد لمسة/ضغطة
        // واحدة من اللاعب (سياسات المتصفح تمنع تشغيل الصوت تلقائيًا).
        A.cinema.beginLastStand();
        A.game.toast(L('انقر مرة واحدة لبدء المشهد بالصوت', 'Click once to start the scene with sound'), 'good');
        let started = false;
        const startDev = () => {
          if (started) return;
          started = true;
          A.audio.init();
          if (A.audio.ctx && A.audio.ctx.state === 'suspended') A.audio.ctx.resume();
          A.game.devSacrifice();
        };
        ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) => {
          document.addEventListener(ev, startDev, { once: true, capture: true });
        });
        setTimeout(() => {
          if (A.audio.ctx && A.audio.ctx.state === 'running') startDev();
        }, 500);
      } else if (['win', 'best', 'good'].indexOf(q.get('ending')) >= 0) {
        // دخول سريع إلى نهاية النصر (بعد مشهد قائد الرماد) — بدون تضحية.
        const mode = q.get('ending');
        const good = mode === 'good';
        const st = A.game.newState('حارث', 0, 'male');
        st.day = good ? A.DATA.maxDays - 2 : A.DATA.maxDays;
        st.daysLeft = good ? 2 : 0;
        st.rep = good ? 6 : 9;
        st.jinnDeal = good ? 2 : 3;
        st.hp = st.maxHp;
        st.potions = 2;
        st.flags.jinnArmy = true;
        st.flags.jinnJoined = true;
        st.flags.suppliesDone = true;
        st.flags.leftRing = !good;
        // لا نتجاوز مشهد التكريم: كل النهايات الناجحة تمرّ بنفس التكريم، حتى في الاختصار.
        st.battleChoice = 'sword';
        st.main = { q: good ? 2 : 4, stage: 3, done: good ? 2 : 4 };
        const sideIds = ['smith', 'herb', 'catapult', 'bow', 'child', 'ring', 'zainab', 'mari', 'lana', 'sidra', 'food'];
        sideIds.forEach((id, i) => { if (!good || i < 4) st.quests[id] = 'done'; });
        st.delivered = good
          ? { wood: 9, iron: 7, herb: 5, stone: 7 }
          : { wood: 12, iron: 10, herb: 7, stone: 10 };
        st.res = good ? { wood: 0, iron: 0, herb: 0, stone: 0 } : Object.assign({}, st.delivered);
        A.game.state = st;
        A.game.screen = 'village';
        A.game.setBg('battle', [{ kind: 'hero', x: 240, y: 250, s: 2.4, pose: 'idle', opts: A.game.heroOpts() }]);
        A.game.toast(L('انقر مرة واحدة لبدء مشهد قائد الرماد', 'Click once to start the Commander of Ash scene'), 'good');
        let started = false;
        const startEnding = () => {
          if (started) return;
          started = true;
          A.audio.init();
          if (A.audio.ctx && A.audio.ctx.state === 'suspended') A.audio.ctx.resume();
          A.game.finishBattle({
            win: true,
            totalWaves: 3,
            waves: [{ win: true }, { win: true }, { win: true }],
          });
        };
        ['pointerdown', 'touchstart', 'keydown', 'click'].forEach((ev) => {
          document.addEventListener(ev, startEnding, { once: true, capture: true });
        });
      } else if (q.has('fort')) {
        const st = A.game.newState('حارث', 0, 'male');
        st.day = 3;
        st.flags.wizardMet = true;
        st.res = { wood: 30, iron: 20, herb: 15, stone: 20 };
        st.rep = 3;
        A.game.state = st;
        A.game.go('village');
        A.game.toast(L('وضع عرض الحصن — امشِ بالأسهم أو WASD، وتكلّم بـ E', 'Fort demo mode — walk with arrows or WASD, and talk with E'), 'good');
      } else if (q.has('mountain')) {
        // دخول سريع لجبال العظام من خارج بوابة الحصن.
        const st = A.game.newState('حارث', 0, 'male');
        st.day = 3;
        st.flags.wizardMet = true;
        st.res = { wood: 30, iron: 20, herb: 15, stone: 20 };
        A.game.state = st;
        if (q.has('farmer')) {
          // عرض الفلاح حسين مباشرة عند الحضيرة
          A.mountain.pendingPos = { x: 668, y: 246 };
        } else {
          A.mountain.pendingOutside = true;
        }
        A.game.go('location', 'mountain');
        A.game.toast(q.has('farmer')
          ? L('الفلاح حسين — الشيخ الجديد عند الحضيرة (نسخة 1.78). اقترب واضغط E لتسلّم عليه.',
              'Farmer Hussein — the new elder at the barn (v1.78). Approach and press E to greet him.')
          : L('وضع عرض الجبال (نسخة 1.78) — الكاميرا مقفلة على الشخصية، انقر على قوس الطريق أو اضغط E لدخوله',
              'Mountain demo mode (v1.78) — the camera stays on the character. Click a road arch or press E to enter.'), 'good');
      }
    } catch (e) { /* تجاهل */ }

    // تهيئة الصوت عند أول تفاعل (سياسات المتصفح تمنع التشغيل التلقائي)
    const unlock = () => {
      A.audio.init();
      if (A.audio.ctx && A.audio.ctx.state === 'suspended') A.audio.ctx.resume();
      if (A.game.screen === 'title') A.audio.ambient('title');
      else if (A.game.screen === 'village' && !A.audio._mood) A.audio.ambient('village');
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true, passive: true });
    document.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });

    // إيقاف مؤقت عند تصغير النافذة
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && A.audio.ctx && A.audio.ctx.state === 'running') {
        A.audio.ctx.suspend();
      } else if (!document.hidden && A.audio.ctx && A.audio.ctx.state === 'suspended') {
        A.audio.ctx.resume();
      }
    });

    console.log('%cرماد المملكة — Kingdom of Ash', 'color:#c9a227;font-weight:bold');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.ASH);
