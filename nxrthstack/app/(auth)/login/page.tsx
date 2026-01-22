import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Icons } from "@/components/icons";

export const metadata = {
  title: "Sign In | NxrthStack Shop",
  description: "Sign in to access your purchases and downloads",
};

function LoginFormFallback() {
  return (
    <div className="flex items-center justify-center">
      <Icons.Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
