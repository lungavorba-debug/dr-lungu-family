export interface CampaignReportInfo {
  name: string;
  edition?: string | null;
  description?: string | null;
  work_point: string;
}

function normalizeEdition(edition: string): string {
  const trimmed = edition.trim();
  const match = trimmed.match(/^edi[tț]ia\s*(?:a\s*)?(.+)$/i);
  if (match) {
    const value = match[1].trim();
    if (/^XIII$/i.test(value)) return 'Ediția a XIII-a';
    if (/^a\s+/i.test(value)) return `Ediția ${value}`;
    return `Ediția a ${value}`;
  }
  return `Ediția ${trimmed}`;
}

function resolveSponsorLine(description: string | null | undefined, campaignName: string): string | null {
  if (!description) {
    if (/tradiții argeșene/i.test(campaignName)) {
      return 'Primăriei Comunei Corbeni';
    }
    return null;
  }

  const trimmed = description.trim();
  if (/primărie|comunei|sprijin/i.test(trimmed)) {
    if (trimmed.length <= 80 && !trimmed.includes('—') && !trimmed.includes(' - ')) {
      return trimmed;
    }
    const match = trimmed.match(/primăriei[^.]+/i);
    if (match) {
      return match[0].trim();
    }
  }

  if (/tradiții argeșene/i.test(campaignName)) {
    return 'Primăriei Comunei Corbeni';
  }

  return null;
}

export function buildCampaignEventDisplay(campaign: CampaignReportInfo): {
  title: string;
  editionLine: string | null;
  sponsorLine: string | null;
} {
  const sponsorLine = resolveSponsorLine(campaign.description, campaign.name);

  return {
    title: campaign.name.trim(),
    editionLine: campaign.edition ? normalizeEdition(campaign.edition) : null,
    sponsorLine,
  };
}
