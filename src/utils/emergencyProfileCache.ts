import type { EmergencyProfile } from '../types';

const CACHE_KEY = 'mylife_emergency_profile';

/** Session-only cache for owner profile (backend has no GET /emergency/profile). */
export function loadCachedEmergencyProfile(userId: string): EmergencyProfile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { userId: string; profile: EmergencyProfile };
    return parsed.userId === userId ? parsed.profile : null;
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
