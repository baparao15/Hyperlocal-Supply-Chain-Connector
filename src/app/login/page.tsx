export const dynamic = "force-dynamic";
"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { AppLogo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";
import { RoleBasedDemo } from "@/components/role-based-demo";

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<"farmer" | "restaurant" | "transporter">("farmer");

  return (
    <div className="container relative grid min-h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div
          className="absolute inset-0 bg-cover"
          style={{
            backgroundImage: "url(https://picsum.photos/seed/login/1200/900)",
          }}
        />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo />
            <span className="font-headline text-xl">
              Hyperlocal Supply Chain Connector
            </span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;This platform has revolutionized how I sell my crops.
              It&apos;s direct, fair, and incredibly easy to use.&rdquo;
            </p>
            <footer className="text-sm">A Happy Farmer</footer>
          </blockquote>
        </div>
      </div>

      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[600px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight font-headline">
              Welcome Back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <div className="space-y-6">
            <RoleBasedDemo selectedRole={selectedRole} />

            <Suspense fallback={<div>Loading form...</div>}>
              <AuthForm mode="login" onRoleChange={setSelectedRole} />
            </Suspense>

            <p className="px-8 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="underline underline-offset-4 hover:text-primary"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
