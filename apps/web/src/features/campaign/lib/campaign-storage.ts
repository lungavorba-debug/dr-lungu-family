const ACTIVE_CAMPAIGN_KEY = 'medscreen_active_campaign';

export function getStoredActiveCampaignId(userId: string): string | null {
  const raw = sessionStorage.getItem(`${ACTIVE_CAMPAIGN_KEY}:${userId}`);
  return raw || null;
}

export function setStoredActiveCampaignId(userId: string, campaignId: string): void {
  sessionStorage.setItem(`${ACTIVE_CAMPAIGN_KEY}:${userId}`, campaignId);
}

export function clearStoredActiveCampaignId(userId: string): void {
  sessionStorage.removeItem(`${ACTIVE_CAMPAIGN_KEY}:${userId}`);
}
