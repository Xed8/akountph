import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { ChevronLeft } from 'lucide-react'
import { StockMovementForm } from './stock-movement-form'
import { InventorySettingsForm } from './inventory-settings-form'

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, orgId } = await requireOrg()

  const [{ data: item }, { data: movements }] = await Promise.all([
    supabase
      .from('items')
      .select('id, name, unit, sale_price, cost_price, stock_qty, reorder_point, track_stock, category')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single(),

    supabase
      .from('stock_movements')
      .select('id, movement_date, type, quantity, unit_cost, reference, notes')
      .eq('item_id', id)
      .eq('organization_id', orgId)
      .order('movement_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (!item) notFound()

  const qty     = Number(item.stock_qty)
  const reorder = Number(item.reorder_point)
  const isLow   = item.track_stock && qty <= reorder && reorder > 0
  const isOut   = item.track_stock && qty === 0

  const totalIn  = (movements ?? []).filter(m => m.type === 'in').reduce((s, m) => s + Number(m.quantity), 0)
  const totalOut = (movements ?? []).filter(m => m.type === 'out').reduce((s, m) => s + Number(m.quantity), 0)

  return (
    <div className="p-8 space-y-6 pb-24 max-w-4xl">
      <Link href="/inventory" className="inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] transition-colors">
        <ChevronLeft className="w-4 h-4" /> Inventory
      </Link>

      {/* Item header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">{item.name}</h1>
          <p className="text-sm text-[#6B84A0] mt-1">
            {item.category ?? 'Uncategorized'}{item.unit ? ` · per ${item.unit}` : ''}
          </p>
        </div>
        {item.track_stock && (
          <div className="text-right">
            <p className="text-xs text-[#6B84A0] uppercase tracking-widest font-semibold">Current Stock</p>
            <p className={`text-3xl font-bold font-mono ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#0B1F3A]'}`}>
              {qty % 1 === 0 ? qty : qty.toFixed(4)} {item.unit ?? ''}
            </p>
            {isLow && !isOut && (
              <p className="text-xs text-amber-600 mt-0.5">⚠ Below reorder point ({reorder})</p>
            )}
            {isOut && (
              <p className="text-xs text-red-600 mt-0.5">✕ Out of stock</p>
            )}
          </div>
        )}
      </div>

      {/* Pricing + settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B84A0] mb-3">Pricing</p>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B84A0]">Cost price</span>
            <span className="font-mono font-semibold text-[#0B1F3A]">
              {item.cost_price > 0 ? centavosToDisplay(item.cost_price) : '—'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6B84A0]">Sale price</span>
            <span className="font-mono font-semibold text-[#0B1F3A]">{centavosToDisplay(item.sale_price)}</span>
          </div>
          {item.cost_price > 0 && (
            <div className="flex justify-between text-sm border-t border-[#EEF2F8] pt-2">
              <span className="text-[#6B84A0]">Margin</span>
              <span className="font-semibold text-[#00C48C]">
                {Math.round(((item.sale_price - item.cost_price) / item.sale_price) * 100)}%
              </span>
            </div>
          )}
        </div>

        {item.track_stock && (
          <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6B84A0] mb-3">Movement Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B84A0]">Total received</span>
              <span className="font-mono text-[#00C48C]">+{totalIn % 1 === 0 ? totalIn : totalIn.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#6B84A0]">Total issued</span>
              <span className="font-mono text-red-500">−{totalOut % 1 === 0 ? totalOut : totalOut.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-[#EEF2F8] pt-2">
              <span className="text-[#6B84A0]">Stock value</span>
              <span className="font-mono font-semibold text-[#0B1F3A]">
                {item.cost_price > 0 ? centavosToDisplay(qty * item.cost_price) : '—'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Inventory settings */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
          <p className="text-sm font-semibold text-[#0B1F3A]">Inventory Settings</p>
        </div>
        <div className="p-5">
          <InventorySettingsForm item={{ id: item.id, track_stock: item.track_stock, cost_price: item.cost_price, reorder_point: reorder }} />
        </div>
      </div>

      {/* Add movement */}
      {item.track_stock && (
        <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
            <p className="text-sm font-semibold text-[#0B1F3A]">Record Stock Movement</p>
          </div>
          <div className="p-5">
            <StockMovementForm itemId={item.id} />
          </div>
        </div>
      )}

      {/* Movement history */}
      {item.track_stock && (
        <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
            <p className="text-sm font-semibold text-[#0B1F3A]">Movement History</p>
          </div>
          {(movements ?? []).length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[#6B84A0]">No movements recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-[#D8E2EE] bg-[#F4F7FB]">
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Type</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Qty</th>
                    <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Unit Cost</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Reference</th>
                    <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {(movements ?? []).map(mv => {
                    const q = Number(mv.quantity)
                    return (
                      <tr key={mv.id} className="border-b border-[#EEF2F8] hover:bg-[#F4F7FB]">
                        <td className="px-4 py-2.5 text-[#3D5166] whitespace-nowrap">{mv.movement_date}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            mv.type === 'in' ? 'bg-[#E6FAF4] text-[#009E72]'
                            : mv.type === 'out' ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                          }`}>
                            {mv.type === 'in' ? 'Received' : mv.type === 'out' ? 'Issued' : 'Adjustment'}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-mono font-semibold ${mv.type === 'out' ? 'text-red-500' : 'text-[#00C48C]'}`}>
                          {mv.type === 'out' ? '−' : '+'}{q % 1 === 0 ? q : q.toFixed(4)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-[#6B84A0]">
                          {mv.unit_cost ? centavosToDisplay(mv.unit_cost) : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-[#6B84A0]">{mv.reference ?? '—'}</td>
                        <td className="px-4 py-2.5 text-[#6B84A0] text-xs">{mv.notes ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
