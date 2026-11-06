export const LAUNCH_CREATOR_LIMIT = 30;

export function launchSpotsRemaining(awardedCount: number) {
  if (!Number.isFinite(awardedCount)) return LAUNCH_CREATOR_LIMIT;
  return Math.max(0, LAUNCH_CREATOR_LIMIT - Math.max(0, Math.floor(awardedCount)));
}
