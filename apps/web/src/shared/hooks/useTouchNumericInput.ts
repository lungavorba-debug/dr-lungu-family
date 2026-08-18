import { useEffect, useState } from 'react';

const TOUCH_NUMERIC_QUERY = '(hover: none) and (pointer: coarse)';

function detectTouchNumericInput(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(TOUCH_NUMERIC_QUERY).matches;
}

/** True on phones/tablets where the custom numeric keypad should be used instead of a physical keyboard. */
export function useTouchNumericInput(): boolean {
  const [isTouchNumeric, setIsTouchNumeric] = useState(detectTouchNumericInput);

  useEffect(() => {
    const mediaQuery = window.matchMedia(TOUCH_NUMERIC_QUERY);
    const sync = () => setIsTouchNumeric(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, []);

  return isTouchNumeric;
}

export function scrollMeasurementFieldIntoView(
  element: HTMLElement | null,
  options?: { bottomInsetPx?: number },
): void {
  if (!element || typeof window === 'undefined') return;

  const bottomInset = options?.bottomInsetPx ?? 0;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const topMargin = 16;
      const visibleBottom = viewportHeight - bottomInset - 16;

      if (rect.top >= topMargin && rect.bottom <= visibleBottom) {
        return;
      }

      const targetTop =
        window.scrollY + rect.top - topMargin - Math.max(0, (visibleBottom - topMargin - rect.height) / 4);

      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: 'smooth',
      });
    });
  });
}
