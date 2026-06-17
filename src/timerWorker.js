/**
 * RoutineFlow — Pomodoro Timer Web Worker
 * 
 * Runs in a separate thread so the timer:
 * - Never drifts due to main thread jank
 * - Never freezes when heavy animations or DOM operations run
 * - Maintains accurate 1-second intervals
 * 
 * Protocol:
 *   Main → Worker:
 *     { type: 'start', seconds: 1500 }  — start countdown from N seconds
 *     { type: 'pause' }                 — pause the countdown
 *     { type: 'reset', seconds: 1500 }  — reset to N seconds (paused)
 *     { type: 'resume' }                — resume from paused state
 * 
 *   Worker → Main:
 *     { type: 'tick', remaining: 1499 } — emitted every second
 *     { type: 'complete' }              — emitted when countdown reaches 0
 */

let intervalId = null;
let remaining = 0;

self.onmessage = function(e) {
  const { type, seconds } = e.data;

  switch (type) {
    case 'start':
      remaining = seconds;
      clearInterval(intervalId);
      intervalId = setInterval(() => {
        remaining--;
        self.postMessage({ type: 'tick', remaining });
        if (remaining <= 0) {
          clearInterval(intervalId);
          intervalId = null;
          self.postMessage({ type: 'complete' });
        }
      }, 1000);
      break;

    case 'pause':
      clearInterval(intervalId);
      intervalId = null;
      break;

    case 'resume':
      if (remaining > 0 && !intervalId) {
        intervalId = setInterval(() => {
          remaining--;
          self.postMessage({ type: 'tick', remaining });
          if (remaining <= 0) {
            clearInterval(intervalId);
            intervalId = null;
            self.postMessage({ type: 'complete' });
          }
        }, 1000);
      }
      break;

    case 'reset':
      clearInterval(intervalId);
      intervalId = null;
      remaining = seconds;
      self.postMessage({ type: 'tick', remaining });
      break;
  }
};
