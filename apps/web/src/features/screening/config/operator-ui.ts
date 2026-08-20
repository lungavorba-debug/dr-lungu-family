/**
 * Operator AI assistant (voice/transcript widget).
 * Disabled in production UI until stable on all mobile browsers.
 * Backend/hook code remains available for future enablement.
 */
export const OPERATOR_AI_ASSISTANT_ENABLED = false;

/** Hide shell footer (contact/GDPR) during active screening workflow. */
export function shouldHideShellFooter(pathname: string): boolean {
  return pathname.startsWith('/screening');
}
