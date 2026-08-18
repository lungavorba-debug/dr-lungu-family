import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useScreeningSession } from '../context/ScreeningSessionContext';
import {
  getCommittedStepForwardRedirect,
  type ScreeningWorkflowStep,
} from '../lib/screening-workflow';

interface ScreeningStepForwardGuardProps {
  step: ScreeningWorkflowStep;
  children: ReactNode;
}

export function ScreeningStepForwardGuard({ step, children }: ScreeningStepForwardGuardProps) {
  const session = useScreeningSession();
  const redirectPath = getCommittedStepForwardRedirect(step, session);

  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}
