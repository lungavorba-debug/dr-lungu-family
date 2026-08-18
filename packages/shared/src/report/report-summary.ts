/** Premium rezumat block — max four lines, plain Romanian. */
export function buildReportSummaryLines(hasFindings: boolean): string[] {
  if (hasFindings) {
    return [
      'În urma screeningului efectuat astăzi au fost identificate câteva valori care necesită monitorizare și evaluare medicală.',
      'Depistarea precoce a factorilor de risc contribuie la prevenirea bolilor cardiovasculare.',
    ];
  }

  return [
    'În urma screeningului efectuat astăzi, valorile măsurate nu indică anomalii importante în cadrul acestui screening.',
    'Depistarea precoce a factorilor de risc contribuie la prevenirea bolilor cardiovasculare.',
  ];
}
