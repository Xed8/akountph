import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#F4F7FB]">
      <Link href="/" className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm text-[#6B84A0] hover:text-[#0B1F3A] font-medium transition-colors z-10">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Link>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00C48C] shadow-lg shadow-[rgba(0,196,140,0.3)] mb-4">
            <span className="text-white font-extrabold text-xl">₱</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
            AkountPH
          </h1>
          <p className="text-sm text-[#6B84A0] mt-2 font-medium">Philippine payroll & accounting</p>
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  )
}
