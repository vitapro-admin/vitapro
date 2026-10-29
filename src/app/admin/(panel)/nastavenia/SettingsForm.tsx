'use client'

import { useActionState } from 'react'
import { saveSettingsAction, type AdminFormState } from '@/app/admin/actions'
import { Field, FormError, FormNotice } from '@/components/form/Field'
import { SubmitButton } from '@/components/form/SubmitButton'
import type { Settings } from '@/lib/types'

export function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action] = useActionState<AdminFormState, FormData>(saveSettingsAction, {})
  const e = state.fields ?? {}
  return (
    <form action={action} className="max-w-2xl space-y-10">
      <FormError message={state.error} />
      {state.ok && <FormNotice>{state.message}</FormNotice>}

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-5 text-ink-mute">Emaily</legend>
        <Field label="Kam chodia objednávky" name="order_email" type="text" inputMode="email" required defaultValue={s.order_email} error={e.order_email} hint="Sem chodí každá nová objednávka, zrušenie a ukončenie pravidelnej dodávky. Viac adries oddeľte čiarkou." />
        <Field label="Kam chodia nové registrácie" name="registration_notify_email" type="text" inputMode="email" required defaultValue={s.registration_notify_email} error={e.registration_notify_email} hint="Viac adries oddeľte čiarkou." />
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-5 text-ink-mute">Kontakt na obchodné oddelenie (zobrazuje sa na webe)</legend>
        <Field label="Názov" name="sales_name" required defaultValue={s.sales_name} error={e.sales_name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email" name="sales_email" type="email" required defaultValue={s.sales_email} error={e.sales_email} hint="Zobrazuje sa na webe a sem idú odpovede zákazníkov na potvrdenia." />
          <Field label="Telefón" name="sales_phone" type="tel" defaultValue={s.sales_phone} error={e.sales_phone} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="eyebrow mb-5 text-ink-mute">Schvaľovanie</legend>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="auto_approve_known_ico" defaultChecked={s.auto_approve_known_ico} className="mt-0.5 h-4 w-4 accent-ink" />
          <span>
            Automaticky schváliť registráciu, ak je IČO v zozname klientov
            <span className="block text-ink-mute">Odporúčanie: nechať vypnuté – IČO je verejný údaj.</span>
          </span>
        </label>
        <p className="text-sm text-ink-mute">Veľkosť prepravky: {s.crate_size} ks (mení sa v databáze).</p>
        <div className="grid gap-5 pt-2 sm:grid-cols-[1fr_2fr]">
          <Field label="ID prepravky v ActiWhere" name="crate_sku" defaultValue={s.crate_sku} error={e.crate_sku} hint="Prázdne = prepravky sa do objednávky nepridávajú." />
          <Field label="Názov prepravky v ActiWhere" name="crate_erp_name" defaultValue={s.crate_erp_name} error={e.crate_erp_name} />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="eyebrow mb-5 text-ink-mute">Zrušenie objednávky zákazníkom</legend>
        <Field
          label="Lehota na zrušenie (minúty od odoslania)"
          name="cancel_window_minutes"
          type="number"
          min={0}
          max={10080}
          required
          defaultValue={s.cancel_window_minutes}
          error={e.cancel_window_minutes}
          hint="Napr. 120 = 2 hodiny. Objednávky nespracúvajte skôr, než lehota uplynie. 0 = zákazník nemôže rušiť."
          className="max-w-xs"
        />
      </fieldset>

      <SubmitButton pendingText="Ukladám…">Uložiť nastavenia</SubmitButton>
    </form>
  )
}
