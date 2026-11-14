/* ============================================================
   رماد المملكة — محرّك الترجمة والتبديل بين العربية والإنجليزية
   - يترجم نصوص DOM والسمات تلقائيًا.
   - يعترض نصوص الـ Canvas (fillText / strokeText).
   - يحفظ اللغة المختارة ويعيد تطبيقها فورًا.
   أسماء الشخصيات لا تتغيّر: تُكتب لاتينيًا بشكل ثابت.
   ============================================================ */
(function (A) {
  const KEY = 'ash.lang.v1';
  const D = A.I18N_EN || {};
  const PH = A.I18N_PHRASES || {};
  const NAMES = A.I18N_NAMES || {};

  let stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) { /* معطّل */ }
  A.lang = stored === 'en' ? 'en' : 'ar';

  // ---------- أدوات النص ----------
  const AR = /[\u0600-\u06FF]/;
  const AR_DIGITS = /[\u0660-\u0669]/;
  const AR_PUNCT = /[\u060C\u061B\u061F\u066A\u066B\u066C]/;
  // حدود الكلمات: علامات الترقيم العربية لا تمنع مطابقة الكلمة (مثل «خشب،»).
  const AR_WORD = /[\u0600-\u060B\u060D-\u061A\u061C-\u061E\u0620-\u06FF]/;

  const DIGIT_MAP = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
  const PUNCT_MAP = { '،': ',', '؛': ';', '؟': '?', '٪': '%', '٫': '.', '٬': ',' };

  function norm(s) {
    return String(s)
      .replace(/\u00a0/g, ' ')
      .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
      .replace(/[ \t]+/g, ' ')
      .trim();
  }

  function latinize(s) {
    return String(s)
      .replace(/[\u0660-\u0669]/g, (d) => DIGIT_MAP[d])
      .replace(/[\u060C\u061B\u061F\u066A\u066B\u066C]/g, (d) => PUNCT_MAP[d]);
  }

  // عبارات تُستبدل داخل النصوص المركّبة (الأطول أولًا)
  const PHRASES = (() => {
    const list = [];
    const add = (ar, en) => {
      if (!ar || !en || ar === en) return;
      if (ar.length < 3) return;
      if (!AR.test(ar)) return;
      list.push({ ar, en });
    };
    Object.keys(D).forEach((k) => add(k, D[k]));
    Object.keys(NAMES).forEach((k) => add(k, NAMES[k]));
    Object.keys(PH).forEach((k) => add(k, PH[k]));
    list.sort((a, b) => b.ar.length - a.ar.length);
    return list;
  })();

  // فهرسة حسب أول حرف: يمنع فحص آلاف العبارات لكل نص.
  const BY_FIRST = new Map();
  PHRASES.forEach((p) => {
    const c = p.ar.charAt(0);
    let bucket = BY_FIRST.get(c);
    if (!bucket) { bucket = []; BY_FIRST.set(c, bucket); }
    bucket.push(p);
  });

  function phraseReplace(s) {
    let out = '';
    let i = 0;
    const n = s.length;
    while (i < n) {
      const bucket = BY_FIRST.get(s.charAt(i));
      let hit = null;
      if (bucket) {
        for (let j = 0; j < bucket.length; j++) {
          const p = bucket[j];
          const k = p.ar;
          if (!s.startsWith(k, i)) continue;
          if (AR_WORD.test(k.charAt(0)) && i > 0 && AR_WORD.test(s.charAt(i - 1))) continue;
          const end = i + k.length;
          if (AR_WORD.test(k.charAt(k.length - 1)) && end < n && AR_WORD.test(s.charAt(end))) continue;
          hit = p;
          break;
        }
      }
      if (hit) { out += hit.en; i += hit.ar.length; }
      else { out += s.charAt(i); i++; }
    }
    return out;
  }

  // الترجمة: مطابقة تامة أولًا، ثم استبدال عبارات معروفة.
  function polish(out) {
    return latinize(out).replace(/\b(\d+)\s+day\b/g, (m, n) => (n === '1' ? '1 day' : n + ' days'));
  }

  A.t = function (input) {
    if (input == null) return input;
    let s = String(input);
    if (A.lang !== 'en') return s;
    const lead = (s.match(/^\s*/) || [''])[0];
    const trail = (s.match(/\s*$/) || [''])[0];
    const core = norm(s);
    if (!core) return s;

    let out = D[core];
    if (out == null) {
      // محاولة إزالة الاقتباسات الزائدة
      const alt = core.replace(/^[\u00ab\u201c"']+|[\u00bb\u201d"']+$/g, '').trim();
      if (alt !== core) out = D[alt];
    }
    // النصوص قد تحمل علامات التنسيق **غامق** أو *مائل*؛ نبحث أيضًا بدونها.
    const hasMarkup = core.indexOf('*') !== -1;
    const bare = hasMarkup ? core.replace(/\*/g, '') : core;
    if (out == null && hasMarkup) out = D[bare];
    if (out != null) return lead + polish(out) + trail;

    if (!AR.test(core) && !AR_DIGITS.test(core) && !AR_PUNCT.test(core)) {
      return lead + latinize(core) + trail;
    }
    // إن وصل نصٌّ مؤنّث (اللاعبة) بعد تبديل اللغة، أعِده إلى صيغة المصدر
    // المذكّرة كي يجد القاموس مفتاحه.
    let base = bare;
    if (A.genderUndo) {
      const und = A.genderUndo(bare);
      if (und !== bare) {
        const hit = D[und] != null ? D[und] : D[und.replace(/\*/g, '')];
        if (hit != null) return lead + polish(hit) + trail;
        base = und;
      }
    }
    out = phraseReplace(base);
    return lead + polish(out) + trail;
  };

  // اسم اللاعب/الشخصية: يبقى كما كتبه اللاعب، إلا أسماء اللعبة الثابتة.
  A.nameFor = function (n) {
    if (A.lang !== 'en') return n;
    return NAMES[n] || n;
  };

  // ---------- ترجمة DOM ----------
  const textOrig = new WeakMap();
  const attrOrig = new WeakMap();
  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  const SKIP_SEL = 'script,style,noscript,textarea,select,option,#lang-toggle,[data-i18n-skip]';

  function elOf(node) {
    let e = node.nodeType === 1 ? node : node.parentNode;
    while (e && e.nodeType !== 1) e = e.parentNode;
    return e;
  }
  function skipped(node) {
    const e = elOf(node);
    if (!e || !e.closest) return true;
    if (e.closest(SKIP_SEL)) return true;
    // حوار القصة يُترجم قبل تأثير الكتابة عبر G.say
    if (e.closest('.dlg-text')) return true;
    return false;
  }

  function translateNode(node) {
    if (!node || node.nodeType !== 3) return;
    if (skipped(node)) return;
    const cur = node.nodeValue;
    if (cur == null) return;
    const rec = textOrig.get(node);
    if (rec && cur === rec.dst) return;
    if (rec && cur === rec.src) return;
    if (!AR.test(cur) && !AR_DIGITS.test(cur) && !AR_PUNCT.test(cur)) return;
    const dst = A.t(cur);
    if (dst === cur) return; // لا حاجة لذاكرة إن لم يتغيّر شيء
    textOrig.set(node, { src: cur, dst });
    node.nodeValue = dst;
  }

  function restoreNode(node) {
    const rec = textOrig.get(node);
    if (rec) {
      if (node.nodeValue === rec.dst) node.nodeValue = rec.src;
      textOrig.delete(node);
    }
  }

  function translateEl(el) {
    if (!el || el.nodeType !== 1) return;
    ATTRS.forEach((a) => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const cur = el.getAttribute(a);
      if (!AR.test(cur)) return;
      let rec = attrOrig.get(el);
      if (!rec) { rec = {}; attrOrig.set(el, rec); }
      if (rec[a] && cur === rec[a].dst) return;
      if (rec[a] && cur === rec[a].src) return;
      const dst = A.t(cur);
      if (dst === cur) return;
      rec[a] = { src: cur, dst };
      el.setAttribute(a, dst);
    });
  }

  function restoreEl(el) {
    const rec = attrOrig.get(el);
    if (!rec) return;
    ATTRS.forEach((a) => {
      if (rec[a] && el.getAttribute(a) === rec[a].dst) el.setAttribute(a, rec[a].src);
    });
    attrOrig.delete(el);
  }

  function walk(root, fnNode, fnEl) {
    if (!root) return;
    if (root.nodeType === 3) { fnNode(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) fnEl(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null);
    let n = tw.nextNode();
    while (n) {
      if (n.nodeType === 3) fnNode(n);
      else fnEl(n);
      n = tw.nextNode();
    }
  }

  function applyAll(mode) {
    const fnNode = mode === 'restore' ? restoreNode : translateNode;
    const fnEl = mode === 'restore' ? restoreEl : translateEl;
    walk(document.body, fnNode, fnEl);
    // عنوان الصفحة والوصف
    translateMeta(mode);
  }

  const META_ORIG = {
    title: document.title,
    desc: (document.querySelector('meta[name="description"]') || {}).content || '',
  };
  function translateMeta(mode) {
    if (mode === 'restore') {
      document.title = META_ORIG.title;
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', META_ORIG.desc);
      return;
    }
    document.title = 'Kingdom of Ash — Dark Fantasy Story';
    const m = document.querySelector('meta[name="description"]');
    if (m) {
      m.setAttribute('content', 'Kingdom of Ash — a 2D dark-fantasy story game. Created and developed by CyberTux / Nashwan.');
    }
  }

  // مراقبة كل ما يُضاف لاحقًا (الحوارات، النوافذ، التوستات...)
  let observer = null;
  function startObserver() {
    if (observer || !document.body) return;
    observer = new MutationObserver((muts) => {
      for (let i = 0; i < muts.length; i++) {
        const m = muts[i];
        if (m.type === 'characterData') {
          translateNode(m.target);
        } else if (m.type === 'attributes') {
          translateEl(m.target);
        } else {
          for (let j = 0; j < m.addedNodes.length; j++) {
            const n = m.addedNodes[j];
            if (n.nodeType === 3) translateNode(n);
            else if (n.nodeType === 1) walk(n, translateNode, translateEl);
          }
        }
      }
    });
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ATTRS,
    });
  }

  // ---------- اعتراض نصوص Canvas ----------
  let canvasPatched = false;
  function patchCanvas() {
    if (canvasPatched || !window.CanvasRenderingContext2D) return;
    canvasPatched = true;
    const proto = CanvasRenderingContext2D.prototype;
    ['fillText', 'strokeText'].forEach((name) => {
      const orig = proto[name];
      if (typeof orig !== 'function') return;
      proto[name] = function (text, x, y, maxWidth) {
        let t = text;
        if (A.lang === 'en' && typeof t === 'string') {
          t = A.t(t);
          // الإنجليزية أطول غالبًا: صغّر الخط قليلًا عند الحاجة فقط
        }
        if (arguments.length > 3) return orig.call(this, t, x, y, maxWidth);
        return orig.call(this, t, x, y);
      };
    });
  }

  // ---------- زر تبديل اللغة ----------
  let toggle = null;
  function updateToggle() {
    if (!toggle) return;
    const en = A.lang === 'en';
    toggle.innerHTML = '<span class="lt-ico">◐</span><span class="lt-txt">' + (en ? 'العربية' : 'English') + '</span>';
    toggle.setAttribute('title', en ? 'التبديل إلى العربية' : 'Switch to English');
    toggle.setAttribute('aria-label', en ? 'التبديل إلى العربية' : 'Switch to English');
    toggle.setAttribute('data-mode', en ? 'en' : 'ar');
  }

  function mountToggle() {
    if (document.getElementById('lang-toggle')) { toggle = document.getElementById('lang-toggle'); updateToggle(); return; }
    toggle = document.createElement('button');
    toggle.id = 'lang-toggle';
    toggle.type = 'button';
    toggle.addEventListener('pointerdown', (e) => e.stopPropagation());
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { if (A.audio && A.audio.click) A.audio.click(); } catch (err) { /* تجاهل */ }
      A.setLang(A.lang === 'en' ? 'ar' : 'en');
    });
    const stage = document.getElementById('stage') || document.body;
    stage.appendChild(toggle);
    updateToggle();
  }

  // ---------- الواجهة العامة ----------
  A.setLang = function (lang, opts) {
    lang = lang === 'en' ? 'en' : 'ar';
    const changed = lang !== A.lang;
    A.lang = lang;
    try { localStorage.setItem(KEY, lang); } catch (e) { /* تجاهل */ }

    const html = document.documentElement;
    html.setAttribute('lang', lang === 'en' ? 'en' : 'ar');
    html.setAttribute('dir', lang === 'en' ? 'ltr' : 'rtl');
    html.setAttribute('data-lang', lang);

    applyAll(lang === 'ar' ? 'restore' : 'translate');
    updateToggle();

    // إعادة رسم بعض الشاشات التي تحفظ نصوصًا داخل حالة JS
    if (changed && !(opts && opts.silent)) {
      try { window.dispatchEvent(new CustomEvent('ash:lang', { detail: { lang } })); } catch (e) { /* تجاهل */ }
      if (A.game && A.game.onLangChange) A.game.onLangChange(lang);
    }
    return lang;
  };
  A.toggleLang = function () { return A.setLang(A.lang === 'en' ? 'ar' : 'en'); };

  A.i18n = {
    t: A.t,
    setLang: A.setLang,
    toggle: A.toggleLang,
    apply: function () { applyAll(A.lang === 'ar' ? 'restore' : 'translate'); },
    ready: false,
  };

  function boot() {
    A.setLang(A.lang, { silent: true });
    mountToggle();
    startObserver();
    patchCanvas();
    A.i18n.ready = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.ASH);
