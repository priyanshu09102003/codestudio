import React from 'react'
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Chrome, Github } from "lucide-react";
import Image from 'next/image';
import { signIn } from '@/auth';


async function handleGoogleSignIn(){
    "use server";
    await signIn("google");
}

async function handleGithubSignIn(){
    "use server";
    await signIn("github");
}

const SignInFormClient = () => {
  return (
    <Card className='w-full max-w-lg backdrop-blur-xl bg-slate-800/95 border-slate-700/60 shadow-2xl'>
      
        <div className="flex flex-col items-center pt-10 pb-8">
          <div className="relative w-20 h-20 mb-4">
            <Image 
              src="/logo.svg" 
              alt="CodeSwift Logo" 
              width={80} 
              height={80}
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">CodeSwift</h1>
          <p className="text-base text-slate-400 font-bold">CodeStudio</p>
        </div>

        <CardHeader className='space-y-2 pb-8 pt-0'>
            <CardTitle className='text-2xl font-bold text-center text-white'>Welcome Back</CardTitle>
            <CardDescription className='text-center text-slate-400 text-base'>
                Choose your preferred sign-in method
            </CardDescription>
        </CardHeader>

         <CardContent className='grid gap-4 pb-8 px-8'>
            <form action={handleGoogleSignIn}>
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full h-14 bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 text-white hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base font-medium cursor-pointer"
              >
                  <Chrome className="mr-3 h-5 w-5" />
                  <span>Sign in with Google</span>
              </Button>
            </form>

            <form action={handleGithubSignIn}>
              <Button 
                type="submit" 
                variant="outline" 
                className="w-full h-14 bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 text-white hover:text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-base font-medium cursor-pointer"
              >
                  <Github className="mr-3 h-5 w-5" />
                  <span>Sign in with GitHub</span>
              </Button>
            </form>
        </CardContent>

         <CardFooter className="pb-8">
            <p className="text-sm text-center text-slate-400 w-full leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  Privacy Policy
              </a>
              .
            </p>
         </CardFooter>
    </Card>
  )
}

export default SignInFormClient