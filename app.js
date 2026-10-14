/* Vela – interactive prototype (coded rebuild of Figma "Kulcsképernyők_V2") */
(() => {
  'use strict';

  /* =====================================================================
     Data (chart series are the exact point lists from the Figma vectors)
     ===================================================================== */
  const SERIES = {"home":[117.0,112.1,105.3,101.1,99.9,96.3,94.6,100.4,97.1,92.8,89.5,91.5,87.7,81.1,73.8,67.9,71.9,76.5,74.0,68.9,73.2,73.6,75.8,75.5,72.7,78.7,77.6,73.5,74.1,70.4,75.3,69.2,69.1,73.2,67.5,71.5,73.3,69.2,71.7,77.9,70.8,74.8,72.1,65.5,67.8,65.2,70.8,76.5,77.2,72.8,67.2,68.5,68.2,72.6,66.0,64.1,63.9,60.8,57.3,50.5,46.9,40.6,31.2,29.1,24.7,24.7,20.2,16.5,18.3,15.7,19.8,23.6,21.5,20.6,21.1,12.1,15.5,15.4,14.3,11.6,7.9,9.6,12.5,10.3,4.0],"btc":[237.0,229.7,219.5,213.2,211.3,206.0,203.4,212.1,207.2,200.7,195.7,198.8,193.1,183.1,172.2,163.3,169.3,176.3,172.5,164.9,171.3,171.9,175.2,174.7,170.5,179.5,177.9,171.8,172.6,167.1,174.4,165.3,165.1,171.3,162.8,168.7,171.4,165.3,169.1,178.4,167.7,173.7,169.6,159.7,163.2,159.3,167.7,176.2,177.3,170.7,162.3,164.2,163.8,170.4,160.5,157.6,157.3,152.7,147.4,137.3,131.9,122.4,108.3,105.2,98.5,98.5,91.8,86.3,88.9,85.1,91.2,96.9,93.7,92.4,93.1,79.6,84.7,84.6,82.9,78.9,73.4,75.9,80.3,76.9,67.5,68.1,65.8,61.3,58.1,47.0],"gold":[61.6,59.6,60.4,59.8,61.0,63.0,60.0,58.3,54.7,50.4,50.6,51.7,51.0,48.3,48.5,47.1,47.2,44.6,41.8,41.1,37.7,37.0,35.6,37.5,39.4,41.4,38.3,33.9,34.0,32.9,30.7,27.3,26.0,24.7,20.4,20.3,16.1,17.2,16.9,16.6,13.2,8.8,9.5,9.0,7.0,3.2,3.6,1.0],"eth":[22.0,19.3,19.4,20.4,20.9,18.8,19.5,19.4,17.2,17.1,15.7,13.3,10.3,9.4,9.5,8.9,8.4,7.2,7.5,5.2,6.2,4.0,5.4,5.4],"tsla":[4.4,4.0,7.7,9.9,13.1,12.2,11.8,14.9,15.4,17.6,20.6,19.4,20.4,20.6,18.6,18.1,16.7,18.2,19.8,21.5,22.0,20.2,20.9,19.4],"sol":[22.0,20.6,17.6,16.4,17.5,14.5,14.9,16.4,15.9,16.0,13.5,10.6,11.8,9.5,7.5,8.9,8.9,9.0,7.5,4.0,5.3,6.3,7.5,6.7]};

  const state = {
    side: 'long',
    cash: 3240,
    amount: 810,
    preset: 0.25,
    lev: 10,
    btc: 98412.5,
    btcOpen: 96336.4, // so that the change reads ≈ +2.18%
    portfolio: 24927.18,
    pnl: 545.8,
    starred: true,
    thesis: '',
    lastTrade: null,
  };

  /* =====================================================================
     Utilities
     ===================================================================== */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const usd = (n, d = 2) => (n < 0 ? '−$' : '$') + fmt(Math.abs(n), d);
  const sUsd = (n, d = 2) => (n < 0 ? '−$' : '+$') + fmt(Math.abs(n), d);
  const pct = (n, d = 2) => (n < 0 ? '−' : '+') + fmt(Math.abs(n), d) + '%';
  const vibrate = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

  function tween(from, to, dur, onUpdate, ease = easeOut) {
    if (reduced() || dur <= 0) { onUpdate(to, 1); return { stop() {} }; }
    let raf, stopped = false;
    const t0 = performance.now();
    const step = (now) => {
      if (stopped) return;
      const p = clamp((now - t0) / dur, 0, 1);
      onUpdate(lerp(from, to, ease(p)), p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return { stop() { stopped = true; cancelAnimationFrame(raf); } };
  }

  // count-up helper that remembers its running tween per element
  function countTo(el, to, { from, dur = 1100, format = (v) => usd(v), delay = 0 } = {}) {
    if (!el) return;
    if (el._tw) el._tw.stop();
    const start = from ?? (el._val ?? to);
    const run = () => { el._tw = tween(start, to, dur, (v) => { el._val = v; el.textContent = format(v); }); };
    delay ? setTimeout(run, delay) : run();
  }

  // big number split into integer / decimals (“$24,927” + “.18”)
  function setBig(el, v) {
    const s = fmt(v, 2);
    const [i, d] = s.split('.');
    el.querySelector('.int').textContent = '$' + i;
    el.querySelector('.dec').textContent = '.' + d;
  }

  let toastTimer;
  function toast(msg, dot = true) {
    const phone = $('#phone');
    let t = $('.toast', phone);
    if (!t) { t = h('<div class="toast"><i></i><span></span></div>'); phone.appendChild(t); }
    t.querySelector('i').style.display = dot ? '' : 'none';
    t.querySelector('span').textContent = msg;
    requestAnimationFrame(() => t.classList.add('in'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('in'), 2000);
  }

  // live market feed (random walk) – screens subscribe while mounted
  const subs = new Set();
  setInterval(() => {
    const d = (Math.random() - 0.47) * 38;
    state.btc = Math.round((state.btc + d) * 100) / 100;
    state.portfolio = Math.round((state.portfolio + d * 0.25) * 100) / 100;
    state.pnl = Math.round((state.pnl + d * 0.25) * 100) / 100;
    subs.forEach((fn) => fn(d));
  }, 1700);
  const subscribe = (fn) => { subs.add(fn); return () => subs.delete(fn); };

  const statusBar = (solid) => `<div class="statusbar ${solid ? 'solid' : ''}"><span class="time">9:41</span><img src="status-icons.svg" alt=""></div>`;
  const chevSvg = '<svg viewBox="0 0 10 14" fill="none"><path d="M2 2L7 7L2 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const starSvg = (on) => `<svg viewBox="0 0 20 20"><path d="M10 2.92L12.17 7.33L17.08 8.08L13.5 11.5L14.33 16.33L10 14.08L5.67 16.33L6.5 11.5L2.92 8.08L7.83 7.33L10 2.92Z" fill="${on ? '#9DB0FF' : 'none'}" stroke="#9DB0FF" stroke-width="${on ? 0 : 1.5}" stroke-linejoin="round"/></svg>`;

  function asset(bg, glyph, extra = '') {
    return `<div class="asset-ic ${extra}"><span style="background:${bg}">${glyph}</span></div>`;
  }

  /* ---------- Sliding indicator for segmented controls ---------- */
  function segmented(root, onChange) {
    const ind = $('.ind', root);
    const btns = $$('button', root);
    const place = (b, anim = true) => {
      if (!anim) ind.style.transition = 'none';
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = `translateX(${b.offsetLeft - ind.offsetLeft + (ind._base ?? 0)}px)`;
      if (!anim) { void ind.offsetWidth; ind.style.transition = ''; }
    };
    ind._base = 0;
    const init = () => { const on = btns.find((b) => b.classList.contains('on')) || btns[0]; ind.style.left = '0px'; ind._base = 0; place(on, false); };
    btns.forEach((b, i) => b.addEventListener('click', (e) => {
      e.stopPropagation();
      if (b.classList.contains('on')) return;
      btns.forEach((x) => x.classList.toggle('on', x === b));
      place(b);
      vibrate(6);
      onChange && onChange(b.dataset.v ?? i, i);
    }));
    return { init };
  }

  /* ---------- Line chart with draw-in, morph and scrubbing ---------- */
  function lineChart(host, opt) {
    const { w, h: hh, ys, x0, x1, yOff = 0, stroke = '#5BE3B0', sw = 2, glow = true, area = false, id } = opt;
    const N = ys.length;
    const svg = h(`<svg width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" fill="none">
      <defs>
        <linearGradient id="ag-${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${stroke}" stop-opacity=".35"/><stop offset="1" stop-color="${stroke}" stop-opacity="0"/></linearGradient>
        <filter id="gl-${id}" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feColorMatrix in="b" type="matrix" values="0 0 0 0 .36  0 0 0 0 .89  0 0 0 0 .69  0 0 0 .55 0"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${area ? `<path class="area" fill="url(#ag-${id})" opacity="0"/>` : ''}
      <path class="ln" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${glow ? `filter="url(#gl-${id})"` : ''}/>
    </svg>`);
    host.appendChild(svg);
    const ln = $('.ln', svg);
    const ar = $('.area', svg);
    let cur = ys.slice();
    const X = (i) => x0 + ((x1 - x0) * i) / (N - 1);
    const Y = (v) => v + yOff;
    const path = (arr) => arr.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(2)} ${Y(v).toFixed(2)}`).join('');
    const render = () => {
      ln.setAttribute('d', path(cur));
      if (ar) ar.setAttribute('d', path(cur) + `L${X(N - 1)} ${hh}L${X(0)} ${hh}Z`);
    };
    render();
    const api = {
      svg, N, X, Y,
      get ys() { return cur; },
      draw(dur = 1500, delay = 0) {
        const L = ln.getTotalLength();
        ln.style.strokeDasharray = L;
        ln.style.strokeDashoffset = L;
        if (ar) ar.style.transition = 'none';
        setTimeout(() => {
          tween(L, 0, dur, (v) => { ln.style.strokeDashoffset = v; }, easeInOut);
          if (ar) { ar.style.transition = `opacity ${dur * 0.8}ms ease ${dur * 0.4}ms`; ar.setAttribute('opacity', '1'); }
          setTimeout(() => { ln.style.strokeDasharray = ''; ln.style.strokeDashoffset = ''; }, dur + 30);
        }, delay);
      },
      morph(next, dur = 650, onFrame) {
        const from = cur.slice();
        tween(0, 1, dur, (t) => { cur = from.map((v, i) => lerp(v, next[i], t)); render(); onFrame && onFrame(); }, easeInOut);
      },
      // value of y at fractional index
      yAt(fi) { const i = clamp(Math.floor(fi), 0, N - 1), j = Math.min(N - 1, i + 1); return Y(lerp(cur[i], cur[j], fi - i)); },
    };
    return api;
  }

  // deterministic alternate series for other time ranges
  function altSeries(base, seed) {
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    const N = base.length;
    const lo = Math.min(...base), hi = Math.max(...base);
    const start = lo + (hi - lo) * (0.55 + rnd() * 0.45);
    const raw = [];
    let v = 0, vel = 0;
    for (let i = 0; i < N; i++) { vel = vel * 0.7 + (rnd() - 0.5); v += vel; raw.push(v); }
    // add trend from start to end (end = base end so live dot stays meaningful)
    const end = base[N - 1];
    const rmin = Math.min(...raw), rmax = Math.max(...raw);
    return raw.map((r, i) => {
      const n = (r - rmin) / (rmax - rmin || 1) - 0.5;
      const t = i / (N - 1);
      const trend = lerp(start, end, Math.pow(t, 1.2));
      return clamp(trend + n * (hi - lo) * 0.45 * Math.sin(Math.PI * Math.min(1, t * 1.05)), lo, hi);
    });
  }

  function scrubber(host, chart, opt) {
    const { top, height, defIdx, tip, onMove, onEnd, tipSide = 'right' } = opt;
    const line = h(`<div class="scrub" style="top:${top}px;height:${height}px"></div>`);
    const dot = h('<div class="dot"></div>');
    host.append(line, dot);
    const place = (fi) => {
      const x = chart.X(0) + ((chart.X(chart.N - 1) - chart.X(0)) * fi) / (chart.N - 1);
      const y = chart.yAt(fi);
      line.style.left = x + 'px';
      dot.style.left = x + 'px';
      dot.style.top = y + 'px';
      if (tip) {
        const side = tipSide === 'auto' ? (x > host.clientWidth * 0.55 ? 'left' : 'right') : tipSide;
        tip.style.left = (side === 'right' ? x + 22 : x - 75 - 12) + 'px';
        tip.style.top = clamp(y - 8 + (side === 'right' ? -10 : -60), 0, top + height - 52) + 'px';
      }
      onMove && onMove(fi);
    };
    let cur = defIdx, back;
    place(cur);
    const toIdx = (e) => {
      const r = host.getBoundingClientRect();
      const s = r.width / host.offsetWidth;
      const x = (e.clientX - r.left) / s;
      return clamp(((x - chart.X(0)) / (chart.X(chart.N - 1) - chart.X(0))) * (chart.N - 1), 0, chart.N - 1);
    };
    let active = false, lastI = -1;
    host.addEventListener('pointerdown', (e) => {
      active = true; back && back.stop();
      host.setPointerCapture(e.pointerId);
      cur = toIdx(e); place(cur);
    });
    host.addEventListener('pointermove', (e) => {
      if (!active) return;
      cur = toIdx(e); place(cur);
      const i = Math.round(cur); if (i !== lastI && i % 6 === 0) vibrate(3); lastI = i;
    });
    const end = () => {
      if (!active) return; active = false;
      const from = cur;
      back = tween(from, defIdx, 700, (v) => { cur = v; place(v); }, easeInOut);
      onEnd && onEnd();
    };
    host.addEventListener('pointerup', end);
    host.addEventListener('pointercancel', end);
    return { refresh: () => place(cur), line, dot };
  }

  function revealOnScroll(scroller, root) {
    const els = $$('.rv', root);
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return () => {}; }
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('in'); en.target._onIn && en.target._onIn(); io.unobserve(en.target); }
    }), { root: scroller, threshold: 0.12 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }

  /* ---------- Bottom sheet ---------- */
  function sheet(contentHtml, onMount) {
    const screen = $('#phone .screen:last-of-type');
    const back = h('<div class="sheet-back"></div>');
    const sh = h(`<div class="sheet"><div class="grab"></div>${contentHtml}</div>`);
    screen.append(back, sh);
    requestAnimationFrame(() => { back.classList.add('in'); sh.classList.add('in'); });
    const close = () => {
      back.classList.remove('in'); sh.classList.remove('in');
      setTimeout(() => { back.remove(); sh.remove(); }, 500);
    };
    back.addEventListener('click', close);
    // drag down to dismiss
    let y0 = null;
    $('.grab', sh).parentElement.addEventListener('pointerdown', (e) => { if (e.target.closest('button,textarea')) return; y0 = e.clientY; sh.style.transition = 'none'; });
    sh.addEventListener('pointermove', (e) => { if (y0 == null) return; const dy = Math.max(0, e.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
    const up = (e) => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; sh.style.transition = ''; sh.style.transform = ''; if (dy > 90) close(); };
    sh.addEventListener('pointerup', up); sh.addEventListener('pointercancel', up);
    onMount && onMount(sh, close);
    return close;
  }

  /* =====================================================================
     1–3 · Onboarding
     ===================================================================== */
  const SLIDES = [
    // video placement = Figma "Flow" fill (cover) clipped by the 393×404 Image frame
    { vid: 'onb-1', box: 'left:-8px;top:0;width:401px;height:404px', t1: 'Every market.', t2: 'One balance.' },
    { vid: 'onb-2', box: 'left:15px;top:0;width:364px;height:404px', t1: 'Amplify', t2: 'your position.' },
    { vid: 'onb-3', box: 'left:15px;top:0;width:364px;height:404px', t1: 'Every market.', t2: 'One balance.' },
  ];
  const SLIDE_MS = 8040; // = video length

  function Onboarding(startIdx) {
    const el = h(`<section class="screen onb">
      ${statusBar(false)}
      <div class="track">${SLIDES.map((s, i) => `
        <div class="slide" data-i="${i}">
          <div class="art"><video class="vid" style="${s.box}" poster="${s.vid}.webp" muted playsinline preload="auto" disablepictureinpicture><source src="${s.vid}.mp4" type="video/mp4"><source src="${s.vid}.webm" type="video/webm"></video></div>
          <div class="copy">
            <span class="ln"><span class="t1">${s.t1}</span></span>
            <span class="ln"><span class="t2">${s.t2}</span></span>
            <p class="sub">Stocks, crypto and metals, tradable around the clock.</p>
          </div>
        </div>`).join('')}
      </div>
      <div class="progress">${SLIDES.map(() => '<div class="bar"><i></i></div>').join('')}</div>
      <button class="skip" type="button">Skip</button>
      <div class="actions">
        <button class="btn ghost cta press" type="button"><span class="lbl">Continue</span><span class="shine"></span></button>
        <button class="alt" type="button">I already have an account</button>
      </div>
      <div class="home-ind"></div>
    </section>`);

    const track = $('.track', el);
    const slides = $$('.slide', el);
    const bars = $$('.bar i', el);
    const cta = $('.cta', el), lbl = $('.lbl', cta), alt = $('.alt', el), skip = $('.skip', el);
    let idx = startIdx, anim = null, paused = false;
    const vids = $$('video', el);
    function playVideo() {
      vids.forEach((v, k) => {
        if (k === idx) { try { v.currentTime = 0; } catch (e) {} const p = v.play(); p && p.catch(() => {}); }
        else { v.pause(); }
      });
    }

    let prevIdx = -1;
    function setIdx(i, { instant = false } = {}) {
      idx = clamp(i, 0, SLIDES.length - 1);
      track.style.transition = instant ? 'none' : 'transform .75s cubic-bezier(.32,.72,0,1)';
      track.style.transform = `translateX(${-idx * 393}px)`;
      slides.forEach((s, k) => s.classList.toggle('active', k === idx));
      const last = idx === SLIDES.length - 1;
      if (cta.classList.contains('final') !== last) {
        lbl.style.opacity = 0;
        setTimeout(() => { lbl.textContent = last ? 'Create account' : 'Continue'; lbl.style.opacity = 1; }, 160);
        cta.classList.toggle('final', last);
        cta.classList.toggle('solid', last);
        cta.classList.toggle('ghost', !last);
        alt.textContent = last ? 'Log in' : 'I already have an account';
      }
      skip.style.opacity = last ? 0 : 1;
      skip.style.pointerEvents = last ? 'none' : '';
      history.replaceState({ id: String(idx + 1) }, '', '#/' + (idx + 1));
      if (current) current.id = String(idx + 1);
      if (prevIdx !== idx || instant) { playVideo(); runBars(); }
      else if (anim && anim.playState === 'paused') { anim.play(); vids[idx].play().catch(() => {}); }
      prevIdx = idx;
    }

    function runBars() {
      if (anim) anim.cancel();
      bars.forEach((b, k) => { b.getAnimations().forEach((a) => a.cancel()); b.style.transform = `scaleX(${k < idx ? 1 : 0})`; });
      const bar = bars[idx];
      anim = bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: SLIDE_MS, easing: 'linear', fill: 'forwards' });
      if (paused) anim.pause();
      anim.onfinish = () => { if (idx < SLIDES.length - 1) setIdx(idx + 1); };
    }

    // drag to swipe between slides
    let sx = null, sy = 0, dx = 0, moved = false;
    track.addEventListener('pointerdown', (e) => {
      sx = e.clientX; sy = e.clientY; dx = 0; moved = false;
      paused = true; anim && anim.pause(); vids[idx] && vids[idx].pause();
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
      dx = (e.clientX - sx) / s;
      if (Math.abs(dx) > 6) moved = true;
      const edge = (idx === 0 && dx > 0) || (idx === SLIDES.length - 1 && dx < 0) ? 0.35 : 1;
      track.style.transition = 'none';
      track.style.transform = `translateX(${-idx * 393 + dx * edge}px)`;
    });
    const up = () => {
      if (sx == null) return;
      sx = null; paused = false;
      if (moved && Math.abs(dx) > 60) setIdx(idx + (dx < 0 ? 1 : -1));
      else { setIdx(idx); }
    };
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);

    cta.addEventListener('click', () => { vibrate(); idx < SLIDES.length - 1 ? setIdx(idx + 1) : go(4, 'fade'); });
    alt.addEventListener('click', () => go(4, 'fade'));
    skip.addEventListener('click', () => setIdx(SLIDES.length - 1));

    return {
      el,
      enter() { setIdx(idx, { instant: true }); },
      leave() { anim && anim.cancel(); vids.forEach((v) => v.pause()); },
    };
  }

  /* =====================================================================
     4 · Home
     ===================================================================== */
  const TF = ['15m', '1H', '1D', '7D', '1M', 'All'];
  const TF_LABEL = { '15m': 'Today 9:38', '1H': 'Sept 12', '1D': 'Sept 12', '7D': 'Sept 9', '1M': 'Aug 24', All: 'Mar 2024' };
  const PORTFOLIO_CHG = { '15m': [38.12, 0.15], '1H': [412.36, 1.68], '1D': [602.4, 2.48], '7D': [1840.1, 7.97], '1M': [3240.0, 14.94], All: [9927.18, 66.18] };
  const tabBar = () => `<div class="tabbar-wrap"><div class="fade"></div>
    <nav class="tabbar glass glass-blur">
      <span class="ind"></span>
      <button class="on" data-v="home" type="button"><img src="tab-home.svg" alt="">Home</button>
      <button data-v="markets" type="button"><img src="tab-markets.svg" alt="">Markets</button>
      <button data-v="leaders" type="button"><img src="tab-leaders.svg" alt="">Leaders</button>
      <button data-v="profile" type="button"><img src="tab-profile.svg" alt="">Profile</button>
    </nav></div>`;

  function bindTabBar(el, scroller, onHome) {
    const tb = $('.tabbar', el);
    const ind = $('.ind', tb);
    const btns = $$('button', tb);
    const place = (b, anim = true) => {
      if (!anim) ind.style.transition = 'none';
      ind.style.width = b.offsetWidth + 'px';
      ind.style.transform = `translateX(${b.offsetLeft - 6}px)`;
      if (!anim) { void ind.offsetWidth; ind.style.transition = ''; }
    };
    btns.forEach((b) => b.addEventListener('click', () => {
      vibrate(6);
      if (b.dataset.v === 'home') { onHome(); return; }
      btns.forEach((x) => x.classList.toggle('on', x === b)); place(b);
      toast(`${b.textContent.trim()} isn't part of this prototype`, false);
      setTimeout(() => { btns.forEach((x) => x.classList.toggle('on', x.dataset.v === 'home')); place(btns[0]); }, 1100);
    }));
    return () => place(btns[0], false);
  }

  const TRENDING = {
    All: [['#f7931a', '₿', 'Bitcoin', '$4.1B vol · 24h', '$98,412', 2.18, 'btc'], ['#76b900', 'N', 'NVIDIA', '$1.9B vol · 24h', '$141.20', -0.86], ['#d4af37', 'Au', 'Gold', '$1.2B vol · 24h', '$2,654', 1.24]],
    Stocks: [['#76b900', 'N', 'NVIDIA', '$1.9B vol · 24h', '$141.20', -0.86], ['#e31937', 'T', 'Tesla', '$1.4B vol · 24h', '$248.51', -1.12], ['#0e60e2', 'P', 'Palantir', '$0.9B vol · 24h', '$78.40', 11.42]],
    Crypto: [['#f7931a', '₿', 'Bitcoin', '$4.1B vol · 24h', '$98,412', 2.18, 'btc'], ['#627eea', 'Ξ', 'Ethereum', '$2.2B vol · 24h', '$3,412', 2.31], ['#9945ff', 'S', 'Solana', '$0.8B vol · 24h', '$184.77', 5.08]],
    Metals: [['#d4af37', 'Au', 'Gold', '$1.2B vol · 24h', '$2,654', 1.24], ['#a8b3c2', 'Ag', 'Silver', '$0.4B vol · 24h', '$31.22', 0.64], ['#c85b2c', 'Cu', 'Copper', '$0.2B vol · 24h', '$4.61', 6.03]],
    Others: [['#3c8dbc', 'O', 'Oil (WTI)', '$0.6B vol · 24h', '$71.08', -0.42], ['#5e6888', 'E', 'EUR/USD', '$0.3B vol · 24h', '$1.0842', 0.11], ['#e6007a', 'D', 'Polkadot', '$0.1B vol · 24h', '$7.92', 9.87]],
  };
  const MOVERS = {
    winners: [['#0e60e2', 'P', 'Palantir', 'PLTR · Stocks', 11.42], ['#e6007a', 'D', 'Polkadot', 'DOT · Crypto', 9.87], ['#c85b2c', 'Cu', 'Copper', 'HG · Metals', 6.03]],
    losers: [['#e31937', 'T', 'Tesla', 'TSLA · Stocks', -1.12], ['#76b900', 'N', 'NVIDIA', 'NVDA · Stocks', -0.86], ['#3c8dbc', 'O', 'Oil (WTI)', 'CL · Energy', -0.42]],
  };
  const trendRows = (rows) => rows.map((r, i) => `${i ? '<div class="sep"></div>' : ''}
    <button class="arow" type="button" ${r[6] ? 'data-go="5"' : ''}>
      <span class="rank">${i + 1}</span>${asset(r[0], r[1])}
      <span class="nm"><b>${r[2]}</b><span>${r[3]}</span></span>
      <span class="rt"><b class="num" ${r[6] ? 'data-live="btc"' : ''}>${r[4]}</b><span class="${r[5] < 0 ? 'down' : 'up'}">${pct(r[5])}</span></span>
    </button>`).join('');
  const moverRows = (rows) => rows.map((r, i) => `${i ? '<div class="sep"></div>' : ''}
    <div class="arow">${asset(r[0], r[1])}
      <span class="nm"><b>${r[2]}</b><span style="font-family:var(--helv)">${r[3]}</span></span>
      <span class="mv ${r[4] < 0 ? 'neg' : ''}">${pct(r[4])}</span>
    </div>`).join('');

  const POS = [
    [['#f7931a', '₿', 'Bitcoin', true], ['#627eea', 'Ξ', 'Etherum'], ['#9945ff', 'S', 'Solana']],
    [['#f7931a', '₿', 'Bitcoin', true], ['#76b900', 'N', 'NVIDIA'], ['#f7931a', '₿', 'Bitcoin', true]],
    [['#f7931a', '₿', 'Bitcoin', true], ['#627eea', 'Ξ', 'Etherum'], ['#9945ff', 'S', 'Solana']],
  ];

  function Home() {
    const el = h(`<section class="screen home">
      ${statusBar(true)}
      <div class="scroll"><div class="content">
        <div class="topbar">
          <div class="avatar"><span><img src="avatar-me.webp" alt=""></span></div>
          <button class="search glass press" type="button"><img src="ic-search.svg" alt="">Search</button>
          <button class="round40 glass press" type="button" data-t="Positions"><img src="ic-positions.svg" alt=""></button>
          <button class="round40 bell press" type="button"><img src="ic-bell.svg" alt=""></button>
        </div>

        <div class="portfolio">
          <div class="pv">
            <div><p class="lbl">My Portfolio</p><div class="bignum num" id="pv"><span class="int">$0</span><span class="dec">.00</span></div></div>
            <span class="badge-up" id="pchg"><img src="ic-tri-up.svg" alt=""><span>$412.36 (1.68%)</span></span>
          </div>
          <div class="chart" id="hchart" style="height:120px"></div>
          <div class="range glass seg" id="hrange"><span class="ind"></span>${TF.map((t) => `<button type="button" data-v="${t}" class="${t === '1H' ? 'on' : ''}">${t}</button>`).join('')}</div>
          <div class="cash"><div class="l"><p>Available cash</p><p class="num" id="cash">$0.00</p></div><img src="ic-info.svg" alt=""></div>
          <div class="row-btns">
            <button class="btn solid press" type="button" data-t="Deposit"><img src="ic-deposit.svg" alt="">Deposit<span class="shine"></span></button>
            <button class="btn ghost press" type="button" data-t="Invite"><img src="ic-plus.svg" alt="">Invite</button>
          </div>
        </div>

        <div class="open-trades rv">
          <div class="sec-head"><h3>Open trades</h3><span class="link">See all</span></div>
          <div class="hscroll">${POS.map((col) => `<div class="pos-col">${col.map((p) => `
            <button class="pos-card" type="button" ${p[3] ? 'data-go="5"' : ''}>
              <span class="l">${asset(p[0], p[1])}<span class="nm"><b>${p[2]}</b><span class="pill-long">Long 10×</span></span></span>
              <span class="r"><b class="num" ${p[3] ? 'data-live="pnl"' : ''}>+$545.80</b><span>+21.83%</span></span>
            </button>`).join('')}</div>`).join('')}</div>
        </div>

        <div class="news rv"><div class="hscroll">
          <div class="news-card"><div class="txt"><p class="k">NEW LISTING</p><p class="h">Stock perps are live</p><p class="s">Tesla, Nvidia and 40+ US stocks, around the clock.</p></div>
            <div class="neon" style="left:173px;top:14px;width:108px;height:152px;transform-origin:center"><img src="neon-1.webp" alt="" style="transform:scaleY(-1)"></div>
            <button class="x" type="button" aria-label="Dismiss"><img src="ic-x-small.svg" alt=""></button></div>
          <div class="news-card"><div class="txt"><p class="k">NEW LISTING</p><p class="h">Stock perps are live</p><p class="s">Tesla, Nvidia and 40+ US stocks, around the clock.</p></div>
            <div class="neon" style="left:178px;top:17px;width:137px;height:137px;animation-delay:-2.5s"><img src="neon-2.webp" alt=""></div>
            <button class="x" type="button" aria-label="Dismiss"><img src="ic-x-small.svg" alt=""></button></div>
        </div></div>

        <button class="featured rv press" type="button" data-t="Gold">
          <div class="hd">${asset('#d4af37', 'Au')}
            <div class="mid"><div class="t">Gold <span class="chip">FEATURED</span></div><p class="s">XAU · Metals · up to 20×</p></div>
            <div class="rt"><b class="num">$2,654.20</b><span>+1.24%</span></div></div>
          <div class="spark" id="gold"></div>
          <div class="ft"><div class="faces">
            <div class="asset-ic round"><span><img src="face-1.webp" alt=""></span></div>
            <div class="asset-ic round"><span><img src="face-2.webp" alt=""></span></div>
            <div class="asset-ic round"><span><img src="face-3.webp" alt=""></span></div></div>
            <p><span class="num" id="traders">0</span> traders went long this week</p></div>
        </button>

        <div class="section rv" id="watch">
          <div class="sec-head"><h3>Watchlist</h3><span class="link" style="font-size:14px">Edit</span></div>
          <div class="list">
            ${[['#627eea', 'Ξ', 'Ethereum', 'ETH', 'eth', 3412.08, 2.31], ['#e31937', 'T', 'Tesla', 'TSLA', 'tsla', 248.51, -1.12], ['#9945ff', 'S', 'Solana', 'SOL', 'sol', 184.77, 5.08]].map((r, i) => `${i ? '<div class="sep"></div>' : ''}
            <div class="arow">${asset(r[0], r[1])}<span class="nm"><b>${r[2]}</b><span>${r[3]}</span></span>
              <span class="spk" data-s="${r[4]}" data-neg="${r[6] < 0 ? 1 : 0}"></span>
              <span class="rt" style="width:84px"><b class="num" data-wl="${r[5]}">${usd(r[5])}</b><span class="${r[6] < 0 ? 'down' : 'up'}">${pct(r[6])}</span></span></div>`).join('')}
          </div>
        </div>

        <div class="section rv">
          <div class="sec-head"><h3>Trending</h3><span class="link" style="font-size:14px">See all</span></div>
          <div class="seg seg-glass" id="tseg"><span class="ind"></span>${Object.keys(TRENDING).map((k, i) => `<button type="button" data-v="${k}" class="${i ? '' : 'on'}" ${i ? '' : 'style="font-size:13px"'}>${k}</button>`).join('')}</div>
          <div class="list swap-list" id="tlist">${trendRows(TRENDING.All)}</div>
        </div>

        <div class="section rv">
          <div class="sec-head"><h3>Today’s movers</h3>
            <div class="seg seg-glass bordered" id="mseg"><span class="ind"></span><button type="button" data-v="winners" class="on">Winners</button><button type="button" data-v="losers">Losers</button></div></div>
          <div class="list swap-list" id="mlist">${moverRows(MOVERS.winners)}</div>
        </div>
      </div></div>
      ${tabBar()}
      <div class="home-ind"></div>
    </section>`);

    const scroller = $('.scroll', el);
    const unsubs = [];
    let tf = '1H';

    // chart (line spans x 11 → 308, y offset +2 inside a 120px box, as in Figma)
    const hchart = $('#hchart', el);
    hchart.insertAdjacentHTML('afterbegin', `<svg width="319" height="120" style="position:absolute;left:0;top:0">
      ${[9, 39, 67].map((y) => `<path d="M0 ${y + .5}H319" stroke="#EEF1FA" stroke-opacity=".12" stroke-dasharray="2 4"/>`).join('')}
      ${[37, 87, 137].map((x) => `<path d="M${x + .5} 0V116" stroke="#EEF1FA" stroke-opacity=".12" stroke-dasharray="2 4"/>`).join('')}
      ${[187, 231, 275].map((x) => `<path d="M${x + .5} 0V116" stroke="#EEF1FA" stroke-opacity=".07"/>`).join('')}</svg>`);
    const chart = lineChart(hchart, { id: 'home', w: 350, h: 120, ys: SERIES.home, x0: 11, x1: 308, yOff: 2 });
    const tip = h(`<div class="tip"><span class="d">Sept 12</span><div><span class="v num">$3,240.00</span><span class="c">+ 9.41%</span></div></div>`);
    hchart.appendChild(tip);
    const pvEl = $('#pv', el);
    const valAt = (fi) => { const y = chart.yAt(fi); return state.portfolio - (y - chart.Y(chart.ys[chart.N - 1])) * 18.6; };
    let scrubbing = false;
    const sc = scrubber(hchart, chart, {
      top: -1, height: 127, defIdx: 53, tip, tipSide: 'right',
      onMove(fi) {
        const v = valAt(fi), v0 = valAt(0);
        $('.v', tip).textContent = usd(v);
        const c = ((v - v0) / v0) * 100;
        const ce = $('.c', tip); ce.textContent = (c < 0 ? '− ' : '+ ') + fmt(Math.abs(c)) + '%'; ce.classList.toggle('neg', c < 0);
        if (scrubbing) setBig(pvEl, v);
      },
      onEnd() { scrubbing = false; const from = valAt(53); tween(from, state.portfolio, 450, (v) => setBig(pvEl, v)); },
    });
    hchart.addEventListener('pointerdown', () => { scrubbing = true; });
    [sc.line, sc.dot, tip].forEach((n) => { n.style.opacity = 0; });

    segmented($('#hrange', el), (v) => {
      tf = v;
      const next = v === '1H' ? SERIES.home : altSeries(SERIES.home, TF.indexOf(v) + 3);
      chart.morph(next, 700, sc.refresh);
      $('.d', tip).textContent = TF_LABEL[v];
      const [a, p] = PORTFOLIO_CHG[v];
      const s = $('#pchg span', el);
      countTo(s, a, { from: 0, dur: 600, format: (x) => `$${fmt(x)} (${fmt((x / a) * p)}%)` });
    });
    segmented($('#tseg', el), (v) => swapList($('#tlist', el), trendRows(TRENDING[v])));
    segmented($('#mseg', el), (v) => swapList($('#mlist', el), moverRows(MOVERS[v])));

    function swapList(list, html) {
      list.classList.add('out');
      setTimeout(() => {
        list.innerHTML = html;
        list.classList.remove('out');
        $$('.arow', list).forEach((r, i) => r.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 60, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
      }, 180);
    }

    // gold sparkline + watchlist sparklines draw when visible
    const gold = lineChart($('#gold', el), { id: 'gold', w: 358, h: 70, ys: SERIES.gold, x0: 1, x1: 357, yOff: 4, area: true, glow: false });
    $('.featured', el)._onIn = () => { gold.draw(1400, 150); countTo($('#traders', el), 1240, { from: 0, dur: 1400, delay: 200, format: (v) => fmt(v, 0) }); };
    const sparks = $$('.spk', el).map((s) => lineChart(s, { id: 'sp' + s.dataset.s, w: 64, h: 26, ys: SERIES[s.dataset.s], x0: 0, x1: 64, stroke: s.dataset.neg === '1' ? '#FF6B6B' : '#5BE3B0', sw: 1.6, glow: false }));
    $('#watch', el)._onIn = () => sparks.forEach((s, i) => s.draw(900, 120 + i * 120));
    sparks.forEach((s) => { const p = $('.ln', s.svg); p.style.strokeDasharray = 999; p.style.strokeDashoffset = 999; });
    $$('.ln', gold.svg).forEach((p) => { p.style.strokeDasharray = 999; p.style.strokeDashoffset = 999; });

    // interactions
    el.addEventListener('click', (e) => {
      const g = e.target.closest('[data-go]');
      if (g) { vibrate(); go(Number(g.dataset.go), 'push'); return; }
      const t = e.target.closest('[data-t]');
      if (t) { toast(`${t.dataset.t} – coming soon`, false); return; }
      const x = e.target.closest('.news-card .x');
      if (x) { const c = x.closest('.news-card'); c.classList.add('gone'); setTimeout(() => c.remove(), 500); return; }
      if (e.target.closest('.bell')) { const b = e.target.closest('.bell'); b.classList.remove('ring'); void b.offsetWidth; b.classList.add('ring'); toast('2 new alerts · BTC crossed $98k'); }
    });

    const resetTabs = bindTabBar(el, scroller, () => scroller.scrollTo({ top: 0, behavior: 'smooth' }));

    return {
      el,
      enter(first) {
        resetTabs();
        $$('.seg', el).forEach((s) => { const ind = $('.ind', s); const on = $('button.on', s); if (ind && on && !s.classList.contains('tabbar')) { ind.style.transition = 'none'; ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; void ind.offsetWidth; ind.style.transition = ''; } });
        const unrv = revealOnScroll(scroller, el);
        unsubs.push(unrv);
        // intro animations
        tween(state.portfolio * 0.82, state.portfolio, 1400, (v) => setBig(pvEl, v));
        countTo($('#cash', el), state.cash, { from: 0, dur: 1200, delay: 250 });
        chart.draw(1500, 150);
        setTimeout(() => [sc.line, sc.dot, tip].forEach((n) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' })), 1450);
        $$('.pos-card', el).forEach((c, i) => c.animate([{ opacity: 0, transform: 'translateX(30px)' }, { opacity: 1, transform: 'none' }], { duration: 650, delay: 300 + i * 50, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
        // live ticks
        unsubs.push(subscribe((d) => {
          if (!scrubbing) { setBig(pvEl, state.portfolio); pvEl.classList.remove('flash-up', 'flash-down'); void pvEl.offsetWidth; pvEl.classList.add(d >= 0 ? 'flash-up' : 'flash-down'); }
          $$('[data-live="pnl"]', el).forEach((n) => { n.textContent = sUsd(state.pnl); });
          $$('[data-live="btc"]', el).forEach((n) => { n.textContent = '$' + fmt(state.btc, 0); n.classList.remove('tick-up', 'tick-down'); void n.offsetWidth; n.classList.add(d >= 0 ? 'tick-up' : 'tick-down'); });
          $$('[data-wl]', el).forEach((n) => { if (Math.random() < 0.5) return; const v = Number(n.dataset.wl) * (1 + (Math.random() - 0.5) * 0.002); n.dataset.wl = v; n.textContent = usd(v); n.classList.remove('tick-up', 'tick-down'); void n.offsetWidth; n.classList.add(Math.random() < 0.5 ? 'tick-up' : 'tick-down'); });
        }));
      },
      leave() { unsubs.forEach((u) => u()); },
    };
  }

  /* =====================================================================
     5 · Position detail (Bitcoin)
     ===================================================================== */
  const FEED = [
    { id: 'kova', html: `<div class="tcard" data-id="kova"><div class="tp"><div class="asset-ic round"><span style="background:#7b95ff;color:#021222">K</span></div>
        <div class="who"><b>@kova</b><span class="up">Long 20× · $182.4K</span></div><div class="pl"><b class="up">+$14,210</b><span>Avg. $95,880</span></div></div>
        <q>Breakout over 97k held twice. Adding on dips.</q></div>` },
    { id: 'night', html: `<div class="tcard" data-id="night"><div class="tp"><div class="asset-ic round"><span style="background:#ff9f43"><img src="face-1.webp" alt="" style="width:18px;height:22px"></span></div>
        <div class="who"><b>@nightdesk</b><span class="down">Short 5× · $64.0K</span></div><div class="pl"><b class="down">−$460</b><span>Avg. $99,120</span></div></div>
        <q>Funding too hot, fading the move into 100k.</q></div>` },
  ];
  const priceAtY = (y) => 96310 - (y - 151.4) * 105.63;

  function Detail() {
    const el = h(`<section class="screen detail">
      ${statusBar(true)}
      <div class="scroll"><div class="content">
        <div class="hdr">
          <button class="icon-btn glass press" type="button" id="back"><img src="ic-back.svg" alt=""></button>
          <span class="sp"></span>
          <button class="icon-btn glass press star" type="button" id="star">${starSvg(state.starred)}</button>
          <button class="icon-btn glass press" type="button" id="share"><img src="ic-share.svg" alt=""></button>
        </div>
        <div class="blk">
          <div class="price-blk">
            <div class="who">${asset('#f7931a', '₿')}<div><b>Bitcoin</b><span>BTC · Crypto · up to 40×</span></div></div>
            <div class="val"><div class="bignum num" id="dv"><span class="int">$24,927</span><span class="dec">.18</span></div>
              <div class="today">Today<span class="badge-up"><img src="ic-tri-up.svg" alt=""><span id="dchg">$412.36 (1.68%)</span></span></div></div>
          </div>
          <div class="chart" id="dchart" style="height:270px;width:345px"></div>
          <div style="padding:0 20px"><div class="range glass seg" id="drange"><span class="ind"></span>${TF.map((t) => `<button type="button" data-v="${t}" class="${t === '1H' ? 'on' : ''}">${t}</button>`).join('')}</div></div>
        </div>
        <div class="ratio pre"><div class="t"><b>Long <span class="num" id="lr">0</span>%</b>Traders on Vela · 24h<b>Short <span class="num" id="sr">0</span>%</b></div><div class="bars"><i class="l"></i><i class="s"></i></div></div>
        <div class="below">
          <div class="pos-big rv">
            <div class="h"><span>Your position</span><span class="tag">Long 10×</span></div>
            <div class="pnl"><b class="num" id="pnl">+$0.00</b><span class="num" id="pnlp">+0.00%</span></div>
            <div class="grid">
              <div><span>Lev. size</span><b class="num">$25,000.00</b></div><div><span>Avg. entry</span><b class="num">$96,310.00</b></div>
              <div><span>Liq. price</span><b class="num" style="color:var(--red-soft)">$87,120.00</b></div><div><span>Funding</span><b class="num">−$1.84</b></div>
            </div>
            <button class="share glass press" type="button" id="sharepos"><img src="ic-share-sm.svg" alt="">Share position</button>
          </div>
          <div class="list rv" style="padding:4px 0">
            <button class="prow" type="button" data-t="Auto close"><b>Auto close</b><span>TP $105,000 · SL $92,000</span><img src="ic-chev-right.svg" alt=""></button>
            <div class="sep"></div>
            <button class="prow" type="button" id="thesisRow"><b>Thesis</b><span id="thesisTxt">“ETF inflows + post-halving supply…”</span><img src="ic-chev-right.svg" alt=""></button>
            <div class="sep"></div>
            <button class="prow" type="button" data-t="History"><b>History</b><span>12 trades · export for tax</span><img src="ic-chev-right.svg" alt=""></button>
          </div>
          <div class="tabs2 rv" id="fs"><button type="button" class="on" data-v="feed">Feed</button><button type="button" data-v="stats">Stats</button><span class="ul"></span></div>
          <div id="feedWrap" class="rv" style="display:flex;flex-direction:column;gap:20px">
            <div class="filters"><button class="f on" type="button" data-v="size">Top by size</button><button class="f" type="button" data-v="recent">Recent</button><span class="grow"></span><span class="fl">Following</span><button class="switch" type="button" aria-label="Following"><i></i></button></div>
            <div class="feed" id="feed">${FEED.map((f) => f.html).join('')}</div>
          </div>
          <div id="statsWrap" style="display:none">
            <div class="stats">
              <div><span>24h volume</span><b class="num">$4.1B</b></div><div><span>Open interest</span><b class="num">$1.28B</b></div>
              <div><span>Funding / 8h</span><b class="num up">+0.012%</b></div><div><span>24h range</span><b class="num">$95.9k – $98.9k</b></div>
              <div><span>Max leverage</span><b class="num">40×</b></div><div><span>Your trades</span><b class="num">12</b></div>
            </div>
          </div>
          <div class="mc">
            <button class="btn ghost press" type="button" id="modify" style="height:45px;font-weight:500">Modify</button>
            <button class="btn solid press" type="button" id="close" style="height:44px">Close<span class="shine"></span></button>
          </div>
        </div>
      </div></div>
      ${tabBar()}
      <div class="home-ind"></div>
    </section>`);

    const scroller = $('.scroll', el);
    const unsubs = [];

    // chart + grid + levels
    const dchart = $('#dchart', el);
    dchart.insertAdjacentHTML('afterbegin', `<svg width="393" height="262" style="position:absolute;left:-16px;top:-4px">
      ${[19.6, 85, 146, 191.5].map((y) => `<path d="M0 ${y}H404" stroke="#EEF1FA" stroke-opacity=".12" stroke-dasharray="2 4"/>`).join('')}
      ${[46.7, 109.8, 172.9].map((x) => `<path d="M${x} 0V253" stroke="#EEF1FA" stroke-opacity=".12" stroke-dasharray="2 4"/>`).join('')}
      ${[236, 291.5, 347].map((x) => `<path d="M${x} 0V253" stroke="#EEF1FA" stroke-opacity=".08"/>`).join('')}</svg>
      <div class="lvl entry" style="top:151.4px"></div><div class="lvl-lbl entry" style="top:131.15px">Entry  $96,310</div>
      <div class="lvl liq" style="top:238.4px"></div><div class="lvl-lbl liq" style="top:227.4px">Liq.  $87,120</div>`);
    const chart = lineChart(dchart, { id: 'btc', w: 345, h: 270, ys: SERIES.btc, x0: 0, x1: 320.42, yOff: 0.4, sw: 2.4 });
    const tip = h(`<div class="tip"><span class="d">Sept 12</span><div><span class="v num">$3,240.00</span><span class="c">+ 9.41%</span></div></div>`);
    dchart.appendChild(tip);
    const sc = scrubber(dchart, chart, {
      top: 0, height: 270, defIdx: 73, tip, tipSide: 'left',
      onMove(fi) {
        const p = priceAtY(chart.yAt(fi)), p0 = 96310;
        $('.v', tip).textContent = usd(p);
        const c = ((p - p0) / p0) * 100;
        const ce = $('.c', tip); ce.textContent = (c < 0 ? '− ' : '+ ') + fmt(Math.abs(c)) + '%'; ce.classList.toggle('neg', c < 0);
      },
    });
    [sc.line, sc.dot, tip, ...$$('.lvl, .lvl-lbl', dchart)].forEach((n) => { n.style.opacity = 0; });
    segmented($('#drange', el), (v) => {
      chart.morph(v === '1H' ? SERIES.btc : altSeries(SERIES.btc, TF.indexOf(v) + 11), 700, sc.refresh);
      $('.d', tip).textContent = TF_LABEL[v];
      const [a, p] = PORTFOLIO_CHG[v];
      countTo($('#dchg', el), a, { from: 0, dur: 600, format: (x) => `$${fmt(x)} (${fmt((x / a) * p)}%)` });
    });

    // feed / stats tabs
    const fs = $('#fs', el), ul = $('.ul', fs);
    $$('button', fs).forEach((b) => b.addEventListener('click', () => {
      $$('button', fs).forEach((x) => x.classList.toggle('on', x === b));
      ul.style.width = b.offsetWidth * 0.85 + 'px';
      ul.style.transform = `translateX(${b.offsetLeft}px)`;
      const feed = b.dataset.v === 'feed';
      const show = feed ? $('#feedWrap', el) : $('#statsWrap', el);
      const hide = feed ? $('#statsWrap', el) : $('#feedWrap', el);
      hide.style.display = 'none'; show.style.display = feed ? 'flex' : 'block';
      show.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.32,.72,0,1)' });
      if (!feed) $$('.stats div', el).forEach((d, i) => d.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: i * 50, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'backwards' }));
      vibrate(6);
    }));

    // feed filters – FLIP reorder
    $$('.filters .f', el).forEach((b) => b.addEventListener('click', () => {
      if (b.classList.contains('on')) return;
      $$('.filters .f', el).forEach((x) => x.classList.toggle('on', x === b));
      const feed = $('#feed', el), cards = $$('.tcard', feed);
      const first = new Map(cards.map((c) => [c, c.getBoundingClientRect().top]));
      cards.reverse().forEach((c) => feed.appendChild(c));
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
      cards.forEach((c) => { const d = (first.get(c) - c.getBoundingClientRect().top) / s; c.animate([{ transform: `translateY(${d}px)` }, { transform: 'none' }], { duration: 550, easing: 'cubic-bezier(.34,1.3,.64,1)' }); });
      vibrate(6);
    }));
    $('.switch', el).addEventListener('click', (e) => { e.currentTarget.classList.toggle('on'); vibrate(6); toast(e.currentTarget.classList.contains('on') ? 'Showing traders you follow' : 'Showing all traders', false); });

    const starBtn = $('#star', el);
    starBtn.addEventListener('click', () => {
      state.starred = !state.starred; starBtn.innerHTML = starSvg(state.starred);
      starBtn.classList.remove('pop'); void starBtn.offsetWidth; starBtn.classList.add('pop'); vibrate();
      toast(state.starred ? 'Added to watchlist' : 'Removed from watchlist');
    });
    $('#share', el).addEventListener('click', () => toast('Link copied'));
    $('#sharepos', el).addEventListener('click', () => toast('Position card copied'));
    $('#back', el).addEventListener('click', () => go(4, 'pop'));
    $('#modify', el).addEventListener('click', () => { vibrate(); state.side = 'long'; go(6, 'up'); });
    $('#close', el).addEventListener('click', () => { vibrate(12); toast(`Position closed · ${sUsd(state.pnl)}`); setTimeout(() => go(4, 'pop'), 650); });
    $('#thesisRow', el).addEventListener('click', () => openThesis((t) => { $('#thesisTxt', el).textContent = `“${t}”`; }));
    el.addEventListener('click', (e) => { const t = e.target.closest('[data-t]'); if (t) toast(`${t.dataset.t} – coming soon`, false); });
    const resetTabs = bindTabBar(el, scroller, () => go(4, 'pop'));
    if (state.thesis) $('#thesisTxt', el).textContent = `“${state.thesis}”`;

    return {
      el,
      enter() {
        resetTabs();
        $$('.seg', el).forEach((s) => { const ind = $('.ind', s); const on = $('button.on', s); if (ind && on && !s.classList.contains('tabbar')) { ind.style.transition = 'none'; ind.style.width = on.offsetWidth + 'px'; ind.style.transform = `translateX(${on.offsetLeft}px)`; void ind.offsetWidth; ind.style.transition = ''; } });
        ul.style.transition = 'none'; ul.style.width = '40px'; void ul.offsetWidth; ul.style.transition = '';
        const pnlEl = $('#pnl', el), pctEl = $('#pnlp', el);
        $('.pos-big', el)._onIn = () => {
          countTo(pnlEl, state.pnl, { from: 0, dur: 1300, format: (v) => sUsd(v) });
          countTo(pctEl, (state.pnl / 2500) * 100, { from: 0, dur: 1300, format: (v) => pct(v) });
        };
        unsubs.push(revealOnScroll(scroller, el));
        chart.draw(1500, 250);
        const lv = $$('.lvl, .lvl-lbl', dchart);
        lv.forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 900 + i * 90, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' }));
        setTimeout(() => [sc.line, sc.dot, tip].forEach((n) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, fill: 'forwards' })), 1550);
        tween(24927.18 * 0.9, 24927.18, 1300, (v) => setBig($('#dv', el), v));
        setTimeout(() => $('.ratio', el).classList.remove('pre'), 500);
        countTo($('#lr', el), 64, { from: 0, dur: 1100, delay: 500, format: (v) => fmt(v, 0) });
        countTo($('#sr', el), 36, { from: 0, dur: 1100, delay: 500, format: (v) => fmt(v, 0) });
        unsubs.push(subscribe((d) => {
          if (pnlEl._tw) pnlEl._tw.stop();
          pnlEl.textContent = sUsd(state.pnl); pctEl.textContent = pct((state.pnl / 2500) * 100);
          pnlEl.classList.remove('tick-up', 'tick-down'); void pnlEl.offsetWidth; pnlEl.classList.add(d >= 0 ? 'tick-up' : 'tick-down');
        }));
      },
      leave() { unsubs.forEach((u) => u()); },
    };
  }

  function openThesis(onSave) {
    sheet(`<h4>Your thesis</h4>
      <textarea placeholder="Why are you taking this trade?">${state.thesis || 'ETF inflows + post-halving supply squeeze'}</textarea>
      <div class="chips"><button type="button">Breakout retest</button><button type="button">Macro tailwind</button><button type="button">Funding reset</button></div>
      <button class="btn solid done press" type="button">Save thesis<span class="shine"></span></button>`, (sh, close) => {
      const ta = $('textarea', sh);
      $$('.chips button', sh).forEach((b) => b.addEventListener('click', () => { ta.value = (ta.value ? ta.value.replace(/\s*$/, '') + ' · ' : '') + b.textContent; vibrate(5); }));
      $('.done', sh).addEventListener('click', () => {
        state.thesis = ta.value.trim() || 'No thesis';
        onSave && onSave(state.thesis.length > 34 ? state.thesis.slice(0, 33) + '…' : state.thesis);
        close(); vibrate(10); toast('Thesis saved');
      });
    });
  }

  /* =====================================================================
     6 / 8 · Trade ticket (Long / Short)
     ===================================================================== */
  const LEV_STOPS = [[1, 13], [10, 94], [20, 175], [30, 256], [40, 337]];
  const levToX = (l) => { for (let i = 0; i < LEV_STOPS.length - 1; i++) { const [a, xa] = LEV_STOPS[i], [b, xb] = LEV_STOPS[i + 1]; if (l <= b) return lerp(xa, xb, (l - a) / (b - a)); } return 337; };
  const xToLev = (x) => { x = clamp(x, 13, 337); for (let i = 0; i < LEV_STOPS.length - 1; i++) { const [a, xa] = LEV_STOPS[i], [b, xb] = LEV_STOPS[i + 1]; if (x <= xb) return lerp(a, b, (x - xa) / (xb - xa)); } return 40; };
  const liqPrice = (side, lev, px) => Math.round((side === 'long' ? px * (1 - 0.95 / lev) : px * (1 + 0.95 / lev)) / 10) * 10;

  function Ticket() {
    const el = h(`<section class="screen ticket ${state.side === 'short' ? 'short' : ''}">
      ${statusBar(false)}
      <button class="abs icon-btn glass press" type="button" id="x" style="left:20px;top:56px"><img src="ic-close.svg" alt="" style="width:16px;height:16px"></button>
      <div class="abs ttl"><b>Bitcoin</b><span class="num" id="tp">$98,412.50  ▲ 2.18%</span></div>
      <div class="abs ls glass"><span class="ind"></span>
        <button type="button" data-s="long">Long  <span class="tri g">▲</span></button>
        <button type="button" data-s="short">Short  <span class="tri r">▼</span></button></div>
      <p class="abs sz">Size</p>
      <button class="abs amount" type="button" id="amt"><b class="num">$810</b><i></i></button>
      <p class="abs avail">Available cash  $3,240.00</p>
      <div class="abs presets">${[['10%', 0.1], ['25%', 0.25], ['50%', 0.5], ['Max', 1]].map(([l, v]) => `<button type="button" data-p="${v}" class="${v === state.preset ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="abs lev-h"><p>Leverage</p><p>Max 40×</p></div>
      <div class="abs bubble glass" id="bub">10×</div>
      <div class="abs lev">
        <div class="trk"><div class="fill"></div><div class="ticks">${Array.from({ length: 14 }, (_, i) => `<i class="${[0, 6, 9, 13].includes(i) ? 'mj' : ''}"></i>`).join('')}</div><div class="knob"><i></i></div></div>
        <div class="lbls"><span>1×</span><span>10×</span><span>20×</span><span>30×</span><span>40×</span></div>
      </div>
      <div class="abs summary">
        <div class="r gray"><span>Order type</span><b>Market</b></div><div class="sep"></div>
        <div class="r"><span>Total size</span><b class="num" id="tot">$8,100.00</b></div><div class="sep"></div>
        <div class="r"><span>Liquidation price</span><b class="num liq" id="liq">$89,060.00</b></div><div class="sep"></div>
        <div class="r"><span>Auto close</span><b class="tp" id="tpsl">Add TP / SL  ›</b></div><div class="sep"></div>
        <div class="r"><span>Trading fee  ⓘ</span><b class="num" id="fee">$4.05</b></div>
      </div>
      <p class="abs note">Isolated margin · executes at market price</p>
      <div class="abs slider" id="slide">
        <div class="trail"></div>
        <p class="lbl"><em id="slbl">Slide to open long</em></p>
        <div class="chev">${chevSvg}${chevSvg}${chevSvg}</div>
        <div class="knob idle"><img src="ic-arrow-right.svg" alt=""></div>
      </div>
      <div class="home-ind"></div>
    </section>`);

    const unsubs = [];
    const amtB = $('#amt b', el);
    const totEl = $('#tot', el), liqEl = $('#liq', el), feeEl = $('#fee', el);

    function recalc(anim = true) {
      const total = state.amount * state.lev;
      const liq = liqPrice(state.side, state.lev, state.btc);
      const fee = total * 0.0005;
      const d = anim ? 450 : 0;
      countTo(totEl, total, { dur: d });
      countTo(liqEl, liq, { dur: d });
      countTo(feeEl, fee, { dur: d });
    }
    function setAmount(v, anim = true) {
      const from = state.amount;
      state.amount = Math.round(v * 100) / 100;
      const dec = state.amount % 1 ? 2 : 0;
      if (anim) tween(from, state.amount, 420, (x) => { amtB.textContent = '$' + fmt(x, dec); });
      else amtB.textContent = '$' + fmt(state.amount, dec);
      const a = $('#amt', el); a.classList.remove('bump'); void a.offsetWidth; a.classList.add('bump');
      recalc(anim);
    }

    // long / short
    function setSide(s, anim = true) {
      state.side = s;
      el.classList.toggle('short', s === 'short');
      $$('.ls button', el).forEach((b) => b.classList.toggle('on', b.dataset.s === s));
      $('#slbl', el).textContent = `Slide to open ${s}`;
      history.replaceState({ id: s === 'short' ? '8' : '6' }, '', s === 'short' ? '#/8' : '#/6');
      if (current) current.id = s === 'short' ? '8' : '6';
      recalc(anim);
    }
    $$('.ls button', el).forEach((b) => b.addEventListener('click', () => { if (b.dataset.s !== state.side) { vibrate(8); setSide(b.dataset.s); } }));

    // presets
    $$('.presets button', el).forEach((b) => b.addEventListener('click', () => {
      $$('.presets button', el).forEach((x) => x.classList.toggle('on', x === b));
      state.preset = Number(b.dataset.p); vibrate(6);
      setAmount(state.cash * state.preset);
    }));

    // amount keypad
    $('#amt', el).addEventListener('click', () => {
      let s = String(state.amount);
      sheet(`<h4>Size (USD)</h4><div class="disp num">$${s}</div>
        <div class="keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map((k) => `<button type="button" data-k="${k}">${k}</button>`).join('')}</div>
        <button class="btn solid done press" type="button">Done<span class="shine"></span></button>`, (sh, close) => {
        const disp = $('.disp', sh);
        const show = () => { disp.textContent = '$' + (s ? Number(s.replace(/\.$/, '')).toLocaleString('en-US', { maximumFractionDigits: 2 }) + (s.endsWith('.') ? '.' : '') : '0'); };
        show();
        $$('.keys button', sh).forEach((b) => b.addEventListener('click', () => {
          vibrate(4);
          const k = b.dataset.k;
          if (k === '⌫') s = s.slice(0, -1);
          else if (k === '.') { if (!s.includes('.')) s = (s || '0') + '.'; }
          else if (!/\.\d\d$/.test(s) && s.length < 9) s = s === '0' ? k : s + k;
          show();
        }));
        $('.done', sh).addEventListener('click', () => {
          const v = Number(s || 0);
          if (v > state.cash || v < 10) { disp.classList.remove('err'); void disp.offsetWidth; disp.classList.add('err'); vibrate([10, 40, 10]); toast(v < 10 ? 'Minimum size is $10' : 'Exceeds available cash', false); return; }
          $$('.presets button', el).forEach((x) => x.classList.toggle('on', Math.abs(state.cash * Number(x.dataset.p) - v) < 0.01));
          setAmount(v); close();
        });
      });
    });

    // leverage slider
    const trk = $('.trk', el), knob = $('.lev .knob', el), fill = $('.lev .fill', el), bub = $('#bub', el);
    const ticks = $$('.ticks i', el), lbls = $$('.lbls span', el);
    function paintLev(x) {
      knob.style.left = x + 'px';
      fill.style.width = x + 20 + 'px';
      bub.style.left = 21.5 + x + 'px';
      ticks.forEach((t, i) => t.classList.toggle('on', 13 + (323 / 13) * i <= x + 0.5));
      const L = Math.round(xToLev(x));
      bub.textContent = L + '×';
      lbls.forEach((s, i) => s.classList.toggle('on', Math.abs(LEV_STOPS[i][0] - L) <= 2));
    }
    let levDrag = false;
    const levFromEvent = (e) => { const r = trk.getBoundingClientRect(); const s = r.width / trk.offsetWidth; return (e.clientX - r.left) / s; };
    trk.addEventListener('pointerdown', (e) => {
      levDrag = true; trk.setPointerCapture(e.pointerId);
      knob.classList.add('drag'); bub.classList.add('drag');
      move(e);
    });
    function move(e) {
      if (!levDrag) return;
      const x = clamp(levFromEvent(e), 13, 337);
      const L = Math.round(xToLev(x));
      paintLev(x);
      if (L !== state.lev) { state.lev = L; if (L % 5 === 0 || L === 1) vibrate(5); recalc(false); }
    }
    trk.addEventListener('pointermove', move);
    const levUp = () => {
      if (!levDrag) return; levDrag = false;
      knob.classList.remove('drag'); bub.classList.remove('drag');
      const from = parseFloat(knob.style.left), to = levToX(state.lev);
      tween(from, to, 220, paintLev);
      recalc(true);
    };
    trk.addEventListener('pointerup', levUp); trk.addEventListener('pointercancel', levUp);

    // slide to open
    const sl = $('#slide', el), sk = $('.knob', sl), trail = $('.trail', sl), lbl = $('.lbl', sl), chev = $('.chev', sl);
    const MAX = 353 - 2 - 4 - 56 - 4;
    let sx = null, sdx = 0, done = false;
    const paintSlide = (v) => {
      sdx = v; sk.style.transform = `translateX(${v}px)`; trail.style.width = 56 + v + 'px';
      const p = v / MAX; lbl.style.opacity = 1 - p * 1.6; chev.style.opacity = 1 - p * 2;
    };
    sk.addEventListener('pointerdown', (e) => {
      if (done) return;
      sx = e.clientX - sdx * (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1);
      sk.classList.remove('idle'); sk.setPointerCapture(e.pointerId); vibrate(4);
    });
    sk.addEventListener('pointermove', (e) => {
      if (sx == null) return;
      const s = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1;
      paintSlide(clamp((e.clientX - sx) / s, 0, MAX));
    });
    const slideUp = () => {
      if (sx == null) return; sx = null;
      if (sdx > MAX * 0.78) {
        done = true;
        tween(sdx, MAX, 160, paintSlide);
        vibrate([12, 30, 20]);
        sk.animate([{ boxShadow: `0 0 0 0 rgba(var(--accent-rgb),.6)` }, { boxShadow: `0 0 0 22px rgba(var(--accent-rgb),0)` }], { duration: 500 });
        state.lastTrade = { side: state.side, size: state.amount * state.lev, entry: state.btc, liq: liqPrice(state.side, state.lev, state.btc), lev: state.lev };
        setTimeout(() => go(state.side === 'short' ? 9 : 7, 'fade'), 380);
      } else {
        tween(sdx, 0, 420, paintSlide, (t) => 1 - Math.pow(1 - t, 4));
        setTimeout(() => sk.classList.add('idle'), 450);
      }
    };
    sk.addEventListener('pointerup', slideUp); sk.addEventListener('pointercancel', slideUp);
    sl.addEventListener('click', (e) => { if (e.target === sl || e.target.closest('.lbl')) { sk.classList.remove('idle'); void sk.offsetWidth; sk.classList.add('idle'); } });

    $('#x', el).addEventListener('click', () => go(5, 'down'));
    $('#tpsl', el).closest('.r').addEventListener('click', () => toast('TP / SL – coming soon', false));

    return {
      el,
      enter() {
        setSide(state.side, false);
        setAmount(state.amount, false);
        paintLev(levToX(state.lev));
        recalc(false);
        // entrance
        const items = $$('.ttl, .ls, .sz, .amount, .avail, .presets, .lev-h, .lev, .bubble, .summary .r, .note, .slider', el);
        items.forEach((n, i) => n.animate([{ opacity: 0, translate: '0 14px' }, { opacity: 1, translate: '0 0' }], { duration: 560, delay: 120 + i * 28, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'backwards' }));
        const tp = $('#tp', el);
        unsubs.push(subscribe((d) => {
          const c = ((state.btc - state.btcOpen) / state.btcOpen) * 100;
          tp.textContent = `${usd(state.btc)}  ${c >= 0 ? '▲' : '▼'} ${fmt(Math.abs(c))}%`;
          tp.style.color = c >= 0 ? 'var(--green)' : 'var(--red)';
          liqEl.textContent = usd(liqPrice(state.side, state.lev, state.btc));
        }));
      },
      leave() { unsubs.forEach((u) => u()); },
    };
  }

  /* =====================================================================
     7 / 9 · Position opened
     ===================================================================== */
  function Success(side) {
    const t = state.lastTrade || { side, size: 8100, entry: 98412.5, liq: side === 'short' ? 107760 : 89060, lev: 10 };
    const el = h(`<section class="screen success ${side === 'short' ? 'short' : ''}">
      ${statusBar(false)}
      <div class="abs orb"><video poster="opened-${side === 'short' ? 'short' : 'long'}.webp" muted playsinline preload="auto" disablepictureinpicture><source src="opened-${side === 'short' ? 'short' : 'long'}.mp4" type="video/mp4"><source src="opened-${side === 'short' ? 'short' : 'long'}.webm" type="video/webm"></video></div>
      <p class="abs ttl st" style="transition-delay:.35s">${side === 'short' ? 'Short' : 'Long'} opened.</p>
      <p class="abs sub st" style="transition-delay:.45s">Bitcoin · ${t.lev}× · at market</p>
      <div class="abs det">
        <div class="r st" style="transition-delay:.55s"><span>Size</span><b class="num" id="s1">$0.00</b></div><div class="sep st" style="transition-delay:.6s"></div>
        <div class="r st" style="transition-delay:.65s"><span>Entry price</span><b class="num" id="s2">$0.00</b></div><div class="sep st" style="transition-delay:.7s"></div>
        <div class="r st" style="transition-delay:.75s"><span>Liquidation</span><b class="num liq" id="s3">$0.00</b></div>
      </div>
      <div class="abs acts">
        <button class="btn ghost press st" type="button" id="thesis" style="transition-delay:.9s">Add your thesis</button>
        <button class="btn solid press st" type="button" id="done" style="transition-delay:1s">Close<span class="shine"></span></button>
      </div>
      <div class="home-ind"></div>
    </section>`);
    el.querySelectorAll('.abs').forEach((n) => { n.style.position = 'absolute'; });
    $('#done', el).addEventListener('click', () => go(4, 'fade'));
    $('#thesis', el).addEventListener('click', () => openThesis(() => { const b = $('#thesis', el); b.textContent = 'Thesis added ✓'; b.style.color = 'var(--green)'; }));
    return {
      el,
      enter() {
        requestAnimationFrame(() => el.classList.add('go'));
        const v = $('.orb video', el); try { v.currentTime = 0; } catch (e) {} const pr = v.play(); pr && pr.catch(() => {});
        countTo($('#s1', el), t.size, { from: 0, dur: 1200, delay: 600 });
        countTo($('#s2', el), t.entry, { from: t.entry * 0.97, dur: 1200, delay: 700 });
        countTo($('#s3', el), t.liq, { from: t.liq * (side === 'short' ? 1.03 : 0.97), dur: 1200, delay: 800 });
      },
      leave() { const v = $('.orb video', el); v && v.pause(); },
    };
  }

  /* =====================================================================
     Router + transitions
     ===================================================================== */
  const phone = $('#phone');
  let current = null;
  let busy = false;
  const OPP = { push: 'pop', pop: 'push', up: 'down', down: 'up', fade: 'fade' };

  function build(id) {
    id = String(id);
    if (['1', '2', '3'].includes(id)) return Onboarding(Number(id) - 1);
    if (id === '4') return Home();
    if (id === '5') return Detail();
    if (id === '6') { state.side = 'long'; return Ticket(); }
    if (id === '8') { state.side = 'short'; return Ticket(); }
    if (id === '7') return Success('long');
    if (id === '9') return Success('short');
    return Onboarding(0);
  }

  function animate(oldEl, newEl, type) {
    const d = type === 'fade' ? 380 : 480;
    const F = {
      push: [[{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], [{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-30%)', filter: 'brightness(.55)' }], true],
      pop: [[{ transform: 'translateX(-30%)', filter: 'brightness(.55)' }, { transform: 'none', filter: 'brightness(1)' }], [{ transform: 'none' }, { transform: 'translateX(100%)' }], false],
      up: [[{ transform: 'translateY(100%)' }, { transform: 'none' }], [{ transform: 'scale(1)', filter: 'brightness(1)', borderRadius: '0px' }, { transform: 'scale(.92)', filter: 'brightness(.45)', borderRadius: '40px' }], true],
      down: [[{ transform: 'scale(.92)', filter: 'brightness(.45)', borderRadius: '40px' }, { transform: 'none', filter: 'brightness(1)', borderRadius: '0px' }], [{ transform: 'none' }, { transform: 'translateY(100%)' }], false],
      fade: [[{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }], [{ opacity: 1 }, { opacity: 0 }], true],
    }[type] || [[{ opacity: 0 }, { opacity: 1 }], [{ opacity: 1 }, { opacity: 0 }], true];
    const [inF, outF, onTop] = F;
    onTop ? phone.appendChild(newEl) : phone.insertBefore(newEl, oldEl);
    if (reduced()) { oldEl.remove(); return Promise.resolve(); }
    const o = { duration: d, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'both' };
    const a = newEl.animate(inF, o), b = oldEl.animate(outF, o);
    return Promise.all([a.finished, b.finished]).then(() => { oldEl.remove(); a.cancel(); });
  }

  function render(id, type) {
    const scr = build(id);
    scr.id = String(id);
    const prev = current;
    current = scr;
    if (!prev) { phone.appendChild(scr.el); scr.enter(true); return; }
    busy = true;
    prev.leave();
    animate(prev.el, scr.el, type).finally(() => { busy = false; });
    // start entrance a beat in so it reads during the transition
    requestAnimationFrame(() => scr.enter(false));
  }

  const stack = [];
  function go(id, type = 'push') {
    if (busy || !current) return;
    stack.push({ id: current.id, t: type });
    history.pushState({ id: String(id) }, '', '#/' + id);
    render(id, type);
  }

  window.addEventListener('popstate', (e) => {
    const target = (e.state && e.state.id) || idFromHash();
    if (current && target === current.id) return;
    const last = stack.pop();
    busy = false;
    render(target, last ? OPP[last.t] || 'pop' : 'fade');
  });
  const idFromHash = () => { const m = location.hash.match(/#\/(\d+)/); return m ? m[1] : '1'; };

  /* ---------- Fit to viewport ---------- */
  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const mobile = (vw < 600 && window.matchMedia('(pointer: coarse)').matches) || vw < 480;
    document.body.classList.toggle('mobile', mobile);
    const s = mobile ? Math.min(vw / 393, vh / 852) : Math.min(1, (vh - 64) / 876, (vw - 32) / 417);
    document.documentElement.style.setProperty('--scale', String(s));
  }
  fit();
  window.addEventListener('resize', fit);

  $('#restart').addEventListener('click', () => { stack.length = 0; history.replaceState({ id: '1' }, '', '#/1'); busy = false; render('1', 'fade'); });
  window.addEventListener('keydown', (e) => { if (e.target.closest && e.target.closest('textarea')) return; if (e.key === 'r' || e.key === 'R') $('#restart').click(); });

  // preload heavy images
  ['onb-2.webp', 'onb-3.webp', 'opened-long.webp', 'opened-short.webp', 'neon-1.webp', 'neon-2.webp'].forEach((s) => { const i = new Image(); i.src = s; });

  const first = idFromHash();
  history.replaceState({ id: first }, '', '#/' + first);
  const boot = () => render(first);
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve()).then(boot);
})();
