'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Field, FormError } from '@/components/form/Field'
import { SubmitButton } from '@/components/form/SubmitButton'
import type { Address } from '@/lib/types'
import { saveAddressAction, type AccountFormState } from './actions'

export function AddressForm({ address, onDone }: { address?: Address; onDone?: () => void }) {
  const [state, action] = useActionState<AccountFormState, FormData>(saveAddressAction, {})
  const formRef = useRef<HTMLFormElement>(null)
  const e = state.fields ?? {}

  useEffect(() => {
    if (state.ok) {
      if (!address) formRef.current?.reset()
      onDone?.()
    }
  }, [state, address, onDone])

  const a = address
  return (
    <form ref={formRef} action={action} className="space-y-4">
      <FormError message={state.error} />
      {a && <input type="hidden" name="id" value={a.id} />}
      <Field label="Ulica a číslo" name="street" required defaultValue={a?.street} error={e.street} />
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr_1.2fr]">
        <Field label="PSČ" name="zip" required defaultValue={a?.zip} error={e.zip} />
        <Field label="Mesto" name="city" required defaultValue={a?.city} error={e.city} />
        <Field label="Krajina" name="country" defaultValue={a?.country ?? 'Slovensko'} error={e.country} />
      </div>
      <Field
        label="Názov prevádzky"
        name="company"
        placeholder="napr. Bistro Jablko – centrum"
        defaultValue={a?.company || a?.label}
        error={e.company}
        hint="Pod týmto názvom si adresu vyberiete pri objednávke a uvidí ho aj vodič."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kontakt pri preberaní" name="contact_name" defaultValue={a?.contact_name} error={e.contact_name} />
        <Field label="Telefón" name="contact_phone" type="tel" defaultValue={a?.contact_phone} error={e.contact_phone} />
      </div>
      <Field label="Poznámka pre dopravcu" name="note" placeholder="napr. vstup z dvora, rampa do 14:00" defaultValue={a?.note} error={e.note} />
      <div className="flex gap-3">
        <SubmitButton pendingText="Ukladám…">{a ? 'Uložiť zmeny' : 'Pridať adresu'}</SubmitButton>
        {onDone && (
          <button type="button" onClick={onDone} className="btn btn-ghost">
            Zrušiť
          </button>
        )}
      </div>
    </form>
  )
}
