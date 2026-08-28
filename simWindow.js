/* === Disaster Prep Hub — Simulation Control Window === */
(function () {
  const A = window.DPH_ANIM;
  const CID = 'swCanvas';
  const el = id => document.getElementById(id);

  const LEVELS = {
    1: { name: 'MILD', bg: 'rgba(60,255,139,.15)', fg: '#3CFF8B', rec: 30,
         desc: 'Minor impact — local disruption, light debris, few injuries.' },
    2: { name: 'MODERATE', bg: 'rgba(255,179,0,.15)', fg: '#FFB300', rec: 55,
         desc: 'Medium damage — evacuations begin, infrastructure strained.' },
    3: { name: 'SEVERE', bg: 'rgba(255,71,87,.18)', fg: '#FF4757', rec: 80,
         desc: 'Major destruction — casualties expected, long recovery.' },
    4: { name: 'CATASTROPHIC', bg: 'rgba(255,46,154,.18)', fg: '#FF2E9A', rec: 100,
         desc: 'Total devastation — regional disaster zone declared.' }
  };

  let hazard = null;
  let playing = true;

  function open(h) {
    hazard = h;
    el('swTitle').textContent = `${h.icon} ${h.name}`;
    el('swSub').textContent = `${h.type} · ${h.events.length} recorded event${h.events.length > 1 ? 's' : ''}`;
    el('swSpeed').value = '1';
    setLevel(2);
    el('simWindow').classList.remove('hidden');
    requestAnimationFrame(startAnim);   // wait for layout, otherwise canvas is 0-width
  }

  function startAnim() {
    if (!hazard) return;
    A.startWin(CID, hazard.id, {
      intensity: parseInt(el('swIntensity').value, 10),
      speed: parseFloat(el('swSpeed').value)
    });
    playing = true;
    el('swPause').textContent = '⏸ Pause';
  }

  function close() {
    el('simWindow').classList.add('hidden');
    A.stopWin(CID);
    hazard = null;
  }

  function setLevel(lv) {
    const L = LEVELS[lv];
    const badge = el('swBadge');
    badge.textContent = L.name;
    badge.style.background = L.bg;
    badge.style.color = L.fg;
    badge.style.boxShadow = `0 0 8px ${L.fg}55`;
    el('swDesc').textContent = L.desc;
    document.querySelectorAll('.lv-btn').forEach(b => {
      const on = +b.dataset.lv === lv;
      b.classList.toggle('active', on);
      b.style.color = on ? L.fg : '';
      b.style.borderColor = on ? L.fg : '';
      b.style.background = on ? L.bg : '';
    });
    applyIntensity(L.rec);              // picking a level auto-tunes intensity
  }

  function applyIntensity(v) {
    el('swIntensity').value = v;
    el('swIntensityVal').textContent = v + '%';
    A.winSetIntensity(CID, v);
  }

  // ===== Wiring =====
  el('swClose').addEventListener('click', close);
  el('swIntensity').addEventListener('input', () =>
    applyIntensity(parseInt(el('swIntensity').value, 10)));
  el('swSpeed').addEventListener('change', () =>
    A.winSetSpeed(CID, parseFloat(el('swSpeed').value)));
  document.querySelectorAll('.lv-btn').forEach(b =>
    b.addEventListener('click', () => setLevel(+b.dataset.lv)));
  el('swPause').addEventListener('click', () => {
    playing = !playing;
    A.winSetPlaying(CID, playing);
    el('swPause').textContent = playing ? '⏸ Pause' : '▶ Play';
  });
  el('swStep').addEventListener('click', () => A.winStepOnce(CID));
  el('swRestart').addEventListener('click', startAnim);

  // Close when clicking backdrop
  el('simWindow').addEventListener('click', e => {
    if (e.target === el('simWindow')) close();
  });

  // ESC — stop anim immediately (app.js hides the modal itself)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !el('simWindow').classList.contains('hidden')) A.stopWin(CID);
  }, true);

  window.SimWindow = { open, close };
})();