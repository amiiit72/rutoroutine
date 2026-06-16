// Timetable Module with GCal Sync & Conflict Warnings for RoutineFlow

let events = [];
let isGcalConnected = false;

export function initTimetable() {
  loadEvents();
  setupEventListeners();
  renderTimetable();
  updateDashboardSchedule();
}

function loadEvents() {
  const data = localStorage.getItem('the_routine_timetable');
  if (data) {
    try {
      events = JSON.parse(data);
    } catch (e) {
      events = [];
    }
  } else {
    events = [
      {
        id: 'e1',
        title: 'CS-302 Operating Systems',
        day: 1, // Monday
        start: '09:00',
        end: '11:00',
        room: 'Lecture Hall C',
        color: 'violet'
      },
      {
        id: 'e2',
        title: 'PHY-104 Lab Period',
        day: 1, // Monday
        start: '14:00',
        end: '17:00',
        room: 'Lab 4B',
        color: 'cyan'
      },
      {
        id: 'e3',
        title: 'MATH-201 Linear Algebra',
        day: 2, // Tuesday
        start: '10:00',
        end: '12:00',
        room: 'Room 201',
        color: 'emerald'
      },
      {
        id: 'e4',
        title: 'CS-302 OS Discussion',
        day: 3, // Wednesday
        start: '09:00',
        end: '10:00',
        room: 'Seminar A',
        color: 'violet'
      }
    ];
    saveEvents();
  }
}

function saveEvents() {
  localStorage.setItem('the_routine_timetable', JSON.stringify(events));
}

function setupEventListeners() {
  const modal = document.getElementById('timetable-modal');
  const openBtn = document.getElementById('open-event-modal-btn');
  const closeBtn = document.getElementById('close-event-modal-btn');
  const form = document.getElementById('timetable-form');
  const deleteBtn = document.getElementById('timetable-delete-btn');
  const gcalBtn = document.getElementById('gcal-sync-btn');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      form.reset();
      document.getElementById('event-edit-id').value = '';
      if (deleteBtn) deleteBtn.style.display = 'none';
      modal.classList.add('active');
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveFormEvent();
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      const editId = document.getElementById('event-edit-id').value;
      if (editId) {
        deleteEvent(editId);
        modal.classList.remove('active');
      }
    });
  }

  if (gcalBtn) {
    gcalBtn.addEventListener('click', triggerGcalSync);
  }
}

function triggerGcalSync() {
  const loader = document.getElementById('gcal-sync-loader');
  const statusPill = document.getElementById('gcal-status-pill');

  if (!loader || !statusPill) return;

  // 1. Show loader and update connection state
  loader.style.display = 'flex';
  statusPill.innerHTML = `<i data-lucide="refresh-cw" class="spin" style="width:14px;height:14px;"></i><span>Syncing...</span>`;
  if (window.lucide) window.lucide.createIcons();

  // 2. Animate liquid loader fill bar inside CSS
  setTimeout(() => {
    // 3. Inject mock Google Calendar events after 2.5 seconds
    if (!isGcalConnected) {
      events.push(
        {
          id: 'gcal-1',
          title: '🗓️ GCal: Project Group Sync',
          day: 3, // Wednesday
          start: '14:00',
          end: '16:00',
          room: 'Zoom Link',
          color: 'cyan'
        },
        {
          id: 'gcal-2',
          title: '🗓️ GCal: Gym Workout',
          day: 4, // Thursday
          start: '16:00',
          end: '18:00',
          room: 'Campus Gym',
          color: 'rose'
        }
      );
      isGcalConnected = true;
      saveEvents();
    }

    // 4. Hide loader, update status badge
    loader.style.display = 'none';
    statusPill.className = 'gcal-indicator synced';
    statusPill.innerHTML = `<i data-lucide="check-circle" style="width:14px;height:14px;"></i><span>GCal Connected</span>`;
    if (window.lucide) window.lucide.createIcons();

    // 5. Re-draw schedule grid
    renderTimetable();
    updateDashboardSchedule();
  }, 2500);
}

function saveFormEvent() {
  const modal = document.getElementById('timetable-modal');
  const editId = document.getElementById('event-edit-id').value;
  const title = document.getElementById('event-title').value.trim();
  const day = parseInt(document.getElementById('event-day').value);
  const color = document.getElementById('event-color').value;
  const room = document.getElementById('event-room').value.trim();
  const start = document.getElementById('event-start').value;
  const end = document.getElementById('event-end').value;

  const startHour = parseInt(start.split(':')[0]);
  const endHour = parseInt(end.split(':')[0]);

  if (endHour <= startHour) {
    alert('End time must be after the start time.');
    return;
  }

  if (editId) {
    const event = events.find(e => e.id === editId);
    if (event) {
      event.title = title;
      event.day = day;
      event.color = color;
      event.room = room;
      event.start = start;
      event.end = end;
    }
  } else {
    const newEvent = {
      id: Date.now().toString(),
      title,
      day,
      color,
      room,
      start,
      end
    };
    events.push(newEvent);
  }

  saveEvents();
  renderTimetable();
  updateDashboardSchedule();
  if (modal) modal.classList.remove('active');
}

export function openEditModal(eventObj) {
  const modal = document.getElementById('timetable-modal');
  const deleteBtn = document.getElementById('timetable-delete-btn');
  if (!modal) return;

  document.getElementById('event-edit-id').value = eventObj.id;
  document.getElementById('event-title').value = eventObj.title;
  document.getElementById('event-day').value = eventObj.day.toString();
  document.getElementById('event-color').value = eventObj.color;
  document.getElementById('event-room').value = eventObj.room || '';
  document.getElementById('event-start').value = eventObj.start;
  document.getElementById('event-end').value = eventObj.end;

  if (deleteBtn) deleteBtn.style.display = 'block';
  modal.classList.add('active');
}

export function deleteEvent(id) {
  events = events.filter(e => e.id !== id);
  saveEvents();
  renderTimetable();
  updateDashboardSchedule();
}

// Conflict checking: detects hour overlaps on the same day
function checkConflicts() {
  // Reset conflicts
  events.forEach(e => e.hasConflict = false);

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];

      // Same day check
      if (a.day === b.day) {
        const aStart = timeToMinutes(a.start);
        const aEnd = timeToMinutes(a.end);
        const bStart = timeToMinutes(b.start);
        const bEnd = timeToMinutes(b.end);

        // Overlap detection
        if (aStart < bEnd && aEnd > bStart) {
          a.hasConflict = true;
          b.hasConflict = true;
        }
      }
    }
  }
}

export function renderTimetable() {
  checkConflicts();

  // Clear day event columns
  for (let i = 0; i <= 6; i++) {
    const container = document.getElementById(`day-events-${i}`);
    if (container) container.innerHTML = '';
  }

  events.forEach(event => {
    const container = document.getElementById(`day-events-${event.day}`);
    if (!container) return;

    const startHour = parseInt(event.start.split(':')[0]);
    const endHour = parseInt(event.end.split(':')[0]);
    
    // Rows start at 08:00 AM.
    const topOffset = (startHour - 8) * 60;
    const height = (endHour - startHour) * 60 - 8;

    const card = document.createElement('div');
    card.className = `event-card event-theme-${event.color} ${event.hasConflict ? 'has-conflict' : ''}`;
    card.style.top = `${topOffset}px`;
    card.style.height = `${height}px`;

    let displayTime = formatTime12(event.start) + ' - ' + formatTime12(event.end);

    card.innerHTML = `
      <div class="event-card-title">${escapeHtml(event.title)}</div>
      ${event.room ? `<div class="event-card-room"><i data-lucide="map-pin" style="width:10px;height:10px;"></i> ${escapeHtml(event.room)}</div>` : ''}
      <div class="event-card-time">${displayTime}</div>
      ${event.hasConflict ? `<div class="event-card-room" style="color:#ef4444;"><i data-lucide="alert-triangle" style="width:10px;height:10px;"></i> Time Conflict</div>` : ''}
    `;

    card.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(event);
    });

    container.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

export function updateDashboardSchedule() {
  const dashSchedule = document.getElementById('dash-schedule-today');
  if (!dashSchedule) return;

  dashSchedule.innerHTML = '';

  const today = new Date();
  const dayOfWeek = today.getDay();

  const todayEvents = events.filter(e => e.day === dayOfWeek);

  if (todayEvents.length === 0) {
    dashSchedule.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <i data-lucide="calendar" style="width: 28px; height: 28px; margin-bottom: 8px; color: var(--text-dark);"></i>
        <p style="font-size: 0.85rem;">Free schedule today!</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  todayEvents.sort((a, b) => a.start.localeCompare(b.start));

  todayEvents.forEach(event => {
    const item = document.createElement('div');
    item.className = 'preview-row';
    item.style.cursor = 'pointer';

    const timeStr = formatTime12(event.start) + ' - ' + formatTime12(event.end);
    
    let colorHex = '#7c3aed';
    if (event.color === 'cyan') colorHex = '#06b6d4';
    else if (event.color === 'emerald') colorHex = '#10b981';
    else if (event.color === 'amber') colorHex = '#f59e0b';
    else if (event.color === 'rose') colorHex = '#f43f5e';

    item.style.borderLeft = `4px solid ${colorHex}`;

    item.innerHTML = `
      <div class="preview-time">${timeStr}</div>
      <div class="preview-title" style="margin-left: 12px;">${escapeHtml(event.title)}</div>
      <span class="preview-tag" style="background-color: rgba(255,255,255,0.03); color: var(--text-muted);">${escapeHtml(event.room || 'Remote')}</span>
    `;

    item.addEventListener('click', () => {
      window.switchTab('timetable');
    });

    dashSchedule.appendChild(item);
  });

  if (window.lucide) window.lucide.createIcons();
}

// Helpers
function timeToMinutes(timeStr) {
  const parts = timeStr.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function formatTime12(time24) {
  const parts = time24.split(':');
  let hour = parseInt(parts[0]);
  const minute = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  hour = hour % 12;
  hour = hour ? hour : 12;
  
  return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
