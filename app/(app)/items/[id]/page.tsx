import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { updateItem, archiveItem } from '@/app/actions/items'
import { ItemForm } from '@/components/item-form'
import { ChevronLeft } from 'lucide-react'
import { ConfirmButton } from '@/components/confirm-button'

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (!item) notFound()

  const updateWithId = updateItem.bind(null, id)

  return (
    <div className="p-8">
      <Link href="/items" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Items
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
        <form action={archiveItem.bind(null, id)}>
          <ConfirmButton message="Archive this item?" className="text-sm text-red-600 hover:underline">
            Archive
          </ConfirmButton>
        </form>
      </div>
      <ItemForm action={updateWithId} item={item} submitLabel="Save Changes" />
    </div>
  )
}
