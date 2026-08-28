/* === Disaster Prep Hub — 3D Globe (Three.js) ===
 * API kept compatible with prior Leaflet version:
 *   init, setMarkers, focusEvent, resetView, toggleAutoRotate, zoomBy,
 *   onClickCallback, onHover, getCoords
 * Coords math: lat/lon -> unit-sphere XYZ. Alt = camera distance.
 */
window.DPH_GLOBE = (function () {
  const RADIUS = 1.0;                 // globe radius (world units)
  const MIN_DIST = 1.4;
  const MAX_DIST = 5.0;
  const DEFAULT_DIST = 3.0;

  let scene, camera, renderer, globe, group, raycaster, mouse;
  let container = null;
  let width = 0, height = 0;
  let isDragging = false;
  let prevX = 0, prevY = 0;
  let yaw = 0, pitch = 0;             // sphere orientation
  let targetYaw = 0, targetPitch = 0; // damped targets
  let camDist = DEFAULT_DIST;
  let targetCamDist = DEFAULT_DIST;
  let autoRotate = false;
  let spinSpeed = 0.0008;             // rad/frame
  let pinGroup;                       // markers container
  let pinMap = new Map();             // event.id -> pin object
  let activeEventId = null;
  let defaultColor = '#00E5FF';
  let clickCallback = null;
  let hoverCallback = null;
  let animationId = null;
  let resizeObserver = null;
  // Labels (country + continent) rendered as HTML overlay
  let labelLayer = null;
  let labelData = [];                 // [{name, lat, lon, kind, el}]
  let labelSrc = window.DPH_DATA || null;

  // lat/lon (deg) -> unit-sphere XYZ
  function latLonToVec3(lat, lon, r = RADIUS) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -r * Math.sin(phi) * Math.cos(theta),
       r * Math.cos(phi),
       r * Math.sin(phi) * Math.sin(theta)
    );
  }

  function init(canvasId /*, opts */) {
    container = document.getElementById(canvasId);
    if (!container) return this;
    if (typeof THREE === 'undefined') {
      console.error('[DPH_GLOBE] Three.js not loaded.');
      return this;
    }

    width = container.clientWidth;
    height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, camDist);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(width, height);
    container.innerHTML = '';
    // Ensure canvas fills container as a positioned layer
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }
    container.appendChild(renderer.domElement);
    renderer.domElement.style.cursor = 'grab';

    // Label overlay (HTML divs on top of WebGL canvas)
    labelLayer = document.createElement('div');
    labelLayer.className = 'globe-label-layer';
    labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;';
    container.appendChild(labelLayer);
    buildLabels();

    // Lights
    const ambient = new THREE.AmbientLight(0xaaaaaa, 0.6);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xffffff, 1.1);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-5, -2, -3);
    scene.add(rim);

    // Globe group (yaw/pitch applied here so pins rotate with earth)
    group = new THREE.Group();
    scene.add(group);

    // Earth sphere (procedural — dark blue with simple land/sea shading)
    const globeGeo = new THREE.SphereGeometry(RADIUS, 64, 48);
    const globeMat = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x303030,
      shininess: 14,
      flatShading: false
    });
    globe = new THREE.Mesh(globeGeo, globeMat);
    group.add(globe);

    // Async: load land texture and apply when ready
    loadLandTexture().then((tex) => {
      if (tex && globe && globe.material) {
        globe.material.map = tex;
        globe.material.color.set(0xffffff);
        globe.material.needsUpdate = true;
      }
    }).catch((err) => {
      console.warn('[DPH_GLOBE] Land texture failed:', err);
    });

    // Wireframe overlay for "tactical" feel
    const wireGeo = new THREE.SphereGeometry(RADIUS * 1.001, 24, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x777777,
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    group.add(wire);

    // Equator + meridian rings
    const ringMat = new THREE.LineBasicMaterial({ color: 0xbdbdbd, transparent: true, opacity: 0.28 });
    const equator = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-RADIUS, 0, 0), new THREE.Vector3(RADIUS, 0, 0)
    ]);
    scene.add(new THREE.Line(equator, ringMat));
    const meridian = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -RADIUS, 0), new THREE.Vector3(0, RADIUS, 0)
    ]);
    scene.add(new THREE.Line(meridian, ringMat));

    // Atmosphere glow (sprite halo)
    const haloMat = new THREE.SpriteMaterial({
      map: makeHaloTexture(),
      color: 0xffffff,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    });
    const halo = new THREE.Sprite(haloMat);
    halo.scale.set(RADIUS * 3.2, RADIUS * 3.2, 1);
    scene.add(halo);

    // Pin group (lives inside `group` so pins rotate with the globe)
    pinGroup = new THREE.Group();
    group.add(pinGroup);

    // Picking
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    bindEvents();
    animate();
    return this;
  }

  function makeHaloTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 20, 64, 64, 64);
    g.addColorStop(0, 'rgba(120,200,255,0.55)');
    g.addColorStop(0.5, 'rgba(80,160,255,0.18)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // ===== Land texture (TopoJSON -> equirectangular canvas) =====
  const TEX_W = 2048, TEX_H = 1024;
  async function loadLandTexture() {
    if (typeof topojson === 'undefined') throw new Error('topojson-client not loaded');
    const url = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const topo = await resp.json();

    // TopoJSON land-110m has objects.land (single FeatureCollection of land polygons)
    const landFC = topojson.feature(topo, topo.objects.land);
    const geom = landFC.type === 'FeatureCollection' ? landFC.features : [landFC];

    const c = document.createElement('canvas');
    c.width = TEX_W; c.height = TEX_H;
    const ctx = c.getContext('2d');

    // Ocean base
    const oceanGradient = ctx.createLinearGradient(0, 0, 0, TEX_H);
    oceanGradient.addColorStop(0, '#061a31');
    oceanGradient.addColorStop(0.5, '#0b5272');
    oceanGradient.addColorStop(1, '#061a31');
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(110,220,255,0.16)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * TEX_W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, TEX_H); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * TEX_H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(TEX_W, y); ctx.stroke();
    }

    // Project a GeoJSON Polygon/MultiPolygon ring to canvas path.
    // Coordinates are [lon, lat]. We build a single compound path per polygon
    // so we can fill once with evenodd (outer + holes).
    //
    // IMPORTANT — antimeridian handling: the Africa+Europe+Asia landmass is a
    // single connected polygon in this dataset (they're physically joined),
    // and its ring crosses the ±180° seam out at Chukotka (Russian Far East).
    // A naive `x = ((lon+180)/360)*TEX_W` projection turns that seam crossing
    // into one long horizontal edge that shoots across almost the entire
    // texture width, which self-intersects the path and corrupts the
    // evenodd fill for the *whole* polygon — in practice this made all of
    // Africa/Europe/Asia render as background (ocean) color instead of land,
    // while continents that don't cross the seam (Americas, Australia, etc.)
    // rendered fine. To fix it we "unwrap" each ring's longitude so it never
    // jumps by more than 180° in one step, then draw the ring three times at
    // x-offsets of -TEX_W, 0 and +TEX_W. Exactly one (or two, split across
    // the edges) of those copies lands within the visible canvas and fills
    // correctly; the rest fall outside the canvas bounds and are simply
    // clipped, so this is safe for every polygon, not just the seam-crossing
    // one.
    const unwrapRingLon = (ring) => {
      const out = [];
      let offset = 0, prevLon = null;
      for (let i = 0; i < ring.length; i++) {
        const [lon, lat] = ring[i];
        if (prevLon !== null) {
          const diff = lon - prevLon;
          if (diff > 180) offset -= 360;
          else if (diff < -180) offset += 360;
        }
        out.push([lon + offset, lat]);
        prevLon = lon;
      }
      return out;
    };
    const ringPath = (ctx2, ring, shift) => {
      const unwrapped = unwrapRingLon(ring);
      for (let i = 0; i < unwrapped.length; i++) {
        const [lon, lat] = unwrapped[i];
        const x = ((lon + 180) / 360) * TEX_W + shift * TEX_W;
        const y = ((90 - lat) / 180) * TEX_H;
        if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
      }
      ctx2.closePath();
    };

    const projectPolygon = (poly) => {
      ctx.beginPath();
      poly.forEach((ring) => {
        ringPath(ctx, ring, -1);
        ringPath(ctx, ring, 0);
        ringPath(ctx, ring, 1);
      });
      ctx.fill('evenodd');
    };

    const drawGeom = (g) => {
      if (!g) return;
      if (g.type === 'Polygon') projectPolygon(g.coordinates);
      else if (g.type === 'MultiPolygon') g.coordinates.forEach(projectPolygon);
    };

    // Land fill: polar snow, warm desert bands, and greener temperate zones.
    const landGradient = ctx.createLinearGradient(0, 0, 0, TEX_H);
    landGradient.addColorStop(0, '#f3f6f2');
    landGradient.addColorStop(0.12, '#d9e6da');
    landGradient.addColorStop(0.22, '#c9a96a');
    landGradient.addColorStop(0.34, '#3f9b70');
    landGradient.addColorStop(0.5, '#68b878');
    landGradient.addColorStop(0.66, '#3f9b70');
    landGradient.addColorStop(0.78, '#c9a96a');
    landGradient.addColorStop(0.88, '#d9e6da');
    landGradient.addColorStop(1, '#f3f6f2');
    ctx.fillStyle = landGradient;
    ctx.strokeStyle = '#bdebdc';
    ctx.lineWidth = 1;
    geom.forEach((f) => drawGeom(f.geometry ? f.geometry : f));

    const mountainRanges = [
      [[-78, 8], [-76, -5], [-72, -18], [-70, -32], [-68, -48]],
      [[-125, 48], [-118, 42], [-112, 36], [-106, 32]],
      [[-6, 37], [4, 43], [12, 46], [20, 47], [28, 46]],
      [[35, 37], [52, 34], [68, 31], [82, 30], [96, 28]],
      [[-10, 32], [-2, 34], [8, 35], [18, 34]],
      [[145, -17], [148, -25], [151, -33], [147, -39]]
    ];
    const projectPoint = ([lon, lat], shift = 0) => new THREE.Vector2(
      ((lon + 180) / 360) * TEX_W + shift * TEX_W,
      ((90 - lat) / 180) * TEX_H
    );
    ctx.save();
    ctx.beginPath();
    geom.forEach((f) => {
      const g = f.geometry ? f.geometry : f;
      if (!g) return;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      polys.forEach((poly) => poly.forEach((ring) => ringPath(ctx, ring, 0)));
    });
    ctx.clip('evenodd');
    ctx.strokeStyle = 'rgba(70, 92, 76, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    mountainRanges.forEach((range) => {
      for (const shift of [-1, 0, 1]) {
        ctx.beginPath();
        range.forEach((point, index) => {
          const projected = projectPoint(point, shift);
          if (index === 0) ctx.moveTo(projected.x, projected.y);
          else ctx.lineTo(projected.x, projected.y);
        });
        ctx.stroke();
      }
    });
    ctx.restore();

    // Outline pass (so coastlines read crisply). Uses the same unwrap +
    // triple-shift projection as the fill pass above, otherwise the seam
    // crossing would still draw one long incorrect line across the texture
    // even after the fill itself was fixed.
    ctx.strokeStyle = '#9ce8d2';
    ctx.lineWidth = 1.2;
    geom.forEach((f) => {
      const g = f.geometry ? f.geometry : f;
      if (!g) return;
      const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      polys.forEach((poly) => {
        poly.forEach((ring) => {
          for (const shift of [-1, 0, 1]) {
            ctx.beginPath();
            ringPath(ctx, ring, shift);
            ctx.stroke();
          }
        });
      });
    });


    const tex = new THREE.CanvasTexture(c);
    // r152+ uses colorSpace; earlier three.js (incl. the r128 build this app loads) uses encoding.
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace;
    else if ('encoding' in tex) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function bindEvents() {
    const dom = renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevX = e.clientX; prevY = e.clientY;
      dom.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', () => {
      if (isDragging) { isDragging = false; dom.style.cursor = 'grab'; }
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX; prevY = e.clientY;
      targetYaw += dx * 0.005;
      targetPitch -= dy * 0.005;
      targetPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, targetPitch));
    });

    // Wheel zoom
    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      targetCamDist += e.deltaY * 0.002;
      targetCamDist = Math.max(MIN_DIST, Math.min(MAX_DIST, targetCamDist));
    }, { passive: false });

    // Click + hover (use pointer events so it works on touch)
    dom.addEventListener('pointermove', onPointerMove);
    dom.addEventListener('click', onClick);

    // Touch
    let lastTouchDist = 0;
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && isDragging) {
        const t = e.touches[0];
        const dx = t.clientX - prevX;
        const dy = t.clientY - prevY;
        prevX = t.clientX; prevY = t.clientY;
        targetYaw += dx * 0.005;
        targetPitch -= dy * 0.005;
        targetPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, targetPitch));
      } else if (e.touches.length === 2) {
        const d = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastTouchDist) {
          targetCamDist += (lastTouchDist - d) * 0.005;
          targetCamDist = Math.max(MIN_DIST, Math.min(MAX_DIST, targetCamDist));
        }
        lastTouchDist = d;
      }
    }, { passive: true });
    dom.addEventListener('touchend', () => { isDragging = false; lastTouchDist = 0; });

    // Resize
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(onResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', onResize);
    }
  }

  function onResize() {
    if (!container || !renderer) return;
    width = container.clientWidth;
    height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function onPointerMove(e) {
    if (isDragging) return; // hover only when not dragging
    updateMouse(e);
    const hit = pickPin();
    if (hit) {
      renderer.domElement.style.cursor = 'pointer';
      if (hoverCallback) hoverCallback(hit.userData.event);
    } else {
      renderer.domElement.style.cursor = 'grab';
      if (hoverCallback) hoverCallback(null);
    }
  }

  function onClick(e) {
    if (wasDragClick(e)) return; // suppress click after drag
    updateMouse(e);
    const hit = pickPin();
    if (hit && clickCallback) clickCallback(hit.userData.event);
  }

  let dragStartX = 0, dragStartY = 0, dragMoved = 0;
  // Re-bind to track drag distance: override mousedown
  // (kept simple — use a separate flag set in pointerdown)
  // Note: we patch by storing drag start on first move after mousedown.
  // Simpler: track any move while dragging and ignore click if total > threshold.
  // Done below via dragMoved accumulator patched into the existing handler:

  function wasDragClick(e) {
    // approx: if mouse moved more than ~5px between down and up, treat as drag.
    // Track via lightweight start position captured on pointerdown.
    return dragClickFlag;
  }

  // Patch: hook pointerdown to set dragClickFlag false, then flip if movement >= 5px
  // We piggyback on the existing mousedown listener area.
  // To avoid restructuring, we add a dedicated pointerdown listener:
  // (registered in bindEvents below — kept inline here for proximity to logic)
  // Implementation note: actual pointerdown is added in bindEvents().

  function updateMouse(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pickPin() {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pinGroup.children, true);
    if (!hits.length) return null;
    // walk up to pin root
    let n = hits[0].object;
    while (n && !n.userData.event) n = n.parent;
    return n || null;
  }

  // ===== Labels (country + continent) =====
  function buildLabels() {
    labelData = [];
    if (!labelSrc) labelSrc = window.DPH_DATA;
    if (!labelSrc) return;
    return; // text-on-earth disabled

    const countries = labelSrc.COUNTRY_LABELS || [];
    const continents = labelSrc.CONTINENT_LABELS || [];

    countries.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'globe-label country';
      el.textContent = c.country;
      labelLayer.appendChild(el);
      labelData.push({ name: c.country, lat: c.lat, lon: c.lon, kind: 'country', el });
    });

    continents.forEach((c) => {
      const el = document.createElement('div');
      el.className = 'globe-label continent';
      el.textContent = c.continent;
      labelLayer.appendChild(el);
      labelData.push({ name: c.continent, lat: c.lat, lon: c.lon, kind: 'continent', el });
    });
  }

  // Project world position to screen pixel coords; returns null if behind globe.
  const _projV = new THREE.Vector3();
  function projectToScreen(worldPos) {
    _projV.copy(worldPos).project(camera);
    if (_projV.z > 1) return null; // behind near plane (cull back hemisphere)
    const x = (_projV.x * 0.5 + 0.5) * width;
    const y = (-_projV.y * 0.5 + 0.5) * height;
    return { x, y };
  }

  function updateLabels() {
    if (!labelLayer || !labelData.length) return;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir); // points from camera into scene
    for (let i = 0; i < labelData.length; i++) {
      const L = labelData[i];
      // Place label slightly above the surface so it floats over markers.
      const r = (L.kind === 'continent') ? RADIUS * 1.02 : RADIUS * 1.005;
      const worldPos = latLonToVec3(L.lat, L.lon, r);
      // Transform into world space (label layer is in screen coords, but worldPos is in local group space).
      worldPos.applyMatrix4(group.matrixWorld);
      // Cull if point is on the far side of the globe relative to camera.
      const camToPoint = worldPos.clone().sub(camera.position).normalize();
      const dot = camToPoint.dot(camDir); // > 0 means in front
      if (dot <= 0.05) {
        if (L.el.style.display !== 'none') L.el.style.display = 'none';
        continue;
      }
      const screen = projectToScreen(worldPos);
      if (!screen) {
        if (L.el.style.display !== 'none') L.el.style.display = 'none';
        continue;
      }
      if (L.el.style.display === 'none') L.el.style.display = '';
      // Fade with edge proximity (anti-pop on horizon)
      const edgeFade = Math.min(1, (dot - 0.05) / 0.35);
      L.el.style.opacity = edgeFade.toFixed(3);
      L.el.style.transform = `translate(-50%, -50%) translate(${screen.x}px, ${screen.y}px)`;
    }
  }

  function setMarkers(events, defColor, activeId) {
    defaultColor = defColor || '#00E5FF';
    activeEventId = activeId || null;

    // clear — each pin is a Group (stem mesh + tip mesh + halo sprite), so
    // walk its children to actually free geometries/materials/textures
    // instead of only checking the (empty) top-level Group.
    while (pinGroup.children.length) {
      const pin = pinGroup.children.pop();
      pin.traverse((obj) => {
        if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
        if (obj.material) {
          if (obj.material.map && obj.material.map.dispose) obj.material.map.dispose();
          if (obj.material.dispose) obj.material.dispose();
        }
      });
    }
    pinMap.clear();

    events.forEach((ev) => {
      const pin = makePin(ev);
      pinGroup.add(pin);
      pinMap.set(ev.id, pin);
    });
  }

  function makePin(ev) {
    const isActive = activeEventId && ev.id === activeEventId;
    const color = isActive ? '#FF2E9A' : (ev.color || defaultColor);
    const grp = new THREE.Group();
    grp.userData.event = ev;

    const pos = latLonToVec3(ev.lat, ev.lon, RADIUS);
    grp.position.copy(pos);

    // Orient pin so its +Z axis points outward from globe center
    grp.lookAt(pos.clone().multiplyScalar(2));

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.12, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.z = 0.06;
    grp.add(stem);

    // Tip (cone)
    const tipGeo = new THREE.ConeGeometry(0.018, 0.05, 12);
    const tipMat = new THREE.MeshBasicMaterial({ color });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.z = 0.14;
    tip.rotation.x = Math.PI / 2;
    grp.add(tip);

    // Pulsing ring (sprite halo)
    const ringMat = new THREE.SpriteMaterial({
      map: makePinHaloTexture(color),
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const ring = new THREE.Sprite(ringMat);
    ring.scale.set(0.12, 0.12, 1);
    ring.position.z = 0.02;
    grp.add(ring);
    grp.userData.ring = ring;

    return grp;
  }

  function makePinHaloTexture(hex) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);
    ctx.strokeStyle = hex;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(32, 32, 22, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(32, 32, 14, 0, Math.PI * 2); ctx.stroke();
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  function focusEvent(ev) {
    if (!ev) return;
    // Animate yaw/pitch so ev.lat/lon faces the camera.
    const targetLat = ev.lat * (Math.PI / 180);
    const targetLon = ev.lon * (Math.PI / 180);
    // camera sits at +Z looking at origin; rotate globe so point is at front.
    // latLonToVec3 places lon=0 at (+R,0,0), i.e. 90° away from the camera's
    // +Z facing axis, so the yaw needs an extra -90° (-PI/2) offset to bring
    // the target point to face the camera.
    targetYaw = -targetLon - Math.PI / 2;
    targetPitch = targetLat;
    targetCamDist = Math.max(MIN_DIST, Math.min(MAX_DIST, 2.0));
  }

  function resetView() {
    targetYaw = 0;
    targetPitch = 0;
    targetCamDist = DEFAULT_DIST;
  }

  function startSpin() {
    autoRotate = true;
  }

  function stopSpin() {
    autoRotate = false;
  }

  function toggleAutoRotate() {
    autoRotate = !autoRotate;
    return autoRotate;
  }

  function zoomBy(delta) {
    // Mirrors prior contract: -0.4 = zoom in, +0.4 = zoom out.
    targetCamDist += Math.sign(delta) * 0.4;
    targetCamDist = Math.max(MIN_DIST, Math.min(MAX_DIST, targetCamDist));
  }

  function onClickCallback(fn) { clickCallback = fn; }
  function onHover(fn) { hoverCallback = fn; }

  function getCoords() {
    // No true lat/lon without orientation readback; return best-effort.
    // Derive from current yaw/pitch assuming focusEvent convention.
    const lat = THREE.MathUtils.radToDeg(targetPitch);
    let lon = THREE.MathUtils.radToDeg(-targetYaw - Math.PI / 2);
    // Normalize lon to [-180, 180]
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    return { lat, lon, alt: camDist };
  }

  // ===== Frame loop =====
  let dragClickFlag = false;
  function animate() {
    animationId = requestAnimationFrame(animate);

    if (autoRotate && !isDragging) {
      targetYaw -= spinSpeed * 10; // gentle spin
    }

    // Damping
    yaw += (targetYaw - yaw) * 0.12;
    pitch += (targetPitch - pitch) * 0.12;
    camDist += (targetCamDist - camDist) * 0.12;

    group.rotation.y = yaw;
    group.rotation.x = pitch;

    camera.position.set(0, 0, camDist);
    camera.lookAt(0, 0, 0);

    // Pulse rings
    const t = performance.now() * 0.003;
    pinMap.forEach((pin) => {
      const ring = pin.userData.ring;
      if (!ring) return;
      const s = 0.10 + 0.04 * (0.5 + 0.5 * Math.sin(t + pin.id));
      ring.scale.set(s, s, 1);
      ring.material.opacity = 0.55 + 0.35 * Math.sin(t + pin.id);
    });

    renderer.render(scene, camera);
    updateLabels();
  }

  // ===== Drag-vs-click tracking =====
  // Wire pointerdown to capture start; pointerup checks distance.
  (function attachDragTracker() {
    // executed once init() runs — bindEvents is called there; we hook here
    // by overriding after the renderer exists. We expose via a tiny poll:
    const tryAttach = () => {
      if (!renderer) { requestAnimationFrame(tryAttach); return; }
      const dom = renderer.domElement;
      dom.addEventListener('pointerdown', (e) => {
        dragStartX = e.clientX; dragStartY = e.clientY;
        dragMoved = 0;
        dragClickFlag = false;
      });
      dom.addEventListener('pointermove', (e) => {
        if (e.buttons) {
          dragMoved += Math.hypot(e.movementX || 0, e.movementY || 0);
          if (dragMoved > 5) dragClickFlag = true;
        }
      });
    };
    tryAttach();
  })();

  return {
    init,
    setMarkers,
    focusEvent,
    resetView,
    toggleAutoRotate,
    zoomBy,
    onClickCallback,
    onHover,
    getCoords
  };
})();