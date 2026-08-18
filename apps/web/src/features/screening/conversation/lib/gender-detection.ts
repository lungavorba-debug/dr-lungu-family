import type { PatientGender } from '@medscreen/types';

const FEMALE_FIRST_NAMES = new Set([
  'maria',
  'elena',
  'ioana',
  'ana',
  'andreea',
  'cristina',
  'diana',
  'gabriela',
  'irina',
  'laura',
  'mihaela',
  'monica',
  'nicoleta',
  'oana',
  'raluca',
  'simona',
  'teodora',
  'viorica',
  'adriana',
  'alexandra',
  'carmen',
  'daniela',
  'florina',
  'georgiana',
  'loredana',
  'madalina',
  'rodica',
  'silvia',
  'stefania',
  'valentina',
]);

const MALE_FIRST_NAMES = new Set([
  'ion',
  'andrei',
  'mihai',
  'alexandru',
  'adrian',
  'bogdan',
  'catalin',
  'cristian',
  'dan',
  'daniel',
  'dragos',
  'florin',
  'george',
  'gheorghe',
  'ionut',
  'marius',
  'nicolae',
  'paul',
  'radu',
  'sergiu',
  'stefan',
  'vasile',
  'victor',
  'vlad',
  'cosmin',
  'dumitru',
  'emil',
  'gabriel',
  'laurentiu',
  'lucian',
  'marian',
  'petru',
  'razvan',
  'sorin',
  'tudor',
]);

/** Returns probable gender when confidence is high; otherwise null. */
export function detectProbableGender(firstName: string): PatientGender | null {
  const normalized = firstName.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const token = normalized.split(/[\s-]+/)[0] ?? '';
  if (!token) {
    return null;
  }

  if (FEMALE_FIRST_NAMES.has(token)) {
    return 'F';
  }

  if (MALE_FIRST_NAMES.has(token)) {
    return 'M';
  }

  return null;
}
