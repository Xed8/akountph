import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>

      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#D8E2EE]">
        <div className="max-w-[1200px] mx-auto px-[5%] h-[68px] flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-extrabold text-xl text-[#0B1F3A]">
            <div className="w-8 h-8 bg-[#00C48C] rounded-lg flex items-center justify-center text-white font-extrabold text-[15px]">₱</div>
            AkountPH
          </div>
          <div className="hidden md:flex gap-7 text-sm font-medium text-[#3D5166]">
            <a href="#features" className="hover:text-[#00C48C] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#00C48C] transition-colors">Pricing</a>
            <a href="#compliance" className="hover:text-[#00C48C] transition-colors">BIR Compliance</a>
          </div>
          <div className="flex gap-2.5">
            <Link href="/login" className="px-5 py-[9px] rounded-lg border border-[#C4D3E4] text-sm font-semibold text-[#1A2B3C] hover:border-[#00C48C] hover:text-[#00C48C] transition-all">
              Log in
            </Link>
            <Link href="/signup" className="px-5 py-[9px] rounded-lg bg-[#00C48C] text-white text-sm font-semibold hover:bg-[#009E72] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(0,196,140,.3)]">
              Book a Demo
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-[5%] py-20 grid md:grid-cols-2 gap-[60px] items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-[#E6FBF5] text-[#009E72] text-xs font-bold px-3 py-[5px] rounded-full mb-5 uppercase tracking-wider">
            🇵🇭 Made for Philippine Businesses
          </div>
          <h1 className="text-[clamp(32px,4vw,52px)] font-extrabold leading-[1.15] text-[#0B1F3A] mb-5">
            Cloud Accounting<br />Built for <span className="text-[#00C48C]">PH Compliance</span>
          </h1>
          <p className="text-[17px] text-[#3D5166] leading-[1.7] mb-8 max-w-[480px]">
            BIR-ready reports, full payroll with SSS/PhilHealth/Pag-IBIG, integrated POS, and real-time financial visibility — all in one platform.
          </p>
          <div className="flex gap-3 flex-wrap items-center">
            <Link href="/signup" className="px-8 py-3.5 rounded-xl bg-[#00C48C] text-white text-base font-semibold hover:bg-[#009E72] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(0,196,140,.3)]">
              Book a Demo →
            </Link>
            <Link href="/login" className="px-8 py-3.5 rounded-xl border border-[#C4D3E4] text-base font-semibold text-[#1A2B3C] hover:border-[#00C48C] hover:text-[#00C48C] transition-all">
              View Demo Dashboard
            </Link>
          </div>
          <p className="text-[13px] text-[#6B84A0] mt-4">
            Schedule a live walkthrough · <span className="text-[#00C48C] font-semibold">BIR CAS-ready</span> · No commitment
          </p>
        </div>

        {/* Dashboard Mockup */}
        <div className="bg-[#0B1F3A] rounded-[20px] overflow-hidden shadow-[0_8px_40px_rgba(11,31,58,.14)]">
          <div className="bg-[#162e4d] px-4 py-2.5 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff6b6b]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#f5a623]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00c48c]" />
            <span className="ml-2 text-[11px] text-[#5a8ab0] font-mono">AkountPH — Dashboard</span>
          </div>
          <div className="p-[18px] grid grid-cols-2 gap-2.5">
            <div className="bg-[#1a3554] rounded-[10px] p-3.5 border border-[#254263]">
              <div className="text-[11px] text-[#7a9bbf] font-mono mb-1.5">Monthly Revenue</div>
              <div className="text-xl font-bold text-white">₱842,500</div>
              <div className="text-[11px] mt-0.5 text-[#00C48C]">↑ 12.4% vs last month</div>
            </div>
            <div className="bg-[#1a3554] rounded-[10px] p-3.5 border border-[#254263]">
              <div className="text-[11px] text-[#7a9bbf] font-mono mb-1.5">Outstanding AR</div>
              <div className="text-xl font-bold text-white">₱127,300</div>
              <div className="text-[11px] mt-0.5 text-[#F5A623]">↻ 3 invoices pending</div>
            </div>
            <div className="bg-[#1a3554] rounded-[10px] p-3.5 border border-[#254263]">
              <div className="text-[11px] text-[#7a9bbf] font-mono mb-1.5">Payroll This Month</div>
              <div className="text-xl font-bold text-white">₱243,800</div>
              <div className="text-[11px] mt-0.5 text-[#00C48C]">✓ BIR 2316 ready</div>
            </div>
            <div className="bg-[#1a3554] rounded-[10px] p-3.5 border border-[#254263]">
              <div className="text-[11px] text-[#7a9bbf] font-mono mb-1.5">VAT Payable</div>
              <div className="text-xl font-bold text-white">₱58,920</div>
              <div className="text-[11px] mt-0.5 text-[#ff6b6b]">⚠ Due in 8 days</div>
            </div>
            <div className="bg-[#1a3554] rounded-[10px] p-3.5 border border-[#254263] col-span-2">
              <div className="text-[11px] text-[#7a9bbf] font-mono mb-2.5">Sales — Last 8 Months</div>
              <div className="flex items-end gap-[5px] h-[50px]">
                {[42, 55, 48, 70, 63, 80, 72, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-[4px] transition-all" style={{ height: `${h}%`, background: i === 7 ? '#00C48C' : '#254263' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST STRIP */}
      <div id="compliance" className="border-t border-b border-[#D8E2EE] py-8 px-[5%] text-center">
        <p className="text-[13px] text-[#6B84A0] uppercase tracking-[.8px] font-semibold mb-4">Compliant with Philippine regulations</p>
        <div className="flex justify-center gap-4 flex-wrap">
          {['BIR CAS', 'SSS', 'PhilHealth', 'Pag-IBIG', 'TRAIN Law', 'VAT / NVAT', 'Withholding Tax'].map(tag => (
            <span key={tag} className="text-[13px] font-bold text-[#6B84A0] px-4 py-1.5 rounded-[6px] border border-[#D8E2EE] tracking-[.3px]">{tag}</span>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className="max-w-[1200px] mx-auto px-[5%] py-20">
        <div className="text-xs font-bold uppercase tracking-[1px] text-[#00C48C] mb-2.5">Full-Suite Modules</div>
        <h2 className="text-[clamp(24px,3vw,36px)] font-extrabold text-[#0B1F3A] mb-3 leading-[1.2]">
          Everything your business needs,<br />PH-compliant from day one
        </h2>
        <p className="text-base text-[#3D5166] max-w-[520px] leading-[1.7]">
          From barangay stores to multi-branch enterprises — AkountPH grows with you.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { icon: '📒', bg: '#E6FBF5', title: 'Chart of Accounts & General Ledger', desc: 'Philippine GAAP-ready COA templates. Automatic journal entries, trial balance, and multi-branch consolidation.', tag: 'GAAP Compliant', tagBg: '#E6FBF5', tagColor: '#009E72' },
            { icon: '📄', bg: '#EAF2FC', title: 'Accounts Payable & Receivable', desc: 'Invoice management, aging reports, BIR-format official receipts, and automated payment reminders.', tag: 'BIR OR Ready', tagBg: '#EAF2FC', tagColor: '#2D7DD2' },
            { icon: '👥', bg: '#FEF3DC', title: 'Payroll with Gov\'t Contributions', desc: 'Auto-compute SSS, PhilHealth, Pag-IBIG, withholding tax. Generate BIR Form 2316, 1601-C, payslips.', tag: 'BIR 2316 Auto', tagBg: '#FEF3DC', tagColor: '#b87b00' },
            { icon: '🖥️', bg: '#FDEAED', title: 'POS Integration & Sales', desc: 'Connect up to unlimited POS machines. Real-time sync, Z-readings, daily sales summary, and cash reconciliation.', tag: 'Multi-POS Ready', tagBg: '#FDEAED', tagColor: '#c0334a' },
            { icon: '📦', bg: '#F0F0FF', title: 'Inventory Management', desc: 'FIFO/LIFO/weighted average costing. Low stock alerts, stock transfer between branches, BIR inventory list.', tag: 'FIFO / LIFO', tagBg: '#F0F0FF', tagColor: '#5a4fcf' },
            { icon: '📊', bg: '#E6FBF5', title: 'BIR-Compliant Financial Reports', desc: 'One-click generation of BIR alphalist, VAT returns (2550M/Q), income tax returns (1701/1702), and audit files.', tag: 'e-Filing Ready', tagBg: '#E6FBF5', tagColor: '#009E72' },
          ].map(f => (
            <div key={f.title} className="bg-white border border-[#D8E2EE] rounded-[20px] p-7 hover:border-[#00C48C] hover:shadow-[0_4px_24px_rgba(0,196,140,.12)] hover:-translate-y-[3px] transition-all duration-200">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-4" style={{ background: f.bg }}>{f.icon}</div>
              <h3 className="text-base font-bold text-[#0B1F3A] mb-2">{f.title}</h3>
              <p className="text-sm text-[#3D5166] leading-[1.65]">{f.desc}</p>
              <span className="inline-block text-[11px] font-bold px-[9px] py-[3px] rounded-full mt-3 uppercase tracking-[.4px]" style={{ background: f.tagBg, color: f.tagColor }}>{f.tag}</span>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-[#F4F7FB] py-20">
        <div className="max-w-[1200px] mx-auto px-[5%]">
          <div className="text-xs font-bold uppercase tracking-[1px] text-[#00C48C] mb-2.5">Simple, Transparent Pricing</div>
          <h2 className="text-[clamp(24px,3vw,36px)] font-extrabold text-[#0B1F3A] mb-3 leading-[1.2]">Pay only for what you use</h2>
          <p className="text-base text-[#3D5166] max-w-[520px] leading-[1.7]">₱2,000/user/month · ₱2,000 per 5 POS machines/month · No hidden fees</p>
          <div className="grid md:grid-cols-3 gap-6 mt-12">

            {/* Starter */}
            <div className="bg-white border border-[#D8E2EE] rounded-[20px] p-8 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(11,31,58,.14)] transition-all duration-200">
              <div className="text-[14px] font-bold uppercase tracking-[.8px] text-[#6B84A0] mb-2">Starter</div>
              <div className="text-[40px] font-extrabold text-[#0B1F3A] leading-none">₱2,000 <span className="text-base font-medium text-[#6B84A0]">/mo per user</span></div>
              <p className="text-[13px] text-[#6B84A0] mt-2.5 mb-6 pb-6 border-b border-[#D8E2EE]">Perfect for freelancers and sole proprietors</p>
              <ul className="mb-7 space-y-0">
                {['1 user included', 'Chart of Accounts & GL', 'Accounts Payable & Receivable', 'BIR Financial Reports', 'Email support'].map(f => (
                  <li key={f} className="flex items-start gap-2 py-[7px] border-b border-[#EEF2F8] text-sm text-[#3D5166]">
                    <CheckCircle2 className="h-4 w-4 text-[#00C48C] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center py-3 rounded-lg border border-[#C4D3E4] text-sm font-semibold text-[#1A2B3C] hover:border-[#00C48C] hover:text-[#00C48C] transition-all">
                Get Started
              </Link>
            </div>

            {/* Business - Featured */}
            <div className="bg-white border-2 border-[#00C48C] rounded-[20px] p-8 shadow-[0_0_0_4px_rgba(0,196,140,.1)] hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(11,31,58,.14)] transition-all duration-200 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#00C48C] text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-[.5px] whitespace-nowrap">Most Popular</div>
              <div className="text-[14px] font-bold uppercase tracking-[.8px] text-[#6B84A0] mb-2">Business</div>
              <div className="text-[40px] font-extrabold text-[#0B1F3A] leading-none">₱2,000 <span className="text-base font-medium text-[#6B84A0]">/mo per user</span></div>
              <p className="text-[13px] text-[#6B84A0] mt-2.5 mb-6 pb-6 border-b border-[#D8E2EE]">For growing SMEs with staff and POS</p>
              <ul className="mb-7 space-y-0">
                {['Unlimited users (₱2,000 each)', 'All Starter features', 'Full Payroll (SSS/PhilHealth/Pag-IBIG)', 'Inventory Management', 'POS Integration — ₱2,000/5 machines', 'BIR alphalist & e-Filing', 'Priority support'].map(f => (
                  <li key={f} className="flex items-start gap-2 py-[7px] border-b border-[#EEF2F8] text-sm text-[#3D5166]">
                    <CheckCircle2 className="h-4 w-4 text-[#00C48C] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block w-full text-center py-3 rounded-lg bg-[#00C48C] text-white text-sm font-semibold hover:bg-[#009E72] transition-all">
                Book a Demo →
              </Link>
              <p className="text-[12px] text-[#6B84A0] text-center mt-3">Live walkthrough with our team</p>
            </div>

            {/* Enterprise */}
            <div className="bg-white border border-[#D8E2EE] rounded-[20px] p-8 hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(11,31,58,.14)] transition-all duration-200">
              <div className="text-[14px] font-bold uppercase tracking-[.8px] text-[#6B84A0] mb-2">Enterprise</div>
              <div className="text-[40px] font-extrabold text-[#0B1F3A] leading-none">Custom</div>
              <p className="text-[13px] text-[#6B84A0] mt-2.5 mb-6 pb-6 border-b border-[#D8E2EE]">For corporations and multi-branch operations</p>
              <ul className="mb-7 space-y-0">
                {['Everything in Business', 'Multi-branch consolidation', 'Custom COA templates', 'Dedicated account manager', 'On-site training', 'SLA guarantee'].map(f => (
                  <li key={f} className="flex items-start gap-2 py-[7px] border-b border-[#EEF2F8] text-sm text-[#3D5166]">
                    <CheckCircle2 className="h-4 w-4 text-[#00C48C] shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@akountph.com?subject=Enterprise Inquiry" className="block w-full text-center py-3 rounded-lg bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#1a3554] transition-all">
                Contact Sales
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <div className="bg-[#0B1F3A] py-20 px-[5%] text-center">
        <h2 className="text-[clamp(24px,3vw,38px)] font-extrabold text-white mb-3.5">See AkountPH in action — book a demo</h2>
        <p className="text-base text-[#7a9bbf] mb-8">Get a live walkthrough with our team. BIR-compliant from day one.</p>
        <Link href="/signup" className="inline-block px-8 py-3.5 rounded-xl bg-[#00C48C] text-white text-base font-semibold hover:bg-[#009E72] transition-all hover:-translate-y-px shadow-[0_4px_14px_rgba(0,196,140,.3)]">
          Book a Demo →
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#0a1b30] px-[5%] py-8 flex justify-between items-center flex-wrap gap-3">
        <div>
          <div className="text-lg font-extrabold text-white">AkountPH</div>
          <div className="text-[12px] text-[#3a5a7a] mt-1">Cloud Accounting for Philippine Businesses</div>
        </div>
        <div className="flex gap-6 text-[13px] text-[#5a7a9a]">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">BIR Compliance</a>
          <a href="#" className="hover:text-white transition-colors">Help Center</a>
        </div>
      </footer>

    </div>
  )
}
