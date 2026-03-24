import { requireOrg } from '@/lib/auth/require-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgSettingsForm } from './org-settings-form'

export default async function SettingsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) return null

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your business details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>Used on payslips and BIR reports</CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSettingsForm org={org} />
        </CardContent>
      </Card>
    </div>
  )
}
