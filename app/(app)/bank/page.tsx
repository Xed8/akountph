import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Plus, Landmark, ArrowRight } from 'lucide-react'
import { NewBankAccountForm } from './new-account-form'

export default async function BankPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: accounts } = await supabase
    .from('bank_accounts')
    .select('id, account_name, bank_name, account_number, opening_balance, current_balance, is_active')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const allAccounts = accounts ?? []
  const totalBalance = allAccounts.reduce((s, a) => s + a.current_balance, 0)

  return (
    <div className="p-8 space-y-6 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Bank Reconciliation</h1>
          <p className="text-sm text-[#6B84A0] mt-1">Track bank accounts and match transactions to system records</p>
        </div>
      </div>

      {/* Total balance summary */}
      {allAccounts.length > 0 && (
        <div className="bg-[#0B1F3A] rounded-xl px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#7a9bbf] uppercase tracking-widest font-semibold mb-1">Total Bank Balance</p>
            <p className="text-3xl font-bold text-white font-mono">{centavosToDisplay(totalBalance)}</p>
          </div>
          <Landmark className="w-10 h-10 text-[#00C48C] opacity-60" />
        </div>
      )}

      {/* Account cards */}
      {allAccounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allAccounts.map(acct => (
            <Link key={acct.id} href={`/bank/${acct.id}`}
              className="bg-white border border-[#D8E2EE] rounded-xl p-5 hover:border-[#00C48C] hover:shadow-sm transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-[#0B1F3A]">{acct.account_name}</p>
                  <p className="text-xs text-[#6B84A0] mt-0.5">{acct.bank_name}{acct.account_number ? ` · ****${acct.account_number.slice(-4)}` : ''}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#D8E2EE] group-hover:text-[#00C48C] transition-colors mt-1" />
              </div>
              <p className="text-2xl font-bold font-mono text-[#0B1F3A]">{centavosToDisplay(acct.current_balance)}</p>
              <p className="text-xs text-[#6B84A0] mt-1">Opening: {centavosToDisplay(acct.opening_balance)}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Add account form */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D8E2EE] bg-[#F4F7FB] flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#00C48C]" />
          <p className="text-sm font-semibold text-[#0B1F3A]">Add Bank Account</p>
        </div>
        <div className="p-5">
          <NewBankAccountForm />
        </div>
      </div>
    </div>
  )
}
