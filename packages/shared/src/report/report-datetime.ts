const REPORT_TIME_ZONE = 'Europe/Bucharest';

function capitalizeMonth(dateLine: string): string {
  return dateLine.replace(
    /\b(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\b/i,
    (month) => month.toLowerCase(),
  );
}

/** Real screening date/time for participant reports — never placeholders. */
export function formatScreeningDateTime(isoDate: string): { dateLine: string; timeLine: string } {
  const instant = new Date(isoDate);
  const dateLine = capitalizeMonth(
    new Intl.DateTimeFormat('ro-RO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: REPORT_TIME_ZONE,
    }).format(instant),
  );

  const time = new Intl.DateTimeFormat('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: REPORT_TIME_ZONE,
  }).format(instant);

  return {
    dateLine,
    timeLine: `ora ${time}`,
  };
}
