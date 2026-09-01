// Disaster Prep Hub - Simulator Engine
// Reads settings from localStorage for speed, difficulty, choices, replay

const Simulator = (() => {

  let currentStop = null;
  let timerInterval = null;
  let currentDisaster = null;
  let answered = false;

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(STORAGE.SETTINGS) || '{}')) };
  }

  function open(disaster) {
    currentDisaster = disaster;
    const settings = getSettings();
    const intensityKey = settings.intensity || 'moderate';
    const intensityConfig = INTENSITY[intensityKey] || INTENSITY.moderate;

    const modal = document.getElementById('simulator-modal');
    const stage = document.getElementById('sim-stage');
    const choices = document.getElementById('sim-choices');
    const feedback = document.getElementById('sim-feedback');
    const timer = document.getElementById('sim-timer');
    const severityBadge = document.getElementById('sim-severity-badge');
    const severityInfo = document.getElementById('sim-severity-info');
    answered = false;

    document.getElementById('sim-title').textContent = `${disaster.icon} ${disaster.name}`;
    document.getElementById('sim-desc').textContent = disaster.scenario.prompt;

    if (severityBadge) {
      severityBadge.textContent = intensityConfig.label;
      severityBadge.className = `severity-badge ${intensityConfig.badgeClass}`;
    }
    if (severityInfo) {
      severityInfo.innerHTML = `⚡ <strong>Intensity:</strong> ${intensityConfig.label} &nbsp;|&nbsp; ⚠️ <strong>Scale:</strong> ${intensityConfig.damageDesc}`;
    }

    stage.style.backgroundColor = disaster.color;
    choices.classList.add('hidden');
    feedback.classList.add('hidden');
    timer.textContent = '';
    modal.classList.remove('hidden');

    // Start 2D canvas animation at chosen speed & intensity scale
    if (currentStop) currentStop();
    const animFn = Anims[disaster.anim];
    const animDuration = SPEED_MS[settings.speed] || 5000;
    if (animFn) {
      currentStop = animFn(stage, {
        duration: animDuration,
        intensity: intensityConfig.scale
      });
    }

    // Build choice buttons based on settings
    const numChoices = settings.choices;
    const allActions = [disaster.scenario.correct, disaster.scenario.wrong1, disaster.scenario.wrong2];
    if (numChoices === 4 && disaster.scenario.wrong3) allActions.push(disaster.scenario.wrong3);
    const shuffled = [...allActions].sort(() => Math.random() - 0.5);

    const btns = choices.querySelectorAll('.choice-btn');
    btns.forEach((btn, i) => {
      if (i < shuffled.length) {
        btn.textContent = shuffled[i];
        btn.dataset.correct = (shuffled[i] === disaster.scenario.correct) ? '1' : '0';
        btn.disabled = false;
        btn.className = 'choice-btn';
        btn.style.display = '';
      } else {
        btn.style.display = 'none';
      }
    });

    // Show choices at end of animation
    setTimeout(() => {
      if (!currentDisaster) return;
      choices.classList.remove('hidden');
      // Start timer if difficulty is not easy
      const timerSec = TIMER_S[settings.difficulty];
      if (timerSec > 0) startTimer(timerSec);
    }, animDuration);
  }

  function startTimer(sec) {
    let t = sec;
    const timer = document.getElementById('sim-timer');
    timer.textContent = `Time: ${t}s`;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      t--;
      timer.textContent = `Time: ${t}s`;
      if (t <= 0) {
        clearInterval(timerInterval);
        finish(false, null);
      }
    }, 1000);
  }

  function choose(btn) {
    if (answered) return;
    answered = true;
    if (timerInterval) clearInterval(timerInterval);
    const isCorrect = btn.dataset.correct === '1';
    document.querySelectorAll('.choice-btn').forEach(b => b.disabled = true);
    finish(isCorrect, btn);
  }

  function finish(correct, btn) {
    const settings = getSettings();
    const intensityKey = settings.intensity || 'moderate';
    const intensityConfig = INTENSITY[intensityKey] || INTENSITY.moderate;

    const feedback = document.getElementById('sim-feedback');
    const stage = document.getElementById('sim-stage');
    if (currentStop) { currentStop(); currentStop = null; }

    if (correct) {
      const pts = intensityConfig.scoreMult;
      feedback.innerHTML = `✓ CORRECT! Well done.<br><span class="score-bonus">+${pts} Point${pts > 1 ? 's' : ''} (${intensityConfig.label})</span>`;
      feedback.className = 'sim-feedback correct';
      stage.classList.add('flash-good');
      if (btn) btn.classList.add('chosen-right');
      saveScore(currentDisaster.id, pts);
      if (typeof window.refreshSimulatorScores === 'function') {
        window.refreshSimulatorScores();
      }
    } else {
      const rightBtn = [...document.querySelectorAll('.choice-btn')].find(b => b.dataset.correct === '1');
      if (rightBtn) rightBtn.classList.add('chosen-right');
      feedback.innerHTML = `✗ WRONG.<br>Correct answer: <strong>${currentDisaster.scenario.correct}</strong>`;
      feedback.className = 'sim-feedback wrong';
      stage.classList.add('flash-bad');
      if (btn) btn.classList.add('chosen-wrong');
    }
    feedback.classList.remove('hidden');
    setTimeout(() => {
      stage.classList.remove('flash-good', 'flash-bad');
    }, 600);

    // Replay animation after wrong if enabled
    if (!correct && settings.replay) {
      const btn = document.createElement('button');
      btn.className = 'btn-primary replay-btn';
      btn.textContent = '▶ Replay Animation';
      btn.onclick = () => { btn.remove(); open(currentDisaster); };
      feedback.appendChild(btn);
    }
  }

  function close() {
    if (currentStop) { currentStop(); currentStop = null; }
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('simulator-modal').classList.add('hidden');
    currentDisaster = null;
    answered = false;
  }

  function saveScore(disasterId, delta) {
    const scores = JSON.parse(localStorage.getItem(STORAGE.SCORES) || '{}');
    scores[disasterId] = (scores[disasterId] || 0) + delta;
    localStorage.setItem(STORAGE.SCORES, JSON.stringify(scores));
  }

  function getScore(disasterId) {
    const scores = JSON.parse(localStorage.getItem(STORAGE.SCORES) || '{}');
    return scores[disasterId] || 0;
  }

  return { open, close, choose, getScore, getSettings };
})();
