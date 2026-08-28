/* === Disaster Prep Hub — App Orchestration === */
(function(){
  const D = window.DPH_DATA;
  const G = window.DPH_GLOBE;
  const A = window.DPH_ANIM;

  // ===== State =====
  let state = {
    user: null, // {username, safe: false}
    activeModule: 'globe',
    focusedHazard: null, // hazard key
    focusedEvent: null,  // event id
    playing: true,
    currentSim: null,
    simStep: 0,
    simScore: 0,
    simTimer: null
  };

  // Escape a string for safe interpolation into innerHTML. Profile names are
  // free-text user input (typed into the local login gate), so they must be
  // escaped before going into a template string — otherwise a name like
  // `<img src=x onerror=alert(1)>` would execute as markup.
  function escapeHtml(str){
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  // ===== Track HUD bar height (it wraps to multiple rows on narrow screens) =====
  // so the stage and drawer always start exactly below it instead of a
  // hardcoded value that breaks whenever the header's layout changes.
  const hudBar = document.querySelector('.hud-bar');
  if(hudBar){
    const syncHudHeight = ()=> document.documentElement.style.setProperty('--hud-h', hudBar.offsetHeight + 'px');
    syncHudHeight();
    if(window.ResizeObserver){
      new ResizeObserver(syncHudHeight).observe(hudBar);
    } else {
      window.addEventListener('resize', syncHudHeight);
    }
  }

  // ===== Init Globe =====
  G.init('globeCanvas');
  G.onClickCallback(onMarkerClick);

  // Helper to build full flat list of events
  function getAllEvents(){
    const all = [];
    Object.values(D.HAZARDS).forEach(h=>{
      h.events.forEach(ev=>all.push({...ev, hazardId: h.id, color: h.color}));
    });
    return all;
  }

  const FEATURED_EVENT_IDS = [
    'eq-japan', 'ts-indonesia', 'tp-philippines', 'wf-aus', 'hu-puerto',
    'ff-pakistan', 'vo-indonesia', 'to-usa', 'nu-ukraine', 'ch-india',
    'ls-brazil', 'hw-europe', 'dr-horn'
  ];

  function getFeaturedEvents(){
    const events = getAllEvents();
    return FEATURED_EVENT_IDS
      .map(id => events.find(ev => ev.id === id))
      .filter(Boolean);
  }

  // Render all markers initially
  renderAllMarkers();

  // ===== Module Toggles =====
  document.querySelectorAll('.mod-toggle').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.mod-toggle').forEach(b=>{
        b.classList.remove('active');
        b.setAttribute('aria-pressed','false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed','true');
      state.activeModule = btn.dataset.mod;
      handleModuleSwitch(state.activeModule);
    });
  });

  // ===== Modal focus management =====
  // Traps Tab focus inside an open modal and restores focus to whatever
  // triggered it when the modal closes. Keeps the app usable via keyboard.
  let lastFocusedEl = null;
  function openModal(modalEl){
    lastFocusedEl = document.activeElement;
    modalEl.classList.remove('hidden');
    const focusable = modalEl.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])');
    if(focusable.length) focusable[0].focus();
    modalEl.addEventListener('keydown', trapTab);
  }
  function closeModal(modalEl){
    modalEl.classList.add('hidden');
    modalEl.removeEventListener('keydown', trapTab);
    if(lastFocusedEl) lastFocusedEl.focus();
    if(modalEl.id === 'simulatorModal' && state.simTimer){
      clearTimeout(state.simTimer);
      state.simTimer = null;
    }
  }
  function trapTab(e){
    if(e.key !== 'Tab') return;
    const modalEl = e.currentTarget;
    const focusable = Array.from(modalEl.querySelectorAll('button, input, select, [tabindex]:not([tabindex="-1"])'))
      .filter(el=>!el.disabled && el.offsetParent !== null);
    if(!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length-1];
    if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function handleModuleSwitch(mod){
    if(mod === 'hazards'){
      renderAllMarkers();
      showHazardList();
    } else if(mod === 'simulators'){
      A.stopAllMini();
      openSimulators();
    } else if(mod === 'emergency'){
      A.stopAllMini();
      openEmergency();
    } else if(mod === 'globe'){
      A.stopAllMini();
      renderAllMarkers();
      G.resetView();
      document.getElementById('tacticalDim').classList.remove('active');
      if(state.focusedHazard) A.stop(state.focusedHazard);
    }
  }

  function renderAllMarkers(activeEventId=null){
    G.setMarkers(getFeaturedEvents(), '#00E5FF', activeEventId);
  }

  function showHazardList(){
    const drawer = document.getElementById('drawerContent');
    drawer.innerHTML = '<div class="welcome"><h2>All 14 Hazards</h2><p>Click marker on globe or pick from list below. Cards animate while visible.</p></div><div id="hazardList"></div>';
    const list = document.getElementById('hazardList');
    Object.values(D.HAZARDS).forEach(h=>{
      const item = document.createElement('div');
      item.className = 'hazard-card';
      item.style.borderColor = h.color;
      item.innerHTML = `
        <canvas class="hazard-card-canvas" id="hcard-${h.id}" aria-hidden="true"></canvas>
        <div class="hazard-card-body">
          <div class="hc-head">
            <span class="hc-icon" style="color:${h.color}">${h.icon}</span>
            <div>
              <div class="hc-name">${h.name}</div>
              <div class="hc-type">${h.type}</div>
            </div>
          </div>
          <div class="hc-meta">${h.events.length} events</div>
          <button class="hc-preview" type="button">▶ Open Sim Window</button>
        </div>
      `;
      const canvasId = `hcard-${h.id}`;
      const startIt = ()=> A.startMini(canvasId, h.id);
      const stopIt = ()=> A.stopMini(canvasId);
      item.addEventListener('mouseenter', startIt);
      item.addEventListener('mouseleave', stopIt);
      item.addEventListener('focus', startIt);
      item.addEventListener('blur', stopIt);
      item.querySelector('.hc-preview').addEventListener('click', e=>{
        e.stopPropagation();
        A.stopMini(canvasId);
        SimWindow.open(h);
      });
      item.onclick = ()=> focusHazard(h.id);
      list.appendChild(item);
    });
  }

  function focusHazard(hazardId){
    const h = D.HAZARDS[hazardId];
    state.focusedHazard = hazardId;
    if(h.events.length > 0){
      focusEvent({...h.events[0], hazardId});
    }
  }

  function focusEvent(ev){
    state.focusedHazard = ev.hazardId;
    state.focusedEvent = ev.id;
    const h = D.HAZARDS[ev.hazardId];
    renderAllMarkers(ev.id);
    G.focusEvent(ev);
    document.getElementById('tacticalDim').classList.add('active');
    state.playing = true;
    updatePlayButton();
    // Reset the intensity slider to its default each time a new hazard is
    // focused, then start the animation at that same value — previously the
    // animation always started at a hardcoded 60 while the slider kept
    // whatever value was left over from a prior hazard, so the displayed
    // number and the running animation could disagree.
    const slider = document.getElementById('intensitySlider');
    slider.value = 60;
    document.getElementById('intensityVal').textContent = 60;
    slider.setAttribute('aria-valuenow', 60);
    A.start(ev.hazardId, {intensity: parseInt(slider.value, 10)});
    populateHazardPanel(h, ev);
    populateDrawer(h, ev);
  }

  function onMarkerClick(ev){
    focusEvent(ev);
  }

  function populateHazardPanel(h, ev){
    document.getElementById('hapTitle').textContent = `${h.icon} ${h.name}`;
    document.getElementById('hapSub').textContent = `${ev.country} — ${ev.region} (${ev.year||''})`;
    document.getElementById('hazardAnimPanel').classList.remove('hidden');

    const plan = D.PLANS[h.id];
    if(plan){
      const stepBtns = document.getElementById('stepBtns');
      stepBtns.innerHTML = '';
      ['Pre-Event', 'During', 'Post-Event'].forEach((label,i)=>{
        const b = document.createElement('button');
        b.textContent = label;
        b.setAttribute('aria-pressed', i===0 ? 'true' : 'false');
        b.onclick = ()=>{
          document.querySelectorAll('.hap-step-btns button').forEach(x=>{
            x.classList.remove('active');
            x.setAttribute('aria-pressed','false');
          });
          b.classList.add('active');
          b.setAttribute('aria-pressed','true');
          A.stepOnce(h.id);
        };
        stepBtns.appendChild(b);
      });
    }
  }

  function populateDrawer(h, ev){
    const drawer = document.getElementById('drawerContent');
    const plan = D.PLANS[h.id];
    drawer.innerHTML = `
      <button class="dc-sim-cta" id="openSimWindow" type="button">🎬 Open Simulation Window</button>
      <div class="dc-section">
        <h3>Hazard Profile</h3>
        <div class="hazard-profile">
          <div class="hp-name">${h.icon} ${h.name}</div>
          <div class="hp-row"><span>Type</span><b>${h.type}</b></div>
          <div class="hp-row"><span>Severity</span><b><span class="severity-pill sev-${ev.profile?.severity||2}">LEVEL ${ev.profile?.severity||2}</span></b></div>
          <div class="hp-row"><span>Region</span><b>${ev.country} — ${ev.region}</b></div>
          ${ev.profile?.population?`<div class="hp-row"><span>Population</span><b>${ev.profile.population}</b></div>`:''}
          ${ev.profile?.cascading?`<div class="hp-row"><span>Cascade Risk</span><b>${ev.profile.cascading}</b></div>`:''}
        </div>
      </div>
      ${plan?`
        <div class="dc-section">
          <h3>3-Phase Action Plan</h3>
          <div class="action-plan">
            <div class="ap-phase"><h4>PRE-DISASTER</h4>${plan.pre.map(x=>`<p>• ${x}</p>`).join('')}</div>
            <div class="ap-phase"><h4>DURING EVENT</h4>${plan.during.map(x=>`<p>• ${x}</p>`).join('')}</div>
            <div class="ap-phase"><h4>POST-DISASTER</h4>${plan.post.map(x=>`<p>• ${x}</p>`).join('')}</div>
          </div>
        </div>
      `:''}
      ${ev.history?`
        <div class="dc-section">
          <h3>Historical Context</h3>
          <div class="historical">
            <h4>${ev.year} ${ev.country} ${h.name}</h4>
            <p>${ev.history}</p>
          </div>
        </div>
      `:''}
    `;
    const cta = document.getElementById('openSimWindow');
    if(cta) cta.onclick = ()=> SimWindow.open(h);
  }

  // ===== Hazard Panel Controls =====
  function updatePlayButton(){
    const btn = document.getElementById('hapPlay');
    if(btn){
      btn.textContent = state.playing ? '⏸' : '▶';
      btn.setAttribute('aria-pressed', state.playing ? 'true' : 'false');
      btn.setAttribute('aria-label', state.playing ? 'Pause animation' : 'Play animation');
    }
  }

  document.getElementById('hapPlay').addEventListener('click', ()=>{
    if(!state.focusedHazard) return;
    state.playing = !state.playing;
    A.setPlaying(state.focusedHazard, state.playing);
    updatePlayButton();
  });
  document.getElementById('hapStep').addEventListener('click', ()=>{
    if(!state.focusedHazard) return;
    A.stepOnce(state.focusedHazard);
  });
  document.getElementById('hapClose').addEventListener('click', ()=>{
    document.getElementById('hazardAnimPanel').classList.add('hidden');
    document.getElementById('tacticalDim').classList.remove('active');
    if(state.focusedHazard) A.stop(state.focusedHazard);
    renderAllMarkers();
    G.resetView();
    // If we're in the hazards list view, restart mini anims so cards stay alive
    if(state.activeModule === 'hazards') showHazardList();
  });
  const slider = document.getElementById('intensitySlider');
  slider.addEventListener('input', ()=>{
    const v = parseInt(slider.value);
    document.getElementById('intensityVal').textContent = v;
    slider.setAttribute('aria-valuenow', v);
    if(state.focusedHazard) A.setIntensity(state.focusedHazard, v);
  });

  // Stage HUD controls
  document.getElementById('btnZoomIn').addEventListener('click', ()=> G.zoomBy(-0.4));
  document.getElementById('btnZoomOut').addEventListener('click', ()=> G.zoomBy(0.4));
  document.getElementById('btnAutoSpin').addEventListener('click', (e)=>{
    const spinning = G.toggleAutoRotate();
    e.currentTarget.classList.toggle('active', spinning);
    e.currentTarget.setAttribute('aria-pressed', spinning ? 'true' : 'false');
  });

  // ===== Drawer Toggle =====
  document.getElementById('drawerToggle').addEventListener('click', ()=>{
    const drawer = document.getElementById('sideDrawer');
    const toggleBtn = document.getElementById('drawerToggle');
    drawer.classList.toggle('collapsed');
    const collapsed = drawer.classList.contains('collapsed');
    toggleBtn.textContent = collapsed ? '‹' : '›';
    toggleBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggleBtn.setAttribute('aria-label', collapsed ? 'Expand drawer' : 'Collapse drawer');
  });

  // ===== Global Search =====
  const search = document.getElementById('globalSearch');
  const results = document.getElementById('searchResults');
  search.addEventListener('input', ()=>{
    const q = search.value.toLowerCase().trim();
    if(!q){ results.classList.add('hidden'); search.setAttribute('aria-expanded','false'); return; }
    results.classList.remove('hidden');
    search.setAttribute('aria-expanded','true');
    const matches = [];
    Object.values(D.HAZARDS).forEach(h=>{
      if(h.name.toLowerCase().includes(q) || h.type.toLowerCase().includes(q)){
        matches.push({type:'hazard', label:`${h.icon} ${h.name}`, hazardId: h.id});
      }
      h.events.forEach(ev=>{
        if(ev.country.toLowerCase().includes(q) || (ev.region||'').toLowerCase().includes(q)){
          matches.push({type:'event', label:`${ev.country} (${ev.region}) — ${h.name}`, ev, hazardId: h.id});
        }
      });
    });
    results.innerHTML = matches.slice(0,12).map(m=>{
      return `<div class="sr-item" role="option" tabindex="0" data-hid="${m.hazardId||''}" data-eid="${m.ev?m.ev.id:''}"><span class="type">${m.type}</span>${m.label}</div>`;
    }).join('') || '<div class="sr-item muted" role="option">No matches</div>';
    results.querySelectorAll('.sr-item[data-hid]').forEach(el=>{
      const activate = ()=>{
        const hid = el.dataset.hid;
        const eid = el.dataset.eid;
        results.classList.add('hidden');
        search.setAttribute('aria-expanded','false');
        search.value = '';
        if(eid){
          const ev = D.HAZARDS[hid].events.find(e=>e.id===eid);
          if(ev) focusEvent(ev);
        } else {
          focusHazard(hid);
        }
      };
      el.onclick = activate;
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'){ activate(); } });
    });
  });
  document.addEventListener('click', e=>{
    if(!e.target.closest('.search-wrap')){
      results.classList.add('hidden');
      search.setAttribute('aria-expanded','false');
    }
  });

  // ===== Auth (gate + badge) =====
  const authBadge = document.getElementById('authStatus');
  authBadge.addEventListener('click', ()=>{
    if(state.user){ openProfileMenu(); }
    else { showGate(); }
  });

  // Gate elements
  const gate = document.getElementById('loginGate');
  const gateForm = document.getElementById('gateForm');
  const gateUser = document.getElementById('gateUser');
  const gatePass = document.getElementById('gatePass');
  const gateError = document.getElementById('gateError');
  const gateGuestBtn = document.getElementById('gateGuest');
  const gateSavedList = document.getElementById('gateSavedList');
  const gateSavedCount = document.getElementById('gateSavedCount');

  function readProfiles(){
    try { return JSON.parse(localStorage.getItem('dph_profiles')||'{}'); }
    catch { return {}; }
  }
  function writeProfiles(p){ localStorage.setItem('dph_profiles', JSON.stringify(p)); }

  function showGate(){
    renderGateProfiles();
    gate.classList.remove('hidden');
    gateError.textContent = '';
    setTimeout(()=> gateUser.focus(), 50);
  }
  function hideGate(){
    gate.classList.add('hidden');
    gateUser.value = '';
    gatePass.value = '';
    gateError.textContent = '';
  }
  function loginAs(user){
    state.user = user;
    localStorage.setItem('dph_currentUser', user.username);
    updateAuthBadge();
    hideGate();
  }
  function renderGateProfiles(){
    const profiles = readProfiles();
    const names = Object.keys(profiles).sort();
    gateSavedCount.textContent = names.length;
    if(!names.length){ gateSavedList.innerHTML = ''; return; }
    gateSavedList.innerHTML = names.map(n=>{
      const p = profiles[n] || {};
      const date = p.lastLogin ? new Date(p.lastLogin).toLocaleDateString() : '';
      const safeMark = p.safe ? '<span style="color:var(--ok);font-size:10px;margin-left:6px;">✓ safe</span>' : '';
      const safeName = escapeHtml(n);
      return `
        <div class="gate-saved-row" data-u="${encodeURIComponent(n)}">
          <span class="gsr-name">${safeName}${safeMark}</span>
          ${date ? `<span class="gsr-date">${date}</span>` : ''}
          <button class="gsr-load" type="button">Load</button>
          <button class="gsr-del" type="button" aria-label="Delete ${safeName}">✕</button>
        </div>
      `;
    }).join('');
    gateSavedList.querySelectorAll('.gate-saved-row').forEach(row=>{
      const name = decodeURIComponent(row.dataset.u);
      row.querySelector('.gsr-load').onclick = ()=>{
        const profiles = readProfiles();
        if(!profiles[name]){ renderGateProfiles(); return; }
        profiles[name].lastLogin = Date.now();
        writeProfiles(profiles);
        loginAs({username: name, safe: !!profiles[name].safe});
      };
      row.querySelector('.gsr-del').onclick = (e)=>{
        e.stopPropagation();
        if(!confirm(`Delete saved profile "${name}"?`)) return;
        const profiles = readProfiles();
        delete profiles[name];
        writeProfiles(profiles);
        if(state.user && state.user.username === name){
          state.user = null;
          localStorage.removeItem('dph_currentUser');
          updateAuthBadge();
        }
        renderGateProfiles();
      };
    });
  }

  gateForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const u = gateUser.value.trim();
    const p = gatePass.value;
    if(!u || !p){
      gateError.textContent = 'Username and PIN are required.';
      return;
    }
    if(u.length < 2){
      gateError.textContent = 'Username must be at least 2 characters.';
      return;
    }
    const profiles = readProfiles();
    if(profiles[u] && profiles[u].password !== p){
      gateError.textContent = 'PIN does not match the saved profile. Pick another or load saved.';
      return;
    }
    profiles[u] = {
      password: p,
      safe: (profiles[u] && profiles[u].safe) || false,
      createdAt: profiles[u]?.createdAt || Date.now(),
      lastLogin: Date.now()
    };
    writeProfiles(profiles);
    loginAs({username: u, safe: !!profiles[u].safe});
  });
  gateGuestBtn.addEventListener('click', ()=>{
    state.user = {username:'Guest', isGuest:true, safe:false};
    updateAuthBadge();
    hideGate();
  });

  function openProfileMenu(){
    if(confirm(`Logged in as ${state.user.username}. Sign out?`)){
      state.user = null;
      localStorage.removeItem('dph_currentUser');
      updateAuthBadge();
      showGate();
    }
  }
  function updateAuthBadge(){
    if(state.user){
      authBadge.classList.add('logged');
      authBadge.classList.remove('guest');
      authBadge.innerHTML = `<span class="dot"></span><span>${escapeHtml(state.user.username)}</span>`;
    } else {
      authBadge.classList.remove('logged');
      authBadge.classList.add('guest');
      authBadge.innerHTML = `<span class="dot"></span><span>Guest</span>`;
    }
  }

  // Restore session OR show gate
  const cur = localStorage.getItem('dph_currentUser');
  if(cur){
    const profiles = readProfiles();
    if(profiles[cur]){
      state.user = {username:cur, safe: !!profiles[cur].safe};
      updateAuthBadge();
    } else {
      localStorage.removeItem('dph_currentUser');
      showGate();
    }
  } else {
    showGate();
  }

  // ===== Emergency Hub =====
  function openEmergency(){
    openModal(document.getElementById('emergencyModal'));
    populateSOSSelect();
  }
  function populateSOSSelect(){
    const select = document.getElementById('sosCountrySelect');
    if(!select) return;
    const countries = Object.keys(D.SOS_CONTACTS);
    const defaultCountry = state.focusedEvent ? (D.HAZARDS[state.focusedHazard]?.events.find(e=>e.id===state.focusedEvent)?.country || 'Japan') : 'Japan';
    
    select.innerHTML = countries.map(c=>`<option value="${c}" ${c===defaultCountry?'selected':''}>${c}</option>`).join('');
    select.onchange = ()=> renderSOS(select.value);
    renderSOS(select.value || defaultCountry);
    updateSafeStatus();
  }
  function renderSOS(country){
    const regionSOS = document.getElementById('regionSOS');
    const sos = D.SOS_CONTACTS[country] || D.SOS_CONTACTS['Japan'];
    regionSOS.innerHTML = sos.map(c=>`<div class="sos-row"><span>${c.name}</span><b>${c.num}</b></div>`).join('');
  }
  document.getElementById('emergencyClose').addEventListener('click', ()=>{
    closeModal(document.getElementById('emergencyModal'));
  });
  document.getElementById('markSafe').addEventListener('click', ()=>{
    if(!state.user){
      document.getElementById('safeStatus').textContent = 'Login to mark yourself safe.';
      return;
    }
    state.user.safe = !state.user.safe;
    const profiles = JSON.parse(localStorage.getItem('dph_profiles')||'{}');
    if(profiles[state.user.username]) profiles[state.user.username].safe = state.user.safe;
    localStorage.setItem('dph_profiles', JSON.stringify(profiles));
    updateSafeStatus();
  });
  function updateSafeStatus(){
    const el = document.getElementById('safeStatus');
    if(!state.user){ el.textContent = 'Login to mark safe.'; el.className = 'safe-status'; }
    else if(state.user.safe){ el.textContent = `✓ ${state.user.username} marked safe at ${new Date().toLocaleTimeString()}`; el.className = 'safe-status marked'; }
    else { el.textContent = `${state.user.username} not marked safe yet.`; el.className = 'safe-status'; }
  }

  // ===== Simulators =====
  function openSimulators(){
    openModal(document.getElementById('simulatorModal'));
    const list = document.getElementById('simList');
    list.innerHTML = '';
    Object.values(D.SIMULATORS).forEach(sim=>{
      const card = document.createElement('div');
      card.className = 'sim-card';
      card.innerHTML = `
        <h4>${sim.title}</h4>
        <p>${sim.steps.length} decision point${sim.steps.length>1?'s':''}</p>
        <div class="sim-meta"><span>EST ${sim.estTime||3} MIN</span><span class="diff">${(sim.difficulty||'MEDIUM').toUpperCase()}</span></div>
      `;
      card.onclick = ()=> runSim(sim);
      list.appendChild(card);
    });
  }
  function runSim(sim){
    if(state.simTimer){ clearTimeout(state.simTimer); state.simTimer = null; }
    state.currentSim = sim;
    state.simStep = 0;
    state.simScore = 0;
    renderSimStep();
  }
  function renderSimStep(){
    const run = document.getElementById('simRun');
    if(!state.currentSim){ run.classList.add('hidden'); return; }
    run.classList.remove('hidden');
    const sim = state.currentSim;

    if(state.simStep >= sim.steps.length){
      const pct = Math.round((state.simScore / sim.steps.length) * 100);
      const isMaster = pct >= 75;
      run.innerHTML = `
        <div class="sim-score">
          <div class="score-label">SCENARIO COMPLETE</div>
          <div class="score-num" style="color:${isMaster?'var(--ok)':'var(--accent-3)'}">${pct}%</div>
          <p class="muted">${isMaster ? 'Outstanding survival readiness!' : 'Good attempt. Review action plan tips in the drawer to improve.'}</p>
          <button class="btn-primary" id="simRestart" style="margin-top:14px;">Try Again</button>
        </div>
      `;
      document.getElementById('simRestart').onclick = ()=>{ state.simStep=0; state.simScore=0; renderSimStep(); };
      return;
    }

    const step = sim.steps[state.simStep];
    const pctProgress = Math.round((state.simStep / sim.steps.length) * 100);
    run.innerHTML = `
      <div class="sim-progress"><div class="sim-progress-bar" style="width:${pctProgress}%"></div></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="font-size:11px;color:var(--mut);letter-spacing:1px;">STEP ${state.simStep+1}/${sim.steps.length}</span>
        <span style="font-size:11px;color:var(--accent);">${sim.title}</span>
      </div>
      <div class="sim-q">${step.q}</div>
      <div class="sim-opts">
        ${step.opts.map((o,i)=>`<button class="sim-opt" data-i="${i}">${o.t}</button>`).join('')}
      </div>
      <div id="simFeedback"></div>
    `;
    run.querySelectorAll('.sim-opt').forEach(b=>{
      b.onclick = ()=>{
        const i = parseInt(b.dataset.i);
        const opt = step.opts[i];
        if(opt.ok) state.simScore += 1;
        run.querySelectorAll('.sim-opt').forEach(x=>x.onclick=null);
        b.classList.add(opt.ok?'correct':'wrong');
        const fb = document.getElementById('simFeedback');
        fb.className = `sim-feedback ${opt.ok?'good':'bad'}`;
        fb.textContent = opt.fb;
        run.querySelectorAll('.sim-opt').forEach((x,idx)=>{
          if(idx!==i) x.style.opacity = '0.4';
        });
        state.simTimer = setTimeout(()=>{
          state.simTimer = null;
          state.simStep++;
          renderSimStep();
        }, 1800);
      };
    });
  }
  document.getElementById('simClose').addEventListener('click', ()=>{
    closeModal(document.getElementById('simulatorModal'));
  });

  // ===== Coord readout loop =====
  let readoutFrame = null;
  function updateReadout(){
    const c = G.getCoords();
    document.getElementById('latRead').textContent = c.lat.toFixed(2);
    document.getElementById('lonRead').textContent = c.lon.toFixed(2);
    document.getElementById('altRead').textContent = c.alt.toFixed(2);
    readoutFrame = requestAnimationFrame(updateReadout);
  }
  updateReadout();
  document.addEventListener('visibilitychange', ()=>{
    if(document.hidden){
      if(readoutFrame){ cancelAnimationFrame(readoutFrame); readoutFrame = null; }
    } else if(!readoutFrame){
      updateReadout();
    }
  });

  // Keyboard shortcut: ESC closes modals; Ctrl+L toggles gate
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      if(!gate.classList.contains('hidden')) return; // gate: ESC does nothing
      document.querySelectorAll('.modal:not(.hidden)').forEach(m=>closeModal(m));
    } else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='l'){
      e.preventDefault();
      if(state.user) openProfileMenu();
      else showGate();
    }
  });
})();