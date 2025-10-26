'use client';

import Link from 'next/link';
import { AppLogo } from '@/components/logo';
import { AuthForm } from '@/components/auth-form';

export default function SignupPage() {

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage:
              'url(https://picsum.photos/seed/signup/1200/900)',
          }}
        />
        <div className="relative z-20 flex items-center text-lg font-medium">
           <Link href="/" className="flex items-center gap-2">
            <AppLogo />
            <span className="font-headline text-xl">Hyperlocal Supply Chain Connector</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Finding fresh, local ingredients has never been easier. My
              menu has improved, and my customers are happier.&rdquo;
            </p>
            <footer className="text-sm">A Restaurant Owner</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight font-headline">
              Create an account
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose your role and enter your details to get started.
            </p>
          </div>
          
          <div className="space-y-6">
            <AuthForm mode="signup" />
            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Log In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
