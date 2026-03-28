import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { ClientForm } from '@/components/client-form'
import { createClient } from '@/app/actions/clients'
import { ChevronLeft } from 'lucide-react'

export default async function NewClientPage() {
  await requireOrg()

  return (
    <div className="p-8">
      <Link href="/clients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Clients
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Client</h1>
      <ClientForm action={createClient} submitLabel="Add Client" />
    </div>
  )
}
