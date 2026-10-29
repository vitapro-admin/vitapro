import { mkdirSync, writeFileSync } from 'fs'
import { authEmailTemplate, type AuthTemplateKind } from './authTemplates'

const kinds: AuthTemplateKind[] = ['confirm-signup', 'reset-password', 'change-email']

describe('Supabase auth email templates', () => {
  it.each(kinds)('%s links to /auth/confirm with the token hash', (kind) => {
    const { html } = authEmailTemplate(kind)
    expect(html).toContain('{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=')
    expect(html).toContain('{{ .SiteURL }}/email/vitapro-logo.png')
  })

  // Pregeneruje HTML do supabase/email-templates/: WRITE_AUTH_TEMPLATES=1 npx vitest run authTemplates
  it.runIf(process.env.WRITE_AUTH_TEMPLATES)('writes templates for Supabase', () => {
    mkdirSync('supabase/email-templates', { recursive: true })
    for (const kind of kinds) writeFileSync(`supabase/email-templates/${kind}.html`, authEmailTemplate(kind).html + '\n')
  })
})
