import { WebHaptics } from 'web-haptics';

let instance: WebHaptics | null = null;

function getHaptics(): WebHaptics | null {
  if (typeof window === 'undefined') return null;
  if (!instance) instance = new WebHaptics();
  return instance;
}

export function tickHaptic(): void {
  getHaptics()?.trigger([{ duration: 12, intensity: 0.2 }]);
}

export function buzzHaptic(): void {
  getHaptics()?.trigger('buzz');
}
