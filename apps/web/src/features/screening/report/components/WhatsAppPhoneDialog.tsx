import { useState } from 'react';



import { formatPhoneInput, isValidRomanianPhone } from '@medscreen/shared';



interface WhatsAppPhoneDialogProps {

  onConfirm: (phone: string) => void;

  onCancel: () => void;

}



export function WhatsAppPhoneDialog({ onConfirm, onCancel }: WhatsAppPhoneDialogProps) {

  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);



  function handleConfirm() {

    if (!isValidRomanianPhone(phone)) {

      setError('Introduceți un număr de telefon mobil valid (07xx xxx xxx).');

      return;

    }



    onConfirm(phone);

  }



  return (

    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

        <h2 className="text-lg font-bold text-slate-900">Număr WhatsApp</h2>

        <p className="mt-2 text-sm text-slate-600">

          Participantul nu are telefon salvat. Introduceți numărul pentru trimiterea raportului PDF prin WhatsApp Business.

        </p>



        <label htmlFor="whatsapp-phone" className="mt-4 block text-sm font-medium text-slate-700">

          Telefon participant

        </label>

        <input

          id="whatsapp-phone"

          type="tel"

          inputMode="tel"

          autoComplete="tel"

          value={phone}

          onChange={(event) => {

            setPhone(formatPhoneInput(event.target.value));

            setError(null);

          }}

          placeholder="07xx xxx xxx"

          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"

        />



        {error ? (

          <p role="alert" className="mt-2 text-sm text-red-600">

            {error}

          </p>

        ) : null}



        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

          <button

            type="button"

            onClick={onCancel}

            className="min-h-touch rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"

          >

            Anulează

          </button>

          <button

            type="button"

            onClick={handleConfirm}

            className="min-h-touch rounded-xl bg-brand-primary text-sm font-semibold text-white hover:bg-brand-secondary"

          >

            Trimite pe WhatsApp

          </button>

        </div>

      </div>

    </div>

  );

}

