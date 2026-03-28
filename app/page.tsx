import Link from 'next/link'
import { CheckCircle2, Calculator, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">AkountPH</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <Badge variant="outline" className="mb-4">Built for Filipino businesses</Badge>
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          Payroll done right.<br />SSS, PhilHealth, Pag-IBIG — all computed automatically.
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
          Stop paying ₱3,000/month for an accountant just to do payroll math.
          AkountPH computes the exact government contributions and withholding tax for each employee — instantly.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/signup">
            <Button size="lg" className="px-8">Start for free</Button>
          </Link>
          <a href="mailto:hello@akountph.com?subject=Book a Demo" className="text-sm text-blue-600 hover:underline">
            Book a demo →
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">No credit card required. Free for up to 5 employees.</p>
      </section>

      {/* Pain → Solution */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            The monthly payroll headache — solved.
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <Calculator className="h-8 w-8 text-blue-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Correct contributions, every time</h3>
              <p className="text-sm text-gray-500">
                SSS, PhilHealth, Pag-IBIG, and TRAIN Law withholding tax computed per employee using the latest 2025 rates. No more manual bracket lookups.
              </p>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <FileText className="h-8 w-8 text-green-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Payslips in one click</h3>
              <p className="text-sm text-gray-500">
                Generate a complete PDF payslip for each employee — with all deductions, government IDs, and employer shares — ready to send or print.
              </p>
            </div>
            <div className="bg-white rounded-xl border p-6">
              <Clock className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Never miss a deadline</h3>
              <p className="text-sm text-gray-500">
                Your dashboard shows exactly what to remit, to which agency, and by when. Red means overdue. Amber means pay this week.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple pricing</h2>
          <p className="text-gray-500 mb-10">Less than what you pay an accountant per hour.</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="border rounded-xl p-6 text-left">
              <p className="text-sm font-medium text-gray-500 mb-1">Starter</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">Free</p>
              <p className="text-sm text-gray-400 mb-4">Up to 5 employees</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {['Payroll computation', 'PDF payslips', 'Remittance tracker', 'BIR alphalist CSV'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block">
                <Button variant="outline" className="w-full">Get started</Button>
              </Link>
            </div>
            <div className="border-2 border-blue-500 rounded-xl p-6 text-left relative">
              <Badge className="absolute top-4 right-4 text-xs">Popular</Badge>
              <p className="text-sm font-medium text-gray-500 mb-1">Business</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">₱499<span className="text-lg font-normal text-gray-400">/mo</span></p>
              <p className="text-sm text-gray-400 mb-4">Unlimited employees</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {[
                  'Everything in Starter',
                  'Unlimited employees',
                  'Priority support',
                  'Invoicing + AR (coming)',
                  'Expense tracking (coming)',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@akountph.com?subject=Book a Demo" className="block">
                <Button className="w-full">Book a demo</Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <span>© 2025 AkountPH</span>
          <span>Built for Philippine SMBs</span>
        </div>
      </footer>
    </div>
  )
}
