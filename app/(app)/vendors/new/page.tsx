import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { VendorForm } from '@/components/vendor-form'
import { createVendor } from '@/app/actions/vendors'

export default function NewVendorPage() {
  return (
    <div className="p-8 max-w-xl">
      <Link href="/vendors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4" /> Vendors
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Vendor</h1>
      <VendorForm action={createVendor} submitLabel="Create Vendor" />
    </div>
  )
}
