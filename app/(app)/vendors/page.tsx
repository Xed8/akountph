import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Truck } from 'lucide-react'

export default async function VendorsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, tin, email, phone, contact_person, is_vat_registered, default_ewt_rate')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')

  const list = vendors ?? []

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-500 mt-1">Manage your suppliers and their default tax settings.</p>
        </div>
        <Link href="/vendors/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Vendor
          </Button>
        </Link>
      </div>

      {!list.length ? (
        <div className="border rounded-xl border-dashed bg-gray-50/50 p-12 text-center">
          <Truck className="h-8 w-8 mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-700 mb-1">No vendors yet</p>
          <p className="text-sm text-gray-400 mb-4">Add a vendor to track your payables and tax deductions.</p>
          <Link href="/vendors/new">
            <Button size="sm">Add your first vendor</Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">TIN</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">VAT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Default EWT</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{vendor.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{vendor.tin ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {vendor.contact_person ?? vendor.email ?? vendor.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {vendor.is_vat_registered ? (
                      <Badge variant="secondary" className="text-xs">VAT</Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">Non-VAT</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {vendor.default_ewt_rate > 0 ? `${vendor.default_ewt_rate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/vendors/${vendor.id}`} className="text-blue-600 hover:underline text-xs">
                      Edit
                    </Link>
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
