const FINDING_DISPLAY: Record<string, string> = {
  'tensiune arterială crescută': 'Tensiune arterială peste valorile recomandate',
  'exces ponderal': 'Exces ponderal',
  'circumferință abdominală crescută': 'Circumferință abdominală crescută',
  'glicemie crescută': 'Glicemie peste valorile recomandate',
  'saturație scăzută de oxigen': 'Saturație de oxigen sub valorile recomandate',
  'puls în afara intervalului obișnuit': 'Puls în afara intervalului obișnuit',
  'durere în piept declarată': 'Durere în piept raportată',
  'fumat declarat': 'Fumat raportat',
};

const RESPIRATORY_OBSERVATIONS = new Set(['lipsă de aer declarată', 'sforăit frecvent declarat']);

function capitalizeFirst(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** Map internal observations to participant-facing finding labels (spec §4.2). */
export function buildParticipantFindingLabels(observations: string[]): string[] {
  const findings: string[] = [];
  let hasRespiratory = false;

  for (const observation of observations) {
    if (RESPIRATORY_OBSERVATIONS.has(observation)) {
      hasRespiratory = true;
      continue;
    }
    findings.push(FINDING_DISPLAY[observation] ?? capitalizeFirst(observation));
  }

  if (hasRespiratory) {
    findings.push('Simptome respiratorii raportate');
  }

  return findings;
}
