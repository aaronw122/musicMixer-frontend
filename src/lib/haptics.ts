import { WebHaptics } from 'web-haptics';

let instance: WebHaptics | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Desktop browsers expose navigator.vibrate but have no haptic hardware, so
// gate on touch capability instead — vibration only does anything on mobile.
function isHapticCapableDevice(): boolean {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return coarsePointer || (navigator.maxTouchPoints ?? 0) > 0;
}

function getHaptics(): WebHaptics | null {
  if (typeof window === 'undefined') return null;
  if (!isHapticCapableDevice()) return null;
  if (prefersReducedMotion()) return null;
  if (!instance) instance = new WebHaptics();
  return instance;
}

export function tickHaptic(): void {
  getHaptics()?.trigger([{ duration: 12, intensity: 0.2 }]);
}

export function buzzHaptic(): void {
  getHaptics()?.trigger('buzz');
}
