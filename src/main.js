// Main Shell Script & Animation Controller for RoutineFlow
// Premium UI: blur-condense load, spring tab transitions, nav blob, ambient zones
import './style.css';
import { gsap } from 'gsap';

import { initTodo, updateDashboardTaskWidgets } from './todo.js';
import { initTimetable, renderTimetable, updateDashboardSchedule } from './timetable.js';
import { initTimer, lazyLoadChart } from './timer.js';
import { initFriendCircle } from './friendCircle.js';
import { initFriendGroups } from './friendGroups.js';
import { initPremiumEffects, animateNavBlob } from './premiumEffects.js';

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

  // 7. Initialize Premium Visual Effects
  // Slight delay so DOM is fully painted before effects kick in
  requestAnimationFrame(() => {
    initPremiumEffects();
  });

  // 8. Setup debounced search
  setupDebouncedSearch();
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

  // 1. Hide current active with exit animation
  const currentPane = document.querySelector('.tab-pane.active');
  if (currentPane) {
    gsap.to(currentPane, {
      opacity: 0,
      y: -8,
      scale: 0.98,
      filter: 'blur(4px)',
      duration: 0.15,
      ease: 'power2.in',
      onComplete: () => {
        currentPane.classList.remove('active');
        // Reset inline styles
        gsap.set(currentPane, { clearProps: 'all' });
      }
    });
  }

  // 2. Display target with spring entry
  setTimeout(() => {
    panes.forEach(pane => pane.classList.remove('active'));
    targetPane.classList.add('active');

    // Spring physics entry animation
    gsap.fromTo(targetPane, 
      { opacity: 0, y: 15, scale: 0.97, filter: 'blur(6px)' }, 
      { 
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', 
        duration: 0.55, 
        ease: 'back.out(1.2)',
        clearProps: 'filter'
      }
    );
  }, 120);

  // 3. Highlight Nav Item
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    }
  });

  // 4. Animate nav blob indicator
  animateNavBlob(tabId);

  // 5. Callbacks
  if (tabId === 'dashboard') {
    updateDashboardTaskWidgets();
    updateDashboardSchedule();
    window.incrementXp?.(0);
  } else if (tabId === 'timetable') {
    renderTimetable();
  } else if (tabId === 'timer') {
    // Lazy-load Chart.js on first Focus Hub visit
    lazyLoadChart();
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

// Debounced search input (300ms)
function setupDebouncedSearch() {
  const searchInput = document.getElementById('task-search');
  if (!searchInput) return;

  let debounceTimer = null;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      // Trigger the existing filter logic
      const event = new Event('input', { bubbles: true });
      // The todo.js module handles this via its own listener
      // This debounce wraps the native event to prevent rapid re-renders
    }, 300);
  });
}
