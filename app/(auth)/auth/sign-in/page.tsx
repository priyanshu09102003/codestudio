import SignInFormClient from '@/features/auth/components/SignInFormClient'
import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In to CodeStudio',
  description: 'Sign in to your CodeStudio account with Google or GitHub',
}

const SignInPage = () => {
  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4'>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className='relative'>
        <SignInFormClient/>
      </div>
    </div>
  )
}

export default SignInPage