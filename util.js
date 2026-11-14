/* أدوات عامة */
window.ASH = window.ASH || {};
(function (A) {
  A.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  A.rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  A.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  A.chance = (p) => Math.random() < p;
  A.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  A.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  A.el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };
  A.$ = (sel, root) => (root || document).querySelector(sel);
  A.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  A.esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  A.fmt = (n) =>
    A.lang === 'en' ? String(n) : String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
  A.pct = (n) => A.fmt(Math.round(n)) + (A.lang === 'en' ? '%' : '٪');
  // أسماء الموارد بالإنجليزية: المفرد عند العدد ١، والجمع فيما عداه.
  const RES_EN = {
    wood: ['Wood', 'Wood'],
    iron: ['Iron', 'Iron'],
    herb: ['Herb', 'Herbs'],
    stone: ['Stone', 'Stone'],
  };
  A.resName = (k, n) => {
    if (A.lang === 'en' && RES_EN[k]) return RES_EN[k][n === 1 ? 0 : 1];
    const r = A.DATA && A.DATA.res && A.DATA.res[k];
    return r ? r.name : k;
  };
  A.rng = (seed) => {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  A.lerp = (a, b, t) => a + (b - a) * t;
  A.easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // تبسيط النص: **عريض** -> <b>
  A.rich = (s) => {
    let t = A.esc(s);
    t = t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    t = t.replace(/\*(.+?)\*/g, '<span class="em">$1</span>');
    return t;
  };
})(window.ASH);
