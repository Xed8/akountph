import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserPlus } from 'lucide-react'

export default async function EmployeesPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position, employment_type, tax_status, monthly_basic_salary, status, date_hired')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('last_name')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">{employees?.length ?? 0} total</p>
        </div>
        <Link href="/employees/new">
          <Button><UserPlus className="h-4 w-4 mr-2" />Add employee</Button>
        </Link>
      </div>

      {!employees?.length ? (
        <div className="border border-dashed rounded-lg flex flex-col items-center justify-center py-16 text-center">
          <UserPlus className="h-10 w-10 text-gray-300 mb-4" />
          <p className="font-medium text-gray-700">No employees yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your first employee to start running payroll.</p>
          <Link href="/employees/new"><Button>Add employee</Button></Link>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tax Status</TableHead>
                <TableHead className="text-right">Monthly Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">
                    {emp.last_name}, {emp.first_name}
                  </TableCell>
                  <TableCell className="text-gray-500">{emp.position ?? '—'}</TableCell>
                  <TableCell className="capitalize text-gray-500">{emp.employment_type}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{emp.tax_status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {centavosToDisplay(emp.monthly_basic_salary)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                      {emp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/employees/${emp.id}`} className="text-sm text-blue-600 hover:underline">
                      Edit
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
