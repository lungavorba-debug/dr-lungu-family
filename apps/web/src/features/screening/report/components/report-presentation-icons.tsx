import type { SVGProps } from 'react';

export type LucideProps = SVGProps<SVGSVGElement> & { className?: string };

function icon(className = 'h-3.5 w-3.5') {
  return className;
}

export function IconUser({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M20 21a8 8 0 0 0-16 0" strokeLinecap="round" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

export function IconUsers({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalendar({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

export function IconClock({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconPhone({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMapPin({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" strokeLinecap="round" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

export function IconMail({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlobe({ className = icon(), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeartPulse({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path
        d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.566Z"
        strokeLinecap="round"
      />
      <path d="M3 13h2l1.5-3 2 6 1.5-3H12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconStethoscope({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M4.8 10.7V6.3a2 2 0 0 1 2-2h2.7" strokeLinecap="round" />
      <path d="M8.5 4.3h2.7a2 2 0 0 1 2 2v4.4" strokeLinecap="round" />
      <path d="M8.5 10.7h-1.7a4 4 0 0 0 0 8h1.7" strokeLinecap="round" />
      <path d="M17.5 14.7a3 3 0 1 0 0-6" strokeLinecap="round" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

export function IconWalking({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="13" cy="4.5" r="2" />
      <path d="m7 21 3-6 2.5 1 3.5-7 2 1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 21h12" strokeLinecap="round" />
    </svg>
  );
}

export function IconBloodDrop({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path
        d="M12 22c4.5-5.2 7-8.7 7-12.2a7 7 0 0 0-14 0c0 3.5 2.5 7 7 12.2Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconBloodPressure({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="8" width="18" height="10" rx="2" />
      <path d="M7 8V6a5 5 0 0 1 10 0v2M12 12v3" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlucose({ className = icon('h-4 w-4'), ...props }: LucideProps) {
  return IconBloodDrop({ className, ...props });
}

export function IconQrCode({ className = icon('h-6 w-6'), ...props }: LucideProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <path d="M14 14h2v2h-2v-2Zm4 0h2v2h-2v-2Zm-4 4h2v2h-2v-2Zm4 0h2v2h-2v-2Z" strokeLinecap="round" />
    </svg>
  );
}
