/** Preset localities for screening — extend this list as needed. */
export const SCREENING_LOCALITIES = [
  'Corbeni',
  'Albeștii de Argeș',
  'Căpățâneni',
  'Curtea de Argeș',
  'Pitești',
  'București',
  'Turist',
  'Altă localitate',
] as const;

export type ScreeningLocality = (typeof SCREENING_LOCALITIES)[number];

export const OTHER_LOCALITY_OPTION: ScreeningLocality = 'Altă localitate';

export function isPresetLocality(city: string): city is ScreeningLocality {
  return (SCREENING_LOCALITIES as readonly string[]).includes(city);
}
