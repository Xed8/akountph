import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireOrg } from '@/lib/auth/require-org'
import { VendorForm } from '@/components/vendor-form'
import { updateVendor, archiveVendor } from '@/app/actions/vendors'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditVendorPage({ params }: Props) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (!vendor) notFound()

  const boundUpdate = updateVendor.bind(null, id)
  const boundArchive = archiveVendor.bind(null, id)

  return (
    <div className="p-8 max-w-xl">
      <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Vendors
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Vendor</h1>
        <form action={boundArchive}>
          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
            Archive
          </Button>
        </form>
      </div>
      <VendorForm
        action={boundUpdate}
        vendor={{
          name: vendor.name,
          tin: vendor.tin,
          address: vendor.address,
          email: vendor.email,
          phone: vendor.phone,
          contact_person: vendor.contact_person,
          is_vat_registered: vendor.is_vat_registered,
          default_ewt_rate: Number(vendor.default_ewt_rate ?? 0),
          notes: vendor.notes,
        }}
        submitLabel="Save Changes"
      />
    </div>
  )
}
