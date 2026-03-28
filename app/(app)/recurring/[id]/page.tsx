import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireOrg } from '@/lib/auth/require-org'
import { updateRecurringTemplate } from '@/app/actions/recurring'
import { RecurringForm } from '@/components/recurring-form'
import { centavosToDisplay } from '@/lib/formatting/currency'

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: tmpl }, { data: clients }, { data: vendors }, { data: categories }] = await Promise.all([
    supabase
      .from('recurring_templates')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single(),
    supabase.from('clients').select('id, name').eq('organization_id', orgId).is('deleted_at', null).order('name'),
    supabase.from('vendors').select('id, name, default_ewt_rate').eq('organization_id', orgId).is('deleted_at', null).order('name'),
    supabase.from('expense_categories').select('id, name, type').eq('organization_id', orgId).order('name'),
  ])

  if (!tmpl) notFound()

  // Convert centavos to peso string for the form
  const amountPesos = (tmpl.amount / 100).toFixed(2)

  const boundAction = updateRecurringTemplate.bind(null, id)

  return (
    <div className="p-8 max-w-xl">
      <Link href="/recurring" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Recurring
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Template</h1>
      <RecurringForm
        action={boundAction}
        clients={clients ?? []}
        vendors={(vendors ?? []).map(v => ({ ...v, default_ewt_rate: Number(v.default_ewt_rate ?? 0) }))}
        categories={categories ?? []}
        defaultValues={{
          type: tmpl.type as 'invoice' | 'bill',
          name: tmpl.name,
          client_id: tmpl.client_id ?? null,
          vendor_id: tmpl.vendor_id ?? null,
          category_id: tmpl.category_id ?? null,
          description: tmpl.description ?? '',
          amount: amountPesos,
          has_vat: tmpl.has_vat ?? false,
          ewt_rate: String(tmpl.ewt_rate ?? 0),
          frequency: tmpl.frequency,
          next_due: tmpl.next_due,
        }}
        submitLabel="Save Changes"
      />
    </div>
  )
}
