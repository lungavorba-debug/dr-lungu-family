interface OperatorConversationTipProps {
  guide: string;
}

/** Operator-only spoken line — visible on results cards, never in participant PDF. */
export function OperatorConversationTip({ guide }: OperatorConversationTipProps) {
  return (
    <div className="mt-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-800">
        Spuneți participantului
      </p>
      <p className="mt-1 text-sm leading-relaxed text-slate-800">{guide}</p>
    </div>
  );
}
