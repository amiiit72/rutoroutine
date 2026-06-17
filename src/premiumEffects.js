/**
 * RoutineFlow — Premium Visual Effects Module
 * 
 * GPU-accelerated visual effects:
 * - Inner light source simulation (follows cursor inside glass panels)
 * - Specular highlight streaks on interactive elements
 * - Magnetic button pull toward cursor
 * - Sidebar liquid blob indicator animation
 * - Blur-condense page load stagger
 * 
 * All mousemove handlers throttled at 16ms (60fps) via requestAnimationFrame.
 * will-change applied only during active animations.
 */

import { gsap } from 'gsap';

// ── Configuration ──────────────────────────────────────────────────────────
const MAGNETIC_RADIUS = 60;    // px — cursor pull radius for magnetic elements
const MAGNETIC_STRENGTH = 0.3; // 0-1 — how strongly elements pull toward cursor

// ── RAF Throttle State ─────────────────────────────────────────────────────
let lightRafId = null;
let mouseX = 0, mouseY = 0;

// ── Initialization ─────────────────────────────────────────────────────────
export function initPremiumEffects() {
  initCustomCursorAndGlow();
  initInnerLightTracking();
  initMagneticButtons();
  initNavBlobIndicator();
  initBlurCondenseLoad();
}

// ── 0. Custom Cursor & Background Glow ─────────────────────────────────────────
function initCustomCursorAndGlow() {
  // Only initialize on desktop / devices with a mouse (pointer: fine)
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);

  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  document.body.appendChild(cursor);

  // Create trail elements
  const trails = [];
  const trailCount = 5;
  for (let i = 0; i < trailCount; i++) {
    const trail = document.createElement('div');
    trail.className = `custom-cursor trail trail-${i}`;
    document.body.appendChild(trail);
    trails.push({ el: trail, x: 0, y: 0 });
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let cursorX = targetX, cursorY = targetY;
  let currentGlowX = targetX, currentGlowY = targetY;
  let initialized = false;

  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
    
    if (!initialized) {
      cursorX = targetX;
      cursorY = targetY;
      currentGlowX = targetX;
      currentGlowY = targetY;
      trails.forEach(t => {
        t.x = targetX;
        t.y = targetY;
      });
      initialized = true;
    }
  });

  function tick() {
    // Custom cursor moves with fluid damping
    cursorX += (targetX - cursorX) * 0.35;
    cursorY += (targetY - cursorY) * 0.35;
    cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) rotate(45deg)`;

    // Trails follow in a cascade chain
    let prevX = cursorX;
    let prevY = cursorY;
    trails.forEach((trail) => {
      trail.x += (prevX - trail.x) * 0.3;
      trail.y += (prevY - trail.y) * 0.3;
      trail.el.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%) rotate(45deg)`;
      prevX = trail.x;
      prevY = trail.y;
    });

    // Background glow follows with a smooth lag (lerp)
    currentGlowX += (targetX - currentGlowX) * 0.08;
    currentGlowY += (targetY - currentGlowY) * 0.08;
    glow.style.transform = `translate3d(${currentGlowX}px, ${currentGlowY}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Delegation of cursor hover scaling/transitions on interactive elements
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('a, button, .glass-panel, .btn, .react-btn, .nav-link, .group-item, input, select, textarea');
    if (target) {
      cursor.classList.add('hovering');
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('a, button, .glass-panel, .btn, .react-btn, .nav-link, .group-item, input, select, textarea');
    if (target) {
      cursor.classList.remove('hovering');
    }
  });
}

// ── 1. Inner Light Source Simulation & 3D Tilt Bulge ──────────────────────
// A radial gradient "light" inside each glass-panel follows the cursor
// and the card tilts/bulges dynamically towards the cursor.
function initInnerLightTracking() {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!lightRafId) {
      lightRafId = requestAnimationFrame(updateLightPositions);
    }
  });

  // Reset card transform and light coordinates smoothly when mouse leaves
  document.addEventListener('mouseout', (e) => {
    const panel = e.target.closest('.glass-panel');
    if (panel && (!e.relatedTarget || !panel.contains(e.relatedTarget))) {
      panel.style.transform = '';
      panel.style.setProperty('--light-x', '50%');
      panel.style.setProperty('--light-y', '50%');
    }
  });
}

function updateLightPositions() {
  lightRafId = null;

  const panels = document.querySelectorAll('.glass-panel:hover');
  panels.forEach(panel => {
    // Skip absolute structural frames (sidebar, topbar)
    if (panel.classList.contains('sidebar') || panel.classList.contains('topbar')) {
      return;
    }

    const rect = panel.getBoundingClientRect();
    const x = ((mouseX - rect.left) / rect.width) * 100;
    const y = ((mouseY - rect.top) / rect.height) * 100;

    panel.style.setProperty('--light-x', `${x}%`);
    panel.style.setProperty('--light-y', `${y}%`);

    // Dynamically adjust scale, lift height, and maximum tilt angle based on card size.
    // Large structural cards get a very subtle tilt/lift to avoid border overflow.
    const isLarge = rect.width > 500;
    const maxTilt = isLarge ? 1.5 : 3.5;
    const liftY = isLarge ? -3 : -6;
    const scaleVal = isLarge ? 1.005 : 1.018;

    // Calculate dynamic 3D tilt rotate angles
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;

    const tiltX = -(dy / (rect.height / 2)) * maxTilt;
    const tiltY = (dx / (rect.width / 2)) * maxTilt;

    // Apply translation + 3D tilt bulge transform
    panel.style.transform = `perspective(1000px) translateY(${liftY}px) scale(${scaleVal}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });
}

// ── 2. Magnetic Buttons ───────────────────────────────────────────────────
// Interactive elements pull toward cursor within MAGNETIC_RADIUS
function initMagneticButtons() {
  const magneticElements = document.querySelectorAll(
    '.btn-primary, .btn-play, .logo-icon, .badge-trophy'
  );

  magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < MAGNETIC_RADIUS) {
        const pullX = distX * MAGNETIC_STRENGTH;
        const pullY = distY * MAGNETIC_STRENGTH;

        el.style.willChange = 'transform';
        gsap.to(el, {
          x: pullX,
          y: pullY,
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });

    el.addEventListener('mouseleave', () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)',
        onComplete: () => {
          el.style.willChange = '';
        }
      });
    });
  });
}

// ── 3. Sidebar Liquid Blob Navigation Indicator ───────────────────────────
let currentBlobTarget = null;

function initNavBlobIndicator() {
  const blob = document.getElementById('nav-blob');
  if (!blob) return;

  // Position blob on the active link on init
  requestAnimationFrame(() => {
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
      positionBlob(blob, activeLink, false);
      currentBlobTarget = activeLink;
    }
  });
}

function positionBlob(blob, targetLink, animate = true) {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav || !targetLink) return;

  const navRect = nav.getBoundingClientRect();
  const linkRect = targetLink.getBoundingClientRect();

  const top = linkRect.top - navRect.top;
  const height = linkRect.height;

  if (animate) {
    gsap.to(blob, {
      y: top,
      height: height,
      duration: 0.45,
      ease: 'power3.out',
    });
  } else {
    gsap.set(blob, { y: top, height: height });
  }
}

// Called by main.js when tab switches
export function animateNavBlob(tabId) {
  const blob = document.getElementById('nav-blob');
  if (!blob) return;

  const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
  if (targetLink && targetLink !== currentBlobTarget) {
    positionBlob(blob, targetLink, true);
    currentBlobTarget = targetLink;
  }
}

// ── 4. Blur-Condense Page Load Animation ──────────────────────────────────
function initBlurCondenseLoad() {
  // Add condense-in class to major layout elements
  const elements = document.querySelectorAll(
    '.sidebar, .topbar, .dash-hero, .streak-card, .stat-card, ' +
    '.schedule-preview, .task-preview'
  );

  elements.forEach((el, index) => {
    el.classList.add('condense-in');
  });

  // Stagger reveal after a tiny delay
  requestAnimationFrame(() => {
    setTimeout(() => {
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.add('revealed');
        }, index * 80);
      });
    }, 100);
  });
}

// ── 5. Dynamic will-change Management ─────────────────────────────────────
// Apply will-change only on elements about to animate, remove after
export function prepareForAnimation(element) {
  element.style.willChange = 'transform, opacity';
  return () => { element.style.willChange = ''; };
}
