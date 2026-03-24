import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get their organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organizations(name)')
    .eq('user_id', user.id)
    .not('accepted_at', 'is', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  // If no org yet (new user), send to onboarding — but don't redirect from onboarding itself
  if (!membership) {
    redirect('/onboarding')
  }

  const orgs = membership.organizations as { name: string }[] | { name: string } | null
  const orgName = (Array.isArray(orgs) ? orgs[0]?.name : orgs?.name) ?? 'My Business'

  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={orgName} />
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
