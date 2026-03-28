import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireOrg } from '@/lib/auth/require-org'
import { BillForm } from '@/components/bill-form'
import { createBill } from '@/app/actions/bills'

export default async function NewBillPage() {
  const { supabase, orgId } = await requireOrg()

  const [{ data: vendors }, { data: categories }] = await Promise.all([
    supabase
      .from('vendors')
      .select('id, name, default_ewt_rate')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('expense_categories')
      .select('id, name, type')
      .eq('organization_id', orgId)
      .order('name'),
  ])

  return (
    <div className="p-8 max-w-xl">
      <Link href="/bills" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Bills
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Bill</h1>
      <BillForm
        action={createBill}
        vendors={(vendors ?? []).map(v => ({ ...v, default_ewt_rate: Number(v.default_ewt_rate ?? 0) }))}
        categories={categories ?? []}
      />
    </div>
  )
}
