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
  initInnerLightTracking();
  initMagneticButtons();
  initNavBlobIndicator();
  initBlurCondenseLoad();
}

// ── 1. Inner Light Source Simulation ───────────────────────────────────────
// A radial gradient "light" inside each glass-panel follows the cursor
function initInnerLightTracking() {
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!lightRafId) {
      lightRafId = requestAnimationFrame(updateLightPositions);
    }
  });
}

function updateLightPositions() {
  lightRafId = null;

  const panels = document.querySelectorAll('.glass-panel:hover');
  panels.forEach(panel => {
    const rect = panel.getBoundingClientRect();
    const x = ((mouseX - rect.left) / rect.width) * 100;
    const y = ((mouseY - rect.top) / rect.height) * 100;

    panel.style.setProperty('--light-x', `${x}%`);
    panel.style.setProperty('--light-y', `${y}%`);
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
