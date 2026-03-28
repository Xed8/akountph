import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrg } from '@/lib/auth/require-org'
import { createRecurringTemplate } from '@/app/actions/recurring'
import { RecurringForm } from '@/components/recurring-form'

export default async function NewRecurringPage() {
  const { supabase, orgId } = await requireOrg()

  const [{ data: clients }, { data: vendors }, { data: categories }] = await Promise.all([
    supabase.from('clients').select('id, name').eq('organization_id', orgId).is('deleted_at', null).order('name'),
    supabase.from('vendors').select('id, name, default_ewt_rate').eq('organization_id', orgId).is('deleted_at', null).order('name'),
    supabase.from('expense_categories').select('id, name, type').eq('organization_id', orgId).order('name'),
  ])

  return (
    <div className="p-8 max-w-xl">
      <Link href="/recurring" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Recurring
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Recurring Template</h1>
      <RecurringForm
        action={createRecurringTemplate}
        clients={clients ?? []}
        vendors={(vendors ?? []).map(v => ({ ...v, default_ewt_rate: Number(v.default_ewt_rate ?? 0) }))}
        categories={categories ?? []}
      />
    </div>
  )
}
