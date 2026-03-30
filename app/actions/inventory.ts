'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/auth/require-org'

export async function enableStockTracking(itemId: string, reorderPoint: number, costPrice: number) {
  const { supabase, orgId } = await requireOrg()

  await supabase
    .from('items')
    .update({ track_stock: true, reorder_point: reorderPoint, cost_price: costPrice })
    .eq('id', itemId)
    .eq('organization_id', orgId)

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
}

export async function addStockMovement(
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const itemId  = formData.get('item_id') as string
  const type    = formData.get('type') as 'in' | 'out' | 'adjustment'
  const qty     = parseFloat(formData.get('quantity') as string)
  const date    = formData.get('movement_date') as string
  const ref     = (formData.get('reference') as string) || null
  const notes   = (formData.get('notes') as string) || null
  const unitCostPesos = parseFloat((formData.get('unit_cost') as string) || '0')

  if (!qty || qty <= 0) return { error: 'Quantity must be greater than zero.' }

  const unitCostCentavos = Math.round(unitCostPesos * 100)

  const { error: mvErr } = await supabase
    .from('stock_movements')
    .insert({
      organization_id: orgId,
      item_id: itemId,
      movement_date: date,
      type,
      quantity: qty,
      unit_cost: type === 'in' ? unitCostCentavos : null,
      reference: ref,
      notes,
    })

  if (mvErr) return { error: mvErr.message }

  // Update stock_qty on items
  const delta = type === 'out' ? -qty : qty  // adjustment uses signed qty directly
  const { error: updateErr } = await supabase.rpc('adjust_item_stock', {
    p_item_id: itemId,
    p_delta: type === 'adjustment' ? qty - 0 : delta,  // for adjustment, replace? no — treat as +/-
  })

  // If RPC doesn't exist yet, fall back to manual update
  if (updateErr) {
    const { data: item } = await supabase
      .from('items')
      .select('stock_qty')
      .eq('id', itemId)
      .eq('organization_id', orgId)
      .single()

    if (item) {
      const newQty = Math.max(0, Number(item.stock_qty) + delta)
      await supabase
        .from('items')
        .update({ stock_qty: newQty })
        .eq('id', itemId)
        .eq('organization_id', orgId)
    }
  }

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  return null
}

export async function updateItemInventorySettings(
  prevState: { error: string } | null,
  formData: FormData
) {
  const { supabase, orgId } = await requireOrg()

  const itemId       = formData.get('item_id') as string
  const reorderPoint = parseFloat((formData.get('reorder_point') as string) || '0')
  const costPesos    = parseFloat((formData.get('cost_price') as string) || '0')
  const trackStock   = formData.get('track_stock') === 'true'

  await supabase
    .from('items')
    .update({
      track_stock: trackStock,
      reorder_point: reorderPoint,
      cost_price: Math.round(costPesos * 100),
    })
    .eq('id', itemId)
    .eq('organization_id', orgId)

  revalidatePath('/inventory')
  revalidatePath(`/inventory/${itemId}`)
  return null
}
