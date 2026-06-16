// Main Shell Script & Animation Controller for RoutineFlow
import './style.css';
import { gsap } from 'gsap';

import { initTodo, updateDashboardTaskWidgets } from './todo.js';
import { initTimetable, renderTimetable, updateDashboardSchedule } from './timetable.js';
import { initTimer } from './timer.js';
import { initFriendCircle } from './friendCircle.js';
import { initFriendGroups } from './friendGroups.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Sub-modules
  initTodo();
  initTimetable();
  initTimer();
  initFriendCircle();
  initFriendGroups();

  // 2. Setup Routing & GSAP animations
  setupNavigation();

  // 3. Start Clock
  startDigitalClock();

  // 4. Mobile sidebar checks
  setupMobileSidebar();

  // 5. Apply Liquid Button Ripple interactions
  setupButtonRipples();

  // 6. Draw Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      if (tabId) {
        switchTab(tabId);
      }
    });
  });

  window.switchTab = switchTab;
}

function switchTab(tabId) {
  const panes = document.querySelectorAll('.tab-pane');
  const targetPane = document.getElementById(`tab-${tabId}`);
  
  if (!targetPane || targetPane.classList.contains('active')) return;

  // 1. Hide current active
  panes.forEach(pane => pane.classList.remove('active'));

  // 2. Display target
  targetPane.classList.add('active');

  // 3. Trigger GSAP Spring Inertia tab morphing animation!
  gsap.fromTo(targetPane, 
    { opacity: 0, y: 15, scale: 0.97, filter: 'blur(3px)' }, 
    { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'back.out(1.5)' }
  );

  // 4. Highlight Nav Item
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    }
  });

  // Callbacks
  if (tabId === 'dashboard') {
    updateDashboardTaskWidgets();
    updateDashboardSchedule();
    // Re-verify XP UI
    window.incrementXp?.(0);
  } else if (tabId === 'timetable') {
    renderTimetable();
  }

  // Close sidebar on mobile
  const sidebar = document.querySelector('.sidebar');
  if (sidebar && window.innerWidth <= 950) {
    sidebar.classList.remove('active');
  }

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Digital clock & Dynamic greeting state loop
function startDigitalClock() {
  const clockDisplay = document.getElementById('digital-clock');
  const dateDisplay = document.getElementById('current-date-display');
  const greetingTitle = document.getElementById('greeting-title');

  function update() {
    const now = new Date();
    
    if (clockDisplay) {
      clockDisplay.textContent = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    }

    if (dateDisplay) {
      dateDisplay.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    if (greetingTitle) {
      const hour = now.getHours();
      let text = 'Ready to Flow';
      if (hour >= 5 && hour < 12) {
        text = 'Good morning, Scholar';
      } else if (hour >= 12 && hour < 17) {
        text = 'Good afternoon, Scholar';
      } else if (hour >= 17 && hour < 22) {
        text = 'Good evening, Scholar';
      } else {
        text = 'Keep burning the midnight oil';
      }
      greetingTitle.textContent = text;
    }
  }

  update();
  setInterval(update, 1000);
}

// Mobile hamburger sidebar
function setupMobileSidebar() {
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const closeBtn = document.getElementById('sidebar-close-btn');
  const sidebar = document.querySelector('.sidebar');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.add('active');
    });
  }

  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', () => {
      sidebar.classList.remove('active');
    });
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth > 950 && sidebar) {
      sidebar.classList.remove('active');
    }
  });
}

// Liquid Ripple button press effects
function setupButtonRipples() {
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .react-btn, .timer-mode-btn');
    if (!btn) return;

    // Create ripple circle span
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size/2}px`;
    ripple.style.top = `${e.clientY - rect.top - size/2}px`;

    // Remove existing ripple if any
    const oldRipple = btn.querySelector('.ripple');
    if (oldRipple) oldRipple.remove();

    btn.appendChild(ripple);
  });
}
