import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserPlus, Search, Building, MoreHorizontal, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function EmployeesPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, employment_type, tax_status, monthly_basic_salary, status, date_hired')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('last_name')

  return (
    <div className="p-8 space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Directory</h1>
          <p className="text-gray-500 mt-1">
            Manage your employees and contractor data in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/employees/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2 gap-2">
            <UserPlus className="h-4 w-4" /> Add Employee
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
         {/* Could add a Search Input or Filters here for future */}
         <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-md shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search team members..." className="bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 w-64" disabled />
         </div>
         <div className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md text-sm font-medium border border-gray-200">
            {employees?.length ?? 0} {employees?.length === 1 ? 'Member' : 'Members'}
         </div>
      </div>

      {!employees?.length ? (
        <div className="border border-gray-200 rounded-lg bg-gray-50 border-dashed p-12 text-center h-[300px] flex flex-col items-center justify-center">
          <Building className="h-8 w-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">No team members yet</h3>
          <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">Add your first employee to start issuing payslips and tracking remittances.</p>
          <Link href="/employees/new" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-9 px-4 py-2">
            Add First Employee
          </Link>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-gray-50 border-b border-gray-200">
              <TableRow className="hover:bg-gray-50 border-none">
                <TableHead className="font-medium text-gray-500 text-xs h-10">Employee Details</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs">Role / Type</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs">Tax Status</TableHead>
                <TableHead className="text-right font-medium text-gray-500 text-xs">Monthly Fixed Structure</TableHead>
                <TableHead className="font-medium text-gray-500 text-xs text-center">Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100">
              {employees.map(emp => (
                <TableRow key={emp.id} className="hover:bg-gray-50 transition-colors border-none">
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                       </div>
                       <div>
                         <p className="font-medium text-gray-900 text-sm">
                           {emp.last_name}, {emp.first_name}
                         </p>
                         <p className="text-xs text-gray-500">ID: {emp.id.split('-')[0].toUpperCase()}</p>
                       </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <p className="font-medium text-gray-900 text-sm">{emp.position ?? '—'}</p>
                     <p className="capitalize text-xs text-gray-500">{emp.employment_type}</p>
                  </TableCell>
                  <TableCell>
                    <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[11px] font-medium px-2 py-0.5 rounded">
                      {emp.tax_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                     <p className="font-medium text-gray-900 text-sm">{centavosToDisplay(emp.monthly_basic_salary)}</p>
                     <p className="text-xs text-gray-500">Basic Monthly</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded font-medium capitalize", emp.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600")}>
                      {emp.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Link href={`/employees/${emp.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
