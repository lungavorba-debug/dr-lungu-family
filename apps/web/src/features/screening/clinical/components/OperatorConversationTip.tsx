interface OperatorConversationTipProps {
  guide: string;
}

/** Expandable operator-only conversation hint — not used in participant PDF. */
export function OperatorConversationTip({ guide }: OperatorConversationTipProps) {
  return (
    <details className="mt-2 rounded-lg border border-sky-100 bg-sky-50/80 open:bg-sky-50">
      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-sky-900 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true">💬</span>
          <span>Ghid conversație pentru operator</span>
          <span className="font-normal text-sky-700">(apasă pentru detalii)</span>
        </span>
      </summary>
      <p className="border-t border-sky-100 px-3 py-2 text-xs leading-relaxed text-slate-700">{guide}</p>
    </details>
  );
}
