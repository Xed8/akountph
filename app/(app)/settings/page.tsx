import { requireOrg } from '@/lib/auth/require-org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { OrgSettingsForm } from './org-settings-form'
import { Settings, Building2 } from 'lucide-react'

export default async function SettingsPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (!org) return null

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1">Organization Settings</h1>
          <p className="text-sm text-zinc-500">
            Manage your business profile, TIN, and global preferences.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <Card className="border border-zinc-200 shadow-sm rounded-lg overflow-hidden bg-white">
          <CardHeader className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-5">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-md bg-zinc-100 flex items-center justify-center border border-zinc-200">
                  <Building2 className="w-4 h-4 text-zinc-600" />
               </div>
               <div>
                  <CardTitle className="text-base font-semibold text-zinc-900">Business Information</CardTitle>
                  <CardDescription className="text-xs text-zinc-500 mt-0.5">This information appears on generated payslips and BIR tax forms.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <OrgSettingsForm org={org} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
