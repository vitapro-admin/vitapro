import { settingsSchema } from './validation'
import { splitEmails } from './emailList'

const base = {
  sales_name: 'Zákaznícka linka',
  sales_email: 'hotline@aquapro.sk',
  sales_phone: '0800 111 888',
  auto_approve_known_ico: false,
  crate_sku: '',
  crate_erp_name: '',
  cancel_window_minutes: 120,
}

describe('notification email lists', () => {
  it('splits on commas, semicolons and spaces', () => {
    expect(splitEmails(' A@x.sk; b@y.sk ,c@z.sk ')).toEqual(['a@x.sk', 'b@y.sk', 'c@z.sk'])
  })

  it('accepts several addresses and normalizes them', () => {
    const r = settingsSchema.parse({ ...base, order_email: 'hotline@aquapro.sk;Jana@aquapro.sk', registration_notify_email: 'x@y.sk, x@y.sk' })
    expect(r.order_email).toBe('hotline@aquapro.sk, jana@aquapro.sk')
    expect(r.registration_notify_email).toBe('x@y.sk')
  })

  it('rejects an invalid address in the list', () => {
    expect(settingsSchema.safeParse({ ...base, order_email: 'ok@x.sk, zle', registration_notify_email: 'a@b.sk' }).success).toBe(false)
  })
})
