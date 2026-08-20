import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getCommittedStepForwardRedirect,
  SCREENING_STEP_PATH,
} from './lib/screening-workflow.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), 'utf8');
}

function assert(label: string, condition: boolean): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${label}`);
  }
  console.log(`  ok: ${label}`);
}

const operatorUiSource = read('config/operator-ui.ts');
const mainLayoutSource = read('../shell/components/MainLayout.tsx');
const anamnesisPage = read('pages/ScreeningAnamnesisPage.tsx');
const conversationPage = read('pages/ScreeningConversationPage.tsx');
const measurementsPage = read('measurements/pages/ScreeningMeasurementsPage.tsx');
const resultsPage = read('clinical/pages/ScreeningResultsPage.tsx');
const widgetSource = read('conversation/components/AiFloatingWidget.tsx');
const orchestratorSource = read('conversation/services/conversation-orchestrator.ts');
const anamnesisHookSource = read('conversation/hooks/useScreeningAnamnesis.ts');
const routerSource = read('../../app/router.tsx');

console.log('AI assistant verification');

assert('operator UI disables AI assistant', operatorUiSource.includes('OPERATOR_AI_ASSISTANT_ENABLED = false'));
assert('anamnesis page gates widget behind flag', anamnesisPage.includes('OPERATOR_AI_ASSISTANT_ENABLED'));
assert('conversation page gates voice assistant behind flag', conversationPage.includes('OPERATOR_AI_ASSISTANT_ENABLED'));
assert('measurements page gates voice assistant behind flag', measurementsPage.includes('OPERATOR_AI_ASSISTANT_ENABLED'));
assert('results page does not render widget', !resultsPage.includes('AiFloatingWidget'));
assert('shell footer hidden during screening', mainLayoutSource.includes('shouldHideShellFooter'));
assert('widget portals to document.body', widgetSource.includes('createPortal(widget, document.body)'));
assert('widget exposes Start control', widgetSource.includes('onStart'));
assert('widget exposes Pause control', widgetSource.includes('onPause'));
assert('widget exposes Resume control', widgetSource.includes('onResume'));
assert('widget exposes Stop control', widgetSource.includes('onStop'));
assert('anamnesis hook wires startRecording', anamnesisHookSource.includes('startRecording'));
assert('orchestrator supports pause and resume', orchestratorSource.includes('pauseRecording') && orchestratorSource.includes('resumeRecording'));
assert('orchestrator runs incremental extraction', orchestratorSource.includes('runIncrementalExtraction'));
assert('router exposes /screening/anamnesis', routerSource.includes("path: 'screening/anamnesis'"));
assert(
  'conversation navigates to anamnesis',
  conversationPage.includes("navigate('/screening/anamnesis')"),
);

const patientOnlySession = {
  activePatient: {
    id: 'p1',
    first_name: 'Ion',
    last_name: 'Popescu',
    phone: '0712345678',
    age: 45,
    gender: 'M' as const,
    city: 'Pitești',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  },
  anamnesis: null,
  measurements: null,
  clinicalEngineInput: null,
  clinicalEvaluation: null,
  generatedPdf: null,
  participantSignature: null,
};

assert(
  'anamnesis step is reachable after demographics',
  getCommittedStepForwardRedirect('anamnesis', patientOnlySession) === null,
);
assert(
  'conversation step forwards to anamnesis when patient exists',
  getCommittedStepForwardRedirect('conversation', patientOnlySession) === SCREENING_STEP_PATH.anamnesis,
);

console.log('AI assistant verification passed');
