import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOrg } from '@/lib/auth/require-org'
import { updateEmployee, archiveEmployee } from '@/app/actions/employees'
import { EmployeeForm } from '@/components/employee-form'
import { ChevronLeft } from 'lucide-react'

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single()

  if (!employee) notFound()

  const updateWithId = updateEmployee.bind(null, id)

  return (
    <div className="p-8">
      <Link href="/employees" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Employees
      </Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {employee.first_name} {employee.last_name}
        </h1>
        <form action={archiveEmployee.bind(null, id)}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline"
            onClick={e => { if (!confirm('Archive this employee?')) e.preventDefault() }}
          >
            Archive
          </button>
        </form>
      </div>
      <EmployeeForm action={updateWithId} employee={employee} submitLabel="Save Changes" />
    </div>
  )
}
