/**
 * Engine config builder tests.
 * Run: npm run test:clinical-rules
 */
import { buildEngineConfigFromRules, cloneDefaultThresholds } from './build-engine-config';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

const defaults = cloneDefaultThresholds();
const config = buildEngineConfigFromRules(
  'set-1',
  [
    {
      code: 'bp.elevated_systolic',
      enabled: true,
      ruleType: 'threshold',
      thresholdKey: 'bloodPressure.elevatedSystolic',
      thresholdValue: 155,
      recommendationText: null,
      severity: 'elevated',
      category: 'cardiovascular',
    },
    {
      code: 'anamnesis.chest_pain',
      enabled: false,
      ruleType: 'anamnesis',
      thresholdKey: null,
      thresholdValue: null,
      recommendationText: null,
      severity: 'critical',
      category: 'anamnesis',
    },
    {
      code: 'recommendation.general_follow_up',
      enabled: true,
      ruleType: 'recommendation',
      thresholdKey: null,
      thresholdValue: null,
      recommendationText: 'Mesaj personalizat follow-up.',
      severity: 'info',
      category: 'general',
    },
  ],
  { isDemo: false },
);

assert('overrides threshold from active rules', config.thresholds.bloodPressure.elevatedSystolic === 155);
assert('keeps non-overridden defaults', config.thresholds.pulse.high === defaults.pulse.high);
assert('tracks enabled rule codes', config.enabledRuleCodes.has('bp.elevated_systolic'));
assert('excludes disabled rules', !config.enabledRuleCodes.has('anamnesis.chest_pain'));
assert('loads recommendation overrides', config.recommendationOverrides.length === 1);
