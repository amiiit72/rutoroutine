// Upgraded Focus Hub (Timer, Rewards, Streaks & Chart.js) for RoutineFlow
import Chart from 'chart.js/auto';

let mode = 'pomodoro'; 
let timerInterval = null;
let isRunning = false;

// Pomodoro Phase & Time
let pomoPhase = 'focus';
let pomoSecondsLeft = 25 * 60;
let pomoTotalDuration = 25 * 60;

// Stopwatch metrics
let swStartTime = 0;
let swElapsedTime = 0;
let swLaps = [];

// Gamification Store
let totalFocusTime = 0;
let userXp = 450; // starts at 450XP
let userLevel = 4;
let userStreak = 5; // default 5 days streak
let studyLogs = [];
let chartInstance = null;

// SVG Stroke Length
const ringCircumference = 596.9;

export function initTimer() {
  loadTimerState();
  setupEventListeners();
  switchMode('pomodoro');
  updateProgressRing(1);
  initXpSystem();
  renderFocusChart();
}

function loadTimerState() {
  const focusData = localStorage.getItem('the_routine_focus_time');
  if (focusData) totalFocusTime = parseInt(focusData) || 0;

  const xpData = localStorage.getItem('the_routine_xp');
  if (xpData) userXp = parseInt(xpData) || 450;

  const levelData = localStorage.getItem('the_routine_level');
  if (levelData) userLevel = parseInt(levelData) || 4;

  const streakData = localStorage.getItem('the_routine_streak');
  if (streakData) userStreak = parseInt(streakData) || 5;

  const logsData = localStorage.getItem('the_routine_study_logs');
  if (logsData) {
    try {
      studyLogs = JSON.parse(logsData);
    } catch (e) {
      studyLogs = [];
    }
  } else {
    studyLogs = [
      { id: 'l1', type: 'Pomodoro', duration: '25m', timestamp: 'Yesterday', status: 'Completed' },
      { id: 'l2', type: 'Pomodoro', duration: '25m', timestamp: 'Yesterday', status: 'Completed' }
    ];
    localStorage.setItem('the_routine_study_logs', JSON.stringify(studyLogs));
  }
}

function saveTimerState() {
  localStorage.setItem('the_routine_focus_time', totalFocusTime.toString());
  localStorage.setItem('the_routine_xp', userXp.toString());
  localStorage.setItem('the_routine_level', userLevel.toString());
  localStorage.setItem('the_routine_streak', userStreak.toString());
  localStorage.setItem('the_routine_study_logs', JSON.stringify(studyLogs));
}

function setupEventListeners() {
  const btnPomo = document.getElementById('mode-pomodoro');
  const btnStopwatch = document.getElementById('mode-stopwatch');
  const btnStart = document.getElementById('timer-start-btn');
  const btnReset = document.getElementById('timer-reset-btn');
  const btnOption = document.getElementById('timer-option-btn');
  const btnClearLogs = document.getElementById('clear-timer-logs');

  const workInput = document.getElementById('pomo-work-input');
  const breakInput = document.getElementById('pomo-break-input');

  if (btnPomo && btnStopwatch) {
    btnPomo.addEventListener('click', () => switchMode('pomodoro'));
    btnStopwatch.addEventListener('click', () => switchMode('stopwatch'));
  }

  if (btnStart) btnStart.addEventListener('click', toggleTimer);
  if (btnReset) btnReset.addEventListener('click', resetTimer);
  if (btnOption) btnOption.addEventListener('click', handleOptionClick);
  if (btnClearLogs) btnClearLogs.addEventListener('click', clearLogs);

  if (workInput) {
    workInput.addEventListener('change', () => {
      if (mode === 'pomodoro' && pomoPhase === 'focus' && !isRunning) {
        pomoSecondsLeft = (parseInt(workInput.value) || 25) * 60;
        pomoTotalDuration = pomoSecondsLeft;
        updateTimerDisplay();
      }
    });
  }

  if (breakInput) {
    breakInput.addEventListener('change', () => {
      if (mode === 'pomodoro' && pomoPhase === 'break' && !isRunning) {
        pomoSecondsLeft = (parseInt(breakInput.value) || 5) * 60;
        pomoTotalDuration = pomoSecondsLeft;
        updateTimerDisplay();
      }
    });
  }
}

function switchMode(newMode) {
  if (isRunning) pauseTimer();

  mode = newMode;
  isRunning = false;

  const btnPomo = document.getElementById('mode-pomodoro');
  const btnStopwatch = document.getElementById('mode-stopwatch');
  const settingsPanel = document.getElementById('pomodoro-settings');
  const optionIcon = document.getElementById('timer-option-icon');
  const optionBtn = document.getElementById('timer-option-btn');
  const labelStatus = document.getElementById('timer-status-text');

  btnPomo?.classList.remove('active');
  btnStopwatch?.classList.remove('active');

  if (mode === 'pomodoro') {
    btnPomo?.classList.add('active');
    if (settingsPanel) settingsPanel.style.display = 'flex';
    if (optionIcon) optionIcon.setAttribute('data-lucide', 'skip-forward');
    if (optionBtn) optionBtn.title = 'Skip Phase';
    if (labelStatus) labelStatus.textContent = pomoPhase.toUpperCase();
    
    const workMins = parseInt(document.getElementById('pomo-work-input')?.value) || 25;
    pomoSecondsLeft = workMins * 60;
    pomoTotalDuration = pomoSecondsLeft;
    pomoPhase = 'focus';
    if (labelStatus) labelStatus.textContent = 'FOCUS';

    updateTimerDisplay();
    updateProgressRing(1);
    renderLogs();
  } else {
    btnStopwatch?.classList.add('active');
    if (settingsPanel) settingsPanel.style.display = 'none';
    if (optionIcon) optionIcon.setAttribute('data-lucide', 'flag');
    if (optionBtn) optionBtn.title = 'Record Lap';
    if (labelStatus) labelStatus.textContent = 'STOPWATCH';
    
    swElapsedTime = 0;
    swLaps = [];
    updateTimerDisplay();
    updateProgressRing(0);
    renderLaps();
  }

  updatePlayButtonIcon(false);
  if (window.lucide) window.lucide.createIcons();
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  updatePlayButtonIcon(true);

  const headerStatus = document.getElementById('header-focus-status');
  const headerDot = document.querySelector('.indicator-dot');
  if (headerStatus) {
    headerStatus.textContent = mode === 'pomodoro' ? `Focusing: ${pomoPhase.toUpperCase()}` : 'Stopwatch Running';
  }
  if (headerDot) {
    headerDot.classList.add('active-study');
  }

  if (mode === 'pomodoro') {
    timerInterval = setInterval(() => {
      pomoSecondsLeft--;
      updateTimerDisplay();
      
      const percent = pomoSecondsLeft / pomoTotalDuration;
      updateProgressRing(percent);

      if (pomoSecondsLeft <= 0) {
        playAlertSound();
        handlePomoCompletion();
      }
    }, 1000);
  } else {
    swStartTime = Date.now() - swElapsedTime;
    timerInterval = setInterval(() => {
      swElapsedTime = Date.now() - swStartTime;
      updateTimerDisplay();
    }, 10);
  }
}

function pauseTimer() {
  isRunning = false;
  updatePlayButtonIcon(false);
  clearInterval(timerInterval);

  const headerStatus = document.getElementById('header-focus-status');
  const headerDot = document.querySelector('.indicator-dot');
  if (headerStatus) headerStatus.textContent = 'Ready to Flow';
  if (headerDot) headerDot.classList.remove('active-study');
}

function resetTimer() {
  pauseTimer();
  
  if (mode === 'pomodoro') {
    pomoPhase = 'focus';
    const workMins = parseInt(document.getElementById('pomo-work-input')?.value) || 25;
    pomoSecondsLeft = workMins * 60;
    pomoTotalDuration = pomoSecondsLeft;
    const labelStatus = document.getElementById('timer-status-text');
    if (labelStatus) labelStatus.textContent = 'FOCUS';
    updateProgressRing(1);
  } else {
    swElapsedTime = 0;
    swLaps = [];
    renderLaps();
  }

  updateTimerDisplay();
}

function handleOptionClick() {
  if (mode === 'pomodoro') {
    skipPomoPhase();
  } else {
    recordStopwatchLap();
  }
}

// POMODORO LOGIC
function handlePomoCompletion() {
  pauseTimer();
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (pomoPhase === 'focus') {
    const workMins = parseInt(document.getElementById('pomo-work-input')?.value) || 25;
    totalFocusTime += workMins;
    
    // Earn XP reward
    incrementXp(100); // 100XP per completed Pomodoro focus block!
    
    // Increment daily focus streak
    userStreak++;
    saveTimerState();
    updateXpUI();
    
    // Add to history
    studyLogs.unshift({
      id: Date.now().toString(),
      type: 'Pomodoro',
      duration: `${workMins}m`,
      timestamp: `Today ${timestamp}`,
      status: 'Completed'
    });

    saveTimerState();
    updateFocusTimeDashboard();
    updateChartData(workMins);

    // Unlock Pomodoro Badge if not unlocked
    const badgePomo = document.getElementById('badge-pomo');
    if (badgePomo) badgePomo.classList.add('unlocked');

    // Switch to break
    pomoPhase = 'break';
    const breakMins = parseInt(document.getElementById('pomo-break-input')?.value) || 5;
    pomoSecondsLeft = breakMins * 60;
    pomoTotalDuration = pomoSecondsLeft;
    
    const labelStatus = document.getElementById('timer-status-text');
    if (labelStatus) labelStatus.textContent = 'BREAK';

    alert('Session complete! Time for a glass break.');
  } else {
    pomoPhase = 'focus';
    const workMins = parseInt(document.getElementById('pomo-work-input')?.value) || 25;
    pomoSecondsLeft = workMins * 60;
    pomoTotalDuration = pomoSecondsLeft;

    const labelStatus = document.getElementById('timer-status-text');
    if (labelStatus) labelStatus.textContent = 'FOCUS';

    alert('Break over! Back to deep flow.');
  }

  updateTimerDisplay();
  updateProgressRing(1);
  renderLogs();
}

function skipPomoPhase() {
  pauseTimer();
  
  if (pomoPhase === 'focus') {
    pomoPhase = 'break';
    const breakMins = parseInt(document.getElementById('pomo-break-input')?.value) || 5;
    pomoSecondsLeft = breakMins * 60;
    pomoTotalDuration = pomoSecondsLeft;
    const labelStatus = document.getElementById('timer-status-text');
    if (labelStatus) labelStatus.textContent = 'BREAK';
  } else {
    pomoPhase = 'focus';
    const workMins = parseInt(document.getElementById('pomo-work-input')?.value) || 25;
    pomoSecondsLeft = workMins * 60;
    pomoTotalDuration = pomoSecondsLeft;
    const labelStatus = document.getElementById('timer-status-text');
    if (labelStatus) labelStatus.textContent = 'FOCUS';
  }

  updateTimerDisplay();
  updateProgressRing(1);
}

// STOPWATCH LAPS
function recordStopwatchLap() {
  if (mode !== 'stopwatch' || swElapsedTime === 0) return;

  const currentLapTime = swElapsedTime;
  let relativeLapTime = currentLapTime;

  if (swLaps.length > 0) {
    relativeLapTime = currentLapTime - swLaps[0].absoluteMs;
  }

  swLaps.unshift({
    lapNum: swLaps.length + 1,
    time: formatStopwatchTime(relativeLapTime),
    absoluteMs: currentLapTime
  });

  // Unlock Stopwatch achievement if laps logged
  const badgeSw = document.getElementById('badge-stopwatch');
  if (badgeSw && swLaps.length >= 3) {
    badgeSw.classList.add('unlocked');
  }

  renderLaps();
}

// XP GAMIFICATION MODULE
function initXpSystem() {
  updateXpUI();
  window.incrementXp = incrementXp; // global hook for todo or comments actions
}

export function incrementXp(amount) {
  userXp += amount;
  
  // Level up calculation
  if (userXp >= 1000) {
    userXp = userXp - 1000;
    userLevel++;
    
    // Unlock Level Badge
    const badgeXp = document.getElementById('badge-xp');
    if (badgeXp) badgeXp.classList.add('unlocked');
    
    // Trigger Level up particle burst
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#a78bfa', '#22d3ee', '#fb7185']
    });
  }

  // Streak badge unlocking check
  const badgeStreak = document.getElementById('badge-streak');
  if (badgeStreak && userStreak >= 5) {
    badgeStreak.classList.add('unlocked');
  }

  saveTimerState();
  updateXpUI();
}

function updateXpUI() {
  const headerXp = document.getElementById('header-xp-val');
  const dashLvl = document.getElementById('dash-level-number');
  const dashBar = document.getElementById('dash-xp-progress');
  const dashDesc = document.getElementById('dash-xp-desc');
  const dashStreak = document.getElementById('dash-streak-count');

  if (headerXp) headerXp.textContent = userXp.toString();
  if (dashLvl) dashLvl.textContent = `Lvl ${userLevel}`;
  
  if (dashBar) {
    const pct = Math.min(100, (userXp / 1000) * 100);
    dashBar.style.width = `${pct}%`;
  }
  
  if (dashDesc) {
    dashDesc.textContent = `${userXp} / 1000 XP to next level`;
  }

  if (dashStreak) {
    dashStreak.textContent = `${userStreak} Days`;
  }
}

// RENDERING LOGS
function renderLogs() {
  const container = document.getElementById('timer-logs-container');
  const title = document.getElementById('timer-log-title');
  if (!container) return;

  if (title) title.textContent = 'Focus Session History';

  if (studyLogs.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No focus sessions recorded.</p></div>`;
    return;
  }

  container.innerHTML = '';
  studyLogs.slice(0, 4).forEach(log => {
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `
      <span class="log-title completed">
        <i data-lucide="award" style="width: 16px; height: 16px;"></i>
        ${log.type} Focus block
      </span>
      <span class="log-duration">${log.duration}</span>
      <span class="log-time">${log.timestamp}</span>
    `;
    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

function renderLaps() {
  const container = document.getElementById('timer-logs-container');
  const title = document.getElementById('timer-log-title');
  if (!container) return;

  if (title) title.textContent = 'Recorded Lap Marks';

  if (swLaps.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Stopwatch marks will appear here.</p></div>`;
    return;
  }

  container.innerHTML = '';
  swLaps.slice(0, 4).forEach(lap => {
    const item = document.createElement('div');
    item.className = 'log-item';
    item.innerHTML = `
      <span class="log-title stopwatch-lap">
        <i data-lucide="flag" style="width: 16px; height: 16px;"></i>
        Lap ${lap.lapNum}
      </span>
      <span class="log-duration">${lap.time}</span>
      <span class="log-time">Split: ${lap.time}</span>
    `;
    container.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

function clearLogs() {
  if (mode === 'pomodoro') {
    studyLogs = [];
    localStorage.removeItem('the_routine_study_logs');
    renderLogs();
  } else {
    swLaps = [];
    renderLaps();
  }
}

// UI UPDATES
function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  if (!display) return;

  if (mode === 'pomodoro') {
    const mins = Math.floor(pomoSecondsLeft / 60);
    const secs = pomoSecondsLeft % 60;
    display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    display.textContent = formatStopwatchTime(swElapsedTime);
  }
}

function updateProgressRing(percent) {
  const ring = document.getElementById('timer-progress-ring');
  if (!ring) return;

  if (mode === 'pomodoro') {
    const offset = ringCircumference - (percent * ringCircumference);
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = 'var(--accent-violet)';
  } else {
    ring.style.strokeDashoffset = 0;
    ring.style.stroke = 'var(--accent-cyan)';
  }
}

function updatePlayButtonIcon(playing) {
  const icon = document.getElementById('timer-play-icon');
  if (!icon) return;

  if (playing) {
    icon.setAttribute('data-lucide', 'pause');
  } else {
    icon.setAttribute('data-lucide', 'play');
  }
  if (window.lucide) window.lucide.createIcons();
}

function updateFocusTimeDashboard() {
  const totalFocusLabel = document.getElementById('dash-total-focus-time');
  const heroFocusLabel = document.getElementById('dash-focus-count');
  
  if (totalFocusLabel) totalFocusLabel.textContent = `${totalFocusTime}m`;
  if (heroFocusLabel) heroFocusLabel.textContent = `${totalFocusTime}m`;
}

function playAlertSound() {
  const audio = document.getElementById('alert-sound');
  if (audio) {
    audio.play().catch(e => console.log('Audio blocked by browser sandbox.'));
  }
}

// CHARTJS FOCUS TIMELINE GRAPH
function renderFocusChart() {
  const ctx = document.getElementById('timer-history-chart')?.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 180);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
  gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');

  const chartConfig = {
    type: 'line',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Focus Minutes',
        data: [45, 60, 30, 90, 75, 120, totalFocusTime > 0 ? totalFocusTime : 40],
        borderColor: '#06b6d4',
        borderWidth: 3,
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.03)' },
          ticks: { color: '#94a3b8', font: { family: 'Inter', size: 10 } }
        }
      }
    }
  };

  if (chartInstance) {
    chartInstance.destroy();
  }
  chartInstance = new Chart(ctx, chartConfig);
}

function updateChartData(addedMinutes) {
  if (!chartInstance) return;
  
  // Add to Sunday/Current Day
  const dataset = chartInstance.data.datasets[0].data;
  dataset[dataset.length - 1] += addedMinutes;
  chartInstance.update();
}

function formatStopwatchTime(totalMs) {
  let temp = totalMs;
  const ms = Math.floor((temp % 1000) / 10);
  temp = Math.floor(temp / 1000);
  const secs = temp % 60;
  temp = Math.floor(temp / 60);
  const mins = temp % 60;
  const hrs = Math.floor(temp / 60);

  const msStr = ms.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');
  const hrsStr = hrs.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${hrsStr}:${minsStr}:${secsStr}.${msStr}`;
  }
  return `${minsStr}:${secsStr}.${msStr}`;
}
