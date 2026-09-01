/* === Disaster Prep Hub — Hazard Animations (v2 — Particle Systems) === */
window.DPH_ANIM = (function(){
  const canvases = {};
  const animStates = {};
  const particles = []; // global pool

  function getCtx(id){
    if(canvases[id] && canvases[id].canvas){
      const c = document.getElementById(id);
      if(c === canvases[id].canvas) return canvases[id];
    }
    const canvas = document.getElementById(id);
    if(!canvas) return null;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio,2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    canvases[id] = {canvas, ctx, w: canvas.clientWidth, h: canvas.clientHeight};
    return canvases[id];
  }

  // Build a state object for a given hazard (used by both main + mini anims)
  function buildState(hazardId, intensity){
    const state = {
      hazardId, intensity: intensity||60,
      playing:true, step:0,
      raf:null, t:0, dt:16,
      particles: [],
      bgParticles: [],
      mini: false
    };
    if(POOL_INIT[hazardId]) POOL_INIT[hazardId](state);
    return state;
  }

  function start(hazardId, opts){
    stop(hazardId);
    const state = buildState(hazardId, opts.intensity);
    animStates[hazardId] = state;
    loop(state, 'animCanvas');
  }

  function stop(hazardId){
    if(animStates[hazardId]){
      cancelAnimationFrame(animStates[hazardId].raf);
      delete animStates[hazardId];
    }
  }

  function setIntensity(hazardId, val){
    if(animStates[hazardId]) animStates[hazardId].intensity = val;
  }
  function setPlaying(hazardId, playing){
    if(animStates[hazardId]) animStates[hazardId].playing = playing;
  }
  function stepOnce(hazardId){
    if(animStates[hazardId]) animStates[hazardId].step += 1;
  }

  // Mini animation: multiple cards can run the same hazard independently,
  // keyed by their canvas id instead of hazard id.
  const miniStates = {};
  function startMini(canvasId, hazardId){
    if(!RENDERERS[hazardId]) return;
    stopMini(canvasId);
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const state = buildState(hazardId, 50);
    state.mini = true;
    miniStates[canvasId] = state;
    loop(state, canvasId);
  }
  function stopMini(canvasId){
    if(miniStates[canvasId]){
      cancelAnimationFrame(miniStates[canvasId].raf);
      delete miniStates[canvasId];
    }
  }
  function stopAllMini(){
    Object.keys(miniStates).forEach(stopMini);
  }

  function loop(state, canvasId){
    const fn = RENDERERS[state.hazardId];
    if(!fn) return;
    const data = getCtx(canvasId);
    if(!data) return;
    state.raf = requestAnimationFrame(()=>loop(state, canvasId));
    if(!state.playing) return;
    state.t += state.dt * (state.speedMult || 1);
    fn(data.ctx, data.w, data.h, state);
  }

  // === Particle utilities ===
  function spawnParticle(state, opts){
    state.particles.push({
      x: opts.x, y: opts.y,
      vx: opts.vx||0, vy: opts.vy||0,
      life: opts.life||60, maxLife: opts.life||60,
      color: opts.color||'#fff',
      size: opts.size||2,
      type: opts.type||'circle',
      gravity: opts.gravity||0,
      fade: opts.fade!==undefined?opts.fade:true,
      rot: opts.rot||0, rotV: opts.rotV||0,
      data: opts.data||{}
    });
  }

  function updateParticles(state, w, h){
    for(let i=state.particles.length-1;i>=0;i--){
      const p = state.particles[i];
      p.x += p.vx || 0;
      p.y += p.vy || 0;
      p.vy = (p.vy || 0) + (p.gravity || 0);
      p.rot = (p.rot || 0) + (p.rotV || 0);
      if(p.keep){
        // Persistent particles (e.g. typhoon/hurricane/tornado spiral pools)
        // manage their own x/y via angle+radius in the renderer and should
        // never expire from a life countdown or get culled as out-of-bounds.
        continue;
      }
      p.life -= 1;
      const oob = p.x<-20 || p.x>w+20 || p.y<-20 || p.y>h+20;
      if(p.life<=0 || oob){
        state.particles.splice(i,1);
      }
    }
  }

  function drawParticles(ctx, state){
    state.particles.forEach(p=>{
      const alpha = p.fade ? (p.life/p.maxLife) : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if(p.type==='square'){
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
        ctx.restore();
      } else if(p.type==='ember'){
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        // glow
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size*2, 0, Math.PI*2);
        ctx.fill();
      } else if(p.type==='line'){
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx*3, p.y - p.vy*3);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  // === Pool init per hazard ===
  const POOL_INIT = {
    earthquake(s){
      s.bgParticles = Array.from({length:30}, ()=>({x:Math.random()*400, y:Math.random()*220, size:Math.random()*2, life:Math.random()*100}));
    },
    tsunami(s){},
    typhoon(s){
      // Pre-populate spiral particles
      for(let i=0;i<150;i++){
        s.particles.push({
          x:200, y:110,
          vx:0, vy:0, gravity:0, rotV:0, keep:true,
          angle: (i/150)*Math.PI*4,
          radius: 20 + (i/150)*100,
          vAngle: 0.04,
          life:9999, maxLife:9999,
          color:'#FFB300',
          size: 1.5 + Math.random()*2
        });
      }
    },
    fire(s){
      s.particles = [];
    },
    hurricane(s){
      for(let i=0;i<200;i++){
        s.particles.push({
          x:200, y:110,
          vx:0, vy:0, gravity:0, rotV:0, keep:true,
          angle: Math.random()*Math.PI*2,
          radius: 20 + Math.random()*100,
          vAngle: 0.03,
          life:9999, maxLife:9999,
          color: Math.random()>0.5?'#C77DFF':'#fff',
          size: 1 + Math.random()*2
        });
      }
    },
    flashflood(s){},
    volcano(s){},
    lightning(s){},
    tornado(s){
      for(let i=0;i<100;i++){
        const t = i/100;
        s.particles.push({
          x:200, y:200,
          vx:0, vy:0, gravity:0, rotV:0, keep:true,
          vAngle: Math.random()*Math.PI*2,
          angle: Math.random()*Math.PI*2,
          radius: 30 + Math.random()*60,
          vRadius: -0.2,
          life:9999, maxLife:9999,
          color: Math.random()>0.5?'#7209B7':'#9D4EDD',
          size: 1 + Math.random()*2
        });
      }
    },
    nuclear(s){
      s.ringPhases = [0, 1, 2];
    },
    chemical(s){},
    landslide(s){},
    heatwave(s){},
    drought(s){}
  };

  // === Renderers (particle-based) ===
  const RENDERERS = {
    earthquake(ctx, w, h, s){
      const cx = w/2, cy = h*0.6;
      const intensity = s.intensity/100;

      // Sky/ground gradient
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#1a0a14');
      grad.addColorStop(1, '#3a1a14');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Ground shake (entire scene vibrates with intensity)
      const shake = intensity * (1+s.step) * 2;
      ctx.save();
      ctx.translate(Math.sin(s.t*0.05)*shake, Math.cos(s.t*0.07)*shake*0.5);

      // Mountains background
      ctx.fillStyle = '#0a0510';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w*0.3, h*0.5);
      ctx.lineTo(w*0.5, h*0.4);
      ctx.lineTo(w*0.7, h*0.55);
      ctx.lineTo(w, h*0.45);
      ctx.lineTo(w, h);
      ctx.fill();

      // Fault line glow
      ctx.shadowColor = '#FF4757';
      ctx.shadowBlur = 20 * intensity;
      ctx.strokeStyle = '#FF4757';
      ctx.lineWidth = 4 + intensity*3;
      ctx.beginPath();
      for(let x=0;x<=w;x+=2){
        const y = cy + Math.sin(x*0.04 + s.t*0.015) * (12 + s.step*6 + intensity*8);
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Spawn seismic wave particles
      if(s.t % 2 === 0){
        spawnParticle(s, {
          x: cx, y: cy, vx:(Math.random()-0.5)*3, vy:-1-Math.random()*2,
          life:80, color:'#FF4757', size:2+Math.random()*2, type:'ember'
        });
      }

      // Expanding seismic rings
      const rings = 3 + s.step;
      for(let i=0;i<rings;i++){
        const r = ((s.t*0.06 + i*50) % (w*0.6));
        ctx.strokeStyle = `rgba(255,71,87,${(1-r/(w*0.6))*intensity})`;
        ctx.lineWidth = 2 + i*0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.stroke();
      }

      // Epicenter flash
      const flash = 0.6 + Math.sin(s.t*0.025)*0.4;
      ctx.fillStyle = `rgba(255,200,100,${flash*intensity})`;
      ctx.shadowColor = '#FF4757';
      ctx.shadowBlur = 30*intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 + flash*8, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      updateParticles(s, w, h);
      drawParticles(ctx, s);
      ctx.restore();

      drawSteps(ctx, w, h, s.step, 4, ['Tremor','Rupture','Aftershocks','Recovery']);
    },

    tsunami(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#001830');
      grad.addColorStop(1, '#002a40');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Horizon city silhouette (generated once, cached — regenerating every
      // frame made the skyline flicker/reshuffle constantly)
      if(!s.city){
        s.city = [];
        let bx = 0;
        while(bx < w){
          const bw = 15 + Math.random()*30;
          const bh = 20 + Math.random()*40;
          s.city.push({bx, bw, bh});
          bx += bw;
        }
      }
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.moveTo(0, h*0.5);
      s.city.forEach(b=>{
        ctx.lineTo(b.bx, h*0.5 - b.bh);
        ctx.lineTo(b.bx + b.bw, h*0.5 - b.bh);
      });
      ctx.lineTo(w, h*0.5);
      ctx.fill();

      // Beach / ground
      ctx.fillStyle = '#3a2818';
      ctx.fillRect(0, h*0.5, w, h*0.5);

      // Wave
      const waveH = 80 + intensity*100 + s.step*20;
      const yOff = h - waveH - Math.sin(s.t*0.003)*10;
      ctx.fillStyle = `rgba(0,150,200,${0.7*intensity})`;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for(let x=0;x<=w;x+=3){
        const y = Math.sin(x*0.025 + s.t*0.008) * 20 + yOff;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // Foam
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let x=0;x<=w;x+=3){
        const y = Math.sin(x*0.025 + s.t*0.008) * 20 + yOff;
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();

      // Spawn debris particles
      if(Math.random()<0.3){
        spawnParticle(s, {
          x: Math.random()*w, y: yOff + 10,
          vx: -2 + Math.random()*4, vy: -0.5,
          life: 120, color: '#FFB300', size: 3+Math.random()*4, type:'square',
          gravity: 0.05, rot: Math.random()*Math.PI, rotV:(Math.random()-0.5)*0.1
        });
      }

      // Water droplets
      if(Math.random()<0.5){
        spawnParticle(s, {
          x: Math.random()*w, y: yOff - 5,
          vx:(Math.random()-0.5)*2, vy:-2-Math.random()*3,
          life:60, color:'#aaf', size:1+Math.random()*2
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Receding','Wave Forms','Impact','Series Continue']);
    },

    typhoon(ctx, w, h, s){
      const cx = w/2, cy = h/2;
      const intensity = s.intensity/100;
      // Dark sky
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w*0.6);
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#0a0a18');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Ocean horizon
      ctx.fillStyle = '#001a30';
      ctx.fillRect(0, h*0.7, w, h*0.3);

      // Update spiral particles
      s.particles.forEach(p=>{
        p.angle += p.vAngle * intensity;
        p.radius += 0.1;
        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius * 0.7;
        if(p.radius > w*0.5) p.radius = 10;
      });

      // Draw spiral
      s.particles.forEach(p=>{
        const alpha = 1 - p.radius / (w*0.5);
        ctx.fillStyle = `rgba(255,179,0,${alpha*intensity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      });

      // Spawn wind streaks
      if(Math.random()<0.4){
        const angle = Math.random()*Math.PI*2;
        const r = 50 + Math.random()*100;
        spawnParticle(s, {
          x: cx + Math.cos(angle)*r, y: cy + Math.sin(angle)*r,
          vx: Math.cos(angle+Math.PI/2)*8, vy: Math.sin(angle+Math.PI/2)*8,
          life: 30, color: '#fff', size: 1, type:'line'
        });
      }

      // Eye
      ctx.fillStyle = `rgba(255,255,255,${0.8*intensity})`;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 10 + Math.sin(s.t*0.01)*3, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Forming','Intensifying','Landfall','Dissipation']);
    },

    fire(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#2a1008');
      grad.addColorStop(1, '#5a2010');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Ground
      ctx.fillStyle = '#1a0a05';
      ctx.fillRect(0, h*0.75, w, h*0.25);

      // Trees (silhouettes)
      for(let i=0;i<5;i++){
        const x = (w/5)*i + 30;
        const treeH = 30 + (i%2)*15;
        ctx.fillStyle = '#000';
        ctx.fillRect(x, h*0.75 - treeH, 4, treeH);
        // foliage
        ctx.beginPath();
        ctx.arc(x+2, h*0.75 - treeH, 15, 0, Math.PI*2);
        ctx.fill();
      }

      // Spawn flame particles
      const flames = Math.floor(intensity*4);
      for(let i=0;i<flames;i++){
        if(Math.random()<0.5){
          spawnParticle(s, {
            x: 50 + Math.random()*(w-100),
            y: h*0.75,
            vx: (Math.random()-0.5)*1.5,
            vy: -1 - Math.random()*3,
            life: 40 + Math.random()*30,
            color: `hsl(${20+Math.random()*20}, 100%, ${50+Math.random()*20}%)`,
            size: 4 + Math.random()*6,
            type: 'ember',
            rot: Math.random()*Math.PI, rotV:(Math.random()-0.5)*0.05
          });
        }
      }

      // Spawn embers (floating sparks)
      for(let i=0;i<Math.floor(intensity*2);i++){
        if(Math.random()<0.3){
          spawnParticle(s, {
            x: Math.random()*w, y: Math.random()*h*0.6,
            vx:(Math.random()-0.5)*0.5, vy:-0.5-Math.random(),
            life:80, color:'#FFD60A', size:1+Math.random(),
            type:'ember'
          });
        }
      }

      // Smog overlay
      ctx.fillStyle = `rgba(80,40,20,${0.2*intensity})`;
      ctx.fillRect(0, 0, w, h);

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Ignition','Spread','Crown Fire','Containment']);
    },

    hurricane(ctx, w, h, s){
      const cx = w/2, cy = h/2;
      const intensity = s.intensity/100;
      // Sky
      ctx.fillStyle = '#0a0518';
      ctx.fillRect(0,0,w,h);

      // Update spiral
      s.particles.forEach(p=>{
        p.angle += p.vAngle;
        p.radius += 0.08;
        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius;
        if(p.radius > w*0.5) p.radius = 15;
      });

      // Draw spiral with gradient color
      s.particles.forEach(p=>{
        const alpha = (1 - p.radius/(w*0.5)) * intensity;
        ctx.fillStyle = p.color === '#fff' ? `rgba(255,255,255,${alpha})` : `rgba(199,125,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      });

      // Eye wall
      ctx.strokeStyle = `rgba(255,255,255,${0.7*intensity})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI*2);
      ctx.stroke();

      // Eye
      ctx.fillStyle = `rgba(100,50,150,${0.5*intensity})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI*2);
      ctx.fill();

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Tropical','Strengthen','Category Peak','Weakening']);
    },

    flashflood(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Dark sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#1a2030');
      grad.addColorStop(1, '#0a1020');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Rain particles
      if(Math.random()<0.8){
        for(let i=0;i<3;i++){
          spawnParticle(s, {
            x: Math.random()*w, y: -10,
            vx:-0.5, vy:8+Math.random()*4,
            life:30, color:`rgba(200,220,255,${0.4+Math.random()*0.4})`, size:1, type:'line', fade:true
          });
        }
      }

      // Houses
      ctx.fillStyle = '#1a0a08';
      ctx.fillRect(50, h*0.55, 60, h*0.3);
      ctx.fillRect(200, h*0.5, 50, h*0.35);
      ctx.beginPath();
      ctx.moveTo(50, h*0.55); ctx.lineTo(80, h*0.45); ctx.lineTo(110, h*0.55); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(200, h*0.5); ctx.lineTo(225, h*0.42); ctx.lineTo(250, h*0.5); ctx.fill();

      // Water level rising
      const level = h*0.5 + intensity*h*0.25 + s.step*20;
      const grad2 = ctx.createLinearGradient(0, level, 0, h);
      grad2.addColorStop(0, `rgba(0,180,216,${0.85*intensity})`);
      grad2.addColorStop(1, `rgba(0,30,60,${0.95*intensity})`);
      ctx.fillStyle = grad2;
      ctx.fillRect(0, level, w, h-level);

      // Water ripples
      ctx.strokeStyle = `rgba(255,255,255,${0.3*intensity})`;
      ctx.lineWidth = 1;
      for(let i=0;i<5;i++){
        const y = level + 4 + i*8;
        ctx.beginPath();
        for(let x=0;x<w;x+=3){
          const yy = y + Math.sin(x*0.05 + s.t*0.01)*2;
          if(x===0) ctx.moveTo(x,yy); else ctx.lineTo(x,yy);
        }
        ctx.stroke();
      }

      // Floating debris particles
      if(Math.random()<0.4){
        spawnParticle(s, {
          x: Math.random()*w, y: level + 5,
          vx: 1+Math.random(), vy: (Math.random()-0.5)*0.5,
          life: 100, color: '#FFB300', size: 5+Math.random()*3, type:'square'
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Rain','Rising','Crest']);
    },

    volcano(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#1a0a14');
      grad.addColorStop(1, '#2a0a08');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Mountain
      ctx.fillStyle = '#2a1810';
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w*0.45, h*0.55);
      ctx.lineTo(w*0.5, h*0.5);
      ctx.lineTo(w*0.55, h*0.55);
      ctx.lineTo(w, h);
      ctx.fill();

      const cx = w*0.5, cy = h*0.5;

      // Eruption column
      const colH = 80 + intensity*160 + s.step*30;
      const gradCol = ctx.createLinearGradient(0, cy, 0, cy-colH);
      gradCol.addColorStop(0, `rgba(255,46,154,${intensity})`);
      gradCol.addColorStop(1, 'rgba(60,30,40,0)');
      ctx.fillStyle = gradCol;
      ctx.beginPath();
      ctx.moveTo(cx-12, cy);
      ctx.quadraticCurveTo(cx-18, cy-colH/2, cx-25, cy-colH);
      ctx.lineTo(cx+25, cy-colH);
      ctx.quadraticCurveTo(cx+18, cy-colH/2, cx+12, cy);
      ctx.fill();

      // Spawn lava particles
      if(Math.random()<0.7){
        spawnParticle(s, {
          x: cx + (Math.random()-0.5)*20,
          y: cy - 5,
          vx: (Math.random()-0.5)*3, vy: -2 - Math.random()*3,
          life: 60+Math.random()*40,
          color: `hsl(${10+Math.random()*15}, 100%, ${40+Math.random()*30}%)`,
          size: 2+Math.random()*3, type:'ember',
          gravity: 0.05
        });
      }

      // Ash particles
      if(Math.random()<0.4){
        spawnParticle(s, {
          x: cx + (Math.random()-0.5)*30,
          y: cy - 10,
          vx: (Math.random()-0.5)*2, vy: -1 - Math.random()*2,
          life: 80, color: '#4a3a30', size: 1+Math.random()*2,
          gravity: 0.02
        });
      }

      // Lava flow down slope
      ctx.fillStyle = `rgba(255,100,0,${0.85*intensity})`;
      ctx.beginPath();
      ctx.moveTo(cx-10, cy);
      ctx.quadraticCurveTo(cx-40, cy+40, cx-70, h);
      ctx.lineTo(cx-15, h);
      ctx.quadraticCurveTo(cx-5, cy+30, cx+10, cy);
      ctx.fill();
      // Glow
      ctx.shadowColor = '#FF6B00';
      ctx.shadowBlur = 15*intensity;
      ctx.fill();
      ctx.shadowBlur = 0;

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Magma Up','Eruption','Pyroclastic','Cooling']);
    },

    lightning(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Storm sky
      ctx.fillStyle = '#0a0a18';
      ctx.fillRect(0,0,w,h);

      // Storm clouds
      for(let i=0;i<8;i++){
        const x = 30 + i*(w-60)/7;
        const y = 30 + Math.sin(s.t*0.003+i*2)*8;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 35);
        grad.addColorStop(0, `rgba(60,40,80,${0.6*intensity})`);
        grad.addColorStop(1, 'rgba(60,40,80,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 35, 0, Math.PI*2);
        ctx.fill();
      }

      // Lightning bolt at random
      const flashRate = 0.05 + intensity*0.15;
      if(Math.random() < flashRate){
        const sx = Math.random()*w;
        const ex = sx + (Math.random()-0.5)*60;
        ctx.strokeStyle = '#FFD60A';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#FFD60A';
        ctx.shadowBlur = 30*intensity;
        ctx.beginPath();
        ctx.moveTo(sx, 30);
        const segs = 10;
        for(let i=1;i<=segs;i++){
          const x = sx + (ex-sx)*(i/segs) + (Math.random()-0.5)*30;
          const y = 30 + (h-40)*(i/segs);
          ctx.lineTo(x,y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Spawn bright particles at strike
        for(let i=0;i<10;i++){
          spawnParticle(s, {
            x: ex, y: h-40,
            vx: (Math.random()-0.5)*4, vy: (Math.random()-0.5)*4,
            life: 30, color: '#FFD60A', size: 2, type:'ember'
          });
        }
      }

      // Ground
      ctx.fillStyle = '#1a0a05';
      ctx.fillRect(0, h*0.85, w, h*0.15);

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Build-up','Strike','Aftermath']);
    },

    tornado(ctx, w, h, s){
      const cx = w/2, cy = h*0.85;
      const intensity = s.intensity/100;
      // Sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#1a0a2a');
      grad.addColorStop(1, '#3a1a2a');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Ground
      ctx.fillStyle = '#2a1810';
      ctx.fillRect(0, h*0.85, w, h*0.15);

      // Update funnel particles
      s.particles.forEach(p=>{
        p.angle += p.vAngle;
        p.radius += p.vRadius * intensity;
        p.x = cx + Math.cos(p.angle) * p.radius;
        p.y = cy + Math.sin(p.angle) * p.radius * 0.3 - p.radius * 0.3;
        if(p.radius < 5) p.radius = 80;
        if(p.radius > 100) p.radius = 5;
      });

      // Draw funnel
      s.particles.forEach(p=>{
        const t = p.radius / 100;
        const alpha = t * intensity;
        ctx.fillStyle = `rgba(114,9,183,${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
      });

      // Funnel outline (cone shape)
      ctx.strokeStyle = `rgba(157,78,221,${0.5*intensity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let i=0;i<=20;i++){
        const t = i/20;
        const r = (40 - t*30) * intensity;
        const y = cy - t*h*0.5;
        if(i===0) ctx.moveTo(cx+r, y); else ctx.lineTo(cx+r, y);
      }
      for(let i=20;i>=0;i--){
        const t = i/20;
        const r = (40 - t*30) * intensity;
        const y = cy - t*h*0.5;
        ctx.lineTo(cx-r, y);
      }
      ctx.closePath();
      ctx.stroke();

      // Debris
      if(Math.random()<0.5){
        spawnParticle(s, {
          x: cx + (Math.random()-0.5)*60,
          y: h*0.7 + Math.random()*30,
          vx: (Math.random()-0.5)*8, vy: -2 - Math.random()*4,
          life: 40, color: '#A0522D', size: 2+Math.random()*2, type:'square',
          gravity: 0.15, rot:Math.random()*Math.PI, rotV:(Math.random()-0.5)*0.2
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Touchdown','Peak','Dissipate']);
    },

    nuclear(ctx, w, h, s){
      const intensity = s.intensity/100;
      const cx = w/2, cy = h/2;
      // Dark
      ctx.fillStyle = '#0a1a0a';
      ctx.fillRect(0,0,w,h);

      // Ground glow
      const grad = ctx.createRadialGradient(cx, h*0.7, 0, cx, h*0.7, w*0.5);
      grad.addColorStop(0, `rgba(57,255,20,${0.3*intensity})`);
      grad.addColorStop(1, 'rgba(57,255,20,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, h*0.5, w, h*0.5);

      // Mushroom cloud
      ctx.fillStyle = `rgba(60,255,60,${0.4*intensity})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70+intensity*40, 50+intensity*30, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.fillRect(cx-12, cy, 24, 50);
      ctx.beginPath();
      ctx.ellipse(cx, cy-50, 45+intensity*20, 25+intensity*10, 0, 0, Math.PI*2);
      ctx.fill();

      // Radiation rings — expanding
      for(let i=0;i<6+Math.floor(intensity*4);i++){
        const r = (s.t*0.05 + i*40) % (w*0.6);
        ctx.strokeStyle = `rgba(57,255,20,${(1-r/(w*0.6))*intensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.stroke();
      }

      // Radiation particles
      if(Math.random()<0.5){
        spawnParticle(s, {
          x: cx, y: cy,
          vx:(Math.random()-0.5)*3, vy:(Math.random()-0.5)*3,
          life:60, color:'#39FF14', size:2, type:'ember'
        });
      }

      // Flash warning
      if(((s.t*0.005) % 1) < 0.3){
        ctx.fillStyle = `rgba(255,255,0,${0.15*intensity})`;
        ctx.fillRect(0,0,w,h);
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 4, ['Meltdown','Release','Plume','Containment']);
    },

    chemical(ctx, w, h, s){
      const intensity = s.intensity/100;
      ctx.fillStyle = '#1a0a2a';
      ctx.fillRect(0,0,w,h);

      // Spawn toxic cloud particles
      if(Math.random()<0.7){
        for(let i=0;i<2;i++){
          spawnParticle(s, {
            x: Math.random()*w, y: Math.random()*h*0.5,
            vx: 0.5+Math.random()*1, vy: (Math.random()-0.5)*0.5,
            life: 100+Math.random()*60,
            color: `hsl(${270+Math.random()*30}, 80%, ${40+Math.random()*15}%)`,
            size: 15+Math.random()*10, type:'circle',
            fade:true
          });
        }
      }

      // Hazard stripes
      for(let i=0;i<10;i++){
        const y = h-30 + i*3;
        const on = ((s.t*0.005+i) % 2) < 1;
        ctx.fillStyle = `rgba(${on?255:0},${on?255:0},0,${0.6*intensity})`;
        ctx.fillRect(0, y, w, 1.5);
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Leak','Spread','Decon']);
    },

    landslide(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#2a1a10');
      grad.addColorStop(1, '#1a0a05');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Slope
      ctx.fillStyle = '#3a2818';
      ctx.beginPath();
      ctx.moveTo(0, h*0.7);
      ctx.lineTo(w, h*0.3);
      ctx.lineTo(w, h);
      ctx.fill();

      // Spawn falling rocks
      if(Math.random()<0.6){
        spawnParticle(s, {
          x: w - Math.random()*w*0.4,
          y: h*0.3,
          vx: -2-Math.random()*2, vy: 1+Math.random()*2,
          life: 60+Math.random()*40,
          color: '#A0522D', size: 3+Math.random()*5, type:'circle',
          gravity: 0.15
        });
      }

      // Dust particles
      if(Math.random()<0.4){
        spawnParticle(s, {
          x: w*0.7 + (Math.random()-0.5)*40,
          y: h*0.5 + (Math.random()-0.5)*30,
          vx: -0.5+Math.random(), vy: -0.5-Math.random()*0.5,
          life: 60, color: 'rgba(180,150,100,0.5)', size: 8+Math.random()*10
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Saturation','Slip','Debris']);
    },

    heatwave(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Hot sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#ffaa44');
      grad.addColorStop(0.5, '#ff6633');
      grad.addColorStop(1, '#cc3322');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Sun
      const cx = w*0.8, cy = 50;
      ctx.fillStyle = `rgba(255,255,200,${intensity})`;
      ctx.shadowColor = '#FFD60A';
      ctx.shadowBlur = 40*intensity;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI*2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Sun rays
      for(let i=0;i<12;i++){
        const angle = (i/12)*Math.PI*2 + s.t*0.002;
        ctx.strokeStyle = `rgba(255,255,200,${0.3*intensity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx+Math.cos(angle)*30, cy+Math.sin(angle)*30);
        ctx.lineTo(cx+Math.cos(angle)*50, cy+Math.sin(angle)*50);
        ctx.stroke();
      }

      // Ground
      ctx.fillStyle = '#5a3010';
      ctx.fillRect(0, h*0.85, w, h*0.15);

      // Heat shimmer particles
      if(Math.random()<0.7){
        spawnParticle(s, {
          x: Math.random()*w, y: h*0.5 + Math.random()*h*0.3,
          vx:(Math.random()-0.5)*0.5, vy: -0.3,
          life: 40, color: 'rgba(255,200,100,0.4)', size: 5+Math.random()*5
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Onset','Peak','Relief']);
    },

    drought(ctx, w, h, s){
      const intensity = s.intensity/100;
      // Cracked sky
      const grad = ctx.createLinearGradient(0,0,0,h);
      grad.addColorStop(0, '#ddaa55');
      grad.addColorStop(1, '#aa6633');
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);

      // Cracked earth (crack pattern generated once, cached — regenerating
      // every frame made all 30 cracks flicker/redraw randomly each tick)
      ctx.fillStyle = '#8B5A2B';
      ctx.fillRect(0, h*0.55, w, h*0.45);
      if(!s.cracks){
        s.cracks = [];
        for(let i=0;i<30;i++){
          const x1 = Math.random()*w;
          const y1 = h*0.55 + Math.random()*h*0.45;
          const segs = 3+Math.floor(Math.random()*3);
          const points = [];
          let cx = x1, cy = y1;
          for(let j=0;j<segs;j++){
            cx += (Math.random()-0.5)*50;
            cy += (Math.random()-0.5)*50;
            points.push({x:cx, y:cy});
          }
          s.cracks.push({x1, y1, points});
        }
      }
      ctx.strokeStyle = '#5C3A1E';
      ctx.lineWidth = 2;
      s.cracks.forEach(c=>{
        ctx.beginPath();
        ctx.moveTo(c.x1, c.y1);
        c.points.forEach(pt=> ctx.lineTo(pt.x, pt.y));
        ctx.stroke();
      });

      // Dying sun
      const cx = w*0.5, cy = 70;
      ctx.fillStyle = `rgba(255,200,0,${0.6+intensity*0.4})`;
      ctx.beginPath();
      ctx.arc(cx, cy, 28, 0, Math.PI*2);
      ctx.fill();

      // Dust particles
      if(Math.random()<0.3){
        spawnParticle(s, {
          x: Math.random()*w, y: h*0.5 + Math.random()*h*0.4,
          vx: 1+Math.random(), vy: (Math.random()-0.5)*0.3,
          life: 60, color: 'rgba(200,150,100,0.5)', size: 3+Math.random()*5
        });
      }

      updateParticles(s, w, h);
      drawParticles(ctx, s);

      drawSteps(ctx, w, h, s.step, 3, ['Dry Spell','Water Shortage','Reservoir Depleted']);
    },

    cyclone(ctx, w, h, s){
      const intensity = s.intensity / 100;
      const cx = w * .55, cy = h * .5;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#06152a'); sky.addColorStop(1, '#123b4b');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#06344a'; ctx.fillRect(0, h * .7, w, h * .3);
      for(let i = 0; i < 80; i++){
        const angle = i * .45 + s.t * .003;
        const radius = 18 + (i / 80) * w * .42;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * .55;
        ctx.fillStyle = `rgba(72,202,228,${(1 - i / 90) * intensity})`;
        ctx.fillRect(x, y, 2, 2);
      }
      ctx.strokeStyle = `rgba(220,250,255,${.65 * intensity})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, 20 + Math.sin(s.t * .01) * 3, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#bdebf2'; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();
      drawSteps(ctx, w, h, s.step, 4, ['Tropical Wave','Cyclone Forms','Landfall','Weakening']);
    },

    blizzard(ctx, w, h, s){
      const intensity = s.intensity / 100;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#b9d7e8'); sky.addColorStop(1, '#53748b');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#eef8fb'; ctx.fillRect(0, h * .78, w, h * .22);
      ctx.fillStyle = '#2b4352';
      for(let x = 20; x < w; x += 55){
        const bh = 30 + (x % 90);
        ctx.fillRect(x, h * .78 - bh, 34, bh);
        ctx.fillStyle = '#dcebf0'; ctx.fillRect(x + 7, h * .78 - bh + 10, 7, 7);
        ctx.fillStyle = '#2b4352';
      }
      if(Math.random() < .9){
        for(let i = 0; i < 5; i++) spawnParticle(s, {
          x: Math.random() * w, y: -5, vx: -2 - Math.random() * 3, vy: 4 + Math.random() * 4,
          life: 70, color: '#fff', size: 2 + Math.random() * 2, type: 'circle'
        });
      }
      updateParticles(s, w, h); drawParticles(ctx, s);
      drawSteps(ctx, w, h, s.step, 3, ['Snowfall','Whiteout','Shelter']);
    },

    geomagnetic(ctx, w, h, s){
      const intensity = s.intensity / 100;
      ctx.fillStyle = '#071225'; ctx.fillRect(0, 0, w, h);
      for(let i = 0; i < 9; i++){
        ctx.strokeStyle = `hsla(${155 + i * 12}, 90%, 70%, ${.18 + intensity * .08})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(w * (i / 8), h * .05);
        ctx.bezierCurveTo(w * .2, h * .4, w * .8, h * .45, w * (1 - i / 8), h * .9);
        ctx.stroke();
      }
      ctx.fillStyle = '#142c3c'; ctx.fillRect(0, h * .83, w, h * .17);
      ctx.fillStyle = '#6de7d0';
      for(let i = 0; i < 8; i++) ctx.fillRect(24 + i * 42, h * .83 - 18 - (i % 3) * 12, 22, 18 + (i % 3) * 12);
      drawSteps(ctx, w, h, s.step, 3, ['Solar Flare','Aurora Surge','Grid Risk']);
    },

    glacial(ctx, w, h, s){
      const intensity = s.intensity / 100;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#9bd7ed'); sky.addColorStop(1, '#e7f8fb');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#5f9bb1'; ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(w * .25, h * .35); ctx.lineTo(w * .46, h * .58); ctx.lineTo(w * .7, h * .18); ctx.lineTo(w, h * .5); ctx.lineTo(w, h); ctx.fill();
      ctx.fillStyle = '#f4fdff'; ctx.beginPath();
      ctx.moveTo(w * .25, h * .35); ctx.lineTo(w * .46, h * .58); ctx.lineTo(w * .7, h * .18); ctx.lineTo(w * .62, h * .5); ctx.lineTo(w * .46, h * .42); ctx.lineTo(w * .36, h * .55); ctx.fill();
      const collapse = Math.min(1, (s.t * .002 + s.step * .18) % 1.2);
      ctx.fillStyle = `rgba(90,180,215,${.55 + intensity * .35})`;
      ctx.beginPath(); ctx.moveTo(w * .55, h * .48); ctx.lineTo(w * (.48 - collapse * .12), h * .7); ctx.lineTo(w * (.78 + collapse * .12), h); ctx.lineTo(w * .35, h); ctx.closePath(); ctx.fill();
      drawSteps(ctx, w, h, s.step, 3, ['Crack','Collapse','Outwash Flood']);
    },

    sandstorm(ctx, w, h, s){
      const intensity = s.intensity / 100;
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#9b633c'); sky.addColorStop(1, '#e0a563');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#704222'; ctx.fillRect(0, h * .78, w, h * .22);
      ctx.fillStyle = '#3a2519';
      ctx.fillRect(w * .12, h * .55, 42, h * .23); ctx.fillRect(w * .2, h * .62, 58, h * .16);
      if(Math.random() < .8){
        for(let i = 0; i < 4; i++) spawnParticle(s, {
          x: w + 10, y: Math.random() * h * .8, vx: -4 - Math.random() * 5, vy: (Math.random() - .5),
          life: 80, color: `rgba(255,220,160,${.25 + intensity * .45})`, size: 3 + Math.random() * 6, type: 'circle'
        });
      }
      updateParticles(s, w, h); drawParticles(ctx, s);
      drawSteps(ctx, w, h, s.step, 3, ['Dust Rises','Visibility Drops','Shelter']);
    }
  };

  function drawSteps(ctx, w, h, step, total, labels){
    if(w < 300) return; // skip on mini previews
    ctx.fillStyle = 'rgba(0,229,255,0.5)';
    ctx.font = '10px Inter';
    for(let i=0;i<total;i++){
      const x = 12 + i*90;
      const y = h-12;
      ctx.fillText(`${i+1}. ${labels[i]||''}`, x, y);
      if(i===Math.min(step,total-1)){
        ctx.fillStyle = '#FFB300';
        ctx.fillText('◀', x-12, y);
        ctx.fillStyle = 'rgba(0,229,255,0.5)';
      }
    }
  }

  // === Popup simulation windows (independent of the main hazard panel / mini
  // card previews — keyed by canvas id so a standalone window can run its own
  // animation loop without disturbing the main panel's state) ===
  const winStates = {};
  function startWin(canvasId, hazardId, opts){
    opts = opts || {};
    if(!RENDERERS[hazardId]) return;
    stopWin(canvasId);
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const state = buildState(hazardId, opts.intensity != null ? opts.intensity : 60);
    state.speedMult = opts.speed || 1;
    winStates[canvasId] = state;
    loop(state, canvasId);
  }
  function stopWin(canvasId){
    if(winStates[canvasId]){
      cancelAnimationFrame(winStates[canvasId].raf);
      delete winStates[canvasId];
    }
  }
  function winSetIntensity(id, v){ if(winStates[id]) winStates[id].intensity = v; }
  function winSetPlaying(id, p){ if(winStates[id]) winStates[id].playing = p; }
  function winSetSpeed(id, m){ if(winStates[id]) winStates[id].speedMult = m; }
  function winStepOnce(id){ if(winStates[id]) winStates[id].step += 1; }

  return { start, stop, setIntensity, setPlaying, stepOnce, startMini, stopMini, stopAllMini,
           startWin, stopWin, winSetIntensity, winSetPlaying, winSetSpeed, winStepOnce };
})();