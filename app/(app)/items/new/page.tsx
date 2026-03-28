import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { ItemForm } from '@/components/item-form'
import { createItem } from '@/app/actions/items'
import { ChevronLeft } from 'lucide-react'

export default async function NewItemPage() {
  await requireOrg()
  return (
    <div className="p-8">
      <Link href="/items" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Items
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Item</h1>
      <ItemForm action={createItem} submitLabel="Add Item" />
    </div>
  )
}
