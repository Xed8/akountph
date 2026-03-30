import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'
import { AddTransactionForm } from './add-transaction-form'
import { ReconcileButtons } from './reconcile-buttons'

interface SearchParams { filter?: string }

export default async function BankAccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  const { id } = await params
  const sp = await searchParams
  const filter = sp.filter ?? 'unreconciled'

  const { supabase, orgId } = await requireOrg()

  const [{ data: account }, { data: txRows }] = await Promise.all([
    supabase
      .from('bank_accounts')
      .select('id, account_name, bank_name, account_number, opening_balance, current_balance')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single(),

    supabase
      .from('bank_transactions')
      .select('id, transaction_date, description, reference, amount, type, is_reconciled, reconciled_at, notes')
      .eq('bank_account_id', id)
      .eq('organization_id', orgId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  if (!account) notFound()

  const allTx = txRows ?? []
  const unreconciled = allTx.filter(t => !t.is_reconciled)
  const reconciled   = allTx.filter(t => t.is_reconciled)
  const displayed    = filter === 'all' ? allTx : filter === 'reconciled' ? reconciled : unreconciled

  const unreconciledCredits = unreconciled.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const unreconciledDebits  = unreconciled.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  const FILTERS = [
    { key: 'unreconciled', label: `Unreconciled (${unreconciled.length})` },
    { key: 'reconciled',   label: `Reconciled (${reconciled.length})` },
    { key: 'all',          label: `All (${allTx.length})` },
  ]

  return (
    <div className="p-8 space-y-6 pb-24">
      <Link href="/bank" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Bank Accounts
      </Link>

      {/* Account header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">{account.account_name}</h1>
          <p className="text-sm text-[#6B84A0] mt-1">
            {account.bank_name}{account.account_number ? ` · ****${account.account_number.slice(-4)}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#6B84A0] uppercase tracking-widest font-semibold">Current Balance</p>
          <p className="text-3xl font-bold font-mono text-[#0B1F3A]">{centavosToDisplay(account.current_balance)}</p>
        </div>
      </div>

      {/* Summary strip */}
      {unreconciled.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6B84A0] mb-1">Unreconciled Credits</p>
            <p className="text-xl font-bold font-mono text-[#00C48C]">{centavosToDisplay(unreconciledCredits)}</p>
          </div>
          <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6B84A0] mb-1">Unreconciled Debits</p>
            <p className="text-xl font-bold font-mono text-red-600">{centavosToDisplay(unreconciledDebits)}</p>
          </div>
        </div>
      )}

      {/* Add transaction */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
          <p className="text-sm font-semibold text-[#0B1F3A]">Add Bank Statement Entry</p>
        </div>
        <div className="p-5">
          <AddTransactionForm bankAccountId={account.id} />
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB] flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm font-semibold text-[#0B1F3A]">Transactions</p>
          <div className="flex rounded-lg border border-[#D8E2EE] overflow-hidden">
            {FILTERS.map(f => (
              <Link key={f.key} href={`/bank/${id}?filter=${f.key}`}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === f.key ? 'bg-[#00C48C] text-white' : 'bg-white text-[#3D5166] hover:bg-[#F4F7FB]'}`}>
                {f.label}
              </Link>
            ))}
          </div>
        </div>

        {displayed.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-[#6B84A0] text-sm">
              {filter === 'unreconciled' ? 'All transactions are reconciled.' : 'No transactions yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#D8E2EE] bg-[#F4F7FB]">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Description</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Reference</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Debit</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Credit</th>
                  <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map(tx => (
                  <tr key={tx.id} className={`border-b border-[#EEF2F8] hover:bg-[#F4F7FB] ${tx.is_reconciled ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-2.5 text-[#3D5166] whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="px-4 py-2.5 text-[#0B1F3A] max-w-xs">
                      <p className="truncate">{tx.description}</p>
                      {tx.notes && <p className="text-xs text-[#6B84A0] truncate">{tx.notes}</p>}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#6B84A0]">{tx.reference ?? '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-red-600">
                      {tx.amount < 0 ? centavosToDisplay(Math.abs(tx.amount)) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[#00C48C]">
                      {tx.amount > 0 ? centavosToDisplay(tx.amount) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {tx.is_reconciled ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#E6FAF4] text-[#009E72] font-medium">Reconciled</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <ReconcileButtons
                        txId={tx.id}
                        bankAccountId={account.id}
                        isReconciled={tx.is_reconciled}
                        amount={tx.amount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
