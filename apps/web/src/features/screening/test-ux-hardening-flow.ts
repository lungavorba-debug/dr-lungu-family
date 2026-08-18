import {

  clearScreeningWorkflow,

  loadScreeningWorkflow,

  persistScreeningWorkflow,

} from './lib/screening-session-storage.ts';

import {

  getCommittedStepForwardRedirect,

  resolveScreeningWorkflowStep,

} from './lib/screening-workflow.ts';



function assert(name: string, ok: boolean, detail = '') {

  console.log(`UX: ${name}`, ok ? 'PASS' : 'FAIL', detail);

  if (!ok) {

    process.exitCode = 1;

  }

}



class MemoryStorage {

  private store = new Map<string, string>();



  getItem(key: string): string | null {

    return this.store.get(key) ?? null;

  }



  setItem(key: string, value: string): void {

    this.store.set(key, value);

  }



  removeItem(key: string): void {

    this.store.delete(key);

  }

}



const memoryStorage = new MemoryStorage();

(globalThis as { localStorage: Storage; sessionStorage: Storage }).localStorage =

  memoryStorage as unknown as Storage;

(globalThis as { sessionStorage: Storage }).sessionStorage =

  memoryStorage as unknown as Storage;



const userId = 'operator-1';

const patient = {

  id: '11111111-2222-3333-4444-555555555555',

  first_name: 'Ion',

  last_name: 'Popescu',

  phone: '0722123456',

  age: 45,

  gender: 'M' as const,

  city: 'Pitești',

  created_at: '2026-07-31T10:00:00.000Z',

};



const anamnesis = {
  chief_complaint: '',
  symptoms: '',
  medical_history: '',
  medications: '',
  allergies: '',
  smoking_status: 'never' as const,
  alcohol_consumption: 'none' as const,
  family_history: '',
  lifestyle: '',
  risk_factors: '',
  known_hypertension: false,
  known_diabetes: false,
  chest_pain: 'none',
  dyspnea: false,
  snoring: false,
  follows_treatment: false,
  current_treatment: '',
  free_notes: '',
  clinical_summary: '',
};



const measurements = {

  systolic_bp: 150,

  diastolic_bp: 90,

  pulse: 72,

  oxygen_saturation: 98,

  blood_glucose: 105,

  blood_glucose_status: 'fasting' as const,

  weight_kg: 80,

  height_cm: 178,

  bmi: 25.25,

  ideal_weight_kg: 73.4,

  waist_circumference_cm: 94,

  known_hypertension: false,

  known_diabetes: false,

  current_antihypertensive_treatment: false,

};



const clinicalEngineInput = {

  screening_id: 'eeeeeeee-ffff-0000-1111-222222222222',

  patient_id: patient.id,

  campaign_id: '11111111-1111-4111-8111-111111111111',

  captured_at: '2026-07-31T12:00:00.000Z',

  measurements,

};



persistScreeningWorkflow(userId, {
  activePatient: patient,
  anamnesis,
  measurements,
  clinicalEngineInput,
  clinicalEvaluation: null,
  measurementsDraft: null,
  is_completed: false,
});



const restored = loadScreeningWorkflow(userId);

assert('workflow snapshot restored from localStorage', restored?.activePatient.id === patient.id);

assert('workflow snapshot has measurements', restored?.measurements?.systolic_bp === 150);



clearScreeningWorkflow(userId);

assert('workflow snapshot cleared', loadScreeningWorkflow(userId) === null);



const savedSession = {

  activePatient: patient,

  anamnesis,

  measurements,

  clinicalEngineInput,

  clinicalEvaluation: null,

  generatedPdf: null,

  participantSignature: null,

};



assert(

  'furthest step after measurements save is results',

  resolveScreeningWorkflowStep(savedSession) === 'results',

);



assert(

  'conversation back-nav redirects to results when measurements saved',

  getCommittedStepForwardRedirect('conversation', savedSession) === '/screening/results',

);



assert(

  'measurements back-nav redirects to results when already saved',

  getCommittedStepForwardRedirect('measurements', savedSession) === '/screening/results',

);



const conversationOnlySession = {

  activePatient: null,

  anamnesis: null,

  measurements: null,

  clinicalEngineInput: null,

  clinicalEvaluation: null,

  generatedPdf: null,

  participantSignature: null,

};



assert(

  'empty session stays on conversation',

  getCommittedStepForwardRedirect('conversation', conversationOnlySession) === null,

);



const patientOnlySession = {

  activePatient: patient,

  anamnesis: null,

  measurements: null,

  clinicalEngineInput: null,

  clinicalEvaluation: null,

  generatedPdf: null,

  participantSignature: null,

};



assert(

  'patient registered redirects forward to anamnesis',

  getCommittedStepForwardRedirect('conversation', patientOnlySession) ===

    '/screening/anamnesis',

);



const conversationCompletedSession = {

  activePatient: patient,

  anamnesis,

  measurements: null,

  clinicalEngineInput: null,

  clinicalEvaluation: null,

  generatedPdf: null,

  participantSignature: null,

};



assert(

  'anamnesis completed redirects forward to measurements',

  getCommittedStepForwardRedirect('conversation', conversationCompletedSession) ===

    '/screening/measurements',

);



const completedWorkflowSession = {

  activePatient: patient,

  anamnesis,

  measurements,

  clinicalEngineInput,

  clinicalEvaluation: null,

  generatedPdf: null,

  participantSignature: null,

  isCompleted: true,

};



assert(

  'completed workflow redirects in-progress steps to fresh screening',

  getCommittedStepForwardRedirect('conversation', completedWorkflowSession) === '/screening',

);



persistScreeningWorkflow(userId, {

  activePatient: patient,

  anamnesis,

  measurements: null,

  clinicalEngineInput: null,

  clinicalEvaluation: null,

  measurementsDraft: {

    systolic_bp: '140',

    diastolic_bp: '90',

    pulse: '',

    oxygen_saturation: '',

    blood_glucose: '',

    blood_glucose_status: '',

    weight_kg: '',

    height_cm: '',

    bmi: '',

    ideal_weight_kg: '',

    waist_circumference_cm: '',

    known_hypertension: null,

    known_diabetes: null,

    current_antihypertensive_treatment: null,

  },

  is_completed: false,

});



const draftRestored = loadScreeningWorkflow(userId);

assert(

  'measurements draft restored from localStorage',

  draftRestored?.measurementsDraft?.systolic_bp === '140',

);



if (process.exitCode === 1) {

  throw new Error('UX hardening tests failed');

}



console.log('UX hardening tests completed successfully.');

