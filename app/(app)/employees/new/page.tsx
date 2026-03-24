import Link from 'next/link'
import { createEmployee } from '@/app/actions/employees'
import { EmployeeForm } from '@/components/employee-form'
import { ChevronLeft } from 'lucide-react'

export default function NewEmployeePage() {
  return (
    <div className="p-8">
      <Link href="/employees" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Employees
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Employee</h1>
      <EmployeeForm action={createEmployee} submitLabel="Add Employee" />
    </div>
  )
}
