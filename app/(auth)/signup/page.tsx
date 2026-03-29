'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null)

  if ((state as { pending?: boolean } | null)?.pending) {
    return (
      <>
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-900/5 rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#E6FBF5] flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7 text-[#00C48C]" />
            </div>
            <CardTitle className="text-xl font-semibold text-slate-900 text-center">Check your email</CardTitle>
            <CardDescription className="text-slate-500 text-center">We sent a confirmation link to your email address.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Click the link in the email to confirm your account and get started.
            </p>
            <p className="text-xs text-slate-400 text-center">
              Check your spam folder if you don&apos;t see it within a minute.
            </p>
          </CardContent>
          <CardFooter className="justify-center pt-2">
            <Link href="/login" className="text-sm text-[#00C48C] hover:text-[#009E72] font-semibold hover:underline transition-colors">
              ← Back to sign in
            </Link>
          </CardFooter>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-900/5 rounded-2xl">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold text-slate-900">Create an account</CardTitle>
          <CardDescription className="text-slate-500">Start managing your payroll for free</CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-5">
            {(state as { error?: string } | null)?.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
                <Lock className="w-4 h-4 shrink-0" />
                <span>{(state as { error: string }).error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium text-slate-700">Full name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="full_name" 
                  name="full_name" 
                  type="text" 
                  autoComplete="name" 
                  required 
                  placeholder="Juan dela Cruz"
                  className="h-11 pl-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-[#00C48C] focus:ring-2 focus:ring-[#00C48C]/20 transition-all duration-200 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  autoComplete="email" 
                  required 
                  placeholder="you@example.com"
                  className="h-11 pl-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-[#00C48C] focus:ring-2 focus:ring-[#00C48C]/20 transition-all duration-200 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  autoComplete="new-password" 
                  required 
                  minLength={8} 
                  placeholder="At least 8 characters"
                  className="h-11 pl-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-[#00C48C] focus:ring-2 focus:ring-[#00C48C]/20 transition-all duration-200 rounded-xl"
                />
              </div>
              <p className="text-xs text-slate-400">Must be at least 8 characters long</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3.5 pt-2">
            <Button 
              type="submit" 
              className="h-11 w-full bg-[#00C48C] hover:bg-[#009E72] text-white font-medium rounded-xl shadow-lg shadow-[rgba(0,196,140,.25)] transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-lg" 
              disabled={pending}
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </Button>
            <p className="text-sm text-slate-500 text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-[#00C48C] hover:text-[#009E72] font-semibold hover:underline transition-colors">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  )
}