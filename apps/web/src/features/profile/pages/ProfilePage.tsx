import { useRef, useState, type FormEvent } from 'react';
import type { UserProfile } from '@medscreen/types';
import { updateUserProfileSchema } from '@medscreen/shared';
import { ApiClientError } from '../../../shared/lib/api-client';
import { useMyProfile, useUpdateMyProfile } from '../hooks/useProfile';
import { DashboardPageHeader } from '../../dashboard/components/DashboardPageHeader';

interface ProfileFormProps {
  profile: UserProfile;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Fișier invalid.'));
        return;
      }
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Fișier invalid.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Nu s-a putut citi fișierul.'));
    reader.readAsDataURL(file);
  });
}

export function ProfilePage({ profile }: ProfileFormProps) {
  const updateProfile = useUpdateMyProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(profile.first_name);
  const [lastName, setLastName] = useState(profile.last_name);
  const [medicalSpecialty, setMedicalSpecialty] = useState(profile.medical_specialty ?? '');
  const [professionalTitle, setProfessionalTitle] = useState(profile.professional_title ?? '');
  const [licenseNumber, setLicenseNumber] = useState(profile.license_number ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    profile.avatar_image_base64 && profile.avatar_mime_type
      ? `data:${profile.avatar_mime_type};base64,${profile.avatar_image_base64}`
      : null,
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    profile.signature_image_base64 && profile.signature_mime_type
      ? `data:${profile.signature_mime_type};base64,${profile.signature_image_base64}`
      : null,
  );
  const [avatarPayload, setAvatarPayload] = useState<{
    base64: string | null;
    mime: string | null;
  } | null>(null);
  const [signaturePayload, setSignaturePayload] = useState<{
    base64: string | null;
    mime: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleImageSelect(
    file: File | undefined,
    kind: 'avatar' | 'signature',
  ): Promise<void> {
    if (!file) return;

    if (file.size > 500_000) {
      setError('Imaginea este prea mare (maxim 500 KB).');
      return;
    }

    const base64 = await fileToBase64(file);
    const preview = `data:${file.type};base64,${base64}`;
    const payload = { base64, mime: file.type };

    if (kind === 'avatar') {
      setAvatarPreview(preview);
      setAvatarPayload(payload);
    } else {
      setSignaturePreview(preview);
      setSignaturePayload(payload);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        medical_specialty: medicalSpecialty.trim() || null,
        professional_title: professionalTitle.trim() || null,
        license_number: licenseNumber.trim() || null,
        phone: phone.trim() || null,
        ...(avatarPayload
          ? {
              avatar_image_base64: avatarPayload.base64,
              avatar_mime_type: avatarPayload.mime,
            }
          : {}),
        ...(signaturePayload
          ? {
              signature_image_base64: signaturePayload.base64,
              signature_mime_type: signaturePayload.mime,
            }
          : {}),
      };

      const parsed = updateUserProfileSchema.safeParse(payload);
      if (!parsed.success) {
        setError(parsed.error.errors[0]?.message ?? 'Datele profilului nu sunt valide.');
        return;
      }

      await updateProfile.mutateAsync(parsed.data);
      setSuccess('Profilul a fost salvat.');
    } catch (mutationError) {
      setError(
        mutationError instanceof ApiClientError
          ? mutationError.message
          : 'Profilul nu a putut fi salvat.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Profil profesional"
        description="Informații personale, specialitate medicală și semnătură digitală."
      />

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Date personale</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Prenume</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Nume</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
                required
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Email</span>
              <input value={profile.email} disabled className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-slate-500" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Telefon</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Informații profesionale</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Titlu profesional</span>
              <input
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
                placeholder="Dr., Asist. med."
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Specialitate medicală</span>
              <input
                value={medicalSpecialty}
                onChange={(e) => setMedicalSpecialty(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
                placeholder="Cardiologie"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Număr parafă / licență</span>
              <input
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-300 px-3"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Avatar și semnătură</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Avatar</p>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    —
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-primary"
                >
                  Încarcă imagine
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleImageSelect(e.target.files?.[0], 'avatar')}
                />
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Semnătură digitală</p>
              <div className="flex items-center gap-4">
                {signaturePreview ? (
                  <img src={signaturePreview} alt="Semnătură" className="h-16 max-w-[160px] rounded border border-slate-200 bg-white object-contain p-1" />
                ) : (
                  <div className="flex h-16 w-40 items-center justify-center rounded border border-dashed border-slate-200 text-slate-400">
                    —
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => signatureInputRef.current?.click()}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-brand-primary"
                >
                  Încarcă semnătură
                </button>
                <input
                  ref={signatureInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => void handleImageSelect(e.target.files?.[0], 'signature')}
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={updateProfile.isPending}
          className="inline-flex min-h-touch items-center rounded-xl bg-brand-primary px-6 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60"
        >
          {updateProfile.isPending ? 'Se salvează...' : 'Salvează profilul'}
        </button>
      </form>
    </div>
  );
}

export function ProfilePageContainer() {
  const { data, isLoading, isError, error, refetch } = useMyProfile();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Se încarcă profilul...
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-sm text-red-700">
          {error instanceof Error ? error.message : 'Profilul nu a putut fi încărcat.'}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 text-sm font-semibold text-brand-primary hover:underline"
        >
          Reîncearcă
        </button>
      </div>
    );
  }

  return <ProfilePage profile={data.profile} />;
}
