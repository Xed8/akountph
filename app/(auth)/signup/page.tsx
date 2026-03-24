'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null)

  if ((state as { pending?: boolean } | null)?.pending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We sent a confirmation link to your email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Click the link in the email to confirm your account and get started.
            Check your spam folder if you don&apos;t see it within a minute.
          </p>
        </CardContent>
        <CardFooter>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>Start managing your payroll for free</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {(state as { error?: string } | null)?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {(state as { error: string }).error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" name="full_name" type="text" autoComplete="name" required placeholder="Juan dela Cruz" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="At least 8 characters" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </Button>
          <p className="text-sm text-gray-500 text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
