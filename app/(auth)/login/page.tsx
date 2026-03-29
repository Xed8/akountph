'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null)

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-900/5 rounded-2xl">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold text-slate-900">Welcome back</CardTitle>
        <CardDescription className="text-slate-500">Sign in to your account to continue</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <Lock className="w-4 h-4 shrink-0" />
              <span>{state.error}</span>
            </div>
          )}
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
                autoComplete="current-password"
                required
                placeholder="Enter your password"
                className="h-11 pl-10 bg-slate-50/50 border-slate-200/60 focus:bg-white focus:border-[#00C48C] focus:ring-2 focus:ring-[#00C48C]/20 transition-all duration-200 rounded-xl"
              />
            </div>
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
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
          <p className="text-sm text-slate-500 text-center">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#00C48C] hover:text-[#009E72] font-semibold hover:underline transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
    </>
  )
}
