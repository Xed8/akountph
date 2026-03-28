import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Package } from 'lucide-react'

export default async function ItemsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: items } = await supabase
    .from('items')
    .select('id, name, description, unit, sale_price, is_vat_exempt, category')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-gray-500 mt-1">Items you can add to invoices.</p>
        </div>
        <Link href="/items/new">
          <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Item</Button>
        </Link>
      </div>

      {!items?.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <Package className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No items yet</p>
          <p className="text-sm text-gray-400 mb-4">Add products or services to speed up invoice creation.</p>
          <Link href="/items/new"><Button size="sm">Add first item</Button></Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Unit</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Price</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">VAT</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {item.name}
                    {item.description && <p className="text-xs text-gray-400 font-normal">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{centavosToDisplay(item.sale_price)}</td>
                  <td className="px-4 py-3 text-center">
                    {item.is_vat_exempt
                      ? <Badge variant="outline" className="text-xs">Exempt</Badge>
                      : <Badge variant="secondary" className="text-xs">12%</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/items/${item.id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
