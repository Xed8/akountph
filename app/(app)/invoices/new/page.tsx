import { requireOrg } from '@/lib/auth/require-org'
import { InvoiceForm } from '@/components/invoice-form'

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client_id?: string }>
}) {
  const { client_id } = await searchParams
  const { supabase, orgId } = await requireOrg()

  const [{ data: clients }, { data: items }, { data: org }] = await Promise.all([
    supabase
      .from('clients')
      .select('id, name, is_vat_registered')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('items')
      .select('id, name, unit, sale_price, is_vat_exempt')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('organizations')
      .select('vat_registered, invoice_terms, invoice_notes')
      .eq('id', orgId)
      .single(),
  ])

  return (
    <InvoiceForm
      clients={clients ?? []}
      items={items ?? []}
      orgVatRegistered={org?.vat_registered ?? false}
      defaultTerms={org?.invoice_terms ?? 'Due on receipt'}
      defaultClientId={client_id}
    />
  )
}
