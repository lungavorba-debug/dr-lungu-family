import { useClinicSettings } from '../../settings/context/ClinicSettingsContext';

export function AppFooter() {
  const { settings } = useClinicSettings();

  if (!settings) return null;

  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-700">{settings.clinic.name}</p>
          <p>{settings.contact.phone} · {settings.contact.email}</p>
        </div>
        <div className="max-w-xl">
          {settings.footer.disclaimer_paragraphs.slice(0, 1).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {settings.footer.footer_text ? <p className="mt-1">{settings.footer.footer_text}</p> : null}
        </div>
      </div>
    </footer>
  );
}
