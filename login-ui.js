/* === Disaster Prep Hub — Login UI Extras ===
 * Live threat ticker + ambient background. Pure DOM + canvas2d.
 * No build step. Loaded by index.html gate and login.html.
 */
(function () {
  'use strict';

  // -------- Reduced motion --------
  const prefersReduce = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Stats from DPH_DATA --------
  function computeStats() {
    const D = window.DPH_DATA;
    if (!D) return [];
    const H = D.HAZARDS || {};
    const hazardKeys = Object.keys(H);
    let totalEvents = 0;
    let countries = new Set();
    let deadliest = { name: '—', year: '—', impact: 0 };
    let yearWindow = { year: '—', count: 0, byYear: {} };

    hazardKeys.forEach(k => {
      const evs = (H[k] && H[k].events) || [];
      totalEvents += evs.length;
      evs.forEach(e => {
        if (e.country) countries.add(e.country);
        const impact = (e.deaths || 0) + (e.affected || 0);
        if (impact > deadliest.impact) deadliest = { name: e.name || k, year: e.year || '—', impact };
        if (e.year) {
          yearWindow.byYear[e.year] = (yearWindow.byYear[e.year] || 0) + 1;
        }
      });
    });

    Object.keys(yearWindow.byYear).forEach(y => {
      if (yearWindow.byYear[y] > yearWindow.count) {
        yearWindow.year = y;
        yearWindow.count = yearWindow.byYear[y];
      }
    });

    return [
      { label: 'Hazard types tracked', value: String(hazardKeys.length), accent: '#00E5FF' },
      { label: 'Historical events indexed', value: String(totalEvents), accent: '#FFB300' },
      { label: 'Countries with intel', value: String(countries.size), accent: '#3CFF8B' },
      { label: 'Peak activity year', value: String(yearWindow.year), accent: '#FF2E9A' },
      { label: 'Simulator scenarios', value: String((D.SIMULATORS || []).length), accent: '#A78BFA' },
      { label: 'Cascading risk combos', value: String((D.COMBOS || []).length), accent: '#FF4757' },
    ];
  }

  // -------- Ticker --------
  function buildTicker(root) {
    if (!root) return;
    const stats = computeStats();
    if (!stats.length) {
      root.hidden = true;
      return;
    }
    let idx = 0;
    const valueEl = root.querySelector('.lt-value');
    const labelEl = root.querySelector('.lt-label');
    const dotEl = root.querySelector('.lt-dot');

    const render = () => {
      const s = stats[idx % stats.length];
      if (valueEl) {
        valueEl.textContent = s.value;
        valueEl.style.color = s.accent;
      }
      if (labelEl) labelEl.textContent = s.label;
      if (dotEl) dotEl.style.background = s.accent;
      root.dataset.idx = String(idx);
      idx++;
    };

    render();
    if (prefersReduce()) return;
    const id = window.setInterval(render, 4000);
    window.addEventListener('beforeunload', () => window.clearInterval(id), { once: true });
  }

  // -------- Background canvas --------
  function buildBackground(root) {
    if (!root) return;
    const cnv = document.createElement('canvas');
    cnv.className = 'gate-ambient';
    cnv.setAttribute('aria-hidden', 'true');
    root.appendChild(cnv);

    const ctx = cnv.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = root.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      cnv.width = w * dpr;
      cnv.height = h * dpr;
      cnv.style.width = w + 'px';
      cnv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    if (prefersReduce()) {
      // Static gradient only.
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(0, 229, 255, 0.08)');
      g.addColorStop(0.5, 'rgba(167, 139, 250, 0.05)');
      g.addColorStop(1, 'rgba(255, 46, 154, 0.04)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const frame = (now) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, w, h);

      // Aurora: three soft blobs drifting on sine paths.
      const blobs = [
        { r: 0.45, c: 'rgba(0, 229, 255, 0.10)', sx: 0.18, sy: 0.32, fx: 0.07, fy: 0.05 },
        { r: 0.55, c: 'rgba(167, 139, 250, 0.08)', sx: 0.82, sy: 0.28, fx: 0.06, fy: 0.08 },
        { r: 0.40, c: 'rgba(255, 46, 154, 0.07)', sx: 0.5, sy: 0.78, fx: 0.05, fy: 0.06 },
      ];
      blobs.forEach((b, i) => {
        const x = (b.sx + Math.sin(t * b.fx * 6 + i) * 0.08) * w;
        const y = (b.sy + Math.cos(t * b.fy * 5 + i * 1.3) * 0.06) * h;
        const radius = b.r * Math.min(w, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, b.c);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      });

      // Seismic line: polyline drifting across lower third.
      const baseY = h * 0.86;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      const step = 6;
      for (let x = 0; x <= w; x += step) {
        const phase = (x / w) * 6 + t * 1.4;
        const y = baseY + Math.sin(phase) * 6 + Math.sin(phase * 2.3 + 1.1) * 4;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = window.requestAnimationFrame(frame);
    };
    raf = window.requestAnimationFrame(frame);

    // Pause when tab hidden.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
      } else if (!raf) {
        raf = window.requestAnimationFrame(frame);
      }
    });
  }

  // -------- Boot --------
  function boot() {
    document.querySelectorAll('[data-login-ambient]').forEach(buildBackground);
    document.querySelectorAll('[data-login-ticker]').forEach(buildTicker);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
