'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createInvoice } from '@/app/actions/invoices'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

interface Client { id: string; name: string; is_vat_registered: boolean }
interface CatalogItem { id: string; name: string; unit: string; sale_price: number; is_vat_exempt: boolean }

interface LineItem {
  description: string
  quantity: number
  unit_price: number    // pesos (display)
  total: number         // centavos
  is_vat_exempt: boolean
}

interface InvoiceFormProps {
  clients: Client[]
  items: CatalogItem[]
  orgVatRegistered: boolean
  defaultTerms: string
  defaultClientId?: string
}

const VAT_RATE = 0.12
const EWT_RATES = [
  { label: 'None (0%)', value: '0' },
  { label: 'Professional fees — 10%', value: '10' },
  { label: 'Professional fees (top rate) — 15%', value: '15' },
  { label: 'Contractor / subcontractor — 2%', value: '2' },
  { label: 'Rent — 5%', value: '5' },
]

// ATC codes for income (WI = Withholding on Income)
const ATC_INCOME = [
  { code: '',      label: '— None / Not applicable —' },
  { code: 'WI010', label: 'WI010 — Professional fees (individuals) 10%' },
  { code: 'WI011', label: 'WI011 — Professional fees (juridical) 15%' },
  { code: 'WI020', label: 'WI020 — Rental (real property) 5%' },
  { code: 'WI030', label: 'WI030 — Contractor / subcontractor 2%' },
  { code: 'WI040', label: 'WI040 — Commission (individual) 10%' },
  { code: 'WI050', label: 'WI050 — Income payments on purchases (goods) 1%' },
  { code: 'WI060', label: 'WI060 — Income payments on purchases (services) 2%' },
  { code: 'WI100', label: 'WI100 — Royalties (literary / musical / artistic) 10%' },
  { code: 'WI110', label: 'WI110 — Prizes / winnings exceeding ₱10,000' },
]

function toCentavos(pesos: number) { return Math.round(pesos * 100) }
function toPesos(centavos: number) { return centavos / 100 }

export function InvoiceForm({ clients, items: catalog, orgVatRegistered, defaultTerms, defaultClientId }: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const [lines, setLines] = useState<LineItem[]>([
    { description: '', quantity: 1, unit_price: 0, total: 0, is_vat_exempt: false },
  ])
  const [ewtRate, setEwtRate] = useState('0')
  const [atcCode, setAtcCode] = useState('')
  const [clientVat, setClientVat] = useState(false)

  // Totals
  const subtotalCentavos = lines.reduce((sum, l) => sum + l.total, 0)
  const vatableCentavos = lines.filter(l => !l.is_vat_exempt).reduce((sum, l) => sum + l.total, 0)
  const vatAmount = orgVatRegistered ? Math.round(vatableCentavos * VAT_RATE) : 0
  const totalBeforeEwt = subtotalCentavos + vatAmount
  const ewtAmount = Math.round(totalBeforeEwt * (parseFloat(ewtRate) / 100))
  const totalAmount = totalBeforeEwt - ewtAmount

  function updateLine(idx: number, field: keyof LineItem, value: string | number | boolean) {
    setLines(prev => prev.map((line, i) => {
      if (i !== idx) return line
      const updated = { ...line, [field]: value }
      if (field === 'quantity' || field === 'unit_price') {
        updated.total = toCentavos(Number(updated.quantity) * Number(updated.unit_price))
      }
      return updated
    }))
  }

  function addLine() {
    setLines(prev => [...prev, { description: '', quantity: 1, unit_price: 0, total: 0, is_vat_exempt: false }])
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  function fillFromCatalog(idx: number, itemId: string) {
    const item = catalog.find(c => c.id === itemId)
    if (!item) return
    setLines(prev => prev.map((line, i) => {
      if (i !== idx) return line
      const unitPrice = toPesos(item.sale_price)
      return {
        ...line,
        description: item.name,
        unit_price: unitPrice,
        total: toCentavos(line.quantity * unitPrice),
        is_vat_exempt: item.is_vat_exempt,
      }
    }))
  }

  function handleClientChange(clientId: string | null) {
    if (!clientId) return
    const client = clients.find(c => c.id === clientId)
    setClientVat(client?.is_vat_registered ?? false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (lines.length === 0 || lines.every(l => !l.description)) {
      setError('Add at least one line item.')
      return
    }

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    formData.set('line_items', JSON.stringify(lines))
    formData.set('ewt_rate', ewtRate)
    formData.set('atc_code', atcCode)

    startTransition(async () => {
      const result = await createInvoice(null, formData)
      if (result?.error) setError(result.error)
    })
  }

  const fmt = (c: number) => `₱${toPesos(c).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/invoices" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ChevronLeft className="h-4 w-4 mr-1" />Back to Invoices
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}

        {/* Header */}
        <Card>
          <CardHeader><CardTitle className="text-base">Invoice Details</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="client_id">Client</Label>
              <Select name="client_id" defaultValue={defaultClientId ?? undefined} onValueChange={v => handleClientChange(v)}>
                <SelectTrigger id="client_id"><SelectValue placeholder="Select client…" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="invoice_date">Invoice Date *</Label>
              <Input id="invoice_date" name="invoice_date" type="date" required defaultValue={today} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" name="due_date" type="date" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ewt_rate">EWT (Expanded Withholding Tax)</Label>
              <Select value={ewtRate} onValueChange={v => { if (v) setEwtRate(v) }}>
                <SelectTrigger id="ewt_rate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EWT_RATES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="atc_code">ATC (Alphanumeric Tax Code)</Label>
              <Select value={atcCode || '__none__'} onValueChange={v => setAtcCode(!v || v === '__none__' ? '' : v)}>
                <SelectTrigger id="atc_code"><SelectValue placeholder="— None / Not applicable —" /></SelectTrigger>
                <SelectContent>
                  {ATC_INCOME.map(a => (
                    <SelectItem key={a.code || '__none__'} value={a.code || '__none__'}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Required for 2307 / EWT filings</p>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Line Items</CardTitle>
            {catalog.length > 0 && (
              <p className="text-xs text-gray-400">Select from catalog to auto-fill a row</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {lines.map((line, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-5 space-y-1">
                  {catalog.length > 0 && (
                    <Select onValueChange={v => { if (typeof v === 'string') fillFromCatalog(idx, v) }}>
                      <SelectTrigger className="h-7 text-xs text-gray-400">
                        <SelectValue placeholder="Pick from catalog…" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalog.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Input
                    placeholder="Description *"
                    value={line.description}
                    onChange={e => updateLine(idx, 'description', e.target.value)}
                    required
                    minLength={1}
                    maxLength={500}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number" min="0.01" max="99999" step="0.01" placeholder="Qty"
                    value={line.quantity || ''}
                    onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    title="Enter a valid quantity greater than 0"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number" min="0" max="9999999.99" step="0.01" placeholder="Unit price"
                    value={line.unit_price || ''}
                    onChange={e => updateLine(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                    title="Enter a valid unit price"
                  />
                </div>
                <div className="col-span-2 flex items-center h-8 justify-end font-mono text-sm">
                  {fmt(line.total)}
                </div>
                <div className="col-span-1 flex items-center justify-center h-8">
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="col-span-12 flex items-center gap-2 -mt-1">
                  <input
                    type="checkbox"
                    id={`vat_exempt_${idx}`}
                    checked={line.is_vat_exempt}
                    onChange={e => updateLine(idx, 'is_vat_exempt', e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <label htmlFor={`vat_exempt_${idx}`} className="text-xs text-gray-400 cursor-pointer">
                    VAT-exempt line
                  </label>
                </div>
              </div>
            ))}

            <button type="button" onClick={addLine} className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mt-1">
              <Plus className="h-3.5 w-3.5" /> Add line
            </button>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="pt-4 space-y-2 max-w-xs ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-mono">{fmt(subtotalCentavos)}</span>
            </div>
            {orgVatRegistered && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (12%)</span>
                <span className="font-mono">{fmt(vatAmount)}</span>
              </div>
            )}
            {parseFloat(ewtRate) > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>EWT ({ewtRate}%) deducted</span>
                <span className="font-mono">−{fmt(ewtAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base border-t pt-2">
              <span>Total Due</span>
              <span className="font-mono">{fmt(totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes / Payment instructions</Label>
          <textarea
            id="notes" name="notes" rows={2}
            defaultValue={defaultTerms}
            maxLength={1000}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="px-8">
            {isPending ? 'Creating…' : 'Create Invoice'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/invoices')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
