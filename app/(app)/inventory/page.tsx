import Link from 'next/link'
import { requireOrg } from '@/lib/auth/require-org'
import { centavosToDisplay } from '@/lib/formatting/currency'
import { Package, AlertTriangle, TrendingDown, Plus } from 'lucide-react'

export default async function InventoryPage() {
  const { supabase, orgId } = await requireOrg()

  const { data: items } = await supabase
    .from('items')
    .select('id, name, unit, sale_price, cost_price, stock_qty, reorder_point, track_stock, category')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .order('name')

  const allItems = items ?? []
  const tracked  = allItems.filter(i => i.track_stock)
  const lowStock = tracked.filter(i => Number(i.stock_qty) <= Number(i.reorder_point) && Number(i.reorder_point) > 0)
  const outOfStock = tracked.filter(i => Number(i.stock_qty) === 0)

  const totalStockValue = tracked.reduce((s, i) => s + (Number(i.stock_qty) * i.cost_price), 0)

  return (
    <div className="p-8 space-y-6 pb-24">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0B1F3A]">Inventory</h1>
          <p className="text-sm text-[#6B84A0] mt-1">Stock levels, movements, and reorder alerts</p>
        </div>
        <Link href="/items/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00C48C] text-white text-sm font-semibold hover:bg-[#009E72] transition-colors">
          <Plus className="w-4 h-4" /> Add Item
        </Link>
      </div>

      {/* Summary cards */}
      {tracked.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-[#D8E2EE] rounded-xl px-5 py-4">
            <p className="text-xs text-[#6B84A0] uppercase tracking-widest font-semibold mb-1">Stock Value</p>
            <p className="text-2xl font-bold font-mono text-[#0B1F3A]">{centavosToDisplay(totalStockValue)}</p>
            <p className="text-xs text-[#6B84A0] mt-1">At cost price</p>
          </div>
          <div className={`border rounded-xl px-5 py-4 ${lowStock.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#D8E2EE]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`w-3.5 h-3.5 ${lowStock.length > 0 ? 'text-amber-500' : 'text-[#6B84A0]'}`} />
              <p className="text-xs uppercase tracking-widest font-semibold text-[#6B84A0]">Low Stock</p>
            </div>
            <p className={`text-2xl font-bold ${lowStock.length > 0 ? 'text-amber-700' : 'text-[#0B1F3A]'}`}>{lowStock.length}</p>
            <p className="text-xs text-[#6B84A0] mt-1">Items at or below reorder point</p>
          </div>
          <div className={`border rounded-xl px-5 py-4 ${outOfStock.length > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#D8E2EE]'}`}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className={`w-3.5 h-3.5 ${outOfStock.length > 0 ? 'text-red-500' : 'text-[#6B84A0]'}`} />
              <p className="text-xs uppercase tracking-widest font-semibold text-[#6B84A0]">Out of Stock</p>
            </div>
            <p className={`text-2xl font-bold ${outOfStock.length > 0 ? 'text-red-600' : 'text-[#0B1F3A]'}`}>{outOfStock.length}</p>
            <p className="text-xs text-[#6B84A0] mt-1">Items with zero stock</p>
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="bg-white border border-[#D8E2EE] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#D8E2EE] bg-[#F4F7FB]">
          <p className="text-sm font-semibold text-[#0B1F3A]">
            {tracked.length > 0 ? `${tracked.length} of ${allItems.length} items tracked` : 'Product Catalog'}
          </p>
        </div>
        {allItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-8 h-8 mx-auto mb-3 text-[#D8E2EE]" />
            <p className="font-medium text-[#0B1F3A] mb-1">No items yet</p>
            <p className="text-sm text-[#6B84A0] mb-4">Add items from the catalog to start tracking stock.</p>
            <Link href="/items/new" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00C48C] text-white text-sm font-semibold hover:bg-[#009E72]">
              <Plus className="w-4 h-4" /> Add Item
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#D8E2EE] bg-[#F4F7FB]">
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Item</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Category</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Cost</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Sale Price</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Stock</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Reorder At</th>
                  <th className="text-center px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-[#6B84A0]">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {allItems.map(item => {
                  const qty = Number(item.stock_qty)
                  const reorder = Number(item.reorder_point)
                  const isLow = item.track_stock && qty <= reorder && reorder > 0
                  const isOut = item.track_stock && qty === 0
                  return (
                    <tr key={item.id} className="border-b border-[#EEF2F8] hover:bg-[#F4F7FB]">
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-[#0B1F3A]">{item.name}</p>
                        {item.unit && <p className="text-xs text-[#6B84A0]">per {item.unit}</p>}
                      </td>
                      <td className="px-4 py-2.5 text-[#6B84A0]">{item.category ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#3D5166]">
                        {item.cost_price > 0 ? centavosToDisplay(item.cost_price) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#0B1F3A]">{centavosToDisplay(item.sale_price)}</td>
                      <td className="px-4 py-2.5 text-right font-mono">
                        {item.track_stock
                          ? <span className={isOut ? 'text-red-600 font-bold' : isLow ? 'text-amber-600 font-semibold' : 'text-[#0B1F3A]'}>
                              {qty % 1 === 0 ? qty : qty.toFixed(2)}
                            </span>
                          : <span className="text-[#D8E2EE]">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[#6B84A0]">
                        {item.track_stock && reorder > 0
                          ? (reorder % 1 === 0 ? reorder : reorder.toFixed(2))
                          : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {!item.track_stock ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#F4F7FB] text-[#6B84A0] border border-[#D8E2EE]">Not tracked</span>
                        ) : isOut ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium">Out of stock</span>
                        ) : isLow ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium">Low stock</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E6FAF4] text-[#009E72] border border-[#B3EDD9] font-medium">In stock</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/inventory/${item.id}`}
                          className="text-xs text-[#00C48C] hover:text-[#009E72] font-medium hover:underline">
                          {item.track_stock ? 'Manage' : 'Enable'}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
