/** Presentation links for screening report delivery emails. */
export const DELIVERY_EMAIL_LINKS = {
  website: 'https://www.drlungufamily.ro/',
  booking: null as string | null,
  facebook: 'https://www.facebook.com/share/1BwFhhPkR4/',
  instagram: 'https://www.instagram.com/drlungufamily?igsh=b3M5NTEybHZpZHVm',
  tiktok: 'https://www.tiktok.com/@dr.lungu.family',
} as const;

export function resolveBookingUrl(): string {
  return DELIVERY_EMAIL_LINKS.booking?.trim() || DELIVERY_EMAIL_LINKS.website;
}
