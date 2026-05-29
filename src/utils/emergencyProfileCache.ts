import type { EmergencyProfile } from '../types';
import { normalizeEmergencyProfile } from './emergencyProfile';

const CACHE_KEY = 'mylife_emergency_profile';

/** Optional session fallback when GET /emergency/profile fails due to network error only. */
export function loadCachedEmergencyProfile(userId: string): EmergencyProfile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: string; profile: EmergencyProfile };
    if (parsed.userId !== userId) return null;
    return normalizeEmergencyProfile(parsed.profile);
  } catch {
    return null;
  }
}

export function cacheEmergencyProfile(userId: string, profile: EmergencyProfile): void {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({ userId, profile }));
}

export function clearEmergencyProfileCache(): void {
  sessionStorage.removeItem(CACHE_KEY);
}
