/* مؤثرات صوتية وموسيقى محيطة مُولّدة بالكود */
(function (A) {
  const S = (A.audio = {
    ctx: null,
    master: null,
    musicBus: null,
    muted: false,
    _timer: null,
    _mood: null,
    _gen: 0,
    _noise: null,
  });

  S.init = function () {
    if (S.ctx) {
      if (S.ctx.state === 'suspended') S.ctx.resume();
      return;
    }
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return;
    S.ctx = new C();
    S.master = S.ctx.createGain();
    S.master.gain.value = S.muted ? 0 : 0.4;
    S.master.connect(S.ctx.destination);
    // حافلة الموسيقى منفصلة عن المؤثرات حتى يبقى الخليط متوازنًا
    S.musicBus = S.ctx.createGain();
    S.musicBus.gain.value = 0.0001;
    S.musicBus.connect(S.master);
    // ضجيج أبيض مُخزّن
    const len = Math.floor(S.ctx.sampleRate * 1.2);
    const buf = S.ctx.createBuffer(1, len, S.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    S._noise = buf;
  };

  S.setMuted = function (m) {
    S.muted = m;
    if (S.master) S.master.gain.setTargetAtTime(m ? 0 : 0.4, S.ctx.currentTime, 0.05);
  };
  S.toggle = function () {
    S.setMuted(!S.muted);
    return S.muted;
  };

  function note(f, dur, type, vol, when, slide) {
    if (!S.ctx || S.muted) return;
    const t0 = S.ctx.currentTime + (when || 0);
    const o = S.ctx.createOscillator();
    const g = S.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(S.master);
    o.start(t0); o.stop(t0 + dur + 0.06);
  }

  function noise(dur, vol, freq, when) {
    if (!S.ctx || S.muted || !S._noise) return;
    const t0 = S.ctx.currentTime + (when || 0);
    const src = S.ctx.createBufferSource();
    src.buffer = S._noise;
    const bp = S.ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = freq || 900; bp.Q.value = 0.8;
    const g = S.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(S.master);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  S.click = () => { note(720, 0.05, 'square', 0.05); };
  S.select = () => { note(880, 0.07, 'triangle', 0.07); note(1174, 0.09, 'triangle', 0.05, 0.05); };
  S.hit = () => { noise(0.14, 0.16, 700); note(150, 0.12, 'sawtooth', 0.07, 0, 60); };
  S.hurt = () => { noise(0.18, 0.13, 420); note(190, 0.2, 'square', 0.06, 0, 70); };
  S.heal = () => { [523, 659, 784].forEach((f, i) => note(f, 0.3, 'sine', 0.06, i * 0.07)); };
  S.gather = () => { noise(0.05, 0.06, 1400); note(440, 0.08, 'square', 0.04); };
  S.coin = () => { note(988, 0.1, 'square', 0.05); note(1319, 0.16, 'square', 0.045, 0.06); };
  S.day = () => { note(196, 0.7, 'sine', 0.07); note(147, 0.9, 'sine', 0.05, 0.12); };
  S.win = () => { [523, 659, 784, 1046].forEach((f, i) => note(f, 0.45, 'triangle', 0.07, i * 0.11)); };
  S.trophy = () => { [659, 784, 988, 1319].forEach((f, i) => note(f, 0.5, 'triangle', 0.06, i * 0.09)); note(1568, 0.7, 'sine', 0.035, 0.36); };
  S.lose = () => { [330, 262, 196, 147].forEach((f, i) => note(f, 0.6, 'sawtooth', 0.05, i * 0.16)); };
  S.gate = () => { note(90, 1.4, 'sawtooth', 0.09, 0, 36); noise(1.2, 0.06, 260); };
  S.arrow = () => { noise(0.08, 0.1, 2400); note(1200, 0.1, 'sine', 0.03, 0, 500); };
  S.tower = () => { noise(0.5, 0.2, 220); note(70, 0.5, 'sawtooth', 0.1, 0, 40); };

  // ============================================================
  //  الموسيقى التصويرية — طبقات إمبراطورية دارك فانتازي
  // ============================================================
  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function panNode(p) {
    if (!S.ctx || !S.ctx.createStereoPanner || p == null) return null;
    const n = S.ctx.createStereoPanner();
    n.pan.value = Math.max(-1, Math.min(1, p));
    return n;
  }

  // نغمة موسيقية بغلاف هجوم/إطلاق وفلتر واهتزاز وموضع ستيريو
  function mtone(m, dur, o) {
    if (!S.ctx || S.muted || !S.musicBus) return;
    o = o || {};
    const t0 = S.ctx.currentTime + (o.when || 0);
    const d = Math.max(0.08, dur);
    const osc = S.ctx.createOscillator();
    const g = S.ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(mtof(m), t0);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(mtof(o.slideTo), t0 + d);
    let last = osc;
    if (o.filter) {
      const f = S.ctx.createBiquadFilter();
      f.type = o.filterType || 'lowpass';
      f.frequency.setValueAtTime(o.filter, t0);
      f.Q.setValueAtTime(o.q || 0.7, t0);
      last.connect(f); last = f;
    }
    const pn = panNode(o.pan);
    if (pn) { last.connect(pn); last = pn; }
    const vol = Math.max(0.0002, o.vol || 0.02);
    const atk = Math.min(o.attack || 0.02, d * 0.6);
    const rel = Math.min(o.release || 0.3, d * 0.7);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + atk);
    g.gain.setValueAtTime(vol, Math.max(t0 + atk, t0 + d - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    last.connect(g); g.connect(S.musicBus);
    if (o.vib) {
      const lfo = S.ctx.createOscillator();
      const lg = S.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = o.vib.rate || 5;
      lg.gain.value = o.vib.depth || 4;
      lfo.connect(lg); lg.connect(osc.frequency);
      lfo.start(t0); lfo.stop(t0 + d + 0.08);
    }
    osc.start(t0); osc.stop(t0 + d + 0.06);
  }

  function mnoise(dur, vol, freq, when, type, pan) {
    if (!S.ctx || S.muted || !S._noise || !S.musicBus) return;
    const t0 = S.ctx.currentTime + (when || 0);
    const src = S.ctx.createBufferSource();
    src.buffer = S._noise;
    src.loop = true;
    const bp = S.ctx.createBiquadFilter();
    bp.type = type || 'bandpass';
    bp.frequency.value = freq || 600;
    bp.Q.value = type === 'lowpass' ? 0.5 : 0.7;
    const g = S.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol || 0.01, t0 + Math.min(0.6, dur * 0.3));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp);
    let last = bp;
    const pn = panNode(pan);
    if (pn) { last.connect(pn); last = pn; }
    last.connect(g); g.connect(S.musicBus);
    src.start(t0); src.stop(t0 + dur + 0.05);
  }

  function drum(when, vol, f, decay) {
    if (!S.ctx || S.muted || !S.musicBus) return;
    const t0 = S.ctx.currentTime + when;
    const o = S.ctx.createOscillator();
    const g = S.ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(24, f * 0.32), t0 + decay);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + decay);
    o.connect(g); g.connect(S.musicBus);
    o.start(t0); o.stop(t0 + decay + 0.03);
  }

  function snare(when, vol, freq) {
    mnoise(0.16, vol, freq || 1600, when, 'highpass');
    drum(when, vol * 0.35, 180, 0.09);
  }

  // ضربة معدن/سندان: جزئيات غير متناغمة قصيرة
  function metal(when, vol, base, pan) {
    if (!S.ctx || S.muted || !S.musicBus) return;
    const t0 = S.ctx.currentTime + (when || 0);
    [1, 2.76, 5.4, 8.93].forEach((r, i) => {
      const o = S.ctx.createOscillator();
      const g = S.ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime((base || 180) * r, t0);
      const dec = 0.5 / (1 + i * 0.8);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0003, (vol || 0.006) / (1 + i * 1.3)), t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dec);
      let last = o;
      const pn = panNode(pan);
      if (pn) { last.connect(pn); last = pn; }
      last.connect(g); g.connect(S.musicBus);
      o.start(t0); o.stop(t0 + dec + 0.04);
    });
    mnoise(0.05, (vol || 0.006) * 0.5, 4200, when, 'highpass', pan);
  }

  function shaker(when, vol, pan) {
    mnoise(0.045, vol || 0.004, 7200, when, 'highpass', pan);
  }

  // ---------- آلات ----------
  function iBell(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.006;
    [1, 2.01, 2.98, 4.16].forEach((r, i) => {
      mtone(m + 12 * Math.log2(r), dur * (1 - i * 0.13), {
        type: 'sine', vol: vol / (1 + i * 1.5), when: o.when,
        attack: 0.006, release: Math.min(1.6, dur * 0.7), pan: o.pan,
      });
    });
  }

  function iFlute(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.008;
    mtone(m, dur, {
      type: 'sine', vol, when: o.when, attack: 0.1,
      release: Math.min(0.9, dur * 0.45), filter: 2200, pan: o.pan,
      vib: { rate: 5.1, depth: 4.5 },
    });
    mtone(m + 12, dur * 0.8, {
      type: 'sine', vol: vol * 0.22, when: o.when, attack: 0.12,
      release: Math.min(0.8, dur * 0.4), pan: o.pan,
    });
    mnoise(dur * 0.9, vol * 0.16, mtof(m) * 2, o.when, 'bandpass', o.pan);
  }

  function iHorn(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.007;
    mtone(m, dur, {
      type: 'sawtooth', vol, when: o.when, attack: 0.14,
      release: Math.min(0.9, dur * 0.45), filter: o.filter || 1000, q: 1.5, pan: o.pan,
    });
    mtone(m - 12, dur, {
      type: 'sawtooth', vol: vol * 0.32, when: o.when, attack: 0.2,
      release: Math.min(0.9, dur * 0.45), filter: 520, q: 1.2, pan: o.pan,
    });
  }

  function iPluck(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.006;
    mtone(m, dur, {
      type: 'triangle', vol, when: o.when, attack: 0.004,
      release: Math.min(0.55, dur * 0.85), filter: o.filter || 2800, q: 1.1, pan: o.pan,
    });
    mtone(m + 12, dur * 0.4, {
      type: 'sine', vol: vol * 0.35, when: o.when, attack: 0.003,
      release: Math.min(0.3, dur * 0.35), pan: o.pan,
    });
  }

  function iString(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.007;
    mtone(m, dur, {
      type: 'sawtooth', vol, when: o.when, attack: 0.22,
      release: Math.min(1.2, dur * 0.45), filter: 1450, q: 1.1, pan: o.pan,
    });
    mtone(m, dur, {
      type: 'sawtooth', vol: vol * 0.7, when: o.when, attack: 0.28,
      release: Math.min(1.3, dur * 0.45), filter: 1450, q: 1.1, detune: 8, pan: o.pan,
    });
  }

  function iChoirNote(m, dur, o) {
    o = o || {};
    const vol = o.vol || 0.005;
    mtone(m, dur, {
      type: 'sine', vol, when: o.when, attack: 0.4,
      release: Math.min(1.2, dur * 0.5), filter: 1750, pan: o.pan,
    });
    mtone(m + 12, dur, {
      type: 'sine', vol: vol * 0.34, when: o.when, attack: 0.5,
      release: Math.min(1.2, dur * 0.5), filter: 1550, pan: o.pan,
    });
  }

  function playDrums(kind, t0, beat, barLen, vol) {
    vol = vol || 0.05;
    if (kind === 'imperial') {
      drum(t0, vol, 62, 1.1);
      drum(t0 + beat * 2, vol * 0.7, 56, 0.9);
      if (Math.random() < 0.4) drum(t0 + beat * 3.5, vol * 0.35, 74, 0.35);
      if (Math.random() < 0.22) drum(t0 + 0.02, vol * 0.8, 48, 2.2);
    } else if (kind === 'war') {
      for (let b = 0; b < 4; b++) drum(t0 + b * beat, b % 2 === 0 ? vol : vol * 0.7, 64, 0.32);
      snare(t0 + beat, vol * 0.55, 1800);
      snare(t0 + beat * 3, vol * 0.5, 1500);
      mnoise(barLen * 0.9, vol * 0.22, 5200, t0, 'highpass');
      drum(t0 + beat * 2, vol * 0.9, 44, 1.4);
      shaker(t0 + beat * 0.5, vol * 0.18);
      shaker(t0 + beat * 2.5, vol * 0.16);
    } else if (kind === 'battle') {
      for (let b = 0; b < 4; b++) {
        drum(t0 + b * beat, b === 0 ? vol * 1.15 : vol * 0.82, 62, 0.2);
        drum(t0 + (b + 0.5) * beat, vol * 0.42, 50, 0.15);
      }
      drum(t0 + beat * 2.5, vol * 0.9, 42, 1.1);
      snare(t0 + beat, vol * 0.72, 2100);
      snare(t0 + beat * 3, vol * 0.68, 1800);
      snare(t0 + beat * 3.5, vol * 0.4, 2600);
      mnoise(barLen * 0.92, vol * 0.3, 6400, t0, 'highpass');
      mnoise(0.09, vol * 0.22, 3200, t0 + beat * 1.5, 'bandpass');
      metal(t0 + beat * 2, vol * 0.3, 340, 0.35);
    } else if (kind === 'village') {
      drum(t0, vol * 0.8, 60, 0.55);
      drum(t0 + beat * 1.5, vol * 0.35, 56, 0.35);
      drum(t0 + beat * 2, vol * 0.55, 60, 0.5);
      shaker(t0 + beat, vol * 0.25);
      shaker(t0 + beat * 3, vol * 0.22);
    } else if (kind === 'forest') {
      drum(t0, vol * 0.75, 48, 1.1);
      drum(t0 + beat * 2.5, vol * 0.45, 44, 0.8);
      mnoise(0.06, vol * 0.35, 2800, t0 + beat * 1.5, 'bandpass', -0.3);
      mnoise(0.05, vol * 0.25, 3400, t0 + beat * 3.5, 'bandpass', 0.3);
    } else if (kind === 'cave') {
      drum(t0, vol, 40, 1.4);
      drum(t0 + beat * 2, vol * 0.65, 36, 1.1);
      metal(t0 + beat * 1.5, vol * 0.35, 150);
      mnoise(barLen * 0.9, vol * 0.18, 1400, t0, 'bandpass');
    } else if (kind === 'market') {
      drum(t0, vol * 0.7, 72, 0.22);
      drum(t0 + beat * 1.5, vol * 0.55, 66, 0.2);
      drum(t0 + beat * 2, vol * 0.7, 72, 0.22);
      drum(t0 + beat * 3.5, vol * 0.45, 64, 0.18);
      snare(t0 + beat, vol * 0.35, 2300);
      snare(t0 + beat * 3, vol * 0.3, 2100);
      for (let b = 0; b < 4; b += 0.5) shaker(t0 + b * beat, vol * 0.18);
    } else if (kind === 'jinn') {
      drum(t0, vol * 0.85, 84, 0.24);
      drum(t0 + beat * 0.75, vol * 0.5, 76, 0.18);
      drum(t0 + beat * 2, vol * 0.7, 84, 0.22);
      drum(t0 + beat * 2.75, vol * 0.55, 92, 0.16);
      for (let b = 0; b < 4; b += 0.5) shaker(t0 + b * beat, vol * 0.16, 0.35);
      metal(t0 + beat * 3, vol * 0.22, 520, -0.3);
    } else if (kind === 'royal') {
      drum(t0, vol, 55, 1.0);
      drum(t0 + beat * 2, vol * 0.7, 50, 0.8);
      snare(t0 + beat * 1.5, vol * 0.22, 1800);
      snare(t0 + beat * 3.5, vol * 0.2, 1600);
      drum(t0 + beat * 3, vol * 0.35, 70, 0.25);
    } else if (kind === 'march') {
      drum(t0, vol * 0.8, 60, 0.8);
      drum(t0 + beat * 2, vol * 0.65, 54, 0.7);
      snare(t0 + beat * 1.5, vol * 0.35, 1700);
      snare(t0 + beat * 3.5, vol * 0.3, 1500);
    } else if (kind === 'frame') {
      drum(t0, vol * 0.75, 92, 0.28);
      drum(t0 + beat * 1.5, vol * 0.45, 110, 0.2);
      drum(t0 + beat * 2.5, vol * 0.55, 88, 0.24);
      snare(t0 + beat * 3.25, vol * 0.22, 2200);
    } else if (kind === 'soft') {
      drum(t0, vol * 0.55, 54, 1.6);
      if (Math.random() < 0.5) drum(t0 + beat * 2.5, vol * 0.3, 48, 1.2);
    }
  }

  // طبقة إضافية داخل القوس: آلة + نمط/نغمات خاصة بالمكان
  function playLayer(L, bar, t0, beat, barLen, beats) {
    const vol = L.vol || 0.006;
    const pan = L.pan;
    if (L.inst === 'wind' || L.inst === 'water' || L.inst === 'air') {
      mnoise(barLen * 1.06, vol, L.freq || 560, t0, L.inst === 'water' ? 'lowpass' : 'bandpass', pan);
      return;
    }
    if (L.inst === 'crackle') {
      const n = L.count || 3;
      for (let i = 0; i < n; i++) {
        const r = Math.random();
        mnoise(0.03 + r * 0.06, vol * (0.5 + r), 2200 + Math.random() * 4200,
          t0 + Math.random() * barLen, 'bandpass', (Math.random() * 2 - 1) * 0.8);
      }
      return;
    }
    if (L.inst === 'birds') {
      const n = L.count || 2;
      for (let i = 0; i < n; i++) {
        if (Math.random() < 0.35) continue;
        const m = 88 + Math.floor(Math.random() * 10);
        mtone(m, 0.1 + Math.random() * 0.12, {
          type: 'sine', vol: vol * (0.6 + Math.random() * 0.6),
          when: t0 + Math.random() * barLen, attack: 0.005, release: 0.08,
          pan: (Math.random() * 2 - 1) * 0.8,
        });
      }
      return;
    }
    if (L.inst === 'shaker') {
      const rate = L.rate || 0.5;
      for (let b = 0, k = 0; b < beats; b += rate, k++) {
        shaker(t0 + b * beat, vol * (k % 2 ? 0.55 : 1), pan);
      }
      return;
    }
    if (L.inst === 'metal') {
      (L.pattern || [0, 2]).forEach((b, k) => {
        metal(t0 + b * beat, vol * (k ? 0.72 : 1), L.freq || 180, pan);
      });
      return;
    }
    if (L.inst === 'timpani') {
      (L.pattern || [[38, 0], [38, 2]]).forEach(([m, at]) => {
        drum(t0 + at * beat, vol, mtof(m) / 2, 1.15);
        mnoise(0.12, vol * 0.35, 260, t0 + at * beat, 'lowpass');
      });
      return;
    }
    if (L.inst === 'harp' || L.inst === 'pluck' || L.inst === 'lute') {
      const pat = L.pattern || [];
      const rate = L.rate || 0.5;
      const oct = L.octave || 0;
      for (let b = 0, k = 0; b < beats; b += rate, k++) {
        const m = pat[(bar * 3 + k) % pat.length] + oct;
        iPluck(m, beat * rate * 1.8, {
          when: t0 + b * beat, vol: vol * (k % 2 ? 0.72 : 1), pan,
        });
      }
      return;
    }
    if (!L.notes || !L.notes.length) return;
    const ph = L.notes[bar % L.notes.length];
    if (!ph) return;
    const evs = Array.isArray(ph[0]) ? ph : [[ph, 0, beats]];
    evs.forEach(([m, at, len]) => {
      const when = t0 + (at || 0) * beat;
      const d = Math.max(0.2, (len || 1) * beat);
      if (L.inst === 'bell') iBell(m, d, { when, vol, pan });
      else if (L.inst === 'flute') iFlute(m, d, { when, vol, pan });
      else if (L.inst === 'horn') iHorn(m, d, { when, vol, pan });
      else if (L.inst === 'string' || L.inst === 'strings') iString(m, d, { when, vol, pan });
      else if (L.inst === 'choir') iChoirNote(m, d, { when, vol, pan });
      else iPluck(m, d, { when, vol, pan });
    });
  }

  // كل مقطع = قوس واحد (4 ضربات) يُعاد تركيبه حسب المزاج
  const TRACKS = {
    // العنوان: وقار إمبراطوري، أبواق، جوقة، أجراس، طبول جنازة
    title: {
      bpm: 60, beats: 4,
      chords: [[50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [48, 52, 55, 60]],
      bass: [38, 34, 29, 36],
      melody: [
        [[74, 0, 1.8], [77, 1.9, 1.8]],
        [[76, 0, 1.5], [72, 1.6, 2.2]],
        [[69, 0, 1.7], [72, 1.8, 1.0], [77, 2.9, 1.1]],
        [[74, 0, 3.0], [69, 3.1, 0.9]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1500, melodyVol: 0.019,
      padType: 'sawtooth', padVol: 0.009, padFilter: 1050, padShimmer: true,
      choir: 0.006,
      counter: [81, 79, 77, 84], counterVol: 0.0045,
      arp: [50, 62, 69, 74, 69, 62], arpRate: 0.5, arpVol: 0.0045,
      drums: 'imperial', drumVol: 0.05,
      air: 0.006,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 3.4], [57, 0, 3.4]], [[46, 0, 3.4], [53, 0, 3.4]], [[41, 0, 3.4], [48, 0, 3.4]], [[48, 0, 3.4], [55, 0, 3.4]]], vol: 0.0065 },
        { inst: 'bell', notes: [[[86, 0, 2.2], [81, 2.1, 1.8]], [[84, 0, 2.0], [79, 2.0, 1.8]], [[81, 0, 2.2], [77, 2.1, 1.8]], [[79, 0, 2.4], [86, 2.4, 1.6]]], vol: 0.0035 },
        { inst: 'harp', pattern: [62, 69, 74, 77, 74, 69], rate: 0.5, vol: 0.004 },
        { inst: 'wind', vol: 0.006, freq: 480 },
      ],
    },
    // دير النار: دفء حزين، ناي، قيثارة، جوقة بعيدة، نار
    village: {
      bpm: 66, beats: 4,
      chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
      bass: [38, 34, 36, 33],
      melody: [
        [[69, 0, 1.4], [65, 1.5, 0.9], [67, 2.4, 1.5]],
        [[65, 0, 1.2], [62, 1.3, 0.9], [64, 2.2, 1.6]],
        [[64, 0, 1.1], [67, 1.2, 0.9], [69, 2.1, 1.7]],
        [[69, 0, 1.6], [65, 1.7, 1.0], [62, 2.7, 1.2]],
      ],
      melodyType: 'sine', melodyVol: 0.013,
      padType: 'triangle', padVol: 0.011, padFilter: 1200,
      choir: 0.0045,
      arp: [62, 65, 69, 74, 69, 65], arpRate: 0.5, arpVol: 0.0045,
      drums: 'village', drumVol: 0.03,
      air: 0.005, airFreq: 700,
      layers: [
        { inst: 'flute', notes: [[[74, 0, 1.8], [72, 1.9, 1.5]], [[72, 0, 1.6], [69, 1.7, 1.9]], [[70, 0, 1.5], [67, 1.6, 1.8]], [[69, 0, 2.4], [65, 2.4, 1.2]]], vol: 0.008, pan: -0.15 },
        { inst: 'harp', pattern: [50, 57, 62, 65, 62, 57], rate: 0.5, vol: 0.0035, pan: 0.2 },
        { inst: 'bell', notes: [[[81, 0, 2.4]], [[77, 0, 2.4]], [[79, 0, 2.4]], [[77, 0, 2.6]]], vol: 0.0028 },
        { inst: 'crackle', vol: 0.0035, count: 3 },
      ],
    },
    // غابة الهمس: ناي بعيد، حفيف، طيور، ظلّ منخفض
    forest: {
      bpm: 52, beats: 4,
      chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]],
      bass: [38, 36, 34, 33],
      melody: [
        [[74, 0, 2.2], [72, 2.3, 1.4]],
        [[72, 0, 2.0], [69, 2.1, 1.7]],
        [[70, 0, 1.8], [67, 1.9, 1.9]],
        [[69, 0, 2.8], [65, 2.9, 0.9]],
      ],
      melodyType: 'sine', melodyVol: 0.012,
      padType: 'triangle', padVol: 0.009, padFilter: 820,
      choir: 0.0035,
      counter: [74, 72, 70, 69], counterVol: 0.0035,
      drums: 'forest', drumVol: 0.028,
      air: 0.012, airFreq: 520,
      ost: [38, 38, 41, 38, 36, 36, 40, 36], ostVol: 0.004, ostFilter: 360,
      layers: [
        { inst: 'flute', notes: [[[81, 0, 1.4], [79, 1.5, 1.0]], [[79, 0, 1.2], [76, 1.3, 1.1]], [[77, 0, 1.3], [74, 1.4, 1.0]], [[76, 0, 1.6], [72, 1.7, 1.2]]], vol: 0.0065, pan: 0.25 },
        { inst: 'harp', pattern: [62, 69, 72, 69], rate: 1.0, vol: 0.0035, pan: -0.2 },
        { inst: 'birds', vol: 0.0035, count: 2 },
        { inst: 'wind', vol: 0.009, freq: 540 },
      ],
    },
    // مناجم الجمر: سندان، طبول عميقة، قطرات معدن، هواء ثقيل
    mine: {
      bpm: 58, beats: 4,
      chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],
      bass: [38, 34, 31, 33],
      melody: [
        [[62, 0, 2.4], [65, 2.5, 1.2]],
        [[60, 0, 2.2], [58, 2.3, 1.4]],
        [[55, 0, 2.5], [58, 2.6, 1.2]],
        [[57, 0, 3.0]],
      ],
      melodyType: 'triangle', melodyFilter: 700, melodyVol: 0.011,
      padType: 'sawtooth', padVol: 0.006, padFilter: 620,
      choir: 0.0025,
      drums: 'cave', drumVol: 0.04,
      air: 0.009, airFreq: 380,
      ost: [38, 38, 34, 38, 41, 38, 34, 38], ostVol: 0.006, ostFilter: 420,
      layers: [
        { inst: 'metal', pattern: [0, 1.5, 2.5], freq: 165, vol: 0.0045, pan: 0.25 },
        { inst: 'timpani', pattern: [[38, 0], [33, 2.5]], vol: 0.012 },
        { inst: 'bell', notes: [[[93, 0, 1.2]], [[88, 0, 1.4]], [[91, 0, 1.1]], [[86, 0, 1.5]]], vol: 0.0022, pan: -0.35 },
        { inst: 'wind', vol: 0.005, freq: 320 },
      ],
    },
    // أنقاض قلعة الشمس: حزن بلا طبول، ناي وحيد، ريح وأجراس بعيدة
    ruins: {
      bpm: 46, beats: 4,
      chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],
      bass: [38, 34, 31, 33],
      melody: [
        [[69, 0, 3.0], [67, 3.1, 0.9]],
        [[65, 0, 2.6], [62, 2.7, 1.2]],
        [[60, 0, 3.0], [62, 3.1, 0.9]],
        [[57, 0, 3.6]],
      ],
      melodyType: 'sine', melodyVol: 0.014,
      padType: 'sine', padVol: 0.01, padFilter: 900, padShimmer: true,
      choir: 0.005,
      counter: [74, 72, 70, 69], counterVol: 0.004,
      drums: null,
      air: 0.022, airFreq: 430,
      layers: [
        { inst: 'flute', notes: [[[81, 0, 2.4], [79, 2.5, 1.4]], [[79, 0, 2.2], [76, 2.3, 1.5]], [[77, 0, 2.3], [74, 2.4, 1.6]], [[76, 0, 3.0]]], vol: 0.0075, pan: 0.2 },
        { inst: 'bell', notes: [[[86, 0, 3.8]], [[81, 0, 3.8]], [[79, 0, 3.8]], [[74, 0, 3.8]]], vol: 0.0028, pan: -0.3 },
        { inst: 'wind', vol: 0.012, freq: 600 },
      ],
    },
    // سوق الرماد: إيقاع إطار، قيثارة سريعة، ناي، عملات
    market: {
      bpm: 88, beats: 4,
      chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]],
      bass: [38, 36, 34, 33],
      melody: [
        [[69, 0, 0.5], [72, 0.5, 0.5], [74, 1, 0.5], [72, 1.5, 0.5], [69, 2, 0.5], [65, 2.5, 0.5], [69, 3, 0.8]],
        [[67, 0, 0.5], [70, 0.5, 0.5], [72, 1, 0.5], [70, 1.5, 0.5], [67, 2, 0.5], [64, 2.5, 0.5], [67, 3, 0.8]],
        [[65, 0, 0.5], [69, 0.5, 0.5], [72, 1, 0.5], [69, 1.5, 0.5], [65, 2, 0.5], [62, 2.5, 0.5], [65, 3, 0.8]],
        [[64, 0, 0.5], [67, 0.5, 0.5], [70, 1, 0.5], [74, 1.5, 0.5], [72, 2, 0.5], [69, 2.5, 1.2]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1800, melodyVol: 0.013,
      padType: 'triangle', padVol: 0.008, padFilter: 1300,
      choir: 0.002,
      arp: [62, 65, 69, 74, 69, 65], arpRate: 0.5, arpVol: 0.004,
      drums: 'market', drumVol: 0.04,
      air: 0.004, airFreq: 800,
      layers: [
        { inst: 'flute', notes: [[[81, 0, 1.0], [79, 1, 0.8]], [[79, 0, 1.0], [76, 1, 1.0]], [[77, 0, 1.0], [74, 1, 1.0]], [[76, 0, 1.2], [72, 1.3, 1.0]]], vol: 0.005, pan: 0.3 },
        { inst: 'harp', pattern: [50, 57, 62, 69, 74, 69, 62, 57], rate: 0.25, vol: 0.0035, pan: -0.25 },
        { inst: 'bell', notes: [[[93, 0, 0.4]], [[88, 0, 0.4]], [[91, 0, 0.4]], [[86, 0, 0.4]]], vol: 0.0018, pan: 0.35 },
      ],
    },
    // قصر الجنّ: مقام شرقي، إيقاع إطار، نار، أجراس وجوقة
    jinn: {
      bpm: 80, beats: 4,
      chords: [[50, 53, 57], [51, 55, 58], [53, 57, 60], [48, 52, 55]],
      bass: [38, 39, 41, 36],
      melody: [
        [[62, 0, 0.9], [63, 1, 0.9], [65, 2, 0.9], [67, 3, 1]],
        [[62, 0, 0.9], [65, 1, 0.9], [67, 2, 0.9], [70, 3, 1]],
        [[65, 0, 0.9], [67, 1, 0.9], [70, 2, 0.9], [74, 3, 1]],
        [[72, 0, 1.6], [70, 1.7, 0.9], [67, 2.7, 1.2]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1200, melodyVol: 0.014,
      padType: 'triangle', padVol: 0.01, padFilter: 1200,
      choir: 0.0035,
      arp: [62, 65, 67, 74, 70, 67], arpRate: 0.5, arpVol: 0.0045,
      drums: 'jinn', drumVol: 0.04,
      air: 0.012, airFreq: 620,
      ost: [38, 38, 41, 38, 36, 36, 39, 36], ostVol: 0.005, ostFilter: 480,
      layers: [
        { inst: 'pluck', pattern: [62, 67, 74, 67], rate: 0.5, vol: 0.004, pan: 0.25 },
        { inst: 'bell', notes: [[[86, 0, 1.4]], [[88, 0, 1.4]], [[91, 0, 1.3]], [[86, 0, 1.6]]], vol: 0.003, pan: -0.2 },
        { inst: 'flute', notes: [[[81, 0, 1.2], [84, 1.3, 1.0]], [[79, 0, 1.2], [82, 1.3, 1.0]], [[77, 0, 1.1], [81, 1.2, 1.2]], [[76, 0, 1.4], [79, 1.5, 1.2]]], vol: 0.005, pan: 0.35 },
        { inst: 'crackle', vol: 0.004, count: 4 },
      ],
    },
    // قصر الملك: موسيقى بلاطية، أبواق، جوقة، قيثارة وطبول ملكية
    palace: {
      bpm: 60, beats: 4,
      chords: [[50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [48, 52, 55, 60]],
      bass: [38, 34, 29, 36],
      melody: [
        [[69, 0, 1.4], [72, 1.5, 1.0], [74, 2.5, 1.5]],
        [[76, 0, 1.6], [74, 1.7, 1.0], [72, 2.7, 1.2]],
        [[72, 0, 1.4], [69, 1.5, 1.0], [65, 2.5, 1.5]],
        [[69, 0, 2.6], [74, 2.7, 1.1]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1200, melodyVol: 0.018,
      padType: 'sawtooth', padVol: 0.009, padFilter: 1000, padShimmer: true,
      choir: 0.0065,
      counter: [81, 79, 77, 84], counterVol: 0.0045,
      arp: [50, 62, 69, 74], arpRate: 0.5, arpVol: 0.004,
      drums: 'royal', drumVol: 0.045,
      air: 0.003, airFreq: 600,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 3.2], [57, 0, 3.2]], [[46, 0, 3.2], [53, 0, 3.2]], [[41, 0, 3.2], [48, 0, 3.2]], [[48, 0, 3.2], [55, 0, 3.2]]], vol: 0.006 },
        { inst: 'bell', notes: [[[86, 0, 2.6]], [[84, 0, 2.6]], [[81, 0, 2.6]], [[79, 0, 2.8]]], vol: 0.003 },
        { inst: 'harp', pattern: [62, 69, 74, 77], rate: 0.5, vol: 0.0035 },
      ],
    },
    // الجبل: اتساع، ناي، قيثارة، ريح وجوقة بعيدة — بلا طبول
    mountain: {
      bpm: 54, beats: 4,
      chords: [[50, 57, 62, 66], [48, 55, 60, 64], [45, 52, 57, 62], [47, 54, 59, 64]],
      bass: [38, 36, 33, 35],
      melody: [
        [[78, 0, 2.4], [81, 2.5, 1.4]],
        [[76, 0, 2.2], [72, 2.3, 1.6]],
        [[74, 0, 1.6], [69, 1.7, 1.2], [72, 2.9, 1.1]],
        [[74, 0, 2.8], [69, 2.9, 1.1]],
      ],
      melodyType: 'sine', melodyFilter: 2400, melodyVol: 0.012,
      padType: 'sine', padVol: 0.011, padFilter: 1700, padShimmer: true,
      choir: 0.006,
      arp: [62, 66, 69, 74, 69, 66], arpRate: 0.5, arpVol: 0.004,
      counter: [86, 81, 84, 79], counterVol: 0.0035,
      drums: null,
      air: 0.02, airFreq: 700,
      layers: [
        { inst: 'flute', notes: [[[86, 0, 2.0], [84, 2.1, 1.6]], [[84, 0, 1.8], [79, 1.9, 1.8]], [[81, 0, 1.8], [77, 1.9, 1.8]], [[79, 0, 2.2], [74, 2.3, 1.4]]], vol: 0.005, pan: 0.2 },
        { inst: 'harp', pattern: [50, 57, 62, 69], rate: 1.0, vol: 0.0035, pan: -0.25 },
        { inst: 'bell', notes: [[[93, 0, 3.2]], [[88, 0, 3.2]], [[91, 0, 3.2]], [[86, 0, 3.4]]], vol: 0.0025 },
        { inst: 'wind', vol: 0.015, freq: 760 },
      ],
    },
    // المعركة: زحف ثقيل، نحاس، طبول حرب
    war: {
      bpm: 112, beats: 4,
      chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
      bass: [38, 34, 36, 33],
      bassDrive: [0, 0, 7, 0, 12, 0, 7, 0],
      melody: [
        [[74, 0, 1], [72, 1, 1], [69, 2, 2]],
        [[70, 0, 1], [69, 1, 1], [65, 2, 2]],
        [[67, 0, 1], [69, 1, 1], [72, 2, 2]],
        [[69, 0, 1.7], [73, 1.8, 0.9], [76, 2.8, 1.1]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1500, melodyVol: 0.016,
      padType: 'sawtooth', padVol: 0.008, padFilter: 900,
      choir: 0.004,
      drums: 'war', drumVol: 0.075,
      air: 0.008,
      ost: [38, 38, 41, 38, 36, 36, 40, 36], ostVol: 0.008, ostFilter: 520,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 2.4], [57, 0, 2.4]], [[46, 0, 2.4], [53, 0, 2.4]], [[48, 0, 2.4], [55, 0, 2.4]], [[45, 0, 2.4], [52, 0, 2.4]]], vol: 0.0055 },
        { inst: 'shaker', rate: 0.5, vol: 0.0025 },
      ],
    },
    // القتال: أسرع وأعلى طاقة — أبواق، أوتار، طبول، معدن، جوقة
    battle: {
      bpm: 138, beats: 4,
      chords: [[50, 53, 57], [48, 52, 55], [46, 50, 53], [45, 49, 52]],
      bass: [38, 36, 34, 33],
      bassDrive: [0, 0, 7, 0, 12, 0, 7, 0],
      melody: [
        [[74, 0, 0.7], [77, 0.75, 0.6], [74, 1.5, 0.5], [72, 2, 0.5], [69, 2.5, 1.5]],
        [[72, 0, 0.7], [74, 0.75, 0.6], [77, 1.5, 0.6], [81, 2.25, 1.6]],
        [[70, 0, 0.8], [74, 0.85, 0.6], [72, 1.5, 0.5], [69, 2, 0.5], [65, 2.5, 1.4]],
        [[69, 0, 0.6], [72, 0.65, 0.6], [76, 1.35, 0.7], [77, 2.1, 1.7]],
      ],
      melodyType: 'sawtooth', melodyFilter: 2200, melodyVol: 0.021,
      padType: 'sawtooth', padVol: 0.007, padFilter: 1150,
      choir: 0.0045,
      arp: [62, 69, 74, 77, 74, 69], arpRate: 0.5, arpVol: 0.0065,
      counter: [81, 79, 77, 84], counterVol: 0.007,
      drums: 'battle', drumVol: 0.09,
      air: 0.007,
      ost: [38, 38, 41, 38, 36, 36, 40, 36], ostVol: 0.01, ostFilter: 700,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 1.8], [57, 0, 1.8]], [[48, 0, 1.8], [55, 0, 1.8]], [[46, 0, 1.8], [53, 0, 1.8]], [[45, 0, 1.8], [52, 0, 1.8]]], vol: 0.007 },
        { inst: 'metal', pattern: [0, 1, 2, 3], freq: 420, vol: 0.0028, pan: 0.3 },
        { inst: 'shaker', rate: 0.25, vol: 0.0045 },
        { inst: 'choir', notes: [[[62, 0, 1.5], [65, 0, 1.5]], [[60, 0, 1.5], [64, 0, 1.5]], [[58, 0, 1.5], [62, 0, 1.5]], [[57, 0, 1.6], [60, 0, 1.6]]], vol: 0.004 },
        { inst: 'bell', notes: [[[88, 0, 0.8]], [[86, 0, 0.8]], [[84, 0, 0.8]], [[86, 0, 0.8]]], vol: 0.0022, pan: -0.3 },
      ],
    },
    // القتال الأخير: لحن مختلف، مقام درامي، جوقة وأبواق وأوتار وطبول حصار
    finalBattle: {
      bpm: 152, beats: 4,
      chords: [[50, 53, 57, 62], [46, 50, 53, 58], [43, 46, 50, 55], [45, 49, 52, 57]],
      bass: [38, 34, 31, 33],
      bassDrive: [0, 0, 7, 0, 12, 7, 12, 15],
      melody: [
        [[74, 0, 0.5], [77, 0.5, 0.5], [81, 1, 0.5], [79, 1.5, 0.5], [77, 2, 0.5], [74, 2.5, 1.4]],
        [[82, 0, 0.6], [81, 0.6, 0.5], [79, 1.1, 0.5], [77, 1.6, 0.5], [74, 2.1, 0.6], [70, 2.7, 1.2]],
        [[79, 0, 0.6], [82, 0.6, 0.6], [86, 1.2, 0.5], [84, 1.7, 0.5], [82, 2.2, 0.5], [79, 2.7, 1.2]],
        [[81, 0, 0.5], [85, 0.5, 0.5], [88, 1, 0.8], [86, 1.8, 0.5], [81, 2.3, 1.5]],
      ],
      melodyType: 'sawtooth', melodyFilter: 2500, melodyVol: 0.023,
      padType: 'sawtooth', padVol: 0.0085, padFilter: 1250, padShimmer: true, padWidth: 1.5,
      choir: 0.008,
      counter: [86, 84, 82, 81], counterVol: 0.007, counterType: 'triangle',
      arp: [62, 69, 74, 81, 74, 69], arpRate: 0.25, arpVol: 0.006,
      drums: 'battle', drumVol: 0.105,
      air: 0.006,
      ost: [38, 38, 39, 38, 41, 38, 36, 38], ostVol: 0.011, ostFilter: 780,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 1.5], [57, 0, 1.5]], [[46, 0, 1.5], [53, 0, 1.5]], [[43, 0, 1.5], [50, 0, 1.5]], [[45, 0, 1.5], [52, 0, 1.5]]], vol: 0.0085 },
        { inst: 'strings', notes: [[[62, 0, 1.4], [69, 0, 1.4]], [[58, 0, 1.4], [65, 0, 1.4]], [[55, 0, 1.4], [62, 0, 1.4]], [[57, 0, 1.4], [64, 0, 1.4]]], vol: 0.006 },
        { inst: 'choir', notes: [[[62, 0, 1.2], [69, 0, 1.2]], [[58, 0, 1.2], [65, 0, 1.2]], [[55, 0, 1.2], [62, 0, 1.2]], [[57, 0, 1.2], [64, 0, 1.2]]], vol: 0.0055 },
        { inst: 'timpani', pattern: [[38, 0], [38, 1.5], [31, 2], [38, 3]], vol: 0.017 },
        { inst: 'metal', pattern: [0, 1, 2, 3], freq: 300, vol: 0.003, pan: 0.3 },
        { inst: 'shaker', rate: 0.25, vol: 0.005 },
        { inst: 'bell', notes: [[[86, 0, 0.6]], [[84, 0, 0.6]], [[82, 0, 0.6]], [[81, 0, 0.9]]], vol: 0.0028, pan: -0.35 },
      ],
    },
    // الخريطة: طريق طويل، ناي، أجراس بعيدة، مسيرة خافتة
    map: {
      bpm: 56, beats: 4,
      chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]],
      bass: [38, 34, 36, 33],
      melody: [
        [[74, 0, 2.0], [72, 2.1, 1.6]],
        [[72, 0, 1.8], [69, 1.9, 1.8]],
        [[70, 0, 1.8], [67, 1.9, 1.8]],
        [[69, 0, 2.8], [65, 2.9, 1.0]],
      ],
      melodyType: 'sine', melodyVol: 0.012,
      padType: 'triangle', padVol: 0.009, padFilter: 1000,
      choir: 0.005,
      arp: [50, 57, 62, 69], arpRate: 0.5, arpVol: 0.004,
      drums: 'soft', drumVol: 0.03,
      air: 0.01, airFreq: 520,
      layers: [
        { inst: 'flute', notes: [[[81, 0, 1.8]], [[79, 0, 1.8]], [[77, 0, 1.8]], [[76, 0, 2.2]]], vol: 0.0055, pan: 0.2 },
        { inst: 'bell', notes: [[[86, 0, 3.0]], [[81, 0, 3.0]], [[79, 0, 3.0]], [[74, 0, 3.0]]], vol: 0.0028, pan: -0.3 },
        { inst: 'wind', vol: 0.009, freq: 500 },
      ],
    },
    // مزاج محايد احتياطي
    calm: {
      bpm: 62, beats: 4,
      chords: [[50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [48, 52, 55, 60]],
      bass: [38, 34, 41, 36],
      melody: [
        [[69, 0, 2.2], [65, 2.3, 1.4]],
        [[67, 0, 2.0], [65, 2.1, 1.6]],
        [[69, 0, 1.3], [72, 1.4, 1.0], [70, 2.5, 1.4]],
        [[69, 0, 2.8], [62, 2.9, 1.2]],
      ],
      melodyType: 'sawtooth', melodyFilter: 850, melodyVol: 0.02,
      padType: 'triangle', padVol: 0.013, padFilter: 1300,
      choir: 0.0055,
      arp: [62, 69, 74, 69, 65, 62], arpRate: 0.5, arpVol: 0.007,
      counter: [81, 77, 79, 74], counterVol: 0.005,
      drums: 'imperial', drumVol: 0.045,
      air: 0.006,
      layers: [
        { inst: 'harp', pattern: [50, 57, 62, 69], rate: 0.5, vol: 0.0035 },
        { inst: 'wind', vol: 0.005, freq: 460 },
      ],
    },
    // النهاية: جوقة أوسع، أمل متعب، أبواق وأجراس
    end: {
      bpm: 58, beats: 4,
      chords: [[50, 53, 57, 62], [46, 50, 53, 58], [41, 45, 48, 53], [48, 52, 55, 60]],
      bass: [38, 34, 41, 36],
      melody: [
        [[74, 0, 1.8], [77, 1.9, 2.0]],
        [[76, 0, 1.6], [74, 1.7, 2.2]],
        [[72, 0, 1.8], [69, 1.9, 2.0]],
        [[74, 0, 3.0], [69, 3.1, 1.0]],
      ],
      melodyType: 'sawtooth', melodyFilter: 1000, melodyVol: 0.019,
      padType: 'triangle', padVol: 0.013, padFilter: 1400, padShimmer: true,
      choir: 0.008,
      arp: [62, 65, 69, 74, 77, 74], arpRate: 0.5, arpVol: 0.008,
      counter: [81, 77, 84, 79], counterVol: 0.006,
      drums: 'march', drumVol: 0.04,
      air: 0.006,
      layers: [
        { inst: 'horn', notes: [[[50, 0, 3.0], [57, 0, 3.0]], [[46, 0, 3.0], [53, 0, 3.0]], [[41, 0, 3.0], [48, 0, 3.0]], [[48, 0, 3.0], [55, 0, 3.0]]], vol: 0.006 },
        { inst: 'bell', notes: [[[86, 0, 2.8]], [[84, 0, 2.8]], [[81, 0, 2.8]], [[79, 0, 3.2]]], vol: 0.0035 },
        { inst: 'harp', pattern: [62, 69, 74, 77, 74, 69], rate: 0.5, vol: 0.004 },
        { inst: 'strings', notes: [[[62, 0, 3.4], [69, 0, 3.4]], [[58, 0, 3.4], [65, 0, 3.4]], [[53, 0, 3.4], [60, 0, 3.4]], [[60, 0, 3.4], [67, 0, 3.4]]], vol: 0.0045 },
      ],
    },
  };

  // أسماء قديمة تبقى متوافقة مع بقية الكود
  TRACKS.dark = TRACKS.forest;
  TRACKS.sorrow = TRACKS.ruins;
  TRACKS.fire = TRACKS.jinn;
  TRACKS.dawn = TRACKS.end;

  function playBar(t, bar, when) {
    const beat = 60 / t.bpm;
    const barLen = beat * t.beats;
    const i = bar % t.chords.length;
    const chord = t.chords[i];
    const t0 = (when || 0) + 0.05;

    // فرش النحاس/الأوتار: طبقتان منحرفتان قليلًا لكل نغمة
    chord.forEach((m, k) => {
      const p = ((k % 2) ? 0.18 : -0.18) * (t.padWidth || 1);
      mtone(m, barLen + 1.1, {
        type: t.padType, vol: t.padVol, when: t0,
        attack: 0.9, release: 1.3, filter: t.padFilter, q: 0.8, detune: -6, pan: p,
      });
      mtone(m, barLen + 1.1, {
        type: t.padType, vol: t.padVol * 0.75, when: t0,
        attack: 1.1, release: 1.4, filter: t.padFilter, q: 0.8, detune: 7, pan: -p,
      });
      // أوكتاف منخفض يمنح الإحساس بالاتساع
      mtone(m - 12, barLen + 1.2, {
        type: 'sine', vol: t.padVol * 0.55, when: t0,
        attack: 1.2, release: 1.4, filter: 420,
      });
      if (t.padShimmer) {
        mtone(m + 12, barLen + 0.9, {
          type: 'sine', vol: t.padVol * 0.16, when: t0 + 0.08,
          attack: 1.4, release: 1.4, filter: 3000, pan: -p * 0.6,
        });
      }
    });

    // جوقة بعيدة
    if (t.choir) {
      chord.slice(0, 3).forEach((m, k) => {
        mtone(m + 12, barLen + 0.9, {
          type: 'sine', vol: t.choir, when: t0 + 0.15 + k * 0.04,
          attack: 1.6, release: 1.4, filter: 1600, pan: (k - 1) * 0.25,
        });
      });
    }

    // الباص: ثابت أو نابض حسب المكان
    if (t.bassDrive) {
      const step = t.beats / t.bassDrive.length;
      t.bassDrive.forEach((iv, k) => {
        mtone(t.bass[i] + iv, beat * step * 1.75, {
          type: 'triangle', vol: 0.019, when: t0 + k * step * beat,
          attack: 0.02, release: beat * 0.35, filter: 380, q: 1.1,
          pan: k % 2 ? 0.15 : -0.15,
        });
        if (k % 2 === 0) drum(t0 + k * step * beat, 0.018, 52, 0.18);
      });
    } else {
      mtone(t.bass[i], barLen + 0.7, {
        type: 'triangle', vol: 0.022, when: t0,
        attack: 0.12, release: 0.9, filter: 340,
      });
    }

    // لحن القوس: عبارة قصيرة واضحة تُعاد كل أربعة أقواس
    const phrase = t.melody[bar % t.melody.length];
    if (phrase) {
      const notes = Array.isArray(phrase[0]) ? phrase : [[phrase, 0, t.beats * 0.8]];
      notes.forEach(([mel, at, len]) => {
        const dur = Math.max(0.25, len * beat * 0.96);
        const start = t0 + 0.18 + at * beat;
        if (t.melodyType === 'sine') {
          mtone(mel, dur, {
            type: 'sine', vol: t.melodyVol, when: start,
            attack: 0.2, release: Math.min(1.3, dur * 0.5), filter: 1900, pan: 0.1,
          });
          mtone(mel - 12, dur * 0.9, {
            type: 'triangle', vol: t.melodyVol * 0.45, when: start + 0.02,
            attack: 0.2, release: Math.min(1.1, dur * 0.5), filter: 700,
          });
        } else {
          mtone(mel, dur, {
            type: t.melodyType, vol: t.melodyVol, when: start,
            attack: 0.1, release: Math.min(1.0, dur * 0.5), filter: t.melodyFilter, q: 1.2, pan: 0.1,
          });
          mtone(mel - 12, dur * 0.9, {
            type: 'sawtooth', vol: t.melodyVol * 0.36, when: start + 0.01,
            attack: 0.12, release: Math.min(0.9, dur * 0.5), filter: 560,
          });
        }
      });
    }

    // جواب/زخرفة على النصف الثاني
    if (t.counter) {
      const c = t.counter[bar % t.counter.length];
      if (c) {
        const evs = Array.isArray(c[0]) ? c : [[c, 0, 1.25]];
        evs.forEach(([m, at, len]) => mtone(m, Math.max(0.4, (len || 1.25) * beat), {
          type: t.counterType || 'sine', vol: t.counterVol || 0.005,
          when: t0 + ((at || 0) + t.beats * 0.55) * beat,
          attack: 0.03, release: 1.0, filter: 2400, pan: -0.3,
        }));
      }
    }

    // قيثارة/سنطور: أرباج متكرر
    if (t.arp) {
      const rate = t.arpRate || 0.5;
      for (let b = 0, k = 0; b < t.beats; b += rate, k++) {
        const m = t.arp[(bar * 3 + k) % t.arp.length];
        mtone(m, beat * rate * 1.7, {
          type: t.arpType || 'triangle', vol: t.arpVol, when: t0 + b * beat,
          attack: 0.012, release: beat * rate * 0.9, filter: 2600, pan: k % 2 ? 0.28 : -0.28,
        });
      }
    }

    // إيقاع منخفض متتابع (زحف/نار/حديد)
    if (t.ost) {
      const step = beat * 0.5;
      for (let b = 0; b < t.beats; b += 0.5) {
        const m = t.ost[Math.round(b * 2) % t.ost.length];
        mtone(m, step * 0.8, {
          type: t.ostType || 'sawtooth', vol: t.ostVol, when: t0 + b * beat,
          attack: 0.01, release: step * 0.5, filter: t.ostFilter, q: 1,
          pan: b % 1 ? 0.22 : -0.22,
        });
      }
    }

    // طبقات الآلات الخاصة بكل مكان
    if (t.layers) t.layers.forEach((L) => playLayer(L, bar, t0, beat, barLen, t.beats));

    if (t.drums) playDrums(t.drums, t0, beat, barLen, t.drumVol);
    if (t.air) mnoise(barLen * 0.95, t.air, t.airFreq || 420, t0, 'bandpass');
  }

  // موسيقى القتال: تحفظ مزاج المكان ثم تعيده بعد المعركة
  S._restoreMood = null;
  S.battleMusic = function (mood) {
    if (!S.ctx || !S.musicBus) return;
    const target = mood || 'battle';
    if (S._mood !== target) S._restoreMood = S._mood;
    S.ambient(target);
  };
  S.afterBattle = function () {
    if (S._mood !== 'battle' && S._mood !== 'finalBattle') return;
    const back = S._restoreMood || 'calm';
    S._restoreMood = null;
    S.ambient(back);
  };

  // مزاج المكان: لكل موقع أغنيه وطبقاته الخاصة
  S.placeMood = function (id, post) {
    if (post) {
      if (id === 'palace') return 'palace';
      if (id === 'village') return 'village';
      if (id === 'mountain') return 'mountain';
      if (id === 'ruins') return 'ruins';
      if (id === 'jinn') return 'jinn';
      return 'end';
    }
    const map = {
      village: 'village', forest: 'forest', mine: 'mine', ruins: 'ruins',
      market: 'market', jinn: 'jinn', mountain: 'mountain', palace: 'palace',
    };
    return map[id] || 'calm';
  };

  // موسيقى محيطة: مقطع كامل يتكرر حسب المشهد
  S.ambient = function (mood) {
    if (!S.ctx || !S.musicBus) return;
    if (S._mood === mood) return;
    S._mood = mood;
    clearTimeout(S._timer);
    const gen = ++S._gen;
    const t = TRACKS[mood] || TRACKS.calm;
    const now = S.ctx.currentTime;

    // اخفض الحافلة قليلًا ثم بدّل المزاج بسلاسة
    S.musicBus.gain.cancelScheduledValues(now);
    S.musicBus.gain.setTargetAtTime(0.0001, now, 0.12);

    setTimeout(() => {
      if (gen !== S._gen) return;
      S.musicBus.gain.setTargetAtTime(6.0, S.ctx.currentTime, 0.45);
      const beat = 60 / t.bpm;
      const barMs = Math.max(900, beat * t.beats * 1000);
      let bar = 0;
      const step = () => {
        if (gen !== S._gen) return;
        playBar(t, bar++, 0);
        const drift = Math.random() * 60;
        S._timer = setTimeout(step, barMs - 90 + drift);
      };
      step();
    }, 380);
  };

  S.stopAmbient = function () {
    S._mood = null;
    S._restoreMood = null;
    ++S._gen;
    clearTimeout(S._timer);
    if (S.musicBus && S.ctx) {
      S.musicBus.gain.cancelScheduledValues(S.ctx.currentTime);
      S.musicBus.gain.setTargetAtTime(0.0001, S.ctx.currentTime, 0.2);
    }
  };
})(window.ASH);
